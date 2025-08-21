import { useState, useCallback, useRef, useEffect } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export interface VideoQuality {
  width: number;
  height: number;
  frameRate: number;
  bitrate?: number;
}

export interface TelemedicineUIState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isMicMuted: boolean;
  isFullscreen: boolean;
  isRecording: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  participants: Array<{
    id: string;
    name: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isSpeaking: boolean;
  }>;
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'system';
  }>;
  screenShareActive: boolean;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  selectedVideoDevice?: string;
  selectedAudioDevice?: string;
  selectedOutputDevice?: string;
}

export interface UseTelemedicineUIOptions {
  autoStartVideo?: boolean;
  autoStartAudio?: boolean;
  maxParticipants?: number;
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
}

export interface UseTelemedicineUIReturn extends TelemedicineUIState {
  // Video controls
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleMic: () => void;
  toggleFullscreen: () => void;
  
  // Recording controls
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Screen sharing
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  
  // Chat
  sendMessage: (message: string) => void;
  clearChat: () => void;
  
  // Device management
  getAvailableDevices: () => Promise<MediaDeviceInfo[]>;
  selectVideoDevice: (deviceId: string) => Promise<void>;
  selectAudioDevice: (deviceId: string) => Promise<void>;
  selectOutputDevice: (deviceId: string) => Promise<void>;
  
  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // UI refs
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Quality settings
  setVideoQuality: (quality: VideoQuality) => void;
  getConnectionStats: () => Promise<any>;
}

const initialState: TelemedicineUIState = {
  isVideoEnabled: false,
  isAudioEnabled: false,
  isMicMuted: false,
  isFullscreen: false,
  isRecording: false,
  connectionStatus: 'disconnected',
  participants: [],
  chatMessages: [],
  screenShareActive: false,
  networkQuality: 'good',
};

export const useTelemedicineUI = (
  options: UseTelemedicineUIOptions = {}
): UseTelemedicineUIReturn => {
  const {
    autoStartVideo = false,
    autoStartAudio = true,
    maxParticipants = 2,
    recordingEnabled = false,
    chatEnabled = true,
    screenShareEnabled = true,
  } = options;

  const [state, setState] = useState<TelemedicineUIState>({
    ...initialState,
    isVideoEnabled: autoStartVideo,
    isAudioEnabled: autoStartAudio,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Video controls
  const toggleVideo = useCallback(() => {
    setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
    
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !state.isVideoEnabled;
      });
    }
  }, [state.isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    setState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
    
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !state.isAudioEnabled;
      });
    }
  }, [state.isAudioEnabled]);

  const toggleMic = useCallback(() => {
    setState(prev => ({ ...prev, isMicMuted: !prev.isMicMuted }));
    
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = state.isMicMuted; // Opposite because we're toggling
      });
    }
  }, [state.isMicMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  // Recording controls
  const startRecording = useCallback(async () => {
    if (!recordingEnabled || !localStreamRef.current) return;
    
    try {
      const mediaRecorder = new MediaRecorder(localStreamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      logger.error('Failed to start recording:', error);
    }
  }, [recordingEnabled]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, []);

  // Screen sharing
  const startScreenShare = useCallback(async () => {
    if (!screenShareEnabled) return;
    
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setState(prev => ({ ...prev, screenShareActive: true }));
      
      // Handle screen share ending
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        setState(prev => ({ ...prev, screenShareActive: false }));
      });
    } catch (error) {
      logger.error('Failed to start screen share:', error);
    }
  }, [screenShareEnabled]);

  const stopScreenShare = useCallback(() => {
    setState(prev => ({ ...prev, screenShareActive: false }));
  }, []);

  // Chat
  const sendMessage = useCallback((message: string) => {
    if (!chatEnabled) return;
    
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'current-user',
      senderName: 'You',
      message,
      timestamp: new Date(),
      type: 'text' as const,
    };
    
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage],
    }));
  }, [chatEnabled]);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, chatMessages: [] }));
  }, []);

  // Device management
  const getAvailableDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `${device.kind} (${device.deviceId.slice(0, 8)})`,
        kind: device.kind as 'videoinput' | 'audioinput' | 'audiooutput',
      }));
    } catch (error) {
      logger.error('Failed to enumerate devices:', error);
      return [];
    }
  }, []);

  const selectVideoDevice = useCallback(async (deviceId: string) => {
    setState(prev => ({ ...prev, selectedVideoDevice: deviceId }));
    // Implementation would restart video stream with new device
  }, []);

  const selectAudioDevice = useCallback(async (deviceId: string) => {
    setState(prev => ({ ...prev, selectedAudioDevice: deviceId }));
    // Implementation would restart audio stream with new device
  }, []);

  const selectOutputDevice = useCallback(async (deviceId: string) => {
    setState(prev => ({ ...prev, selectedOutputDevice: deviceId }));
    // Implementation would set audio output device
  }, []);

  // Connection
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: state.isVideoEnabled,
        audio: state.isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Simulate connection
      setTimeout(() => {
        setState(prev => ({ ...prev, connectionStatus: 'connected' }));
      }, 1000);
    } catch (error) {
      logger.error('Failed to connect:', error);
      setState(prev => ({ ...prev, connectionStatus: 'failed' }));
    }
  }, [state.isVideoEnabled, state.isAudioEnabled]);

  const disconnect = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  }, []);

  // Quality settings
  const setVideoQuality = useCallback((quality: VideoQuality) => {
    // Implementation would update video constraints
    logger.info('Setting video quality:', quality);
  }, []);

  const getConnectionStats = useCallback(async () => {
    // Implementation would return WebRTC connection statistics
    return {
      bytesReceived: 0,
      bytesSent: 0,
      packetsLost: 0,
      rtt: 0,
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    toggleVideo,
    toggleAudio,
    toggleMic,
    toggleFullscreen,
    startRecording,
    stopRecording,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    clearChat,
    getAvailableDevices,
    selectVideoDevice,
    selectAudioDevice,
    selectOutputDevice,
    connect,
    disconnect,
    localVideoRef,
    remoteVideoRef,
    setVideoQuality,
    getConnectionStats,
  };
};