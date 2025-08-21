/**
 * 🎥 WEBRTC PATIENT HYBRID HOOK - ALTAMEDICA (DEPRECATED)
 * 
 * ⚠️ DEPRECATION NOTICE:
 * Este archivo ha sido consolidado en useTelemedicineUnified.ts
 * 
 * FUNCIONALIDADES MIGRADAS:
 * - ✅ Configuración WebRTC optimizada → useTelemedicineUnified
 * - ✅ Signaling-server P2P → useTelemedicineUnified
 * - ✅ Monitoreo de calidad de conexión → useTelemedicineUnified
 * - ✅ Gestión de dispositivos → useTelemedicineUnified
 * - ✅ Compartir pantalla → useTelemedicineUnified
 * - ✅ Control video/audio → useTelemedicineUnified
 * - ✅ Diagnósticos de conexión → useTelemedicineUnified
 * 
 * NUEVA UBICACIÓN: ./useTelemedicineUnified.ts
 */

// Re-export from unified implementation
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

// Backward compatibility export
export const useWebRTCPatientHybrid = useTelemedicineUnified;

import { useAuth  } from '@altamedica/auth';;
import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración WebRTC optimizada para pacientes
const PATIENT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // En producción, usar servidores STUN/TURN propios
    // { urls: 'stun:stun.altamedica.com:3478' },
    // { urls: 'turn:turn.altamedica.com:3478', username: 'user', credential: 'pass' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
};

// Configuración de medios optimizada para consultas médicas
const PATIENT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user', // Cámara frontal por defecto para pacientes
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  },
};

// Interfaces para WebRTC de pacientes
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

