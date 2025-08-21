import { expect, test } from '@playwright/test';

// @telemedicine
// Valida que la home de Doctors expone la TelemedicinaCard mínima y el enlace demo

test.describe('@telemedicine Doctors Home – TelemedicinaCard mínima', () => {
  test.use({ baseURL: process.env.DOCTORS_BASE_URL || 'http://localhost:3002' });

  test('exhibe selectores y link demo', async ({ page }) => {
    await page.goto('/');
    const selectors = [
      'webrtc-session',
      'emergency-consultations',
      'new-secure-session',
    ];
    for (const id of selectors) {
      await expect(page.getByTestId(id)).toBeVisible();
    }

    await page.goto('/?emergency=1');
    await expect(page.getByTestId('emergency-alert')).toBeVisible();
    await expect(page.getByTestId('join-emergency')).toBeVisible();

    const link = page.getByRole('link', { name: /demo/i });
    await expect(link).toHaveAttribute('href', /telemedicine\/session\/demo/);
  });
});
