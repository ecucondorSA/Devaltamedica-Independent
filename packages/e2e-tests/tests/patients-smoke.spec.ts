import { test, expect } from '@playwright/test';

const PATIENTS_BASE = process.env.PATIENTS_BASE_URL || 'http://localhost:3003';

test.describe('@smoke patients', () => {
  test('patients app loads landing/dashboard without crash', async ({ page }) => {
    await page.goto(PATIENTS_BASE);
    await expect(page).toHaveTitle(/AltaMedica|Patient|Paciente/i);
  });
});
