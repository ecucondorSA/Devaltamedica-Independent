'use client';

import { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Hook para detectar y manejar errores de hidratación
 * Previene diferencias entre servidor y cliente
 */
export function useHydrationSafe<T>(
  clientValue: T,
  serverValue: T = clientValue
) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? clientValue : serverValue;
}

/**
 * Hook para crear componentes seguros contra hidratación
 */
export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      return effect();
    }
  }, [isClient, ...(deps || [])]);
}

/**
 * Hook para detectar si estamos en el cliente
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para manejar valores que difieren entre servidor y cliente
 */
export function useClientValue<T>(getValue: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(getValue());
  }, [getValue]);

  return value;
}

/**
 * Hook para logging de errores de hidratación
 */
export function useHydrationErrorLogger() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Hydration') || 
          event.error?.message?.includes('server HTML')) {
        console.group('💧 Error de Hidratación Detectado');
        logger.error('Error:', event.error);
        logger.error('Filename:', event.filename);
        logger.error('Line:', event.lineno);
        logger.error('Column:', event.colno);
        console.groupEnd();
        
        // Enviar a servicio de monitoreo si existe
        if (typeof window !== 'undefined' && (window as any).trackError) {
          (window as any).trackError({
            type: 'hydration',
            error: event.error,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Hydration') || 
          event.reason?.message?.includes('server HTML')) {
        console.group('💧 Promise Rejection - Hidratación');
        logger.error('Reason:', event.reason);
        console.groupEnd();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}
