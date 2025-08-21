import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para testing E2E
 * Sistema de gestión médica empresarial AltaMedica
 */
export default defineConfig({
  testDir: './tests',
  // Tiempo límite global para cada test
  timeout: 60000,
  // Tiempo límite para las aserciones expect
  expect: {
    timeout: 5000,
  },
  
  // Configuración de reintentos
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers (tests paralelos)
  workers: process.env.CI ? 1 : 4,
  
  // Configuración del reporter
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  
  // Directorio de artefactos de prueba
  outputDir: 'test-results/artifacts',
  
  // Configuración global de setup y teardown
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),
  
  // Configuración global
  use: {
    // URL base de la aplicación
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3006',
    
    // Configuración del navegador
    browserName: 'chromium',
    headless: process.env.CI ? true : false,
    
    // Configuración de video y screenshots
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    
    // Configuración de timeouts
    navigationTimeout: 30000,
    actionTimeout: 15000,
    
    // Configuración de viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignorar errores HTTPS en desarrollo
    ignoreHTTPSErrors: true,
    
    // Configuración de locale
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    
    // Headers adicionales
    extraHTTPHeaders: {
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
    }
  },

  // Configuración de proyectos (diferentes navegadores/dispositivos)
  projects: [
    // Desktop - Chrome
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        permissions: ['notifications', 'geolocation'],
      },
    },
    
    // Desktop - Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    // Mobile - Chrome
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 7'],
        permissions: ['notifications', 'geolocation'],
      },
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Configuración del servidor de desarrollo
  webServer: {
    command: 'pnpm dev',
    port: 3006,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      NEXTAUTH_URL: 'http://localhost:3006',
      NEXTAUTH_SECRET: 'test-secret-key-for-playwright',
    }
  },

  // Configuración de patrones de archivos
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/tests/**/*.ts',
  ],
  
  // Archivos a ignorar
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],

  // Configuración de metadatos para reportes
  metadata: {
    project: 'AltaMedica Companies App',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3006',
  },

  // Configuración de máximos fallos antes de abortar
  maxFailures: process.env.CI ? 10 : undefined,

  // Configuración de archivos de configuración adicionales
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  
  // Configuración de directorios especiales
  snapshotDir: './tests/snapshots',
});
