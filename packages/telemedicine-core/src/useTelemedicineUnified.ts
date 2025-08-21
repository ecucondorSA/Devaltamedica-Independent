import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebRTCQoS } from './hooks/useWebRTCQoS';

export interface UnifiedTelemedicineConfig {
  appointmentId: string;
  userType: 'patient' | 'doctor' | 'company';
  userId: string;
}

export interface TelemedicineSession {
  id: string;
  roomId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  companyId?: string;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  participants: {
    patient: {
      id: string;
      name: string;
      isConnected: boolean;
      hasVideo: boolean;
      hasAudio: boolean;
    };
    doctor: {
      id: string;
      name: string;
      specialty: string;
      isConnected: boolean;
      hasVideo: boolean;
      hasAudio: boolean;
    };
  };
  marketplace: {
    jobId?: string;
    applicationId?: string;
    rating?: number;
    feedback?: string;
  };
}

export interface UnifiedTelemedicineState {
  session: TelemedicineSession | null;
  isInSession: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  hasVideo: boolean;
  hasAudio: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderType: 'patient' | 'doctor' | 'company';
    message: string;
    timestamp: Date;
  }>;
  loading: boolean;
  error?: string;
  // QoS (parcial)
  qos?: {
    qualityLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
    qualityScore?: number;
    latency?: number;
    jitter?: number;
    packetLoss?: number;
  };
}

/**
 * Hook unificado que combina telemedicina con marketplace
 * Proporciona funcionalidad completa de videollamada + comunicación B2C
 *
 * TODO: Este hook necesita ser completado cuando las dependencias estén disponibles
 */
export const useTelemedicineUnified = (config: UnifiedTelemedicineConfig) => {
  const { appointmentId, userType, userId } = config;

  const [state, setState] = useState<UnifiedTelemedicineState>({
    session: null,
    isInSession: false,
    isConnecting: false,
    connectionQuality: 'disconnected',
    hasVideo: true,
    hasAudio: true,
    isMuted: false,
    isVideoOff: false,
    chatMessages: [],
    loading: false,
    qos: { qualityLevel: 'disconnected' },
  });

  // PeerConnection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionId = state.session?.id || appointmentId;

  const { metrics, qualityLevel, qualityScore } = useWebRTCQoS({
    sessionId,
    peerConnection: peerConnectionRef.current,
    autoStart: true,
    monitoringInterval: 2000,
  });

  // Update QoS in state
  useEffect(() => {
    if (metrics) {
      setState((prev: UnifiedTelemedicineState) => ({
        ...prev,
        qos: {
          qualityLevel: qualityLevel || 'disconnected',
          qualityScore,
          latency: metrics.latency,
          jitter: metrics.jitter,
          packetLoss: metrics.packetLoss,
        },
      }));
    }
  }, [metrics, qualityLevel, qualityScore]);

  // Connection management
  const connect = useCallback(async () => {
    setState((prev: UnifiedTelemedicineState) => ({
      ...prev,
      isConnecting: true,
      error: undefined,
    }));

    try {
      // TODO: Implement actual connection logic
      // This would involve:
      // 1. Getting media devices
      // 2. Creating peer connection
      // 3. Joining signaling server
      // 4. Handling WebRTC negotiation

      setState((prev: UnifiedTelemedicineState) => ({
        ...prev,
        isConnecting: false,
        isInSession: true,
        connectionQuality: 'good',
      }));
    } catch (error) {
      setState((prev: UnifiedTelemedicineState) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    // Clean up streams
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setState((prev: UnifiedTelemedicineState) => ({
      ...prev,
      isInSession: false,
      connectionQuality: 'disconnected',
      localStream: undefined,
      remoteStream: undefined,
    }));
  }, [state.localStream]);

  // Media controls
  const toggleMute = useCallback(() => {
    if (state.localStream) {
      const audioTracks = state.localStream.getAudioTracks();
      audioTracks.forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setState((prev: UnifiedTelemedicineState) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [state.localStream]);

  const toggleVideo = useCallback(() => {
    if (state.localStream) {
      const videoTracks = state.localStream.getVideoTracks();
      videoTracks.forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setState((prev: UnifiedTelemedicineState) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    }
  }, [state.localStream]);

  // Chat functionality
  const sendMessage = useCallback(
    (message: string) => {
      const newMessage = {
        id: Date.now().toString(),
        senderId: userId,
        senderType: userType,
        message,
        timestamp: new Date(),
      };

      setState((prev: UnifiedTelemedicineState) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, newMessage],
      }));

      // TODO: Send message through signaling server
    },
    [userId, userType],
  );

  return {
    // State
    ...state,

    // Connection methods
    connect,
    disconnect,

    // Media controls
    toggleMute,
    toggleVideo,

    // Chat
    sendMessage,

    // QoS
    qosMetrics: metrics,

    // Refs for external use
    peerConnectionRef,
  };
};

export default useTelemedicineUnified;
