// Implementación local de Sentry para ALTAMEDICA API Server
// Evita dependencias problemáticas del paquete shared

import { logger } from '@altamedica/shared/services/logger.service';

interface SentryConfig {
  service: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

interface MedicalUser {
  id: string;
  email: string;
  role: string;
  department?: string;
}

interface Breadcrumb {
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// Mock Sentry implementation for development
class MockSentry {
  private initialized = false;
  private user: MedicalUser | null = null;
  private breadcrumbs: Breadcrumb[] = [];

  init(config: SentryConfig) {
    this.initialized = true;
    logger.info(`🔧 Sentry inicializado para: ${config.service}`);
    logger.info(`📊 Traces Sample Rate: ${config.tracesSampleRate}`);
    logger.info(`📈 Profiles Sample Rate: ${config.profilesSampleRate}`);
  }

  captureError(error: Error, context?: Record<string, any>) {
    logger.error('🚨 Error capturado por Sentry:', {
      error: error.message,
      stack: error.stack,
      context,
      user: this.user,
      timestamp: new Date().toISOString()
    });
  }

  captureEvent(event: any) {
    logger.info('📝 Evento capturado por Sentry:', {
      event,
      user: this.user,
      timestamp: new Date().toISOString()
    });
  }

  setMedicalUser(user: MedicalUser) {
    this.user = user;
    logger.info('👤 Usuario médico establecido en Sentry:', user);
  }

  addMedicalBreadcrumb(breadcrumb: Breadcrumb) {
    this.breadcrumbs.push(breadcrumb);
    logger.info('🍞 Breadcrumb médico agregado:', breadcrumb);
  }

  startMedicalTransaction(name: string, operation: string) {
    logger.info('🔄 Transacción médica iniciada:', { name, operation });
    return {
      finish: () => logger.info('✅ Transacción médica finalizada:', { name, operation }),
      setTag: (key: string, value: string) => logger.info('🏷️ Tag establecido:', { key, value }),
      setData: (key: string, value: any) => logger.info('📊 Data establecida:', { key, value })
    };
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    logger.info(`💬 Mensaje capturado por Sentry [${level}]:`, message);
  }

  setUser(user: MedicalUser) {
    this.setMedicalUser(user);
  }

  addBreadcrumb(breadcrumb: Breadcrumb) {
    this.addMedicalBreadcrumb(breadcrumb);
  }

  startTransaction(name: string, operation: string) {
    return this.startMedicalTransaction(name, operation);
  }
}

// Instancia global de Sentry
const sentryInstance = new MockSentry();

/**
 * Initialize Sentry for API Server
 */
export function initSentry() {
  sentryInstance.init({
    service: 'altamedica-api-server',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// Export medical-specific Sentry utilities
export const {
  captureError,
  captureEvent,
  setMedicalUser,
  addMedicalBreadcrumb,
  startMedicalTransaction,
} = sentryInstance;

// Legacy compatibility exports
export const captureMessage = sentryInstance.captureMessage.bind(sentryInstance);
export const setUser = sentryInstance.setUser.bind(sentryInstance);
export const addBreadcrumb = sentryInstance.addBreadcrumb.bind(sentryInstance);
export const startTransaction = sentryInstance.startTransaction.bind(sentryInstance);

// Re-export for backward compatibility
export const Sentry = sentryInstance;
