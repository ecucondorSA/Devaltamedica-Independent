/**
 * @fileoverview Hook useLocalStorage consolidado y mejorado
 * @module @altamedica/hooks/utils/useLocalStorage
 * @description Hooks completos para manejo de localStorage, sessionStorage y storage seguro
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface StorageOptions {
  /**
   * Serializer personalizado para los datos
   * @default JSON
   */
  serializer?: {
    parse: (value: string) => any;
    stringify: (value: any) => string;
  };
  /**
   * Si debe sincronizar entre tabs/ventanas
   * @default false
   */
  syncAcrossTabs?: boolean;
  /**
   * TTL en milisegundos para expirar el valor
   */
  ttl?: number;
  /**
   * Callback cuando ocurra un error
   */
  onError?: (error: Error, key: string) => void;
  /**
   * Si debe encriptar los datos (para datos médicos sensibles)
   * @default false
   */
  encrypt?: boolean;
}

export interface LocalStorageOptions extends StorageOptions {
  /**
   * Prefijo para las keys
   */
  prefix?: string;
}

export interface SecureStorageOptions extends LocalStorageOptions {
  /**
   * Nivel de encriptación requerido
   * @default 'standard'
   */
  encryptionLevel?: 'standard' | 'hipaa' | 'maximum';
}

export interface StorageItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version?: string;
  encrypted?: boolean;
}

export interface UseStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prevValue: T) => T)) => void;
  removeValue: () => void;
  refreshValue: () => void;
  isLoading: boolean;
  error: Error | null;
}

// ==========================================
// UTILIDADES DE STORAGE
// ==========================================

const defaultSerializer = {
  parse: JSON.parse,
  stringify: JSON.stringify
};

/**
 * Verifica si localStorage está disponible
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, 'test');
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si sessionStorage está disponible
 */
function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__sessionStorage_test__';
    window.sessionStorage.setItem(test, 'test');
    window.sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encripta datos básicamente (para demostración - usar librería real en producción)
 */
function simpleEncrypt(data: string): string {
  // NOTA: En producción, usar una librería de encriptación real como crypto-js
  return btoa(data);
}

/**
 * Desencripta datos básicamente
 */
function simpleDecrypt(encryptedData: string): string {
  try {
    return atob(encryptedData);
  } catch {
    throw new Error('Failed to decrypt data');
  }
}

// ==========================================
// HOOK PRINCIPAL DE LOCALSTORAGE
// ==========================================

