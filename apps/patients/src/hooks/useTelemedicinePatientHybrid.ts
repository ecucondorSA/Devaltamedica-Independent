/**
 * 🏥 TELEMEDICINE PATIENT HYBRID HOOK - ALTAMEDICA (DEPRECATED)
 * 
 * ⚠️ DEPRECATION NOTICE:
 * Este archivo ha sido consolidado en useTelemedicineUnified.ts
 * 
 * FUNCIONALIDADES MIGRADAS:
 * - ✅ Gestión de sesiones médicas → useTelemedicineUnified
 * - ✅ Integración signaling-server → useTelemedicineUnified
 * - ✅ Compliance HIPAA → useTelemedicineUnified
 * - ✅ Compartir síntomas y signos vitales → useTelemedicineUnified
 * - ✅ Chat en tiempo real → useTelemedicineUnified
 * - ✅ Reportes de emergencia → useTelemedicineUnified
 * 
 * NUEVA UBICACIÓN: ./useTelemedicineUnified.ts
 */

// Re-export from unified implementation
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

// Backward compatibility export
export const useTelemedicinePatientHybrid = useTelemedicineUnified;

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth  } from '@altamedica/auth';
import io, { Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared';
// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SIGNALING_SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:8888';

// Interfaces para telemedicina de pacientes
interface PatientTelemedicineSession {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  patientId: string;
  status: 'waiting' | 'connecting' | 'active' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  
  // Datos médicos específicos del paciente
  patientData: {
    chiefComplaint: string;
    currentSymptoms: string[];
    currentMedications: MedicalMedication[];
    allergies: string[];
    vitalSigns: PatientVitalSigns;
    emergencyContact?: EmergencyContact;
  };
  
  // Consentimientos y compliance
  consents: {
    videoRecording: boolean;
    dataSharing: boolean;
    treatmentConsent: boolean;
    consentedAt?: Date;
  };
  
  // Audit trail HIPAA
  auditTrail: {
    sessionCreated: Date;
    patientJoined?: Date;
    doctorJoined?: Date;
    sessionEnded?: Date;
    hipaaCompliant: boolean;
    accessLog: AuditLogEntry[];
  };
}

interface PatientVitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  painLevel?: number; // 1-10 scale
  recordedAt: Date;
  recordedBy: 'patient' | 'device' | 'caregiver';
}

interface MedicalMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  prescribedBy: string;
  reason?: string;
  sideEffects?: string[];
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  isNotified: boolean;
}

interface AuditLogEntry {
  action: string;
  timestamp: Date;
  userId: string;
  details: Record<string, any>;
}

