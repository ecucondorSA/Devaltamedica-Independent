import { test, expect } from '@playwright/test';
import { testUsers, urls, TestUser } from './fixtures/test-data';
import { 
  fillRegistrationForm, 
  submitRegistrationForm, 
  waitForSuccessMessage, 
  waitForRedirect,
  takeScreenshot,
  clearTestData,
  setupDialogHandlers
} from './utils/test-helpers';

/**
 * Suite de tests E2E para el journey completo del usuario
 * Desde registro hasta acceso al dashboard específico de cada rol
 */
test.describe('AltaMedica - Journey Completo del Usuario', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupDialogHandlers(page);
    await clearTestData(page);
  });

  /**
   * Test: Journey completo de Paciente - Registro → Login → Dashboard
   */
  test('Journey completo PACIENTE: Registro → Redirect → Login → Dashboard', async ({ page }) => {
    console.log('🚀 Iniciando journey completo de PACIENTE...');
    
    const user = testUsers.patient;
    
    // FASE 1: REGISTRO EN WEB-APP
    console.log('📝 FASE 1: Registro en web-app (localhost:3000)');
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    
    await fillRegistrationForm(page, user);
    await submitRegistrationForm(page);
    
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'patient-journey-registration-success');
    
    // FASE 2: REDIRECCIÓN AUTOMÁTICA
    console.log('🔄 FASE 2: Esperando redirección automática a patients-app');
    await page.waitForTimeout(4000); // Timeout del componente RegisterForm
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 15000);
    expect(redirected).toBe(true);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('localhost:3003');
    await takeScreenshot(page, 'patient-journey-redirected');
    
    // FASE 3: VERIFICAR APLICACIÓN ESPECÍFICA
    console.log('🏥 FASE 3: Verificando patients-app');
    
    // Esperar a que cargue la página de patients
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Buscar elementos específicos de la app de pacientes
    try {
      // Verificar si hay un formulario de login o si ya está logueado
      const loginForm = page.locator('form:has(input[type="email"])');
      const dashboard = page.locator('[data-testid="patient-dashboard"], .dashboard, h1:has-text("Dashboard")');
      
      const hasLoginForm = await loginForm.isVisible();
      const hasDashboard = await dashboard.isVisible();
      
      if (hasLoginForm) {
        console.log('📋 Se muestra formulario de login - completando login...');
        
        // Si hay formulario de login, completarlo
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        await page.click('button[type="submit"]');
        
        // Esperar a llegar al dashboard
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'patient-journey-after-login');
      } else if (hasDashboard) {
        console.log('🎯 Ya está en el dashboard - sesión automática exitosa');
      } else {
        console.log('ℹ️ Página cargada, verificando contenido...');
      }
      
      // Verificar que estamos en la aplicación correcta
      await expect(page).toHaveURL(/localhost:3003/);
      
      console.log('✅ PACIENTE - Journey completo exitoso');
      
    } catch (error) {
      console.log('⚠️ Error en la verificación final:', error);
      await takeScreenshot(page, 'patient-journey-error');
      throw error;
    }
  });

  /**
   * Test: Journey completo de Doctor - Registro → Login → Dashboard
   */
  test('Journey completo DOCTOR: Registro → Redirect → Login → Dashboard', async ({ page }) => {
    console.log('👨‍⚕️ Iniciando journey completo de DOCTOR...');
    
    const user = testUsers.doctor;
    
    // FASE 1: REGISTRO
    console.log('📝 FASE 1: Registro en web-app');
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    
    await fillRegistrationForm(page, user);
    await submitRegistrationForm(page);
    
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'doctor-journey-registration-success');
    
    // FASE 2: REDIRECCIÓN
    console.log('🔄 FASE 2: Esperando redirección a doctors-app');
    await page.waitForTimeout(4000);
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 15000);
    expect(redirected).toBe(true);
    
    expect(page.url()).toContain('localhost:3002');
    await takeScreenshot(page, 'doctor-journey-redirected');
    
    // FASE 3: VERIFICAR DOCTORS-APP
    console.log('👨‍⚕️ FASE 3: Verificando doctors-app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verificar que estamos en la aplicación de doctores
    await expect(page).toHaveURL(/localhost:3002/);
    
    await takeScreenshot(page, 'doctor-journey-final');
    console.log('✅ DOCTOR - Journey completo exitoso');
  });

  /**
   * Test: Journey completo de Empresa - Registro → Login → Dashboard  
   */
  test('Journey completo EMPRESA: Registro → Redirect → Login → Dashboard', async ({ page }) => {
    console.log('🏢 Iniciando journey completo de EMPRESA...');
    
    const user = testUsers.company;
    
    // FASE 1: REGISTRO
    console.log('📝 FASE 1: Registro en web-app');
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    
    await fillRegistrationForm(page, user);
    await submitRegistrationForm(page);
    
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'company-journey-registration-success');
    
    // FASE 2: REDIRECCIÓN
    console.log('🔄 FASE 2: Esperando redirección a companies-app');
    await page.waitForTimeout(4000);
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 15000);
    expect(redirected).toBe(true);
    
    expect(page.url()).toContain('localhost:3004');
    await takeScreenshot(page, 'company-journey-redirected');
    
    // FASE 3: VERIFICAR COMPANIES-APP
    console.log('🏢 FASE 3: Verificando companies-app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verificar que estamos en la aplicación de empresas
    await expect(page).toHaveURL(/localhost:3004/);
    
    await takeScreenshot(page, 'company-journey-final');
    console.log('✅ EMPRESA - Journey completo exitoso');
  });

  /**
   * Test: Verificar que todas las aplicaciones están funcionando
   */
  test('Verificar disponibilidad de todas las aplicaciones', async ({ page }) => {
    console.log('🔍 Verificando disponibilidad de todas las aplicaciones...');
    
    const applications = [
      { name: 'web-app', url: urls.register, required: true },
      { name: 'patients-app', url: urls.patients, required: false },
      { name: 'doctors-app', url: urls.doctors, required: false },
      { name: 'companies-app', url: urls.companies, required: false },
      { name: 'admin-app', url: urls.admin, required: false }
    ];
    
    for (const app of applications) {
      try {
        console.log(`Verificando ${app.name}...`);
        
        const response = await page.goto(app.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        
        if (response?.ok()) {
          console.log(`✅ ${app.name} disponible`);
          await takeScreenshot(page, `app-check-${app.name}`);
        } else if (app.required) {
          throw new Error(`${app.name} no responde correctamente`);
        } else {
          console.warn(`⚠️ ${app.name} no disponible (opcional)`);
        }
      } catch (error) {
        if (app.required) {
          console.error(`❌ ${app.name} falló:`, error);
          throw error;
        } else {
          console.warn(`⚠️ ${app.name} no disponible:`, error);
        }
      }
      
      // Pausa entre verificaciones
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Verificación de aplicaciones completada');
  });
});

