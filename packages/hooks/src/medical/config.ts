/**
 * @fileoverview Configuración para hooks médicos
 * @module @altamedica/hooks/medical/config
 * @description Configuraciones de caché, endpoints y constantes médicas
 */

import type { MedicalCacheConfig } from './types';

// ==========================================
// CONFIGURACIÓN DE CACHÉ MÉDICO
// ==========================================

/**
 * Configuración de caché optimizada para datos médicos
 * Balanceando freshness con performance según criticidad de los datos
 */
export const MEDICAL_CACHE_CONFIG: MedicalCacheConfig = {
  // Configuración por defecto (datos no críticos)
  defaultStaleTime: 5 * 60 * 1000, // 5 minutos
  defaultCacheTime: 15 * 60 * 1000, // 15 minutos

  // Configuraciones específicas por tipo de dato
  specific: {
    // Datos de pacientes - moderadamente críticos
    patients: {
      staleTime: 10 * 60 * 1000, // 10 minutos - pueden cambiar con cierta frecuencia
      cacheTime: 30 * 60 * 1000, // 30 minutos - mantener en memoria más tiempo
    },

    // Citas médicas - críticos para scheduling
    appointments: {
      staleTime: 2 * 60 * 1000, // 2 minutos - críticos para conflictos de horarios
      cacheTime: 10 * 60 * 1000, // 10 minutos - no mantener demasiado tiempo
    },

    // Prescripciones - muy críticos para seguridad
    prescriptions: {
      staleTime: 1 * 60 * 1000, // 1 minuto - muy crítico para seguridad del paciente
      cacheTime: 5 * 60 * 1000, // 5 minutos - minimizar cache por seguridad
    },

    // Historiales médicos - estables pero importantes
    medicalRecords: {
      staleTime: 15 * 60 * 1000, // 15 minutos - relativamente estables
      cacheTime: 60 * 60 * 1000, // 1 hora - pueden mantenerse más tiempo
    },

    // Signos vitales - muy críticos para monitoreo
    vitalSigns: {
      staleTime: 30 * 1000, // 30 segundos - críticos para pacientes en monitoreo
      cacheTime: 2 * 60 * 1000, // 2 minutos - datos de vitales cambian rápidamente
    }
  }
};

// ==========================================
// CONFIGURACIÓN DE ENDPOINTS
// ==========================================

/**
 * Endpoints base para diferentes entornos
 */
export const MEDICAL_ENDPOINTS = {
  development: {
    api: 'http://localhost:3001/api/v1',
    websocket: 'ws://localhost:8888',
    firebase: {
      projectId: 'altamedic-20f69-dev',
      region: 'us-central1'
    }
  },
  staging: {
    api: 'https://api-staging.altamedica.com/api/v1',
    websocket: 'wss://realtime-staging.altamedica.com',
    firebase: {
      projectId: 'altamedic-20f69-staging',
      region: 'us-central1'
    }
  },
  production: {
    api: 'https://api.altamedica.com/api/v1',
    websocket: 'wss://realtime.altamedica.com',
    firebase: {
      projectId: 'altamedic-20f69',
      region: 'us-central1'
    }
  }
} as const;

/**
 * Obtiene la configuración de endpoints para el entorno actual
 */
export function getMedicalEndpoints() {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof MEDICAL_ENDPOINTS;
  return MEDICAL_ENDPOINTS[env] || MEDICAL_ENDPOINTS.development;
}

// ==========================================
// CONFIGURACIÓN DE PAGINACIÓN
// ==========================================

/**
 * Configuración por defecto para paginación
 */
export const PAGINATION_CONFIG = {
  /** Página inicial */
  defaultPage: 1,
  /** Límite por defecto de elementos por página */
  defaultLimit: 20,
  /** Límites permitidos por página */
  allowedLimits: [10, 20, 50, 100] as const,
  /** Límite máximo permitido */
  maxLimit: 100,
  /** Prefetch de páginas adyacentes */
  prefetchAdjacent: true,
  /** Número de páginas a prefetch */
  prefetchCount: 1
} as const;

// ==========================================
// CONFIGURACIÓN DE BÚSQUEDA
// ==========================================

/**
 * Configuración para búsquedas médicas
 */
export const SEARCH_CONFIG = {
  /** Retraso de debounce para búsquedas */
  debounceDelay: 300,
  /** Longitud mínima para activar búsqueda */
  minSearchLength: 2,
  /** Máximo de resultados de búsqueda */
  maxSearchResults: 50,
  /** Cache time para resultados de búsqueda */
  searchCacheTime: 2 * 60 * 1000, // 2 minutos
  /** Stale time para resultados de búsqueda */
  searchStaleTime: 30 * 1000, // 30 segundos
  /** Campos de búsqueda por defecto para pacientes */
  patientSearchFields: ['name', 'email', 'phone', 'medicalRecordNumber'] as const
} as const;

// ==========================================
// CONFIGURACIÓN DE TIEMPO REAL
// ==========================================

/**
 * Configuración para funcionalidades de tiempo real
 */
export const REALTIME_CONFIG = {
  /** Intervalo de reconexión en ms */
  reconnectInterval: 5000,
  /** Máximo de intentos de reconexión */
  maxReconnectAttempts: 10,
  /** Timeout para conexión inicial */
  connectionTimeout: 10000,
  /** Heartbeat interval */
  heartbeatInterval: 30000,
  /** Configuración de eventos */
  events: {
    /** Eventos de pacientes */
    patients: ['created', 'updated', 'deleted', 'status_changed'] as const,
    /** Eventos de citas */
    appointments: ['scheduled', 'confirmed', 'started', 'completed', 'cancelled'] as const,
    /** Eventos de signos vitales */
    vitals: ['recorded', 'alert', 'critical'] as const
  }
} as const;

