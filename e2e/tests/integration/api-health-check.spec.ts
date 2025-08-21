import { test, expect } from '@playwright/test';

/**
 * API HEALTH CHECK TESTING
 * 
 * Basic infrastructure validation for AltaMedica platform
 * Tests core APIs and services availability
 */

test.describe('AltaMedica API Health Checks', () => {
  test('API Server health endpoint responds correctly', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('http://localhost:3001/api/health');
    const responseTime = Date.now() - startTime;
    
    // Verify response
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData.success).toBe(true);
    expect(healthData.data.status).toBe('healthy');
    
    // Performance requirement: API should respond within 200ms
    expect(responseTime).toBeLessThan(200);
    
    console.log(`✅ API Health Check: ${responseTime}ms`);
  });

  test('Patients Portal is accessible', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to patients portal
    await page.goto('http://localhost:3003');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loaded (even with errors, should have basic HTML structure)
    await expect(page.locator('html')).toBeVisible();
    
    // Performance: Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Patients Portal Load: ${loadTime}ms`);
  });

  test('Web App main page is accessible', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to main web app
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loaded
    await expect(page.locator('html')).toBeVisible();
    
    // Performance: Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`✅ Web App Load: ${loadTime}ms`);
  });

  test('Multiple API endpoints respond within acceptable time', async ({ request }) => {
    const endpoints = [
      'http://localhost:3001/api/health',
      // Add more endpoints as they become available
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const response = await request.get(endpoint);
        const responseTime = Date.now() - startTime;
        
        results.push({
          endpoint,
          status: response.status(),
          responseTime,
          success: response.ok()
        });
        
      } catch (error) {
        results.push({
          endpoint,
          status: 0,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message
        });
      }
    }
    
    // Log results
    console.log('🏥 API Performance Report:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.endpoint}: ${result.responseTime}ms (${result.status})`);
    });
    
    // At least one endpoint should work
    const workingEndpoints = results.filter(r => r.success);
    expect(workingEndpoints.length).toBeGreaterThan(0);
  });
});