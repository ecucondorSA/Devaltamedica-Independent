// 🚀 MIGRATED: Hook migrado para usar @altamedica/api-client
// Mantiene funcionalidad específica de doctors app

import {
  usePatients as usePatientsBase,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions
} from '@altamedica/api-client/hooks';

import { useState, useCallback, useEffect } from 'react';
import { SimplePatient, toSimplePatient } from '../types';

export interface UsePatientsOptions {
  page?: number;
  limit?: number;
  autoFetch?: boolean;
  // doctorId eliminado: el hook base actual no soporta ese filtro todavía
}

export interface UsePatientsResult {
  // Estado
  patients: SimplePatient[];
  currentPatient: SimplePatient | null;
  loading: boolean;
  error: string | null;
  totalPatients: number;
  
  // Acciones
  fetchPatients: (page?: number, limit?: number) => Promise<void>;
  fetchMyPatients: () => Promise<void>; // Placeholder (no-op hasta que API soporte filtro)
  fetchPatientById: (id: string) => Promise<void>;
  updatePatient: (id: string, data: Partial<SimplePatient>) => Promise<boolean>;
  searchPatients: (query: string) => Promise<void>;
  clearError: () => void;
  clearCurrentPatient: () => void;
}

// 🎯 HOOK ESPECIALIZADO PARA DOCTORS APP
export function usePatients(options: UsePatientsOptions = {}): UsePatientsResult {
  const { page = 1, limit = 20, autoFetch = true } = options;
  
  // Usar hooks centralizados
  const baseQuery = usePatientsBase({
    page,
    limit
  });

  const updateMutation = useUpdatePatient();
  const getPatientQuery = usePatient;

  // Estado local adicional
  const [currentPatient, setCurrentPatient] = useState<SimplePatient | null>(null);

  // Acciones wrapper
  const fetchPatients = useCallback(async (pageOverride?: number, limitOverride?: number) => {
    await baseQuery.refetch();
  }, [baseQuery]);

  // 🔑 Función específica para doctores: obtener sus propios pacientes
  const fetchMyPatients = useCallback(async () => {
    // Actualmente el endpoint no distingue pacientes por doctor.
    // Mantener refetch para futura extensión.
    await baseQuery.refetch();
  }, [baseQuery]);

  const fetchPatientById = useCallback(async (id: string) => {
    const result = await getPatientQuery(id);
    if (result.data) {
      setCurrentPatient(toSimplePatient(result.data));
    }
  }, []);

  const updatePatient = useCallback(async (id: string, data: Partial<SimplePatient>) => {
    try {
      // El mutation del api-client espera una mezcla { id, ...fields } no anidado en 'data'
      const result = await updateMutation.mutateAsync({ id, ...data } as any);
      if (result) {
        await baseQuery.refetch();
        if (currentPatient?.id === id) {
          setCurrentPatient(toSimplePatient(result));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [updateMutation, baseQuery, currentPatient]);

  const searchPatients = useCallback(async (query: string) => {
    // TODO: Implementar búsqueda con filtros en el hook base
    // Por ahora, refetch con los datos actuales
    await baseQuery.refetch();
  }, [baseQuery]);

  const clearError = useCallback(() => {
    // Los errores se manejan internamente en TanStack Query
  }, []);

  const clearCurrentPatient = useCallback(() => {
    setCurrentPatient(null);
  }, []);

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchPatients();
    }
  }, [autoFetch]);

  // Mapear datos al formato esperado usando adapters
  return {
    // Estado
  // El response real es PaginatedResponse<Patient> => { items, pageInfo }
  // Convertir tipos complejos a SimplePatient usando adapter
  patients: ((baseQuery.data as any)?.items || []).map(toSimplePatient),
    currentPatient,
    loading: baseQuery.isLoading || updateMutation.isPending,
    error: baseQuery.error?.message || updateMutation.error?.message || null,
  totalPatients: (baseQuery.data as any)?.pageInfo?.total || 0,
    
    // Acciones
    fetchPatients,
    fetchMyPatients,
    fetchPatientById,
    updatePatient,
    searchPatients,
    clearError,
    clearCurrentPatient
  };
}

// Re-exportar hooks adicionales para conveniencia
export {
  usePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions
} from '@altamedica/api-client/hooks';

// Re-export types
// Tipos reales deben venir de @altamedica/types; placeholder local export omitido.