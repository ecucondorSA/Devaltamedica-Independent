// 📹 HOOK TELEMEDICINA AVANZADO - REEMPLAZA STUBS
// Hook completo para videollamadas médicas con grabación HIPAA

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  telemedicineService,
  type TelemedicineSession,
} from '@altamedica/telemedicine-core/services/TelemedicineService';

// 📋 TIPOS DEL HOOK
export interface UseTelemedicineOptions {
  sessionId?: string;
  role?: 'doctor' | 'patient';
  autoConnect?: boolean;
  enableRecording?: boolean;
}

export interface ConnectionStats {
  video: { bitrate: number; fps: number; resolution: string };
  audio: { bitrate: number; packetLoss: number };
  connection: { rtt: number; jitter: number };
}

export interface TelemedicineState {
  session: TelemedicineSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  isConnected: boolean;
  isRecording: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
  connectionStats: ConnectionStats | null;
  error: string | null;
}

// 🎯 HOOK PRINCIPAL
export const useTelemedicineAdvanced = (options: UseTelemedicineOptions = {}) => {
  const { sessionId, role = 'doctor', autoConnect = false, enableRecording = false } = options;
  const queryClient = useQueryClient();

  // 📊 ESTADO LOCAL
  const [state, setState] = useState<TelemedicineState>({
    session: null,
    localStream: null,
    remoteStream: null,
    isConnecting: false,
    isConnected: false,
    isRecording: false,
    videoEnabled: true,
    audioEnabled: true,
    screenSharing: false,
    connectionStats: null,
    error: null,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 🎬 MUTATIONS
  const startSessionMutation = useMutation({
    mutationFn: async (params: { sessionId: string; role: 'doctor' | 'patient' }) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      return await telemedicineService.startSession(params.sessionId, params.role);
    },
    onSuccess: (session) => {
      setState((prev) => ({
        ...prev,
        session,
        isConnecting: false,
        isConnected: true,
      }));
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: () => telemedicineService.endSession(),
    onSuccess: () => {
      setState((prev) => ({
        ...prev,
        session: null,
        localStream: null,
        remoteStream: null,
        isConnected: false,
        isRecording: false,
        screenSharing: false,
        connectionStats: null,
      }));
    },
  });

  const toggleVideoMutation = useMutation({
    mutationFn: () => telemedicineService.toggleVideo(),
    onSuccess: (enabled) => {
      setState((prev) => ({ ...prev, videoEnabled: enabled }));
    },
  });

  const toggleAudioMutation = useMutation({
    mutationFn: () => telemedicineService.toggleAudio(),
    onSuccess: (enabled) => {
      setState((prev) => ({ ...prev, audioEnabled: enabled }));
    },
  });

  const startRecordingMutation = useMutation({
    mutationFn: () => telemedicineService.startRecording(),
    onSuccess: () => {
      setState((prev) => ({ ...prev, isRecording: true }));
    },
    onError: (error: Error) => {
      setState((prev) => ({ ...prev, error: error.message }));
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: () => telemedicineService.stopRecording(),
    onSuccess: () => {
      setState((prev) => ({ ...prev, isRecording: false }));
    },
  });

  const startScreenShareMutation = useMutation({
    mutationFn: () => telemedicineService.startScreenShare(),
    onSuccess: () => {
      setState((prev) => ({ ...prev, screenSharing: true }));
    },
    onError: (error: Error) => {
      setState((prev) => ({ ...prev, error: error.message }));
    },
  });

  const stopScreenShareMutation = useMutation({
    mutationFn: () => telemedicineService.stopScreenShare(),
    onSuccess: () => {
      setState((prev) => ({ ...prev, screenSharing: false }));
    },
  });

  // 📡 EVENT LISTENERS
  useEffect(() => {
    const handleSessionStarted = (session: TelemedicineSession) => {
      setState((prev) => ({ ...prev, session, isConnected: true }));
    };

    const handleRemoteStream = (stream: MediaStream) => {
      setState((prev) => ({ ...prev, remoteStream: stream }));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const handleQualityUpdate = (stats: ConnectionStats) => {
      setState((prev) => ({ ...prev, connectionStats: stats }));
    };

    const handleError = (error: Error) => {
      setState((prev) => ({ ...prev, error: error.message }));
    };

    const handleSessionEnded = () => {
      setState((prev) => ({
        ...prev,
        session: null,
        isConnected: false,
        isRecording: false,
        localStream: null,
        remoteStream: null,
        screenSharing: false,
      }));
    };

    // Registrar event listeners
    telemedicineService.on('sessionStarted', handleSessionStarted);
    telemedicineService.on('remoteStreamReceived', handleRemoteStream);
    telemedicineService.on('qualityUpdate', handleQualityUpdate);
    telemedicineService.on('error', handleError);
    telemedicineService.on('sessionEnded', handleSessionEnded);

    // Cleanup
    return () => {
      telemedicineService.off('sessionStarted', handleSessionStarted);
      telemedicineService.off('remoteStreamReceived', handleRemoteStream);
      telemedicineService.off('qualityUpdate', handleQualityUpdate);
      telemedicineService.off('error', handleError);
      telemedicineService.off('sessionEnded', handleSessionEnded);
    };
  }, []);

  // 🎥 CONFIGURAR VIDEO LOCAL
  useEffect(() => {
    if (state.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = state.localStream;
    }
  }, [state.localStream]);

  // 🤖 AUTO CONNECT
  useEffect(() => {
    if (autoConnect && sessionId && !state.isConnected && !state.isConnecting) {
      startSessionMutation.mutate({ sessionId, role });
    }
  }, [autoConnect, sessionId, role, state.isConnected, state.isConnecting]);

  // 🎬 AUTO RECORDING
  useEffect(() => {
    if (enableRecording && state.isConnected && !state.isRecording) {
      const timer = setTimeout(() => {
        startRecordingMutation.mutate();
      }, 2000); // Iniciar grabación 2 segundos después de conectar

      return () => clearTimeout(timer);
    }
  }, [enableRecording, state.isConnected, state.isRecording]);

  // 🔧 FUNCIONES DE ACCIÓN
  const startSession = useCallback(
    (sessionId: string, role: 'doctor' | 'patient') => {
      startSessionMutation.mutate({ sessionId, role });
    },
    [startSessionMutation],
  );

  const endSession = useCallback(() => {
    endSessionMutation.mutate();
  }, [endSessionMutation]);

  const toggleVideo = useCallback(() => {
    toggleVideoMutation.mutate();
  }, [toggleVideoMutation]);

  const toggleAudio = useCallback(() => {
    toggleAudioMutation.mutate();
  }, [toggleAudioMutation]);

  const startRecording = useCallback(() => {
    startRecordingMutation.mutate();
  }, [startRecordingMutation]);

  const stopRecording = useCallback(() => {
    stopRecordingMutation.mutate();
  }, [stopRecordingMutation]);

  const startScreenShare = useCallback(() => {
    startScreenShareMutation.mutate();
  }, [startScreenShareMutation]);

  const stopScreenShare = useCallback(() => {
    stopScreenShareMutation.mutate();
  }, [stopScreenShareMutation]);

  const sendMedicalNote = useCallback(async (note: string) => {
    try {
      await telemedicineService.sendMedicalNote(note);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // 📊 VALORES CALCULADOS
  const canRecord = state.isConnected && state.session?.metadata.hipaaConsent;
  const connectionQuality = state.connectionStats
    ? state.connectionStats.video.bitrate > 1000
      ? 'good'
      : state.connectionStats.video.bitrate > 500
        ? 'fair'
        : 'poor'
    : 'unknown';

  return {
    // Estado
    ...state,
    connectionQuality,
    canRecord,

    // Referencias para componentes
    localVideoRef,
    remoteVideoRef,

    // Acciones
    startSession,
    endSession,
    toggleVideo,
    toggleAudio,
    startRecording,
    stopRecording,
    startScreenShare,
    stopScreenShare,
    sendMedicalNote,
    clearError,

    // Estados de loading
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    isTogglingVideo: toggleVideoMutation.isPending,
    isTogglingAudio: toggleAudioMutation.isPending,
  };
};

// 🎯 HOOK SIMPLE PARA VIDEOLLAMADAS
export const useVideoCall = (sessionId?: string) => {
  return useTelemedicineAdvanced({
    sessionId,
    role: 'doctor',
    autoConnect: false,
    enableRecording: false,
  });
};

// 🩺 HOOK ESPECÍFICO PARA DOCTORES
export const useDoctorTelemedicine = (sessionId?: string) => {
  return useTelemedicineAdvanced({
    sessionId,
    role: 'doctor',
    autoConnect: true,
    enableRecording: true,
  });
};

// 👤 HOOK ESPECÍFICO PARA PACIENTES
export const usePatientTelemedicine = (sessionId?: string) => {
  return useTelemedicineAdvanced({
    sessionId,
    role: 'patient',
    autoConnect: true,
    enableRecording: false,
  });
};

// 📤 EXPORTS
export default useTelemedicineAdvanced;
