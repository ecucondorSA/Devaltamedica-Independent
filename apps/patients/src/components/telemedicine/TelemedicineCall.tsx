"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Heart,
  Monitor,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  AlertCircle,
  X,
  User,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@altamedica/ui';
import { Card } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

import { logger } from '@altamedica/shared/services/logger.service';
interface TelemedicineCallProps {
  sessionId: string;
  roomId: string;
  onEndCall: () => void;
  onError?: (error: string) => void;
}

interface Participant {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isConnected: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'vitals';
}

interface VitalSigns {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

export default function TelemedicineCall({
  sessionId,
  roomId,
  onEndCall,
  onError
}: TelemedicineCallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_TELEMEDICINE_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      timeout: 10000,
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      logger.info('Connected to telemedicine server');
      
      // Join the session
      newSocket.emit('join-session', {
        sessionId: roomId,
        participantId: user?.id,
        role: user?.role,
        name: `${user?.firstName} ${user?.lastName}`,
        deviceInfo: {
          browser: navigator.userAgent,
          os: navigator.platform,
          device_type: 'desktop'
        }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast({
        title: 'Conexión perdida',
        description: 'Se perdió la conexión con el servidor',
        variant: 'destructive'
      });
    });

    newSocket.on('session-ready', (data) => {
      logger.info('Session ready:', data);
      setParticipants(data.participants);
      initializeWebRTC();
    });

    newSocket.on('participant-joined', (data) => {
      logger.info('Participant joined:', data);
      setParticipants(prev => [...prev, data]);
      toast({
        title: 'Participante conectado',
        description: `${data.name} se unió a la sesión`
      });
    });

    newSocket.on('participant-disconnected', (data) => {
      logger.info('Participant disconnected:', data);
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
      toast({
        title: 'Participante desconectado',
        description: `${data.participantName} se desconectó`
      });
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('vitals-shared', (data) => {
      setVitals(data.vitals);
      toast({
        title: 'Signos vitales compartidos',
        description: 'Se han actualizado los signos vitales'
      });
    });

    newSocket.on('error', (error) => {
      logger.error('Socket error:', error);
      toast({
        title: 'Error de conexión',
        description: error.message || 'Error desconocido',
        variant: 'destructive'
      });
      if (onError) onError(error.message);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, user, toast, onError]);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            sessionId: roomId,
          });
        }
      };

      // Monitor connection quality
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          setConnectionQuality('excellent');
        } else if (state === 'checking') {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
      };

      logger.info('WebRTC initialized successfully');
    } catch (error) {
      logger.error('Error initializing WebRTC:', error);
      toast({
        title: 'Error de cámara/micrófono',
        description: 'No se pudo acceder a la cámara o micrófono',
        variant: 'destructive'
      });
    }
  }, [socket, roomId, toast]);

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && participants.length > 1) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, participants.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        if (socket) {
          socket.emit('toggle-media', {
            type: 'video',
            enabled: videoTrack.enabled,
            sessionId: roomId,
          });
        }
      }
    }
  }, [socket, roomId]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        if (socket) {
          socket.emit('toggle-media', {
            type: 'audio',
            enabled: audioTrack.enabled,
            sessionId: roomId,
          });
        }
      }
    }
  }, [socket, roomId]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        );

        if (sender) {
          sender.replaceTrack(videoTrack);
          setIsScreenSharing(true);
        }
      } else {
        // Stop screen sharing
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        );

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
          setIsScreenSharing(false);
        }
      }
    } catch (error) {
      logger.error('Error toggling screen share:', error);
      toast({
        title: 'Error al compartir pantalla',
        description: 'No se pudo iniciar la compartición de pantalla',
        variant: 'destructive'
      });
    }
  }, [isScreenSharing, toast]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socket) {
      socket.emit('chat-message', {
        sessionId: roomId,
        message: newMessage,
        type: 'text',
      });
      setNewMessage('');
    }
  }, [newMessage, socket, roomId]);

  // Share vitals (patient only)
  const shareVitals = useCallback(() => {
    if (user?.role === 'patient' && socket) {
      const mockVitals: VitalSigns = {
        heartRate: 75 + Math.floor(Math.random() * 20),
        bloodPressure: {
          systolic: 120 + Math.floor(Math.random() * 20),
          diastolic: 80 + Math.floor(Math.random() * 10),
        },
        temperature: 36.5 + Math.random() * 2,
        oxygenSaturation: 95 + Math.floor(Math.random() * 5),
        timestamp: new Date(),
      };

      socket.emit('share-vitals', {
        sessionId: roomId,
        vitals: mockVitals,
      });

      toast({
        title: 'Signos vitales compartidos',
        description: 'Se han compartido los signos vitales con el doctor'
      });
    }
  }, [user?.role, socket, roomId, toast]);

  // End session
  const endSession = useCallback(() => {
    if (socket) {
      socket.emit('end-session', { sessionId: roomId });
    }
    
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    onEndCall();
  }, [socket, roomId, onEndCall]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Connection quality indicator
  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Conectando...</h2>
          <p className="text-gray-400">Iniciando sesión de telemedicina</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Video Container */}
      <div className="relative h-full">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Session Info Overlay */}
        <div className="absolute top-4 left-4 flex items-center space-x-4">
          <Badge variant="secondary" className="bg-black/50 text-white">
            <Clock className="w-4 h-4 mr-1" />
            {formatDuration(sessionDuration)}
          </Badge>
          
          <Badge variant="secondary" className="bg-black/50 text-white">
            {getConnectionQualityIcon()}
            <span className="ml-1 capitalize">{connectionQuality}</span>
          </Badge>

          {participants.map(participant => (
            <Badge 
              key={participant.id}
              variant="secondary" 
              className={`bg-black/50 text-white ${participant.isConnected ? 'border-green-500' : 'border-red-500'}`}
            >
              <User className="w-4 h-4 mr-1" />
              {participant.name}
            </Badge>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "destructive" : "default"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <Monitor className="w-6 h-6" />
          </Button>

          <Button
            onClick={() => setShowChat(!showChat)}
            variant={showChat ? "default" : "secondary"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          {user?.role === 'patient' && (
            <Button
              onClick={shareVitals}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 border-white text-white hover:bg-white hover:text-black"
            >
              <Heart className="w-6 h-6" />
            </Button>
          )}

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 border-white text-white hover:bg-white hover:text-black"
          >
            <Settings className="w-6 h-6" />
          </Button>

          <Button
            onClick={endSession}
            variant="destructive"
            size="lg"
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        {/* Fullscreen Toggle */}
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Chat</h3>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm font-medium">{message.senderName}</p>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={sendMessage} size="sm">
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Panel */}
      {showVitals && vitals && (
        <div className="absolute left-4 top-20 w-64 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Signos Vitales</h3>
            <Button
              onClick={() => setShowVitals(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Frecuencia cardíaca:</span>
              <span className="font-medium">{vitals.heartRate} bpm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Presión arterial:</span>
              <span className="font-medium">{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Temperatura:</span>
              <span className="font-medium">{vitals.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Saturación O₂:</span>
              <span className="font-medium">{vitals.oxygenSaturation}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute left-4 top-20 w-64 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Configuración</h3>
            <Button
              onClick={() => setShowSettings(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Calidad de video</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                <option>Alta (1080p)</option>
                <option>Media (720p)</option>
                <option>Baja (480p)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Micrófono</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                <option>Micrófono predeterminado</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Cámara</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                <option>Cámara predeterminada</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Grabar sesión</span>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 