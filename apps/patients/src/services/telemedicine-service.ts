/**
 * 🏥 TELEMEDICINE SERVICE - PATIENTS APP
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
  getTelemedicineService,
  type TelemedicineSession,
  type CreateSessionRequest,
  type JoinSessionRequest
} from '@altamedica/telemedicine-core';

// Legacy type exports for backward compatibility
export type { 
  TelemedicineSession,
  CreateSessionRequest as JoinSessionRequest 
};

export interface SessionsResponse {
  sessions: TelemedicineSession[];
  total: number;
  active: number;
  message: string;
}

export interface WebRTCConfig {
  roomId: string;
  userId: string;
  userName: string;
  isDoctor: boolean;
  iceServers: RTCIceServer[];
}

// Create singleton instance
const telemedicineService = getTelemedicineService();

// ============================================================================
// LEGACY API COMPATIBILITY
// ============================================================================

export class TelemedicineService {
  /**
   * Get active telemedicine sessions
   * @deprecated Use getTelemedicineService().getActiveSessions()
   */
  static async getActiveSessions(): Promise<SessionsResponse> {
    const sessions = await telemedicineService.getActiveSessions();
    const active = sessions.filter(s => s.status === 'active');
    
    return {
      sessions,
      total: sessions.length,
      active: active.length,
      message: 'Sessions retrieved successfully'
    };
  }
  
  /**
   * Join a telemedicine session
   * @deprecated Use getTelemedicineService().joinSession()
   */
  static async joinSession(patientId: string, doctorId: string, sessionType: 'video' | 'audio' | 'chat' = 'video') {
    // First create a session
    const session = await telemedicineService.createSession({
      patientId,
      doctorId,
      sessionType
    });
    
    // Then join it
    const result = await telemedicineService.joinSession({
      sessionId: session.id,
      userId: patientId,
      userType: 'patient'
    });
    
    return {
      sessionId: result.session.id,
      roomId: result.session.roomId,
      webrtcConfig: {
        roomId: result.session.roomId,
        userId: patientId,
        userName: `Patient ${patientId}`,
        isDoctor: false,
        iceServers: result.webrtcConfig?.iceServers || []
      },
      token: result.token,
      message: 'Joined session successfully'
    };
  }
  
  /**
   * End a telemedicine session
   * @deprecated Use getTelemedicineService().endSession()
   */
  static async endSession(sessionId: string): Promise<void> {
    return telemedicineService.endSession(sessionId);
  }
  
  /**
   * Get patient's sessions
   * @deprecated Use getTelemedicineService().getSessionsByPatient()
   */
  static async getPatientSessions(patientId: string): Promise<TelemedicineSession[]> {
    return telemedicineService.getSessionsByPatient(patientId);
  }
  
  /**
   * Get upcoming sessions for patient
   * @deprecated Use getTelemedicineService().getUpcomingSessions()
   */
  static async getUpcomingSessions(patientId: string): Promise<TelemedicineSession[]> {
    return telemedicineService.getUpcomingSessions(patientId, 'patient');
  }
  
  /**
   * Update session quality metrics
   * @deprecated Use getTelemedicineService().updateQualityMetrics()
   */
  static async updateQualityMetrics(sessionId: string, quality: {
    video: number;
    audio: number;
    connection: number;
  }): Promise<void> {
    return telemedicineService.updateQualityMetrics(sessionId, quality);
  }
}

// Default export for backward compatibility
export default telemedicineService;