import { test, expect } from '@playwright/test';
import { testUsers, formSelectors, expectedTexts, urls, TestUser } from './fixtures/test-data';
import { 
  fillRegistrationForm, 
  submitRegistrationForm, 
  waitForSuccessMessage, 
  waitForRedirect,
  takeScreenshot,
  clearTestData,
  setupDialogHandlers,
  verifyPageElements
} from './utils/test-helpers';

/**
 * Suite de tests E2E para el flujo completo de registro en AltaMedica
 * Cubre los 3 roles principales: Paciente, Doctor, Empresa
 */
test.describe('AltaMedica - Flujo Completo de Registro E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar handlers para diálogos
    await setupDialogHandlers(page);
    
    // Limpiar datos previos
    await clearTestData(page);
    
    // Navegar a la página de registro
    console.log('🏠 Navegando a la página de registro...');
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    
    // Verificar que la página se cargó correctamente
    await expect(page).toHaveTitle(/AltaMedica/);
    await expect(page.locator('h2:has-text("Registro en Plataforma")')).toBeVisible();
  });

  /**
   * Test: Registro completo de Paciente
   */
  test('Registro exitoso de Paciente - Del inicio al final', async ({ page }) => {
    console.log('🏥 Iniciando test de registro de PACIENTE...');
    
    const user = testUsers.patient;
    
    // Verificar elementos del formulario
    await verifyPageElements(page, [
      formSelectors.firstName,
      formSelectors.lastName, 
      formSelectors.email,
      formSelectors.submitButton
    ]);
    
    // Verificar que el rol de paciente esté disponible y tenga el texto correcto
    await expect(page.locator(`label:has(${formSelectors.patientRole})`)).toContainText(expectedTexts.patient.roleLabel);
    await expect(page.locator(`label:has(${formSelectors.patientRole})`)).toContainText(expectedTexts.patient.roleDescription);
    
    // Rellenar formulario
    await fillRegistrationForm(page, user);
    await takeScreenshot(page, 'patient-form-filled');
    
    // Enviar formulario
    await submitRegistrationForm(page);
    
    // Esperar mensaje de éxito
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'patient-success-message');
    
    // Esperar redirección a patients app (3 segundos + tiempo de redirección)
    console.log('⏳ Esperando redirección automática a patients app...');
    await page.waitForTimeout(4000); // Esperar el setTimeout del componente
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 10000);
    expect(redirected).toBe(true);
    
    // Verificar que llegamos a la aplicación correcta
    const finalUrl = page.url();
    expect(finalUrl).toContain('localhost:3003');
    await takeScreenshot(page, 'patient-final-redirect');
    
    console.log('✅ Test de PACIENTE completado exitosamente');
  });

  /**
   * Test: Registro completo de Doctor
   */
  test('Registro exitoso de Doctor - Del inicio al final', async ({ page }) => {
    console.log('👨‍⚕️ Iniciando test de registro de DOCTOR...');
    
    const user = testUsers.doctor;
    
    // Verificar elementos específicos para doctores
    await expect(page.locator(`label:has(${formSelectors.doctorRole})`)).toContainText(expectedTexts.doctor.roleLabel);
    await expect(page.locator(`label:has(${formSelectors.doctorRole})`)).toContainText(expectedTexts.doctor.roleDescription);
    
    // Rellenar formulario
    await fillRegistrationForm(page, user);
    await takeScreenshot(page, 'doctor-form-filled');
    
    // Enviar formulario  
    await submitRegistrationForm(page);
    
    // Esperar mensaje de éxito
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'doctor-success-message');
    
    // Esperar redirección a doctors app
    console.log('⏳ Esperando redirección automática a doctors app...');
    await page.waitForTimeout(4000);
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 10000);
    expect(redirected).toBe(true);
    
    // Verificar que llegamos a la aplicación correcta
    const finalUrl = page.url();
    expect(finalUrl).toContain('localhost:3002');
    await takeScreenshot(page, 'doctor-final-redirect');
    
    console.log('✅ Test de DOCTOR completado exitosamente');
  });

  /**
   * Test: Registro completo de Empresa
   */
  test('Registro exitoso de Empresa - Del inicio al final', async ({ page }) => {
    console.log('🏢 Iniciando test de registro de EMPRESA...');
    
    const user = testUsers.company;
    
    // Verificar elementos específicos para empresas
    await expect(page.locator(`label:has(${formSelectors.companyRole})`)).toContainText(expectedTexts.company.roleLabel);
    await expect(page.locator(`label:has(${formSelectors.companyRole})`)).toContainText(expectedTexts.company.roleDescription);
    
    // Rellenar formulario
    await fillRegistrationForm(page, user);
    await takeScreenshot(page, 'company-form-filled');
    
    // Enviar formulario
    await submitRegistrationForm(page);
    
    // Esperar mensaje de éxito
    const success = await waitForSuccessMessage(page);
    expect(success).toBe(true);
    await takeScreenshot(page, 'company-success-message');
    
    // Esperar redirección a companies app
    console.log('⏳ Esperando redirección automática a companies app...');
    await page.waitForTimeout(4000);
    
    const redirected = await waitForRedirect(page, user.expectedRedirect, 10000);
    expect(redirected).toBe(true);
    
    // Verificar que llegamos a la aplicación correcta
    const finalUrl = page.url();
    expect(finalUrl).toContain('localhost:3004');
    await takeScreenshot(page, 'company-final-redirect');
    
    console.log('✅ Test de EMPRESA completado exitosamente');
  });

  /**
   * Test: Validaciones del formulario
   */
  test('Validaciones del formulario de registro', async ({ page }) => {
    console.log('📋 Iniciando test de validaciones del formulario...');
    
    // Intentar enviar formulario vacío
    await page.click(formSelectors.submitButton);
    
    // Verificar que aparecen validaciones del navegador o mensajes de error
    // (Los campos required del HTML deberían activar validación del browser)
    
    // Probar con email inválido
    await page.fill(formSelectors.firstName, 'Test');
    await page.fill(formSelectors.lastName, 'User');
    await page.fill(formSelectors.email, 'email-invalido');
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length >= 2) {
      await passwordFields[0].fill('123'); // Password muy corta
      await passwordFields[1].fill('456'); // Passwords diferentes
    }
    
    await page.check(formSelectors.termsCheckbox);
    await page.click(formSelectors.submitButton);
    
    // Debería aparecer mensaje de error
    await expect(page.locator('text=Email inválido')).toBeVisible({ timeout: 5000 });
    
    await takeScreenshot(page, 'validation-errors');
    
    console.log('✅ Test de validaciones completado');
  });

  /**
   * Test: Verificar todos los roles están disponibles
   */
  test('Verificar disponibilidad de todos los roles', async ({ page }) => {
    console.log('🎭 Verificando disponibilidad de roles...');
    
    // Verificar que todos los roles están presentes y son seleccionables
    const roles = ['patient', 'doctor', 'company'];
    
    for (const role of roles) {
      const roleSelector = role === 'patient' ? formSelectors.patientRole 
                         : role === 'doctor' ? formSelectors.doctorRole 
                         : formSelectors.companyRole;
      
      // Verificar que existe
      await expect(page.locator(roleSelector)).toBeVisible();
      
      // Verificar que es clickeable
      await page.check(roleSelector);
      await expect(page.locator(`${roleSelector}:checked`)).toBeVisible();
      
      console.log(`✅ Rol ${role} disponible y funcional`);
    }
    
    await takeScreenshot(page, 'all-roles-verified');
    
    console.log('✅ Verificación de roles completada');
  });
});

