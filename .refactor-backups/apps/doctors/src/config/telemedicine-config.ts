// 🚀 Configuración de Telemedicina Modernizada - Altamedica

export interface TelemedicineConfig {
  // Configuración de video
  video: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    frameRate: number;
    resolution: {
      width: number;
      height: number;
    };
    codec: 'vp8' | 'vp9' | 'h264';
  };

  // Configuración de audio
  audio: {
    quality: 'low' | 'medium' | 'high';
    sampleRate: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };

  // Configuración de conexión
  connection: {
    iceServers: Array<{
      urls: string;
      username?: string;
      credential?: string;
    }>;
    iceCandidatePoolSize: number;
    connectionTimeout: number;
    maxReconnectAttempts: number;
  };

  // Configuración de IA
  ai: {
    enabled: boolean;
    providers: Array<'openai' | 'anthropic' | 'local'>;
    features: {
      symptomAnalysis: boolean;
      moodDetection: boolean;
      transcription: boolean;
      suggestions: boolean;
    };
    apiKeys: {
      openai?: string;
      anthropic?: string;
    };
  };

  // Configuración de seguridad
  security: {
    encryption: 'aes-256-gcm' | 'chacha20-poly1305';
    keyExchange: 'diffie-hellman' | 'rsa';
    certificateValidation: boolean;
    auditLogging: boolean;
    dataRetention: number; // días
  };

  // Configuración de UI/UX
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
    accessibility: {
      highContrast: boolean;
      largeText: boolean;
      screenReader: boolean;
    };
    language: 'es' | 'en' | 'auto';
  };

  // Configuración de monitoreo
  monitoring: {
    vitals: {
      enabled: boolean;
      updateInterval: number; // segundos
      alerts: {
        enabled: boolean;
        thresholds: {
          heartRate: { min: number; max: number };
          bloodPressure: { systolic: { min: number; max: number }; diastolic: { min: number; max: number } };
          temperature: { min: number; max: number };
          oxygenSaturation: { min: number; max: number };
        };
      };
    };
    connection: {
      qualityMonitoring: boolean;
      autoOptimization: boolean;
      fallbackStrategies: boolean;
    };
  };

  // Configuración de grabación
  recording: {
    enabled: boolean;
    format: 'webm' | 'mp4' | 'mkv';
    quality: 'low' | 'medium' | 'high';
    maxDuration: number; // minutos
    storage: {
      local: boolean;
      cloud: boolean;
      encryption: boolean;
    };
  };

  // Configuración de chat
  chat: {
    enabled: boolean;
    features: {
      fileSharing: boolean;
      emojiSupport: boolean;
      messageSearch: boolean;
      messageHistory: number; // mensajes
    };
    moderation: {
      enabled: boolean;
      profanityFilter: boolean;
      spamDetection: boolean;
    };
  };

  // Configuración de notificaciones
  notifications: {
    enabled: boolean;
    types: {
      connection: boolean;
      vitals: boolean;
      chat: boolean;
      recording: boolean;
    };
    channels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

// Configuración por defecto
export const defaultTelemedicineConfig: TelemedicineConfig = {
  video: {
    quality: 'high',
    frameRate: 30,
    resolution: {
      width: 1920,
      height: 1080
    },
    codec: 'vp9'
  },

  audio: {
    quality: 'high',
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },

  connection: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    connectionTimeout: 30000,
    maxReconnectAttempts: 5
  },

  ai: {
    enabled: true,
    providers: ['openai'],
    features: {
      symptomAnalysis: true,
      moodDetection: true,
      transcription: true,
      suggestions: true
    },
    apiKeys: {}
  },

  security: {
    encryption: 'aes-256-gcm',
    keyExchange: 'diffie-hellman',
    certificateValidation: true,
    auditLogging: true,
    dataRetention: 7
  },

  ui: {
    theme: 'auto',
    animations: true,
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: true
    },
    language: 'es'
  },

  monitoring: {
    vitals: {
      enabled: true,
      updateInterval: 30,
      alerts: {
        enabled: true,
        thresholds: {
          heartRate: { min: 60, max: 100 },
          bloodPressure: { 
            systolic: { min: 90, max: 140 }, 
            diastolic: { min: 60, max: 90 } 
          },
          temperature: { min: 36.0, max: 37.5 },
          oxygenSaturation: { min: 95, max: 100 }
        }
      }
    },
    connection: {
      qualityMonitoring: true,
      autoOptimization: true,
      fallbackStrategies: true
    }
  },

  recording: {
    enabled: true,
    format: 'webm',
    quality: 'high',
    maxDuration: 120,
    storage: {
      local: true,
      cloud: false,
      encryption: true
    }
  },

  chat: {
    enabled: true,
    features: {
      fileSharing: true,
      emojiSupport: true,
      messageSearch: true,
      messageHistory: 100
    },
    moderation: {
      enabled: true,
      profanityFilter: true,
      spamDetection: true
    }
  },

  notifications: {
    enabled: true,
    types: {
      connection: true,
      vitals: true,
      chat: true,
      recording: true
    },
    channels: {
      inApp: true,
      email: false,
      sms: false,
      push: false
    }
  }
};

