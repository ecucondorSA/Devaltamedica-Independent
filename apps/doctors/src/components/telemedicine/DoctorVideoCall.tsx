"use client";

import {
    Circle,
    Download,
    Maximize,
    Mic,
    Minimize,
    Monitor,
    PhoneOff,
    Square,
    Stethoscope,
    Video
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared/services/logger.service';
interface DoctorVideoCallProps {
  roomId: string;
  patientId: string;
  patientName: string;
  onEndCall: () => void;
  onError?: (error: string) => void;
  showControls?: boolean;
  showStats?: boolean;
  className?: string;
}

export default function DoctorVideoCall({
  roomId,
  patientId,
  patientName,
  onEndCall,
  onError,
  showControls = true,
  showStats = true,
  className = ''
}: DoctorVideoCallProps) {
  // Feature flag para desactivar telemedicina (WebRTC retirado)
  const TELEMED_ENABLED = (process.env.NEXT_PUBLIC_TELEMEDICINE_ENABLED === 'true');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string>('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'doctor' | 'patient';
    message: string;
    timestamp: Date;
  }>>([]);

  // Estados de WebRTC
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  // Refs para WebRTC
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Configuración WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Inicializar WebRTC
  const initializeWebRTC = async () => {
    try {
      // 1. Obtener stream local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Conectar al servidor de señalización
      const socket = io('http://localhost:3001', {
        transports: ['websocket']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        logger.info('🔌 Doctor conectado al servidor de señalización');
        
        // Unirse a la sala
        socket.emit('join-room', {
          roomId: roomId,
          userId: `doctor-${Date.now()}`,
          userType: 'doctor'
        });
      });

      socket.on('user-joined', (data) => {
        logger.info('👥 Paciente unido:', data);
        setParticipants(prev => [...prev, data.userId]);
        
        // Si es el primer paciente, crear oferta
        if (data.userType === 'patient') {
          createOffer();
        }
      });

      socket.on('offer', async (data) => {
        logger.info('📤 Oferta recibida del paciente');
        await handleOffer(data.offer);
      });

      socket.on('answer', async (data) => {
        logger.info('📤 Respuesta recibida del paciente');
        await handleAnswer(data.answer);
      });

      socket.on('ice-candidate', async (data) => {
        logger.info('🧊 Candidato ICE recibido');
        await handleIceCandidate(data.candidate);
      });

      socket.on('user-left', (data) => {
        logger.info('👋 Paciente salió:', data);
        setParticipants(prev => prev.filter(id => id !== data.userId));
        setIsConnected(false);
      });

      socket.on('disconnect', () => {
        logger.info('🔌 Doctor desconectado del servidor');
        setIsConnected(false);
      });

      // 3. Crear PeerConnection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Agregar tracks locales
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Manejar stream remoto
      peerConnection.ontrack = (event) => {
        logger.info('📹 Stream remoto del paciente recibido');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Manejar candidatos ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            roomId: roomId,
            candidate: event.candidate
          });
        }
      };

      // Manejar cambios de conexión
      peerConnection.onconnectionstatechange = () => {
        logger.info('🔗 Estado de conexión:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'disconnected') {
          setIsConnected(false);
        }
      };

    } catch (error) {
      logger.error('Error inicializando WebRTC:', error);
      if (onError) {
        onError('Error al acceder a la cámara o micrófono');
      }
    }
  };

  // Crear oferta WebRTC
  const createOffer = async () => {
    if (!peerConnectionRef.current) return;
    
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          roomId: roomId,
          offer: offer
        });
      }
    } catch (error) {
      logger.error('Error creando oferta:', error);
    }
  };

  // Manejar oferta recibida
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      if (socketRef.current) {
        socketRef.current.emit('answer', {
          roomId: roomId,
          answer: answer
        });
      }
    } catch (error) {
      logger.error('Error manejando oferta:', error);
    }
  };

  // Manejar respuesta recibida
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      logger.error('Error manejando respuesta:', error);
    }
  };

  // Manejar candidato ICE
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      logger.error('Error agregando candidato ICE:', error);
    }
  };

  // Iniciar consulta
  const handleStartCall = async () => {
    setIsConnecting(true);
    await initializeWebRTC();
  };

  // Finalizar consulta
  const handleEndCall = () => {
    setIsConnected(false);
    setIsConnecting(false);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    onEndCall();
  };

  // Configurar streams de video
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Manejar errores
  useEffect(() => {
    if (onError) {
      // Manejar errores de conexión
    }
  }, [onError]);

  // Auto-conectar
  useEffect(() => {
    if (!TELEMED_ENABLED) return;
    handleStartCall();
    return () => {
      if (!TELEMED_ENABLED) return;
      handleEndCall();
    };
  }, [TELEMED_ENABLED]);

  // Manejar fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Manejar grabación
  const toggleRecording = () => {
    if (!isRecording && remoteStream) {
      const recorder = new MediaRecorder(remoteStream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } else if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Descargar grabación
  const downloadRecording = () => {
    if (recordingUrl) {
      const a = document.createElement('a');
      a.href = recordingUrl;
      a.download = `consulta-${patientName}-${new Date().toISOString()}.webm`;
      a.click();
    }
  };

  // Si la funcionalidad está deshabilitada, mostrar UI informativa y no iniciar WebRTC
  if (!TELEMED_ENABLED) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] bg-gray-50 ${className}`}>
        <div className="text-center max-w-xl">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-700 text-lg">!</span>
          </div>
          <h3 className="text-gray-900 font-semibold text-lg">Telemedicina deshabilitada</h3>
          <p className="text-gray-600 text-sm mt-1">
            La funcionalidad de videollamada en tiempo real (WebRTC) ha sido retirada.
            Si necesitas habilitar un modo de demo, establece la variable de entorno
            <span className="font-mono"> NEXT_PUBLIC_TELEMEDICINE_ENABLED=true</span> temporalmente.
          </p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Conectando con el paciente...</p>
          <p className="text-sm text-gray-500">Esperando que el paciente se una</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video remoto (principal) */}
      <video
        ref={remoteVideoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={false}
      />

      {/* Video local (esquina) */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Información del paciente */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-3 text-white">
        <div className="flex items-center space-x-2">
          <Stethoscope className="w-5 h-5 text-blue-400" />
          <div>
            <p className="font-semibold">{patientName}</p>
            <p className="text-sm text-gray-300">ID: {patientId}</p>
            <p className="text-xs text-green-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 bg-black bg-opacity-75 rounded-full px-6 py-3">
            {/* Botón Mute */}
            <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>

            {/* Botón Video */}
            <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors">
              <Video className="w-5 h-5" />
            </button>

            {/* Botón Compartir Pantalla */}
            <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors">
              <Monitor className="w-5 h-5" />
            </button>

            {/* Botón Grabación */}
            <button
              onClick={toggleRecording}
              className={`p-3 rounded-full transition-colors ${
                isRecording ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>

            {/* Botón Finalizar */}
            <button
              onClick={handleEndCall}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Botón Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 bg-black bg-opacity-75 text-white rounded-lg hover:bg-opacity-90 transition-colors"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Botón Descargar Grabación */}
      {recordingUrl && (
        <button
          onClick={downloadRecording}
          className="absolute top-4 right-16 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {/* Estadísticas */}
      {showStats && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 rounded-lg p-2 text-white text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span>Pacientes: {participants.length}</span>
            </div>
            <div>
              <span>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 