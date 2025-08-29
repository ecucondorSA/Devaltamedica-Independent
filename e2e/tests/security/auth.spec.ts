
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow a user to log in', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Fill in the form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click the login button
    await page.click('button[type="submit"]');

    // Check for successful login
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });
});
