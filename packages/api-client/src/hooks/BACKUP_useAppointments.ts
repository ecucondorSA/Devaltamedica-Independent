/**
 * 📅 APPOINTMENT HOOKS - ALTAMEDICA
 * Hooks para gestión de citas médicas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de cita médica
const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.number(), // en minutos
  type: z.enum(['consultation', 'follow-up', 'emergency', 'telemedicine']),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  reason: z.string(),
  notes: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  diagnosis: z.string().optional(),
  prescriptionId: z.string().optional(),
  telemedicineSessionId: z.string().optional(),
  fee: z.number(),
  paid: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Appointment = z.infer<typeof AppointmentSchema>;

// Hook para listar citas
export function useAppointments(
  params?: QueryParams & {
    status?: Appointment['status'];
    doctorId?: string;
    patientId?: string;
    date?: string;
  },
) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Appointment>>(API_ENDPOINTS.appointments.list, {
        params,
      });
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para obtener una cita
export function useAppointment(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      return apiClient.get<Appointment>(API_ENDPOINTS.appointments.get(id), {
        validate: AppointmentSchema,
      });
    },
    enabled: !!id,
  });
}

// Hook para crear cita
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (appointmentData: {
      patientId: string;
      doctorId: string;
      date: string;
      time: string;
      duration?: number;
      type: Appointment['type'];
      reason: string;
      symptoms?: string[];
    }) => {
      return apiClient.post<{ id: string }>(API_ENDPOINTS.appointments.create, appointmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

// Hook para actualizar cita
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      return apiClient.put(API_ENDPOINTS.appointments.update(id), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
    },
  });
}

// Hook para cancelar cita
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.post(API_ENDPOINTS.appointments.cancel(id), { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
    },
  });
}

// Hook para confirmar cita
export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.appointments.confirm(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', id] });
    },
  });
}

// Hook para reprogramar cita
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ id, date, time }: { id: string; date: string; time: string }) => {
      return apiClient.post(API_ENDPOINTS.appointments.reschedule(id), { date, time });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

// Hook para obtener slots disponibles
export function useAvailableSlots(params: { doctorId: string; date: string; duration?: number }) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['appointments', 'slots', params],
    queryFn: async () => {
      return apiClient.get<{
        slots: Array<{
          time: string;
          available: boolean;
        }>;
      }>(API_ENDPOINTS.appointments.slots, { params });
    },
    enabled: !!params.doctorId && !!params.date,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para marcar cita como completada
export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({
      id,
      diagnosis,
      notes,
      prescriptionId,
    }: {
      id: string;
      diagnosis?: string;
      notes?: string;
      prescriptionId?: string;
    }) => {
      return apiClient.put(API_ENDPOINTS.appointments.update(id), {
        status: 'completed',
        diagnosis,
        notes,
        prescriptionId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
