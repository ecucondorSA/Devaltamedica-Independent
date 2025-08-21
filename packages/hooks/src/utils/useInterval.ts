/**
 * @fileoverview Hook useInterval para intervalos declarativos
 * @module @altamedica/hooks/utils/useInterval
 * @description Hook para manejar intervalos de forma declarativa y segura
 */

import React from 'react';

import { useCallback, useEffect, useRef } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface IntervalOptions {
  /** Si debe ejecutarse inmediatamente */
  immediate?: boolean;
  /** Si debe pausarse cuando la tab no está activa */
  pauseOnBlur?: boolean;
  /** Callback cuando se pausa */
  onPause?: () => void;
  /** Callback cuando se reanuda */
  onResume?: () => void;
}

// ==========================================
// HOOK USEINTERVAL
// ==========================================

/**
 * Hook para intervalos declarativos y seguros
 * @param callback - Función a ejecutar en cada intervalo
 * @param delay - Delay en milisegundos (null para pausar)
 * @param options - Opciones adicionales
 * 
 * @example
 * ```tsx
 * // Intervalo simple
 * useInterval(() => {
 *   logger.info('Ejecuta cada segundo');
 * }, 1000);
 * 
 * // Con opciones
 * useInterval(
 *   () => fetchVitalSigns(),
 *   isMonitoring ? 5000 : null, // pausa cuando no está monitoreando
 *   {
 *     immediate: true,
 *     pauseOnBlur: true
 *   }
 * );
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: IntervalOptions = {}
): void {
  const {
    immediate = false,
    pauseOnBlur = false,
    onPause,
    onResume
  } = options;

  const savedCallback = useRef<() => void>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Guardar callback actualizado
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Función para limpiar intervalo
  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Función para pausar
  const pause = useCallback(() => {
    if (!isPausedRef.current) {
      isPausedRef.current = true;
      clearIntervalRef();
      onPause?.();
    }
  }, [clearIntervalRef, onPause]);

  // Función para reanudar
  const resume = useCallback(() => {
    if (isPausedRef.current && delay !== null) {
      isPausedRef.current = false;
      onResume?.();
      
      // Reactivar intervalo
      intervalRef.current = setInterval(() => {
        savedCallback.current?.();
      }, delay);
    }
  }, [delay, onResume]);

  // Configurar intervalo
  useEffect(() => {
    if (delay !== null && !isPausedRef.current) {
      // Ejecutar inmediatamente si está configurado
      if (immediate) {
        savedCallback.current?.();
      }

      // Configurar intervalo
      intervalRef.current = setInterval(() => {
        savedCallback.current?.();
      }, delay);
    }

    // Asegurar cleanup consistente en todas las rutas
    return clearIntervalRef;
  }, [delay, immediate, clearIntervalRef]);

  // Manejar pausa/reanudación en blur/focus
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };

    const handleBlur = () => pause();
    const handleFocus = () => resume();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pauseOnBlur, pause, resume]);

  // Cleanup al desmontar
  useEffect(() => {
    return clearIntervalRef;
  }, [clearIntervalRef]);
}

/**
 * Hook de intervalo con controles manuales
 * @param callback - Función a ejecutar
 * @param delay - Delay inicial
 * @param options - Opciones adicionales
 * @returns Controles del intervalo
 * 
 * @example
 * ```tsx
 * const { start, stop, toggle, isRunning } = useControllableInterval(
 *   () => logger.info('tick'),
 *   1000
 * );
 * 
 * return (
 *   <button onClick={toggle}>
 *     {isRunning ? 'Pausar' : 'Iniciar'} Monitor
 *   </button>
 * );
 * ```
 */
export function useControllableInterval(
  callback: () => void,
  delay: number,
  options: IntervalOptions = {}
) {
  const [isRunning, setIsRunning] = React.useState(false);
  
  useInterval(
    callback,
    isRunning ? delay : null,
    options
  );

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning(prev => !prev), []);

  return { start, stop, toggle, isRunning };
}