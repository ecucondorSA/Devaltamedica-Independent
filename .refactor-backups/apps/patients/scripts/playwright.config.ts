import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración Playwright - Diagnóstico Médico Digital
 * Como un médico digital, investigamos síntomas específicos con precisión
 */
export default defineConfig({
  testDir: './tests',
  
  /* Configuración para diagnósticos rápidos pero precisos */
  timeout: 30 * 1000, // 30s como en emergencias médicas
  expect: {
    timeout: 5000 // 5s para UI responsiva
  },
  
  /* Ejecutar tests secuencialmente para diagnóstico detallado */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Un médico a la vez para análisis profundo
  
  /* Configuración de reportes médicos */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/medical-diagnosis.json' }],
    ['list'] // Para ver resultados en tiempo real
  ],
  
  outputDir: 'test-results/',
  
  use: {
    /* URL base del paciente */
    baseURL: 'http://localhost:3003',
    
    /* Capturar evidencia como exámenes médicos */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Headers médicos para autenticación */
    extraHTTPHeaders: {
      'X-Medical-Environment': 'diagnostic',
      'X-Patient-Test': 'true'
    }
  },

  /* Proyectos de diagnóstico específicos */
  projects: [
    {
      name: 'diagnostic-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Simular condiciones de emergencia médica
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true
      },
    },
    
    {
      name: 'mobile-patient',
      use: { 
        ...devices['iPhone 13'],
        // La mayoría de pacientes usan móvil
      },
    }
  ],

  /* Servicios web que deben estar activos para diagnóstico */
  webServer: [
    {
      command: 'npm run dev',
      port: 3003,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    }
  ],
});