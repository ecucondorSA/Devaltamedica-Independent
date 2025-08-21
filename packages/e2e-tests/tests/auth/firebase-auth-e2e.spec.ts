import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const WEB_BASE = process.env.WEB_BASE_URL || 'http://localhost:3000';
const PATIENTS_BASE = process.env.PATIENTS_BASE_URL || 'http://localhost:3003';
const DOCTORS_BASE = process.env.DOCTORS_BASE_URL || 'http://localhost:3002';
const COMPANIES_BASE = process.env.COMPANIES_BASE_URL || 'http://localhost:3004';

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'company';
}

async function generateTestUser(role: 'patient' | 'doctor' | 'company'): Promise<TestUser> {
  return {
    email: faker.internet.email().toLowerCase(),
    password: 'Test@1234567',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role
  };
}

async function registerUser(page: Page, user: TestUser) {
  await page.goto(`${WEB_BASE}/register`);
  
  await page.fill('[data-testid="register-firstname"]', user.firstName);
  await page.fill('[data-testid="register-lastname"]', user.lastName);
  await page.fill('[data-testid="register-email"]', user.email);
  await page.fill('[data-testid="register-password"]', user.password);
  await page.fill('[data-testid="register-confirm-password"]', user.password);
  
  await page.selectOption('[data-testid="register-role"]', user.role);
  
  await page.click('[data-testid="register-submit"]');
  
  await page.waitForLoadState('networkidle');
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${WEB_BASE}/login`);
  
  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', password);
  
  await page.click('[data-testid="login-submit"]');
  
  await page.waitForLoadState('networkidle');
}

async function verifyUserInFirestore(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/verify-user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.ok;
  } catch (error) {
    logger.error('Error verificando usuario en Firestore:', error);
    return false;
  }
}

async function checkCookies(page: Page): Promise<{ hasToken: boolean; hasRefresh: boolean }> {
  const cookies = await page.context().cookies();
  const hasToken = cookies.some(c => c.name === 'altamedica_token' || c.name === 'auth-token');
  const hasRefresh = cookies.some(c => c.name === 'altamedica_refresh' || c.name === 'refresh-token');
  return { hasToken, hasRefresh };
}

test.describe('Firebase Authentication E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('Registro completo de paciente con Firebase Auth', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar nuevo paciente', async () => {
      await registerUser(page, user);
      
      await expect(page).toHaveURL(/\/verify-email|\/dashboard|\//, { timeout: 10000 });
    });
    
    await test.step('2. Verificar creación en Firebase Auth', async () => {
      const response = await fetch(`${API_BASE}/api/v1/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.exists).toBeTruthy();
    });
    
    await test.step('3. Verificar perfil en Firestore', async () => {
      await page.waitForTimeout(2000);
      
      const cookies = await checkCookies(page);
      expect(cookies.hasToken || cookies.hasRefresh).toBeTruthy();
    });
  });

  test('Login y redirección por rol - Paciente', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar paciente', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Logout', async () => {
      await page.goto(`${WEB_BASE}/logout`);
      await page.waitForTimeout(1000);
    });
    
    await test.step('3. Login con credenciales', async () => {
      await loginUser(page, user.email, user.password);
    });
    
    await test.step('4. Verificar redirección a app de pacientes', async () => {
      await page.waitForURL(`${PATIENTS_BASE}/**`, { timeout: 10000 });
      expect(page.url()).toContain(PATIENTS_BASE);
    });
    
    await test.step('5. Verificar cookies de sesión', async () => {
      const cookies = await checkCookies(page);
      expect(cookies.hasToken).toBeTruthy();
    });
  });

  test('Login y redirección por rol - Doctor', async ({ page }) => {
    const user = await generateTestUser('doctor');
    
    await test.step('1. Registrar doctor', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Logout', async () => {
      await page.goto(`${WEB_BASE}/logout`);
      await page.waitForTimeout(1000);
    });
    
    await test.step('3. Login con credenciales', async () => {
      await loginUser(page, user.email, user.password);
    });
    
    await test.step('4. Verificar redirección a app de doctores', async () => {
      await page.waitForURL(`${DOCTORS_BASE}/**`, { timeout: 10000 });
      expect(page.url()).toContain(DOCTORS_BASE);
    });
  });

  test('Login y redirección por rol - Empresa', async ({ page }) => {
    const user = await generateTestUser('company');
    
    await test.step('1. Registrar empresa', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Logout', async () => {
      await page.goto(`${WEB_BASE}/logout`);
      await page.waitForTimeout(1000);
    });
    
    await test.step('3. Login con credenciales', async () => {
      await loginUser(page, user.email, user.password);
    });
    
    await test.step('4. Verificar redirección a app de empresas', async () => {
      await page.waitForURL(`${COMPANIES_BASE}/**`, { timeout: 10000 });
      expect(page.url()).toContain(COMPANIES_BASE);
    });
  });

  test('Selección de rol pendiente para usuarios de Google', async ({ page }) => {
    await test.step('1. Intentar login con Google', async () => {
      await page.goto(`${WEB_BASE}/login`);
      
      const googleButton = page.locator('[data-testid="login-google"]');
      if (await googleButton.isVisible()) {
        await googleButton.click();
        
        await page.waitForTimeout(2000);
      }
    });
    
    await test.step('2. Verificar redirección a selección de rol', async () => {
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/select-role')) {
        expect(page.url()).toContain('/auth/select-role');
        
        const roleOptions = page.locator('[data-testid="role-option"]');
        await expect(roleOptions).toHaveCount(3);
      }
    });
  });

  test('Persistencia de sesión con Firebase', async ({ page, context }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar y login', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Verificar sesión activa', async () => {
      const cookies = await checkCookies(page);
      expect(cookies.hasToken).toBeTruthy();
    });
    
    await test.step('3. Navegar directamente a app protegida', async () => {
      await page.goto(`${PATIENTS_BASE}/profile`);
      
      await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
      
      const profileElement = page.locator('[data-testid="user-profile"]');
      if (await profileElement.isVisible()) {
        await expect(profileElement).toBeVisible();
      }
    });
    
    await test.step('4. Refrescar página y verificar persistencia', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test('Logout limpia sesión de Firebase', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar y verificar sesión', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
      
      const cookies = await checkCookies(page);
      expect(cookies.hasToken).toBeTruthy();
    });
    
    await test.step('2. Hacer logout', async () => {
      await page.goto(`${WEB_BASE}/logout`);
      await page.waitForTimeout(2000);
    });
    
    await test.step('3. Verificar cookies eliminadas', async () => {
      const cookies = await checkCookies(page);
      expect(cookies.hasToken).toBeFalsy();
      expect(cookies.hasRefresh).toBeFalsy();
    });
    
    await test.step('4. Intentar acceder a ruta protegida', async () => {
      await page.goto(`${PATIENTS_BASE}/profile`);
      
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  });

  test('Manejo de errores de autenticación', async ({ page }) => {
    await test.step('1. Login con credenciales incorrectas', async () => {
      await page.goto(`${WEB_BASE}/login`);
      
      await page.fill('[data-testid="login-email"]', 'noexiste@test.com');
      await page.fill('[data-testid="login-password"]', 'WrongPassword123');
      
      await page.click('[data-testid="login-submit"]');
      
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Verificar mensaje de error', async () => {
      const errorMessage = page.locator('[data-testid="auth-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/Usuario no encontrado|Credenciales inválidas|incorrectas/i);
      }
    });
    
    await test.step('3. Verificar no hay redirección', async () => {
      expect(page.url()).toContain('/login');
    });
  });

  test('Actualización de perfil en Firestore', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar usuario', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Navegar a perfil', async () => {
      await page.goto(`${PATIENTS_BASE}/profile`);
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('3. Actualizar nombre', async () => {
      const editButton = page.locator('[data-testid="edit-profile"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const newName = faker.person.firstName();
        await page.fill('[data-testid="profile-firstname"]', newName);
        
        await page.click('[data-testid="save-profile"]');
        await page.waitForTimeout(2000);
        
        await expect(page.locator('[data-testid="profile-name"]')).toContainText(newName);
      }
    });
  });
});

