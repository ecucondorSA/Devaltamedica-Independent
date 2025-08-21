/**
 * @fileoverview Hook básico para toasts
 */

import { useCallback } from 'react';
import { ToastOptions } from './types';

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
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Implementación básica para compilar
    logger.info('Toast:', options);
  }, []);

  return toast;
}