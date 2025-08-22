/**
 * @fileoverview Hook useDebounce consolidado y mejorado
 * @module @altamedica/hooks/utils/useDebounce
 * @description Colección completa de hooks de debounce para diferentes casos de uso
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface DebounceOptions {
  /**
   * Retraso en milisegundos para el debounce
   * @default 300
   */
  delay?: number;
  /**
   * Si debe ejecutarse inmediatamente en la primera llamada
   * @default false
   */
  leading?: boolean;
  /**
   * Si debe ejecutarse en el trailing edge
   * @default true
   */
  trailing?: boolean;
  /**
   * Valor máximo de delay (para evitar delays excesivos)
   * @default 5000
   */
  maxDelay?: number;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

// ==========================================
// HOOK PRINCIPAL DE DEBOUNCE
// ==========================================

/**
 * Hook básico de debounce para valores
 * @template T - Tipo del valor a hacer debounce
 * @param value - Valor a hacer debounce
 * @param delay - Retraso en milisegundos
 * @returns Valor con debounce aplicado
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // Buscar cuando el término cambie (con debounce)
 *   if (debouncedSearchTerm) {
 *     searchPatients(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==========================================
// HOOK DE DEBOUNCE PARA CALLBACKS
// ==========================================

/**
 * Hook de debounce para funciones/callbacks
 * @template T - Tipo de la función
 * @param callback - Función a hacer debounce
 * @param options - Opciones de configuración
 * @returns Función con debounce aplicado
 * 
 * @example
 * ```tsx
 * const debouncedSave = useDebounceCallback(
 *   (data: PatientData) => savePatient(data),
 *   { delay: 1000, leading: false, trailing: true }
 * );
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { delay = 300, leading = false, trailing = true, maxDelay = 5000 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T> | undefined>(undefined);

  const invokeFunction = useCallback(() => {
    if (argsRef.current) {
      callback(...argsRef.current);
      lastInvokeTimeRef.current = Date.now();
    }
  }, [callback]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTimeRef.current;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    return (
      lastCallTimeRef.current === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxDelay !== undefined && timeSinceLastInvoke >= maxDelay)
    );
  }, [delay, maxDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastCallTimeRef.current = 0;
    lastInvokeTimeRef.current = 0;
    argsRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      invokeFunction();
    }
  }, [invokeFunction]);

  const pending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastCallTimeRef.current = time;
      argsRef.current = args;

      if (isInvoking) {
        if (timeoutRef.current === null && leading) {
          lastInvokeTimeRef.current = time;
          callback(...args);
        }
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (trailing) {
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            invokeFunction();
          }, delay);
        }
      } else if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          invokeFunction();
        }, delay);
      }
    },
    [callback, delay, leading, trailing, shouldInvoke, invokeFunction]
  ) as DebouncedFunction<T>;

  // Agregar métodos adicionales
  debouncedFunction.cancel = cancel;
  debouncedFunction.flush = flush;
  debouncedFunction.pending = pending;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return debouncedFunction;
}

// ==========================================
// HOOKS ESPECIALIZADOS
// ==========================================

/**
 * Hook de debounce específico para búsquedas
 * @param initialValue - Valor inicial
 * @param delay - Retraso en milisegundos
 * @returns [término actual, término con debounce, setter]
 * 
 * @example
 * ```tsx
 * const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebounceSearch('', 300);
 * ```
 */
export function useDebounceSearch(
  initialValue: string = '',
  delay: number = 300
): [string, string, (value: string) => void] {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  return [searchTerm, debouncedSearchTerm, setSearchTerm];
}

/**
 * Hook de debounce para llamadas a API con estado de carga y error
 * @template T - Tipo de respuesta de la API
 * @param apiCall - Función de llamada a la API
 * @param options - Opciones de configuración
 * @returns [función de llamada, datos, cargando, error, cancelar]
 * 
 * @example
 * ```tsx
 * const [searchPatients, data, loading, error, cancel] = useDebounceApiCall(
 *   (query: string) => patientAPI.search(query),
 *   { delay: 500 }
 * );
 * ```
 */
