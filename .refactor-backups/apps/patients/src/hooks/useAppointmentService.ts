/**
 * 🏥 APPOINTMENT SERVICE HOOKS - MIGRADO
 * Reemplazo moderno del appointment-service.ts usando @altamedica/api-client
 */

import { 
  useAppointments as useAppointmentsBase, 
  useAppointment,
  useCreateAppointment as useCreateAppointmentBase,
  useUpdateAppointment as useUpdateAppointmentBase,
  useCancelAppointment as useCancelAppointmentBase,
  useAvailableSlots,
  useDoctors,
  useQueryClient
} from '@altamedica/api-client';
import { useMemo } from 'react';
import { useAuth  } from '@altamedica/auth';;

/**
 * Hook principal para gestionar citas del paciente
 * Reemplaza: appointmentService.getAppointments()
 */
export function usePatientAppointments(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
}) {
  const { user } = useAuth();
  
  const { data, isLoading, error, refetch } = useAppointmentsBase({
    patientId: user?.uid,
    ...filters
  });

  // Métricas calculadas
  const stats = useMemo(() => {
    if (!data?.data) return null;
    
    const appointments = data.data;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: appointments.length,
      upcoming: appointments.filter(a => 
        a.status === 'scheduled' && new Date(a.date) > now
      ).length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      telemedicine: appointments.filter(a => a.type === 'telemedicine').length,
      thisMonth: appointments.filter(a => 
        new Date(a.date) >= thisMonth
      ).length,
    };
  }, [data]);

  return {
    appointments: data?.data || [],
    pagination: data?.pagination,
    stats,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook para citas de hoy
 * Reemplaza: appointmentService.getTodayAppointments()
 */
export function useTodayAppointments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return usePatientAppointments({
    dateFrom: today.toISOString(),
    dateTo: tomorrow.toISOString(),
    status: 'scheduled'
  });
}

/**
 * Hook para próximas citas
 * Reemplaza: appointmentService.getUpcomingAppointments()
 */
export function useUpcomingAppointments() {
  const { appointments, ...rest } = usePatientAppointments({
    status: 'scheduled'
  });

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  return {
    appointments: upcomingAppointments,
    ...rest
  };
}

/**
 * Hook para crear cita con optimistic update
 * Reemplaza: appointmentService.createAppointment()
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const mutation = useCreateAppointmentBase();

  const createAppointment = async (data: {
    doctorId: string;
    date: string;
    time: string;
    type: 'consultation' | 'follow-up' | 'emergency' | 'telemedicine';
    reason: string;
    symptoms?: string[];
  }) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticAppointment = {
      id: tempId,
      patientId: user?.uid || '',
      ...data,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Actualizar cache inmediatamente
    queryClient.setQueryData(['appointments'], (old: any) => {
      if (!old) return { data: [optimisticAppointment], pagination: {} };
      return {
        ...old,
        data: [optimisticAppointment, ...old.data]
      };
    });

    try {
      const result = await mutation.mutateAsync({
        patientId: user?.uid || '',
        ...data,
        duration: 30 // Duración por defecto
      });

      // Reemplazar el temporal con el real
      queryClient.setQueryData(['appointments'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((apt: any) => 
            apt.id === tempId ? result : apt
          )
        };
      });

      return result;
    } catch (error) {
      // Revertir en caso de error
      queryClient.setQueryData(['appointments'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((apt: any) => apt.id !== tempId)
        };
      });
      throw error;
    }
  };

  return {
    createAppointment,
    isLoading: mutation.isLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Hook para cancelar cita con optimistic update
 * Reemplaza: appointmentService.cancelAppointment()
 */
export function useCancelAppointmentOptimistic() {
  const queryClient = useQueryClient();
  const mutation = useCancelAppointmentBase();

  const cancelAppointment = async (appointmentId: string, reason: string) => {
    // Guardar estado anterior para rollback
    const previousAppointments = queryClient.getQueryData(['appointments']);

    // Optimistic update
    queryClient.setQueryData(['appointments'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((apt: any) => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled', cancelReason: reason }
            : apt
        )
      };
    });

    try {
      await mutation.mutateAsync({ id: appointmentId, reason });
    } catch (error) {
      // Rollback en caso de error
      queryClient.setQueryData(['appointments'], previousAppointments);
      throw error;
    }
  };

  return {
    cancelAppointment,
    isCancelling: mutation.isLoading,
    error: mutation.error
  };
}

/**
 * Hook para verificar disponibilidad con cache
 * Reemplaza: appointmentService.getAvailableSlots()
 */
export function useDoctorAvailability(doctorId: string, date: string) {
  const { data, isLoading, error } = useAvailableSlots(
    { doctorId, date },
    {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Solo ejecutar si tenemos los parámetros
      enabled: !!doctorId && !!date
    }
  );

  return {
    slots: data?.slots || [],
    isLoading,
    error
  };
}

/**
 * Hook para buscar doctores por especialidad con cache
 * Reemplaza: appointmentService.getDoctorsBySpecialty()
 */
export function useDoctorsBySpecialty(specialty: string) {
  const { data, isLoading, error } = useDoctors(
    { specialty },
    {
      // Cache por 30 minutos (los doctores no cambian frecuentemente)
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      enabled: !!specialty
    }
  );

  return {
    doctors: data?.data || [],
    isLoading,
    error
  };
}

/**
 * Hook para gestión completa de citas
 * Combina todos los hooks anteriores
 */
export function useAppointmentManagement() {
  const { appointments, stats, isLoading, refetch } = usePatientAppointments();
  const { appointments: todayAppointments } = useTodayAppointments();
  const { appointments: upcomingAppointments } = useUpcomingAppointments();
  const { createAppointment } = useCreateAppointment();
  const { cancelAppointment } = useCancelAppointmentOptimistic();

  return {
    // Datos
    allAppointments: appointments,
    todayAppointments,
    upcomingAppointments,
    stats,
    
    // Estados
    isLoading,
    
    // Acciones
    createAppointment,
    cancelAppointment,
    refreshAppointments: refetch
  };
}