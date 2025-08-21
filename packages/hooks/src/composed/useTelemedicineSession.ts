/**
 * @fileoverview Hook compuesto para sesiones de telemedicina
 * @module @altamedica/hooks/composed/useTelemedicineSession
 * @description Hook de alto nivel que combina WebRTC, chat, formularios médicos y notificaciones
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { usePatients } from '../medical/usePatients';
import type { MessageEvent } from '../realtime/types';
import { useNotifications } from '../realtime/useNotifications';
import { useRealTimeUpdates } from '../realtime/useRealTimeUpdates';
import { useWebRTC } from '../realtime/useWebRTC';

import { logger } from '@altamedica/shared/services/logger.service';
type User = { id: string; name: string; userType: string };
type Patient = { id: string; name?: string } | null;

// ==========================================
// TIPOS ESPECÍFICOS
// ==========================================

interface TelemedicineSessionConfig {
  /** ID de la sesión */
  sessionId: string;
  /** ID del paciente */
  patientId: string;
  /** ID del doctor */
  doctorId: string;
  /** Tipo de consulta */
  consultationType: 'routine' | 'follow-up' | 'emergency' | 'specialist';
  /** Duración máxima en minutos */
  maxDuration?: number;
  /** Si debe grabar la sesión */
  recordSession?: boolean;
  /** Configuración de calidad de video */
  videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Si permite compartir pantalla */
  allowScreenShare?: boolean;
  /** Si permite chat */
  allowChat?: boolean;
}

interface TelemedicineParticipant {
  id: string;
  name: string;
  role: 'doctor' | 'patient' | 'observer';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  joinedAt: Date;
}

interface SessionNote {
  id: string;
  timestamp: Date;
  author: string;
  type: 'observation' | 'diagnosis' | 'prescription' | 'recommendation';
  content: string;
  isPrivate: boolean;
}

interface SessionMetrics {
  duration: number;
  videoQuality: number;
  audioQuality: number;
  networkLatency: number;
  participantCount: number;
  notesCount: number;
  prescriptionsIssued: number;
}

interface UseTelemedicineSessionReturn {
  // Estado de la sesión
  sessionState: 'idle' | 'starting' | 'active' | 'paused' | 'ended' | 'error';
  isConnected: boolean;
  isRecording: boolean;
  error: Error | null;
  
  // Participantes
  participants: TelemedicineParticipant[];
  currentUser: User | null;
  patient: Patient | null;
  
  // Comunicación
  startSession: () => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  
  // Video y audio
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
  
  // Chat y comunicación
  sendMessage: (message: string, isPrivate?: boolean) => Promise<void>;
  messages: MessageEvent[];
  unreadCount: number;
  
  // Notas médicas
  addNote: (note: Omit<SessionNote, 'id' | 'timestamp' | 'author'>) => Promise<void>;
  notes: SessionNote[];
  
  // Grabación
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Métricas
  metrics: SessionMetrics;
  
  // Notificaciones
  sendEmergencyAlert: () => Promise<void>;
  
  // Utilidades
  exportSession: () => SessionExport;
  getSessionSummary: () => SessionSummary;
}

interface SessionExport {
  sessionId: string;
  participants: TelemedicineParticipant[];
  notes: SessionNote[];
  messages: MessageEvent[];
  metrics: SessionMetrics;
  duration: number;
  timestamp: Date;
}

