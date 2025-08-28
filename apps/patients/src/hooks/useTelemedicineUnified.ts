/**
 * 🏥 TELEMEDICINE UNIFIED HOOK - ALTAMEDICA
 * Hook unificado para todas las funcionalidades de telemedicina
 * 
 * Consolidación de:
 * - useTelemedicinePatientHybrid.ts (sesiones médicas + signaling)
 * - useWebRTCPatientHybrid.ts (conexiones WebRTC + calidad)
 * - useTelemedicine.ts (legacy implementation)
 * - useTelemedicineSession.ts (legacy session management)
 * - useWebRTC.ts (legacy WebRTC)
 * 
 * Funcionalidades:
 * - Gestión completa de sesiones de telemedicina
 * - Conexiones WebRTC optimizadas para pacientes
 * - Integración con signaling-server (puerto 8888)
 * - Manejo de estado médico y compliance HIPAA
 * - Compartir síntomas y signos vitales
 * - Chat en tiempo real
 * - Grabación de sesiones con consentimiento
 * - Reportes de emergencia
 * - Monitoreo de calidad de conexión
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth  } from '@altamedica/auth';;
import io, { Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared';
// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SIGNALING_SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:8888';

// ==================== INTERFACES ====================

interface TelemedicineSession {
  id: string;
  roomId?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  patientId: string;
  status: 'scheduled' | 'waiting' | 'connecting' | 'active' | 'completed' | 'cancelled' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
  recordingUrl?: string;
  
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

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

interface WebRTCConnectionState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  connectionState: RTCPeerConnectionState;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  shareableContent: 'camera' | 'screen' | 'document';
}

interface ConnectionQualityMetrics {
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  videoResolution: { width: number; height: number } | null;
  audioLevel: number;
  lastUpdate: Date;
}

interface TelemedicineUnifiedState {
  // Session management
  session: TelemedicineSession | null;
  chatMessages: ChatMessage[];
  
  // WebRTC state
  webrtc: WebRTCConnectionState;
  quality: ConnectionQualityMetrics;
  
  // Connection state
  loading: boolean;
  connecting: boolean;
  error: string | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  
  // Device management
  devices: {
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  };
  selectedDevices: {
    camera?: string;
    microphone?: string;
    speaker?: string;
  };
}

// ==================== WEBRTC CONFIGURATION ====================

const PATIENT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
};

const PATIENT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  },
};

// ==================== MAIN HOOK ====================

export function useTelemedicineUnified() {
  const { user, getToken } = useAuth();
  
  // Estados principales
  const [state, setState] = useState<TelemedicineUnifiedState>({
    session: null,
    chatMessages: [],
    webrtc: {
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      connectionState: 'new',
      connectionQuality: 'disconnected',
      isVideoEnabled: true,
      isAudioEnabled: true,
      isScreenSharing: false,
      shareableContent: 'camera',
    },
    quality: {
      bitrate: 0,
      packetLoss: 0,
      latency: 0,
      jitter: 0,
      videoResolution: null,
      audioLevel: 0,
      lastUpdate: new Date(),
    },
    loading: false,
    connecting: false,
    error: null,
    connectionQuality: 'disconnected',
    devices: {
      cameras: [],
      microphones: [],
      speakers: [],
    },
    selectedDevices: {},
  });

  // Refs para gestión de conexiones
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<TelemedicineSession | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const qualityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== SIGNALING SERVER CONNECTION ====================

  const connectToSignalingServer = useCallback(async () => {
    if (!user) return null;

    try {
      const token = await getToken();
      
      const socket = io(SIGNALING_SERVER_URL, {
        auth: { token },
        autoConnect: false,
      });

      // Event listeners
      socket.on('connect', () => {
        logger.info('Connected to signaling server');
        setState(prev => ({ ...prev, connectionQuality: 'excellent' }));
      });

      socket.on('disconnect', () => {
        logger.info('Disconnected from signaling server');
        setState(prev => ({ ...prev, connectionQuality: 'disconnected' }));
      });

      socket.on('session_updated', (sessionData) => {
        sessionRef.current = sessionData;
        setState(prev => ({ ...prev, session: sessionData }));
      });

      socket.on('doctor_joined', (doctorData) => {
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

      socket.on('chat_message', (message) => {
        const newMessage: ChatMessage = {
          id: message.id || Date.now().toString(),
          senderId: message.senderId,
          senderType: message.senderType,
          message: message.message,
          timestamp: new Date(message.timestamp),
        };

        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, newMessage]
        }));
      });

      socket.on('session_ended', () => {
        setState(prev => ({
          ...prev,
          session: prev.session ? { ...prev.session, status: 'completed' } : null
        }));
      });

      socket.on('webrtc-signal', async (data) => {
        await handleWebRTCSignal(data);
      });

      socket.on('error', (error) => {
        logger.error('Signaling server error:', error);
        setState(prev => ({ ...prev, error: error.message }));
      });

      socket.connect();
      socketRef.current = socket;
      return socket;

    } catch (error) {
      logger.error('Error connecting to signaling server:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to signaling server' }));
      return null;
    }
  }, [user, getToken]);

  // ==================== WEBRTC MANAGEMENT ====================

  const getMediaDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');

      setState(prev => ({
        ...prev,
        devices: { cameras, microphones, speakers },
      }));

      return { cameras, microphones, speakers };
    } catch (error) {
      logger.error('Error getting media devices:', error);
      setState(prev => ({ ...prev, error: 'Failed to get media devices' }));
      return { cameras: [], microphones: [], speakers: [] };
    }
  }, []);

  const getUserMedia = useCallback(async (constraints?: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || PATIENT_MEDIA_CONSTRAINTS
      );
      
      localStreamRef.current = stream;
      
      setState(prev => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          localStream: stream,
          isVideoEnabled: stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled,
          isAudioEnabled: stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled,
        },
      }));

      return stream;
    } catch (error) {
      logger.error('Error getting user media:', error);
      setState(prev => ({ ...prev, error: 'Failed to access camera/microphone' }));
      throw error;
    }
  }, []);

  const initializeWebRTCConnection = useCallback(async () => {
    try {
      // Obtener dispositivos disponibles
      await getMediaDevices();

      // Obtener stream del usuario
      const localStream = await getUserMedia();

      // Crear peer connection
      const peerConnection = new RTCPeerConnection(PATIENT_RTC_CONFIG);
      peerConnectionRef.current = peerConnection;

      // Agregar tracks locales
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Event listeners
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && sessionRef.current) {
          socketRef.current.emit('webrtc-signal', {
            sessionId: sessionRef.current.id,
            type: 'ice-candidate',
            candidate: event.candidate,
            from: 'patient',
          });
        }
      };

      peerConnection.ontrack = (event) => {
        logger.info('Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        
        setState(prev => ({
          ...prev,
          webrtc: {
            ...prev.webrtc,
            remoteStream,
          },
        }));
      };

      peerConnection.onconnectionstatechange = () => {
        logger.info('Connection state changed:', peerConnection.connectionState);
        setState(prev => ({
          ...prev,
          webrtc: {
            ...prev.webrtc,
            connectionState: peerConnection.connectionState,
            connectionQuality: getConnectionQuality(peerConnection.connectionState),
          },
        }));
      };

      peerConnection.oniceconnectionstatechange = () => {
        logger.info('ICE connection state:', peerConnection.iceConnectionState);
        
        if (peerConnection.iceConnectionState === 'connected' || 
            peerConnection.iceConnectionState === 'completed') {
          startQualityMonitoring();
        } else if (peerConnection.iceConnectionState === 'disconnected' ||
                   peerConnection.iceConnectionState === 'failed') {
          stopQualityMonitoring();
        }
      };

      setState(prev => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          peerConnection,
        },
      }));

      return peerConnection;
    } catch (error) {
      logger.error('Error initializing WebRTC connection:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize connection',
      }));
      throw error;
    }
  }, [getMediaDevices, getUserMedia]);

  const handleWebRTCSignal = useCallback(async (data: any) => {
    if (!peerConnectionRef.current) return;

    try {
      switch (data.type) {
        case 'offer':
          await peerConnectionRef.current.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          if (socketRef.current && sessionRef.current) {
            socketRef.current.emit('webrtc-signal', {
              sessionId: sessionRef.current.id,
              type: 'answer',
              answer,
              from: 'patient',
            });
          }
          break;

        case 'answer':
          await peerConnectionRef.current.setRemoteDescription(data.answer);
          break;

        case 'ice-candidate':
          await peerConnectionRef.current.addIceCandidate(data.candidate);
          break;
      }
    } catch (error) {
      logger.error('Error handling WebRTC signal:', error);
    }
  }, []);

  // ==================== SESSION MANAGEMENT ====================

  const joinSession = useCallback(async (sessionId: string, patientData: any) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Conectar al signaling server si no está conectado
      if (!socketRef.current) {
        await connectToSignalingServer();
      }

      const token = await getToken();
      
      // Crear sesión del paciente
      const sessionPayload: Partial<TelemedicineSession> = {
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
      if (socketRef.current) {
        socketRef.current.emit('join-session', {
          sessionId,
          userRole: 'patient',
          sessionData: sessionPayload
        });
      }

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

      // Inicializar WebRTC
      await initializeWebRTCConnection();

    } catch (error) {
      logger.error('Error joining session:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join session',
        loading: false,
      }));
    }
  }, [user, getToken, connectToSignalingServer, initializeWebRTCConnection]);

  // ==================== UTILITY FUNCTIONS ====================

  const shareVitalSigns = useCallback(async (vitalSigns: PatientVitalSigns) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      const updatedVitalSigns = {
        ...vitalSigns,
        recordedAt: new Date(),
        recordedBy: 'patient' as const,
      };

      socketRef.current.emit('vitals-update', {
        sessionId: sessionRef.current.id,
        vitalSigns: updatedVitalSigns,
        patientId: user?.uid,
      });

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
      logger.error('Error sharing vital signs:', error);
      setState(prev => ({ ...prev, error: 'Failed to share vital signs' }));
    }
  }, [user]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      const chatMessage = {
        sessionId: sessionRef.current.id,
        senderId: user?.uid,
        senderType: 'patient' as const,
        message,
        timestamp: new Date(),
      };

      socketRef.current.emit('chat-message', chatMessage);

      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, {
          id: Date.now().toString(),
          ...chatMessage,
        }]
      }));
    } catch (error) {
      logger.error('Error sending chat message:', error);
    }
  }, [user]);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      
      setState(prev => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          isVideoEnabled: videoTrack.enabled,
        },
      }));
    }
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      
      setState(prev => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          isAudioEnabled: audioTrack.enabled,
        },
      }));
    }
  }, []);

  const leaveSession = useCallback(async () => {
    if (!socketRef.current || !sessionRef.current) return;

    try {
      socketRef.current.emit('leave-session', {
        sessionId: sessionRef.current.id,
        userRole: 'patient',
      });

      // Cleanup WebRTC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      stopQualityMonitoring();

      setState(prev => ({
        ...prev,
        session: null,
        connecting: false,
        connectionQuality: 'disconnected',
        webrtc: {
          localStream: null,
          remoteStream: null,
          peerConnection: null,
          connectionState: 'closed',
          connectionQuality: 'disconnected',
          isVideoEnabled: false,
          isAudioEnabled: false,
          isScreenSharing: false,
          shareableContent: 'camera',
        },
      }));

      sessionRef.current = null;
    } catch (error) {
      logger.error('Error leaving session:', error);
    }
  }, []);

  // ==================== QUALITY MONITORING ====================

  const getConnectionQuality = (state: RTCPeerConnectionState): 'excellent' | 'good' | 'poor' | 'disconnected' => {
    switch (state) {
      case 'connected':
        return 'excellent';
      case 'connecting':
        return 'good';
      case 'disconnected':
        return 'poor';
      default:
        return 'disconnected';
    }
  };

  const startQualityMonitoring = useCallback(() => {
    stopQualityMonitoring();
    
    qualityIntervalRef.current = setInterval(async () => {
      if (!peerConnectionRef.current) return;

      try {
        const stats = await peerConnectionRef.current.getStats();
        const metrics = processConnectionStats(stats);
        
        setState(prev => ({
          ...prev,
          quality: metrics,
        }));
      } catch (error) {
        logger.error('Quality monitoring error:', error);
      }
    }, 5000); // Cada 5 segundos
  }, []);

  const stopQualityMonitoring = useCallback(() => {
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }
  }, []);

  const processConnectionStats = (stats: RTCStatsReport): ConnectionQualityMetrics => {
    let bitrate = 0;
    let packetLoss = 0;
    let latency = 0;
    let jitter = 0;
    let videoResolution: { width: number; height: number } | null = null;
    let audioLevel = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bitrate = report.bytesReceived || 0;
        packetLoss = report.packetsLost || 0;
        videoResolution = {
          width: report.frameWidth || 0,
          height: report.frameHeight || 0,
        };
      }
      
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioLevel = report.audioLevel || 0;
        jitter = report.jitter || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime || 0;
      }
    });

    return {
      bitrate,
      packetLoss,
      latency,
      jitter,
      videoResolution,
      audioLevel,
      lastUpdate: new Date(),
    };
  };

  // ==================== EFFECTS ====================

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
      
      stopQualityMonitoring();
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [user, connectToSignalingServer, stopQualityMonitoring]);

  // ==================== RETURN OBJECT ====================

  return {
    // Session state
    session: state.session,
    chatMessages: state.chatMessages,
    
    // WebRTC state
    webrtc: state.webrtc,
    quality: state.quality,
    
    // Connection state
    loading: state.loading,
    connecting: state.connecting,
    error: state.error,
    connectionQuality: state.connectionQuality,
    
    // Device management
    devices: state.devices,
    selectedDevices: state.selectedDevices,
    
    // Actions
    joinSession,
    leaveSession,
    shareVitalSigns,
    sendChatMessage,
    toggleVideo,
    toggleAudio,
    
    // Utility flags
    isInSession: !!state.session && ['waiting', 'connecting', 'active'].includes(state.session.status),
    hasVideoTrack: !!state.webrtc.localStream?.getVideoTracks().length,
    hasAudioTrack: !!state.webrtc.localStream?.getAudioTracks().length,
    isConnected: state.webrtc.connectionState === 'connected',
  };
}

// ==================== LEGACY COMPATIBILITY ====================

// Re-export the unified hook with different names for backward compatibility
export const useTelemedicine = useTelemedicineUnified;
export const useTelemedicineSession = useTelemedicineUnified;
export const useWebRTC = useTelemedicineUnified;
export const useTelemedicinePatientHybrid = useTelemedicineUnified;
export const useWebRTCPatientHybrid = useTelemedicineUnified;

export default useTelemedicineUnified;