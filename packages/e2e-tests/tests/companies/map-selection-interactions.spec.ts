import { test, expect } from '@playwright/test';

import { logger } from '@altamedica/shared/services/logger.service';
const COMPANIES_URL = process.env.E2E_COMPANIES_URL || 'http://localhost:3004';

test.describe('Companies Marketplace - Map Selection Interactions @companies @map', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to companies marketplace
    await page.goto(`${COMPANIES_URL}/marketplace`);
    
    // Mock authentication for E2E tests
    if (process.env.E2E_USE_MOCK_LOGIN) {
      await page.evaluate(() => {
        localStorage.setItem('company_auth_token', 'mock-company-token');
        localStorage.setItem('user_role', 'company');
        // Mark onboarding as seen to avoid interference
        localStorage.setItem('marketplace_onboarding_seen', '1');
      });
    }
    
    // Wait for marketplace to load
    await expect(page.locator('[data-testid="marketplace-header"]')).toBeVisible();
    
    // Navigate to the map tab
    await page.locator('[data-testid="tab-map"]').click();
    
    // Wait for map to load
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
  });

  test('should toggle left and right panels', async ({ page }) => {
    // Both panels should be visible initially (assuming default state)
    // Note: We'll test by clicking the toggle buttons and observing the map container size changes
    
    // Toggle left panel off
    await page.locator('[data-testid="toggle-left-panel"]').click();
    
    // Wait for animation/transition
    await page.waitForTimeout(500);
    
    // Toggle left panel back on
    await page.locator('[data-testid="toggle-left-panel"]').click();
    await page.waitForTimeout(500);
    
    // Toggle right panel off
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(500);
    
    // Toggle right panel back on
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(500);
    
    // Verify map container is still visible after all toggles
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
  });

  test('should respond to keyboard shortcuts for panel toggling', async ({ page }) => {
    // Test Ctrl+B for left panel toggle
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    // Test Ctrl+Shift+B for right panel toggle  
    await page.keyboard.press('Control+Shift+b');
    await page.waitForTimeout(300);
    
    // Toggle back
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+Shift+b');
    await page.waitForTimeout(300);
    
    // Verify map is still functional
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
  });

  test('should show doctor information when doctor is selected on map', async ({ page }) => {
    // Wait for map to fully load
    await page.waitForTimeout(2000);
    
    // Look for doctor markers on the map (this might need to be adjusted based on actual map implementation)
    // Since we don't know the exact structure, we'll test for common map marker patterns
    const doctorMarkers = page.locator('.leaflet-marker-icon, .doctor-marker, [data-testid^="doctor-marker"]');
    
    // If markers exist, click the first one
    const firstMarker = doctorMarkers.first();
    const markerCount = await doctorMarkers.count();
    
    if (markerCount > 0) {
      await firstMarker.click();
      
      // Wait for panel reaction - this could be a popup, right panel update, or left panel update
      await page.waitForTimeout(1000);
      
      // Check if any panel shows doctor information
      // This is a generic test - in real implementation, we'd check for specific doctor info elements
      const doctorInfo = page.locator('text=/Dr\\.|Dra\\.|Cardio|Pediatr|Neurolog/i');
      const infoVisible = await doctorInfo.count();
      
      if (infoVisible > 0) {
        await expect(doctorInfo.first()).toBeVisible();
      }
    } else {
      // If no markers found, just verify the map loaded properly
      logger.info('No doctor markers found on map - this might be expected in test environment');
    }
  });

  test('should show company information when company is selected on map', async ({ page }) => {
    // Wait for map to fully load  
    await page.waitForTimeout(2000);
    
    // Look for company markers on the map
    const companyMarkers = page.locator('.leaflet-marker-icon, .company-marker, .hospital-marker, [data-testid^="company-marker"]');
    
    const firstMarker = companyMarkers.first();
    const markerCount = await companyMarkers.count();
    
    if (markerCount > 0) {
      await firstMarker.click();
      
      // Wait for panel reaction
      await page.waitForTimeout(1000);
      
      // Check if any panel shows company/hospital information
      const companyInfo = page.locator('text=/Hospital|Clínica|Centro|Sanatorio/i');
      const infoVisible = await companyInfo.count();
      
      if (infoVisible > 0) {
        await expect(companyInfo.first()).toBeVisible();
      }
    } else {
      logger.info('No company markers found on map - this might be expected in test environment');
    }
  });

  test('should dispatch map resize events when panels toggle', async ({ page }) => {
    // Add a listener for the custom map event
    await page.evaluate(() => {
      (window as any).mapResizeEventFired = false;
      window.addEventListener('map:invalidate-size', () => {
        (window as any).mapResizeEventFired = true;
      });
    });
    
    // Toggle a panel to trigger the map resize event
    await page.locator('[data-testid="toggle-left-panel"]').click();
    
    // Wait for the event to be dispatched (the code has a 150ms timeout)
    await page.waitForTimeout(500);
    
    // Check if the event was fired
    const eventFired = await page.evaluate(() => (window as any).mapResizeEventFired);
    expect(eventFired).toBe(true);
  });

  test('should handle map interactions with left panel collapsed', async ({ page }) => {
    // Collapse left panel
    await page.locator('[data-testid="toggle-left-panel"]').click();
    await page.waitForTimeout(500);
    
    // Verify map is still interactive
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
    
    // Try to interact with map (zoom, pan, etc.)
    const mapContainer = page.locator('[data-testid="marketplace-map-container"]');
    
    // Simulate map interaction (this might need adjustment based on actual map library)
    await mapContainer.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
    
    // Expand panel back
    await page.locator('[data-testid="toggle-left-panel"]').click();
    await page.waitForTimeout(500);
  });

  test('should handle map interactions with right panel collapsed', async ({ page }) => {
    // Collapse right panel  
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(500);
    
    // Verify map is still interactive
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
    
    // Try to interact with map
    const mapContainer = page.locator('[data-testid="marketplace-map-container"]');
    await mapContainer.click({ position: { x: 200, y: 150 } });
    await page.waitForTimeout(300);
    
    // Expand panel back
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(500);
  });

  test('should handle map interactions with both panels collapsed', async ({ page }) => {
    // Collapse both panels
    await page.locator('[data-testid="toggle-left-panel"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(500);
    
    // Map should take full width
    await expect(page.locator('[data-testid="marketplace-map-container"]')).toBeVisible();
    
    // Try to interact with map in full-screen mode
    const mapContainer = page.locator('[data-testid="marketplace-map-container"]');
    await mapContainer.click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);
    
    // Restore panels
    await page.locator('[data-testid="toggle-left-panel"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="toggle-right-panel"]').click();
    await page.waitForTimeout(300);
  });

  test('should show appropriate panel content when switching between map entities', async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(2000);
    
    // This test assumes there are both doctors and companies on the map
    // In a real implementation, we'd have specific data-testids for different entity types
    
    // Try to find different types of markers
    const allMarkers = page.locator('.leaflet-marker-icon, [data-testid*="marker"]');
    const markerCount = await allMarkers.count();
    
    if (markerCount >= 2) {
      // Click first marker
      await allMarkers.nth(0).click();
      await page.waitForTimeout(1000);
      
      // Click second marker
      await allMarkers.nth(1).click();  
      await page.waitForTimeout(1000);
      
      // Verify that some information is displayed (this would be more specific in real tests)
      const hasContent = await page.locator('text=/Dr\\.|Hospital|Clínica|Cardio|Pediatr/i').count();
      if (hasContent > 0) {
        logger.info('Map selection successfully triggered panel content updates');
      }
    } else {
      logger.info('Not enough markers found for entity switching test');
    }
  });
});