// Configuración para desarrollo
export const developmentConfig: Partial<TelemedicineConfig> = {
  video: {
    quality: 'medium',
    frameRate: 24,
    resolution: {
      width: 1280,
      height: 720
    },
    codec: 'vp8'
  },
  ai: {
    enabled: false,
    providers: ['local'],
    features: {
      symptomAnalysis: false,
      moodDetection: false,
      transcription: false,
      suggestions: false
    },
    apiKeys: {}
  },
  recording: {
    enabled: false,
    format: 'webm',
    quality: 'medium',
    maxDuration: 60,
    storage: {
      local: true,
      cloud: false,
      encryption: true
    }
  },
  security: {
    encryption: 'aes-256-gcm',
    keyExchange: 'diffie-hellman',
    certificateValidation: false,
    auditLogging: false,
    dataRetention: 3
  },
  connection: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 5,
    connectionTimeout: 20000,
    maxReconnectAttempts: 3
  }
};

// Configuración para producción
export const productionConfig: Partial<TelemedicineConfig> = {
  video: {
    quality: 'high',
    frameRate: 30,
    resolution: {
      width: 1920,
      height: 1080
    },
    codec: (process.env.TELEMEDICINE_VIDEO_CODEC as 'h264'|'vp9'|'vp8') || 'h264'
  },
  connection: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { 
        urls: process.env.TURN_SERVER_URL || '',
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD
      }
    ],
    iceCandidatePoolSize: Number(process.env.TELEMEDICINE_ICE_POOL || 10),
    connectionTimeout: Number(process.env.TELEMEDICINE_CONN_TIMEOUT || 30000),
    maxReconnectAttempts: Number(process.env.TELEMEDICINE_MAX_RECONNECT || 5)
  },
  ai: {
    enabled: true,
    providers: (process.env.TELEMEDICINE_AI_PROVIDERS?.split(',').filter(Boolean) as Array<'openai'|'anthropic'|'local'>) || ['openai'],
    features: {
      symptomAnalysis: true,
      moodDetection: true,
      transcription: true,
      suggestions: true
    },
    apiKeys: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    }
  },
  recording: {
    enabled: true,
    format: (process.env.TELEMEDICINE_RECORDING_FORMAT as 'webm'|'mp4'|'mkv') || 'webm',
    quality: 'high',
    maxDuration: Number(process.env.TELEMEDICINE_RECORDING_MAX || 120),
    storage: {
      local: true,
      cloud: !!process.env.ENABLE_CLOUD_RECORDING,
      encryption: true
    }
  },
  security: {
    encryption: 'aes-256-gcm',
    keyExchange: 'diffie-hellman',
    certificateValidation: true,
    auditLogging: true,
    dataRetention: Number(process.env.TELEMEDICINE_DATA_RETENTION_DAYS || 30)
  }
};

