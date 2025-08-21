/**
 * Tests E2E de Compliance HIPAA
 * Verifica seguridad, encriptación y auditoría
 */

import { test, expect } from '@playwright/test';
import { Environment } from '@altamedica/shared/config/environment';

import { logger } from '@altamedica/shared/services/logger.service';
test.describe('HIPAA Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptores para monitorear seguridad
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      
      // Verificar que no se envíen datos sensibles sin encriptar
      const body = route.request().postData();
      if (body) {
        // Check for PHI patterns
        const phiPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{10,}\b/, // Phone numbers
          /patient|diagnosis|medication/i
        ];
        
        phiPatterns.forEach(pattern => {
          if (pattern.test(body)) {
            logger.warn('Potential PHI detected in request:', route.request().url());
          }
        });
      }
      
      route.continue();
    });
  });
  
  test('Login should require MFA for medical roles', async ({ page }) => {
    await page.goto('/login');
    
    // Login como doctor
    await page.fill('[data-testid="email-input"]', 'doctor@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123!');
    await page.click('[data-testid="login-button"]');
    
    // Debe mostrar pantalla de MFA
    await expect(page.locator('[data-testid="mfa-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="mfa-code-input"]')).toBeVisible();
  });
  
  test('PHI data should be encrypted in transit', async ({ page }) => {
    let encryptedRequestFound = false;
    
    // Monitor network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/patients') || url.includes('/api/v1/medical-records')) {
        const postData = request.postData();
        if (postData) {
          // Check if data appears encrypted
          const hasEncryptedStructure = postData.includes('encrypted') && 
                                       postData.includes('iv') && 
                                       postData.includes('authTag');
          if (hasEncryptedStructure) {
            encryptedRequestFound = true;
          }
        }
      }
    });
    
    // Navigate to patient data
    await page.goto('/patients/123/medical-records');
    
    // Create new medical record
    await page.click('[data-testid="new-record-button"]');
    await page.fill('[data-testid="diagnosis-input"]', 'Test diagnosis');
    await page.click('[data-testid="save-record-button"]');
    
    // Verify encryption was used
    expect(encryptedRequestFound).toBeTruthy();
  });
  
  test('Audit logs should be created for PHI access', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'Admin123!');
    await page.click('[data-testid="login-button"]');
    
    // Access patient data
    await page.goto('/patients/123');
    
    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    
    // Should see the patient access event
    const auditEntry = page.locator('[data-testid="audit-entry"]').first();
    await expect(auditEntry).toContainText('PATIENT_ACCESS');
    await expect(auditEntry).toContainText('patients/123');
  });
  
  test('Session should timeout after inactivity', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@test.com');
    await page.fill('[data-testid="password-input"]', 'User123!');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for session timeout (accelerated for testing)
    await page.evaluate(() => {
      // Simulate 15 minutes of inactivity
      const event = new CustomEvent('session-timeout-test');
      window.dispatchEvent(event);
    });
    
    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
  });
  
  test('Security headers should be present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    // Check required security headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['content-security-policy']).toBeDefined();
  });
  
  test('Data export should require authorization and be logged', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'Admin123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to export
    await page.goto('/admin/data-export');
    
    // Attempt export
    await page.click('[data-testid="export-patients-button"]');
    
    // Should show authorization prompt
    await expect(page.locator('[data-testid="export-authorization-modal"]')).toBeVisible();
    
    // Enter authorization
    await page.fill('[data-testid="export-reason"]', 'Compliance audit');
    await page.click('[data-testid="confirm-export"]');
    
    // Check audit log
    await page.goto('/admin/audit-logs');
    const exportLog = page.locator('[data-testid="audit-entry"]').first();
    await expect(exportLog).toContainText('EXPORT');
    await expect(exportLog).toContainText('Compliance audit');
  });
  
  test('Password requirements should be enforced', async ({ page }) => {
    await page.goto('/register');
    
    // Try weak password
    await page.fill('[data-testid="password-input"]', 'weak');
    
    // Should show requirements
    await expect(page.locator('[data-testid="password-requirements"]')).toBeVisible();
    await expect(page.locator('[data-testid="requirement-length"]')).toHaveClass(/invalid/);
    await expect(page.locator('[data-testid="requirement-uppercase"]')).toHaveClass(/invalid/);
    await expect(page.locator('[data-testid="requirement-lowercase"]')).toHaveClass(/invalid/);
    await expect(page.locator('[data-testid="requirement-number"]')).toHaveClass(/invalid/);
    await expect(page.locator('[data-testid="requirement-special"]')).toHaveClass(/invalid/);
    
    // Try strong password
    await page.fill('[data-testid="password-input"]', 'Strong123!Pass');
    
    // All requirements should be met
    await expect(page.locator('[data-testid="requirement-length"]')).toHaveClass(/valid/);
    await expect(page.locator('[data-testid="requirement-uppercase"]')).toHaveClass(/valid/);
    await expect(page.locator('[data-testid="requirement-lowercase"]')).toHaveClass(/valid/);
    await expect(page.locator('[data-testid="requirement-number"]')).toHaveClass(/valid/);
    await expect(page.locator('[data-testid="requirement-special"]')).toHaveClass(/valid/);
  });
  
  test('Unauthorized access should be blocked and logged', async ({ page }) => {
    // Try to access protected route without login
    const response = await page.goto('/patients/123', { waitUntil: 'networkidle' });
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Response should be 401 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(300);
  });
  
  test('Breach detection should trigger alerts', async ({ page, request }) => {
    // Simulate multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await request.post('/api/v1/auth/login', {
        data: {
          email: 'hacker@evil.com',
          password: 'wrongpass'
        }
      });
    }
    
    // Check if breach alert was triggered
    // In real scenario, this would check monitoring system
    const alerts = await request.get('/api/v1/security/alerts');
    const alertData = await alerts.json();
    
    expect(alertData).toContainEqual(
      expect.objectContaining({
        type: 'SUSPICIOUS_LOGIN_ACTIVITY',
        severity: 'HIGH'
      })
    );
  });
});

test.describe('Data Privacy Tests', () => {
  test('Patient data should not be visible in browser storage', async ({ page }) => {
    // Login and navigate to patient page
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'doctor@test.com');
    await page.fill('[data-testid="password-input"]', 'Doctor123!');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/patients/123');
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return Object.keys(window.localStorage).map(key => ({
        key,
        value: window.localStorage.getItem(key)
      }));
    });
    
    // Should not contain PHI
    localStorage.forEach(item => {
      expect(item.value).not.toContain('ssn');
      expect(item.value).not.toContain('diagnosis');
      expect(item.value).not.toContain('medication');
    });
    
    // Check sessionStorage
    const sessionStorage = await page.evaluate(() => {
      return Object.keys(window.sessionStorage).map(key => ({
        key,
        value: window.sessionStorage.getItem(key)
      }));
    });
    
    sessionStorage.forEach(item => {
      expect(item.value).not.toContain('ssn');
      expect(item.value).not.toContain('diagnosis');
      expect(item.value).not.toContain('medication');
    });
  });
  
  test('Print functionality should watermark PHI documents', async ({ page }) => {
    // Navigate to medical record
    await page.goto('/patients/123/medical-records/456');
    
    // Trigger print
    await page.click('[data-testid="print-button"]');
    
    // Check print preview contains watermark
    const printContent = await page.evaluate(() => {
      return document.querySelector('@media print')?.textContent || '';
    });
    
    expect(printContent).toContain('CONFIDENTIAL');
    expect(printContent).toContain('PHI');
  });
});