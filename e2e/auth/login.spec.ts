
import { test, expect } from '@playwright/test';

test.describe('E2E: Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/login');
  });

  test('should allow a user to log in successfully', async ({ page }) => {
    // Usar credenciales de prueba del entorno
    const email = process.env.TEST_PATIENT_EMAIL || 'patient@altamedica.com';
    const password = process.env.TEST_PATIENT_PASSWORD || 'SecurePass123!@#';

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Verificar que se redirige al dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show an error message on failed login', async ({ page }) => {
    await page.fill('input[name="email"]', 'wrong@user.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar que aparece un mensaje de error
    const errorMessage = page.locator('.error-message'); // Asumiendo clase .error-message
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid credentials');
  });

  test('should redirect authenticated users from login page', async ({ page, context }) => {
    // Simular un estado de autenticación (ej. con un token en localStorage o cookie)
    // Este paso es una simplificación. En un caso real, se usaría un setup de autenticación programático.
    await context.addCookies([{ name: 'auth_token', value: 'dummy_token', url: 'http://localhost:3003' }]);
    
    await page.goto('http://localhost:3003/login');

    // Verificar que se redirige inmediatamente al dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
