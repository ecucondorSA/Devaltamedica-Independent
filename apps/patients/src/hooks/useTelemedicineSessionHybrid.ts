/**
 * Hook Híbrido de Telemedicina - Socket.IO + Firebase
 * Combina tiempo real (Socket.IO) con persistencia (Firebase)
 * Altamedica - Fase 2 Implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from "@altamedica/auth';

import { logger } from '@altamedica/shared/services/logger.service';
interface TelemedicineSession {
  id: string;
  roomId: string;
  patientId: string;
  doctorId: string;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  notes?: string;
  recordingUrl?: string;
  participants?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface Participant {
  id: string;
  userId: string;
  role: 'patient' | 'doctor';
  name: string;
  status: 'waiting' | 'connected' | 'disconnected';
  joinedAt: Date;
  leftAt?: Date;
}

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  temperature?: number;
  oxygenSaturation?: number;
  timestamp: Date;
}

interface UseTelemedicineSessionHybridReturn {
  // Firebase State (Persistencia)
  session: TelemedicineSession | null;
  chatMessages: ChatMessage[];
  
  // Socket.IO State (Tiempo Real)
  socket: Socket | null;
  isConnected: boolean;
  participants: Participant[];
  currentVitals: VitalSigns | null;
  
  // Estado General
  loading: boolean;
  error: string | null;
  
  // Métodos
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  sendChatMessage: (message: string, type?: 'text' | 'file', fileUrl?: string, fileName?: string) => void;
  updateVitalSigns: (vitals: VitalSigns) => void;
  toggleMedia: (type: 'audio' | 'video', enabled: boolean) => void;
}

const SIGNALING_SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:8888';

export function useTelemedicineSessionHybrid(): UseTelemedicineSessionHybridReturn {
  // Estado Firebase (Persistencia)
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Estado Socket.IO (Tiempo Real)
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentVitals, setCurrentVitals] = useState<VitalSigns | null>(null);
  
  // Estado General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth y Referencias
  const { authState } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const firebaseUnsubscribes = useRef<Array<() => void>>([]);

  // Limpiar suscripciones Firebase
  const cleanupFirebaseListeners = useCallback(() => {
    firebaseUnsubscribes.current.forEach(unsubscribe => unsubscribe());
    firebaseUnsubscribes.current = [];
  }, []);

  // Configurar listeners Firebase para persistencia
  const setupFirebaseListeners = useCallback((sessionId: string) => {
    if (!sessionId || !db) return;

    // Listener para la sesión principal
    const sessionRef = doc(db, 'telemedicine_sessions', sessionId);
    const unsubscribeSession = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSession({
          id: doc.id,
          ...data,
          scheduledAt: data.scheduledAt?.toDate() || new Date(),
          startedAt: data.startedAt?.toDate(),
          endedAt: data.endedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as TelemedicineSession);
      }
    }, (error) => {
      logger.error('Error listening to session:', error);
      setError(`Error de sincronización: ${error.message}`);
    });

    // Listener para mensajes de chat
    const messagesQuery = query(
      collection(db, 'telemedicine_sessions', sessionId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage);
      });
      setChatMessages(messages);
    }, (error) => {
      logger.error('Error listening to messages:', error);
    });

    firebaseUnsubscribes.current.push(unsubscribeSession, unsubscribeMessages);
  }, []);

  // Inicializar Socket.IO
  const initializeSocket = useCallback(() => {
    if (!authState?.token) {
      setError('Token de autenticación requerido');
      return;
    }

    try {
      const newSocket = io(SIGNALING_SERVER_URL, {
        auth: {
          token: authState.token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retries: 3
      });

      // Eventos de conexión
      newSocket.on('connect', () => {
        logger.info('🔌 Conectado al servidor de señalización');
        setIsConnected(true);
        setError(null);
        
        // Autenticarse con el token
        newSocket.emit('authenticate', authState.token);
      });

      newSocket.on('disconnect', () => {
        logger.info('🔌 Desconectado del servidor');
        setIsConnected(false);
        setParticipants([]);
      });

      newSocket.on('connect_error', (error) => {
        logger.error('Error de conexión:', error);
        setError(`Error de conexión: ${error.message}`);
        setIsConnected(false);
      });

      // Eventos de autenticación
      newSocket.on('authenticated', (data) => {
        logger.info('✅ Autenticado como:', data.user.email);
      });

      newSocket.on('auth-error', (data) => {
        logger.error('❌ Error de autenticación:', data.message);
        setError(`Error de autenticación: ${data.message}`);
        newSocket.disconnect();
      });

      // Eventos de sala
      newSocket.on('room-joined', (data) => {
        logger.info('🏥 Se unió a la sala:', data.roomId);
        setParticipants(data.participants || []);
        setError(null);
      });

      newSocket.on('participant-joined', (data) => {
        logger.info('👥 Participante se unió:', data.participant.name);
        setParticipants(prev => [...prev, data.participant]);
      });

      newSocket.on('participant-left', (data) => {
        logger.info('👤 Participante salió:', data.userId);
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      });

      // Eventos de chat en tiempo real
      newSocket.on('chat-message', (message: ChatMessage) => {
        logger.info('💬 Nuevo mensaje de chat');
        // Los mensajes se actualizan automáticamente vía Firebase listener
      });

      // Eventos de signos vitales
      newSocket.on('vitals-update', (data) => {
        logger.info('❤️ Actualización de signos vitales');
        setCurrentVitals({
          ...data.vitals,
          timestamp: new Date(data.timestamp)
        });
      });

      // Eventos de WebRTC
      newSocket.on('webrtc-signal', (data) => {
        logger.info('📡 Señal WebRTC recibida:', data.type);
        // Estos eventos se manejarán en useWebRTC
      });

      // Eventos de control de medios
      newSocket.on('participant-toggled-media', (data) => {
        logger.info(`🎥 Usuario ${data.userId} cambió ${data.type}: ${data.enabled}`);
        setParticipants(prev => prev.map(p => 
          p.userId === data.userId 
            ? { ...p, [`${data.type}Enabled`]: data.enabled }
            : p
        ));
      });

      // Eventos de error
      newSocket.on('error', (data) => {
        logger.error('❌ Error del servidor:', data.message);
        setError(`Error del servidor: ${data.message}`);
      });

      setSocket(newSocket);
      
    } catch (error) {
      logger.error('Error inicializando socket:', error);
      setError(`Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [authState?.token]);

  // Unirse a una sesión
  const joinSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!authState?.user) {
        throw new Error('Usuario no autenticado');
      }

      sessionIdRef.current = sessionId;
      
      // 1. Configurar listeners Firebase para persistencia
      setupFirebaseListeners(sessionId);
      
      // 2. Inicializar Socket.IO para tiempo real
      if (!socket) {
        initializeSocket();
      }
      
      // 3. Esperar conexión y unirse a la sala
      const waitForConnection = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout de conexión'));
        }, 10000);

        const checkConnection = () => {
          if (socket && isConnected) {
            clearTimeout(timeout);
            
            // Unirse a la sala WebRTC
            socket.emit('join-room', {
              roomId: sessionId,
              role: authState.user.role || 'patient'
            });
            
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        checkConnection();
      });

      await waitForConnection;
      
    } catch (error) {
      logger.error('Error joining session:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [socket, isConnected, authState, setupFirebaseListeners, initializeSocket]);

  // Salir de la sesión
  const leaveSession = useCallback(async () => {
    if (socket && sessionIdRef.current) {
      socket.emit('leave-room', { roomId: sessionIdRef.current });
    }
    
    // Limpiar estado
    cleanupFirebaseListeners();
    setSession(null);
    setChatMessages([]);
    setParticipants([]);
    setCurrentVitals(null);
    sessionIdRef.current = null;
    
    // Desconectar socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setError(null);
  }, [socket, cleanupFirebaseListeners]);

  // Enviar mensaje de chat
  const sendChatMessage = useCallback((
    message: string, 
    type: 'text' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!socket || !sessionIdRef.current || !message.trim()) return;

    socket.emit('chat-message', {
      roomId: sessionIdRef.current,
      message: message.trim(),
      type,
      fileUrl,
      fileName
    });
  }, [socket]);

  // Actualizar signos vitales
  const updateVitalSigns = useCallback((vitals: VitalSigns) => {
    if (!socket || !sessionIdRef.current) return;

    socket.emit('vitals-update', {
      sessionId: sessionIdRef.current,
      vitals
    });
  }, [socket]);

  // Controlar audio/video
  const toggleMedia = useCallback((type: 'audio' | 'video', enabled: boolean) => {
    if (!socket || !sessionIdRef.current) return;

    socket.emit('toggle-media', {
      sessionId: sessionIdRef.current,
      type,
      enabled
    });
  }, [socket]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cleanupFirebaseListeners();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, cleanupFirebaseListeners]);

  // Inicializar socket cuando el usuario se autentica
  useEffect(() => {
    if (authState?.token && !socket) {
      initializeSocket();
    }
  }, [authState?.token, socket, initializeSocket]);

  return {
    // Firebase State
    session,
    chatMessages,
    
    // Socket.IO State
    socket,
    isConnected,
    participants,
    currentVitals,
    
    // General State
    loading,
    error,
    
    // Methods
    joinSession,
    leaveSession,
    sendChatMessage,
    updateVitalSigns,
    toggleMedia
  };
}

export default useTelemedicineSessionHybrid;