import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración Playwright para AltaMedica Web App
 * Testing automatizado con foco en funcionalidad médica
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Configuración de paralelización */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter para CI/CD */
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  /* Configuración global de tests */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Timeouts extendidos para operaciones médicas */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* Headers para compliance médico */
    extraHTTPHeaders: {
      'X-Medical-Test': 'playwright',
      'X-HIPAA-Compliance': 'enabled',
      'Accept-Language': 'es-ES'
    },
    
    /* Viewport por defecto */
    viewport: { width: 1280, height: 720 },
    
    /* Ignorar HTTPS en desarrollo */
    ignoreHTTPSErrors: true
  },

  /* Proyectos de testing por navegador */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox', 
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* Testing móvil para telemedicina */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Servidor de desarrollo local */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});