interface TelemedicineHookState {
  session: PatientTelemedicineSession | null;
  loading: boolean;
  error: string | null;
  connecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface TelemedicineHookActions {
  joinSession: (sessionId: string, patientData: any) => Promise<void>;
  leaveSession: () => Promise<void>;
  shareVitalSigns: (vitalSigns: PatientVitalSigns) => Promise<void>;
  updateSymptoms: (symptoms: string[]) => Promise<void>;
  reportEmergency: (emergencyData: any) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  giveConsent: (consentType: keyof PatientTelemedicineSession['consents']) => Promise<void>;
}

function useTelemedicinePatientHybridImpl(): [TelemedicineHookState, TelemedicineHookActions] {
  const { user, getToken } = useAuth();
  
  // State management
  const [state, setState] = useState<TelemedicineHookState>({
    session: null,
    loading: false,
    error: null,
    connecting: false,
    connectionQuality: 'disconnected',
  });

  // Refs para conexiones
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<PatientTelemedicineSession | null>(null);

  // Función para conectar al signaling server
  const connectToSignalingServer = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      
      socketRef.current = io(SIGNALING_SERVER_URL, {
        auth: { token },
        autoConnect: false,
      });

      // Event listeners
      socketRef.current.on('connect', () => {
        logger.info('Connected to signaling server');
        setState(prev => ({ ...prev, connectionQuality: 'excellent' }));
      });

      socketRef.current.on('disconnect', () => {
        logger.info('Disconnected from signaling server');
        setState(prev => ({ ...prev, connectionQuality: 'disconnected' }));
      });

      socketRef.current.on('session_updated', (sessionData) => {
        sessionRef.current = sessionData;
        setState(prev => ({ ...prev, session: sessionData }));
      });

      socketRef.current.on('doctor_joined', (doctorData) => {
        setState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            doctorName: doctorData.name,
            doctorSpecialty: doctorData.specialty,
            status: 'active'
          } : null
        }));
      });

      socketRef.current.on('chat_message', (message) => {
        // Manejar mensajes de chat del doctor
        logger.info('Chat message received:', message);
      });

      socketRef.current.on('session_ended', () => {
        setState(prev => ({
          ...prev,
          session: prev.session ? { ...prev.session, status: 'ended' } : null
        }));
      });

      socketRef.current.on('error', (error) => {
        logger.error('Signaling server error:', String(error));
        setState(prev => ({ ...prev, error: error.message }));
      });

      socketRef.current.connect();

    } catch (error) {
      logger.error('Error connecting to signaling server:', String(error));
      setState(prev => ({ ...prev, error: 'Failed to connect to signaling server' }));
    }
  }, [user, getToken]);

  // Función para unirse a una sesión
  const joinSession = useCallback(async (sessionId: string, patientData: any) => {
    if (!user || !socketRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getToken();
      
      // Crear sesión del paciente
      const sessionPayload: Partial<PatientTelemedicineSession> = {
        id: sessionId,
        patientId: user.uid,
        status: 'waiting',
        patientData: {
          chiefComplaint: patientData.chiefComplaint || '',
          currentSymptoms: patientData.symptoms || [],
          currentMedications: patientData.medications || [],
          allergies: patientData.allergies || [],
          vitalSigns: {
            ...patientData.vitalSigns,
            recordedAt: new Date(),
            recordedBy: 'patient'
          },
          emergencyContact: patientData.emergencyContact,
        },
        consents: {
          videoRecording: false,
          dataSharing: false,
          treatmentConsent: false,
        },
        auditTrail: {
          sessionCreated: new Date(),
          patientJoined: new Date(),
          hipaaCompliant: true,
          accessLog: [{
            action: 'PATIENT_JOINED_SESSION',
            timestamp: new Date(),
            userId: user.uid,
            details: { sessionId }
          }]
        }
      };

      // Enviar al signaling server
      socketRef.current.emit('join-session', {
        sessionId,
        userRole: 'patient',
        sessionData: sessionPayload
      });

      // Llamar al API para registrar la sesión
      const response = await fetch(`${API_BASE_URL}/api/v1/telemedicine/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sessionPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to create telemedicine session');
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        session: result.data,
        loading: false,
        connecting: true,
      }));

      sessionRef.current = result.data;

    } catch (error) {
      logger.error('Error joining session:', String(error));
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join session',
        loading: false,
      }));
    }
  }, [user, getToken]);

  // Función para compartir signos vitales
  const shareVitalSigns = useCallback(async (vitalSigns: PatientVitalSigns) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      const updatedVitalSigns = {
        ...vitalSigns,
        recordedAt: new Date(),
        recordedBy: 'patient' as const,
      };

      // Enviar al doctor a través del signaling server
      socketRef.current.emit('vitals-update', {
        sessionId: sessionRef.current.id,
        vitalSigns: updatedVitalSigns,
        patientId: user?.uid,
      });

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          patientData: {
            ...prev.session.patientData,
            vitalSigns: updatedVitalSigns
          }
        } : null
      }));

    } catch (error) {
      logger.error('Error sharing vital signs:', String(error));
      setState(prev => ({ ...prev, error: 'Failed to share vital signs' }));
    }
  }, [user]);

  // Función para actualizar síntomas
  const updateSymptoms = useCallback(async (symptoms: string[]) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      socketRef.current.emit('symptoms-update', {
        sessionId: sessionRef.current.id,
        symptoms,
        patientId: user?.uid,
        timestamp: new Date(),
      });

      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          patientData: {
            ...prev.session.patientData,
            currentSymptoms: symptoms
          }
        } : null
      }));

    } catch (error) {
      logger.error('Error updating symptoms:', String(error));
    }
  }, [user]);

  // Función para reportar emergencia
  const reportEmergency = useCallback(async (emergencyData: any) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      socketRef.current.emit('emergency-alert', {
        sessionId: sessionRef.current.id,
        patientId: user?.uid,
        emergencyType: emergencyData.type,
        description: emergencyData.description,
        severity: emergencyData.severity || 'high',
        timestamp: new Date(),
      });

      // También notificar al API para logging HIPAA
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/v1/telemedicine/emergency`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: sessionRef.current.id,
          ...emergencyData,
        }),
      });

    } catch (error) {
      logger.error('Error reporting emergency:', String(error));
    }
  }, [user, getToken]);

  // Función para enviar mensajes de chat
  const sendChatMessage = useCallback(async (message: string) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      socketRef.current.emit('chat-message', {
        sessionId: sessionRef.current.id,
        senderId: user?.uid,
        senderRole: 'patient',
        message,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Error sending chat message:', String(error));
    }
  }, [user]);

  // Función para dar consentimiento
  const giveConsent = useCallback(async (consentType: keyof PatientTelemedicineSession['consents']) => {
    if (!sessionRef.current) return;

    try {
      const token = await getToken();
      
      await fetch(`${API_BASE_URL}/api/v1/telemedicine/consent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: sessionRef.current.id,
          consentType,
          consentGiven: true,
          timestamp: new Date(),
        }),
      });

      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          consents: {
            ...prev.session.consents,
            [consentType]: true,
            consentedAt: new Date(),
          }
        } : null
      }));

    } catch (error) {
      logger.error('Error giving consent:', String(error));
    }
  }, [getToken]);

  // Función para salir de la sesión
  const leaveSession = useCallback(async () => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      socketRef.current.emit('leave-session', {
        sessionId: sessionRef.current.id,
        userRole: 'patient',
      });

      setState(prev => ({
        ...prev,
        session: null,
        connecting: false,
        connectionQuality: 'disconnected',
      }));

      sessionRef.current = null;

    } catch (error) {
      logger.error('Error leaving session:', String(error));
    }
  }, []);

  // Conectar automáticamente cuando el usuario está disponible
  useEffect(() => {
    if (user && !socketRef.current) {
      connectToSignalingServer();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, connectToSignalingServer]);

  return [
    state,
    {
      joinSession,
      leaveSession,
      shareVitalSigns,
      updateSymptoms,
      reportEmergency,
      sendChatMessage,
      giveConsent,
    },
  ];
}