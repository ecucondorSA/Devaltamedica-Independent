/**
 * Cliente de videollamadas para AltaMedica - Pacientes
 * Integración con el servidor de videollamadas en puerto 8888
 */

export interface CallStatus {
  room_id: string;
  doctor_connected: boolean;
  patient_connected: boolean;
  is_active: boolean;
  created_at: string;
  call_started_at?: string;
  call_ended_at?: string;
}

export interface CreateCallResult {
  success: boolean;
  room_id: string;
  doctor_url: string;
  patient_url: string;
  created_at: string;
  error?: string;
}

export interface ConsultationData {
  specialty?: string;
  duration?: number;
  scheduledTime?: string;
  notes?: string;
}

// Cliente para interactuar con el servidor de videollamadas
export class AltaMedicaVideoCallClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8888') {
    this.baseUrl = baseUrl;
  }

  async createCall(doctorEmail: string, patientEmail: string, consultationId: string, data?: ConsultationData): Promise<CreateCallResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/video-calls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_email: doctorEmail,
          patient_email: patientEmail,
          consultation_id: consultationId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error creating video call:', String(error));
      return {
        success: false,
        room_id: '',
        doctor_url: '',
        patient_url: '',
        created_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCallStatus(roomId: string): Promise<CallStatus | { error: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/video-calls/${roomId}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting call status:', String(error));
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      logger.error('Video server health check failed:', String(error));
      return false;
    }
  }
}

// Función helper para crear una consulta médica
export async function createConsultationCall(
  doctorEmail: string,
  patientEmail: string,
  consultationId: string,
  data?: ConsultationData
): Promise<CreateCallResult> {
  const client = new AltaMedicaVideoCallClient();
  return await client.createCall(doctorEmail, patientEmail, consultationId, data);
}

// Hook personalizado para React
import { useState, useEffect } from 'react';

import { logger } from '@altamedica/shared';
export function useVideoCall(roomId?: string) {
  const [client] = useState(() => new AltaMedicaVideoCallClient());
  const [status, setStatus] = useState<CallStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCall = async (doctorEmail: string, patientEmail: string, consultationId: string, data?: ConsultationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.createCall(doctorEmail, patientEmail, consultationId, data);
      
      if (result.success) {
        return result;
      } else {
        setError(result.error || 'Error creating call');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        room_id: '',
        doctor_url: '',
        patient_url: '',
        created_at: new Date().toISOString(),
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const getStatus = async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.getCallStatus(roomId);
      
      if ('error' in result) {
        setError(result.error);
        return null;
      } else {
        setStatus(result);
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      getStatus(roomId);
    }
  }, [roomId]);

  return {
    client,
    status,
    loading,
    error,
    createCall,
    getStatus
  };
}

// Configuración WebRTC
export const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

// Tipos para WebRTC
export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'joined' | 'call_active' | 'error';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sender_id?: string;
  sender_type?: string;
  message?: string;
}

export interface VideoCallProps {
  sessionId: string;
  doctorEmail?: string;
  doctorName?: string;
  appointmentType: string;
  onCallEnd?: () => void;
}