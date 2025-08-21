/**
 * @fileoverview Hook unificado para datos completos del paciente
 * @module @altamedica/hooks/medical
 * @description Hook que consolida todos los datos del paciente desde múltiples endpoints
 */

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import type { 
  Patient, 
  VitalSigns, 
  Medication, 
  Appointment, 
  LabResult, 
  MedicalHistory 
} from '@altamedica/types';
import { MEDICAL_QUERY_KEYS } from './queryKeys';

// Simple API client wrapper
const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE_URL}/api/v1${url}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }
};

export interface PatientDataResult {
  patient: Patient | null;
  vitalSigns: VitalSigns[];
  medications: Medication[];
  appointments: Appointment[];
  labResults: LabResult[];
  medicalHistory: MedicalHistory | null;
  isLoading: boolean;
  isError: boolean;
  errors: Record<string, Error | null>;
}

export interface UsePatientDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  includeHistory?: boolean;
}

/**
 * Hook unificado para obtener todos los datos del paciente
 * Conecta con múltiples endpoints reales del API
 */
export function usePatientData(
  patientId: string | undefined,
  options: UsePatientDataOptions = {}
): PatientDataResult {
  const {
    enabled = true,
    refetchInterval = 30000, // 30 segundos por defecto
    staleTime = 60000, // 1 minuto
    includeHistory = true
  } = options;

  // Queries paralelas para optimizar carga
  const queries = useQueries({
    queries: [
      // Información básica del paciente
      {
        queryKey: MEDICAL_QUERY_KEYS.patients.detail(patientId!),
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}`).then((res: any) => res.data),
        enabled: enabled && !!patientId,
        staleTime,
        refetchInterval
      },
      // Signos vitales
      {
        queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(patientId!), 'vitals'],
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}/vitals`).then((res: any) => res.data),
        enabled: enabled && !!patientId,
        staleTime,
        refetchInterval
      },
      // Medicamentos actuales
      {
        queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(patientId!), 'medications'],
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}/medications`).then((res: any) => res.data),
        enabled: enabled && !!patientId,
        staleTime,
        refetchInterval: refetchInterval * 2 // Menos frecuente
      },
      // Citas próximas y pasadas
      {
        queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(patientId!), 'appointments'],
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}/appointments`).then((res: any) => res.data),
        enabled: enabled && !!patientId,
        staleTime,
        refetchInterval
      },
      // Resultados de laboratorio
      {
        queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(patientId!), 'lab-results'],
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}/lab-results`).then((res: any) => res.data),
        enabled: enabled && !!patientId,
        staleTime: staleTime * 2, // Más tiempo en caché
        refetchInterval: refetchInterval * 3 // Menos frecuente
      },
      // Historia médica completa
      {
        queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(patientId!), 'medical-history'],
        queryFn: () => getApiClient().get(`/api/v1/patients/${patientId}/medical-history`).then((res: any) => res.data),
        enabled: enabled && !!patientId && includeHistory,
        staleTime: staleTime * 5, // Mucho más tiempo en caché
        refetchInterval: false // No refetch automático
      }
    ]
  });

  // Extraer resultados
  const [
    patientQuery,
    vitalSignsQuery,
    medicationsQuery,
    appointmentsQuery,
    labResultsQuery,
    medicalHistoryQuery
  ] = queries;

  // Determinar estado general de carga
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);

  // Recopilar errores individuales
  const errors = {
    patient: patientQuery.error as Error | null,
    vitalSigns: vitalSignsQuery.error as Error | null,
    medications: medicationsQuery.error as Error | null,
    appointments: appointmentsQuery.error as Error | null,
    labResults: labResultsQuery.error as Error | null,
    medicalHistory: medicalHistoryQuery?.error as Error | null
  };

  return {
    patient: patientQuery.data || null,
    vitalSigns: vitalSignsQuery.data || [],
    medications: medicationsQuery.data || [],
    appointments: appointmentsQuery.data || [],
    labResults: labResultsQuery.data || [],
    medicalHistory: medicalHistoryQuery?.data || null,
    isLoading,
    isError,
    errors
  };
}

/**
 * Hook para actualizar datos del paciente con optimistic updates
 */
export function useUpdatePatientData() {
  // TODO: Implementar mutaciones con optimistic updates
  return null;
}

/**
 * Hook para monitoreo en tiempo real de vitales
 */
export function usePatientVitalsRealTime(patientId: string) {
  // TODO: Conectar con WebSocket para actualizaciones en tiempo real
  return null;
}