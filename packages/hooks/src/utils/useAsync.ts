/**
 * @fileoverview Hook useAsync para manejo de operaciones asíncronas
 * @module @altamedica/hooks/utils/useAsync
 * @description Hook completo para manejar estados async con loading, error y datos
 */

import { useCallback, useEffect, useRef, useState } from 'react';

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
// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface AsyncState<T> {
  /** Datos resultado de la operación */
  data: T | null;
  /** Estado de carga */
  loading: boolean;
  /** Error si ocurrió */
  error: Error | null;
  /** Si la operación se ejecutó al menos una vez */
  called: boolean;
}

export interface AsyncOptions<T> {
  /** Si debe ejecutarse inmediatamente al montar */
  immediate?: boolean;
  /** Valor inicial de los datos */
  initialData?: T;
  /** Callback cuando se complete exitosamente */
  onSuccess?: (data: T) => void;
  /** Callback cuando ocurra un error */
  onError?: (error: Error) => void;
  /** Callback cuando cambie el estado de loading */
  onLoadingChange?: (loading: boolean) => void;
  /** Dependencias para re-ejecutar automáticamente */
  deps?: any[];
  /** Tiempo en ms para considerar timeout (0 = sin timeout) */
  timeout?: number;
}

export interface UseAsyncReturn<T, P extends any[] = []> extends AsyncState<T> {
  /** Ejecutar la función async */
  execute: (...params: P) => Promise<T | undefined>;
  /** Resetear estado */
  reset: () => void;
  /** Cancelar operación en curso */
  cancel: () => void;
  /** Si hay una operación en curso que se puede cancelar */
  canCancel: boolean;
}

// ==========================================
// HOOK PRINCIPAL USEASYNC
// ==========================================

/**
 * Hook para manejar operaciones asíncronas con estados completos
 * @template T - Tipo de datos de respuesta
 * @template P - Tipo de parámetros de la función
 * @param asyncFunction - Función asíncrona a ejecutar
 * @param options - Opciones de configuración
 * @returns Estado y controles de la operación async
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(
 *   async (patientId: string) => {
 *     const response = await fetch(`/api/patients/${patientId}`);
 *     return response.json();
 *   },
 *   {
 *     onSuccess: (patient) => logger.info('Patient loaded:', patient),
 *     onError: (error) => logger.error('Failed to load patient:', error)
 *   }
 * );
 * 
 * // Usar
 * const handleLoadPatient = () => execute('patient-123');
 * ```
 */
