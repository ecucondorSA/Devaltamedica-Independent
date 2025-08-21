/**
 * Configuración de APIs para la aplicación de pacientes
 * Centraliza las URLs de los endpoints del servidor API
 */

// URLs base de los servicios
export const API_CONFIG = {
  // Servidor API central
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Endpoints de pacientes
  PATIENTS: {
    BASE: '/api/v1/patients',
    BY_ID: (id: string) => `/api/v1/patients/${id}`,
    SIMPLE: '/api/v1/patients/simple',
    PROFILE: (id: string) => `/api/v1/patients/${id}/profile`,
    RECORDS: (id: string) => `/api/v1/patients/${id}/records`,
    APPOINTMENTS: (id: string) => `/api/v1/patients/${id}/appointments`,
    STATS: '/api/v1/patients/stats',
  },
  
  // Endpoints de citas
  APPOINTMENTS: {
    BASE: '/api/v1/appointments',
    BY_ID: (id: string) => `/api/v1/appointments/${id}`,
    CANCEL: (id: string) => `/api/v1/appointments/${id}/cancel`,
    VIDEO_SESSION: (id: string) => `/api/v1/appointments/${id}/video-session`,
    STATS: '/api/v1/appointments/stats',
  },
  
  // Endpoints de doctores
  DOCTORS: {
    BASE: '/api/v1/doctors',
    BY_ID: (id: string) => `/api/v1/doctors/${id}`,
    AVAILABILITY: (id: string) => `/api/v1/doctors/${id}/availability`,
    SCHEDULE: (id: string) => `/api/v1/doctors/${id}/schedule`,
    SEARCH: '/api/v1/doctors/search',
    SEARCH_BY_LOCATION: '/api/v1/doctors/search/location',
  },
  
  // Endpoints de telemedicina
  TELEMEDICINE: {
    SESSIONS: '/api/v1/telemedicine/sessions',
    SESSION_BY_ID: (id: string) => `/api/v1/telemedicine/sessions/${id}`,
    WEBRTC_ROOMS: (roomId: string) => `/api/v1/telemedicine/webrtc/rooms/${roomId}`,
    WEBRTC_SIGNALING: '/api/v1/telemedicine/webrtc/signaling',
  },
  
  // Endpoints de notificaciones
  NOTIFICATIONS: {
    BASE: '/api/v1/notifications',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
  },
  
  // Endpoints de historial médico
  MEDICAL_RECORDS: {
    BASE: '/api/v1/medical-records',
    BY_ID: (id: string) => `/api/v1/medical-records/${id}`,
    BY_PATIENT: (patientId: string) => `/api/v1/medical-records?patientId=${patientId}`,
    SEARCH: '/api/v1/medical-records/search',
    ATTACHMENTS: (recordId: string) => `/api/v1/medical-records/${recordId}/attachments`,
  },
  
  // Endpoints de prescripciones
  PRESCRIPTIONS: {
    BASE: '/api/v1/prescriptions',
    BY_ID: (id: string) => `/api/v1/prescriptions/${id}`,
    BY_PATIENT: (patientId: string) => `/api/v1/prescriptions?patientId=${patientId}`,
    ACTIVE: (patientId: string) => `/api/v1/prescriptions?patientId=${patientId}&status=active`,
    REFILL: (id: string) => `/api/v1/prescriptions/${id}/refill`,
  },
  
  // Endpoints de signos vitales
  VITAL_SIGNS: {
    BY_PATIENT: (patientId: string) => `/api/v1/patients/${patientId}/vital-signs`,
  },
  
  // Endpoints de alergias
  ALLERGIES: {
    BY_PATIENT: (patientId: string) => `/api/v1/patients/${patientId}/allergies`,
  },
  
  // Endpoints de medicamentos actuales
  CURRENT_MEDICATIONS: {
    BY_PATIENT: (patientId: string) => `/api/v1/patients/${patientId}/current-medications`,
  },
  
  // Endpoints de resumen médico
  MEDICAL_SUMMARY: {
    BY_PATIENT: (patientId: string) => `/api/v1/patients/${patientId}/medical-summary`,
  },
  
  // Endpoints de salud del sistema
  HEALTH: '/api/health',
  METRICS: '/api/metrics',
} as const;

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Configuración de headers por defecto
export const getDefaultHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Configuración de timeout para peticiones
export const API_TIMEOUT = 30000; // 30 segundos

// Configuración de reintentos
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  backoffMultiplier: 2,
}; 