interface WebRTCHookState {
  connection: WebRTCConnectionState;
  quality: ConnectionQualityMetrics;
  loading: boolean;
  error: string | null;
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

interface WebRTCHookActions {
  initializeConnection: (sessionId: string, signaling: any) => Promise<void>;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  shareScreen: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
  changeDevice: (deviceType: 'camera' | 'microphone' | 'speaker', deviceId: string) => Promise<void>;
  closeConnection: () => Promise<void>;
  runDiagnostics: () => Promise<ConnectionQualityMetrics>;
}

export function useWebRTCPatientHybrid(): [WebRTCHookState, WebRTCHookActions] {
  const { user } = useAuth();

  // State management
  const [state, setState] = useState<WebRTCHookState>({
    connection: {
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
    error: null,
    devices: {
      cameras: [],
      microphones: [],
      speakers: [],
    },
    selectedDevices: {},
  });

  // Refs para gestión de conexiones
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const signalingRef = useRef<any>(null);
  const qualityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para obtener dispositivos multimedia
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

  // Función para obtener stream de usuario
  const getUserMedia = useCallback(async (constraints?: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || PATIENT_MEDIA_CONSTRAINTS
      );
      
      localStreamRef.current = stream;
      
      setState(prev => ({
        ...prev,
        connection: {
          ...prev.connection,
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

  // Función para inicializar conexión WebRTC
  const initializeConnection = useCallback(async (sessionId: string, signaling: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

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
        if (event.candidate && signaling) {
          signaling.emit('webrtc-signal', {
            sessionId,
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
          connection: {
            ...prev.connection,
            remoteStream,
          },
        }));
      };

      peerConnection.onconnectionstatechange = () => {
        logger.info('Connection state changed:', peerConnection.connectionState);
        setState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
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
        connection: {
          ...prev.connection,
          peerConnection,
        },
        loading: false,
      }));

      signalingRef.current = signaling;

    } catch (error) {
      logger.error('Error initializing WebRTC connection:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize connection',
        loading: false,
      }));
    }
  }, [getMediaDevices, getUserMedia]);

  // Función para crear offer (paciente responde a doctor)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      return answer;

    } catch (error) {
      logger.error('Error creating answer:', error);
      throw error;
    }
  }, []);

  // Función para crear offer (raramente usado por pacientes)
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      return offer;

    } catch (error) {
      logger.error('Error creating offer:', error);
      throw error;
    }
  }, []);

  // Función para agregar ICE candidate
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      logger.warn('Peer connection not available for ICE candidate');
      return;
    }

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      logger.error('Error adding ICE candidate:', error);
    }
  }, []);

  // Función para toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      
      setState(prev => ({
        ...prev,
        connection: {
          ...prev.connection,
          isVideoEnabled: videoTrack.enabled,
        },
      }));
    }
  }, []);

  // Función para toggle audio
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      
      setState(prev => ({
        ...prev,
        connection: {
          ...prev.connection,
          isAudioEnabled: audioTrack.enabled,
        },
      }));
    }
  }, []);

  // Función para compartir pantalla (útil para mostrar documentos médicos)
  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      if (peerConnectionRef.current && localStreamRef.current) {
        // Reemplazar track de video con pantalla compartida
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Manejar fin de compartir pantalla
        videoTrack.onended = () => {
          stopScreenShare();
        };

        setState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            isScreenSharing: true,
            shareableContent: 'screen',
          },
        }));
      }

    } catch (error) {
      logger.error('Error sharing screen:', error);
      setState(prev => ({ ...prev, error: 'Failed to share screen' }));
    }
  }, []);

  // Función para detener compartir pantalla
  const stopScreenShare = useCallback(async () => {
    try {
      if (peerConnectionRef.current && localStreamRef.current) {
        // Volver a cámara
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        setState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            isScreenSharing: false,
            shareableContent: 'camera',
          },
        }));
      }

    } catch (error) {
      logger.error('Error stopping screen share:', error);
    }
  }, []);

  // Función para cambiar cámara (frontal/trasera en móviles)
  const switchCamera = useCallback(async () => {
    try {
      const currentConstraints = PATIENT_MEDIA_CONSTRAINTS.video as MediaTrackConstraints;
      const newFacingMode = currentConstraints.facingMode === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        ...PATIENT_MEDIA_CONSTRAINTS,
        video: {
          ...currentConstraints,
          facingMode: newFacingMode,
        },
      });

      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Detener stream anterior
        localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        
        // Actualizar referencia
        localStreamRef.current = newStream;

        setState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            localStream: newStream,
          },
        }));
      }

    } catch (error) {
      logger.error('Error switching camera:', error);
      setState(prev => ({ ...prev, error: 'Failed to switch camera' }));
    }
  }, []);

  // Función para cambiar dispositivo
  const changeDevice = useCallback(async (
    deviceType: 'camera' | 'microphone' | 'speaker', 
    deviceId: string
  ) => {
    try {
      setState(prev => ({
        ...prev,
        selectedDevices: {
          ...prev.selectedDevices,
          [deviceType]: deviceId,
        },
      }));

      if (deviceType === 'camera' || deviceType === 'microphone') {
        const constraints: MediaStreamConstraints = {
          video: deviceType === 'camera' ? { deviceId: { exact: deviceId } } : true,
          audio: deviceType === 'microphone' ? { deviceId: { exact: deviceId } } : true,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (peerConnectionRef.current && localStreamRef.current) {
          const newTrack = deviceType === 'camera' 
            ? newStream.getVideoTracks()[0] 
            : newStream.getAudioTracks()[0];
          
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === newTrack.kind
          );

          if (sender) {
            await sender.replaceTrack(newTrack);
          }

          // Detener track anterior
          const oldTracks = deviceType === 'camera' 
            ? localStreamRef.current.getVideoTracks()
            : localStreamRef.current.getAudioTracks();
          
          oldTracks.forEach(track => track.stop());
        }
      }

    } catch (error) {
      logger.error(`Error changing ${deviceType}:`, error);
      setState(prev => ({ ...prev, error: `Failed to change ${deviceType}` }));
    }
  }, []);

  // Función para cerrar conexión
  const closeConnection = useCallback(async () => {
    try {
      stopQualityMonitoring();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setState(prev => ({
        ...prev,
        connection: {
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

    } catch (error) {
      logger.error('Error closing connection:', error);
    }
  }, []);

  // Función para diagnósticos de conexión
  const runDiagnostics = useCallback(async (): Promise<ConnectionQualityMetrics> => {
    if (!peerConnectionRef.current) {
      throw new Error('No peer connection available for diagnostics');
    }

    try {
      const stats = await peerConnectionRef.current.getStats();
      const metrics = processConnectionStats(stats);
      
      setState(prev => ({
        ...prev,
        quality: metrics,
      }));

      return metrics;

    } catch (error) {
      logger.error('Error running diagnostics:', error);
      throw error;
    }
  }, []);

  // Funciones auxiliares
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

  const startQualityMonitoring = () => {
    stopQualityMonitoring();
    
    qualityIntervalRef.current = setInterval(async () => {
      try {
        await runDiagnostics();
      } catch (error) {
        logger.error('Quality monitoring error:', error);
      }
    }, 5000); // Cada 5 segundos
  };

  const stopQualityMonitoring = () => {
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }
  };

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

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  return [
    state,
    {
      initializeConnection,
      createOffer,
      createAnswer,
      addIceCandidate,
      toggleVideo,
      toggleAudio,
      shareScreen,
      stopScreenShare,
      switchCamera,
      changeDevice,
      closeConnection,
      runDiagnostics,
    },
  ];
}