export function useAsync<T, P extends any[] = []>(
  asyncFunction: (...params: P) => Promise<T>,
  options: AsyncOptions<T> = {}
): UseAsyncReturn<T, P> {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
    onLoadingChange,
    deps = [],
    timeout = 0
  } = options;

  // Estado del async
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    called: false
  });

  // Referencias para cleanup y control
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Función para ejecutar la operación async
  const execute = useCallback(
    async (...params: P): Promise<T | undefined> => {
      // Cancelar operación anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      
      // Actualizar estado inicial
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        called: true
      }));

      onLoadingChange?.(true);

      try {
        // Configurar timeout si se especificó
        if (timeout > 0) {
          timeoutRef.current = setTimeout(() => {
            abortControllerRef.current?.abort();
          }, timeout);
        }

        // Ejecutar función async
        const result = await asyncFunction(...params);

        // Verificar si la operación fue cancelada
        if (abortControllerRef.current?.signal.aborted || !isMountedRef.current) {
          return undefined;
        }

        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Actualizar estado con éxito
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null
        }));

        onLoadingChange?.(false);
        onSuccess?.(result);

        return result;
      } catch (err) {
        // Verificar si fue cancelado
        if (abortControllerRef.current?.signal.aborted || !isMountedRef.current) {
          return undefined;
        }

        const error = err instanceof Error ? err : new Error('Unknown async error');
        
        // Manejar timeout específicamente
        if (error.name === 'AbortError' && timeout > 0) {
          error.message = `Operation timed out after ${timeout}ms`;
        }

        // Actualizar estado con error
        setState(prev => ({
          ...prev,
          data: null,
          loading: false,
          error
        }));

        onLoadingChange?.(false);
        onError?.(error);

        throw error;
      }
    },
    [asyncFunction, onSuccess, onError, onLoadingChange, timeout]
  );

  // Función para resetear estado
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      called: false
    });
  }, [initialData]);

  // Función para cancelar operación
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      loading: false
    }));

    onLoadingChange?.(false);
  }, [onLoadingChange]);

  // Efecto para ejecución inmediata o por dependencias
  useEffect(() => {
    if (immediate) {
      // Ejecuta solo si la función no requiere parámetros (mejor esfuerzo)
      try {
        // @ts-expect-error: ejecución sin parámetros cuando procede
        execute();
      } catch {
        // Si requiere parámetros, el consumidor deberá llamarla manualmente
      }
    } else if (deps.length > 0 && state.called) {
      try {
        // Re-ejecuta sin parámetros; si no aplica, el consumidor controla manualmente
        // @ts-expect-error intencional
        execute();
      } catch {
        // no-op
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    reset,
    cancel,
    canCancel: abortControllerRef.current !== null
  };
}

// ==========================================
// HOOKS ESPECIALIZADOS
// ==========================================

/**
 * Hook para operaciones async simples con reintentos
 * @template T - Tipo de datos de respuesta
 * @param asyncFunction - Función asíncrona
 * @param maxRetries - Número máximo de reintentos
 * @param retryDelay - Delay entre reintentos en ms
 * @returns Estado async con capacidad de reintento
 * 
 * @example
 * ```tsx
 * const { data, loading, error, retry, retryCount } = useAsyncWithRetry(
 *   () => fetchPatientData(patientId),
 *   3, // 3 reintentos
 *   1000 // 1 segundo entre reintentos
 * );
 * ```
 */
export function useAsyncWithRetry<T>(
  asyncFunction: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  const [retryCount, setRetryCount] = useState(0);
  
  const { data, loading, error, execute, reset } = useAsync(
    async () => {
      let lastError: Error;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await asyncFunction();
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          
          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      throw lastError!;
    },
    {
      onSuccess: () => setRetryCount(0),
      onError: () => setRetryCount(0)
    }
  );

  const retry = useCallback(() => {
    setRetryCount(0);
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
    retryCount,
    maxRetries
  };
}

/**
 * Hook para múltiples operaciones async en paralelo
 * @template T - Tipo de datos de cada operación
 * @param asyncFunctions - Array de funciones asíncronas
 * @param options - Opciones de configuración
 * @returns Estado combinado de todas las operaciones
 * 
 * @example
 * ```tsx
 * const { data, loading, errors, execute } = useAsyncMultiple([
 *   () => fetchPatient(patientId),
 *   () => fetchAppointments(patientId),
 *   () => fetchPrescriptions(patientId)
 * ]);
 * 
 * // data será [patient, appointments, prescriptions]
 * ```
 */
export function useAsyncMultiple<T>(
  asyncFunctions: (() => Promise<T>)[],
  options: Omit<AsyncOptions<T[]>, 'initialData'> = {}
) {
  const { data, loading, error, execute, reset } = useAsync(
    async () => {
      const results = await Promise.allSettled(
        asyncFunctions.map(fn => fn())
      );

      const successes: T[] = [];
      const errors: Error[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successes[index] = result.value;
        } else {
          errors[index] = result.reason instanceof Error 
            ? result.reason 
            : new Error(`Function ${index} failed`);
        }
      });

      if (errors.length > 0 && successes.length === 0) {
        throw new Error(`All operations failed: ${errors.map(e => e.message).join(', ')}`);
      }

      return successes;
    },
    options
  );

  return {
    data,
    loading,
    error,
    errors: error ? [error] : [],
    execute,
    reset
  };
}

/**
 * Hook para operaciones async con polling (consulta periódica)
 * @template T - Tipo de datos de respuesta
 * @param asyncFunction - Función asíncrona
 * @param interval - Intervalo en ms (0 = sin polling)
 * @param options - Opciones adicionales
 * @returns Estado async con controles de polling
 * 
 * @example
 * ```tsx
 * const { data, loading, startPolling, stopPolling, isPolling } = useAsyncPolling(
 *   () => fetchVitalSigns(patientId),
 *   5000, // cada 5 segundos
 *   { immediate: true }
 * );
 * ```
 */
export function useAsyncPolling<T>(
  asyncFunction: () => Promise<T>,
  interval: number = 0,
  options: AsyncOptions<T> = {}
) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const asyncState = useAsync(asyncFunction, {
    ...options,
    immediate: options.immediate && interval > 0
  });

  const startPolling = useCallback(() => {
    if (interval <= 0) return;
    
    setIsPolling(true);
    
    // Ejecutar inmediatamente
    asyncState.execute();
    
    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      asyncState.execute();
    }, interval);
  }, [interval, asyncState]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start si immediate y interval > 0
  useEffect(() => {
    if (options.immediate && interval > 0) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [options.immediate, interval, startPolling, stopPolling]);

  return {
    ...asyncState,
    isPolling,
    startPolling,
    stopPolling
  };
}

// ==========================================
// HOOKS MÉDICOS ESPECIALIZADOS
// ==========================================

/**
 * Hook para cargar datos de paciente con cache
 * @param patientId - ID del paciente
 * @param cacheTime - Tiempo de cache en ms
 * @returns Estado async del paciente
 */
export function useAsyncPatientData(
  patientId: string,
  cacheTime: number = 5 * 60 * 1000 // 5 minutos
) {
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  return useAsync(
    async () => {
      // Verificar cache
      const cached = cacheRef.current.get(patientId);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }

      // Simular llamada a API (reemplazar con llamada real)
      const response = await fetch(`/api/patients/${patientId}`);
      const data = await response.json();

      // Guardar en cache
      cacheRef.current.set(patientId, {
        data,
        timestamp: Date.now()
      });

      return data;
    },
    {
      deps: [patientId],
      immediate: !!patientId
    }
  );
}

/**
 * Hook para monitoreo de signos vitales en tiempo real
 * @param patientId - ID del paciente
 * @param interval - Intervalo de actualización en ms
 * @returns Estado async con signos vitales
 */
export function useAsyncVitalSigns(
  patientId: string,
  interval: number = 30000 // 30 segundos
) {
  return useAsyncPolling(
    async () => {
      const response = await fetch(`/api/patients/${patientId}/vitals`);
      return response.json();
    },
    interval,
    {
      immediate: !!patientId,
      onError: (error) => {
        logger.error('Failed to fetch vital signs:', error);
      }
    }
  );
}