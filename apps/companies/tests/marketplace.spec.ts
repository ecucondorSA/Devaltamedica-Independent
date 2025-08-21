import { expect, test } from '@playwright/test';
import { AuthPage, MarketplacePage } from '../helpers/.claude';

test.describe('Marketplace de Servicios Médicos', () => {
  let authPage: AuthPage;
  let marketplacePage: MarketplacePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    marketplacePage = new MarketplacePage(page);
    
    await authPage.login();
    await marketplacePage.goto('/dashboard/marketplace');
  });

  test('debería mostrar la interfaz del marketplace correctamente', async ({ page }) => {
    await marketplacePage.assertPageTitle('Marketplace');
    await marketplacePage.assertHeading('Marketplace de Servicios Médicos');
    
    // Verificar elementos principales
    await expect(page.locator('[data-testid="services-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
    
    // Verificar categorías principales
    const categories = [
      'Consultas Médicas',
      'Especialidades',
      'Laboratorio',
      'Diagnóstico por Imagen',
      'Telemedicina',
      'Medicina Preventiva'
    ];
    
    for (const category of categories) {
      await expect(page.locator(`[data-testid="category-${category.toLowerCase().replace(/\s+/g, '-')}"]`)).toBeVisible();
    }
  });

  test('debería buscar servicios correctamente', async ({ page }) => {
    // Buscar servicio específico
    await marketplacePage.searchService('Cardiología');
    
    // Verificar resultados de búsqueda
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-count"]')).toContainText('resultados encontrados');
    
    // Verificar que los resultados contienen el término buscado
    const serviceCards = page.locator('[data-testid="service-card"]');
    const count = await serviceCards.count();
    
    if (count > 0) {
      const firstCard = serviceCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText?.toLowerCase()).toContain('cardiología');
    }
  });

  test('debería filtrar servicios por categoría', async ({ page }) => {
    // Filtrar por categoría de laboratorio
    await marketplacePage.filterByCategory('laboratorio');
    
    // Verificar que solo se muestren servicios de laboratorio
    const serviceCards = page.locator('[data-testid="service-card"]');
    const count = await serviceCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = serviceCards.nth(i);
      const category = await card.locator('[data-testid="service-category"]').textContent();
      expect(category?.toLowerCase()).toContain('laboratorio');
    }
  });

  test('debería mostrar detalles del servicio en modal', async ({ page }) => {
    // Seleccionar primer servicio disponible
    const firstService = page.locator('[data-testid="service-card"]').first();
    const serviceName = await firstService.locator('[data-testid="service-name"]').textContent();
    
    await marketplacePage.selectService(serviceName!);
    
    // Verificar modal de detalles
    await expect(page.locator('[data-testid="service-details-modal"]')).toBeVisible();
    await expect(page.locator(`text="${serviceName}"`)).toBeVisible();
    
    // Verificar elementos del modal
    await expect(page.locator('[data-testid="service-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-requirements"]')).toBeVisible();
    await expect(page.locator('button:has-text("Agregar al Carrito")')).toBeVisible();
  });

  test('debería agregar servicios al carrito', async ({ page }) => {
    // Seleccionar servicio
    const firstService = page.locator('[data-testid="service-card"]').first();
    const serviceName = await firstService.locator('[data-testid="service-name"]').textContent();
    
    await marketplacePage.selectService(serviceName!);
    await marketplacePage.addToCart();
    
    // Verificar que el contador del carrito se actualice
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('1');
    
    // Agregar otro servicio
    await marketplacePage.closeModal();
    
    const secondService = page.locator('[data-testid="service-card"]').nth(1);
    const secondServiceName = await secondService.locator('[data-testid="service-name"]').textContent();
    
    await marketplacePage.selectService(secondServiceName!);
    await marketplacePage.addToCart();
    
    // Verificar contador actualizado
    await expect(cartCount).toHaveText('2');
  });

  test('debería gestionar el carrito de compras', async ({ page }) => {
    // Agregar servicios al carrito
    const services = ['Consulta Cardiología', 'Análisis de Sangre'];
    
    for (const service of services) {
      const serviceCard = page.locator(`[data-testid="service-card"]:has-text("${service}")`);
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await marketplacePage.waitForModal();
        await marketplacePage.addToCart();
        await marketplacePage.closeModal();
      }
    }
    
    // Ver carrito
    await marketplacePage.viewCart();
    
    // Verificar contenido del carrito
    await expect(page.locator('[data-testid="cart-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-items"]')).toBeVisible();
    
    // Verificar elementos del carrito
    const cartItems = page.locator('[data-testid="cart-item"]');
    const itemCount = await cartItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Verificar total
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    
    // Verificar botones de acción
    await expect(page.locator('button:has-text("Proceder al Pago")')).toBeVisible();
    await expect(page.locator('button:has-text("Limpiar Carrito")')).toBeVisible();
  });

  test('debería modificar cantidad de servicios en el carrito', async ({ page }) => {
    // Agregar servicio al carrito
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();
    await marketplacePage.waitForModal();
    
    // Modificar cantidad antes de agregar
    await page.fill('[data-testid="service-quantity"]', '3');
    await marketplacePage.addToCart();
    
    // Ver carrito y verificar cantidad
    await marketplacePage.viewCart();
    
    const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first();
    await expect(quantityInput).toHaveValue('3');
    
    // Modificar cantidad en el carrito
    await quantityInput.fill('2');
    await page.click('[data-testid="update-quantity"]');
    
    // Verificar que el total se actualice
    await marketplacePage.assertNotification('Cantidad actualizada');
  });

  test('debería eliminar servicios del carrito', async ({ page }) => {
    // Agregar servicio al carrito
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();
    await marketplacePage.waitForModal();
    await marketplacePage.addToCart();
    
    // Ver carrito
    await marketplacePage.viewCart();
    
    // Eliminar item
    await page.click('[data-testid="remove-cart-item"]');
    await page.click('button:has-text("Confirmar")');
    
    // Verificar que el item se eliminó
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0');
  });

  test('debería proceder al checkout', async ({ page }) => {
    // Agregar servicio al carrito
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();
    await marketplacePage.waitForModal();
    await marketplacePage.addToCart();
    
    // Proceder al checkout
    await marketplacePage.checkout();
    
    // Verificar página de checkout
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
    
    // Verificar resumen del pedido
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
  });

  test('debería filtrar por rango de precios', async ({ page }) => {
    // Abrir filtros avanzados
    await page.click('[data-testid="advanced-filters"]');
    
    // Configurar filtro de precio
    await page.fill('[data-testid="min-price"]', '1000');
    await page.fill('[data-testid="max-price"]', '5000');
    await page.click('button:has-text("Aplicar Filtros")');
    
    // Verificar que los servicios mostrados estén en el rango
    const serviceCards = page.locator('[data-testid="service-card"]');
    const count = await serviceCards.count();
    
    for (let i = 0; i < count; i++) {
      const priceText = await serviceCards.nth(i).locator('[data-testid="service-price"]').textContent();
      const price = parseInt(priceText?.replace(/\D/g, '') || '0');
      expect(price).toBeGreaterThanOrEqual(1000);
      expect(price).toBeLessThanOrEqual(5000);
    }
  });

  test('debería ordenar servicios por diferentes criterios', async ({ page }) => {
    // Ordenar por precio ascendente
    await page.selectOption('[data-testid="sort-select"]', 'price-asc');
    await marketplacePage.waitForPageLoad();
    
    // Verificar orden
    const prices = await page.locator('[data-testid="service-price"]').allTextContents();
    const numericPrices = prices.map(p => parseInt(p.replace(/\D/g, '')));
    
    for (let i = 1; i < numericPrices.length; i++) {
      expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1]);
    }
    
    // Ordenar por popularidad
    await page.selectOption('[data-testid="sort-select"]', 'popularity');
    await marketplacePage.waitForPageLoad();
    
    // Verificar que se muestre indicador de popularidad
    await expect(page.locator('[data-testid="popularity-badge"]').first()).toBeVisible();
  });

  test('debería mostrar servicios recomendados', async ({ page }) => {
    // Verificar sección de recomendados
    await expect(page.locator('[data-testid="recommended-services"]')).toBeVisible();
    
    // Verificar que hay servicios recomendados
    const recommendedCards = page.locator('[data-testid="recommended-service"]');
    await expect(recommendedCards).toHaveCountGreaterThan(0);
    
    // Verificar elementos de servicio recomendado
    const firstRecommended = recommendedCards.first();
    await expect(firstRecommended.locator('[data-testid="recommendation-reason"]')).toBeVisible();
    await expect(firstRecommended.locator('[data-testid="service-rating"]')).toBeVisible();
  });

  test('debería mostrar reseñas y calificaciones de servicios', async ({ page }) => {
    // Seleccionar servicio con reseñas
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();
    await marketplacePage.waitForModal();
    
    // Ir a pestaña de reseñas
    await page.click('[data-testid="reviews-tab"]');
    
    // Verificar elementos de reseñas
    await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-reviews"]')).toBeVisible();
    
    // Verificar lista de reseñas
    const reviewsList = page.locator('[data-testid="reviews-list"]');
    if (await reviewsList.isVisible()) {
      const reviews = page.locator('[data-testid="review-item"]');
      const reviewCount = await reviews.count();
      
      if (reviewCount > 0) {
        const firstReview = reviews.first();
        await expect(firstReview.locator('[data-testid="reviewer-name"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-rating"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-text"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-date"]')).toBeVisible();
      }
    }
  });

  test('debería manejar servicios favoritos', async ({ page }) => {
    // Marcar servicio como favorito
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.locator('[data-testid="favorite-button"]').click();
    
    // Verificar que se marca como favorito
    await expect(firstService.locator('[data-testid="favorite-button"].active')).toBeVisible();
    await marketplacePage.assertNotification('Agregado a favoritos');
    
    // Ver lista de favoritos
    await page.click('[data-testid="favorites-button"]');
    await expect(page.locator('[data-testid="favorites-modal"]')).toBeVisible();
    
    // Verificar que el servicio aparece en favoritos
    await expect(page.locator('[data-testid="favorite-service"]')).toHaveCountGreaterThan(0);
  });

  test('debería comparar servicios', async ({ page }) => {
    // Seleccionar servicios para comparar
    const serviceCards = page.locator('[data-testid="service-card"]');
    
    // Agregar primer servicio a comparación
    await serviceCards.first().locator('[data-testid="compare-checkbox"]').check();
    
    // Agregar segundo servicio a comparación
    await serviceCards.nth(1).locator('[data-testid="compare-checkbox"]').check();
    
    // Verificar botón de comparar habilitado
    await expect(page.locator('[data-testid="compare-button"]')).toBeEnabled();
    
    // Abrir comparación
    await page.click('[data-testid="compare-button"]');
    await expect(page.locator('[data-testid="comparison-modal"]')).toBeVisible();
    
    // Verificar tabla de comparación
    await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="comparison-header"]')).toHaveCount(2);
  });

  test('debería buscar servicios por ubicación', async ({ page }) => {
    // Habilitar filtro de ubicación
    await page.click('[data-testid="location-filter"]');
    
    // Ingresar ubicación
    await page.fill('[data-testid="location-input"]', 'Buenos Aires, CABA');
    await page.click('[data-testid="search-location"]');
    
    // Verificar mapa si está disponible
    const mapContainer = page.locator('[data-testid="services-map"]');
    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();
      await expect(page.locator('[data-testid="map-marker"]')).toHaveCountGreaterThan(0);
    }
    
    // Verificar servicios filtrados por distancia
    await expect(page.locator('[data-testid="distance-info"]')).toBeVisible();
  });

  test('debería manejar descuentos y promociones', async ({ page }) => {
    // Buscar servicios con descuento
    const discountedServices = page.locator('[data-testid="service-card"] [data-testid="discount-badge"]');
    
    if (await discountedServices.first().isVisible()) {
      const serviceWithDiscount = discountedServices.first().locator('..').locator('..');
      await serviceWithDiscount.click();
      
      await marketplacePage.waitForModal();
      
      // Verificar información de descuento
      await expect(page.locator('[data-testid="original-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="discounted-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="discount-percentage"]')).toBeVisible();
      
      // Verificar condiciones del descuento
      await expect(page.locator('[data-testid="discount-conditions"]')).toBeVisible();
    }
  });

  test('debería funcionar correctamente en dispositivos móviles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar vista móvil
    await expect(page.locator('[data-testid="mobile-marketplace"]')).toBeVisible();
    
    // Verificar navegación en móvil
    await expect(page.locator('[data-testid="mobile-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-cart"]')).toBeVisible();
    
    // Verificar que las cards se adapten a móvil
    const serviceCards = page.locator('[data-testid="service-card"]');
    await expect(serviceCards.first()).toBeVisible();
    
    // Probar búsqueda en móvil
    await page.fill('[data-testid="mobile-search"]', 'Cardiología');
    await page.press('[data-testid="mobile-search"]', 'Enter');
    
    await expect(page.locator('[data-testid="mobile-search-results"]')).toBeVisible();
  });

  test('debería manejar errores de carga de servicios', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/services', async route => {
      await route.abort('failed');
    });
    
    await page.reload();
    
    // Verificar mensaje de error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text="Error al cargar servicios"')).toBeVisible();
    
    // Verificar botón de reintentar
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
  });

  test('debería guardar historial de búsquedas', async ({ page }) => {
    // Realizar varias búsquedas
    const searches = ['Cardiología', 'Laboratorio', 'Radiología'];
    
    for (const search of searches) {
      await marketplacePage.searchService(search);
      await marketplacePage.waitForPageLoad();
    }
    
    // Verificar historial de búsquedas
    await page.click('[data-testid="search-history"]');
    
    for (const search of searches) {
      await expect(page.locator(`[data-testid="search-history-item"]:has-text("${search}")`)).toBeVisible();
    }
  });
});
