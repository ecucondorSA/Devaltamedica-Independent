/**
 * AltaMedica Video Call Client - Integración con sistema de videollamadas
 * Cliente TypeScript para conectar apps de Next.js con el servidor de videollamadas
 */

import { logger } from '@altamedica/shared';

interface VideoCallResponse {
  room_id?: string;
  doctor_url?: string;
  patient_url?: string;
  error?: string;
  status?: string;
  call_started_at?: string;
  call_ended_at?: string;
  doctor_connected?: boolean;
  patient_connected?: boolean;
  is_active?: boolean;
  created_at?: string;
}

interface CreateCallRequest {
  doctor_id: string;
  patient_id: string;
  consultation_id?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  specialty?: string;
}

interface CallStatus {
  room_id: string;
  doctor_connected: boolean;
  patient_connected: boolean;
  is_active: boolean;
  created_at: string;
  call_started_at: string | null;
  call_ended_at: string | null;
  duration_seconds?: number;
}

interface ActiveCall {
  room_id: string;
  doctor_id: string;
  patient_id: string;
  is_active: boolean;
  participants: number;
  created_at: string;
}

export class AltaMedicaVideoCallClient {
  private serverUrl: string;
  private wsUrl: string;

  constructor(serverUrl: string = 'http://localhost:8888') {
    this.serverUrl = serverUrl;
    this.wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  /**
   * Crear una nueva videollamada médica
   */
  async createVideoCall(request: CreateCallRequest): Promise<VideoCallResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/api/video-calls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: request.doctor_id,
          patient_id: request.patient_id,
          consultation_id: request.consultation_id,
          scheduled_time: request.scheduled_time,
          duration_minutes: request.duration_minutes || 30,
          specialty: request.specialty,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as VideoCallResponse;
    } catch (error) {
      logger.error('Error creating video call:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Obtener estado de una videollamada
   */
  async getCallStatus(roomId: string): Promise<CallStatus | { error: string }> {
    try {
      const response = await fetch(`${this.serverUrl}/api/video-calls/${roomId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as CallStatus;
    } catch (error) {
      logger.error('Error getting call status:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Obtener todas las videollamadas activas
   */
  async getActiveCalls(): Promise<ActiveCall[] | { error: string }> {
    try {
      const response = await fetch(`${this.serverUrl}/api/video-calls/active`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data as any).active_calls || [];
    } catch (error) {
      logger.error('Error getting active calls:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generar URLs para unirse a la videollamada
   */
  generateJoinUrls(roomId: string, doctorId: string, patientId: string) {
    return {
      doctor_url: `${this.serverUrl}/video-call/${roomId}?user_id=${doctorId}&user_type=doctor`,
      patient_url: `${this.serverUrl}/video-call/${roomId}?user_id=${patientId}&user_type=patient`,
      embed_doctor_url: `${this.serverUrl}/video-call/${roomId}?user_id=${doctorId}&user_type=doctor&embed=true`,
      embed_patient_url: `${this.serverUrl}/video-call/${roomId}?user_id=${patientId}&user_type=patient&embed=true`,
    };
  }

  /**
   * Verificar conectividad del servidor de videollamadas
   */
  async healthCheck(): Promise<
    { status: string; server: string; timestamp: string } | { error: string }
  > {
    try {
      const response = await fetch(`${this.serverUrl}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: 'healthy',
        server: this.serverUrl,
        timestamp: new Date().toISOString(),
        ...(data as object),
      };
    } catch (error) {
      logger.error('Error in health check:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Funciones de utilidad para integración fácil con Next.js
 */

/**
 * Crear una videollamada para consulta médica
 */
export async function createConsultationCall(
  doctorEmail: string,
  patientEmail: string,
  consultationId?: string,
  options?: {
    specialty?: string;
    scheduledTime?: string;
    duration?: number;
  },
): Promise<VideoCallResponse & { doctor_url?: string; patient_url?: string }> {
  const client = new AltaMedicaVideoCallClient();

  // Generar IDs únicos basados en emails
  const doctorId = `doctor_${doctorEmail.replace(/[@.]/g, '_')}`;
  const patientId = `patient_${patientEmail.replace(/[@.]/g, '_')}`;

  // Agregar consultation ID si se proporciona
  const finalDoctorId = consultationId ? `${doctorId}_${consultationId}` : doctorId;
  const finalPatientId = consultationId ? `${patientId}_${consultationId}` : patientId;

  const result = await client.createVideoCall({
    doctor_id: finalDoctorId,
    patient_id: finalPatientId,
    consultation_id: consultationId,
    scheduled_time: options?.scheduledTime,
    duration_minutes: options?.duration,
    specialty: options?.specialty,
  });

  if (result.room_id && !result.error) {
    const urls = client.generateJoinUrls(result.room_id, finalDoctorId, finalPatientId);
    return {
      ...result,
      ...urls,
    };
  }

  return result;
}

/**
 * Hook personalizado para React - gestión de videollamadas
 */
export function useVideoCall() {
  const client = new AltaMedicaVideoCallClient();

  const createCall = async (doctorEmail: string, patientEmail: string, options?: any) => {
    return await createConsultationCall(doctorEmail, patientEmail, undefined, options);
  };

  const getStatus = async (roomId: string) => {
    return await client.getCallStatus(roomId);
  };

  const getActiveCalls = async () => {
    return await client.getActiveCalls();
  };

  const healthCheck = async () => {
    return await client.healthCheck();
  };

  return {
    createCall,
    getStatus,
    getActiveCalls,
    healthCheck,
    client,
  };
}

// Exportar tipos para uso en otros archivos
export type { VideoCallResponse, CreateCallRequest, CallStatus, ActiveCall };
