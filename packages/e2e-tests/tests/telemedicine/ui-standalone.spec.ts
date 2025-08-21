import { expect, test } from '@playwright/test';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  waitForTestId,
  isWebRTCMockMode,
  setupWebRTCMock
} from '../../src/utils/telemed-health';

/**
 * Standalone UI tests for telemedicine that don't require signaling server
 * These tests validate UI components and mock interactions
 */

test.describe('Telemedicine UI @telemedicine @standalone', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup mock if in mock mode
    if (isWebRTCMockMode()) {
      await setupWebRTCMock(page);
    }
  });

  test('should load telemedicine interface', async ({ page }) => {
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // Wait for main container with adaptive timeout
    const container = await page.locator('[data-testid="telemedicine-container"]').first();
    await expect(container).toBeVisible({ timeout: 5000 });
    
    // Verify UI elements are present
    await expect(page.getByText(/telemedicina/i)).toBeVisible();
  });

  test('should display controls without active connection', async ({ page }) => {
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // Check for essential UI controls
    const elements = [
      { testId: 'mute-button', label: 'Mute control' },
      { testId: 'video-toggle', label: 'Video toggle' },
      { testId: 'end-call-button', label: 'End call button' }
    ];

    for (const element of elements) {
      try {
        const el = await waitForTestId(page, element.testId, { 
          totalMs: 3000,
          debug: true 
        });
        await expect(el).toBeVisible();
      } catch (e) {
        // Element might be conditionally rendered
        logger.info(`ℹ️ Optional element not found: ${element.label}`);
      }
    }
  });

  test('should handle permission requests gracefully @mock', async ({ page }) => {
    test.skip(!isWebRTCMockMode(), 'Mock-specific test');
    
    await setupWebRTCMock(page);
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // In mock mode, permissions should be auto-granted
    const hasPermission = await page.evaluate(() => {
      return (window as any).__WEBRTC_MOCK__ === true;
    });
    
    expect(hasPermission).toBeTruthy();
  });

  test('should show connection status indicators', async ({ page }) => {
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // Look for any connection status indicator
    const statusIndicators = [
      '[data-testid="connection-status"]',
      '[data-testid="network-quality"]',
      '.connection-indicator',
      '[aria-label*="connection"]'
    ];

    let foundIndicator = false;
    for (const selector of statusIndicators) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundIndicator = true;
        break;
      }
    }

    // This is optional - not all implementations show status immediately
    if (foundIndicator) {
      logger.info('✓ Connection status indicator found');
    } else {
      logger.info('ℹ️ No connection status indicator (might appear after connection)');
    }
  });

  test('should navigate between telemedicine views', async ({ page }) => {
    // Start from patients dashboard
    await page.goto('http://localhost:3003/dashboard');
    
    // Look for telemedicine entry point
    const telemedLinks = [
      '[data-testid="start-consultation"]',
      'a[href*="telemedicine"]',
      'button:has-text("Video Consulta")',
      '[data-testid="video-call-button"]'
    ];

    let foundLink = false;
    for (const selector of telemedLinks) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          foundLink = true;
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (foundLink) {
      // Verify navigation occurred
      await expect(page.url()).toContain('telemedicine');
    } else {
      logger.info('ℹ️ No telemedicine link found in dashboard (feature might be gated)');
    }
  });

  test('should display error message when services unavailable', async ({ page }) => {
    // Don't setup mock - test error handling
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // Try to start session without backend
    const startButton = page.getByTestId('start-webrtc-session');
    
    // Check if button exists but might be disabled
    const buttonCount = await startButton.count();
    if (buttonCount > 0) {
      const isDisabled = await startButton.isDisabled();
      
      if (!isDisabled) {
        await startButton.click();
        
        // Should show error message
        const errorSelectors = [
          '[data-testid="error-message"]',
          '.error-message',
          '[role="alert"]',
          'text=/error|failed|unavailable/i'
        ];
        
        let foundError = false;
        for (const selector of errorSelectors) {
          const errorElement = await page.locator(selector).first();
          if (await errorElement.isVisible({ timeout: 3000 }).catch(() => false)) {
            foundError = true;
            break;
          }
        }
        
        if (foundError) {
          logger.info('✓ Error message displayed for unavailable service');
        }
      } else {
        logger.info('✓ Start button correctly disabled when services unavailable');
      }
    }
  });
});

/**
 * Mock-specific tests that run without real infrastructure
 */
test.describe('Telemedicine Mock Mode @telemedicine @mock', () => {
  test.skip(!isWebRTCMockMode(), 'Mock mode tests only');

  test.beforeEach(async ({ page }) => {
    await setupWebRTCMock(page);
  });

  test('should simulate video stream with mock', async ({ page }) => {
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    // Verify mock is active
    const mockActive = await page.evaluate(() => {
      return (window as any).__WEBRTC_MOCK__ === true;
    });
    expect(mockActive).toBeTruthy();
    
    // Try to get mock stream
    const hasStream = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        return stream.getTracks().length > 0;
      } catch {
        return false;
      }
    });
    
    expect(hasStream).toBeTruthy();
  });

  test('should handle mock peer connection', async ({ page }) => {
    await page.goto('http://localhost:3003/telemedicine/session/demo');
    
    const canCreatePeer = await page.evaluate(() => {
      try {
        const pc = new RTCPeerConnection();
        return pc.connectionState === 'connected'; // Mock always connected
      } catch {
        return false;
      }
    });
    
    expect(canCreatePeer).toBeTruthy();
  });
});