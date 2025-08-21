import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * AltaMedica E2E Testing Configuration
 * Optimized for medical workflows, HIPAA compliance, and performance testing
 */
export default defineConfig({
  // Test directory structure
  testDir: './tests',
  
  // Test file patterns
  testMatch: [
    '**/medical-workflows/**/*.spec.ts',
    '**/compliance/**/*.spec.ts', 
    '**/performance/**/*.spec.ts',
    '**/integration/**/*.spec.ts',
    '**/critical-paths/**/*.spec.ts'
  ],

  // Global test timeout (medical emergency requirement: <3s)
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000
  },

  // Fail fast for critical medical scenarios
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Comprehensive reporting for medical compliance
  reporter: [
    ['html', { 
      outputFolder: 'reports/html-report',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'reports/test-results.json' 
    }],
    ['junit', { 
      outputFile: 'reports/junit-results.xml' 
    }],
    ['list'],
    // Custom medical compliance reporter
    ['./utils/medical-compliance-reporter.ts']
  ],

  // Medical-specific global settings
  use: {
    // Base URL for AltaMedica platform
    baseURL: process.env.ALTAMEDICA_BASE_URL || 'http://localhost:3000',
    
    // Browser settings optimized for medical UI
    headless: process.env.CI ? true : false,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Video recording for medical workflow analysis
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },
    
    // Screenshots for compliance documentation
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    // Trace collection for debugging medical flows
    trace: {
      mode: 'retain-on-failure',
      screenshots: true,
      snapshots: true,
      sources: true
    },

    // Medical-specific context options
    extraHTTPHeaders: {
      'X-Medical-Testing': 'true',
      'X-HIPAA-Compliance': 'enabled'
    }
  },

  // Browser configurations for cross-platform medical access
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Medical Chrome extensions simulation
        launchOptions: {
          args: [
            '--enable-web-bluetooth',
            '--enable-features=WebRTC-H264WithOpenH264FFmpeg',
            '--allow-running-insecure-content'
          ]
        }
      },
    },
    {
      name: 'firefox-desktop', 
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile medical app simulation
      },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'tablet-medical',
      use: {
        ...devices['iPad Pro'],
        // Tablet for doctor consultations
      }
    }
  ],

  // Global setup for medical test environment
  globalSetup: './config/global-setup.ts',
  globalTeardown: './config/global-teardown.ts',

  // Medical test metadata
  metadata: {
    platform: 'AltaMedica Medical Platform',
    compliance: ['HIPAA', 'SOC2', 'WCAG 2.2 AA'],
    medical_focus: true,
    emergency_testing: true,
    telemedicine_enabled: true
  }
});