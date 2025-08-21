import { expect, test } from '@playwright/test';

// Optional UI smoke; runs only if E2E_FRONTEND=1
const shouldRunUI = process.env.E2E_FRONTEND === '1';

(shouldRunUI ? test : test.skip)('home page loads (optional)', async ({ page }) => {
  const url = process.env.BASE_URL || 'http://localhost:3000';
  await page.goto(url);
  await expect(page).toHaveTitle(/AltaMedica|Next.js|React/i);
});
