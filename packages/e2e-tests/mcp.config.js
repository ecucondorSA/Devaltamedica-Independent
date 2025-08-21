/**
 * MCP Configuration for Playwright E2E Tests
 * Used by AI agents to generate and execute tests automatically
 */

module.exports = {
  // Browser configuration
  browser: 'chromium',
  
  // Viewport settings matching existing tests
  viewport: {
    width: 1280,
    height: 800
  },
  
  // Media permissions for telemedicine tests
  permissions: ['microphone', 'camera'],
  
  // Context options for test isolation
  contextOptions: {
    ignoreHTTPSErrors: true,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    
    // Storage state for authenticated sessions
    storageState: process.env.E2E_USE_MOCK_LOGIN === '1' 
      ? undefined 
      : './tests/storage/auth.json',
    
    // Fake media for WebRTC tests
    recordVideo: {
      dir: './test-results/videos/',
      size: { width: 1280, height: 720 }
    },
    
    // Security headers for HIPAA compliance
    extraHTTPHeaders: {
      'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      'X-Test-Mode': 'true'
    }
  },
  
  // Base URLs for different apps
  baseURLs: {
    api: 'http://localhost:3001',
    webApp: 'http://localhost:3000',
    patients: 'http://localhost:3003',
    doctors: 'http://localhost:3002',
    companies: 'http://localhost:3004',
    admin: 'http://localhost:3005'
  },
  
  // Test patterns for AI-guided test generation
  testPatterns: {
    smoke: {
      description: 'Quick health checks and basic functionality',
      priority: 'high',
      timeout: 30000
    },
    authentication: {
      description: 'SSO flows and role-based access',
      priority: 'critical',
      timeout: 60000
    },
    medical: {
      description: 'Medical workflows (appointments, records, prescriptions)',
      priority: 'critical',
      timeout: 90000
    },
    telemedicine: {
      description: 'WebRTC video calls and real-time features',
      priority: 'high',
      timeout: 120000
    },
    marketplace: {
      description: 'B2B marketplace functionality',
      priority: 'medium',
      timeout: 60000
    }
  },
  
  // AI agent hints for test generation
  aiHints: {
    selectors: {
      // Use data-testid when available
      preferDataTestId: true,
      // Fallback to accessible names
      useAccessibleNames: true,
      // Common patterns in AltaMedica
      patterns: {
        buttons: '[data-testid*="button"], button, [role="button"]',
        inputs: 'input, textarea, [role="textbox"]',
        links: 'a[href], [role="link"]',
        forms: 'form, [role="form"]',
        modals: '[role="dialog"], [data-testid*="modal"]'
      }
    },
    
    // Common user journeys to test
    userJourneys: [
      {
        name: 'Patient Books Appointment',
        steps: [
          'Login as patient',
          'Navigate to appointments',
          'Search for doctor',
          'Select available slot',
          'Confirm booking',
          'Verify confirmation'
        ]
      },
      {
        name: 'Doctor Telemedicine Session',
        steps: [
          'Login as doctor',
          'View pending appointments',
          'Start video call',
          'Add consultation notes',
          'Generate prescription',
          'End session'
        ]
      },
      {
        name: 'Company Posts Job',
        steps: [
          'Login as company',
          'Navigate to marketplace',
          'Create job listing',
          'Set requirements',
          'Publish listing',
          'View applications'
        ]
      }
    ],
    
    // HIPAA compliance checks
    securityChecks: [
      'No PHI in URLs',
      'Secure cookies only',
      'No sensitive data in localStorage',
      'Proper session timeouts',
      'Audit logs for medical actions'
    ]
  },
  
  // MCP-specific settings
  mcp: {
    // Enable structured output for AI consumption
    structuredOutput: true,
    
    // Capture accessibility tree
    captureAccessibilityTree: true,
    
    // Auto-retry on failures
    autoRetry: {
      enabled: true,
      maxAttempts: 2,
      delay: 1000
    },
    
    // Test generation preferences
    testGeneration: {
      // Generate TypeScript tests
      language: 'typescript',
      
      // Use existing test helpers
      importHelpers: true,
      helpersPath: './tests/helpers/',
      
      // Follow project conventions
      style: {
        quotes: 'single',
        semicolons: true,
        indentation: 2
      }
    }
  }
};