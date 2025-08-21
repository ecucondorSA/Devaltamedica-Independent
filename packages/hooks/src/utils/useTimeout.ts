/**
 * @fileoverview Hook useTimeout para timeouts declarativos
 */

import { useCallback, useEffect, useRef } from 'react';
import type { TimeoutOptions } from './types';

export function useTimeout(
  callback: () => void,
  delay: number | null,
  options: TimeoutOptions = {}
): void {
  const { immediate = false, onTimeout, onCancel } = options;
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      onCancel?.();
    }
  }, [onCancel]);

  useEffect(() => {
    if (delay !== null) {
      if (immediate) {
        savedCallback.current();
      }

      timeoutRef.current = setTimeout(() => {
        savedCallback.current();
        onTimeout?.();
        timeoutRef.current = null;
      }, delay);
    }

    // Retornar cleanup consistente incluso si delay es null
    return clear;
  }, [delay, immediate, clear, onTimeout]);

  useEffect(() => clear, [clear]);
}