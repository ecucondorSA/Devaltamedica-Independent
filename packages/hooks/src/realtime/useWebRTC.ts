import type {
  UnifiedTelemedicineConfig,
  UnifiedTelemedicineState,
} from '@altamedica/telemedicine-core';
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

// Legacy-compatible types (small surface) used by existing hooks
export type LegacyUseWebRTCOptions = {
  autoStart?: boolean;
  mediaConstraints?: any;
  medical?: { recordSession?: boolean; videoQuality?: string; e2eEncryption?: boolean };
  userType?: 'doctor' | 'patient' | 'company';
  userId?: string;
};

export type LegacyUseWebRTCReturn = {
  isConnected: boolean;
  error: Error | null;
  state: any;
  startCall: (peerId?: string, opts?: any) => Promise<void>;
  endCall: (reason?: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
  sendMessage: (message: string) => void;
  qosMetrics?: any;
  peerConnectionRef?: React.MutableRefObject<RTCPeerConnection | null>;
  connect: () => Promise<void>;
  disconnect: () => void;
  // allow any extra props to preserve forwards-compat
  [k: string]: any;
};

// Adapter: map new telemedicine-core hook to legacy API expected by consumers
export function useWebRTC(sessionId: string, opts?: LegacyUseWebRTCOptions): LegacyUseWebRTCReturn {
  const cfg: UnifiedTelemedicineConfig = {
    appointmentId: sessionId,
    userType: (opts && (opts.userType as any)) || ('doctor' as any),
    userId: (opts && opts.userId) || 'unknown',
  };

  const tele = useTelemedicineUnified(cfg as any);

  // Small wrappers to adapt signatures
  const startCall = async (peerId?: string, _opts?: any) => {
    // Old callers often pass a peerId or doctorId; tele.connect doesn't need it.
    // Keep the signature compatible and forward to connect.
    await tele.connect();
  };

  const endCall = (_reason?: string) => {
    tele.disconnect();
  };

  const toggleAudio = () => {
    try {
      // tele.toggleMute toggles audio; keep legacy name
      tele.toggleMute?.();
    } catch (e) {
      // no-op
    }
  };

  const toggleVideo = () => {
    try {
      tele.toggleVideo?.();
    } catch (e) {}
  };

  const toggleScreenShare = async () => {
    const t = tele as any;
    if (typeof t.toggleScreenShare === 'function') {
      try {
        await t.toggleScreenShare();
      } catch (e) {
        // swallow for legacy compatibility
      }
    }
  };

  const switchCamera = async () => {
    // Not implemented in unified API yet; noop for now
  };

  // Provide the legacy-shaped object
  const legacy: LegacyUseWebRTCReturn = {
    // State
    isConnected: !!tele.isInSession,
    error: (tele as any).error || null,
    state: tele,

    // Lifecycle
    startCall,
    endCall,
    connect: tele.connect,
    disconnect: tele.disconnect,

    // Media
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    switchCamera,

    // Chat
    sendMessage: tele.sendMessage,

  // QoS / refs
  qosMetrics: (tele as any).qosMetrics || (tele as any).qos || undefined,
  peerConnectionRef: (tele as any).peerConnectionRef,

    // expose underlying tele for advanced usages
    tele,
  };

  // Spread any other helpers from tele to avoid missing members consumers might access
  Object.assign(legacy, tele as any);

  return legacy;
}

export type { UnifiedTelemedicineConfig, UnifiedTelemedicineState };