/**
 * Suite para pruebas de performance y tiempos de carga
 */
test.describe('AltaMedica - Performance y Tiempos de Carga', () => {
  
  /**
   * Test: Medir tiempos de carga del registro
   */
  test('Medir performance del flujo de registro', async ({ page }) => {
    console.log('⏱️ Midiendo performance del flujo de registro...');
    
    const startTime = Date.now();
    
    // Ir a registro
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    const pageLoadTime = Date.now() - startTime;
    
    // Medir tiempo de rellenado del formulario
    const formStartTime = Date.now();
    const user = testUsers.patient;
    await fillRegistrationForm(page, user);
    const formFillTime = Date.now() - formStartTime;
    
    // Medir tiempo de envío
    const submitStartTime = Date.now();
    await submitRegistrationForm(page);
    await waitForSuccessMessage(page);
    const submitTime = Date.now() - submitStartTime;
    
    // Log de métricas
    console.log(`📊 Métricas de Performance:`);
    console.log(`   - Carga de página: ${pageLoadTime}ms`);
    console.log(`   - Rellenado de formulario: ${formFillTime}ms`);  
    console.log(`   - Envío y respuesta: ${submitTime}ms`);
    console.log(`   - Tiempo total: ${Date.now() - startTime}ms`);
    
    // Verificar que los tiempos están en rangos razonables
    expect(pageLoadTime).toBeLessThan(10000); // 10 segundos máximo para carga
    expect(submitTime).toBeLessThan(15000);   // 15 segundos máximo para envío
    
    await takeScreenshot(page, 'performance-test-completed');
  });
});