/**
 * 🧪 TEST E2E - FLUJO COMPLETO DE PACIENTE
 * 
 * Este test automatizado simula el recorrido completo de un paciente:
 * 1. Registro de nueva cuenta
 * 2. Verificación de email (simulada)
 * 3. Login con credenciales
 * 4. Navegación por el portal
 * 5. Acciones típicas del paciente
 */

import { test, expect, Page } from '@playwright/test';
import { randomBytes } from 'crypto';

import { logger } from '@altamedica/shared/services/logger.service';
// 🔧 CONFIGURACIÓN Y HELPERS
const generateTestEmail = () => {
  const timestamp = Date.now();
  const randomString = randomBytes(4).toString('hex');
  return `paciente.test.${timestamp}.${randomString}@example.com`;
};

const generateTestPatient = () => {
  const email = generateTestEmail();
  return {
    email,
    password: 'TestPatient123!@#',
    firstName: 'Juan',
    lastName: 'Pérez Test',
    phone: '+54 11 5555-0001',
    dni: '12345678',
    birthDate: '1990-01-15',
    gender: 'male',
    address: 'Av. Test 1234, Buenos Aires',
    medicalHistory: 'Sin antecedentes relevantes'
  };
};

// 🛠️ UTILITY FUNCTIONS
async function waitForLoadingToDisappear(page: Page) {
  // Esperar un momento para que la página se estabilice
  await page.waitForTimeout(1000);
  
  // Esperar a que desaparezcan spinners específicos (no skeletons que pueden ser parte del UI)
  try {
    await page.waitForFunction(() => {
      const spinners = document.querySelectorAll('.animate-spin');
      // No contar elementos que son parte del skeleton UI permanente
      const actualSpinners = Array.from(spinners).filter(spinner => {
        const isVisible = spinner.offsetParent !== null;
        const isLoader = spinner.textContent?.includes('Cargando') || 
                        spinner.closest('[role="status"]') || 
                        spinner.closest('.loading');
        return isVisible && isLoader;
      });
      return actualSpinners.length === 0;
    }, { timeout: 10000 });
  } catch (e) {
    // Si el timeout ocurre, continuar - la página puede estar lista de todos modos
    logger.info('⚠️ Timeout esperando que desaparezcan los loaders, continuando...');
  }
}

async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, '');
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Pequeña pausa para simular escritura humana
}

