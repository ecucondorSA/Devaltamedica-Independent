/**
 * Script de Validación para Ambiente de Staging
 * Verifica que todos los sistemas críticos estén funcionando correctamente
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:3001';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Validaciones a ejecutar
const validations = [
  {
    name: 'Health Check',
    endpoint: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    validateResponse: (data) => data.status === 'healthy'
  },
  {
    name: 'Security Headers',
    endpoint: '/',
    method: 'GET',
    expectedHeaders: [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ]
  },
  {
    name: 'Authentication Endpoint',
    endpoint: '/api/v1/auth/verify',
    method: 'GET',
    expectedStatus: [401, 403], // Sin token debe fallar
    validateResponse: (data) => data.error !== undefined
  },
  {
    name: 'MFA Configuration',
    endpoint: '/api/v1/auth/mfa/status',
    method: 'GET',
    expectedStatus: [200, 401]
  },
  {
    name: 'Audit System',
    endpoint: '/api/v1/audit/verify-integrity',
    method: 'GET',
    expectedStatus: [200, 401]
  },
  {
    name: 'Encryption Service',
    endpoint: '/api/v1/health/encryption',
    method: 'GET',
    expectedStatus: 200
  }
];

// Función para hacer request
function makeRequest(validation) {
  return new Promise((resolve, reject) => {
    const url = new URL(STAGING_URL + validation.endpoint);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: validation.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AltaMedica-Staging-Validator/1.0'
      },
      timeout: 5000
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Validar un endpoint
async function validateEndpoint(validation) {
  try {
    console.log(`\n${colors.cyan}Testing: ${validation.name}${colors.reset}`);
    console.log(`  Endpoint: ${validation.endpoint}`);
    
    const response = await makeRequest(validation);
    
    // Validar status code
    if (validation.expectedStatus) {
      const expectedStatuses = Array.isArray(validation.expectedStatus) 
        ? validation.expectedStatus 
        : [validation.expectedStatus];
      
      if (expectedStatuses.includes(response.status)) {
        console.log(`  ${colors.green}✓${colors.reset} Status: ${response.status}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Status: ${response.status} (expected: ${expectedStatuses.join(' or ')})`);
        return false;
      }
    }
    
    // Validar headers
    if (validation.expectedHeaders) {
      for (const header of validation.expectedHeaders) {
        if (response.headers[header]) {
          console.log(`  ${colors.green}✓${colors.reset} Header: ${header}`);
        } else {
          console.log(`  ${colors.red}✗${colors.reset} Missing header: ${header}`);
          return false;
        }
      }
    }
    
    // Validar response
    if (validation.validateResponse) {
      const isValid = validation.validateResponse(response.data);
      if (isValid) {
        console.log(`  ${colors.green}✓${colors.reset} Response validation passed`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Response validation failed`);
        console.log(`    Data:`, JSON.stringify(response.data, null, 2));
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    return false;
  }
}

// Validar configuración de entorno
function validateEnvironment() {
  console.log(`\n${colors.blue}=== Validating Environment Configuration ===${colors.reset}\n`);
  
  const requiredEnvVars = [
    'NODE_ENV',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
    'FIREBASE_PROJECT_ID'
  ];
  
  let allPresent = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ${colors.green}✓${colors.reset} ${envVar}: Set`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${envVar}: Not set`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Validar servicios críticos
async function validateServices() {
  console.log(`\n${colors.blue}=== Validating Critical Services ===${colors.reset}`);
  
  const results = {
    passed: 0,
    failed: 0,
    services: []
  };
  
  for (const validation of validations) {
    const passed = await validateEndpoint(validation);
    results.services.push({
      name: validation.name,
      passed
    });
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

// Generar reporte
function generateReport(envValid, serviceResults) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    environment: {
      url: STAGING_URL,
      nodeEnv: process.env.NODE_ENV,
      valid: envValid
    },
    services: serviceResults,
    summary: {
      totalTests: serviceResults.services.length,
      passed: serviceResults.passed,
      failed: serviceResults.failed,
      successRate: ((serviceResults.passed / serviceResults.services.length) * 100).toFixed(2) + '%'
    }
  };
  
  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'staging-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Mostrar resumen
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}=== VALIDATION SUMMARY ===${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
  
  console.log(`Environment: ${envValid ? colors.green + '✓ VALID' : colors.red + '✗ INVALID'}${colors.reset}`);
  console.log(`Services Tested: ${serviceResults.services.length}`);
  console.log(`Passed: ${colors.green}${serviceResults.passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${serviceResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${serviceResults.passed === serviceResults.services.length ? colors.green : colors.yellow}${report.summary.successRate}${colors.reset}`);
  
  console.log(`\nReport saved to: ${colors.cyan}${reportPath}${colors.reset}`);
  
  // Exit code
  const exitCode = serviceResults.failed === 0 && envValid ? 0 : 1;
  
  if (exitCode === 0) {
    console.log(`\n${colors.green}✅ STAGING VALIDATION PASSED${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ STAGING VALIDATION FAILED${colors.reset}`);
  }
  
  return exitCode;
}

// Main
async function main() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}   ALTAMEDICA STAGING VALIDATION   ${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`\nTarget: ${colors.cyan}${STAGING_URL}${colors.reset}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  // Validar entorno
  const envValid = validateEnvironment();
  
  // Validar servicios
  const serviceResults = await validateServices();
  
  // Generar reporte
  const exitCode = generateReport(envValid, serviceResults);
  
  process.exit(exitCode);
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}