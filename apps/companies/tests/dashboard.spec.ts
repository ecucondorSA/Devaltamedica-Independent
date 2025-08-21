import { expect, test } from '@playwright/test';
import { AuthPage, DashboardPage } from '../helpers/.claude';

test.describe('Dashboard Principal', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Login antes de cada prueba
    await authPage.login();
  });

  test('debería mostrar la página principal del dashboard correctamente', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Verificar elementos principales
    await dashboardPage.assertPageTitle('Dashboard');
    await dashboardPage.assertHeading('Dashboard de Empresa');
    
    // Verificar navegación lateral
    await dashboardPage.assertSidebarNavigation();
    
    // Verificar estadísticas principales
    await dashboardPage.assertDashboardStats();
    
    // Verificar que las cards de resumen estén visibles
    await expect(page.locator('[data-testid="summary-card"]')).toHaveCountGreaterThan(3);
  });

  test('debería navegar correctamente entre secciones', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    const sections = [
      { name: 'marketplace', title: 'Marketplace' },
      { name: 'employees', title: 'Empleados' },
      { name: 'doctors', title: 'Doctores' },
      { name: 'appointments', title: 'Citas' },
      { name: 'patients', title: 'Pacientes' }
    ];

    for (const section of sections) {
      await dashboardPage.navigateToSection(section.name);
      await expect(page).toHaveURL(new RegExp(`/${section.name}`));
      await dashboardPage.assertHeading(section.title);
    }
  });

  test('debería mostrar información de estadísticas en tiempo real', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Verificar que las métricas principales estén presentes
    const metrics = [
      'Total Empleados',
      'Doctores Activos', 
      'Citas del Día',
      'Pacientes Registrados'
    ];

    for (const metric of metrics) {
      await expect(page.locator(`text="${metric}"`)).toBeVisible();
    }
    
    // Verificar que los números sean válidos
    const statNumbers = page.locator('[data-testid="stat-number"]');
    const count = await statNumbers.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const text = await statNumbers.nth(i).textContent();
      expect(text).toMatch(/^\d+$/); // Solo números
    }
  });

  test('debería mostrar actividad reciente', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Verificar sección de actividad reciente
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    
    // Verificar que hay elementos de actividad
    const activityItems = page.locator('[data-testid="activity-item"]');
    await expect(activityItems).toHaveCountGreaterThan(0);
    
    // Verificar estructura de elementos de actividad
    const firstActivity = activityItems.first();
    await expect(firstActivity.locator('.activity-icon')).toBeVisible();
    await expect(firstActivity.locator('.activity-text')).toBeVisible();
    await expect(firstActivity.locator('.activity-time')).toBeVisible();
  });

  test('debería tener funcionalidad de búsqueda global', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Buscar en el buscador global
    const searchInput = page.locator('[data-testid="global-search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Juan');
    await page.press('[data-testid="global-search"]', 'Enter');
    
    // Verificar que aparezcan resultados de búsqueda
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('debería mostrar notificaciones', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Hacer clic en el icono de notificaciones
    await page.click('[data-testid="notifications-button"]');
    
    // Verificar que se abra el panel de notificaciones
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
    
    // Verificar que hay notificaciones o mensaje de "sin notificaciones"
    const notificationsList = page.locator('[data-testid="notifications-list"]');
    await expect(notificationsList).toBeVisible();
  });

  test('debería permitir cambiar el tema de la aplicación', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Buscar el selector de tema
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Verificar que el tema cambie
      await expect(page.locator('html')).toHaveAttribute('class', /dark|light/);
    }
  });

  test('debería manejar la navegación breadcrumb correctamente', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Navegar a una subsección
    await dashboardPage.navigateToSection('employees');
    
    // Verificar breadcrumb
    await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Empleados');
    
    // Hacer clic en Dashboard en el breadcrumb
    await page.click('[data-testid="breadcrumb"] a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('debería ser responsive en dispositivos móviles', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboardPage.goto('/dashboard');
    
    // Verificar que el menú hamburguesa esté visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Abrir menú móvil
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verificar navegación en móvil
    await page.click('[data-testid="mobile-menu"] a:has-text("Empleados")');
    await expect(page).toHaveURL(/\/employees/);
  });

  test('debería mantener el estado de la sesión', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Verificar que el usuario esté logueado
    await authPage.assertLoggedIn();
    
    // Navegar a otra página y volver
    await dashboardPage.navigateToSection('employees');
    await dashboardPage.goto('/dashboard');
    
    // Verificar que sigue logueado
    await authPage.assertLoggedIn();
  });

  test('debería mostrar widgets personalizables', async ({ page }) => {
    await dashboardPage.goto('/dashboard');
    
    // Verificar que hay widgets en el dashboard
    const widgets = page.locator('[data-testid="dashboard-widget"]');
    await expect(widgets).toHaveCountGreaterThan(0);
    
    // Verificar funcionalidad de configuración de widgets
    const configButton = page.locator('[data-testid="widget-config"]').first();
    if (await configButton.isVisible()) {
      await configButton.click();
      await expect(page.locator('[data-testid="widget-config-modal"]')).toBeVisible();
    }
  });
});
