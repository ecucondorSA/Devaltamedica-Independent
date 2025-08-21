// 🚀 MIGRATED: Hook migrado para usar @altamedica/api-client
// Mantiene funcionalidad especializada de patients app

import {
  useAppointments as useAppointmentsBase,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
  useCompleteAppointment,
  useAvailableSlots,
} from '@altamedica/api-client/hooks';

import { useState, useCallback, useEffect } from 'react';
import type { Appointment } from '@altamedica/types';

// 📝 TIPOS ESPECIALIZADOS PARA CITAS (mantenidos para compatibilidad)
export interface UseAppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
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
  lastFetch: string | null;
}

export interface UseAppointmentActions {
  searchAppointments: (filters?: any) => Promise<void>;
  getAppointmentById: (id: string) => Promise<Appointment | null>;
  createAppointment: (data: Partial<Appointment>) => Promise<Appointment | null>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<Appointment | null>;
  cancelAppointment: (id: string, reason?: string) => Promise<boolean>;
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

export interface UseAppointmentOptions {
  patientId?: string;
  doctorId?: string;
  initialFetch?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultLimit?: number;
}

// 🎯 HOOK ESPECIALIZADO PARA PATIENTS APP
export function useAppointments(options: UseAppointmentOptions = {}) {
  const {
    patientId,
    doctorId,
    initialFetch = true,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos por defecto
    defaultLimit = 10,
  } = options;

  // Usar hooks centralizados
  const baseQuery = useAppointmentsBase({
    patientId,
    doctorId,
    limit: defaultLimit,
  });

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const getAppointmentQuery = useAppointment;

  // Estado local adicional para funcionalidad especializada
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  // Acciones wrapper para mantener compatibilidad
  const searchAppointments = useCallback(
    async (filters?: any) => {
      await baseQuery.refetch();
      setLastFetch(new Date().toISOString());
    },
    [baseQuery],
  );

  const getAppointmentById = useCallback(async (id: string) => {
    const result = await getAppointmentQuery(id);
    if (result.data) {
      setCurrentAppointment(result.data);
      return result.data;
    }
    return null;
  }, []);

  const createAppointment = useCallback(
    async (data: Partial<Appointment>) => {
      const result = await createMutation.mutateAsync(data);
      if (result) {
        await baseQuery.refetch();
        return result;
      }
      return null;
    },
    [createMutation, baseQuery],
  );

  const updateAppointment = useCallback(
    async (id: string, data: Partial<Appointment>) => {
      const result = await updateMutation.mutateAsync({ id, data });
      if (result) {
        await baseQuery.refetch();
        return result;
      }
      return null;
    },
    [updateMutation, baseQuery],
  );

  const cancelAppointment = useCallback(
    async (id: string, reason?: string) => {
      try {
        await cancelMutation.mutateAsync({ id, reason });
        await baseQuery.refetch();
        return true;
      } catch {
        return false;
      }
    },
    [cancelMutation, baseQuery],
  );

  const refreshAppointments = useCallback(async () => {
    await baseQuery.refetch();
    setLastFetch(new Date().toISOString());
  }, [baseQuery]);

  const clearError = useCallback(() => {
    // Los hooks de TanStack Query manejan errores internamente
  }, []);

  const resetState = useCallback(() => {
    setCurrentAppointment(null);
    setLastFetch(null);
  }, []);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAppointments();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAppointments]);

  // Fetch inicial si está habilitado
  useEffect(() => {
    if (initialFetch) {
      refreshAppointments();
    }
  }, [initialFetch]);

  // Mapear datos del query base al formato esperado
  const state: UseAppointmentState = {
    appointments: baseQuery.data?.appointments || [],
    currentAppointment,
    loading:
      baseQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      cancelMutation.isPending,
    error:
      baseQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      cancelMutation.error?.message ||
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
    lastFetch,
  };

  const actions: UseAppointmentActions = {
    searchAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    refreshAppointments,
    clearError,
    resetState,
  };

  return {
    ...state,
    ...actions,
  };
}

// Re-exportar hooks adicionales para conveniencia
export {
  useAppointment,
  useRescheduleAppointment,
  useCompleteAppointment,
  useAvailableSlots,
} from '@altamedica/api-client/hooks';
