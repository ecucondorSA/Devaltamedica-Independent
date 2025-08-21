/**
 * Placeholder WebRTC hook to satisfy composed/useTelemedicineSession without bundling real WebRTC yet.
 * Provides a minimal, side-effect-free API compatible with current usages.
 * TODO: Replace with a real implementation using @altamedica/telemedicine-core.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

type MedicalMetrics = {
  videoQualityScore: number;
  audioQualityScore: number;
  networkStability: number;
};

type WebRTCState = {
  medicalMetrics?: MedicalMetrics;
};

export type UseWebRTCOptions = {
  autoStart?: boolean;
  mediaConstraints?: {
    video?: Record<string, unknown>;
    audio?: Record<string, unknown>;
  };
  medical?: {
    recordSession?: boolean;
    videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
    e2eEncryption?: boolean;
  };
};

export type UseWebRTCReturn = {
  isConnected: boolean;
  error: Error | null;
  state: WebRTCState;
  startCall: (peerId?: string) => Promise<void>;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
};

export function useWebRTC(_sessionKey: string, _options?: UseWebRTCOptions): UseWebRTCReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const metricsRef = useRef<MedicalMetrics>({
    videoQualityScore: 0,
    audioQualityScore: 0,
    networkStability: 0,
  });

  const startCall = useCallback(async (_peerId?: string) => {
    try {
      // Placeholder: mark as connected
      setIsConnected(true);
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  }, []);

  const endCall = useCallback(() => {
    setIsConnected(false);
  }, []);

  const toggleVideo = useCallback(() => {
    // no-op in placeholder
  }, []);

  const toggleAudio = useCallback(() => {
    // no-op in placeholder
  }, []);

  const toggleScreenShare = useCallback(async () => {
    // no-op in placeholder
  }, []);

  const switchCamera = useCallback(async () => {
    // no-op in placeholder
  }, []);

  const state = useMemo<WebRTCState>(
    () => ({
      medicalMetrics: metricsRef.current,
    }),
    [],
  );

  return {
    isConnected,
    error,
    state,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    switchCamera,
  };
}
