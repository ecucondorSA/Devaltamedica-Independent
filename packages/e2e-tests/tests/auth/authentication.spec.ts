import { expect, test } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard.page';
import { LoginPage } from '../page-objects/login.page';

test.describe('🔐 Authentication Flows', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('Patient login and redirect to patient portal', async ({ page }) => {
    // Arrange
    const patientCredentials = {
      email: 'patient.test@altamedica.com',
      password: 'SecurePass123!'
    };

    // Act
    await loginPage.fillEmail(patientCredentials.email);
    await loginPage.fillPassword(patientCredentials.password);
    await loginPage.clickLogin();

    // Assert
    await expect(page).toHaveURL('http://localhost:3003/dashboard');
    await expect(dashboardPage.welcomeMessage).toContainText('Bienvenido');
    await expect(dashboardPage.userRole).toContainText('Paciente');
  });

  test('Doctor SSO authentication flow', async ({ page }) => {
    // Arrange
    const doctorCredentials = {
      email: 'doctor.test@altamedica.com',
      password: 'DoctorPass123!'
    };

    // Act
    await loginPage.fillEmail(doctorCredentials.email);
    await loginPage.fillPassword(doctorCredentials.password);
    await loginPage.clickLogin();

    // Assert
    await expect(page).toHaveURL('http://localhost:3002/dashboard');
    await expect(dashboardPage.welcomeMessage).toContainText('Dr.');
    await expect(dashboardPage.userRole).toContainText('Doctor');
    
    // Verify medical features are accessible
    await expect(page.locator('[data-testid="appointments-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="patients-section"]')).toBeVisible();
  });

  test('Company portal multi-user access', async ({ page }) => {
    // Arrange
    const companyCredentials = {
      email: 'company.admin@altamedica.com',
      password: 'CompanyPass123!'
    };

    // Act
    await loginPage.fillEmail(companyCredentials.email);
    await loginPage.fillPassword(companyCredentials.password);
    await loginPage.clickLogin();

    // Assert
    await expect(page).toHaveURL('http://localhost:3004/dashboard');
    await expect(dashboardPage.userRole).toContainText('Empresa');
    
    // Verify marketplace features
    await expect(page.locator('[data-testid="job-postings"]')).toBeVisible();
    await expect(page.locator('[data-testid="doctor-profiles"]')).toBeVisible();
  });

  test('Admin portal access with elevated permissions', async ({ page }) => {
    // Arrange
    const adminCredentials = {
      email: 'admin@altamedica.com',
      password: 'AdminSecure123!'
    };

    // Act
    await loginPage.fillEmail(adminCredentials.email);
    await loginPage.fillPassword(adminCredentials.password);
    await loginPage.clickLogin();

    // Assert
    await expect(page).toHaveURL('http://localhost:3005/dashboard');
    await expect(dashboardPage.userRole).toContainText('Administrador');
    
    // Verify admin features
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-logs"]')).toBeVisible();
  });

  test('Invalid credentials show error message', async ({ page }) => {
    // Act
    await loginPage.fillEmail('invalid@email.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickLogin();

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Credenciales inválidas');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Session timeout after 15 minutes of inactivity', async ({ page, context }) => {
    // Login first
    await loginPage.fillEmail('patient.test@altamedica.com');
    await loginPage.fillPassword('SecurePass123!');
    await loginPage.clickLogin();
    
    await expect(page).toHaveURL('http://localhost:3003/dashboard');

    // Simulate 15 minutes of inactivity
    await page.evaluate(() => {
      // Mock the session timeout
      window.localStorage.setItem('lastActivity', new Date(Date.now() - 16 * 60 * 1000).toISOString());
    });

    // Try to navigate to protected route
    await page.goto('http://localhost:3003/appointments');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorMessage).toContainText('Sesión expirada');
  });

  test('Remember me functionality persists session', async ({ page, context }) => {
    // Act
    await loginPage.fillEmail('patient.test@altamedica.com');
    await loginPage.fillPassword('SecurePass123!');
    await loginPage.checkRememberMe();
    await loginPage.clickLogin();

    // Verify logged in
    await expect(page).toHaveURL('http://localhost:3003/dashboard');

    // Get cookies
  const cookies = await context.cookies();
  const authCookie = cookies.find(c => c.name === 'altamedica_token' || c.name === 'auth-token');
    
    // Assert cookie has extended expiry (30 days)
    expect(authCookie).toBeDefined();
    expect(authCookie!.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 24 * 60 * 60);
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await loginPage.fillEmail('patient.test@altamedica.com');
    await loginPage.fillPassword('SecurePass123!');
    await loginPage.clickLogin();
    
    await expect(page).toHaveURL('http://localhost:3003/dashboard');

    // Logout
    await dashboardPage.clickLogout();

    // Assert
    await expect(page).toHaveURL('http://localhost:3000/login');
    
    // Try to access protected route
    await page.goto('http://localhost:3003/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('🔒 Security Tests', () => {
  test('Password field is masked', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Prevents SQL injection in login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Try SQL injection
    await loginPage.fillEmail("admin' OR '1'='1");
    await loginPage.fillPassword("' OR '1'='1");
    await loginPage.clickLogin();

    // Should show validation error, not database error
    await expect(loginPage.errorMessage).toContainText('Email inválido');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Rate limiting after multiple failed attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLogin();
      await page.waitForTimeout(100);
    }

    // 6th attempt should be rate limited
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickLogin();

    await expect(loginPage.errorMessage).toContainText('Demasiados intentos');
  });
});