export function useDebounceApiCall<T>(
  apiCall: (params: any) => Promise<T>,
  options: DebounceOptions = {}
): [
  (params: any) => void,
  T | null,
  boolean,
  string | null,
  () => void
] {
  const { delay = 500 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedApiCall = useDebounceCallback(
    async (params: any) => {
      try {
        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const result = await apiCall(params);
        
        if (!abortControllerRef.current?.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!abortControllerRef.current?.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Error en la llamada a la API');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    { delay, trailing: true }
  );

  const cancel = useCallback(() => {
    debouncedApiCall.cancel();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, [debouncedApiCall]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedApiCall, data, loading, error, cancel];
}

/**
 * Hook de debounce para formularios con auto-guardado
 * @template T - Tipo de los valores del formulario
 * @param initialValues - Valores iniciales
 * @param saveFunction - Función de guardado
 * @param options - Opciones de configuración
 * @returns [valores actuales, valores con debounce, actualizar, resetear, guardando, error]
 * 
 * @example
 * ```tsx
 * const [values, debouncedValues, updateForm, resetForm, saving, error] = 
 *   useDebounceForm(
 *     { name: '', email: '' },
 *     (data) => savePatientData(data),
 *     { delay: 1000 }
 *   );
 * ```
 */
export function useDebounceForm<T extends Record<string, any>>(
  initialValues: T,
  saveFunction?: (data: T) => Promise<void>,
  options: DebounceOptions = {}
): [
  T,
  T,
  (values: Partial<T>) => void,
  () => void,
  boolean,
  string | null
] {
  const { delay = 1000 } = options;
  const [formValues, setFormValues] = useState<T>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedFormValues = useDebounce(formValues, delay);

  const updateForm = useCallback((values: Partial<T>) => {
    setFormValues(prev => ({ ...prev, ...values }));
  }, []);

  const resetForm = useCallback(() => {
    setFormValues(initialValues);
    setError(null);
  }, [initialValues]);

  // Auto-save cuando cambien los valores con debounce
  useEffect(() => {
    if (!saveFunction) return;
    
    // No guardar en la primera carga
    if (JSON.stringify(debouncedFormValues) === JSON.stringify(initialValues)) {
      return;
    }

    const autoSave = async () => {
      try {
        setSaving(true);
        setError(null);
        await saveFunction(debouncedFormValues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      } finally {
        setSaving(false);
      }
    };

    autoSave();
  }, [debouncedFormValues, saveFunction, initialValues]);

  return [formValues, debouncedFormValues, updateForm, resetForm, saving, error];
}

/**
 * Hook de debounce para validación de campos
 * @template T - Tipo del valor a validar
 * @param validator - Función de validación
 * @param options - Opciones de configuración
 * @returns [función de validación, error, validando]
 * 
 * @example
 * ```tsx
 * const [validateEmail, emailError, validatingEmail] = useDebounceValidation(
 *   (email: string) => email.includes('@') ? null : 'Email inválido',
 *   { delay: 300 }
 * );
 * ```
 */
export function useDebounceValidation<T>(
  validator: (value: T) => string | null | Promise<string | null>,
  options: DebounceOptions = {}
): [(value: T) => void, string | null, boolean] {
  const { delay = 300 } = options;
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useDebounceCallback(
    async (newValue: T) => {
      try {
        setIsValidating(true);
        const validationError = await validator(newValue);
        setError(validationError);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de validación');
      } finally {
        setIsValidating(false);
      }
    },
    { delay, trailing: true }
  );

  return [validate, error, isValidating];
}

// ==========================================
// HOOKS MÉDICOS ESPECIALIZADOS
// ==========================================

/**
 * Hook de debounce específico para búsqueda de pacientes
 * @param initialQuery - Query inicial
 * @param searchFunction - Función de búsqueda
 * @param delay - Retraso en milisegundos
 * @returns [query actual, resultados, cargando, error, buscar]
 */
export function useDebouncePatientSearch(
  initialQuery: string = '',
  searchFunction: (query: string) => Promise<any[]>,
  delay: number = 400
) {
  const [query, setQuery] = useState(initialQuery);
  const [searchPatients, results, loading, error] = useDebounceApiCall(
    searchFunction,
    { delay }
  );

  useEffect(() => {
    if (query.trim()) {
      searchPatients(query.trim());
    }
  }, [query, searchPatients]);

  return [query, setQuery, results, loading, error] as const;
}

/**
 * Hook de debounce para síntomas médicos con análisis
 * @param onSymptomsChange - Callback cuando cambien los síntomas
 * @param delay - Retraso en milisegundos
 * @returns [síntomas, setSíntomas, analizando]
 */
export function useDebounceSymptoms(
  onSymptomsChange: (symptoms: string[]) => Promise<void>,
  delay: number = 800
) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeSymptoms = useDebounceCallback(
    async (symptomList: string[]) => {
      if (symptomList.length === 0) return;
      
      try {
        setAnalyzing(true);
        await onSymptomsChange(symptomList);
      } finally {
        setAnalyzing(false);
      }
    },
    { delay, trailing: true }
  );

  useEffect(() => {
    analyzeSymptoms(symptoms);
  }, [symptoms, analyzeSymptoms]);

  const addSymptom = useCallback((symptom: string) => {
    setSymptoms(prev => [...prev, symptom]);
  }, []);

  const removeSymptom = useCallback((index: number) => {
    setSymptoms(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    symptoms,
    setSymptoms,
    addSymptom,
    removeSymptom,
    analyzing
  };
}