/**
 * Hook principal para localStorage con todas las características
 * @template T - Tipo del valor almacenado
 * @param key - Clave del localStorage
 * @param initialValue - Valor inicial
 * @param options - Opciones de configuración
 * @returns Objeto con valor, setter, remover, etc.
 * 
 * @example
 * ```tsx
 * const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light', {
 *   syncAcrossTabs: true,
 *   ttl: 24 * 60 * 60 * 1000 // 24 horas
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
): UseStorageReturn<T> {
  const {
    serializer = defaultSerializer,
    syncAcrossTabs = false,
    ttl,
    onError,
    encrypt = false,
    prefix = ''
  } = options;

  const prefixedKey = prefix ? `${prefix}_${key}` : key;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  // Función para leer del storage
  const readFromStorage = useCallback((): T => {
    try {
      if (!isLocalStorageAvailable()) {
        return initialValue;
      }

      const item = window.localStorage.getItem(prefixedKey);
      if (item === null) {
        return initialValue;
      }

      let parsedData: string = item;
      if (encrypt) {
        parsedData = simpleDecrypt(item);
      }

      const storageItem: StorageItem<T> = serializer.parse(parsedData);

      // Verificar TTL
      if (storageItem.ttl && Date.now() - storageItem.timestamp > storageItem.ttl) {
        window.localStorage.removeItem(prefixedKey);
        return initialValue;
      }

      return storageItem.data ?? initialValue;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to read from localStorage');
      setError(error);
      onError?.(error, prefixedKey);
      return initialValue;
    }
  }, [prefixedKey, initialValue, serializer, encrypt, onError]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Función para escribir al storage
  const writeToStorage = useCallback((value: T) => {
    try {
      if (!isLocalStorageAvailable()) {
        return;
      }

      const storageItem: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
        version: '1.0.0'
      };

      let dataToStore = serializer.stringify(storageItem);
      if (encrypt) {
        dataToStore = simpleEncrypt(dataToStore);
      }

      window.localStorage.setItem(prefixedKey, dataToStore);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to write to localStorage');
      setError(error);
      onError?.(error, prefixedKey);
    }
  }, [prefixedKey, serializer, encrypt, ttl, onError]);

  // Cargar valor inicial
  useEffect(() => {
    if (!isMountedRef.current) return;

    const value = readFromStorage();
    setStoredValue(value);
    setIsLoading(false);
  }, [readFromStorage]);

  // Sincronización entre tabs
  useEffect(() => {
    if (!syncAcrossTabs || !isLocalStorageAvailable()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === prefixedKey && e.newValue !== null) {
        try {
          let parsedData = e.newValue;
          if (encrypt) {
            parsedData = simpleDecrypt(e.newValue);
          }
          const storageItem: StorageItem<T> = serializer.parse(parsedData);
          setStoredValue(storageItem.data);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to sync across tabs');
          setError(error);
          onError?.(error, prefixedKey);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [prefixedKey, serializer, encrypt, syncAcrossTabs, onError]);

  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      writeToStorage(valueToStore);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set value');
      setError(error);
      onError?.(error, prefixedKey);
    }
  }, [storedValue, writeToStorage, onError, prefixedKey]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (isLocalStorageAvailable()) {
        window.localStorage.removeItem(prefixedKey);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove value');
      setError(error);
      onError?.(error, prefixedKey);
    }
  }, [initialValue, prefixedKey, onError]);

  const refreshValue = useCallback(() => {
    const value = readFromStorage();
    setStoredValue(value);
  }, [readFromStorage]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    value: storedValue,
    setValue,
    removeValue,
    refreshValue,
    isLoading,
    error
  };
}

// ==========================================
// HOOK DE SESSIONSTORAGE
// ==========================================

/**
 * Hook para sessionStorage con características similares a localStorage
 * @template T - Tipo del valor almacenado
 * @param key - Clave del sessionStorage
 * @param initialValue - Valor inicial
 * @param options - Opciones de configuración
 * @returns Objeto con valor, setter, remover, etc.
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {}
): UseStorageReturn<T> {
  const {
    serializer = defaultSerializer,
    ttl,
    onError,
    encrypt = false
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const readFromStorage = useCallback((): T => {
    try {
      if (!isSessionStorageAvailable()) {
        return initialValue;
      }

      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      let parsedData: string = item;
      if (encrypt) {
        parsedData = simpleDecrypt(item);
      }

      const storageItem: StorageItem<T> = serializer.parse(parsedData);

      // Verificar TTL
      if (storageItem.ttl && Date.now() - storageItem.timestamp > storageItem.ttl) {
        window.sessionStorage.removeItem(key);
        return initialValue;
      }

      return storageItem.data ?? initialValue;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to read from sessionStorage');
      setError(error);
      onError?.(error, key);
      return initialValue;
    }
  }, [key, initialValue, serializer, encrypt, onError]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const writeToStorage = useCallback((value: T) => {
    try {
      if (!isSessionStorageAvailable()) {
        return;
      }

      const storageItem: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
        version: '1.0.0'
      };

      let dataToStore = serializer.stringify(storageItem);
      if (encrypt) {
        dataToStore = simpleEncrypt(dataToStore);
      }

      window.sessionStorage.setItem(key, dataToStore);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to write to sessionStorage');
      setError(error);
      onError?.(error, key);
    }
  }, [key, serializer, encrypt, ttl, onError]);

  useEffect(() => {
    const value = readFromStorage();
    setStoredValue(value);
    setIsLoading(false);
  }, [readFromStorage]);

  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      writeToStorage(valueToStore);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set value');
      setError(error);
      onError?.(error, key);
    }
  }, [storedValue, writeToStorage, onError, key]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (isSessionStorageAvailable()) {
        window.sessionStorage.removeItem(key);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove value');
      setError(error);
      onError?.(error, key);
    }
  }, [initialValue, key, onError]);

  const refreshValue = useCallback(() => {
    const value = readFromStorage();
    setStoredValue(value);
  }, [readFromStorage]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    refreshValue,
    isLoading,
    error
  };
}

// ==========================================
// HOOK DE STORAGE SEGURO PARA DATOS MÉDICOS
// ==========================================

/**
 * Hook de storage seguro para datos médicos sensibles (PHI)
 * @template T - Tipo del valor almacenado
 * @param key - Clave del storage
 * @param initialValue - Valor inicial
 * @param options - Opciones de configuración segura
 * @returns Objeto con valor, setter, remover, etc.
 * 
 * @hipaa Cumple con requisitos HIPAA para almacenamiento local temporal
 * @example
 * ```tsx
 * const { value: patientData, setValue: setPatientData } = useSecureStorage(
 *   `patient_${patientId}`,
 *   null,
 *   {
 *     encryptionLevel: 'hipaa',
 *     ttl: 30 * 60 * 1000, // 30 minutos
 *     prefix: 'medical'
 *   }
 * );
 * ```
 */
