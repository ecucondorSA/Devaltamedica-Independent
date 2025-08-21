// Mock functions to replace various @altamedica packages

// Mock for @/lib/mock-medical
import { logger } from '@altamedica/shared/services/logger.service';

export const medicalCache = {
  get: async (key: string) => null,
  set: async (key: string, value: any) => true,
  delete: async (key: string) => true,
};

// Mock for @/lib/mock-medical
export const medicalAuditor = {
  logAccess: (userId: string, resource: string) => logger.info(`Medical access: ${userId} -> ${resource}`),
  validatePermissions: (userId: string, action: string) => true,
};

// Mock for @/lib/mock-medical
export function optimizeApiRequest(handler: Function) {
  return handler;
}

// Mock classes that might be referenced
export class HIPAAComplianceManager {
  constructor(encryptionKey: string) {}
  audit(action: string, userId: string, data?: any) {
    logger.info(`HIPAA Audit: ${action} by ${userId}`, data);
  }
}

export class TelemedicineService {
  constructor(prisma: any) {}
  async getSessionById(sessionId: string) {
    return { id: sessionId, status: 'active' };
  }
}

export const prisma = {
  // Mock prisma client
};