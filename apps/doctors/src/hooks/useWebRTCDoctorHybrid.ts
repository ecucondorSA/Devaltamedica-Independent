// Hook híbrido WebRTC para doctores
import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebRTCDoctorHybrid() {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [signalingState, setSignalingState] = useState<RTCSignalingState>('stable');

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      setSignalingState(pc.signalingState);
    };

    peerConnection.current = pc;
    return pc;
  }, []);

  const closePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, []);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current) {
      createPeerConnection();
    }
    
    if (peerConnection.current) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      return offer;
    }
    return null;
  }, [createPeerConnection]);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) {
      createPeerConnection();
    }
    
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      return answer;
    }
    return null;
  }, [createPeerConnection]);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnection.current) {
      await peerConnection.current.addIceCandidate(candidate);
    }
  }, []);

  useEffect(() => {
    return () => {
      closePeerConnection();
    };
  }, [closePeerConnection]);

  return {
    peerConnection: peerConnection.current,
    connectionState,
    iceConnectionState,
    signalingState,
    createPeerConnection,
    closePeerConnection,
    createOffer,
    createAnswer,
    addIceCandidate,
  };
}

export default useWebRTCDoctorHybrid;