// Función para obtener configuración según el entorno
export function getTelemedicineConfig(): TelemedicineConfig {
  const env = process.env.NODE_ENV;
  
  if (env === 'development') {
    return { ...defaultTelemedicineConfig, ...developmentConfig };
  }
  
  if (env === 'production') {
    return { ...defaultTelemedicineConfig, ...productionConfig };
  }
  
  return defaultTelemedicineConfig;
}

// Función para validar configuración
export function validateTelemedicineConfig(config: TelemedicineConfig): string[] {
  const errors: string[] = [];

  // Validar configuración de video
  if (config.video.frameRate < 1 || config.video.frameRate > 60) {
    errors.push('Frame rate debe estar entre 1 y 60');
  }

  if (config.video.resolution.width < 320 || config.video.resolution.height < 240) {
    errors.push('Resolución mínima debe ser 320x240');
  }

  // Validar configuración de audio
  if (config.audio.sampleRate < 8000 || config.audio.sampleRate > 48000) {
    errors.push('Sample rate debe estar entre 8000 y 48000');
  }

  // Validar configuración de conexión
  if (config.connection.iceServers.length === 0) {
    errors.push('Debe configurar al menos un servidor ICE');
  }

  // Validar configuración de IA
  if (config.ai.enabled && config.ai.providers.length === 0) {
    errors.push('Debe configurar al menos un proveedor de IA');
  }

  // Validar configuración de monitoreo
  if (config.monitoring.vitals.updateInterval < 5) {
    errors.push('Intervalo de actualización de vitales debe ser al menos 5 segundos');
  }

  return errors;
}

// Función para aplicar configuración
export function applyTelemedicineConfig(config: TelemedicineConfig): void {
  // Aplicar configuración de tema
  if (config.ui.theme === 'dark' || 
      (config.ui.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Aplicar configuración de accesibilidad
  if (config.ui.accessibility.highContrast) {
    document.documentElement.classList.add('high-contrast');
  }

  if (config.ui.accessibility.largeText) {
    document.documentElement.classList.add('large-text');
  }

  // Aplicar configuración de animaciones
  if (!config.ui.animations) {
    document.documentElement.classList.add('no-animations');
  }

  // Configurar idioma
  if (config.ui.language !== 'auto') {
    document.documentElement.lang = config.ui.language;
  }
}

// Tipos de utilidad
export type VideoQuality = TelemedicineConfig['video']['quality'];
export type AudioQuality = TelemedicineConfig['audio']['quality'];
export type RecordingFormat = TelemedicineConfig['recording']['format'];
export type UITheme = TelemedicineConfig['ui']['theme'];
export type Language = TelemedicineConfig['ui']['language'];

// Constantes
export const TELEMEDICINE_CONSTANTS = {
  MAX_SESSION_DURATION: 7200, // 2 horas en segundos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_TIMEOUT: 1000,
  RECONNECTION_DELAY: 1000,
  QUALITY_CHECK_INTERVAL: 5000,
  VITALS_UPDATE_INTERVAL: 30000,
  CHAT_HISTORY_LIMIT: 100,
  RECORDING_MAX_DURATION: 7200, // 2 horas en segundos
} as const;

// Eventos personalizados
export const TELEMEDICINE_EVENTS = {
  CONNECTION_QUALITY_CHANGED: 'telemedicine:connection-quality-changed',
  VITALS_UPDATED: 'telemedicine:vitals-updated',
  AI_SUGGESTION_RECEIVED: 'telemedicine:ai-suggestion-received',
  MOOD_DETECTED: 'telemedicine:mood-detected',
  RECORDING_STARTED: 'telemedicine:recording-started',
  RECORDING_STOPPED: 'telemedicine:recording-stopped',
  CHAT_MESSAGE_SENT: 'telemedicine:chat-message-sent',
  CHAT_MESSAGE_RECEIVED: 'telemedicine:chat-message-received',
  SESSION_ENDED: 'telemedicine:session-ended',
  ERROR_OCCURRED: 'telemedicine:error-occurred',
} as const;