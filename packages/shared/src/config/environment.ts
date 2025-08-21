/**
 * Configuración centralizada de entorno para todas las aplicaciones
 * HIPAA Compliant - No exponer información sensible
 */

export const Environment = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888',
  
  // App URLs
  PATIENTS_APP_URL: process.env.NEXT_PUBLIC_PATIENTS_URL || 'http://localhost:3003',
  DOCTORS_APP_URL: process.env.NEXT_PUBLIC_DOCTORS_URL || 'http://localhost:3002',
  COMPANIES_APP_URL: process.env.NEXT_PUBLIC_COMPANIES_URL || 'http://localhost:3004',
  ADMIN_APP_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3005',
  WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
  
  // Security
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '900000'), // 15 min
  MFA_REQUIRED_ROLES: (process.env.MFA_REQUIRED_ROLES || 'ADMIN,DOCTOR').split(','),
  ENABLE_AUDIT_LOGS: process.env.ENABLE_AUDIT_LOGS !== 'false',
  
  // Feature Flags
  ENABLE_TELEMEDICINE: process.env.NEXT_PUBLIC_ENABLE_TELEMEDICINE !== 'false',
  ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI !== 'false',
  ENABLE_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS !== 'false',
  
  // Compliance
  HIPAA_MODE: process.env.HIPAA_MODE !== 'false',
  ENCRYPT_PHI: process.env.ENCRYPT_PHI !== 'false',
  
  // Development
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV !== 'production',
} as const;

// Type-safe environment validation
export function validateEnvironment(): void {
  const required = ['API_URL', 'WS_URL'];
  const missing = required.filter(key => !Environment[key as keyof typeof Environment]);
  
  if (missing.length > 0 && Environment.IS_PRODUCTION) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Helper para obtener URL base según el entorno
export function getApiUrl(): string {
  return Environment.API_URL;
}

export function getWebSocketUrl(): string {
  return Environment.WS_URL;
}

// Helper para verificar si un rol requiere MFA
export function requiresMFA(role: string): boolean {
  return Environment.MFA_REQUIRED_ROLES.includes(role.toUpperCase());
}