/**
 * @fileoverview Hook básico para toasts
 */

import { useCallback } from 'react';
import { ToastOptions } from './types';

import { logger } from '@altamedica/shared/services/logger.service';
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Implementación básica para compilar
    logger.info('Toast:', options);
  }, []);

  return toast;
}