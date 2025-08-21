import { test, expect } from '@playwright/test';

// Nota: Este test asume que las apps usan permisos mockeados de media en config

test.describe('@telemed basic', () => {
  test('patients telemedicine page reaches connected state (mock media)', async ({ page }) => {
    await page.goto(process.env.PATIENTS_BASE_URL || 'http://localhost:3003/telemedicine');
    // Espera a que la UI indique conexión (ajustar selector según app)
    const connected = page.locator('[data-test="telemed-status-connected"], text=/Conectado|Connected/i');
    await expect(connected).toBeVisible({ timeout: 30_000 });
  });
});
