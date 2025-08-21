import { Page, Locator } from '@playwright/test';
import { TestUser, formSelectors } from '../fixtures/test-data';

/**
 * Helper para rellenar el formulario de registro
 */
export async function fillRegistrationForm(page: Page, user: TestUser) {
  console.log(`📝 Rellenando formulario para ${user.role}: ${user.email}`);
  
  // Seleccionar el rol primero
  await selectUserRole(page, user.role);
  
  // Rellenar campos básicos
  await page.fill(formSelectors.firstName, user.firstName);
  await page.fill(formSelectors.lastName, user.lastName);
  await page.fill(formSelectors.email, user.email);
  
  // Rellenar contraseñas - necesitamos ser más específicos
  const passwordFields = await page.locator('input[type="password"]').all();
  if (passwordFields.length >= 2) {
    await passwordFields[0].fill(user.password); // Primera contraseña
    await passwordFields[1].fill(user.password); // Confirmar contraseña
  }
  
  // Aceptar términos y condiciones
  await page.check(formSelectors.termsCheckbox);
}

/**
 * Helper para seleccionar el rol de usuario
 */
export async function selectUserRole(page: Page, role: string) {
  console.log(`🎭 Seleccionando rol: ${role}`);
  
  const roleSelector = role === 'patient' ? formSelectors.patientRole 
                    : role === 'doctor' ? formSelectors.doctorRole 
                    : formSelectors.companyRole;
  
  await page.check(roleSelector);
  
  // Verificar que se seleccionó correctamente
  await page.waitForSelector(`${roleSelector}:checked`);
}

/**
 * Helper para enviar el formulario y manejar el estado de carga
 */
export async function submitRegistrationForm(page: Page) {
  console.log('🚀 Enviando formulario de registro...');
  
  // Hacer clic en el botón de envío
  await page.click(formSelectors.submitButton);
  
  // Esperar el estado de carga
  try {
    await page.waitForSelector(formSelectors.loadingState, { timeout: 5000 });
    console.log('⏳ Estado de carga detectado');
  } catch (error) {
    console.log('ℹ️ No se detectó estado de carga (puede ser normal)');
  }
}

/**
 * Helper para verificar mensaje de éxito
 */
export async function waitForSuccessMessage(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector(formSelectors.successMessage, { timeout: 10000 });
    console.log('✅ Mensaje de éxito detectado');
    return true;
  } catch (error) {
    console.log('❌ No se detectó mensaje de éxito');
    
    // Verificar si hay mensaje de error
    const errorElement = await page.locator(formSelectors.errorMessage).first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('🚨 Error detectado:', errorText);
    }
    
    return false;
  }
}

/**
 * Helper para esperar redirección y verificar URL
 */
export async function waitForRedirect(page: Page, expectedUrl: string, timeout: number = 15000): Promise<boolean> {
  console.log(`🔄 Esperando redirección a: ${expectedUrl}`);
  
  try {
    // Esperar que la URL cambie o contenga la URL esperada
    await page.waitForFunction(
      (url) => window.location.href.includes(url) || window.location.href === url,
      expectedUrl,
      { timeout }
    );
    
    const currentUrl = page.url();
    console.log(`✅ Redirección exitosa a: ${currentUrl}`);
    return currentUrl.includes(expectedUrl.replace('http://localhost', ''));
  } catch (error) {
    const currentUrl = page.url();
    console.log(`❌ Redirección fallida. URL actual: ${currentUrl}, Esperada: ${expectedUrl}`);
    return false;
  }
}

/**
 * Helper para tomar screenshot con timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${name}-${timestamp}.png`;
  await page.screenshot({ path: `e2e-results/${filename}` });
  console.log(`📸 Screenshot guardado: ${filename}`);
}

/**
 * Helper para limpiar datos de prueba del localStorage
 */
export async function clearTestData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Helper para verificar elementos de la página
 */
export async function verifyPageElements(page: Page, expectedElements: string[]) {
  console.log('🔍 Verificando elementos de la página...');
  
  for (const selector of expectedElements) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      console.log(`✅ Elemento encontrado: ${selector}`);
    } catch (error) {
      console.log(`❌ Elemento no encontrado: ${selector}`);
      throw new Error(`Elemento requerido no encontrado: ${selector}`);
    }
  }
}

/**
 * Helper para manejar diálogos de navegador (alerts, confirms, etc.)
 */
export async function setupDialogHandlers(page: Page) {
  page.on('dialog', async dialog => {
    console.log(`🔔 Diálogo detectado: ${dialog.type()} - ${dialog.message()}`);
    await dialog.accept();
  });
}