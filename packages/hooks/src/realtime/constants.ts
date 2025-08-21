/**
 * @fileoverview Constantes para hooks de tiempo real
 * @module @altamedica/hooks/realtime/constants
 * @description Constantes, eventos y configuraciones por defecto
 */

import type { HeartbeatConfig, ReconnectionConfig } from './types';

// ==========================================
// ESTADOS DE CONEXIÓN
// ==========================================

/**
 * Estados de conexión posibles
 */
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  CLOSED: 'closed'
} as const;

// ==========================================
// EVENTOS DE TIEMPO REAL
// ==========================================

/**
 * Eventos estándar del sistema de tiempo real
 */
export const REALTIME_EVENTS = {
  // Eventos de conexión
  CONNECTION: {
    CONNECTING: 'connection:connecting',
    CONNECTED: 'connection:connected',
    DISCONNECTED: 'connection:disconnected',
    RECONNECTING: 'connection:reconnecting',
    ERROR: 'connection:error',
    TIMEOUT: 'connection:timeout'
  },

  // Eventos de WebSocket
  WEBSOCKET: {
    OPEN: 'websocket:open',
    CLOSE: 'websocket:close',
    MESSAGE: 'websocket:message',
    ERROR: 'websocket:error',
    PING: 'websocket:ping',
    PONG: 'websocket:pong'
  },

  // Eventos de WebRTC
  WEBRTC: {
    OFFER: 'webrtc:offer',
    ANSWER: 'webrtc:answer',
    ICE_CANDIDATE: 'webrtc:ice_candidate',
    STREAM_ADDED: 'webrtc:stream_added',
    STREAM_REMOVED: 'webrtc:stream_removed',
    DATA_CHANNEL: 'webrtc:data_channel'
  },

  // Eventos médicos específicos
  MEDICAL: {
    VITAL_SIGNS: 'medical:vital_signs',
    ALERT: 'medical:alert',
    EMERGENCY: 'medical:emergency',
    APPOINTMENT_START: 'medical:appointment_start',
    APPOINTMENT_END: 'medical:appointment_end',
    PATIENT_STATUS: 'medical:patient_status',
    DOCTOR_AVAILABLE: 'medical:doctor_available'
  },

  // Eventos de presencia
  PRESENCE: {
    USER_ONLINE: 'presence:user_online',
    USER_OFFLINE: 'presence:user_offline',
    USER_AWAY: 'presence:user_away',
    USER_BUSY: 'presence:user_busy',
    STATUS_CHANGE: 'presence:status_change'
  },

  // Eventos de chat
  CHAT: {
    MESSAGE: 'chat:message',
    TYPING_START: 'chat:typing_start',
    TYPING_STOP: 'chat:typing_stop',
    MESSAGE_READ: 'chat:message_read',
    USER_JOINED: 'chat:user_joined',
    USER_LEFT: 'chat:user_left'
  },

  // Eventos de notificaciones
  NOTIFICATIONS: {
    NEW: 'notification:new',
    READ: 'notification:read',
    DISMISSED: 'notification:dismissed',
    ACTION: 'notification:action'
  }
} as const;

// ==========================================
// CONFIGURACIONES POR DEFECTO
// ==========================================

/**
 * Configuración por defecto para reconexión
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  enabled: true,
  initialDelay: 1000, // 1 segundo
  backoffFactor: 2,
  maxDelay: 30000, // 30 segundos
  maxAttempts: 10,
  jitter: true
};

/**
 * Configuración por defecto para heartbeat
 */
export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: true,
  interval: 30000, // 30 segundos
  timeout: 5000, // 5 segundos
  message: 'ping'
};

/**
 * Configuración por defecto para WebRTC médico
 */
export const DEFAULT_WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Servidores TURN para entornos corporativos
    {
      urls: 'turn:turn.altamedica.com:3478',
      username: 'altamedica',
      credential: 'medical-secure-2024'
    }
  ],
  mediaConstraints: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  },
  peerConfig: {
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
  }
} as const;

/**
 * Configuración de calidad de video médica
 */
export const MEDICAL_VIDEO_QUALITY = {
  low: {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 300000 // 300 kbps
  },
  medium: {
    width: 1280,
    height: 720,
    frameRate: 24,
    bitrate: 1000000 // 1 Mbps
  },
  high: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 2500000 // 2.5 Mbps
  },
  ultra: {
    width: 3840,
    height: 2160,
    frameRate: 30,
    bitrate: 8000000 // 8 Mbps - para análisis detallado
  }
} as const;

// ==========================================
// ENDPOINTS Y URLS
// ==========================================

/**
 * URLs por defecto para diferentes entornos
 */
export const DEFAULT_ENDPOINTS = {
  development: {
    websocket: 'ws://localhost:8888',
    signaling: 'ws://localhost:8889/signaling',
    stun: 'stun:localhost:3478',
    turn: 'turn:localhost:3478'
  },
  staging: {
    websocket: 'wss://realtime-staging.altamedica.com',
    signaling: 'wss://signaling-staging.altamedica.com',
    stun: 'stun:stun-staging.altamedica.com:3478',
    turn: 'turn:turn-staging.altamedica.com:3478'
  },
  production: {
    websocket: 'wss://realtime.altamedica.com',
    signaling: 'wss://signaling.altamedica.com',
    stun: 'stun:stun.altamedica.com:3478',
    turn: 'turn:turn.altamedica.com:3478'
  }
} as const;

