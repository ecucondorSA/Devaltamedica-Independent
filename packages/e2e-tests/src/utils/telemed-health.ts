// TODO: Replace with proper logger import when available
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, error?: unknown) => console.error(`[ERROR] ${message}`, error || ''),
  warn: (message: string) => console.warn(`[WARN] ${message}`)
};
/**
 * Telemed Infrastructure Health Check Utilities
 * Ensures required services are running before executing WebRTC tests
 */

export interface HealthTarget {
  name: string;
  url: string;
  required: boolean;
  timeout?: number;
}

export interface HealthResult extends HealthTarget {
  ok: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Check if telemedicine infrastructure is ready
 * Fails fast if required services are not available
 */
export async function assertTelemedInfraReady(): Promise<HealthResult[]> {
  const targets: HealthTarget[] = [
    {
      name: 'signaling-server',
      url: 'http://localhost:8888/health',
      required: true,
      timeout: 3000,
    },
    {
      name: 'api-server',
      url: 'http://localhost:3001/api/v1/health',
      required: true,
      timeout: 3000,
    },
    {
      name: 'stun-turn',
      url: 'http://localhost:3478/health',
      required: false,
      timeout: 1000,
    },
  ];

  const results = await Promise.all(
    targets.map(async (target): Promise<HealthResult> => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), target.timeout || 3000);

        const response = await fetch(target.url, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return {
          ...target,
          ok: response.ok,
          statusCode: response.status,
          responseTime: Date.now() - start,
        };
      } catch (error) {
        return {
          ...target,
          ok: false,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  );

  // Check for missing required services
  const missing = results.filter((r) => !r.ok && r.required);

  if (missing.length > 0) {
    const missingNames = missing.map((m) => m.name).join(', ');
    const details = missing
      .map((m) => `  - ${m.name}: ${m.error || `HTTP ${m.statusCode || 'no response'}`}`)
      .join('\n');

    throw new Error(
      `🔴 Telemed infrastructure check failed!\n` +
      `Missing required services: ${missingNames}\n` +
      `Details:\n${details}\n\n` +
      `💡 Solutions:\n` +
      `  1. Start services: docker compose up -d signaling-server api-server\n` +
      `  2. Use mock mode: E2E_WEBRTC_MOCK=1 npm test\n` +
      `  3. Skip WebRTC tests: npm test -- -g "@telemedicine @standalone"`,
    );
  }

  // Log health status
  logger.info('✅ Telemed infrastructure ready:');
  results.forEach((r) => {
    const status = r.ok ? '✓' : r.required ? '✗' : '○';
    const time = r.responseTime ? `(${r.responseTime}ms)` : '';
    logger.info(`  ${status} ${r.name} ${time}`);
  });

  return results;
}

/**
 * Adaptive wait for test elements with exponential backoff
 */
export async function waitForTestId(
  page: import('@playwright/test').Page,
  testId: string,
  options: {
    totalMs?: number;
    initialStepMs?: number;
    maxStepMs?: number;
    debug?: boolean;
  } = {},
) {
  const { totalMs = 15000, initialStepMs = 500, maxStepMs = 2000, debug = false } = options;

  const start = Date.now();
  let stepMs = initialStepMs;
  let attempts = 0;

  while (Date.now() - start < totalMs) {
    attempts++;

    try {
      const element = page.getByTestId(testId);
      const count = await element.count();

      if (count > 0) {
        if (debug) {
          logger.info(`✓ Found ${testId} after ${attempts} attempts (${Date.now() - start}ms)`);
        }
        return element;
      }
    } catch (_e) {
      // Element not ready yet
    }

    await page.waitForTimeout(stepMs);
    stepMs = Math.min(stepMs * 1.5, maxStepMs);
  }

  throw new Error(
    `⏱️ Timeout waiting for element: data-testid="${testId}"\n` +
    `  Waited: ${totalMs}ms over ${attempts} attempts\n` +
    `  Consider:\n` +
    `    - Is the element rendered conditionally?\n` +
    `    - Are required services running?\n` +
    `    - Check browser console for errors`,
  );
}

/**
 * Check if we're in mock mode
 */
export function isWebRTCMockMode(): boolean {
  return process.env.E2E_WEBRTC_MOCK === '1' || process.env.E2E_WEBRTC_MOCK === 'true';
}

/**
 * Setup mock WebRTC environment
 */
export async function setupWebRTCMock(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    // Flag for app to detect mock mode
    (window as any).__WEBRTC_MOCK__ = true;
    // Mock getUserMedia
    const mockStream = new MediaStream();
    const mockTrack: MediaStreamTrack = {
      kind: 'video',
      id: 'mock-video-track',
      enabled: true,
      readyState: 'live',
      stop: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
    } as any;
    Object.defineProperty(mockStream, 'getTracks', {
      value: () => [mockTrack],
    });
    (navigator.mediaDevices as any).getUserMedia = async () => mockStream;
    // Mock RTCPeerConnection
    const mockPeerConnection: RTCPeerConnection = {
      localDescription: null,
      remoteDescription: null,
      connectionState: 'connected',
      iceConnectionState: 'connected',
      createOffer: async () => ({ type: 'offer', sdp: 'mock-sdp' }) as RTCSessionDescriptionInit,
      createAnswer: async () => ({ type: 'answer', sdp: 'mock-sdp' }) as RTCSessionDescriptionInit,
      setLocalDescription: async () => { },
      setRemoteDescription: async () => { },
      addTrack: () => ({}) as RTCRtpSender,
      addEventListener: () => { },
      removeEventListener: () => { },
      close: () => { },
    } as any;
    (window as any).RTCPeerConnection = function () {
      return mockPeerConnection;
    } as any;
    logger.info('🎭 WebRTC Mock Mode Activated');
  });
}

/**
 * Get infrastructure health summary for reporting
 */
export async function getInfraHealthSummary(): Promise<{
  healthy: boolean;
  services: HealthResult[];
  recommendations: string[];
}> {
  let services: HealthResult[] = [];
  let healthy = true;
  const recommendations: string[] = [];

  try {
    services = await assertTelemedInfraReady();
  } catch (error: unknown) {
    healthy = false;
    const typedError = error as { services?: HealthResult[] } | undefined;
    if (typedError?.services) {
      services = typedError.services;
    }
    // Generate recommendations based on failures
    if (services.some((s) => s.name === 'signaling-server' && !s.ok)) {
      recommendations.push('Start signaling server: docker compose up -d signaling-server');
    }
    if (services.some((s) => s.name === 'api-server' && !s.ok)) {
      recommendations.push('Start API server: docker compose up -d api-server');
    }
  }

  if (!healthy && recommendations.length === 0) {
    recommendations.push('Use mock mode for testing: E2E_WEBRTC_MOCK=1 npm test');
  }

  return { healthy, services, recommendations };
}
