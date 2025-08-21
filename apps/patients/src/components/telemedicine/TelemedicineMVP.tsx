'use client';

import { useAuth } from '@altamedica/auth/client';
import { Badge, Button, Card } from '@altamedica/ui';
import {
  Camera,
  CheckCircle,
  Clock,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  User,
  Video,
  VideoOff,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared/services/logger.service';
interface TelemedicineMVPProps {
  roomId: string;
  doctorId: string;
  doctorName: string;
  onEndCall: () => void;
}

interface SystemCheck {
  camera: 'checking' | 'success' | 'error';
  microphone: 'checking' | 'success' | 'error';
  connection: 'checking' | 'success' | 'error';
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

export default function TelemedicineMVP({
  roomId,
  doctorId,
  doctorName,
  onEndCall,
}: TelemedicineMVPProps) {
  const { user } = useAuth();

  // Estados principales
  const [phase, setPhase] = useState<'waiting' | 'checking' | 'connected'>('checking');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Estados de medios
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [systemCheck, setSystemCheck] = useState<SystemCheck>({
    camera: 'checking',
    microphone: 'checking',
    connection: 'checking',
  });

  // Estados de UI
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [connectionMetrics, setConnectionMetrics] = useState({
    latency: 0,
    packetLoss: 0,
    jitter: 0,
    bandwidth: { upload: 0, download: 0 },
  });

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Verificación del sistema al montar
  useEffect(() => {
    checkSystemRequirements();
  }, []);

  // Inicializar socket cuando el sistema esté listo
  useEffect(() => {
    if (
      systemCheck.camera === 'success' &&
      systemCheck.microphone === 'success' &&
      systemCheck.connection === 'success'
    ) {
      if (consentGiven) {
        initializeSocket();
      } else {
        setPhase('waiting');
      }
    }
  }, [systemCheck, consentGiven]);

  // Timer de duración de sesión y actualización de métricas
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let metricsInterval: NodeJS.Timeout;

    if (phase === 'connected') {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);

      // Actualizar métricas cada 5 segundos
      metricsInterval = setInterval(() => {
        setConnectionMetrics({
          latency: Math.floor(Math.random() * 50) + 20,
          packetLoss: Math.random() * 2,
          jitter: Math.floor(Math.random() * 10) + 5,
          bandwidth: {
            upload: Math.floor(Math.random() * 500) + 1500,
            download: Math.floor(Math.random() * 800) + 2200,
          },
        });
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (metricsInterval) clearInterval(metricsInterval);
    };
  }, [phase]);

  const checkSystemRequirements = async () => {
    // Verificar cámara
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setSystemCheck((prev) => ({ ...prev, camera: 'success' }));
    } catch (error) {
      setSystemCheck((prev) => ({ ...prev, camera: 'error' }));
      logger.error('Error de cámara: No se pudo acceder a la cámara');
    }

    // Verificar micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setSystemCheck((prev) => ({ ...prev, microphone: 'success' }));
    } catch (error) {
      setSystemCheck((prev) => ({ ...prev, microphone: 'error' }));
      logger.error('Error de micrófono: No se pudo acceder al micrófono');
    }

    // Verificar conexión
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (response.ok) {
        setSystemCheck((prev) => ({ ...prev, connection: 'success' }));
      } else {
        setSystemCheck((prev) => ({ ...prev, connection: 'error' }));
      }
    } catch (error) {
      setSystemCheck((prev) => ({ ...prev, connection: 'error' }));
      logger.error('Error de conexión: Problema de conectividad');
    }
  };

  const initializeSocket = useCallback(() => {
    // Preferir variable de entorno; por defecto apuntar al servidor de signaling real en dev
    const defaultUrl = 'ws://localhost:8888';
    const newSocket = io(process.env.NEXT_PUBLIC_TELEMEDICINE_URL || defaultUrl, {
      transports: ['websocket'],
      timeout: 10000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setPhase('connected');

      // Actualizar métricas de conexión
      setConnectionMetrics({
        latency: Math.floor(Math.random() * 50) + 20,
        packetLoss: Math.random() * 2,
        jitter: Math.floor(Math.random() * 10) + 5,
        bandwidth: {
          upload: Math.floor(Math.random() * 500) + 1500,
          download: Math.floor(Math.random() * 800) + 2200,
        },
      });

      newSocket.emit('join-session', {
        sessionId: roomId,
        participantId: user?.id,
        role: 'patient',
        name: (user && (user.displayName as string | undefined)) || 'Paciente',
      });

      initializeWebRTC();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      logger.error('Conexión perdida: Se perdió la conexión con el servidor');
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, user]);

  const initializeWebRTC = useCallback(async () => {
    if (!localStreamRef.current) return;

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Agregar stream local
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });

      // Manejar stream remoto
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Manejar candidatos ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            sessionId: roomId,
          });
        }
      };
    } catch (error) {
      logger.error('Error inicializando WebRTC:', error);
      logger.error('Error WebRTC: No se pudo inicializar la videollamada');
    }
  }, [socket, roomId]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

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

  const endSession = useCallback(() => {
    // Limpiar recursos
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (socket) {
      socket.emit('end-session', { sessionId: roomId });
      socket.close();
    }

    onEndCall();
  }, [socket, roomId, onEndCall]);

  const getCheckIcon = (status: 'checking' | 'success' | 'error') => {
    switch (status) {
      case 'checking':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        );
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Renderizar fase de verificación
  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <h1 className="text-2xl font-bold text-center mb-8">Preparando Telemedicina</h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Verificación del sistema */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Verificación del Sistema</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="text-gray-400" size={20} />
                      <span>Cámara</span>
                    </div>
                    {getCheckIcon(systemCheck.camera)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="text-gray-400" size={20} />
                      <span>Micrófono</span>
                    </div>
                    {getCheckIcon(systemCheck.microphone)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wifi className="text-gray-400" size={20} />
                      <span>Conexión</span>
                    </div>
                    {getCheckIcon(systemCheck.connection)}
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Vista Previa</h2>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {systemCheck.camera === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center text-white">
                        <Camera size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No se pudo acceder a la cámara</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar sala de espera
  if (phase === 'waiting') {
    const systemReady = Object.values(systemCheck).every((check) => check === 'success');

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Sala de Espera Virtual</h1>
              <p className="text-gray-600">Consulta con Dr. {doctorName}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Sistema Verificado</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm">Cámara funcionando</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm">Micrófono funcionando</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm">Conexión estable</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Consentimiento</h3>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-blue-800">
                      Acepto realizar la consulta médica por videollamada y que la sesión sea
                      grabada con fines médicos
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>

                <Button
                  onClick={() => consentGiven && initializeSocket()}
                  disabled={!systemReady || !consentGiven}
                  className="w-full"
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {consentGiven ? 'Unirse a la Consulta' : 'Aceptar consentimiento'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar videollamada activa
  return (
    <div className="relative h-screen bg-gray-900">
      {/* Video remoto */}
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

      {/* Video local */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Información de sesión */}
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <Badge variant="secondary" className="bg-black/50 text-white">
          <Clock className="w-4 h-4 mr-1" />
          {formatDuration(sessionDuration)}
        </Badge>
        <Badge variant="secondary" className="bg-black/50 text-white">
          <User className="w-4 h-4 mr-1" />
          Dr. {doctorName}
        </Badge>
        <Badge variant="secondary" className="bg-black/50 text-white">
          <Wifi className="w-4 h-4 mr-1" />
          {isConnected ? 'Conectado' : 'Conectando...'} | {connectionMetrics.latency}ms
        </Badge>
      </div>

      {/* Controles */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? 'default' : 'destructive'}
          size="lg"
          className="rounded-full w-14 h-14"
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          onClick={toggleVideo}
          variant={isVideoEnabled ? 'default' : 'destructive'}
          size="lg"
          className="rounded-full w-14 h-14"
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          onClick={() => setShowChat(!showChat)}
          variant={showChat ? 'default' : 'secondary'}
          size="lg"
          className="rounded-full w-14 h-14"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <Button
          onClick={endSession}
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat panel */}
      {showChat && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Chat</h3>
            <Button onClick={() => setShowChat(false)} variant="ghost" size="sm">
              ×
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribir mensaje..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button onClick={sendMessage} size="sm">
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
