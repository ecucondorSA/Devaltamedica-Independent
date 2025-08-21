/**
 * @fileoverview Hooks para manejo seguro de hidratación SSR
 * @module @altamedica/hooks/utils
 * @description Hooks utilitarios para evitar errores de hidratación en Next.js
 */

"use client";

import { useState, useEffect } from "react";

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
/**
 * Hook para detectar si el componente está en el cliente
 * Útil para evitar errores de hidratación en SSR
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para manejo seguro de estado con hidratación
 * Retorna un valor inicial hasta que el componente esté hidratado
 */
export function useHydrationSafe<T>(initialValue: T, clientValue: T): T {
  const [value, setValue] = useState<T>(initialValue);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      setValue(clientValue);
    }
  }, [isClient, clientValue]);

  return value;
}

/**
 * Hook para manejo seguro de localStorage con SSR
 * Evita errores de hidratación al acceder a localStorage
 */
export function useHydrationSafeLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        logger.error(`Error reading localStorage key "${key}":`, error);
      }
    }
  }, [key, isClient]);

  const setValue = (value: T | ((val: T) => T)) => {
    if (!isClient) return;

    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook para manejo seguro de sessionStorage con SSR
 * Evita errores de hidratación al acceder a sessionStorage
 */
export function useHydrationSafeSessionStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      try {
        const item = window.sessionStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        logger.error(`Error reading sessionStorage key "${key}":`, error);
      }
    }
  }, [key, isClient]);

  const setValue = (value: T | ((val: T) => T)) => {
    if (!isClient) return;

    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook para manejo seguro de window object con SSR
 * Retorna null hasta que el componente esté hidratado
 */
export function useHydrationSafeWindow(): Window | null {
  const [windowObj, setWindowObj] = useState<Window | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      setWindowObj(window);
    }
  }, [isClient]);

  return windowObj;
}

/**
 * Hook para manejo seguro de document object con SSR
 * Retorna null hasta que el componente esté hidratado
 */
export function useHydrationSafeDocument(): Document | null {
  const [documentObj, setDocumentObj] = useState<Document | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      setDocumentObj(document);
    }
  }, [isClient]);

  return documentObj;
}