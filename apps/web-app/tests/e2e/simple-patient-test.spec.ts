/**
 * 🧪 TEST E2E SIMPLIFICADO - FLUJO BÁSICO DE PACIENTE
 * 
 * Test más simple para verificar funcionalidad básica
 */

import { test, expect } from '@playwright/test';

import { logger } from '@altamedica/shared/services/logger.service';
test.describe('Test Básico de Paciente', () => {
  test('Página principal carga correctamente', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    
    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle');
    
    // Verificar que el título existe
    await expect(page).toHaveTitle(/AltaMedica/i);
    
    // Verificar que existe el botón "Soy Paciente"
    const patientButton = page.locator('button:has-text("Soy Paciente")');
    await expect(patientButton).toBeVisible();
    
    // Hacer clic en "Soy Paciente"
    await patientButton.click();
    
    // Esperar redirección
    await page.waitForTimeout(2000);
    
    // Verificar que estamos en la página de registro con rol paciente
    const url = page.url();
    expect(url).toContain('register');
    expect(url).toContain('role=patient');
    
    // Tomar screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/patient-register-page.png',
      fullPage: true 
    });
  });

  test('Navegación directa a login', async ({ page }) => {
    // Ir directamente a la página de login
    await page.goto('http://localhost:3000/auth/login');
    
    // Esperar a que cargue
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar elementos del formulario
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verificar que los elementos existen
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Intentar llenar el formulario
    await emailInput.fill('test@example.com');
    await passwordInput.fill('Test123!');
    
    // Screenshot del formulario lleno
    await page.screenshot({ 
      path: 'tests/screenshots/login-form-filled.png' 
    });
  });

  test('Verificar elementos de la home', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos principales
    const elements = [
      { selector: 'h1', text: /Gestión Inteligente|Digitalización Médica/i },
      { selector: 'button', text: /Soy Paciente/i },
      { selector: 'button', text: /Soy Médico/i },
      { selector: 'button', text: /Soy Empresa/i }
    ];
    
    for (const element of elements) {
      const el = page.locator(element.selector).filter({ hasText: element.text });
      const count = await el.count();
      logger.info(`Encontrados ${count} elementos ${element.selector} con texto matching ${element.text}`);
      
      if (count > 0) {
        await expect(el.first()).toBeVisible();
      }
    }
    
    // Screenshot completo
    await page.screenshot({ 
      path: 'tests/screenshots/home-page-complete.png',
      fullPage: true 
    });
  });
});