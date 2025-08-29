
import { test, expect } from '@playwright/test';

test.describe('Visual Regression: Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/login');
    await page.waitForSelector('form');
  });

  test('should match the initial login form screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('login-form-initial.png');
  });

  test('should match the login form with validation errors', async ({ page }) => {
    // Hacer clic en el botón de submit sin llenar los campos
    await page.click('button[type="submit"]');
    
    // Esperar a que aparezcan los mensajes de error
    await page.waitForSelector('.error-message'); // Asumiendo que los errores tienen esta clase

    await expect(page).toHaveScreenshot('login-form-errors.png');
  });
});