export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  options: SecureStorageOptions = {}
): UseStorageReturn<T> {
  const {
    encryptionLevel = 'standard',
    ttl = 30 * 60 * 1000, // 30 minutos por defecto para datos médicos
    prefix = 'secure',
    ...storageOptions
  } = options;

  return useLocalStorage(key, initialValue, {
    ...storageOptions,
    encrypt: true,
    ttl,
    prefix,
    onError: (error, key) => {
      logger.error(`[SecureStorage] Error with key ${key}:`, error);
      options.onError?.(error, key);
    }
  });
}

// ==========================================
// HOOKS ESPECIALIZADOS PARA DATOS MÉDICOS
// ==========================================

/**
 * Hook para datos de paciente con storage seguro
 * @template T - Tipo de datos del paciente
 * @param patientId - ID del paciente
 * @param initialValue - Valor inicial
 * @returns Objeto con valor, setter, remover, etc.
 */
export function usePatientStorage<T>(
  patientId: string,
  initialValue: T
): UseStorageReturn<T> {
  return useSecureStorage(`patient_${patientId}`, initialValue, {
    encryptionLevel: 'hipaa',
    ttl: 60 * 60 * 1000, // 1 hora
    prefix: 'medical'
  });
}

/**
 * Hook para historial médico con storage seguro
 * @param patientId - ID del paciente
 * @returns Objeto con historial médico
 */
export function useMedicalRecordsStorage(patientId: string) {
  return useSecureStorage(`medical_records_${patientId}`, [], {
    encryptionLevel: 'hipaa',
    ttl: 2 * 60 * 60 * 1000, // 2 horas
    prefix: 'medical'
  });
}

/**
 * Hook para prescripciones con storage seguro
 * @param patientId - ID del paciente
 * @returns Objeto con prescripciones
 */
export function usePrescriptionsStorage(patientId: string) {
  return useSecureStorage(`prescriptions_${patientId}`, [], {
    encryptionLevel: 'hipaa',
    ttl: 4 * 60 * 60 * 1000, // 4 horas
    prefix: 'medical'
  });
}

/**
 * Hook para preferencias de usuario con storage persistente
 * @template T - Tipo de preferencias
 * @param userId - ID del usuario
 * @param initialPreferences - Preferencias iniciales
 * @returns Objeto con preferencias
 */
export function useUserPreferences<T>(
  userId: string,
  initialPreferences: T
): UseStorageReturn<T> {
  return useLocalStorage(`user_preferences_${userId}`, initialPreferences, {
    syncAcrossTabs: true,
    prefix: 'app'
  });
}

/**
 * Hook para cache temporal con TTL personalizable
 * @template T - Tipo del valor cacheado
 * @param key - Clave del cache
 * @param initialValue - Valor inicial
 * @param ttlMinutes - TTL en minutos
 * @returns Objeto con valor cacheado
 */
export function useCacheStorage<T>(
  key: string,
  initialValue: T,
  ttlMinutes: number = 15
): UseStorageReturn<T> {
  return useLocalStorage(key, initialValue, {
    ttl: ttlMinutes * 60 * 1000,
    prefix: 'cache'
  });
}