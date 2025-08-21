'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Wrapper para Context.Consumer que previene errores de render
 */
interface SafeContextConsumerProps<T> {
  context: React.Context<T>;
  children: (value: T) => ReactNode;
  fallback?: ReactNode;
}

export function SafeContextConsumer<T>({
  context,
  children,
  fallback = null
}: SafeContextConsumerProps<T>) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state cuando el contexto cambia
    setHasError(false);
  }, [context]);

  try {
    return (
      <context.Consumer>
        {(value) => {
          try {
            // Verificar que children sea una función
            if (typeof children !== 'function') {
              logger.error('SafeContextConsumer: children debe ser una función');
              return fallback;
            }
            
            return children(value);
          } catch (error) {
            logger.error('Error en render function del Context Consumer:', error);
            setHasError(true);
            return fallback;
          }
        }}
      </context.Consumer>
    );
  } catch (error) {
    logger.error('Error en SafeContextConsumer:', error);
    return fallback;
  }
}

/**
 * Hook seguro para useContext con manejo de errores
 */
export function useSafeContext<T>(
  context: React.Context<T>,
  errorMessage?: string
): T | null {
  try {
    const value = useContext(context);
    
    // Verificar si el contexto está definido
    if (value === undefined && errorMessage) {
      logger.warn(errorMessage);
      return null;
    }
    
    return value;
  } catch (error) {
    logger.error('Error en useSafeContext:', error);
    return null;
  }
}

/**
 * Factory para crear contextos seguros
 */
export function createSafeContext<T>(
  defaultValue: T,
  contextName?: string
) {
  const context = createContext<T>(defaultValue);
  
  if (contextName) {
    context.displayName = contextName;
  }

  const useSafeContextHook = () => {
    return useSafeContext(
      context,
      `${contextName || 'Context'} debe usarse dentro de su Provider`
    );
  };

  return {
    Context: context,
    Provider: context.Provider,
    Consumer: context.Consumer,
    useSafeContext: useSafeContextHook
  };
}

/**
 * Provider wrapper que previene errores de re-render
 */
interface SafeProviderProps<T> {
  context: React.Context<T>;
  value: T;
  children: ReactNode;
}

export function SafeProvider<T>({
  context: Context,
  value,
  children
}: SafeProviderProps<T>) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Marcar como listo en el próximo tick
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <div suppressHydrationWarning>Inicializando...</div>;
  }

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export default SafeContextConsumer;
