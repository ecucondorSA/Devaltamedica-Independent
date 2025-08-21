import { expect, test } from '@playwright/test';

// @companies
// Cubrimos dos casos mínimos: redirect de home -> /operations-hub y presencia de Marketplace UI

test.describe('@companies Home y Marketplace', () => {
  test.use({ baseURL: process.env.COMPANIES_BASE_URL || 'http://localhost:3004' });

  test('home redirige a /operations-hub', async ({ page }) => {
    const response = await page.goto('/');
    // Debe terminar en /operations-hub
    await expect(page).toHaveURL(/\/operations-hub$/);
    // Layout base visible (OperationsHubLayout suele renderizar contenedor)
    await expect(page.locator('body')).toBeVisible();
  });

  test('marketplace renderiza mapa y controles VS Code-like', async ({ page }) => {
    await page.goto('/marketplace');
    // Cabecera Marketplace visible por testid estable
    await expect(page.getByTestId('marketplace-title')).toBeVisible();
    // Tabs existentes por testid
    for (const id of ['overview', 'jobs', 'map', 'analytics']) {
      await expect(page.getByTestId(`tab-${id}`)).toBeVisible();
    }
    // Activar Hub (map) y validar container
    await page.getByTestId('tab-map').click();
    await expect(page.getByTestId('marketplace-map-container')).toBeVisible();
    // Controles Panel Izq/Der por testid y su efecto
    await expect(page.getByTestId('toggle-left-panel')).toBeVisible();
    await expect(page.getByTestId('toggle-right-panel')).toBeVisible();
  // Toggle left panel off
    await page.getByTestId('toggle-left-panel').click();
    await expect(page.getByTestId('left-panel')).toHaveCount(0);
    // Toggle it back on
    await page.getByTestId('toggle-left-panel').click();
    await expect(page.getByTestId('left-panel')).toBeVisible();

  // Toggle right panel off/on
  await page.getByTestId('toggle-right-panel').click();
  await expect(page.getByTestId('right-panel')).toHaveCount(0);
  await page.getByTestId('toggle-right-panel').click();
  await expect(page.getByTestId('right-panel')).toBeVisible();

  // Abrir y cerrar modal Nueva Oferta
  await page.getByTestId('create-new-job').click();
  await expect(page.getByTestId('job-form-modal')).toBeVisible();
  await page.getByTestId('close-job-form-modal').click();
  await expect(page.getByTestId('job-form-modal')).toHaveCount(0);
  });

  test('interacciones avanzadas del Hub: paneles, secciones y búsqueda', async ({ page }) => {
    await page.goto('/marketplace');
    await page.getByTestId('tab-map').click();
    
    // Verificar que paneles estén inicialmente visibles
    await expect(page.getByTestId('left-panel')).toBeVisible();
    await expect(page.getByTestId('right-panel')).toBeVisible();
    
    // Testear toggles de secciones en panel izquierdo
    await expect(page.getByTestId('offers-section-toggle')).toBeVisible();
    await expect(page.getByTestId('professionals-section-toggle')).toBeVisible();
    
    // Expandir/contraer sección de ofertas
    await page.getByTestId('offers-section-toggle').click();
    await expect(page.getByTestId('offers-list')).toBeVisible();
    
    // Expandir/contraer sección de profesionales
    await page.getByTestId('professionals-section-toggle').click();
    await expect(page.getByTestId('professionals-section')).toBeVisible();
    await expect(page.getByTestId('professionals-search')).toBeVisible();
    await expect(page.getByTestId('professionals-list')).toBeVisible();
    
    // Testear búsqueda de profesionales
    await page.getByTestId('professionals-search').fill('carlos');
    await page.waitForTimeout(300); // Esperar filtrado
    
    // Panel derecho - secciones analytics y comunicaciones
    await expect(page.getByTestId('comms-section-toggle')).toBeVisible();
    await expect(page.getByTestId('analytics-section-toggle')).toBeVisible();
  });

  test('sistema de mensajería: overlay completo', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Abrir mensajes desde el header
    await page.getByTestId('open-messages').click();
    await expect(page.getByTestId('messaging-overlay')).toBeVisible();
    
    // El modal de mensajes debería aparecer como overlay fijo
    const messagingModal = page.getByTestId('messaging-overlay').locator('div').first();
    await expect(messagingModal).toBeVisible();
    
    // Cerrar mensajes (buscar botón de cierre, típicamente una X)
    // En MessagingSystem.tsx línea 330-334, el botón close está ahí
    const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.getByTestId('messaging-overlay')).toHaveCount(0);
    }
  });

  test('modal de onboarding: navegación completa', async ({ page }) => {
    // Para activar el onboarding, necesitamos limpiar localStorage primero
    await page.goto('/marketplace');
    await page.evaluate(() => localStorage.removeItem('marketplace_onboarding_seen'));
    
    // Ir al mapa para activar onboarding
    await page.getByTestId('tab-map').click();
    
    // El onboarding debería aparecer automáticamente
    await expect(page.getByTestId('onboarding-modal')).toBeVisible();
    await expect(page.getByTestId('onboarding-content')).toBeVisible();
    await expect(page.getByTestId('onboarding-step-1')).toBeVisible();
    await expect(page.getByTestId('onboarding-progress')).toContainText('Paso 1 de 4');
    
    // Navegar a través de los pasos
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByTestId('onboarding-step-2')).toBeVisible();
    await expect(page.getByTestId('onboarding-progress')).toContainText('Paso 2 de 4');
    
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByTestId('onboarding-step-3')).toBeVisible();
    
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByTestId('onboarding-step-4')).toBeVisible();
    await expect(page.getByTestId('onboarding-finish')).toBeVisible();
    
    // Botón atrás debería funcionar
    await page.getByTestId('onboarding-prev').click();
    await expect(page.getByTestId('onboarding-step-3')).toBeVisible();
    
    // Finalizar onboarding
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-finish').click();
    await expect(page.getByTestId('onboarding-modal')).toHaveCount(0);
    
    // O cerrar directamente con X
    /* Alternativamente, se podría cerrar con:
    await page.getByTestId('close-onboarding').click();
    await expect(page.getByTestId('onboarding-modal')).toHaveCount(0);
    */
  });
});
