/**
 * @fileoverview Hook mejorado para citas médicas con conexión API central
 * @module @altamedica/hooks/medical
 * @description Hook que conecta con el UnifiedAppointmentController del API
 */

import type { ApiClient } from '@altamedica/api-client';
import { createApiClient, getApiClient } from '@altamedica/api-client';
// TEMP (Fase 1.5): desactivar import de tipos centrales hasta consolidación
// import type { Appointment, AppointmentStatus, AppointmentType } from '@altamedica/types';
// Stubs mínimos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = any;
type AppointmentStatus = string;
type AppointmentType = string;
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { MEDICAL_QUERY_KEYS } from './queryKeys';
import { logger } from '@altamedica/shared/services/logger.service';
const toast = {
  success: (message: string) => logger.info('[SUCCESS]', message),
  error: (message: string) => logger.error('[ERROR]', message),
  info: (message: string) => logger.info('[INFO]', message),
  warning: (message: string) => logger.warn('[WARN]', message),
};

// Initialize API client if not already initialized
let apiClient: ApiClient;
try {
  apiClient = getApiClient();
} catch {
  apiClient = createApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });
}

// WebSocket para actualizaciones en tiempo real
let appointmentSocket: WebSocket | null = null;

export interface UseAppointmentsOptions {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
  realTime?: boolean;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  upcoming: Appointment[];
  past: Appointment[];
  totalCount: number;
}

/**
 * Hook mejorado para gestión de citas con tiempo real
 * Conecta directamente con UnifiedAppointmentController
 */
export function useAppointmentsEnhanced(options: UseAppointmentsOptions = {}) {
  const {
    patientId,
    doctorId,
    status,
    type,
    startDate,
    endDate,
    enabled = true,
    realTime = true
  } = options;

  const queryClient = useQueryClient();

  // Query principal para citas
  const queryKey = [
    ...MEDICAL_QUERY_KEYS.appointments.all,
    { patientId, doctorId, status, type, startDate, endDate }
  ];

  const query = useQuery<AppointmentsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (patientId) params.append('patientId', patientId);
      if (doctorId) params.append('doctorId', doctorId);
      if (status?.length) params.append('status', status.join(','));
      if (type?.length) params.append('type', type.join(','));
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await apiClient.get(`/api/v1/appointments?${params}`);
      
      // Procesar respuesta para separar upcoming/past
      const appointments = response.data.appointments || response.data;
      const now = new Date();
      
      return {
        appointments,
        upcoming: appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledDate) > now && apt.status !== 'cancelled'
        ),
        past: appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledDate) <= now || apt.status === 'completed'
        ),
        totalCount: appointments.length
      };
    },
    enabled: enabled && (!!patientId || !!doctorId),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: realTime ? 30000 : false, // Refetch cada 30s si realTime
  });

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!realTime || !enabled) return;

    const connectWebSocket = () => {
      try {
        appointmentSocket = new WebSocket(
          process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
        );

        appointmentSocket.onopen = () => {
          logger.info('📅 Conectado a actualizaciones de citas en tiempo real');
          
          // Suscribirse a eventos de citas
          if (patientId) {
            appointmentSocket?.send(JSON.stringify({
              type: 'subscribe',
              channel: `appointments:patient:${patientId}`
            }));
          }
          
          if (doctorId) {
            appointmentSocket?.send(JSON.stringify({
              type: 'subscribe',
              channel: `appointments:doctor:${doctorId}`
            }));
          }
        };

        appointmentSocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          if (message.type === 'appointment:update') {
            // Invalidar cache para forzar refetch
            queryClient.invalidateQueries({ queryKey });
            
            // Mostrar notificación según el tipo de actualización
            switch (message.action) {
              case 'created':
                toast.info('Nueva cita agendada');
                break;
              case 'cancelled':
                toast.warning('Cita cancelada');
                break;
              case 'rescheduled':
                toast.info('Cita reprogramada');
                break;
              case 'reminder':
                toast.info(`Recordatorio: Cita en ${message.data.minutesUntil} minutos`);
                break;
            }
          }
        };

        appointmentSocket.onerror = (error) => {
          logger.error('WebSocket error:', error);
        };

        appointmentSocket.onclose = () => {
          logger.info('WebSocket desconectado, reconectando en 5s...');
          setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        logger.error('Error conectando WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (appointmentSocket?.readyState === WebSocket.OPEN) {
        appointmentSocket.close();
      }
    };
  }, [realTime, enabled, patientId, doctorId, queryClient, queryKey]);

  return {
    appointments: query.data?.appointments || [],
    upcomingAppointments: query.data?.upcoming || [],
    pastAppointments: query.data?.past || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para crear nueva cita
 */
export function useCreateAppointmentEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/api/v1/appointments', data);
      return response.data;
    },
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.appointments.all 
      });
      
      toast.success('Cita agendada exitosamente');
      
      // Enviar notificación por WebSocket si está conectado
      if (appointmentSocket?.readyState === WebSocket.OPEN) {
        appointmentSocket.send(JSON.stringify({
          type: 'appointment:created',
          data: newAppointment
        }));
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al agendar cita: ${error.message}`);
    }
  });
}

/**
 * Hook para cancelar cita con notificación
 */
export function useCancelAppointmentEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, reason }: { 
      appointmentId: string; 
      reason: string;
    }) => {
      const response = await apiClient.put(
        `/api/v1/appointments/${appointmentId}/cancel`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.appointments.all 
      });
      
      toast.success('Cita cancelada exitosamente');
      
      // Notificar a la otra parte
      if (appointmentSocket?.readyState === WebSocket.OPEN) {
        appointmentSocket.send(JSON.stringify({
          type: 'appointment:cancelled',
          appointmentId: variables.appointmentId,
          reason: variables.reason
        }));
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar cita: ${error.message}`);
    }
  });
}

/**
 * Hook para reprogramar cita
 */
export function useRescheduleAppointmentEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      newDate,
      reason 
    }: { 
      appointmentId: string; 
      newDate: Date;
      reason?: string;
    }) => {
      const response = await apiClient.put(
        `/api/v1/appointments/${appointmentId}/reschedule`,
        { newDate, reason }
      );
      return response.data;
    },
    onSuccess: (updatedAppointment, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.appointments.all 
      });
      
      toast.success('Cita reprogramada exitosamente');
      
      // Notificar cambio
      if (appointmentSocket?.readyState === WebSocket.OPEN) {
        appointmentSocket.send(JSON.stringify({
          type: 'appointment:rescheduled',
          appointmentId: variables.appointmentId,
          newDate: variables.newDate,
          data: updatedAppointment
        }));
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al reprogramar: ${error.message}`);
    }
  });
}

/**
 * Hook para obtener slots disponibles
 */
export function useAvailableSlotsEnhanced(
  doctorId: string,
  date: Date,
  duration: number = 30
) {
  return useQuery({
    queryKey: [...MEDICAL_QUERY_KEYS.appointments.all, 'slots', doctorId, date, duration],
    queryFn: async () => {
      const params = new URLSearchParams({
        doctorId,
        date: date.toISOString(),
        duration: duration.toString()
      });
      
      const response = await apiClient.get(`/api/v1/appointments/available-slots?${params}`);
      return response.data;
    },
    enabled: !!doctorId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}