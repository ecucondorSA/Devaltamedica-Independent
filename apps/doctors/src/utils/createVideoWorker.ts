// Utilidad para crear el Web Worker de procesamiento de video
import { logger } from '@altamedica/shared';

export function createVideoWorker() {
  if (typeof window === 'undefined' || !window.Worker) return null;
  try {
    return new Worker('/workers/videoProcessor.worker.js');
  } catch (error) {
    logger.error('Error creando Web Worker:', String(error));
    return null;
  }
} 