import { test, expect } from '@playwright/test';

const DOCTORS_BASE = process.env.DOCTORS_BASE_URL || 'http://localhost:3002';

test.describe('@smoke doctors', () => {
  test('doctors app loads home without crash', async ({ page }) => {
    await page.goto(DOCTORS_BASE);
    await expect(page).toHaveTitle(/AltaMedica|Doctor/i);
  });
});
