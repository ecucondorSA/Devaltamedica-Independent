import { expect, test } from '@playwright/test';
import { RegistrationPage } from '../page-objects/registration.page';
import { LoginPage } from '../page-objects/login.page';

test.describe('📝 Registration and Password Recovery Flows', () => {
  let registrationPage: RegistrationPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    registrationPage = new RegistrationPage(page);
    loginPage = new LoginPage(page);
  });

  test('User registration with valid data', async ({ page }) => {
    await registrationPage.goto();
    await registrationPage.fillName('Test User');
    const timestamp = Date.now();
    const email = `test.user.${timestamp}@altamedica.com`;
    await registrationPage.fillEmail(email);
    await registrationPage.fillPassword('SecurePass123!');
    await registrationPage.fillConfirmPassword('SecurePass123!');
    await registrationPage.checkTermsAndConditions();
    await registrationPage.clickRegister();

    // Assuming successful registration redirects to login or dashboard
    await expect(page).toHaveURL(/\/login|\/dashboard/);
    // Optionally, verify a success message
    // await expect(page.locator('text=Registro exitoso')).toBeVisible();
  });

  test('Password recovery flow', async ({ page }) => {
    await loginPage.goto();
    await loginPage.clickForgotPassword();

    // Assuming there's a dedicated password recovery page
    await expect(page).toHaveURL(/\/forgot-password/);

    const recoveryEmail = 'existing.user@altamedica.com'; // Use an email that exists in your test environment
    await page.fill('[data-testid="recovery-email-input"]', recoveryEmail);
    await page.click('[data-testid="send-recovery-link-button"]');

    // Assuming a success message is shown and redirects back to login or stays on page
    await expect(page.locator('text=Enlace de recuperación enviado')).toBeVisible();
    // Optionally, verify redirect
    // await expect(page).toHaveURL(/\/login/);
  });

  // Add more tests for invalid registration data, email already exists, etc.
});