/**
 * Suite adicional para casos edge y error handling
 */
test.describe('AltaMedica - Casos Edge y Manejo de Errores', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupDialogHandlers(page);
    await clearTestData(page);
    await page.goto(urls.register, { waitUntil: 'networkidle' });
  });

  /**
   * Test: Registro con email duplicado (si el backend lo maneja)
   */
  test('Manejo de email duplicado', async ({ page }) => {
    console.log('📧 Probando registro con email duplicado...');
    
    const user = {
      ...testUsers.patient,
      email: 'duplicate@test.com' // Email que podría ya existir
    };
    
    await fillRegistrationForm(page, user);
    await submitRegistrationForm(page);
    
    // Esperar cualquier mensaje (éxito o error)
    try {
      await page.waitForSelector(formSelectors.successMessage, { timeout: 5000 });
      console.log('✅ Registro exitoso (email no estaba duplicado)');
    } catch {
      // Buscar mensaje de error
      const errorVisible = await page.locator(formSelectors.errorMessage).isVisible();
      if (errorVisible) {
        console.log('✅ Error manejado correctamente para email duplicado');
      }
    }
    
    await takeScreenshot(page, 'duplicate-email-test');
  });
});

/**
 * Suite para tests de responsividad
 */
test.describe('AltaMedica - Tests de Responsividad', () => {
  
  /**
   * Test: Formulario en dispositivos móviles
   */
  test('Registro en móvil - Pixel 7', async ({ page }) => {
    // El test ya está configurado para Pixel 7 en playwright.config.ts
    console.log('📱 Probando registro en dispositivo móvil...');
    
    await page.goto(urls.register, { waitUntil: 'networkidle' });
    
    // Verificar que el formulario se ve bien en móvil
    await expect(page.locator('h2:has-text("Registro en Plataforma")')).toBeVisible();
    
    // La mitad izquierda debería estar oculta en móvil (lg:flex)
    const leftPanel = page.locator('div.lg\\:flex.lg\\:w-1\\/2');
    await expect(leftPanel).toBeHidden();
    
    await takeScreenshot(page, 'mobile-registration-form');
    
    // Intentar rellenar el formulario en móvil
    const user = testUsers.patient;
    await fillRegistrationForm(page, user);
    
    await takeScreenshot(page, 'mobile-form-filled');
    
    console.log('✅ Test de responsividad completado');
  });
});