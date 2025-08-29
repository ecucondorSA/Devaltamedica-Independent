// 📹 HOOK TELEMEDICINA AVANZADO - STUB TEMPORAL FUNCIONAL
// Hook temporal que usa el sistema unificado existente
// TODO: Migrar a implementación completa cuando esté disponible

'use client';

import { useTelemedicineUnified } from '@altamedica/telemedicine-core';
import { useCallback, useRef, useState } from 'react';

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
  session: any | null;
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

// 🎯 HOOK PRINCIPAL - STUB TEMPORAL
export const useTelemedicineAdvanced = (options: UseTelemedicineOptions = {}) => {
  const { sessionId, role = 'doctor', autoConnect = false, enableRecording = false } = options;

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

  // 🎯 USAR HOOK UNIFICADO EXISTENTE
  const unifiedTelemedicine = useTelemedicineUnified({
    appointmentId: sessionId || 'temp',
    userType: role,
    userId: `user_${Date.now()}`,
  });

  // 🔧 FUNCIONES DE ACCIÓN - STUB TEMPORAL
  const startSession = useCallback(
    (sessionId: string, role: 'doctor' | 'patient') => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      // TODO: Implementar cuando esté disponible
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          session: { id: sessionId, role },
        }));
      }, 1000);
    },
    [],
  );

  const endSession = useCallback(() => {
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
  }, []);

  const toggleVideo = useCallback(() => {
    setState((prev) => ({ ...prev, videoEnabled: !prev.videoEnabled }));
  }, []);

  const toggleAudio = useCallback(() => {
    setState((prev) => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  }, []);

  const startRecording = useCallback(() => {
    setState((prev) => ({ ...prev, isRecording: true }));
  }, []);

  const stopRecording = useCallback(() => {
    setState((prev) => ({ ...prev, isRecording: false }));
  }, []);

  const startScreenShare = useCallback(() => {
    setState((prev) => ({ ...prev, screenSharing: true }));
  }, []);

  const stopScreenShare = useCallback(() => {
    setState((prev) => ({ ...prev, screenSharing: false }));
  }, []);

  const sendMedicalNote = useCallback(async (note: string) => {
    // TODO: Implementar cuando esté disponible
  import('@altamedica/shared').then(({ logger }) => logger.info('Medical note', { note })).catch(() => {});
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // 📊 VALORES CALCULADOS
  const canRecord = state.isConnected && true; // TODO: Implementar verificación HIPAA
  const connectionQuality = 'good'; // TODO: Implementar métricas reales

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
    isStarting: false,
    isEnding: false,
    isTogglingVideo: false,
    isTogglingAudio: false,

    // Hook unificado para funcionalidad real
    unified: unifiedTelemedicine,
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
