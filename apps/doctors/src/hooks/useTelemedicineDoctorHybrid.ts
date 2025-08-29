// Hook híbrido para telemedicina del lado del doctor
import { useState, useEffect, useCallback } from 'react';

export function useTelemedicineDoctorHybrid(sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsConnected(true);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, []);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    isConnected,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionQuality,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}

export default useTelemedicineDoctorHybrid;