import { test, expect } from '@playwright/test';

const COMPANIES_URL = process.env.E2E_COMPANIES_URL || 'http://localhost:3004';

test.describe('Companies Marketplace - Crisis Onboarding @companies @crisis', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to companies marketplace
    await page.goto(`${COMPANIES_URL}/marketplace`);
    
    // Mock authentication for E2E tests
    if (process.env.E2E_USE_MOCK_LOGIN) {
      await page.evaluate(() => {
        localStorage.setItem('company_auth_token', 'mock-company-token');
        localStorage.setItem('user_role', 'company');
        // Clear onboarding completion to trigger it
        localStorage.removeItem('marketplace_onboarding_seen');
      });
    }
    
    // Wait for marketplace to load
    await expect(page.locator('[data-testid="marketplace-header"]')).toBeVisible();
    
    // Make sure we're on the map tab where onboarding happens
    await page.locator('[data-testid="tab-map"]').click();
  });

  test('should complete crisis onboarding flow through all 4 steps', async ({ page }) => {
    // Onboarding should auto-trigger when marketplace_onboarding_seen is not set
    // Wait for onboarding modal to appear
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible({ timeout: 10000 });
    
    // Step 1: Hospital Saturado
    await expect(page.locator('[data-testid="onboarding-step-1"]')).toBeVisible();
    await expect(page.locator('text=1) Hospital Saturado')).toBeVisible();
    await expect(page.locator('text=Hospital San Vicente')).toBeVisible();
    
    // Verify progress indicator
    await expect(page.locator('[data-testid="onboarding-progress"]')).toContainText('Paso 1 de 4');
    
    // Go to next step
    await page.locator('[data-testid="onboarding-next"]').click();
    
    // Step 2: Ambulancia
    await expect(page.locator('[data-testid="onboarding-step-2"]')).toBeVisible();
    await expect(page.locator('text=2) Ambulancia')).toBeVisible();
    await expect(page.locator('text=Se asigna una ambulancia 🚑')).toBeVisible();
    
    // Verify progress indicator updated
    await expect(page.locator('[data-testid="onboarding-progress"]')).toContainText('Paso 2 de 4');
    
    // Test back button
    await page.locator('[data-testid="onboarding-prev"]').click();
    await expect(page.locator('[data-testid="onboarding-step-1"]')).toBeVisible();
    
    // Go forward again
    await page.locator('[data-testid="onboarding-next"]').click();
    await page.locator('[data-testid="onboarding-next"]').click();
    
    // Step 3: Trayecto
    await expect(page.locator('[data-testid="onboarding-step-3"]')).toBeVisible();
    await expect(page.locator('text=3) Trayecto')).toBeVisible();
    await expect(page.locator('text=trayecto punteado rojo')).toBeVisible();
    
    // Verify progress indicator
    await expect(page.locator('[data-testid="onboarding-progress"]')).toContainText('Paso 3 de 4');
    
    // Go to final step
    await page.locator('[data-testid="onboarding-next"]').click();
    
    // Step 4: Hospital Receptor
    await expect(page.locator('[data-testid="onboarding-step-4"]')).toBeVisible();
    await expect(page.locator('text=4) Hospital Receptor')).toBeVisible();
    await expect(page.locator('text=receptor óptimo')).toBeVisible();
    
    // Verify progress indicator
    await expect(page.locator('[data-testid="onboarding-progress"]')).toContainText('Paso 4 de 4');
    
    // Verify finish button appears instead of next
    await expect(page.locator('[data-testid="onboarding-finish"]')).toBeVisible();
    await expect(page.locator('[data-testid="onboarding-next"]')).not.toBeVisible();
    
    // Complete onboarding
    await page.locator('[data-testid="onboarding-finish"]').click();
    
    // Verify modal closes
    await expect(page.locator('[data-testid="onboarding-modal"]')).not.toBeVisible();
  });

  test('should allow closing onboarding with close button', async ({ page }) => {
    // Wait for onboarding modal to appear (auto-triggered)
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible({ timeout: 10000 });
    
    // Close onboarding
    await page.locator('[data-testid="close-onboarding"]').click();
    
    // Verify modal closes
    await expect(page.locator('[data-testid="onboarding-modal"]')).not.toBeVisible();
  });

  test('should disable back button on first step', async ({ page }) => {
    // Wait for onboarding modal to appear (auto-triggered)
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible({ timeout: 10000 });
    
    // On step 1, back button should be disabled
    await expect(page.locator('[data-testid="onboarding-prev"]')).toBeDisabled();
    
    // Go to step 2
    await page.locator('[data-testid="onboarding-next"]').click();
    
    // Now back button should be enabled
    await expect(page.locator('[data-testid="onboarding-prev"]')).not.toBeDisabled();
  });

  test('should show appropriate content for each onboarding step', async ({ page }) => {
    // Wait for onboarding modal to appear (auto-triggered)
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible({ timeout: 10000 });
    
    // Step 1 content verification
    await expect(page.locator('[data-testid="onboarding-content"]')).toContainText('Hospital Saturado');
    await expect(page.locator('[data-testid="onboarding-content"]')).toContainText('saturación de guardia/UCI');
    
    // Go through all steps and verify key content
    const stepContents = [
      'Hospital Saturado',
      'Ambulancia',
      'Trayecto',
      'Hospital Receptor'
    ];
    
    for (let i = 0; i < stepContents.length; i++) {
      await expect(page.locator('[data-testid="onboarding-content"]')).toContainText(stepContents[i]);
      
      if (i < stepContents.length - 1) {
        await page.locator('[data-testid="onboarding-next"]').click();
      }
    }
  });
});