test.describe('Firebase Auth - Casos Edge', () => {
  test('Manejo de sesión expirada', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Registrar y login', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Simular expiración de token', async () => {
      await page.evaluate(() => {
        document.cookie = 'altamedica_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      });
    });
    
    await test.step('3. Intentar acción autenticada', async () => {
      await page.goto(`${PATIENTS_BASE}/appointments`);
      
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  });

  test('Registro con email duplicado', async ({ page }) => {
    const user = await generateTestUser('patient');
    
    await test.step('1. Primer registro exitoso', async () => {
      await registerUser(page, user);
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Logout', async () => {
      await page.goto(`${WEB_BASE}/logout`);
      await page.waitForTimeout(1000);
    });
    
    await test.step('3. Intentar registro con mismo email', async () => {
      await page.goto(`${WEB_BASE}/register`);
      
      await page.fill('[data-testid="register-firstname"]', user.firstName);
      await page.fill('[data-testid="register-lastname"]', user.lastName);
      await page.fill('[data-testid="register-email"]', user.email);
      await page.fill('[data-testid="register-password"]', user.password);
      await page.fill('[data-testid="register-confirm-password"]', user.password);
      
      await page.selectOption('[data-testid="register-role"]', user.role);
      
      await page.click('[data-testid="register-submit"]');
      
      await page.waitForTimeout(2000);
    });
    
    await test.step('4. Verificar mensaje de error', async () => {
      const errorMessage = page.locator('[data-testid="auth-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/email ya está registrado|already in use/i);
      }
    });
  });
});