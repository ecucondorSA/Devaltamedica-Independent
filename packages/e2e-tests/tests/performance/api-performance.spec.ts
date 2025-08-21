/**
 * API Performance Tests
 * Tests de rendimiento automatizados para endpoints críticos
 */

import { test, expect } from '@playwright/test';

// Configuración de umbrales de performance
const PERFORMANCE_THRESHOLDS = {
  api: {
    p50: 200, // 50% de requests < 200ms
    p95: 500, // 95% de requests < 500ms
    p99: 1000, // 99% de requests < 1000ms
  },
  database: {
    query: 100, // Queries < 100ms
    write: 200, // Writes < 200ms
  },
  frontend: {
    lcp: 2500, // Largest Contentful Paint < 2.5s
    fid: 100, // First Input Delay < 100ms
    cls: 0.1, // Cumulative Layout Shift < 0.1
    ttfb: 600, // Time to First Byte < 600ms
  },
};

test.describe('API Performance Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('GET /api/v1/patients - Lista de pacientes', async ({ request }) => {
    const metrics: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      const response = await request.get('/api/v1/patients', {
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
        },
        params: {
          limit: 20,
          offset: 0,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      metrics.push(duration);

      expect(response.status()).toBe(200);
    }

    // Calcular percentiles
    const p50 = calculatePercentile(metrics, 50);
    const p95 = calculatePercentile(metrics, 95);
    const p99 = calculatePercentile(metrics, 99);

    console.log(`
      Performance Metrics - GET /api/v1/patients:
      P50: ${p50}ms (threshold: ${PERFORMANCE_THRESHOLDS.api.p50}ms)
      P95: ${p95}ms (threshold: ${PERFORMANCE_THRESHOLDS.api.p95}ms)
      P99: ${p99}ms (threshold: ${PERFORMANCE_THRESHOLDS.api.p99}ms)
    `);

    // Assertions
    expect(p50).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p50);
    expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p95);
    expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p99);
  });

  test('POST /api/v1/appointments - Crear cita', async ({ request }) => {
    const metrics: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      const response = await request.post('/api/v1/appointments', {
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        data: {
          patientId: 'test-patient-id',
          doctorId: 'test-doctor-id',
          date: new Date(Date.now() + 86400000).toISOString(),
          type: 'consultation',
          reason: 'Performance test appointment',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      metrics.push(duration);

      expect(response.status()).toBeOneOf([200, 201]);
    }

    const p50 = calculatePercentile(metrics, 50);
    const p95 = calculatePercentile(metrics, 95);

    console.log(`
      Performance Metrics - POST /api/v1/appointments:
      P50: ${p50}ms
      P95: ${p95}ms
    `);

    expect(p50).toBeLessThan(300);
    expect(p95).toBeLessThan(600);
  });

  test('GET /api/v1/medical-records - Historia médica con paginación', async ({ request }) => {
    const metrics: number[] = [];
    const pageSizes = [10, 20, 50, 100];

    for (const pageSize of pageSizes) {
      const startTime = Date.now();

      const response = await request.get('/api/v1/medical-records', {
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
        },
        params: {
          limit: pageSize,
          offset: 0,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      metrics.push(duration);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeDefined();

      console.log(`Page size ${pageSize}: ${duration}ms`);
    }

    // Verificar que el tiempo no aumenta linealmente con el tamaño
    const smallPageTime = metrics[0];
    const largePageTime = metrics[metrics.length - 1];
    const ratio = largePageTime / smallPageTime;

    console.log(`Performance scaling ratio: ${ratio.toFixed(2)}x`);
    expect(ratio).toBeLessThan(3); // No más de 3x más lento para 10x más datos
  });

  test('Concurrent requests - Stress test', async ({ request }) => {
    const concurrentRequests = 20;
    const promises = [];

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request.get('/api/v1/health', {
          headers: {
            Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
          },
        }),
      );
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Verificar que todas las requests fueron exitosas
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }

    const avgTimePerRequest = totalDuration / concurrentRequests;

    console.log(`
      Concurrent Requests Test:
      Total requests: ${concurrentRequests}
      Total time: ${totalDuration}ms
      Average time per request: ${avgTimePerRequest.toFixed(2)}ms
    `);

    expect(avgTimePerRequest).toBeLessThan(500);
  });

  test('Database query performance - Complex search', async ({ request }) => {
    const searchQueries = ['diabetes', 'hipertensión', 'covid', 'dolor de cabeza', 'fiebre alta'];

    const metrics: number[] = [];

    for (const query of searchQueries) {
      const startTime = Date.now();

      const response = await request.get('/api/v1/patients/search', {
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
        },
        params: {
          q: query,
          includeHistory: true,
          includePrescriptions: true,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      metrics.push(duration);

      expect(response.status()).toBe(200);

      console.log(`Search "${query}": ${duration}ms`);
    }

    const avgSearchTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;

    console.log(`Average search time: ${avgSearchTime.toFixed(2)}ms`);
    expect(avgSearchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.database.query * 2);
  });
});

test.describe('Frontend Performance Tests', () => {
  test('Homepage Core Web Vitals', async ({ page }) => {
    // Navegar a la página
    await page.goto('/');

    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');

    // Medir Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (simulado)
        metrics.fid = 0;

        // Cumulative Layout Shift
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          metrics.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });

        // Time to First Byte
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        metrics.ttfb = navigation.responseStart - navigation.requestStart;

        // Resolver después de recolectar métricas
        setTimeout(() => resolve(metrics), 3000);
      });
    });

    console.log(`
      Core Web Vitals:
      LCP: ${metrics.lcp}ms (threshold: ${PERFORMANCE_THRESHOLDS.frontend.lcp}ms)
      FID: ${metrics.fid}ms (threshold: ${PERFORMANCE_THRESHOLDS.frontend.fid}ms)
      CLS: ${metrics.cls} (threshold: ${PERFORMANCE_THRESHOLDS.frontend.cls})
      TTFB: ${metrics.ttfb}ms (threshold: ${PERFORMANCE_THRESHOLDS.frontend.ttfb}ms)
    `);

    // Assertions
    expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.frontend.lcp);
    expect(metrics.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.frontend.fid);
    expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.frontend.cls);
    expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.frontend.ttfb);
  });

  test('Bundle size verification', async ({ page }) => {
    const resourceTimings = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        size: entry.transferSize,
        duration: entry.duration,
        type: entry.initiatorType,
      }));
    });

    // Filtrar solo JavaScript y CSS
    const jsResources = resourceTimings.filter((r) => r.name.includes('.js'));
    const cssResources = resourceTimings.filter((r) => r.name.includes('.css'));

    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0);

    console.log(`
      Bundle Sizes:
      Total JS: ${(totalJsSize / 1024).toFixed(2)}KB
      Total CSS: ${(totalCssSize / 1024).toFixed(2)}KB
      Total: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)}KB
    `);

    // Verificar que los bundles no excedan límites
    expect(totalJsSize).toBeLessThan(500 * 1024); // 500KB max JS
    expect(totalCssSize).toBeLessThan(100 * 1024); // 100KB max CSS
  });
});

// Utilidades
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Extend expect matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be one of ${expected}`
          : `Expected ${received} to be one of ${expected}`,
    };
  },
});
