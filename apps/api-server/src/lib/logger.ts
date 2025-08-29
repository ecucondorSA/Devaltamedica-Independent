// Simple logger functions to replace @/lib/logger
import { logger } from '@altamedica/shared/services/logger.service';

export function logPHIAccess(action: string, userId: string, patientId?: string) {
  logger.info(`[PHI ACCESS] ${action} by user ${userId} ${patientId ? `for patient ${patientId}` : ''}`, {
    timestamp: new Date().toISOString(),
    action,
    userId,
    patientId,
    level: 'audit'
  });
}

export function logMedicalAction(action: string, userId: string, details?: any) {
  logger.info(`[MEDICAL ACTION] ${action} by user ${userId}`, {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
    level: 'medical'
  });
}

export const medicalLogger = {
  info: (message: string, meta?: any) => logger.info(`[MEDICAL INFO] ${message}`, meta),
  error: (message: string, meta?: any) => logger.error(`[MEDICAL ERROR] ${message}`, meta),
  warn: (message: string, meta?: any) => logger.warn(`[MEDICAL WARN] ${message}`, meta),
};

const localLogger = {
  info: (message: string, meta?: any) => logger.info(`[INFO] ${message}`, meta),
  error: (message: string, meta?: any) => logger.error(`[ERROR] ${message}`, meta),
  warn: (message: string, meta?: any) => logger.warn(`[WARN] ${message}`, meta),
};

export default localLogger;
