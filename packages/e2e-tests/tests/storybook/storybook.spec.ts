import { test, expect } from '@playwright/test';

test.describe('Storybook Visual Regression', () => {
  test('should load Storybook homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Storybook/);
    // Verificar que el área de renderizado de la historia está presente
    await expect(page.locator('#storybook-root')).toBeVisible();
    await page.screenshot({ path: 'storybook-homepage.png' });
  });

  test('should display Button stories', async ({ page }) => {
    await page.goto('/?path=/story/components-button--default');
    // Esperar a que el iframe de la historia se cargue
    const iframe = page.frameLocator('#storybook-preview-iframe');
    await expect(iframe.locator('button', { hasText: 'Button' })).toBeVisible();
    await page.screenshot({ path: 'storybook-button-default.png' });
  });

  test('should display Loading stories', async ({ page }) => {
    await page.goto('/?path=/story/components-loading--default-spinner');
    const iframe = page.frameLocator('#storybook-preview-iframe');
    await expect(iframe.locator('text=Cargando...')).toBeVisible();
    await page.screenshot({ path: 'storybook-loading-default-spinner.png' });
  });

  test('should display HydrationSafeIcon stories', async ({ page }) => {
    await page.goto('/?path=/story/components-hydrationsafeicon--default');
    const iframe = page.frameLocator('#storybook-preview-iframe');
    // Usar un selector más robusto para el SVG
    await expect(iframe.locator('svg[data-lucide="home"]')).toBeVisible();
    await page.screenshot({ path: 'storybook-hydrationsafeicon-default.png' });
  });

  test('should display LoadingSpinner stories', async ({ page }) => {
    await page.goto('/?path=/story/components-loadingspinner--default');
    const iframe = page.frameLocator('#storybook-preview-iframe');
    // Usar un selector más robusto para el spinner
    await expect(iframe.locator('.animate-spin')).toBeVisible();
    await page.screenshot({ path: 'storybook-loadingspinner-default.png' });
  });

  test('should display Separator stories', async ({ page }) => {
    await page.goto('/?path=/story/components-separator--horizontal');
    const iframe = page.frameLocator('#storybook-preview-iframe');
    // Usar un selector más robusto para el separador
    await expect(iframe.locator('.shrink-0.bg-border')).toBeVisible();
    await page.screenshot({ path: 'storybook-separator-horizontal.png' });
  });
});
