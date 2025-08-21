import { expect, test } from '@playwright/test';

// @telemedicine
// Valida que la home de Patients expone la TelemedicinaCard mínima con testids requeridos
// y que el enlace a la sesión demo existe.

test.describe('@telemedicine Patients Home – TelemedicinaCard mínima', () => {
  test.use({ baseURL: process.env.PATIENTS_BASE_URL || 'http://localhost:3003' });

  test('exhibe selectores y link demo', async ({ page }) => {
    await page.goto('/');
    // tarjetas/ctas mínimas
    const selectors = [
      'webrtc-session',
      'emergency-consultations',
      'new-secure-session',
    ];
    for (const id of selectors) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    // emergency opcional: sólo validar existencia si query param
    await page.goto('/?emergency=1');
    await expect(page.getByTestId('emergency-alert')).toBeVisible();
    await expect(page.getByTestId('join-emergency')).toBeVisible();

    // link demo telemedicine
    const link = page.getByRole('link', { name: /demo/i });
    await expect(link).toHaveAttribute('href', /telemedicine\/session\/demo/);
  });
});
