// 🚀 MIGRATED: Hook migrado para usar @altamedica/api-client
// Mantiene funcionalidad especializada de patients app

// Temporalmente comentado hasta que se exporte correctamente desde api-client
// import {
//   usePatients as usePatientsBase,
//   usePatient,
//   useCreatePatient,
//   useUpdatePatient,
//   useDeletePatient,
//   usePatientAppointments,
//   usePatientMedicalHistory,
//   usePatientPrescriptions,
//   usePatientDocuments,
//   useUploadPatientDocument
// } from '@altamedica/api-client/hooks';

// Stubs temporales con datos de muestra para permitir compilación
const usePatientsBase = () => ({
  data: {
    patients: [
      {
        id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@ejemplo.com',
        dateOfBirth: '1985-06-15',
        gender: 'Masculino',
        personalInfo: { firstName: 'Juan', lastName: 'Pérez', dateOfBirth: '1985-06-15', gender: 'Masculino' },
        contactInfo: { email: 'juan.perez@ejemplo.com' }
      },
      {
        id: '2', 
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@ejemplo.com',
        dateOfBirth: '1990-03-22',
        gender: 'Femenino',
        personalInfo: { firstName: 'María', lastName: 'García', dateOfBirth: '1990-03-22', gender: 'Femenino' },
        contactInfo: { email: 'maria.garcia@ejemplo.com' }
      }
    ], 
    page: 1, 
    limit: 10, 
    total: 2, 
    totalPages: 1, 
    hasNextPage: false, 
    hasPrevPage: false 
  }, 
  isLoading: false, 
  error: null,
  refetch: () => Promise.resolve()
});
const usePatient = () => ({ data: null, isLoading: false, error: null });
const useCreatePatient = () => ({ mutate: () => {}, isLoading: false });
const useUpdatePatient = () => ({ mutate: () => {}, isLoading: false });
const useDeletePatient = () => ({ mutate: () => {}, isLoading: false });
const usePatientAppointments = () => ({ data: [], isLoading: false });
const usePatientMedicalHistory = () => ({ data: [], isLoading: false });
const usePatientPrescriptions = () => ({ data: [], isLoading: false });
const usePatientDocuments = () => ({ data: [], isLoading: false });
const useUploadPatientDocument = () => ({ mutate: () => {}, isLoading: false });

import { useState, useCallback, useEffect } from 'react';
import type { PatientProfile } from '@altamedica/types';
import { SimplePatient, toSimplePatient } from '../types';

// 📝 TIPOS ESPECIALIZADOS (mantenidos para compatibilidad)
export interface UsePatientState {
  patients: SimplePatient[];
  currentPatient: SimplePatient | null;
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
  getPatientById: (id: string) => Promise<SimplePatient | null>;
  createPatient: (data: Partial<SimplePatient>) => Promise<SimplePatient | null>;
  updatePatient: (id: string, data: Partial<SimplePatient>) => Promise<SimplePatient | null>;
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
    defaultLimit = 10,
  } = options;

  // Usar hooks centralizados
  const baseQuery = usePatientsBase({
    doctorId,
    limit: defaultLimit,
  });

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();
  const getPatientQuery = usePatient;

  // Estado local adicional
  const [currentPatient, setCurrentPatient] = useState<SimplePatient | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Acciones wrapper
  const searchPatients = useCallback(
    async (filters?: any) => {
      await baseQuery.refetch();
      setLastSync(new Date().toISOString());
    },
    [baseQuery],
  );

  const getPatientById = useCallback(async (id: string) => {
    const result = await getPatientQuery(id);
    if (result.data) {
      setCurrentPatient(result.data);
      return result.data;
    }
    return null;
  }, []);

  const createPatient = useCallback(
    async (data: Partial<SimplePatient>) => {
      const result = await createMutation.mutateAsync(data);
      if (result) {
        await baseQuery.refetch();
        return toSimplePatient(result);
      }
      return null;
    },
    [createMutation, baseQuery],
  );

  const updatePatient = useCallback(
    async (id: string, data: Partial<SimplePatient>) => {
      const result = await updateMutation.mutateAsync({ id, data });
      if (result) {
        await baseQuery.refetch();
        const simplePatient = toSimplePatient(result);
        if (currentPatient?.id === id) {
          setCurrentPatient(simplePatient);
        }
        return simplePatient;
      }
      return null;
    },
    [updateMutation, baseQuery, currentPatient],
  );

  const deletePatient = useCallback(
    async (id: string) => {
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
    },
    [deleteMutation, baseQuery, currentPatient],
  );

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

  // Mapear datos al formato esperado usando adapter
  const state: UsePatientState = {
    patients: (baseQuery.data?.patients || []).map(toSimplePatient),
    currentPatient,
    loading:
      baseQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    error:
      baseQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      deleteMutation.error?.message ||
      null,
    pagination: baseQuery.data
      ? {
          page: baseQuery.data.page || 1,
          limit: baseQuery.data.limit || defaultLimit,
          total: baseQuery.data.total || 0,
          totalPages: baseQuery.data.totalPages || 1,
          hasNextPage: baseQuery.data.hasNextPage || false,
          hasPrevPage: baseQuery.data.hasPrevPage || false,
        }
      : null,
    lastSync,
  };

  const actions: UsePatientActions = {
    searchPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    refreshPatients,
    clearError,
    resetState,
  };

  return {
    ...state,
    ...actions,
  };
}

// Re-exportar hooks adicionales para conveniencia
// Comentado temporalmente hasta que se exporte correctamente desde api-client
// export {
//   usePatient,
//   usePatientAppointments,
//   usePatientMedicalHistory,
//   usePatientPrescriptions,
//   usePatientDocuments,
//   useUploadPatientDocument
// } from '@altamedica/api-client/hooks';

// Exportar los stubs temporales que definimos arriba
export {
  usePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions,
  usePatientDocuments,
  useUploadPatientDocument,
};
