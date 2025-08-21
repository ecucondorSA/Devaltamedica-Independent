/**
 * @fileoverview Query keys para React Query en hooks médicos
 * @module @altamedica/hooks/medical/queryKeys
 * @description Claves estructuradas para caché de React Query
 */

import type { MedicalQueryKey, PatientsSearchParams } from './types';

// ==========================================
// CONSTANTES DE QUERY KEYS
// ==========================================

/**
 * Query keys estructuradas para datos médicos
 * Siguiendo las mejores prácticas de React Query para invalidación eficiente
 */
export const MEDICAL_QUERY_KEYS = {
  // Pacientes
  patients: {
    /** Clave raíz para todos los datos de pacientes */
    all: ['patients'] as const,
    /** Lista paginada de pacientes */
    lists: () => [...MEDICAL_QUERY_KEYS.patients.all, 'list'] as const,
    /** Lista específica con parámetros */
    list: (params: PatientsSearchParams) => 
      [...MEDICAL_QUERY_KEYS.patients.lists(), params] as const,
    /** Detalles específicos */
    details: () => [...MEDICAL_QUERY_KEYS.patients.all, 'detail'] as const,
    /** Detalle de paciente específico */
    detail: (id: string) => 
      [...MEDICAL_QUERY_KEYS.patients.details(), id] as const,
    /** Perfiles completos */
    profiles: () => [...MEDICAL_QUERY_KEYS.patients.all, 'profile'] as const,
    /** Perfil específico */
    profile: (id: string) => 
      [...MEDICAL_QUERY_KEYS.patients.profiles(), id] as const,
    /** Búsquedas */
    searches: () => [...MEDICAL_QUERY_KEYS.patients.all, 'search'] as const,
    /** Búsqueda específica */
    search: (query: string) => 
      [...MEDICAL_QUERY_KEYS.patients.searches(), query] as const,
    /** Estadísticas */
    stats: () => [...MEDICAL_QUERY_KEYS.patients.all, 'stats'] as const
  },

  // Citas médicas
  appointments: {
    /** Clave raíz para citas */
    all: ['appointments'] as const,
    /** Listas de citas */
    lists: () => [...MEDICAL_QUERY_KEYS.appointments.all, 'list'] as const,
    /** Citas de un paciente específico */
    patient: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.appointments.all, 'patient', patientId] as const,
    /** Citas de un doctor específico */
    doctor: (doctorId: string) => 
      [...MEDICAL_QUERY_KEYS.appointments.all, 'doctor', doctorId] as const,
    /** Detalle de cita específica */
    detail: (id: string) => 
      [...MEDICAL_QUERY_KEYS.appointments.all, 'detail', id] as const,
    /** Calendario/schedule */
    schedule: (date?: string) => 
      [...MEDICAL_QUERY_KEYS.appointments.all, 'schedule', date || 'today'] as const
  },

  // Prescripciones
  prescriptions: {
    /** Clave raíz para prescripciones */
    all: ['prescriptions'] as const,
    /** Prescripciones de un paciente */
    patient: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.prescriptions.all, 'patient', patientId] as const,
    /** Prescripciones de un doctor */
    doctor: (doctorId: string) => 
      [...MEDICAL_QUERY_KEYS.prescriptions.all, 'doctor', doctorId] as const,
    /** Prescripciones activas */
    active: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.prescriptions.patient(patientId), 'active'] as const,
    /** Detalle de prescripción */
    detail: (id: string) => 
      [...MEDICAL_QUERY_KEYS.prescriptions.all, 'detail', id] as const
  },

  // Historial médico
  medicalRecords: {
    /** Clave raíz para historiales */
    all: ['medical-records'] as const,
    /** Historiales de un paciente */
    patient: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.medicalRecords.all, 'patient', patientId] as const,
    /** Historiales por tipo */
    type: (patientId: string, type: string) => 
      [...MEDICAL_QUERY_KEYS.medicalRecords.patient(patientId), 'type', type] as const,
    /** Detalle de historial */
    detail: (id: string) => 
      [...MEDICAL_QUERY_KEYS.medicalRecords.all, 'detail', id] as const
  },

  // Signos vitales
  vitalSigns: {
    /** Clave raíz para signos vitales */
    all: ['vital-signs'] as const,
    /** Signos vitales de un paciente */
    patient: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.vitalSigns.all, 'patient', patientId] as const,
    /** Últimos signos vitales */
    latest: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.vitalSigns.patient(patientId), 'latest'] as const,
    /** Rango de fechas */
    range: (patientId: string, startDate: string, endDate: string) => 
      [...MEDICAL_QUERY_KEYS.vitalSigns.patient(patientId), 'range', startDate, endDate] as const,
    /** Monitoring en tiempo real */
    realtime: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.vitalSigns.patient(patientId), 'realtime'] as const
  },

  // Telemedicina
  telemedicine: {
    /** Clave raíz para telemedicina */
    all: ['telemedicine'] as const,
    /** Sesiones activas */
    sessions: () => [...MEDICAL_QUERY_KEYS.telemedicine.all, 'sessions'] as const,
    /** Sesión específica */
    session: (sessionId: string) => 
      [...MEDICAL_QUERY_KEYS.telemedicine.sessions(), sessionId] as const,
    /** Disponibilidad de doctores */
    availability: (doctorId?: string) => 
      [...MEDICAL_QUERY_KEYS.telemedicine.all, 'availability', doctorId || 'all'] as const
  },

  // IA Médica
  medicalAI: {
    /** Clave raíz para IA médica */
    all: ['medical-ai'] as const,
    /** Análisis de síntomas */
    symptoms: (symptoms: string[]) => 
      [...MEDICAL_QUERY_KEYS.medicalAI.all, 'symptoms', symptoms.join(',') ] as const,
    /** Asistente diagnóstico */
    diagnosis: (patientId: string, symptoms: string[]) => 
      [...MEDICAL_QUERY_KEYS.medicalAI.all, 'diagnosis', patientId, symptoms.join(',')] as const,
    /** Recomendaciones */
    recommendations: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.medicalAI.all, 'recommendations', patientId] as const
  },

  // Lab Results
  labResults: {
    /** Clave raíz para resultados de laboratorio */
    all: ['lab-results'] as const,
    /** Detalles específicos */
    details: () => [...MEDICAL_QUERY_KEYS.labResults.all, 'detail'] as const,
    /** Detalle de resultado específico */
    detail: (resultId: string) => 
      [...MEDICAL_QUERY_KEYS.labResults.details(), resultId] as const,
    /** Resultados por paciente */
    patient: (patientId: string) => 
      [...MEDICAL_QUERY_KEYS.labResults.all, 'patient', patientId] as const
  }
} as const;

