import { test, expect } from '@playwright/test';

const COMPANIES_BASE = process.env.COMPANIES_BASE_URL || 'http://localhost:3004';

test.describe('@smoke companies', () => {
  test('companies app loads map/dashboard without crash', async ({ page }) => {
    await page.goto(COMPANIES_BASE);
    await expect(page).toHaveTitle(/AltaMedica|Companies|Empresas|Marketplace/i);
  });
});
