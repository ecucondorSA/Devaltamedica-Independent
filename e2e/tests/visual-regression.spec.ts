
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
  test('Homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveScreenshot();
  });
});
