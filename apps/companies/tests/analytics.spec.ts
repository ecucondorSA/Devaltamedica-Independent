import { expect, test } from '@playwright/test';
import { AnalyticsPage, AuthPage } from '../helpers/.claude';

test.describe('Sistema de Monitoreo y Analytics', () => {
  let authPage: AuthPage;
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    analyticsPage = new AnalyticsPage(page);
    
    await authPage.login();
    await analyticsPage.goto('/dashboard/analytics');
  });

  test.describe('Dashboard de Analytics', () => {
    test('debería mostrar métricas principales correctamente', async ({ page }) => {
      await analyticsPage.assertPageTitle('Analytics');
      await analyticsPage.assertHeading('Panel de Control de Analytics');
      
      // Verificar KPIs principales
      const kpis = [
        'total-employees',
        'active-consultations',
        'monthly-revenue',
        'satisfaction-rate',
        'medical-coverage',
        'response-time'
      ];
      
      for (const kpi of kpis) {
        await expect(page.locator(`[data-testid="kpi-${kpi}"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="${kpi}-value"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="${kpi}-trend"]`)).toBeVisible();
      }
    });

    test('debería mostrar gráficos de tendencias', async ({ page }) => {
      // Verificar gráfico de consultas por mes
      await expect(page.locator('[data-testid="consultations-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="consultations-chart"] canvas')).toBeVisible();
      
      // Verificar gráfico de distribución por especialidad
      await expect(page.locator('[data-testid="specialties-chart"]')).toBeVisible();
      
      // Verificar gráfico de satisfacción
      await expect(page.locator('[data-testid="satisfaction-chart"]')).toBeVisible();
      
      // Verificar gráfico de utilización de servicios
      await expect(page.locator('[data-testid="services-usage-chart"]')).toBeVisible();
    });

    test('debería permitir filtrar por período de tiempo', async ({ page }) => {
      // Cambiar a vista semanal
      await page.click('[data-testid="period-weekly"]');
      await analyticsPage.waitForChartUpdate();
      
      // Verificar que los datos se actualizaron
      await expect(page.locator('[data-testid="period-label"]')).toContainText('Última semana');
      
      // Cambiar a vista mensual
      await page.click('[data-testid="period-monthly"]');
      await analyticsPage.waitForChartUpdate();
      
      await expect(page.locator('[data-testid="period-label"]')).toContainText('Último mes');
      
      // Período personalizado
      await page.click('[data-testid="period-custom"]');
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');
      await page.click('button:has-text("Aplicar")');
      
      await analyticsPage.waitForChartUpdate();
      await expect(page.locator('[data-testid="period-label"]')).toContainText('Período personalizado');
    });

    test('debería exportar reportes', async ({ page }) => {
      // Abrir menú de exportación
      await page.click('[data-testid="export-menu"]');
      
      // Verificar opciones de exportación
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-excel"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
      
      // Preparar descarga
      const downloadPromise = page.waitForEvent('download');
      
      // Exportar como PDF
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('analytics-report');
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Métricas de Empleados', () => {
    test('debería mostrar estadísticas de empleados', async ({ page }) => {
      await page.click('[data-testid="employees-analytics"]');
      
      // Verificar métricas de empleados
      await expect(page.locator('[data-testid="total-employees-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-employees-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-employees-metric"]')).toBeVisible();
      
      // Verificar distribución por departamento
      await expect(page.locator('[data-testid="departments-distribution"]')).toBeVisible();
      
      // Verificar gráfico de edad promedio
      await expect(page.locator('[data-testid="age-distribution-chart"]')).toBeVisible();
      
      // Verificar métricas de rotación
      await expect(page.locator('[data-testid="turnover-rate"]')).toBeVisible();
    });

    test('debería filtrar por departamento', async ({ page }) => {
      await page.click('[data-testid="employees-analytics"]');
      
      // Filtrar por departamento de IT
      await page.selectOption('[data-testid="department-filter"]', 'it');
      await analyticsPage.waitForChartUpdate();
      
      // Verificar que se muestran solo empleados de IT
      await expect(page.locator('[data-testid="filtered-department"]')).toContainText('IT');
      
      // Verificar métricas actualizadas
      const totalEmployees = await page.locator('[data-testid="filtered-employees-count"]').textContent();
      expect(parseInt(totalEmployees!)).toBeGreaterThan(0);
    });

    test('debería mostrar evolución de la plantilla', async ({ page }) => {
      await page.click('[data-testid="employees-analytics"]');
      await page.click('[data-testid="evolution-tab"]');
      
      // Verificar gráfico de evolución
      await expect(page.locator('[data-testid="employee-evolution-chart"]')).toBeVisible();
      
      // Verificar tabla de cambios
      await expect(page.locator('[data-testid="employee-changes-table"]')).toBeVisible();
      
      // Verificar altas y bajas por mes
      await expect(page.locator('[data-testid="hires-fires-chart"]')).toBeVisible();
    });
  });

  test.describe('Analytics de Consultas Médicas', () => {
    test('debería mostrar métricas de consultas', async ({ page }) => {
      await page.click('[data-testid="consultations-analytics"]');
      
      // Verificar métricas principales
      await expect(page.locator('[data-testid="total-consultations"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-consultations"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancelled-consultations"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-consultations"]')).toBeVisible();
      
      // Verificar tiempo promedio de consulta
      await expect(page.locator('[data-testid="avg-consultation-time"]')).toBeVisible();
      
      // Verificar distribución por tipo
      await expect(page.locator('[data-testid="consultation-types-chart"]')).toBeVisible();
    });

    test('debería mostrar analytics por especialidad', async ({ page }) => {
      await page.click('[data-testid="consultations-analytics"]');
      await page.click('[data-testid="by-specialty-tab"]');
      
      // Verificar tabla de especialidades
      await expect(page.locator('[data-testid="specialties-table"]')).toBeVisible();
      
      // Verificar columnas de la tabla
      const headers = ['Especialidad', 'Consultas', 'Tiempo Promedio', 'Satisfacción'];
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
      
      // Verificar gráfico de top especialidades
      await expect(page.locator('[data-testid="top-specialties-chart"]')).toBeVisible();
    });

    test('debería mostrar horarios de mayor demanda', async ({ page }) => {
      await page.click('[data-testid="consultations-analytics"]');
      await page.click('[data-testid="demand-patterns-tab"]');
      
      // Verificar heatmap de demanda
      await expect(page.locator('[data-testid="demand-heatmap"]')).toBeVisible();
      
      // Verificar gráfico por horas del día
      await expect(page.locator('[data-testid="hourly-demand-chart"]')).toBeVisible();
      
      // Verificar gráfico por días de la semana
      await expect(page.locator('[data-testid="weekly-demand-chart"]')).toBeVisible();
    });
  });

  test.describe('Métricas Financieras', () => {
    test('debería mostrar resumen financiero', async ({ page }) => {
      await page.click('[data-testid="financial-analytics"]');
      
      // Verificar métricas principales
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-growth"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-service-cost"]')).toBeVisible();
      await expect(page.locator('[data-testid="cost-per-employee"]')).toBeVisible();
      
      // Verificar gráfico de ingresos
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      
      // Verificar distribución de costos
      await expect(page.locator('[data-testid="costs-distribution"]')).toBeVisible();
    });

    test('debería mostrar análisis de ROI', async ({ page }) => {
      await page.click('[data-testid="financial-analytics"]');
      await page.click('[data-testid="roi-tab"]');
      
      // Verificar métricas de ROI
      await expect(page.locator('[data-testid="roi-percentage"]')).toBeVisible();
      await expect(page.locator('[data-testid="payback-period"]')).toBeVisible();
      await expect(page.locator('[data-testid="cost-savings"]')).toBeVisible();
      
      // Verificar comparativa anual
      await expect(page.locator('[data-testid="roi-comparison-chart"]')).toBeVisible();
    });

    test('debería proyectar costos futuros', async ({ page }) => {
      await page.click('[data-testid="financial-analytics"]');
      await page.click('[data-testid="projections-tab"]');
      
      // Verificar gráfico de proyecciones
      await expect(page.locator('[data-testid="cost-projections-chart"]')).toBeVisible();
      
      // Verificar tabla de escenarios
      await expect(page.locator('[data-testid="scenarios-table"]')).toBeVisible();
      
      // Verificar controles de proyección
      await expect(page.locator('[data-testid="projection-period"]')).toBeVisible();
      await expect(page.locator('[data-testid="growth-rate-input"]')).toBeVisible();
    });
  });

  test.describe('Análisis de Satisfacción', () => {
    test('debería mostrar métricas de satisfacción', async ({ page }) => {
      await page.click('[data-testid="satisfaction-analytics"]');
      
      // Verificar NPS score
      await expect(page.locator('[data-testid="nps-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="nps-gauge"]')).toBeVisible();
      
      // Verificar distribución de ratings
      await expect(page.locator('[data-testid="ratings-distribution"]')).toBeVisible();
      
      // Verificar comentarios recientes
      await expect(page.locator('[data-testid="recent-feedback"]')).toBeVisible();
      
      // Verificar tendencia de satisfacción
      await expect(page.locator('[data-testid="satisfaction-trend"]')).toBeVisible();
    });

    test('debería analizar feedback por categorías', async ({ page }) => {
      await page.click('[data-testid="satisfaction-analytics"]');
      await page.click('[data-testid="feedback-categories"]');
      
      // Verificar análisis de sentimientos
      await expect(page.locator('[data-testid="sentiment-analysis"]')).toBeVisible();
      
      // Verificar categorías de feedback
      const categories = ['Atención', 'Tiempo de espera', 'Calidad', 'Comunicación'];
      for (const category of categories) {
        await expect(page.locator(`[data-testid="category-${category.toLowerCase().replace(/\s/g, '-')}"]`)).toBeVisible();
      }
      
      // Verificar palabras clave más mencionadas
      await expect(page.locator('[data-testid="keywords-cloud"]')).toBeVisible();
    });
  });

  test.describe('Monitoreo en Tiempo Real', () => {
    test('debería mostrar métricas en tiempo real', async ({ page }) => {
      await page.click('[data-testid="realtime-monitoring"]');
      
      // Verificar indicadores de estado
      await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="ongoing-consultations"]')).toBeVisible();
      
      // Verificar actualización automática
      const initialValue = await page.locator('[data-testid="active-users-count"]').textContent();
      
      // Esperar actualización (simulada)
      await page.waitForTimeout(5000);
      
      // Verificar que los datos se actualizan
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
    });

    test('debería mostrar alertas y notificaciones', async ({ page }) => {
      await page.click('[data-testid="realtime-monitoring"]');
      await page.click('[data-testid="alerts-tab"]');
      
      // Verificar panel de alertas
      await expect(page.locator('[data-testid="alerts-panel"]')).toBeVisible();
      
      // Verificar diferentes tipos de alertas
      const alertTypes = ['critical', 'warning', 'info'];
      for (const type of alertTypes) {
        const alerts = page.locator(`[data-testid="alert-${type}"]`);
        if (await alerts.count() > 0) {
          await expect(alerts.first()).toBeVisible();
        }
      }
      
      // Verificar configuración de alertas
      await page.click('[data-testid="alert-settings"]');
      await expect(page.locator('[data-testid="alert-thresholds"]')).toBeVisible();
    });
  });

  test.describe('Reportes Personalizados', () => {
    test('debería crear reporte personalizado', async ({ page }) => {
      await page.click('[data-testid="custom-reports"]');
      await page.click('[data-testid="create-report"]');
      
      // Completar formulario de reporte
      await page.fill('[data-testid="report-name"]', 'Reporte Mensual Test');
      await page.selectOption('[data-testid="report-type"]', 'consultations');
      
      // Seleccionar métricas
      await page.check('[data-testid="metric-total"]');
      await page.check('[data-testid="metric-satisfaction"]');
      await page.check('[data-testid="metric-response-time"]');
      
      // Configurar filtros
      await page.selectOption('[data-testid="period-filter"]', 'monthly');
      await page.selectOption('[data-testid="department-filter"]', 'all');
      
      // Guardar reporte
      await page.click('button:has-text("Crear Reporte")');
      
      await analyticsPage.assertNotification('Reporte creado exitosamente');
      
      // Verificar que aparece en la lista
      await expect(page.locator('text="Reporte Mensual Test"')).toBeVisible();
    });

    test('debería programar envío de reportes', async ({ page }) => {
      await page.click('[data-testid="custom-reports"]');
      
      // Seleccionar reporte existente
      const firstReport = page.locator('[data-testid="report-item"]').first();
      await firstReport.click();
      
      // Configurar programación
      await page.click('[data-testid="schedule-report"]');
      
      await page.selectOption('[data-testid="frequency"]', 'weekly');
      await page.selectOption('[data-testid="day-of-week"]', 'monday');
      await page.fill('[data-testid="delivery-time"]', '09:00');
      
      // Agregar destinatarios
      await page.fill('[data-testid="recipients"]', 'admin@company.com, manager@company.com');
      
      // Guardar programación
      await page.click('button:has-text("Programar Envío")');
      
      await analyticsPage.assertNotification('Envío programado correctamente');
    });
  });

  test.describe('Comparativas y Benchmarks', () => {
    test('debería mostrar comparativas históricas', async ({ page }) => {
      await page.click('[data-testid="comparatives"]');
      
      // Verificar comparativa año anterior
      await expect(page.locator('[data-testid="year-over-year"]')).toBeVisible();
      
      // Verificar métricas de comparación
      const metrics = [
        'consultations-growth',
        'satisfaction-change',
        'cost-variation',
        'efficiency-improvement'
      ];
      
      for (const metric of metrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="${metric}-percentage"]`)).toBeVisible();
      }
      
      // Verificar gráfico de tendencias
      await expect(page.locator('[data-testid="trends-comparison-chart"]')).toBeVisible();
    });

    test('debería mostrar benchmarks de industria', async ({ page }) => {
      await page.click('[data-testid="comparatives"]');
      await page.click('[data-testid="industry-benchmarks"]');
      
      // Verificar comparación con promedio de industria
      await expect(page.locator('[data-testid="industry-comparison"]')).toBeVisible();
      
      // Verificar métricas vs benchmarks
      const benchmarks = [
        'employee-satisfaction',
        'response-time',
        'cost-efficiency',
        'service-utilization'
      ];
      
      for (const benchmark of benchmarks) {
        await expect(page.locator(`[data-testid="benchmark-${benchmark}"]`)).toBeVisible();
        
        // Verificar indicador de rendimiento (arriba/debajo del promedio)
        const indicator = page.locator(`[data-testid="benchmark-${benchmark}-indicator"]`);
        await expect(indicator).toBeVisible();
      }
    });
  });

  test.describe('Integración y APIs', () => {
    test('debería mostrar métricas de integración', async ({ page }) => {
      await page.click('[data-testid="integrations-analytics"]');
      
      // Verificar estado de integraciones
      await expect(page.locator('[data-testid="integrations-status"]')).toBeVisible();
      
      // Verificar métricas de API
      await expect(page.locator('[data-testid="api-calls-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="api-response-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="api-error-rate"]')).toBeVisible();
      
      // Verificar logs de sincronización
      await expect(page.locator('[data-testid="sync-logs"]')).toBeVisible();
    });

    test('debería configurar webhooks y notificaciones', async ({ page }) => {
      await page.click('[data-testid="integrations-analytics"]');
      await page.click('[data-testid="webhooks-tab"]');
      
      // Verificar lista de webhooks
      await expect(page.locator('[data-testid="webhooks-list"]')).toBeVisible();
      
      // Agregar nuevo webhook
      await page.click('[data-testid="add-webhook"]');
      
      await page.fill('[data-testid="webhook-url"]', 'https://api.company.com/webhooks');
      await page.selectOption('[data-testid="webhook-event"]', 'consultation.completed');
      await page.check('[data-testid="webhook-active"]');
      
      await page.click('button:has-text("Crear Webhook")');
      
      await analyticsPage.assertNotification('Webhook configurado exitosamente');
    });
  });

  test('debería funcionar correctamente en dispositivos móviles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar vista móvil del dashboard
    await expect(page.locator('[data-testid="mobile-analytics"]')).toBeVisible();
    
    // Verificar que los gráficos se adapten
    await expect(page.locator('[data-testid="mobile-charts"]')).toBeVisible();
    
    // Verificar navegación en móvil
    await page.click('[data-testid="mobile-menu"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Probar diferentes secciones en móvil
    await page.click('[data-testid="mobile-employees-link"]');
    await expect(page.locator('[data-testid="mobile-employees-analytics"]')).toBeVisible();
  });

  test('debería manejar errores de carga de datos', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/analytics/**', async route => {
      await route.abort('failed');
    });
    
    await page.reload();
    
    // Verificar mensaje de error
    await expect(page.locator('[data-testid="analytics-error"]')).toBeVisible();
    await expect(page.locator('text="Error al cargar datos de analytics"')).toBeVisible();
    
    // Verificar botón de reintentar
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
    
    // Verificar modo offline
    await expect(page.locator('[data-testid="offline-mode"]')).toBeVisible();
  });
});
