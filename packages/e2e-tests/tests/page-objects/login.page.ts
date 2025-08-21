import { Page, Locator } from '@playwright/test';

export class LoginPage {
  private page: Page;
  
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/login');
    await this.page.waitForLoadState('networkidle');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
    // Wait for either navigation or error message
    await Promise.race([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);
  }

  async checkRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async waitForLoading() {
    await this.loadingSpinner.waitFor({ state: 'visible' });
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if we're no longer on the login page
    return !this.page.url().includes('/login');
  }
}