// 📋 TEST CONFIGURATION
test.describe('🏥 Flujo Completo de Paciente - AltaMedica', () => {
  let testPatient: ReturnType<typeof generateTestPatient>;
  
  test.beforeEach(async ({ page }) => {
    // Generar datos únicos para cada test
    testPatient = generateTestPatient();
    
    // Configurar viewport y navegación inicial
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Esperar a que la página principal cargue completamente
    await waitForLoadingToDisappear(page);
  });

  test('1️⃣ Registro de nuevo paciente', async ({ page }) => {
    logger.info('🧪 Iniciando test de registro con:', testPatient.email);
    
    // Navegar al registro
    await test.step('Navegar a la página de registro', async () => {
      // Buscar y hacer clic en el botón "Soy Paciente"
      await page.click('button:has-text("Soy Paciente")');
      
      // Debería redirigir al registro con rol preseleccionado
      await expect(page).toHaveURL(/.*\/auth\/register\?role=patient/);
      await waitForLoadingToDisappear(page);
    });

    // Completar formulario de registro
    await test.step('Completar formulario de registro', async () => {
      // Información básica
      await fillFormField(page, 'input[name="email"]', testPatient.email);
      await fillFormField(page, 'input[name="password"]', testPatient.password);
      await fillFormField(page, 'input[name="confirmPassword"]', testPatient.password);
      
      // Información personal
      await fillFormField(page, 'input[name="firstName"]', testPatient.firstName);
      await fillFormField(page, 'input[name="lastName"]', testPatient.lastName);
      await fillFormField(page, 'input[name="phone"]', testPatient.phone);
      
      // Seleccionar género
      await page.selectOption('select[name="gender"]', testPatient.gender);
      
      // Fecha de nacimiento
      await fillFormField(page, 'input[name="birthDate"]', testPatient.birthDate);
      
      // Aceptar términos
      await page.check('input[name="acceptTerms"]');
      
      // Captura de pantalla antes de enviar
      await page.screenshot({ 
        path: `tests/screenshots/patient-registration-${Date.now()}.png`,
        fullPage: true 
      });
      
      // Enviar formulario
      await page.click('button[type="submit"]:has-text("Registrarse")');
    });

    // Verificar registro exitoso
    await test.step('Verificar registro exitoso', async () => {
      // Esperar redirección o mensaje de éxito
      await expect(page.locator('text=/verificación|confirmación|éxito/i')).toBeVisible({ 
        timeout: 10000 
      });
      
      // Verificar que se muestre el email del usuario
      await expect(page.locator(`text=${testPatient.email}`)).toBeVisible();
    });
  });

  test('2️⃣ Login de paciente existente', async ({ page }) => {
    logger.info('🧪 Iniciando test de login');
    
    // Navegar al login
    await test.step('Navegar a la página de login', async () => {
      // Buscar cualquier botón o link de login
      const loginButton = page.locator('button:has-text("Iniciar Sesión"), a:has-text("Iniciar Sesión"), button:has-text("Login")').first();
      
      // Si no encontramos botón de login, ir directamente a la URL
      if (await loginButton.count() > 0) {
        await loginButton.click();
      } else {
        await page.goto('http://localhost:3000/auth/login');
      }
      
      // Esperar a que estemos en la página de login
      await page.waitForURL('**/login**', { timeout: 10000 });
      await page.waitForTimeout(2000); // Dar tiempo a que cargue completamente
    });

    // Completar formulario de login
    await test.step('Completar formulario de login', async () => {
      // Para este test, usaremos credenciales de prueba predefinidas
      const testCredentials = {
        email: 'paciente.demo@altamedica.com',
        password: 'Demo123!@#'
      };
      
      await fillFormField(page, 'input[name="email"], input[type="email"]', testCredentials.email);
      await fillFormField(page, 'input[name="password"], input[type="password"]', testCredentials.password);
      
      // Captura antes de login
      await page.screenshot({ 
        path: `tests/screenshots/patient-login-${Date.now()}.png` 
      });
      
      // Enviar formulario
      await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    });

    // Verificar login exitoso y redirección
    await test.step('Verificar login exitoso', async () => {
      // Esperar redirección al portal de pacientes
      await page.waitForURL('**/patients/**', { timeout: 15000 });
      
      // Verificar que el usuario esté autenticado
      await expect(page.locator('text=/Dashboard|Inicio|Mi Perfil/i')).toBeVisible();
    });
  });

  test('3️⃣ Navegación y acciones del paciente', async ({ page }) => {
    logger.info('🧪 Iniciando test de navegación del paciente');
    
    // Primero hacer login
    await test.step('Login rápido', async () => {
      await page.goto('http://localhost:3000/auth/login');
      await fillFormField(page, 'input[type="email"]', 'paciente.demo@altamedica.com');
      await fillFormField(page, 'input[type="password"]', 'Demo123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/patients/**', { timeout: 15000 });
    });

    // Explorar secciones principales
    await test.step('Explorar historial médico', async () => {
      await page.click('a:has-text("Historial Médico"), button:has-text("Historial")');
      await waitForLoadingToDisappear(page);
      
      // Verificar elementos del historial
      await expect(page.locator('h1, h2').filter({ hasText: /Historial Médico/i })).toBeVisible();
      
      // Captura del historial
      await page.screenshot({ 
        path: `tests/screenshots/patient-medical-history-${Date.now()}.png`,
        fullPage: true 
      });
    });

    await test.step('Buscar médicos', async () => {
      await page.click('a:has-text("Buscar Médicos"), button:has-text("Médicos")');
      await waitForLoadingToDisappear(page);
      
      // Verificar que se muestre la lista o mapa de médicos
      await expect(
        page.locator('text=/médicos disponibles|especialistas|doctores/i')
      ).toBeVisible();
      
      // Intentar filtrar por especialidad
      const specialtyFilter = page.locator('select[name="specialty"], input[placeholder*="especialidad"]');
      if (await specialtyFilter.count() > 0) {
        await specialtyFilter.first().selectOption({ index: 1 });
        await page.waitForTimeout(1000); // Esperar actualización de resultados
      }
    });

    await test.step('Agendar cita', async () => {
      // Buscar botón de agendar cita
      const appointmentButton = page.locator('button:has-text("Agendar Cita"), a:has-text("Nueva Cita")');
      
      if (await appointmentButton.count() > 0) {
        await appointmentButton.first().click();
        await waitForLoadingToDisappear(page);
        
        // Verificar que se abra el formulario o modal de citas
        await expect(
          page.locator('text=/agendar|programar|cita|consulta/i')
        ).toBeVisible();
        
        // Captura del proceso de agendar cita
        await page.screenshot({ 
          path: `tests/screenshots/patient-appointment-booking-${Date.now()}.png` 
        });
      }
    });

    await test.step('Ver perfil y configuración', async () => {
      // Buscar menú de usuario o perfil
      const profileMenu = page.locator('[aria-label*="perfil"], [aria-label*="usuario"], button:has-text("Mi Perfil")');
      
      if (await profileMenu.count() > 0) {
        await profileMenu.first().click();
        await page.waitForTimeout(500);
        
        // Hacer clic en configuración si está disponible
        const settingsLink = page.locator('a:has-text("Configuración"), button:has-text("Configuración")');
        if (await settingsLink.count() > 0) {
          await settingsLink.first().click();
          await waitForLoadingToDisappear(page);
          
          // Verificar página de configuración
          await expect(
            page.locator('h1, h2').filter({ hasText: /Configuración|Ajustes|Perfil/i })
          ).toBeVisible();
        }
      }
    });
  });

  test('4️⃣ Funcionalidades específicas del paciente', async ({ page }) => {
    logger.info('🧪 Testing funcionalidades específicas');
    
    // Login rápido
    await page.goto('http://localhost:3000/auth/login');
    await fillFormField(page, 'input[type="email"]', 'paciente.demo@altamedica.com');
    await fillFormField(page, 'input[type="password"]', 'Demo123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patients/**', { timeout: 15000 });

    await test.step('Verificar dashboard del paciente', async () => {
      // Verificar widgets principales
      const expectedWidgets = [
        'Próximas Citas',
        'Medicamentos',
        'Signos Vitales',
        'Notificaciones'
      ];
      
      for (const widget of expectedWidgets) {
        const widgetElement = page.locator(`text=/${widget}/i`);
        if (await widgetElement.count() > 0) {
          await expect(widgetElement.first()).toBeVisible();
        }
      }
      
      // Captura del dashboard completo
      await page.screenshot({ 
        path: `tests/screenshots/patient-dashboard-${Date.now()}.png`,
        fullPage: true 
      });
    });

    await test.step('Interactuar con chat médico si está disponible', async () => {
      const chatButton = page.locator('button:has-text("Chat"), [aria-label*="chat"]');
      
      if (await chatButton.count() > 0) {
        await chatButton.first().click();
        await page.waitForTimeout(1000);
        
        // Verificar que se abra el chat
        const chatInput = page.locator('input[placeholder*="mensaje"], textarea[placeholder*="escribir"]');
        if (await chatInput.count() > 0) {
          await chatInput.first().fill('Hola, necesito información sobre mi próxima cita');
          
          // Buscar botón de enviar
          const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")');
          if (await sendButton.count() > 0) {
            await sendButton.first().click();
          }
        }
      }
    });

    await test.step('Logout del sistema', async () => {
      // Buscar botón de logout
      const logoutButton = page.locator('button:has-text("Cerrar Sesión"), a:has-text("Salir")');
      
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        
        // Confirmar logout si hay modal
        const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
        if (await confirmButton.count() > 0) {
          await confirmButton.first().click();
        }
        
        // Verificar redirección a home
        await page.waitForURL('**/localhost:3000', { timeout: 10000 });
      }
    });
  });

  // 🔍 TEST DE ACCESIBILIDAD Y RESPONSIVE
  test('5️⃣ Verificar accesibilidad y diseño responsive', async ({ page }) => {
    logger.info('🧪 Testing accesibilidad y responsive');
    
    // Probar en diferentes viewports
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await test.step(`Test en ${viewport.name}`, async () => {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3000');
        await waitForLoadingToDisappear(page);
        
        // Verificar que elementos clave sean visibles
        await expect(page.locator('button:has-text("Soy Paciente")')).toBeVisible();
        
        // Verificar menú móvil si aplica
        if (viewport.width < 768) {
          const mobileMenu = page.locator('[aria-label="Menu"], button:has-text("☰")');
          if (await mobileMenu.count() > 0) {
            await mobileMenu.first().click();
            await page.waitForTimeout(500);
          }
        }
        
        // Captura en cada viewport
        await page.screenshot({ 
          path: `tests/screenshots/patient-${viewport.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: true 
        });
      });
    }

    // Verificar navegación por teclado
    await test.step('Verificar navegación por teclado', async () => {
      await page.goto('http://localhost:3000');
      
      // Tab a través de elementos interactivos
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      // Verificar que algún elemento tenga focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});

// 📊 CONFIGURACIÓN DE REPORTE
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Captura de pantalla en caso de falla
    await page.screenshot({ 
      path: `tests/screenshots/failure-${testInfo.title}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});

// 🧹 CLEANUP
test.afterAll(async () => {
  logger.info('✅ Tests E2E de paciente completados');
});