import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Hook personalizado para usar Sentry en componentes React
 * Proporciona funciones para capturar errores, mensajes y métricas
 */

export function useSentry() {
  /**
   * Capturar error manualmente
   */
  const captureError = useCallback((error: Error, context?: any) => {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        source: 'react-component',
        component: 'unknown',
      },
    });
  }, []);

  /**
   * Capturar mensaje informativo
   */
  const captureMessage = useCallback((
    message: string, 
    level: Sentry.SeverityLevel = 'info', 
    context?: any
  ) => {
    Sentry.captureMessage(message, {
      level,
      extra: context,
      tags: {
        source: 'react-component',
        component: 'unknown',
      },
    });
  }, []);

  /**
   * Configurar usuario en Sentry
   */
  const setUser = useCallback((user: { id: string; email?: string; role?: string }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.email,
      ip_address: '{{auto}}',
    });

    Sentry.setTag('user.role', user.role);
  }, []);

  /**
   * Configurar contexto adicional
   */
  const setContext = useCallback((name: string, context: any) => {
    Sentry.setContext(name, context);
  }, []);

  /**
   * Agregar breadcrumb
   */
  const addBreadcrumb = useCallback((breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb);
  }, []);

  /**
   * Crear transacción personalizada
   */
  const startTransaction = useCallback((name: string, operation: string) => {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }, []);

  /**
   * Capturar métrica de performance
   */
  const capturePerformance = useCallback((name: string, value: number, unit: string = 'ms') => {
    Sentry.metrics.gauge(name, value, {
      unit,
      tags: {
        source: 'react-component',
      },
    });
  }, []);

  /**
   * Capturar evento de usuario
   */
  const captureUserEvent = useCallback((event: string, properties?: Record<string, any>) => {
    Sentry.captureEvent({
      message: `User Event: ${event}`,
      level: 'info',
      tags: {
        event_type: 'user_action',
        event_name: event,
      },
      extra: properties,
    });
  }, []);

  /**
   * Configurar componente específico
   */
  const setComponent = useCallback((componentName: string) => {
    Sentry.setTag('component', componentName);
  }, []);

  return {
    captureError,
    captureMessage,
    setUser,
    setContext,
    addBreadcrumb,
    startTransaction,
    capturePerformance,
    captureUserEvent,
    setComponent,
  };
}

export default useSentry; 