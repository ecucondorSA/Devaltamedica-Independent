import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  
  // Configuración específica para entorno médico
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  
  // Configuración de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configuración de errores médicos
  beforeSend(event, hint) {
    // Filtrar información sensible médica
    if (event.request?.data) {
      // Remover PHI de los logs
      const sanitizedData = sanitizeMedicalData(event.request.data);
      event.request.data = sanitizedData;
    }
    
    // Agregar contexto médico
    event.tags = {
      ...event.tags,
      service: 'medical-api-server',
      compliance: 'HIPAA'
    };
    
    return event;
  },
  
  // Configuración de integraciones
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Configuración de debugging
  debug: process.env.NODE_ENV !== 'production',
});

// Función para sanitizar datos médicos sensibles
function sanitizeMedicalData(data: any): any {
  if (typeof data === 'string') {
    // Remover patrones de PHI
    return data
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN
      .replace(/\b\d{10,11}\b/g, '[PHONE]') // Teléfonos
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Emails
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeMedicalData(value);
      }
    }
    return sanitized;
  }
  
  return data;
} 