/**
 * Obtiene endpoints para el entorno actual
 */
export function getRealTimeEndpoints() {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof DEFAULT_ENDPOINTS;
  return DEFAULT_ENDPOINTS[env] || DEFAULT_ENDPOINTS.development;
}

// ==========================================
// CÓDIGOS DE ERROR
// ==========================================

/**
 * Códigos de error estándar para tiempo real
 */
export const REALTIME_ERROR_CODES = {
  // Errores de conexión
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  CONNECTION_LOST: 'CONNECTION_LOST',
  
  // Errores de autenticación
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  
  // Errores de WebRTC
  WEBRTC_NOT_SUPPORTED: 'WEBRTC_NOT_SUPPORTED',
  MEDIA_PERMISSION_DENIED: 'MEDIA_PERMISSION_DENIED',
  MEDIA_DEVICE_ERROR: 'MEDIA_DEVICE_ERROR',
  ICE_CONNECTION_FAILED: 'ICE_CONNECTION_FAILED',
  
  // Errores médicos específicos
  HIPAA_VIOLATION: 'HIPAA_VIOLATION',
  MEDICAL_DATA_ERROR: 'MEDICAL_DATA_ERROR',
  PATIENT_PRIVACY_ERROR: 'PATIENT_PRIVACY_ERROR',
  
  // Errores generales
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;

// ==========================================
// TIMEOUTS Y LÍMITES
// ==========================================

/**
 * Timeouts por defecto para diferentes operaciones
 */
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 10000, // 10 segundos
  WEBSOCKET_OPEN: 5000, // 5 segundos
  WEBRTC_CONNECTION: 30000, // 30 segundos
  ICE_GATHERING: 10000, // 10 segundos
  HEARTBEAT_RESPONSE: 5000, // 5 segundos
  MESSAGE_ACK: 3000, // 3 segundos
  RECONNECT_BACKOFF: 30000 // 30 segundos máximo
} as const;

/**
 * Límites de rate limiting
 */
export const RATE_LIMITS = {
  MESSAGES_PER_SECOND: 10,
  MESSAGES_PER_MINUTE: 300,
  CONNECTIONS_PER_IP: 5,
  CHANNELS_PER_CONNECTION: 50,
  MESSAGE_SIZE_BYTES: 64 * 1024, // 64 KB
  BATCH_SIZE: 100
} as const;

// ==========================================
// CONFIGURACIÓN MÉDICA ESPECÍFICA
// ==========================================

/**
 * Configuración específica para aplicaciones médicas
 */
export const MEDICAL_CONFIG = {
  // Prioridades de mensajes médicos
  MESSAGE_PRIORITIES: {
    EMERGENCY: 4,
    CRITICAL: 3,
    HIGH: 2,
    MEDIUM: 1,
    LOW: 0
  },
  
  // Tipos de eventos médicos críticos
  CRITICAL_EVENTS: [
    'medical:emergency',
    'medical:vital_signs_critical',
    'medical:cardiac_arrest',
    'medical:respiratory_failure',
    'medical:allergic_reaction'
  ],
  
  // Configuración de compliance HIPAA
  HIPAA_CONFIG: {
    AUDIT_ALL_MESSAGES: true,
    ENCRYPT_PHI: true,
    LOG_ACCESS_ATTEMPTS: true,
    AUTO_DISCONNECT_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    REQUIRE_SECURE_CONNECTION: true
  },
  
  // Configuración de grabación médica
  RECORDING_CONFIG: {
    AUTO_RECORD_CONSULTATIONS: true,
    MAX_RECORDING_DURATION: 2 * 60 * 60 * 1000, // 2 horas
    RECORDING_QUALITY: 'high',
    INCLUDE_CHAT: true,
    INCLUDE_SCREEN_SHARE: true
  }
} as const;

// ==========================================
// UTILIDADES DE VALIDACIÓN
// ==========================================

/**
 * Valida si un evento es crítico médicamente
 */
export function isCriticalMedicalEvent(eventType: string): boolean {
  return (MEDICAL_CONFIG.CRITICAL_EVENTS as readonly string[]).includes(eventType);
}

/**
 * Obtiene la prioridad numérica de un mensaje
 */
export function getMessagePriority(priority: string): number {
  const key = priority.toUpperCase() as keyof typeof MEDICAL_CONFIG.MESSAGE_PRIORITIES;
  return (MEDICAL_CONFIG.MESSAGE_PRIORITIES as Record<string, number>)[key] ?? 0;
}

/**
 * Valida configuración de WebRTC
 */
export function validateWebRTCConfig(config: any): boolean {
  return !!(config && config.iceServers && Array.isArray(config.iceServers));
}

/**
 * Genera un delay de reconexión con jitter
 */
export function calculateReconnectDelay(
  attempt: number, 
  config: ReconnectionConfig
): number {
  let delay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt),
    config.maxDelay
  );
  
  if (config.jitter) {
    // Agregar ±25% de jitter
    const jitterRange = delay * 0.25;
    delay += (Math.random() - 0.5) * 2 * jitterRange;
  }
  
  return Math.max(delay, 0);
}