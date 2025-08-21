import { expect, request, test } from '@playwright/test';

const WEB_BASE = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('@smoke web-app', () => {
  test.beforeAll(async function () {
    const ctx = await request.newContext();
    try {
      const res = await ctx.get(WEB_BASE, { timeout: 3000 });
      if (!res.ok()) {
        test.skip(true, `web-app no responde en ${WEB_BASE} (status ${res.status()}).`);
      }
    } catch {
      test.skip(true, `web-app no está levantada en ${WEB_BASE}.`);
    }
  });

  test('home loads and shows basic elements', async ({ page }) => {
    await page.goto(WEB_BASE);
    await expect(page).toHaveTitle(/AltaMedica|Alta Médica|Web App/i);
    // Check header/footer components exist if present
    await expect(page.locator('header')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('footer')).toBeVisible({ timeout: 10_000 });
  });
});
