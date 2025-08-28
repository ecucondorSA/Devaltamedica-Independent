/**
import { logger } from '@altamedica/shared';

 * 🏥 TELEMEDICINE HOOK - ALTAMEDICA (DEPRECATED)
 * 
 * ⚠️ DEPRECATION NOTICE:
 * Este archivo ha sido consolidado en useTelemedicineUnified.ts
 * 
 * FUNCIONALIDADES MIGRADAS:
 * - ✅ useTelemedicine → useTelemedicineUnified
 * - ✅ useTelemedicineSessions → useTelemedicineUnified
 * - ✅ Socket.io management → useTelemedicineUnified
 * - ✅ WebRTC basic functionality → useTelemedicineUnified
 * - ✅ Chat messaging → useTelemedicineUnified
 * - ✅ Session management → useTelemedicineUnified
 * 
 * NUEVA UBICACIÓN: ./useTelemedicineUnified.ts
 * 
 * VENTAJAS DEL HOOK UNIFICADO:
 * - ✅ Mejor calidad de conexión WebRTC
 * - ✅ Compliance HIPAA integrado
 * - ✅ Monitoreo de calidad en tiempo real
 * - ✅ Gestión de dispositivos avanzada
 * - ✅ Signaling server optimizado
 */

// Re-export from unified implementation
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

// Backward compatibility exports
export const useTelemedicine = useTelemedicineUnified;
export const useTelemedicineSessions = useTelemedicineUnified;

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
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