// ==========================================
// CONFIGURACIÓN DE VALIDACIÓN
// ==========================================

/**
 * Configuración para validación médica
 */
export const VALIDATION_CONFIG = {
  /** Patrones de validación */
  patterns: {
    /** Número de historia clínica */
    medicalRecordNumber: /^MRN-\d{8}$/,
    /** Teléfono (formato internacional) */
    phone: /^\+?[1-9]\d{1,14}$/,
    /** Código postal */
    zipCode: /^\d{5}(-\d{4})?$/
  },
  /** Rangos de valores normales */
  normalRanges: {
    /** Presión arterial sistólica */
    systolicBP: { min: 90, max: 140 },
    /** Presión arterial diastólica */
    diastolicBP: { min: 60, max: 90 },
    /** Frecuencia cardíaca */
    heartRate: { min: 60, max: 100 },
    /** Temperatura corporal (°C) */
    temperature: { min: 36.1, max: 37.2 },
    /** Saturación de oxígeno */
    oxygenSaturation: { min: 95, max: 100 },
    /** Frecuencia respiratoria */
    respiratoryRate: { min: 12, max: 20 }
  },
  /** Configuración de edad */
  age: {
    /** Edad mínima para pacientes */
    minAge: 0,
    /** Edad máxima para pacientes */
    maxAge: 150,
    /** Edad mínima para consentimiento independiente */
    consentAge: 18
  }
} as const;

// ==========================================
// CONFIGURACIÓN DE HIPAA COMPLIANCE
// ==========================================

/**
 * Configuración para cumplimiento HIPAA
 */
export const HIPAA_CONFIG = {
  /** Timeout para datos sensibles en memoria (ms) */
  sensitiveDataTimeout: 30 * 60 * 1000, // 30 minutos
  /** Campos considerados PHI (Protected Health Information) */
  phiFields: [
    'name',
    'email', 
    'phone',
    'dateOfBirth',
    'address',
    'medicalRecordNumber',
    'socialSecurityNumber',
    'insurance'
  ] as const,
  /** Configuración de logging de auditoría */
  auditLog: {
    /** Si debe loggear accesos a datos */
    logAccess: true,
    /** Si debe loggear modificaciones */
    logModifications: true,
    /** Retención de logs de auditoría (días) */
    retentionDays: 2555, // ~7 años según HIPAA
    /** Eventos críticos que siempre se deben loggear */
    criticalEvents: ['data_export', 'bulk_access', 'admin_override'] as const
  },
  /** Configuración de encriptación */
  encryption: {
    /** Algoritmo por defecto */
    algorithm: 'AES-256-GCM',
    /** Longitud mínima de clave */
    minKeyLength: 256,
    /** Rotación de claves (días) */
    keyRotationDays: 90
  }
} as const;

// ==========================================
// CONFIGURACIÓN DE PERFORMANCE
// ==========================================

/**
 * Configuración para optimización de performance
 */
export const PERFORMANCE_CONFIG = {
  /** Configuración de batch requests */
  batch: {
    /** Tamaño máximo de batch */
    maxSize: 50,
    /** Delay para acumular requests */
    delay: 100,
    /** Timeout para batch */
    timeout: 5000
  },
  /** Configuración de lazy loading */
  lazyLoading: {
    /** Distancia para activar lazy loading */
    threshold: '100px',
    /** Número de elementos a cargar por vez */
    pageSize: 20
  },
  /** Configuración de virtual scrolling */
  virtualScrolling: {
    /** Altura estimada de item */
    itemHeight: 60,
    /** Buffer de items fuera de vista */
    overscan: 5
  }
} as const;

// ==========================================
// UTILIDADES DE CONFIGURACIÓN
// ==========================================

/**
 * Obtiene la configuración de caché para un tipo específico
 * @param type - Tipo de dato médico
 * @returns Configuración de caché específica
 */
export function getCacheConfig(
  type: keyof MedicalCacheConfig['specific']
): { staleTime: number; cacheTime: number; } {
  return MEDICAL_CACHE_CONFIG.specific[type] || {
    staleTime: MEDICAL_CACHE_CONFIG.defaultStaleTime,
    cacheTime: MEDICAL_CACHE_CONFIG.defaultCacheTime
  };
}

/**
 * Verifica si un campo es PHI (Protected Health Information)
 * @param fieldName - Nombre del campo
 * @returns true si es PHI
 */
export function isPHIField(fieldName: string): boolean {
  return HIPAA_CONFIG.phiFields.includes(fieldName as any);
}

/**
 * Obtiene la configuración de rango normal para un signo vital
 * @param vitalSign - Tipo de signo vital
 * @returns Rango normal o undefined si no está definido
 */
export function getNormalRange(
  vitalSign: keyof typeof VALIDATION_CONFIG.normalRanges
): { min: number; max: number; } | undefined {
  return VALIDATION_CONFIG.normalRanges[vitalSign];
}

/**
 * Configura React Query con configuraciones médicas optimizadas
 * @returns Configuración para QueryClient
 */
export function getMedicalQueryClientConfig() {
  return {
    defaultOptions: {
      queries: {
        staleTime: MEDICAL_CACHE_CONFIG.defaultStaleTime,
        cacheTime: MEDICAL_CACHE_CONFIG.defaultCacheTime,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount: number, error: any) => {
          // No reintentar en errores de autenticación
          if (error?.status === 401) return false;
          // Reintentar hasta 3 veces para otros errores
          return failureCount < 3;
        }
      },
      mutations: {
        retry: 1, // Solo un reintento para mutaciones médicas críticas
      }
    }
  };
}