// ==========================================
// UTILIDADES PARA QUERY KEYS
// ==========================================

/**
 * Crea una query key médica tipada
 * @param type - Tipo de query
 * @param params - Parámetros adicionales
 * @returns Query key tipada
 * 
 * @example
 * ```typescript
 * const patientsKey = createMedicalQueryKey('patients', 'list', searchParams);
 * const patientKey = createMedicalQueryKey('patients', 'detail', patientId);
 * ```
 */
export function createMedicalQueryKey(
  type: 'patients' | 'appointments' | 'prescriptions' | 'medical-records' | 'vital-signs',
  subtype?: string,
  ...params: any[]
): MedicalQueryKey {
  const baseKey = [type] as any[];
  
  if (subtype) {
    baseKey.push(subtype);
  }
  
  if (params.length > 0) {
    baseKey.push(...params);
  }
  
  return baseKey as MedicalQueryKey;
}

/**
 * Obtiene todas las query keys relacionadas con un paciente
 * Útil para invalidar todo el caché de un paciente específico
 * @param patientId - ID del paciente
 * @returns Array de query keys relacionadas
 */
export function getPatientRelatedQueryKeys(patientId: string): MedicalQueryKey[] {
  // Mapear cada tupla readonly a un tipo MedicalQueryKey mutable esperado
  return [
    MEDICAL_QUERY_KEYS.patients.detail(patientId),
    MEDICAL_QUERY_KEYS.patients.profile(patientId),
    MEDICAL_QUERY_KEYS.appointments.patient(patientId),
    MEDICAL_QUERY_KEYS.prescriptions.patient(patientId),
    MEDICAL_QUERY_KEYS.medicalRecords.patient(patientId),
    MEDICAL_QUERY_KEYS.vitalSigns.patient(patientId)
  ].map((k) => [...k] as unknown as MedicalQueryKey);
}

/**
 * Obtiene query keys por categoría para invalidación masiva
 * @param category - Categoría a invalidar
 * @returns Query key base para la categoría
 */
export function getCategoryQueryKey(
  category: 'patients' | 'appointments' | 'prescriptions' | 'records' | 'vitals' | 'telemedicine' | 'ai'
): readonly string[] {
  switch (category) {
    case 'patients':
      return MEDICAL_QUERY_KEYS.patients.all;
    case 'appointments':
      return MEDICAL_QUERY_KEYS.appointments.all;
    case 'prescriptions':
      return MEDICAL_QUERY_KEYS.prescriptions.all;
    case 'records':
      return MEDICAL_QUERY_KEYS.medicalRecords.all;
    case 'vitals':
      return MEDICAL_QUERY_KEYS.vitalSigns.all;
    case 'telemedicine':
      return MEDICAL_QUERY_KEYS.telemedicine.all;
    case 'ai':
      return MEDICAL_QUERY_KEYS.medicalAI.all;
    default:
      return [];
  }
}

/**
 * Valida que una query key siga el patrón correcto
 * @param queryKey - Query key a validar
 * @returns true si es válida
 */
export function isValidMedicalQueryKey(queryKey: readonly any[]): queryKey is MedicalQueryKey {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }

  const validRoots = [
    'patients',
    'appointments', 
    'prescriptions',
    'medical-records',
    'vital-signs',
    'telemedicine',
    'medical-ai'
  ];

  return validRoots.includes(queryKey[0]);
}

/**
 * Obtiene el contexto de una query key (para debugging)
 * @param queryKey - Query key a analizar
 * @returns Información legible sobre la query key
 */
export function getQueryKeyContext(queryKey: MedicalQueryKey): string {
  const [root, subtype, ...params] = queryKey;
  
  let context = `${root}`;
  
  if (subtype) {
    context += ` > ${subtype}`;
  }
  
  if (params.length > 0) {
    context += ` (${params.join(', ')})`;
  }
  
  return context;
}