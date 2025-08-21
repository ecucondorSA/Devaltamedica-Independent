// 🚀 MIGRATED: Hook migrado para usar @altamedica/api-client
// Mantiene funcionalidad especializada de patients app

import { 
  usePatients as usePatientsBase,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions,
  usePatientDocuments,
  useUploadPatientDocument
} from '@altamedica/api-client/hooks';

import { useState, useCallback, useEffect } from 'react';
import type { Patient } from '@altamedica/types';

// 📝 TIPOS ESPECIALIZADOS (mantenidos para compatibilidad)
export interface UsePatientState {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  lastSync: string | null;
}

export interface UsePatientActions {
  searchPatients: (filters?: any) => Promise<void>;
  getPatientById: (id: string) => Promise<Patient | null>;
  createPatient: (data: Partial<Patient>) => Promise<Patient | null>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient | null>;
  deletePatient: (id: string) => Promise<boolean>;
  refreshPatients: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

export interface UsePatientOptions {
  doctorId?: string;
  initialFetch?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  defaultLimit?: number;
}

// 🎯 HOOK ESPECIALIZADO PARA PATIENTS APP
export function usePatients(options: UsePatientOptions = {}) {
  const {
    doctorId,
    initialFetch = true,
    autoSync = false,
    syncInterval = 300000, // 5 minutos por defecto
    defaultLimit = 10
  } = options;

  // Usar hooks centralizados
  const baseQuery = usePatientsBase({
    doctorId,
    limit: defaultLimit
  });

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();
  const getPatientQuery = usePatient;

  // Estado local adicional
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Acciones wrapper
  const searchPatients = useCallback(async (filters?: any) => {
    await baseQuery.refetch();
    setLastSync(new Date().toISOString());
  }, [baseQuery]);

  const getPatientById = useCallback(async (id: string) => {
    const result = await getPatientQuery(id);
    if (result.data) {
      setCurrentPatient(result.data);
      return result.data;
    }
    return null;
  }, []);

  const createPatient = useCallback(async (data: Partial<Patient>) => {
    const result = await createMutation.mutateAsync(data);
    if (result) {
      await baseQuery.refetch();
      return result;
    }
    return null;
  }, [createMutation, baseQuery]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    const result = await updateMutation.mutateAsync({ id, data });
    if (result) {
      await baseQuery.refetch();
      if (currentPatient?.id === id) {
        setCurrentPatient(result);
      }
      return result;
    }
    return null;
  }, [updateMutation, baseQuery, currentPatient]);

  const deletePatient = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      await baseQuery.refetch();
      if (currentPatient?.id === id) {
        setCurrentPatient(null);
      }
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation, baseQuery, currentPatient]);

  const refreshPatients = useCallback(async () => {
    await baseQuery.refetch();
    setLastSync(new Date().toISOString());
  }, [baseQuery]);

  const clearError = useCallback(() => {
    // Los hooks de TanStack Query manejan errores internamente
  }, []);

  const resetState = useCallback(() => {
    setCurrentPatient(null);
    setLastSync(null);
  }, []);

  // Auto-sync si está habilitado
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      refreshPatients();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, refreshPatients]);

  // Fetch inicial
  useEffect(() => {
    if (initialFetch) {
      refreshPatients();
    }
  }, [initialFetch]);

  // Mapear datos al formato esperado
  const state: UsePatientState = {
    patients: baseQuery.data?.patients || [],
    currentPatient,
    loading: baseQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: baseQuery.error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || null,
    pagination: baseQuery.data ? {
      page: baseQuery.data.page || 1,
      limit: baseQuery.data.limit || defaultLimit,
      total: baseQuery.data.total || 0,
      totalPages: baseQuery.data.totalPages || 1,
      hasNextPage: baseQuery.data.hasNextPage || false,
      hasPrevPage: baseQuery.data.hasPrevPage || false
    } : null,
    lastSync
  };

  const actions: UsePatientActions = {
    searchPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    refreshPatients,
    clearError,
    resetState
  };

  return {
    ...state,
    ...actions
  };
}

// Re-exportar hooks adicionales para conveniencia
export {
  usePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions,
  usePatientDocuments,
  useUploadPatientDocument
} from '@altamedica/api-client/hooks';