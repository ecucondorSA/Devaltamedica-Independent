import { test as setup, expect } from '@playwright/test';

/**
 * 🔐 SETUP DE AUTENTICACIÓN PARA PRUEBAS E2E
 * Este archivo se ejecuta una vez antes de todas las pruebas
 * para establecer una sesión de doctor autenticado
 */

const authFile = 'tests/e2e/.auth/doctor.json';

setup('authenticate as doctor', async ({ page }) => {
  // Navegar a la página de login
  await page.goto('/auth/login');

  // Simular login con credenciales de doctor de prueba
  // Nota: Estos datos deben existir en tu sistema de pruebas
  await page.fill('input[name="email"]', 'doctor.test@altamedica.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  
  // Hacer clic en el botón de login
  await page.click('button[type="submit"]');

  // Esperar a que la redirección post-login termine
  // Esto puede ser al dashboard principal o directamente a la app
  await page.waitForURL('**/dashboard**');
  
  // Verificar que el login fue exitoso
  await expect(page.locator('text=Dr.')).toBeVisible({ timeout: 10000 });

  // Guardar el estado de autenticación
  await page.context().storageState({ path: authFile });
});
