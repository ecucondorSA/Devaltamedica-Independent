
import { test, expect } from '@playwright/test';

test.describe('Visual Regression: Homepage', () => {
  test('should match the homepage screenshot', async ({ page }) => {
    await page.goto('http://localhost:3003'); // Asumiendo que el portal de pacientes corre en el puerto 3003
    
    // Esperar a que la página cargue completamente, por ejemplo, esperando un elemento clave.
    await page.waitForSelector('h1');

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100, // Permitir una pequeña diferencia de píxeles
    });
  });
});