interface WebRTCConnection {
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

interface TelemedicineState {
  session: TelemedicineSession | null;
  chatMessages: ChatMessage[];
  webrtc: WebRTCConnection;
  isInSession: boolean;
  loading: boolean;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WEBRTC_URL = process.env.NEXT_PUBLIC_WEBRTC_URL || 'http://localhost:3001';

const DEPRECATED_useTelemedicine_impl = (sessionId?: string) => {
  const [state, setState] = useState<TelemedicineState>({
    session: null,
    chatMessages: [],
    webrtc: {
      isConnected: false,
      isConnecting: false,
    },
    isInSession: false,
    loading: false,
  });

  const [socket, setSocket] = useState<Socket | null>(null);

  // Inicializar socket de WebRTC
  const initializeSocket = useCallback(() => {
    if (socket) return socket;

    const newSocket = io(WEBRTC_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      logger.info('Connected to WebRTC server');
    });

    newSocket.on('disconnect', () => {
      logger.info('Disconnected from WebRTC server');
      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          isConnected: false,
          error: 'Disconnected from server',
        },
      }));
    });

    newSocket.on('error', (error) => {
      logger.error('WebRTC socket error:', error);
      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          error: error.message,
        },
      }));
    });

    setSocket(newSocket);
    return newSocket;
  }, [socket]);

  // Cargar sesión de telemedicina
  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId) return;

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/telemedicine/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const session: TelemedicineSession = await response.json();
      setState((prev) => ({
        ...prev,
        session,
        loading: false,
      }));

      // Cargar historial de chat
      await loadChatHistory(sessionId);
    } catch (error) {
      logger.error('Error loading session:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load session',
      }));
    }
  }, []);

  // Cargar historial de chat
  const loadChatHistory = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telemedicine/sessions/${sessionId}/chat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const chatMessages: ChatMessage[] = await response.json();
        setState((prev) => ({
          ...prev,
          chatMessages,
        }));
      }
    } catch (error) {
      logger.error('Error loading chat history:', error);
    }
  }, []);

  // Unirse a la sala de telemedicina
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!socket) {
        initializeSocket();
        return;
      }

      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          isConnecting: true,
          error: undefined,
        },
      }));

      try {
        // Obtener capacidades RTP del navegador
        const { RTCRtpReceiver } = window as any;
        const rtpCapabilities = RTCRtpReceiver.getCapabilities
          ? RTCRtpReceiver.getCapabilities('video')
          : null;

        // Unirse a la sala
        socket.emit('join-room', {
          roomId,
          rtpCapabilities,
        });

        // Configurar listeners para WebRTC
        setupWebRTCListeners(socket);
      } catch (error) {
        logger.error('Error joining room:', error);
        setState((prev) => ({
          ...prev,
          webrtc: {
            ...prev.webrtc,
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to join room',
          },
        }));
      }
    },
    [socket, initializeSocket],
  );

  // Configurar listeners de WebRTC
  const setupWebRTCListeners = useCallback(
    (socket: Socket) => {
      socket.on('room-joined', (data) => {
        logger.info('Joined room:', data);
        setState((prev) => ({
          ...prev,
          webrtc: {
            ...prev.webrtc,
            isConnecting: false,
            isConnected: true,
          },
        }));
      });

      socket.on('transport-created', (data) => {
        logger.info('Transport created:', data);
        // Aquí se configuraría el transporte WebRTC
      });

      socket.on('transport-connected', (data) => {
        logger.info('Transport connected:', data);
      });

      socket.on('produced', (data) => {
        logger.info('Producer created:', data);
      });

      socket.on('new-producer', (data) => {
        logger.info('New producer:', data);
        // Consumir el nuevo stream
        consumeProducer(socket, data.producerId);
      });

      socket.on('consumed', (data) => {
        logger.info('Consumer created:', data);
        // Configurar el stream remoto
        setupRemoteStream(data);
      });

      socket.on('consumer-resumed', (data) => {
        logger.info('Consumer resumed:', data);
      });

      socket.on('peer-joined', (data) => {
        logger.info('Peer joined:', data);
      });

      socket.on('peer-left', (data) => {
        logger.info('Peer left:', data);
        setState((prev) => ({
          ...prev,
          webrtc: {
            ...prev.webrtc,
            remoteStream: undefined,
          },
        }));
      });

      socket.on('chat-message', (data) => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: data.sender,
          senderType: data.sender === state.session?.patientId ? 'patient' : 'doctor',
          message: data.message,
          timestamp: new Date(data.timestamp),
        };

        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, newMessage],
        }));
      });
    },
    [state.session],
  );

  // Consumir producer (stream del otro participante)
  const consumeProducer = useCallback((socket: Socket, producerId: string) => {
    // Obtener capacidades RTP
    const { RTCRtpReceiver } = window as any;
    const rtpCapabilities = RTCRtpReceiver.getCapabilities
      ? RTCRtpReceiver.getCapabilities('video')
      : null;

    socket.emit('consume', {
      producerId,
      rtpCapabilities,
    });
  }, []);

  // Configurar stream remoto
  const setupRemoteStream = useCallback((data: any) => {
    // Aquí se configuraría el MediaStream remoto
    // Esto dependería de la implementación específica de mediasoup
    logger.info('Setting up remote stream:', data);
  }, []);

  // Iniciar stream local
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          localStream: stream,
        },
      }));

      return stream;
    } catch (error) {
      logger.error('Error accessing media devices:', error);
      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          error: 'Failed to access camera/microphone',
        },
      }));
      throw error;
    }
  }, []);

  // Detener stream local
  const stopLocalStream = useCallback(() => {
    if (state.webrtc.localStream) {
      state.webrtc.localStream.getTracks().forEach((track) => track.stop());
      setState((prev) => ({
        ...prev,
        webrtc: {
          ...prev.webrtc,
          localStream: undefined,
        },
      }));
    }
  }, [state.webrtc.localStream]);

  // Enviar mensaje de chat
  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!state.session?.id || !message.trim()) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/telemedicine/sessions/${state.session.id}/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              senderId: state.session.patientId,
              senderType: 'patient',
              message: message.trim(),
            }),
          },
        );

        if (response.ok) {
          const chatMessage: ChatMessage = await response.json();
          setState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, chatMessage],
          }));
        }
      } catch (error) {
        logger.error('Error sending chat message:', error);
      }
    },
    [state.session],
  );

  // Iniciar sesión de telemedicina
  const startSession = useCallback(async () => {
    if (!state.session?.id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/telemedicine/sessions/${state.session.id}/start`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        },
      );

      if (response.ok) {
        const updatedSession = await response.json();
        setState((prev) => ({
          ...prev,
          session: updatedSession,
          isInSession: true,
        }));

        // Unirse a la sala WebRTC
        if (updatedSession.roomId) {
          await joinRoom(updatedSession.roomId);
        }
      }
    } catch (error) {
      logger.error('Error starting session:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to start session',
      }));
    }
  }, [state.session, joinRoom]);

  // Finalizar sesión de telemedicina
  const endSession = useCallback(
    async (notes?: string) => {
      if (!state.session?.id) return;

      try {
        // Detener streams
        stopLocalStream();

        const response = await fetch(
          `${API_BASE_URL}/api/telemedicine/sessions/${state.session.id}/end`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({ notes }),
          },
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            session: updatedSession,
            isInSession: false,
            webrtc: {
              isConnected: false,
              isConnecting: false,
            },
          }));
        }
      } catch (error) {
        logger.error('Error ending session:', error);
      }
    },
    [state.session, stopLocalStream],
  );

  // Cancelar sesión
  const cancelSession = useCallback(
    async (reason?: string) => {
      if (!state.session?.id) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/telemedicine/sessions/${state.session.id}/cancel`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({ reason }),
          },
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            session: updatedSession,
            isInSession: false,
          }));
        }
      } catch (error) {
        logger.error('Error cancelling session:', error);
      }
    },
    [state.session],
  );

  // Cargar sesión al montar el componente
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopLocalStream();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [stopLocalStream, socket]);

  return {
    // Estado
    session: state.session,
    chatMessages: state.chatMessages,
    webrtc: state.webrtc,
    isInSession: state.isInSession,
    loading: state.loading,
    error: state.error,

    // Acciones
    loadSession,
    startSession,
    endSession,
    cancelSession,
    joinRoom,
    startLocalStream,
    stopLocalStream,
    sendChatMessage,
    loadChatHistory,
  };
};

