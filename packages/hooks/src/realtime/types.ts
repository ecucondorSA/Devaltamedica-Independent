/**
 * @fileoverview Tipos para hooks de tiempo real
 * @module @altamedica/hooks/realtime/types
 * @description Definiciones de tipos para comunicación en tiempo real
 */

// ==========================================
// TIPOS BASE DE CONEXIÓN
// ==========================================

/**
 * Estados de conexión unificados para todos los tipos de tiempo real
 */
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

/**
 * Configuración de reconexión
 */
export interface ReconnectionConfig {
  /** Si debe intentar reconectar automáticamente */
  enabled: boolean;
  /** Intervalo inicial de reconexión (ms) */
  initialDelay: number;
  /** Factor de backoff exponencial */
  backoffFactor: number;
  /** Delay máximo entre intentos */
  maxDelay: number;
  /** Número máximo de intentos */
  maxAttempts: number;
  /** Si debe usar jitter para evitar thundering herd */
  jitter: boolean;
}

/**
 * Configuración de heartbeat/ping
 */
export interface HeartbeatConfig {
  /** Si está habilitado */
  enabled: boolean;
  /** Intervalo de ping (ms) */
  interval: number;
  /** Timeout para pong (ms) */
  timeout: number;
  /** Mensaje de ping personalizado */
  message?: string;
}

// ==========================================
// WEBSOCKET TYPES
// ==========================================

/**
 * Configuración para WebSocket
 */
