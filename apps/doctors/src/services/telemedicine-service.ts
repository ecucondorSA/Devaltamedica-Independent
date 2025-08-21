/**
 * 🏥 TELEMEDICINE SERVICE - DOCTORS APP
 * 
 * ✅ MIGRADO A SISTEMA UNIFICADO (2025-08-16)
 * 
 * Este archivo ahora es un wrapper del UnifiedTelemedicineService
 * para mantener compatibilidad con código existente.
 * 
 * NUEVA UBICACIÓN: @altamedica/telemedicine-core
 * 
 * @deprecated Use UnifiedTelemedicineService from @altamedica/telemedicine-core
 */

import {
  UnifiedTelemedicineService,
  getTelemedicineService,
  type TelemedicineSession,
  type CreateSessionRequest,
  type JoinSessionRequest
} from '@altamedica/telemedicine-core';

// Re-export types for backward compatibility
export type { 
  TelemedicineSession,
  CreateSessionRequest,
  JoinSessionRequest 
};

// Create singleton instance
const telemedicineService = getTelemedicineService();

// ============================================================================
// LEGACY API COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use getTelemedicineService() from @altamedica/telemedicine-core
 */
export class TelemedicineService {
  static async createSession(data: CreateSessionRequest): Promise<TelemedicineSession> {
    return telemedicineService.createSession(data);
  }
  
  static async getSession(sessionId: string): Promise<TelemedicineSession | null> {
    return telemedicineService.getSession(sessionId);
  }
  
  static async joinSession(request: JoinSessionRequest) {
    return telemedicineService.joinSession(request);
  }
  
  static async endSession(sessionId: string): Promise<void> {
    return telemedicineService.endSession(sessionId);
  }
  
  static async getActiveSessions(): Promise<TelemedicineSession[]> {
    return telemedicineService.getActiveSessions();
  }
  
  static async getSessionsByDoctor(doctorId: string): Promise<TelemedicineSession[]> {
    return telemedicineService.getSessionsByDoctor(doctorId);
  }
  
  static async getUpcomingSessions(doctorId: string): Promise<TelemedicineSession[]> {
    return telemedicineService.getUpcomingSessions(doctorId, 'doctor');
  }
}

// Default export for backward compatibility
export default telemedicineService;