// Hook para gestionar sesiones de telemedicina
const DEPRECATED_useTelemedicineSessions_impl = (options: { initialFetch?: boolean } = {}) => {
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos de ejemplo para desarrollo cuando la API no esté disponible
  const getMockSessions = useCallback((): TelemedicineSession[] => {
    return [
      {
        id: '1',
        roomId: 'room-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        status: 'waiting',
        scheduledAt: new Date(Date.now() + 3600000), // 1 hora desde ahora
        notes: 'Consulta de seguimiento',
      },
      {
        id: '2',
        roomId: 'room-2',
        patientId: 'patient-1',
        doctorId: 'doctor-2',
        status: 'active',
        scheduledAt: new Date(),
        startedAt: new Date(),
        notes: 'Consulta urgente',
      },
      {
        id: '3',
        roomId: 'room-3',
        patientId: 'patient-1',
        doctorId: 'doctor-3',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 86400000), // Ayer
        startedAt: new Date(Date.now() - 86400000 + 300000), // 5 minutos después
        endedAt: new Date(Date.now() - 86400000 + 1800000), // 30 minutos después
        duration: 25,
        notes: 'Revisión general',
      },
    ];
  }, []);

  // Verificar si la API está disponible
  const isApiAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn('API no disponible, usando datos de ejemplo:', error);
      return false;
    }
  }, []);

  // Cargar sesiones de telemedicina
  const loadSessions = useCallback(
    async (filters?: any) => {
      setLoading(true);
      setError(null);

      try {
        // Verificar si la API está disponible
        const apiAvailable = await isApiAvailable();

        if (!apiAvailable) {
          logger.info('API no disponible, cargando datos de ejemplo');
          setSessions(getMockSessions());
          setError('API no disponible - mostrando datos de ejemplo');
          return;
        }

        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.doctorId) queryParams.append('doctorId', filters.doctorId);
        if (filters?.patientId) queryParams.append('patientId', filters.patientId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

        const response = await fetch(`${API_BASE_URL}/api/telemedicine/sessions?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setSessions(data.sessions || []);
        setError(null);
      } catch (error) {
        logger.error('Error loading sessions:', error);

        // Si es un error de red o timeout, usar datos de ejemplo
        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'))
        ) {
          logger.info('Error de red detectado, usando datos de ejemplo');
          setSessions(getMockSessions());
          setError('Error de conexión - mostrando datos de ejemplo');
        } else {
          setError(error instanceof Error ? error.message : 'Error desconocido al cargar sesiones');
          // También cargar datos de ejemplo en caso de error
          setSessions(getMockSessions());
        }
      } finally {
        setLoading(false);
      }
    },
    [isApiAvailable, getMockSessions],
  );

  // Buscar sesiones con filtros
  const searchSessions = useCallback(
    async (filters?: any) => {
      await loadSessions(filters);
    },
    [loadSessions],
  );

  // Crear nueva sesión
  const createSession = useCallback(
    async (sessionData: {
      doctorId: string;
      patientId: string;
      notes?: string;
      scheduledAt?: Date;
    }) => {
      setLoading(true);
      setError(null);

      try {
        // Verificar si la API está disponible
        const apiAvailable = await isApiAvailable();

        if (!apiAvailable) {
          // Crear sesión simulada
          const mockSession: TelemedicineSession = {
            id: `mock-${Date.now()}`,
            roomId: `room-${Date.now()}`,
            patientId: sessionData.patientId,
            doctorId: sessionData.doctorId,
            status: 'scheduled',
            scheduledAt: sessionData.scheduledAt || new Date(),
            notes: sessionData.notes,
          };

          setSessions((prev) => [mockSession, ...prev]);
          setError('API no disponible - sesión creada localmente');
          return mockSession;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}/api/telemedicine/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(sessionData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const newSession = await response.json();
        setSessions((prev) => [newSession, ...prev]);
        setError(null);

        return newSession;
      } catch (error) {
        logger.error('Error creating session:', error);

        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'))
        ) {
          // Crear sesión simulada en caso de error de red
          const mockSession: TelemedicineSession = {
            id: `mock-${Date.now()}`,
            roomId: `room-${Date.now()}`,
            patientId: sessionData.patientId,
            doctorId: sessionData.doctorId,
            status: 'scheduled',
            scheduledAt: sessionData.scheduledAt || new Date(),
            notes: sessionData.notes,
          };

          setSessions((prev) => [mockSession, ...prev]);
          setError('Error de conexión - sesión creada localmente');
          return mockSession;
        }

        setError(error instanceof Error ? error.message : 'Error al crear sesión');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [isApiAvailable],
  );

  // Actualizar sesión
  const updateSession = useCallback(
    async (sessionId: string, updates: Partial<TelemedicineSession>) => {
      try {
        // Verificar si la API está disponible
        const apiAvailable = await isApiAvailable();

        if (!apiAvailable) {
          // Actualizar sesión localmente
          setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)));
          setError('API no disponible - sesión actualizada localmente');
          return { ...sessions.find((s) => s.id === sessionId), ...updates };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}/api/telemedicine/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(updates),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const updatedSession = await response.json();
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? updatedSession : s)));
        setError(null);

        return updatedSession;
      } catch (error) {
        logger.error('Error updating session:', error);

        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'))
        ) {
          // Actualizar sesión localmente en caso de error de red
          setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)));
          setError('Error de conexión - sesión actualizada localmente');
          return { ...sessions.find((s) => s.id === sessionId), ...updates };
        }

        setError(error instanceof Error ? error.message : 'Error al actualizar sesión');
        throw error;
      }
    },
    [isApiAvailable, sessions],
  );

  // Cancelar sesión
  const cancelSession = useCallback(
    async (sessionId: string) => {
      try {
        // Verificar si la API está disponible
        const apiAvailable = await isApiAvailable();

        if (!apiAvailable) {
          // Cancelar sesión localmente
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' as const } : s)),
          );
          setError('API no disponible - sesión cancelada localmente');
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `${API_BASE_URL}/api/telemedicine/sessions/${sessionId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' as const } : s)),
        );
        setError(null);
      } catch (error) {
        logger.error('Error canceling session:', error);

        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'))
        ) {
          // Cancelar sesión localmente en caso de error de red
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' as const } : s)),
          );
          setError('Error de conexión - sesión cancelada localmente');
          return;
        }

        setError(error instanceof Error ? error.message : 'Error al cancelar sesión');
        throw error;
      }
    },
    [isApiAvailable],
  );

  // Cargar sesiones iniciales
  useEffect(() => {
    if (options.initialFetch) {
      loadSessions();
    }
  }, [options.initialFetch, loadSessions]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    searchSessions,
    createSession,
    updateSession,
    cancelSession,
  };
};
