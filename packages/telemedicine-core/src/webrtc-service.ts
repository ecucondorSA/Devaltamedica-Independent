/**
 * AltaMedica WebRTC Service
 * Servicio para integrar videollamadas WebRTC en la plataforma
 */

import { useState } from 'react';

import { logger } from '@altamedica/shared';
export interface VideoCallRoom {
  room_id: string;
  doctor_email: string;
  patient_email: string;
  consultation_id: string;
  created_at: string;
  doctor_url: string;
  patient_url: string;
  direct_doctor_url: string;
  direct_patient_url: string;
}

export interface VideoCallStatus {
  room_id: string;
  doctor_connected: boolean;
  patient_connected: boolean;
  is_active: boolean;
  created_at: string;
  call_started_at?: string;
  call_ended_at?: string;
}

const VIDEO_SERVER_BASE_URL = 'http://localhost:8888';

export class WebRTCService {
  /**
   * Crear una nueva videollamada
   */
  static async createVideoCall(params: {
    doctor_email: string;
    patient_email: string;
    consultation_id?: string;
  }): Promise<VideoCallRoom> {
    const response = await fetch(`${VIDEO_SERVER_BASE_URL}/api/video-calls/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctor_email: params.doctor_email,
        patient_email: params.patient_email,
        consultation_id: params.consultation_id || `consult_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating video call: ${response.status}`);
    }

    const result = await response.json();

    return {
      ...(result as object),
      // URLs directas al servidor WebRTC (recomendadas)
      direct_doctor_url: `${VIDEO_SERVER_BASE_URL}/video-call/${(result as any).room_id}?user_id=${params.doctor_email}&user_type=doctor`,
      direct_patient_url: `${VIDEO_SERVER_BASE_URL}/video-call/${(result as any).room_id}?user_id=${params.patient_email}&user_type=patient`,
    } as VideoCallRoom;
  }

  /**
   * Obtener el estado de una videollamada
   */
  static async getCallStatus(roomId: string): Promise<VideoCallStatus> {
    const response = await fetch(`${VIDEO_SERVER_BASE_URL}/api/video-calls/${roomId}/status`);

    if (!response.ok) {
      throw new Error(`Error getting call status: ${response.status}`);
    }

    return (await response.json()) as VideoCallStatus;
  }

  /**
   * Verificar que el servidor WebRTC esté disponible
   */
  static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${VIDEO_SERVER_BASE_URL}/health`);
      if (response.ok) {
        const health = await response.json();
        return (health as any).status === 'healthy';
      }
    } catch (error) {
      logger.error('WebRTC server health check failed:', error);
    }
    return false;
  }

  /**
   * Generar URL directa para una videollamada existente
   */
  static generateDirectVideoUrl(
    roomId: string,
    userEmail: string,
    userType: 'doctor' | 'patient',
  ): string {
    return `${VIDEO_SERVER_BASE_URL}/video-call/${roomId}?user_id=${userEmail}&user_type=${userType}`;
  }

  /**
   * Abrir videollamada en nueva ventana
   */
  static openVideoCall(roomId: string, userEmail: string, userType: 'doctor' | 'patient'): void {
    const url = this.generateDirectVideoUrl(roomId, userEmail, userType);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
    }
  }
}

/**
 * Hook de React para gestionar videollamadas
 */
export function useWebRTCCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callData, setCallData] = useState<VideoCallRoom | null>(null);

  const createCall = async (params: {
    doctor_email: string;
    patient_email: string;
    consultation_id?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await WebRTCService.createVideoCall(params);
      setCallData(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating video call';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinAsDoctor = (roomId: string, doctorEmail: string) => {
    WebRTCService.openVideoCall(roomId, doctorEmail, 'doctor');
  };

  const joinAsPatient = (roomId: string, patientEmail: string) => {
    WebRTCService.openVideoCall(roomId, patientEmail, 'patient');
  };

  return {
    isLoading,
    error,
    callData,
    createCall,
    joinAsDoctor,
    joinAsPatient,
    clearError: () => setError(null),
  };
}