export interface WebSocketConfig {
  /** URL del WebSocket */
  url: string;
  /** Protocolos WebSocket */
  protocols?: string | string[];
  /** Headers adicionales */
  headers?: Record<string, string>;
  /** Configuración de reconexión */
  reconnection?: Partial<ReconnectionConfig>;
  /** Configuración de heartbeat */
  heartbeat?: Partial<HeartbeatConfig>;
  /** Token de autenticación */
  token?: string;
  /** Si debe conectar inmediatamente */
  immediate?: boolean;
  /** Configuración específica médica */
  medical?: {
    /** ID del paciente para contexto */
    patientId?: string;
    /** ID del doctor para contexto */
    doctorId?: string;
    /** Si requiere compliance HIPAA */
    hipaaCompliant?: boolean;
    /** Nivel de prioridad médica */
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Estado del WebSocket
 */
export interface WebSocketState {
  /** Estado actual de la conexión */
  connectionState: ConnectionState;
  /** Si está conectado */
  isConnected: boolean;
  /** Si está conectando */
  isConnecting: boolean;
  /** Si está reconectando */
  isReconnecting: boolean;
  /** Último error */
  error: Error | null;
  /** Número de intentos de reconexión */
  reconnectAttempts: number;
  /** Timestamp de última conexión exitosa */
  lastConnected?: Date;
  /** Timestamp de última desconexión */
  lastDisconnected?: Date;
  /** Latencia actual en ms */
  latency?: number;
  /** Métricas de conexión */
  metrics: {
    messagesReceived: number;
    messagesSent: number;
    bytesReceived: number;
    bytesSent: number;
    reconnections: number;
    uptime: number;
  };
}

// ==========================================
// WEBRTC TYPES
// ==========================================

/**
 * Configuración para WebRTC
 */
export interface WebRTCConfig {
  /** Configuración de servidores ICE */
  iceServers?: RTCIceServer[];
  /** Constraints de media */
  mediaConstraints?: MediaStreamConstraints;
  /** Configuración de peer connection */
  peerConfig?: RTCConfiguration;
  /** Canal de señalización */
  signalingChannel?: WebSocketConfig;
  /** Si debe iniciar automáticamente */
  autoStart?: boolean;
  /** Configuración médica específica */
  medical?: {
    /** Calidad de video médica */
    videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
    /** Si debe grabar la sesión */
    recordSession?: boolean;
    /** Bitrate objetivo para video médico */
    targetBitrate?: number;
    /** Configuración de codec preferido */
    preferredCodec?: 'H264' | 'VP8' | 'VP9' | 'AV1';
    /** Si requiere cifrado end-to-end */
    e2eEncryption?: boolean;
  };
}

/**
 * Estado del WebRTC
 */
export interface WebRTCState {
  /** Estado de la conexión peer */
  connectionState: RTCPeerConnectionState;
  /** Estado de la conexión ICE */
  iceConnectionState: RTCIceConnectionState;
  /** Estado de gathering ICE */
  iceGatheringState: RTCIceGatheringState;
  /** Estado de señalización */
  signalingState: RTCSignalingState;
  /** Stream local */
  localStream?: MediaStream;
  /** Stream remoto */
  remoteStream?: MediaStream;
  /** Si está transmitiendo video */
  isVideoEnabled: boolean;
  /** Si está transmitiendo audio */
  isAudioEnabled: boolean;
  /** Si la pantalla está compartida */
  isScreenSharing: boolean;
  /** Estadísticas de conexión */
  stats?: RTCStatsReport;
  /** Métricas médicas */
  medicalMetrics?: {
    videoQualityScore: number;
    audioQualityScore: number;
    networkStability: number;
    sessionDuration: number;
    frameDropRate: number;
  };
}

// ==========================================
// REALTIME UPDATES TYPES
// ==========================================

/**
 * Configuración para actualizaciones en tiempo real
 */
export interface RealTimeConfig {
  /** Tipo de transporte */
  transport: 'websocket' | 'firebase' | 'hybrid';
  /** Configuración del transporte */
  transportConfig?: WebSocketConfig | FirebaseConfig;
  /** Canales a suscribir inicialmente */
  channels?: string[];
  /** Filtros de eventos */
  eventFilters?: string[];
  /** Si debe mantener historial de eventos */
  keepHistory?: boolean;
  /** Límite de historial */
  historyLimit?: number;
  /** Configuración de batch para eventos */
  batch?: {
    enabled: boolean;
    size: number;
    timeout: number;
  };
}

/**
 * Estado de tiempo real
 */
export interface RealTimeState {
  /** Estado de la conexión */
  connectionState: ConnectionState;
  /** Canales suscritos */
  subscribedChannels: Set<string>;
  /** Último mensaje recibido */
  lastMessage?: MessageEvent;
  /** Cola de mensajes pendientes */
  messageQueue: MessageEvent[];
  /** Historial de eventos */
  eventHistory: MessageEvent[];
  /** Estadísticas */
  stats: {
    messagesReceived: number;
    eventsProcessed: number;
    channelsActive: number;
    averageProcessingTime: number;
  };
}

// ==========================================
// MESSAGE TYPES
// ==========================================

/**
 * Evento de mensaje unificado
 */
export interface MessageEvent<T = any> {
  /** ID único del mensaje */
  id: string;
  /** Tipo de evento */
  type: string;
  /** Canal del mensaje */
  channel: string;
  /** Datos del mensaje */
  data: T;
  /** Timestamp del evento */
  timestamp: Date;
  /** Metadatos adicionales */
  metadata?: {
    /** ID del emisor */
    senderId?: string;
    /** Prioridad del mensaje */
    priority?: 'low' | 'medium' | 'high' | 'critical';
    /** Si requiere confirmación */
    requiresAck?: boolean;
    /** TTL del mensaje */
    ttl?: number;
    /** Contexto médico */
    medicalContext?: {
      patientId?: string;
      appointmentId?: string;
      sessionId?: string;
      eventType?: 'vital_signs' | 'alert' | 'notification' | 'status_change';
    };
  };
}

// ==========================================
// PRESENCE TYPES
// ==========================================

/**
 * Datos de presencia de usuario
 */
export interface PresenceData {
  /** ID del usuario */
  userId: string;
  /** Estado de presencia */
  status: 'online' | 'away' | 'busy' | 'offline';
  /** Última actividad */
  lastSeen: Date;
  /** Información adicional */
  info?: {
    /** Nombre del usuario */
    name?: string;
    /** Avatar URL */
    avatar?: string;
    /** Contexto actual */
    currentContext?: string;
    /** Dispositivo activo */
    device?: 'desktop' | 'mobile' | 'tablet';
  };
  /** Metadatos médicos */
  medicalContext?: {
    /** Si está en consulta */
    inConsultation?: boolean;
    /** ID del paciente actual */
    currentPatientId?: string;
    /** Tipo de usuario médico */
    userType?: 'doctor' | 'nurse' | 'admin' | 'patient';
  };
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

/**
 * Datos de notificación
 */
export interface NotificationData {
  /** ID único */
  id: string;
  /** Título */
  title: string;
  /** Mensaje */
  message: string;
  /** Tipo de notificación */
  type: 'info' | 'success' | 'warning' | 'error' | 'medical_alert';
  /** Prioridad */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Si está leída */
  read: boolean;
  /** Timestamp */
  timestamp: Date;
  /** Acciones disponibles */
  actions?: Array<{
    id: string;
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  /** Contexto médico */
  medicalContext?: {
    patientId?: string;
    appointmentId?: string;
    vitalSignsAlert?: boolean;
    emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

// ==========================================
// VIDEO CALL TYPES
// ==========================================

/**
 * Estado de videollamada
 */
export interface VideoCallState {
  /** Estado general de la llamada */
  callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
  /** Participantes */
  participants: Array<{
    id: string;
    name: string;
    role: 'doctor' | 'patient' | 'observer';
    stream?: MediaStream;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  }>;
  /** Configuración actual */
  settings: {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isScreenSharing: boolean;
    isRecording: boolean;
    selectedCamera?: string;
    selectedMicrophone?: string;
    selectedSpeaker?: string;
  };
  /** Métricas de llamada */
  metrics: {
    duration: number;
    videoQuality: number;
    audioQuality: number;
    networkLatency: number;
    packetsLost: number;
    jitter: number;
  };
}

// ==========================================
// CHAT TYPES
// ==========================================

/**
 * Mensaje de chat
 */
export interface ChatMessage {
  /** ID único */
  id: string;
  /** ID del remitente */
  senderId: string;
  /** Nombre del remitente */
  senderName: string;
  /** Tipo de remitente */
  senderType: 'doctor' | 'patient' | 'nurse' | 'admin';
  /** Contenido del mensaje */
  content: string;
  /** Tipo de mensaje */
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'medical_data';
  /** Timestamp */
  timestamp: Date;
  /** Si está editado */
  edited?: boolean;
  /** Timestamp de edición */
  editedAt?: Date;
  /** Archivos adjuntos */
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  /** Metadatos médicos */
  medicalData?: {
    patientId?: string;
    appointmentId?: string;
    dataType?: 'vital_signs' | 'prescription' | 'diagnosis' | 'notes';
    isConfidential?: boolean;
  };
}

// ==========================================
// FIREBASE TYPES
// ==========================================

/**
 * Configuración para Firebase Realtime
 */
export interface FirebaseConfig {
  /** Configuración del proyecto */
  projectConfig?: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
  };
  /** Rutas a escuchar */
  paths?: string[];
  /** Configuración de autenticación */
  auth?: {
    token?: string;
    useCurrentUser?: boolean;
  };
  /** Configuración de persistencia */
  persistence?: {
    enabled: boolean;
    cacheSizeBytes?: number;
  };
}

// ==========================================
// MANAGER TYPES
// ==========================================

/**
 * Configuración del manager de tiempo real unificado
 */
export interface RealTimeManagerConfig {
  /** Tipo de conexión principal */
  primary: 'websocket' | 'webrtc' | 'firebase';
  /** Tipo de conexión de respaldo */
  fallback?: 'websocket' | 'firebase';
  /** Configuraciones específicas */
  websocket?: WebSocketConfig;
  webrtc?: WebRTCConfig;
  firebase?: FirebaseConfig;
  realtime?: RealTimeConfig;
  /** Configuración global */
  global?: {
    /** Si debe usar modo offline */
    offlineMode?: boolean;
    /** Configuración de retry */
    retryConfig?: ReconnectionConfig;
    /** Configuración de logging */
    logging?: {
      level: 'debug' | 'info' | 'warn' | 'error';
      includeMetrics: boolean;
    };
  };
}

/**
 * Valor de retorno del manager unificado
 */
export interface UseRealTimeReturn {
  // Estados
  connectionState: ConnectionState;
  isConnected: boolean;
  error: Error | null;
  metrics: {
    latency?: number;
    uptime: number;
    messagesCount: number;
  };

  // WebSocket
  websocket?: {
    send: (data: any) => void;
    subscribe: (channel: string, callback: (data: any) => void) => () => void;
    state: WebSocketState;
  };

  // WebRTC
  webrtc?: {
    startCall: (targetId: string) => Promise<void>;
    endCall: () => void;
    toggleVideo: () => void;
    toggleAudio: () => void;
    shareScreen: () => Promise<void>;
    state: WebRTCState;
  };

  // Tiempo Real
  realtime?: {
    subscribe: (channel: string, callback: (event: MessageEvent) => void) => () => void;
    publish: (channel: string, data: any) => void;
    presence: (userId: string) => PresenceData | null;
    state: RealTimeState;
  };

  // Utilidades
  reconnect: () => Promise<void>;
  disconnect: () => void;
  getConnectionInfo: () => any;
}