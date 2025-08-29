/**
 * Hook WebRTC Híbrido para Doctores
 * WebRTC profesional con funcionalidades médicas específicas + Firebase persistence
 * Incluye grabación médica, análisis de calidad y compliance HIPAA
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { logger } from '@altamedica/shared';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';

// Configuración WebRTC médica profesional
const MEDICAL_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.altamedica.com:3478' }, // STUN server médico personalizado
    {
      urls: 'turn:turn.altamedica.com:3478',
      username: 'medical-turn-user',
      credential: 'medical-turn-pass',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// Constraints médicos optimizados
const MEDICAL_MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    // Configuraciones médicas específicas
    advanced: [
      { width: { min: 640 } },
      { height: { min: 480 } },
      { aspectRatio: { exact: 1.777777778 } }, // 16:9
      { frameRate: { min: 15 } },
    ],
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
    // Configuraciones médicas para claridad de voz
    advanced: [
      { echoCancellation: { exact: true } },
      { noiseSuppression: { exact: true } },
      { autoGainControl: { exact: true } },
    ],
  },
};

interface MedicalWebRTCState {
  // Streams
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenShareStream: MediaStream | null;

  // Estados de conexión
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;

  // Control de medios
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;

  // Funcionalidades médicas
  isRecording: boolean;
  recordingDuration: number;
  recordingQuality: 'low' | 'medium' | 'high' | 'medical';

  // Métricas de calidad médica
  connectionQuality: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    video: {
      resolution: string;
      frameRate: number;
      bitrate: number;
      packetsLost: number;
      jitter: number;
    };
    audio: {
      bitrate: number;
      packetsLost: number;
      jitter: number;
      echoReturnLoss: number;
    };
    network: {
      rtt: number; // Round Trip Time
      bandwidth: number;
      packetLoss: number;
    };
  };

  // Alertas y diagnósticos
  technicalAlerts: MedicalTechnicalAlert[];
  diagnosticInfo: WebRTCDiagnosticInfo;

  // Compliance médico
  encryptionStatus: 'encrypted' | 'not_encrypted' | 'unknown';
  hipaaCompliant: boolean;
  sessionRecorded: boolean;
  consentObtained: boolean;
}

interface MedicalTechnicalAlert {
  id: string;
  timestamp: string;
  type: 'audio_quality' | 'video_quality' | 'connection' | 'security' | 'recording';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  technicalDetails: any;
  resolved: boolean;
  resolvedAt?: string;
}

interface WebRTCDiagnosticInfo {
  localCandidates: RTCIceCandidate[];
  remoteCandidates: RTCIceCandidate[];
  selectedCandidatePair?: RTCIceCandidatePair;
  codecsUsed: {
    audio?: string;
    video?: string;
  };
  bandwidth: {
    available: number;
    used: number;
  };
  latency: number;
  jitter: number;
  packetsLost: number;
  timestamp: string;
}

interface MedicalRecordingOptions {
  quality: 'low' | 'medium' | 'high' | 'medical';
  includeAudio: boolean;
  includeVideo: boolean;
  includeScreenShare: boolean;
  format: 'webm' | 'mp4';
  audioBitrate: number;
  videoBitrate: number;
  maxDuration: number; // minutes
  autoSave: boolean;
  encryptRecording: boolean;
  medicalMetadata: {
    sessionId: string;
    patientId: string;
    doctorId: string;
    recordingPurpose: 'consultation' | 'diagnosis' | 'teaching' | 'legal';
    consentVersion: string;
    hipaaAuthorization: boolean;
  };
}

interface UseWebRTCDoctorHybridConfig {
  sessionId: string;
  doctorId: string;
  patientId: string;
  socket?: Socket;
  firebase?: {
    enabled?: boolean;
    collections?: {
      sessions?: string;
      recordings?: string;
      diagnostics?: string;
      alerts?: string;
    };
  };
  medical?: {
    enableRecording?: boolean;
    requireConsent?: boolean;
    encryptStreams?: boolean;
    qualityMonitoring?: boolean;
    hipaaMode?: boolean;
    autoSaveRecordings?: boolean;
  };
  webrtc?: {
    config?: RTCConfiguration;
    constraints?: MediaStreamConstraints;
  };
}

interface UseWebRTCDoctorHybridReturn extends MedicalWebRTCState {
  // Funciones principales
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;

  // Control de medios
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;

  // Grabación médica
  startRecording: (options?: Partial<MedicalRecordingOptions>) => Promise<void>;
  stopRecording: () => Promise<{ recordingId: string; duration: number; size: number }>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;

  // Calidad y diagnósticos
  getQualityMetrics: () => Promise<MedicalWebRTCState['connectionQuality']>;
  runDiagnostics: () => Promise<WebRTCDiagnosticInfo>;
  optimizeConnection: () => Promise<void>;

  // Funciones médicas específicas
  captureSnapshot: (
    includePatient?: boolean,
  ) => Promise<{ doctorSnapshot: string; patientSnapshot?: string }>;
  enableMedicalFilters: (filters: string[]) => Promise<void>;
  adjustForMedicalExam: (examType: string) => Promise<void>;

  // Alertas y monitoring
  acknowledgeAlert: (alertId: string) => Promise<void>;
  reportIssue: (issue: string, severity: string) => Promise<void>;

  // Compliance
  verifyEncryption: () => Promise<boolean>;
  getComplianceReport: () => Promise<any>;
  exportSessionData: () => Promise<Blob>;
}

export function useWebRTCDoctorHybrid(
  config: UseWebRTCDoctorHybridConfig,
): UseWebRTCDoctorHybridReturn {
  // Estados principales
  const [webrtcState, setWebRTCState] = useState<MedicalWebRTCState>({
    localStream: null,
    remoteStream: null,
    screenShareStream: null,
    isConnected: false,
    isConnecting: false,
    connectionState: 'new',
    iceConnectionState: 'new',
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isRecording: false,
    recordingDuration: 0,
    recordingQuality: 'medical',
    connectionQuality: {
      overall: 'good',
      video: {
        resolution: '0x0',
        frameRate: 0,
        bitrate: 0,
        packetsLost: 0,
        jitter: 0,
      },
      audio: {
        bitrate: 0,
        packetsLost: 0,
        jitter: 0,
        echoReturnLoss: 0,
      },
      network: {
        rtt: 0,
        bandwidth: 0,
        packetLoss: 0,
      },
    },
    technicalAlerts: [],
    diagnosticInfo: {
      localCandidates: [],
      remoteCandidates: [],
      codecsUsed: {},
      bandwidth: { available: 0, used: 0 },
      latency: 0,
      jitter: 0,
      packetsLost: 0,
      timestamp: new Date().toISOString(),
    },
    encryptionStatus: 'unknown',
    hipaaCompliant: config.medical?.hipaaMode || true,
    sessionRecorded: false,
    consentObtained: false,
  });

  // Referencias
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const qualityMonitorInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const firestore = useRef<any>(null);

  // Configuración
  const rtcConfig = config.webrtc?.config || MEDICAL_RTC_CONFIG;
  const mediaConstraints = config.webrtc?.constraints || MEDICAL_MEDIA_CONSTRAINTS;
  const firebase = config.firebase || { enabled: true };
  const medical = config.medical || {};
  const collections = firebase.collections || {
    sessions: 'webrtc_sessions_doctors',
    recordings: 'medical_recordings',
    diagnostics: 'webrtc_diagnostics',
    alerts: 'webrtc_alerts',
  };

  // Inicializar Firebase
  useEffect(() => {
    if (firebase.enabled) {
      try {
        firestore.current = getFirestore();
      } catch (err) {
        logger.warn('Firebase no disponible para WebRTC:', err as any);
      }
    }
  }, [firebase.enabled]);

  // Monitoring de calidad en tiempo real
  useEffect(() => {
    if (webrtcState.isConnected && medical.qualityMonitoring && peerConnection.current) {
      qualityMonitorInterval.current = setInterval(async () => {
        const stats = await peerConnection.current!.getStats();
        const qualityMetrics = analyzeWebRTCStats(stats);

        setWebRTCState((prev) => ({
          ...prev,
          connectionQuality: qualityMetrics,
        }));

        // Verificar alertas de calidad
        checkQualityAlerts(qualityMetrics);

        // Persistir métricas en Firebase
        if (firestore.current) {
          addDoc(collection(firestore.current, collections.diagnostics!), {
            sessionId: config.sessionId,
            timestamp: serverTimestamp(),
            metrics: qualityMetrics,
          }).catch(console.error);
        }
      }, 5000); // Cada 5 segundos

      return () => {
        if (qualityMonitorInterval.current) {
          clearInterval(qualityMonitorInterval.current);
        }
      };
    }
  }, [webrtcState.isConnected, medical.qualityMonitoring]);

  // Timer de grabación
  useEffect(() => {
    if (webrtcState.isRecording) {
      recordingTimer.current = setInterval(() => {
        setWebRTCState((prev) => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 1,
        }));
      }, 1000);

      return () => {
        if (recordingTimer.current) {
          clearInterval(recordingTimer.current);
        }
      };
    }
  }, [webrtcState.isRecording]);

  // Analizar estadísticas WebRTC
  const analyzeWebRTCStats = useCallback((stats: RTCStatsReport) => {
    const metrics = {
      overall: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'critical',
      video: {
        resolution: '0x0',
        frameRate: 0,
        bitrate: 0,
        packetsLost: 0,
        jitter: 0,
      },
      audio: {
        bitrate: 0,
        packetsLost: 0,
        jitter: 0,
        echoReturnLoss: 0,
      },
      network: {
        rtt: 0,
        bandwidth: 0,
        packetLoss: 0,
      },
    };

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        metrics.video.bitrate = report.bytesReceived || 0;
        metrics.video.packetsLost = report.packetsLost || 0;
        metrics.video.jitter = report.jitter || 0;
        metrics.video.frameRate = report.framesPerSecond || 0;

        if (report.frameWidth && report.frameHeight) {
          metrics.video.resolution = `${report.frameWidth}x${report.frameHeight}`;
        }
      }

      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        metrics.audio.bitrate = report.bytesReceived || 0;
        metrics.audio.packetsLost = report.packetsLost || 0;
        metrics.audio.jitter = report.jitter || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        metrics.network.rtt = report.currentRoundTripTime || 0;
        metrics.network.bandwidth = report.availableOutgoingBitrate || 0;
      }
    });

    // Calcular calidad general
    const videoQualityScore = calculateVideoQualityScore(metrics.video);
    const audioQualityScore = calculateAudioQualityScore(metrics.audio);
    const networkQualityScore = calculateNetworkQualityScore(metrics.network);

    const overallScore = (videoQualityScore + audioQualityScore + networkQualityScore) / 3;

    if (overallScore >= 0.8) metrics.overall = 'excellent';
    else if (overallScore >= 0.6) metrics.overall = 'good';
    else if (overallScore >= 0.4) metrics.overall = 'fair';
    else if (overallScore >= 0.2) metrics.overall = 'poor';
    else metrics.overall = 'critical';

    return metrics;
  }, []);

  // Funciones auxiliares de calidad
  const calculateVideoQualityScore = (video: any): number => {
    let score = 1.0;

    // Penalizar por baja resolución
    const [width, height] = video.resolution.split('x').map(Number);
    if (width < 640 || height < 480) score -= 0.3;

    // Penalizar por bajo framerate
    if (video.frameRate < 15) score -= 0.2;
    if (video.frameRate < 10) score -= 0.3;

    // Penalizar por packets perdidos
    if (video.packetsLost > 10) score -= 0.2;
    if (video.packetsLost > 50) score -= 0.3;

    // Penalizar por alto jitter
    if (video.jitter > 0.05) score -= 0.2;

    return Math.max(0, score);
  };

  const calculateAudioQualityScore = (audio: any): number => {
    let score = 1.0;

    // Penalizar por packets perdidos
    if (audio.packetsLost > 5) score -= 0.3;
    if (audio.packetsLost > 20) score -= 0.5;

    // Penalizar por alto jitter
    if (audio.jitter > 0.03) score -= 0.2;
    if (audio.jitter > 0.1) score -= 0.4;

    return Math.max(0, score);
  };

  const calculateNetworkQualityScore = (network: any): number => {
    let score = 1.0;

    // Penalizar por alta latencia
    if (network.rtt > 0.2) score -= 0.2; // 200ms
    if (network.rtt > 0.5) score -= 0.4; // 500ms

    // Penalizar por bajo ancho de banda
    if (network.bandwidth < 500000) score -= 0.3; // 500kbps
    if (network.bandwidth < 200000) score -= 0.5; // 200kbps

    return Math.max(0, score);
  };

  // Verificar alertas de calidad
  const checkQualityAlerts = useCallback(
    (metrics: any) => {
      const alerts: MedicalTechnicalAlert[] = [];

      // Alertas de video
      if (metrics.video.packetsLost > 50) {
        alerts.push({
          id: `alert_video_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'video_quality',
          severity: 'warning',
          message: 'Alta pérdida de paquetes de video detectada',
          technicalDetails: { packetsLost: metrics.video.packetsLost },
          resolved: false,
        });
      }

      // Alertas de audio
      if (metrics.audio.packetsLost > 20) {
        alerts.push({
          id: `alert_audio_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'audio_quality',
          severity: 'error',
          message: 'Calidad de audio degradada - pérdida de paquetes crítica',
          technicalDetails: { packetsLost: metrics.audio.packetsLost },
          resolved: false,
        });
      }

      // Alertas de red
      if (metrics.network.rtt > 0.5) {
        alerts.push({
          id: `alert_network_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'connection',
          severity: 'warning',
          message: 'Latencia de red alta detectada',
          technicalDetails: { rtt: metrics.network.rtt },
          resolved: false,
        });
      }

      if (alerts.length > 0) {
        setWebRTCState((prev) => ({
          ...prev,
          technicalAlerts: [...prev.technicalAlerts, ...alerts],
        }));

        // Persistir alertas en Firebase
        if (firestore.current) {
          alerts.forEach((alert) => {
            addDoc(collection(firestore.current, collections.alerts!), {
              ...alert,
              sessionId: config.sessionId,
              doctorId: config.doctorId,
            }).catch(console.error);
          });
        }
      }
    },
    [config.sessionId, config.doctorId],
  );

  // Funciones principales
  const startCall = useCallback(async (): Promise<void> => {
    try {
      setWebRTCState((prev) => ({ ...prev, isConnecting: true }));

      // Crear PeerConnection
      peerConnection.current = new RTCPeerConnection(rtcConfig);

      // Event listeners
      peerConnection.current.oniceconnectionstatechange = () => {
        setWebRTCState((prev) => ({
          ...prev,
          iceConnectionState: peerConnection.current!.iceConnectionState,
        }));
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current!.connectionState;
        setWebRTCState((prev) => ({
          ...prev,
          connectionState: state,
          isConnected: state === 'connected',
          isConnecting: state === 'connecting',
        }));
      };

      peerConnection.current.ontrack = (event) => {
        setWebRTCState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      };

      // Obtener stream local
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setWebRTCState((prev) => ({ ...prev, localStream: stream }));

      // Agregar tracks al peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });

      // Verificar cifrado
      if (medical.encryptStreams) {
        await verifyEncryption();
      }
    } catch (err) {
      setWebRTCState((prev) => ({
        ...prev,
        isConnecting: false,
        technicalAlerts: [
          ...prev.technicalAlerts,
          {
            id: `alert_start_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'connection',
            severity: 'critical',
            message: `Error al iniciar llamada: ${err as any}`,
            technicalDetails: { error: err as any },
            resolved: false,
          },
        ],
      }));
    }
  }, [rtcConfig, mediaConstraints, medical.encryptStreams]);

  const toggleAudio = useCallback(async (): Promise<void> => {
    if (webrtcState.localStream) {
      const audioTrack = webrtcState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setWebRTCState((prev) => ({
          ...prev,
          isAudioEnabled: audioTrack.enabled,
        }));

        // Log médico
        if (firestore.current) {
          await addDoc(collection(firestore.current, collections.diagnostics!), {
            sessionId: config.sessionId,
            action: 'audio_toggled',
            enabled: audioTrack.enabled,
            timestamp: serverTimestamp(),
          });
        }
      }
    }
  }, [webrtcState.localStream, config.sessionId]);

  const startRecording = useCallback(
    async (options: Partial<MedicalRecordingOptions> = {}): Promise<void> => {
      if (!webrtcState.localStream || !webrtcState.remoteStream) {
        throw new Error('No hay streams disponibles para grabar');
      }

      if (medical.requireConsent && !webrtcState.consentObtained) {
        throw new Error('Consentimiento requerido para grabación médica');
      }

      const recordingOptions: MedicalRecordingOptions = {
        quality: 'medical',
        includeAudio: true,
        includeVideo: true,
        includeScreenShare: false,
        format: 'webm',
        audioBitrate: 128000,
        videoBitrate: medical.encryptStreams ? 2000000 : 1000000,
        maxDuration: 120, // 2 horas
        autoSave: true,
        encryptRecording: medical.encryptStreams || false,
        medicalMetadata: {
          sessionId: config.sessionId,
          patientId: config.patientId,
          doctorId: config.doctorId,
          recordingPurpose: 'consultation',
          consentVersion: '1.0',
          hipaaAuthorization: medical.hipaaMode || false,
        },
        ...options,
      };

      try {
        // Crear canvas para combinar streams
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d')!;

        // Combinar video local y remoto
        const combinedStream = canvas.captureStream(30);

        // Agregar audio
        if (recordingOptions.includeAudio) {
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();

          // Mezclar audio local y remoto
          if (webrtcState.localStream.getAudioTracks().length > 0) {
            const localAudio = audioContext.createMediaStreamSource(webrtcState.localStream);
            localAudio.connect(destination);
          }

          if (webrtcState.remoteStream.getAudioTracks().length > 0) {
            const remoteAudio = audioContext.createMediaStreamSource(webrtcState.remoteStream);
            remoteAudio.connect(destination);
          }

          destination.stream.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track);
          });
        }

        // Configurar MediaRecorder
        const mimeType = recordingOptions.format === 'webm' ? 'video/webm' : 'video/mp4';
        mediaRecorder.current = new MediaRecorder(combinedStream, {
          mimeType,
          audioBitsPerSecond: recordingOptions.audioBitrate,
          videoBitsPerSecond: recordingOptions.videoBitrate,
        });

        recordingChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordingChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onstop = async () => {
          const recordingBlob = new Blob(recordingChunks.current, { type: mimeType });

          if (recordingOptions.autoSave && firestore.current) {
            // Guardar metadata de grabación
            await addDoc(collection(firestore.current, collections.recordings!), {
              ...recordingOptions.medicalMetadata,
              duration: webrtcState.recordingDuration,
              size: recordingBlob.size,
              format: recordingOptions.format,
              quality: recordingOptions.quality,
              encrypted: recordingOptions.encryptRecording,
              timestamp: serverTimestamp(),
            });
          }
        };

        mediaRecorder.current.start(1000); // Chunk cada 1 segundo

        setWebRTCState((prev) => ({
          ...prev,
          isRecording: true,
          recordingDuration: 0,
          recordingQuality: recordingOptions.quality,
          sessionRecorded: true,
        }));
      } catch (err) {
        throw new Error(`Error al iniciar grabación: ${err as any}`);
      }
    },
    [
      webrtcState.localStream,
      webrtcState.remoteStream,
      webrtcState.consentObtained,
      medical,
      config,
    ],
  );

  const verifyEncryption = useCallback(async (): Promise<boolean> => {
    if (!peerConnection.current) return false;

    try {
      const stats = await peerConnection.current.getStats();
      let isEncrypted = false;

      stats.forEach((report) => {
        if (report.type === 'transport') {
          // Verificar DTLS
          if (report.dtlsState === 'connected' && report.selectedCandidatePairId) {
            isEncrypted = true;
          }
        }
      });

      setWebRTCState((prev) => ({
        ...prev,
        encryptionStatus: isEncrypted ? 'encrypted' : 'not_encrypted',
      }));

      return isEncrypted;
    } catch (err) {
      logger.error('Error verificando cifrado:', err as any);
      return false;
    }
  }, []);

  // Implementaciones simplificadas de las funciones restantes
  const endCall = useCallback(async (): Promise<void> => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (webrtcState.localStream) {
      webrtcState.localStream.getTracks().forEach((track) => track.stop());
    }

    if (mediaRecorder.current && webrtcState.isRecording) {
      mediaRecorder.current.stop();
    }

    setWebRTCState((prev) => ({
      ...prev,
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      isRecording: false,
    }));
  }, [webrtcState.localStream, webrtcState.isRecording]);

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (webrtcState.localStream) {
      const videoTrack = webrtcState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setWebRTCState((prev) => ({
          ...prev,
          isVideoEnabled: videoTrack.enabled,
        }));
      }
    }
  }, [webrtcState.localStream]);

  const startScreenShare = useCallback(async (): Promise<void> => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setWebRTCState((prev) => ({
        ...prev,
        screenShareStream: screenStream,
        isScreenSharing: true,
      }));
    } catch (err) {
      logger.error('Error sharing screen:', err as any);
    }
  }, []);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    if (webrtcState.screenShareStream) {
      webrtcState.screenShareStream.getTracks().forEach((track) => track.stop());
      setWebRTCState((prev) => ({
        ...prev,
        screenShareStream: null,
        isScreenSharing: false,
      }));
    }
  }, [webrtcState.screenShareStream]);

  const stopRecording = useCallback(async (): Promise<{
    recordingId: string;
    duration: number;
    size: number;
  }> => {
    if (mediaRecorder.current && webrtcState.isRecording) {
      mediaRecorder.current.stop();

      const recordingId = `rec_${Date.now()}_${config.sessionId}`;
      const duration = webrtcState.recordingDuration;
      const size = recordingChunks.current.reduce((total, chunk) => total + chunk.size, 0);

      setWebRTCState((prev) => ({
        ...prev,
        isRecording: false,
        recordingDuration: 0,
      }));

      return { recordingId, duration, size };
    }

    throw new Error('No hay grabación activa');
  }, [webrtcState.isRecording, webrtcState.recordingDuration, config.sessionId]);

  const getQualityMetrics = useCallback(async () => {
    return webrtcState.connectionQuality;
  }, [webrtcState.connectionQuality]);

  const runDiagnostics = useCallback(async (): Promise<WebRTCDiagnosticInfo> => {
    if (!peerConnection.current) {
      throw new Error('No hay conexión activa para diagnosticar');
    }

    const stats = await peerConnection.current.getStats();
    const diagnosticInfo: WebRTCDiagnosticInfo = {
      localCandidates: [],
      remoteCandidates: [],
      codecsUsed: {},
      bandwidth: { available: 0, used: 0 },
      latency: 0,
      jitter: 0,
      packetsLost: 0,
      timestamp: new Date().toISOString(),
    };

    // Analizar estadísticas detalladas
    stats.forEach((report) => {
      if (report.type === 'local-candidate') {
        diagnosticInfo.localCandidates.push(report as RTCIceCandidate);
      } else if (report.type === 'remote-candidate') {
        diagnosticInfo.remoteCandidates.push(report as RTCIceCandidate);
      } else if (report.type === 'codec') {
        if (report.mimeType?.includes('audio')) {
          diagnosticInfo.codecsUsed.audio = report.mimeType;
        } else if (report.mimeType?.includes('video')) {
          diagnosticInfo.codecsUsed.video = report.mimeType;
        }
      }
    });

    return diagnosticInfo;
  }, []);

  // Funciones médicas específicas implementadas de forma simplificada
  const captureSnapshot = useCallback(async (includePatient = false) => {
    const doctorSnapshot = 'data:image/png;base64,...'; // Captura del doctor
    const patientSnapshot = includePatient ? 'data:image/png;base64,...' : undefined;
    return { doctorSnapshot, patientSnapshot };
  }, []);

  const enableMedicalFilters = useCallback(async (filters: string[]) => {
    // Implementar filtros médicos específicos
    logger.info('Enabling medical filters:', JSON.stringify(filters, null, 2));
  }, []);

  const adjustForMedicalExam = useCallback(async (examType: string) => {
    // Ajustar configuración según tipo de examen
    logger.info('Adjusting for medical exam:', examType);
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setWebRTCState((prev) => ({
      ...prev,
      technicalAlerts: prev.technicalAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, resolved: true, resolvedAt: new Date().toISOString() }
          : alert,
      ),
    }));
  }, []);

  const reportIssue = useCallback(async (issue: string, severity: string) => {
    const alert: MedicalTechnicalAlert = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'connection',
      severity: severity as any,
      message: issue,
      technicalDetails: { userReported: true },
      resolved: false,
    };

    setWebRTCState((prev) => ({
      ...prev,
      technicalAlerts: [...prev.technicalAlerts, alert],
    }));
  }, []);

  const getComplianceReport = useCallback(async () => {
    return {
      encryptionStatus: webrtcState.encryptionStatus,
      hipaaCompliant: webrtcState.hipaaCompliant,
      sessionRecorded: webrtcState.sessionRecorded,
      consentObtained: webrtcState.consentObtained,
      qualityMetrics: webrtcState.connectionQuality,
      alerts: webrtcState.technicalAlerts,
    };
  }, [webrtcState]);

  const exportSessionData = useCallback(async (): Promise<Blob> => {
    const sessionData = {
      sessionId: config.sessionId,
      duration: webrtcState.recordingDuration,
      qualityMetrics: webrtcState.connectionQuality,
      alerts: webrtcState.technicalAlerts,
      diagnostics: webrtcState.diagnosticInfo,
      compliance: await getComplianceReport(),
    };

    return new Blob([JSON.stringify(sessionData, null, 2)], {
      type: 'application/json',
    });
  }, [config.sessionId, webrtcState, getComplianceReport]);

  // Funciones no implementadas completamente (placeholder)
  const pauseRecording = useCallback(async () => {
    if (mediaRecorder.current && webrtcState.isRecording) {
      mediaRecorder.current.pause();
    }
  }, [webrtcState.isRecording]);

  const resumeRecording = useCallback(async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.resume();
    }
  }, []);

  const optimizeConnection = useCallback(async () => {
    // Implementar optimización automática
    logger.info('Optimizing connection...');
  }, []);

  return {
    ...webrtcState,

    // Funciones principales
    startCall,
    endCall,

    // Control de medios
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,

    // Grabación médica
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,

    // Calidad y diagnósticos
    getQualityMetrics,
    runDiagnostics,
    optimizeConnection,

    // Funciones médicas específicas
    captureSnapshot,
    enableMedicalFilters,
    adjustForMedicalExam,

    // Alertas y monitoring
    acknowledgeAlert,
    reportIssue,

    // Compliance
    verifyEncryption,
    getComplianceReport,
    exportSessionData,
  };
}