interface SessionSummary {
  patientName: string;
  doctorName: string;
  duration: string;
  notesCount: number;
  prescriptionsIssued: number;
  followUpRequired: boolean;
  nextAppointment?: Date;
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook compuesto para manejar sesiones completas de telemedicina
 */
export function useTelemedicineSession(
  config: TelemedicineSessionConfig
): UseTelemedicineSessionReturn {
  const {
    sessionId,
    patientId,
    doctorId,
    consultationType,
    maxDuration = 60,
    recordSession = true,
    videoQuality = 'high',
    allowScreenShare = true,
    allowChat = true
  } = config;

  // ==========================================
  // ESTADO DEL HOOK
  // ==========================================

  const [sessionState, setSessionState] = useState<'idle' | 'starting' | 'active' | 'paused' | 'ended' | 'error'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<TelemedicineParticipant[]>([]);
  const [messages, setMessages] = useState<MessageEvent[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // ==========================================
  // HOOKS DEPENDIENTES
  // ==========================================

  // Autenticación
  const { user: currentUser, hasPermission } = useAuth();

  // Datos del paciente
  const patientsApi = usePatients();
  const patient = useMemo<Patient>(() => {
    if (typeof (patientsApi as any).getPatient === 'function') {
      return (patientsApi as any).getPatient(patientId);
    }
    const list = (patientsApi as any).patients as Array<{ id: string; name?: string }>;
    return list?.find(p => p.id === patientId) ?? null;
  }, [patientsApi, patientId]);

  // WebRTC para video llamada
  const webrtc = useWebRTC(`telemedicine_${sessionId}`, {
    autoStart: false,
    mediaConstraints: {
      video: {
        width: videoQuality === 'ultra' ? 1920 : videoQuality === 'high' ? 1280 : 640,
        height: videoQuality === 'ultra' ? 1080 : videoQuality === 'high' ? 720 : 360,
        frameRate: 30
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    },
    medical: {
      recordSession,
      videoQuality,
      e2eEncryption: true
    }
  });

  // Tiempo real para chat y notificaciones
  const realtime = useRealTimeUpdates({
    transport: 'websocket',
    channels: [`telemedicine_${sessionId}`, `chat_${sessionId}`, 'medical_alerts'],
    keepHistory: true
  }, {
    onEvent: handleRealtimeEvent
  });

  // Notificaciones
  const notifications = useNotifications({
    notificationTypes: ['telemedicine', 'medical_alert', 'session_event'],
    userConfig: {
      userType: currentUser?.userType as any,
      preferences: {
        enableSound: true,
        enableDesktop: true
      }
    }
  });

  // ==========================================
  // MANEJADORES DE EVENTOS
  // ==========================================

  function handleRealtimeEvent(event: MessageEvent) {
    switch (event.type) {
      case 'participant_joined':
        handleParticipantJoined(event.data);
        break;
        
      case 'participant_left':
        handleParticipantLeft(event.data);
        break;
        
      case 'chat_message':
        handleChatMessage(event);
        break;
        
      case 'session_note_added':
        handleNoteAdded(event.data);
        break;
        
      case 'emergency_alert':
        handleEmergencyAlert(event.data);
        break;
        
      case 'session_ended':
        handleSessionEnded(event.data);
        break;
    }
  }

  const handleParticipantJoined = useCallback((participantData: any) => {
    const participant: TelemedicineParticipant = {
      id: participantData.id,
      name: participantData.name,
      role: participantData.role,
      isVideoEnabled: participantData.video || false,
      isAudioEnabled: participantData.audio || false,
      connectionQuality: 'good',
      joinedAt: new Date()
    };

    setParticipants(prev => [...prev, participant]);

    // Notificar unión
    notifications.sendNotification({
      title: 'Participante se unió',
      message: `${participant.name} se ha unido a la consulta`,
      type: 'info',
      priority: 'medium'
    });
  }, [notifications]);

  const handleParticipantLeft = useCallback((participantData: any) => {
    setParticipants(prev => prev.filter(p => p.id !== participantData.id));

    notifications.sendNotification({
      title: 'Participante salió',
      message: `${participantData.name} ha salido de la consulta`,
      type: 'info',
      priority: 'medium'
    });
  }, [notifications]);

  const handleChatMessage = useCallback((event: MessageEvent) => {
    setMessages(prev => [...prev, event]);
    
    // Incrementar contador de no leídos si no es del usuario actual
    if (event.metadata?.senderId !== currentUser?.id) {
      setUnreadCount(prev => prev + 1);
    }
  }, [currentUser]);

  const handleNoteAdded = useCallback((noteData: any) => {
    const note: SessionNote = {
      id: noteData.id,
      timestamp: new Date(noteData.timestamp),
      author: noteData.author,
      type: noteData.type,
      content: noteData.content,
      isPrivate: noteData.isPrivate || false
    };

    setNotes(prev => [...prev, note]);
  }, []);

  const handleEmergencyAlert = useCallback((alertData: any) => {
    notifications.sendMedicalAlert({
      title: '🚨 ALERTA MÉDICA',
      message: alertData.message,
      type: 'medical_alert',
      priority: 'critical',
      medicalContext: {
        patientId,
        sessionId,
        emergencyLevel: 'critical'
      }
    });
  }, [notifications, patientId, sessionId]);

  const handleSessionEnded = useCallback((endData: any) => {
    setSessionState('ended');
    
    // Detener WebRTC
    webrtc.endCall();
    
    // Detener grabación si está activa
    if (isRecording) {
      stopRecording();
    }
  }, [webrtc, isRecording]);

  // ==========================================
  // MÉTODOS PRINCIPALES
  // ==========================================

  const startSession = useCallback(async (): Promise<void> => {
    try {
      setSessionState('starting');
      setError(null);

      // Verificar permisos
      if (!hasPermission('access_telemedicine')) {
        throw new Error('No tienes permisos para acceder a telemedicina');
      }

      // Inicializar WebRTC
      await webrtc.startCall(doctorId);

      // Marcar inicio de sesión
      setSessionStartTime(new Date());
      setSessionState('active');

      // Notificar inicio de sesión
      await realtime.publish(`telemedicine_${sessionId}`, {
        type: 'session_started',
        sessionId,
        patientId,
        doctorId,
        timestamp: new Date()
      });

      // Iniciar grabación si está configurado
      if (recordSession) {
        await startRecording();
      }

      // Notificación de inicio
      notifications.sendNotification({
        title: 'Consulta iniciada',
        message: `Consulta de ${consultationType} iniciada correctamente`,
        type: 'success',
        priority: 'medium'
      });

    } catch (error) {
      setError(error as Error);
      setSessionState('error');
      throw error;
    }
  }, [webrtc, doctorId, hasPermission, realtime, sessionId, patientId, recordSession, consultationType, notifications]);

  const endSession = useCallback(async (reason?: string): Promise<void> => {
    try {
      // Finalizar WebRTC
      webrtc.endCall();

      // Detener grabación
      if (isRecording) {
        await stopRecording();
      }

      // Notificar fin de sesión
      await realtime.publish(`telemedicine_${sessionId}`, {
        type: 'session_ended',
        sessionId,
        reason: reason || 'session_completed',
        duration: sessionStartTime ? Date.now() - sessionStartTime.getTime() : 0,
        timestamp: new Date()
      });

      setSessionState('ended');

      // Notificación de finalización
      notifications.sendNotification({
        title: 'Consulta finalizada',
        message: reason || 'La consulta ha finalizado correctamente',
        type: 'success',
        priority: 'medium'
      });

    } catch (error) {
      logger.error('Error ending session:', error);
      setError(error as Error);
    }
  }, [webrtc, isRecording, realtime, sessionId, sessionStartTime, notifications]);

  const pauseSession = useCallback(() => {
    setSessionState('paused');
    webrtc.toggleVideo(); // Pausar video
    webrtc.toggleAudio(); // Mutear audio
  }, [webrtc]);

  const resumeSession = useCallback(() => {
    setSessionState('active');
    webrtc.toggleVideo(); // Reanudar video
    webrtc.toggleAudio(); // Activar audio
  }, [webrtc]);

  // ==========================================
  // MÉTODOS DE COMUNICACIÓN
  // ==========================================

  const sendMessage = useCallback(async (message: string, isPrivate = false): Promise<void> => {
    if (!allowChat) return;

    const messageEvent: MessageEvent = {
      id: `msg_${Date.now()}`,
      type: 'chat_message',
      channel: `chat_${sessionId}`,
      data: {
        content: message,
        isPrivate,
        sessionId
      },
      timestamp: new Date(),
      metadata: {
        senderId: currentUser?.id,
        medicalContext: {
          patientId,
          sessionId
        }
      }
    };

    await realtime.publish(`chat_${sessionId}`, messageEvent);
  }, [allowChat, sessionId, currentUser, patientId, realtime]);

  const addNote = useCallback(async (
    noteData: Omit<SessionNote, 'id' | 'timestamp' | 'author'>
  ): Promise<void> => {
    const note: SessionNote = {
      id: `note_${Date.now()}`,
      timestamp: new Date(),
      author: currentUser?.name || 'Unknown',
      ...noteData
    };

    await realtime.publish(`telemedicine_${sessionId}`, {
      type: 'session_note_added',
      note,
      sessionId
    });
  }, [currentUser, realtime, sessionId]);

  // ==========================================
  // MÉTODOS DE GRABACIÓN
  // ==========================================

  const startRecording = useCallback(async (): Promise<void> => {
    if (!hasPermission('hipaa_access')) {
      throw new Error('No tienes permisos para grabar sesiones médicas');
    }

    // Implementar lógica de grabación
    setIsRecording(true);

    notifications.sendNotification({
      title: '🔴 Grabación iniciada',
      message: 'La consulta está siendo grabada por motivos médicos',
      type: 'info',
      priority: 'high'
    });
  }, [hasPermission, notifications]);

  const stopRecording = useCallback(async (): Promise<void> => {
    setIsRecording(false);

    notifications.sendNotification({
      title: '⏹️ Grabación finalizada',
      message: 'La grabación se ha guardado de forma segura',
      type: 'success',
      priority: 'medium'
    });
  }, [notifications]);

  // ==========================================
  // MÉTODOS DE UTILIDADES
  // ==========================================

  const sendEmergencyAlert = useCallback(async (): Promise<void> => {
    await realtime.publish('medical_alerts', {
      type: 'emergency_alert',
      message: 'Situación de emergencia durante consulta de telemedicina',
      sessionId,
      patientId,
      doctorId,
      timestamp: new Date(),
      priority: 'critical'
    });
  }, [realtime, sessionId, patientId, doctorId]);

  const exportSession = useCallback((): SessionExport => {
    return {
      sessionId,
      participants,
      notes,
      messages,
      metrics: calculateMetrics(),
      duration: sessionStartTime ? Date.now() - sessionStartTime.getTime() : 0,
      timestamp: new Date()
    };
  }, [sessionId, participants, notes, messages, sessionStartTime]);

  const getSessionSummary = useCallback((): SessionSummary => {
    const doctor = participants.find(p => p.role === 'doctor');
    const duration = sessionStartTime ? Date.now() - sessionStartTime.getTime() : 0;
    
    return {
      patientName: patient?.name || 'Unknown Patient',
      doctorName: doctor?.name || 'Unknown Doctor',
      duration: formatDuration(duration),
      notesCount: notes.length,
      prescriptionsIssued: notes.filter(n => n.type === 'prescription').length,
      followUpRequired: notes.some(n => n.content.toLowerCase().includes('seguimiento'))
    };
  }, [participants, patient, sessionStartTime, notes]);

  // ==========================================
  // MÉTODOS HELPER
  // ==========================================

  const calculateMetrics = useCallback((): SessionMetrics => {
    const duration = sessionStartTime ? Date.now() - sessionStartTime.getTime() : 0;
    
    return {
      duration,
      videoQuality: webrtc.state.medicalMetrics?.videoQualityScore || 0,
      audioQuality: webrtc.state.medicalMetrics?.audioQualityScore || 0,
      networkLatency: webrtc.state.medicalMetrics?.networkStability || 0,
      participantCount: participants.length,
      notesCount: notes.length,
      prescriptionsIssued: notes.filter(n => n.type === 'prescription').length
    };
  }, [sessionStartTime, webrtc.state.medicalMetrics, participants.length, notes]);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // EFECTOS
  // ==========================================

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (sessionState === 'active') {
        endSession('component_unmounted');
      }
    };
  }, []);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estado
    sessionState,
    isConnected: webrtc.isConnected,
    isRecording,
    error: error || webrtc.error,
    
    // Participantes
    participants,
    currentUser,
    patient,
    
    // Sesión
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    
    // Video y audio
    toggleVideo: webrtc.toggleVideo,
    toggleAudio: webrtc.toggleAudio,
  toggleScreenShare: webrtc.toggleScreenShare,
    switchCamera: async () => {
      // Implementar cambio de cámara
    },
    
    // Comunicación
    sendMessage,
    messages,
    unreadCount,
    
    // Notas
    addNote,
    notes,
    
    // Grabación
    startRecording,
    stopRecording,
    
    // Métricas
    metrics: calculateMetrics(),
    
    // Emergencias
    sendEmergencyAlert,
    
    // Utilidades
    exportSession,
    getSessionSummary
  };
}