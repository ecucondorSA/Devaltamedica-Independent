/**
 * 📋 Hook para Historial Médico del Paciente (DEPRECATED)
 *
 * ⚠️ DEPRECATION NOTICE:
 * Este archivo ha sido consolidado en useMedicalHistoryUnified.ts
 *
 * FUNCIONALIDADES MIGRADAS:
 * - ✅ usePatientHistory → useMedicalHistoryUnified
 * - ✅ useMedicalRecord → useMedicalHistoryUnified
 * - ✅ usePatientHealthStats → useMedicalHistoryUnified
 *
 * NUEVA UBICACIÓN: ./useMedicalHistoryUnified.ts
 */

// Re-export from unified implementation
import {
  useMedicalHistoryUnified,
  useMedicalRecord as useMedicalRecordUnified,
  usePatientHealthStats as usePatientHealthStatsUnified,
} from './useMedicalHistoryUnified';

// Backward compatibility exports
export const usePatientHistory = useMedicalHistoryUnified;
export const useMedicalRecord = useMedicalRecordUnified;
export const usePatientHealthStats = usePatientHealthStatsUnified;

import { apiClient } from '@altamedica/api-client';
import { useAuth } from '@altamedica/auth/client';
import { useQuery } from '@tanstack/react-query';

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  consultationDate: string;
  consultationType: 'presencial' | 'telemedicina' | 'urgencia' | 'seguimiento';
  diagnosis: {
    primary: string;
    icd10Code: string;
    description: string;
  };
  symptoms: string[];
  vitalSigns?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  treatment: {
    medications?: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    procedures?: string[];
    recommendations?: string[];
  };
  followUp?: {
    required: boolean;
    timeframe?: string;
    specialistReferral?: string;
  };
  attachments?: Array<{
    id: string;
    type: 'image' | 'document' | 'lab_result';
    name: string;
    url: string;
    uploadDate: string;
  }>;
  notes?: string;
  status: 'completed' | 'pending_review' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface UsePatientHistoryReturn {
  records: MedicalRecord[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

interface UsePatientHistoryOptions {
  patientId?: string;
  limit?: number;
  consultationType?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export function usePatientHistory(options: UsePatientHistoryOptions = {}): UsePatientHistoryReturn {
  const { user } = useAuth();
  const { patientId = user?.id, limit = 10, consultationType, dateRange } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useQuery({
    queryKey: ['patient-history', patientId, { limit, consultationType, dateRange }],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.token || !patientId) {
        throw new Error('Usuario no autenticado o ID de paciente no disponible');
      }

      const params: Record<string, any> = {
        patientId,
        limit,
        offset: pageParam,
        orderBy: 'consultationDate',
        order: 'desc',
      };

      if (consultationType) {
        params.consultationType = consultationType;
      }

      if (dateRange) {
        params.dateFrom = dateRange.from;
        params.dateTo = dateRange.to;
      }

      const response = await apiClient.get('/api/v1/medical-records', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        params,
      });

      return {
        records: response.data.items || [],
        hasNextPage: response.data.hasNextPage || false,
        totalCount: response.data.totalCount || 0,
      };
    },
    enabled: !!user?.token && !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    retry: 2,
  });

  // Aplanar todos los registros de todas las páginas
  const records = data?.pages?.flatMap((page) => page.records) || [];

  return {
    records,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    hasNextPage: data?.pages?.[data.pages.length - 1]?.hasNextPage ?? false,
    fetchNextPage,
    isFetchingNextPage,
  };
}

// Hook específico para obtener un registro médico individual
export function useMedicalRecord(recordId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['medical-record', recordId],
    queryFn: async () => {
      if (!user?.token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await apiClient.get(`/api/v1/medical-records/${recordId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      return response.data;
    },
    enabled: !!user?.token && !!recordId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// Hook para estadísticas del historial médico
export function usePatientHealthStats(patientId?: string) {
  const { user } = useAuth();
  const targetPatientId = patientId || user?.id;

  return useQuery({
    queryKey: ['patient-health-stats', targetPatientId],
    queryFn: async () => {
      if (!user?.token || !targetPatientId) {
        throw new Error('Usuario no autenticado o ID de paciente no disponible');
      }

      const response = await apiClient.get(`/api/v1/patients/${targetPatientId}/health-stats`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      return response.data;
    },
    enabled: !!user?.token && !!targetPatientId,
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });
}
