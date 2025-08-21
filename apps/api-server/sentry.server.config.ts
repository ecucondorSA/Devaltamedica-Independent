import * as Sentry from '@sentry/nextjs';

import { logger } from '@altamedica/shared/services/logger.service';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configuración específica para entorno médico
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  
  // Configuración de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configuración de errores médicos críticos
  beforeSend(event, hint) {
    // Filtrar información sensible médica
    if (event.request?.data) {
      const sanitizedData = sanitizeMedicalData(event.request.data);
      event.request.data = sanitizedData;
    }
    
    // Agregar contexto médico
    event.tags = {
      ...event.tags,
      service: 'medical-api-server',
      compliance: 'HIPAA',
      component: 'server'
    };
    
    // Alertar sobre errores críticos médicos
    if (event.level === 'fatal' || event.level === 'error') {
      logger.error('🚨 ERROR MÉDICO CRÍTICO:', {
        message: event.message,
        timestamp: event.timestamp,
        user: event.user?.id,
        tags: event.tags
      });
    }
    
    return event;
  },
  
  // Configuración de integraciones
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  
  // Configuración de debugging
  debug: process.env.NODE_ENV !== 'production',
  
  // Configuración de rate limiting
  maxBreadcrumbs: 50
});

// Función para sanitizar datos médicos sensibles
function sanitizeMedicalData(data: any): any {
  if (typeof data === 'string') {
    // Remover patrones de PHI
    return data
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN
      .replace(/\b\d{10,11}\b/g, '[PHONE]') // Teléfonos
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE]'); // Fechas
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('ssn') ||
          key.toLowerCase().includes('social') ||
          key.toLowerCase().includes('insurance')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeMedicalData(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

// Función para capturar errores médicos específicos
export function captureMedicalError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    tags: {
      ...context,
      errorType: 'medical',
      compliance: 'HIPAA'
    },
    level: 'error'
  });
}

// Función para capturar eventos de seguridad médica
export function captureSecurityEvent(event: string, details?: Record<string, any>) {
  Sentry.captureMessage(event, {
    level: 'warning',
    tags: {
      ...details,
      eventType: 'security',
      compliance: 'HIPAA'
    }
  });
} 