// 🚀 MIGRATION: Este archivo ahora importa hooks centralizados de @altamedica/api-client
// Mantenemos las re-exportaciones para compatibilidad con código existente

import { // Auth hooks
  useAuth,
  // Patient hooks
  usePatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  // Doctor hooks
  useDoctors,
  useDoctor,
  // Appointment hooks
  useAppointments,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  // Prescription hooks
  usePrescriptions,
  usePrescription,
  useCreatePrescription,
  useUpdatePrescription,
  // Company hooks
  useCompanies,
  useCompany,
  // Notification hooks
  useNotifications,
  // Analytics hooks
  useAnalytics,
  // Re-export query utilities
  useQuery as useTanstackQuery,
  useMutation,
  useQueryClient
 } from '@altamedica/auth';;

import { api } from '@/lib/api-client';
import { useState } from 'react';

// Re-export hooks centralizados para compatibilidad
export {
  useAuth,
  usePatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDoctors,
  useDoctor,
  useAppointments,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  usePrescriptions,
  usePrescription,
  useCreatePrescription,
  useUpdatePrescription,
  useCompanies,
  useCompany,
  useNotifications,
  useAnalytics,
  useTanstackQuery,
  useMutation,
  useQueryClient
};

// 🔐 Auth Hooks personalizados de web-app
// NOTA: useLogin y useLogout son específicos de web-app por el manejo de localStorage
// TODO: Migrar a cookies HttpOnly siguiendo HIPAA compliance

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data: any) => {
      // ⚠️ SECURITY WARNING: localStorage es vulnerable a XSS
      // Esto se mantiene temporalmente para compatibilidad
      // El api-server ya setea cookies HttpOnly automáticamente
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      localStorage.removeItem('authToken');
      queryClient.clear();
      window.location.href = '/auth/login';
    }
  });
}

// Hooks adicionales específicos de web-app que no están en @altamedica/api-client

export function usePatientAppointments(patientId: string) {
  return useTanstackQuery({
    queryKey: ['patients', patientId, 'appointments'],
    queryFn: () => api.patients.appointments(patientId),
    enabled: !!patientId
  });
}

// Doctor hooks adicionales no incluidos en @altamedica/api-client

export function useDoctorAvailability(id: string) {
  return useTanstackQuery({
    queryKey: ['doctors', id, 'availability'],
    queryFn: () => api.doctors.availability(id),
    enabled: !!id,
    staleTime: 30 * 1000 // 30 seconds - availability changes frequently
  });
}

export function useDoctorAppointments(doctorId: string) {
  return useTanstackQuery({
    queryKey: ['doctors', doctorId, 'appointments'],
    queryFn: () => api.doctors.appointments(doctorId),
    enabled: !!doctorId,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.doctors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    }
  });
}

// Appointment hooks adicionales

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.appointments.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

// Los hooks de prescriptions están incluidos en las re-exportaciones arriba

// 📋 Medical Records Hooks (pendientes de migrar a @altamedica/api-client)

export function useMedicalRecords(params?: any) {
  return useTanstackQuery({
    queryKey: ['medical-records', params],
    queryFn: () => api.medicalRecords.list(params),
    staleTime: 10 * 60 * 1000 // 10 minutes - medical records are stable
  });
}

export function useMedicalRecord(id: string) {
  return useTanstackQuery({
    queryKey: ['medical-records', id],
    queryFn: () => api.medicalRecords.get(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.medicalRecords.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
    }
  });
}

// Los hooks de companies están incluidos en las re-exportaciones arriba

// 💼 Jobs Hooks (pendientes de migrar a @altamedica/marketplace-hooks)

export function useJobs(params?: any) {
  return useTanstackQuery({
    queryKey: ['jobs', params],
    queryFn: () => api.jobs.list(params),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useJobApplications(params?: any) {
  return useTanstackQuery({
    queryKey: ['job-applications', params],
    queryFn: () => api.jobs.applications.list(params),
    staleTime: 5 * 60 * 1000
  });
}

export function useCreateJobApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.jobs.applications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    }
  });
}

// 💬 Messages Hooks (pendientes de migrar a @altamedica/api-client)

export function useMessages(params?: any) {
  return useTanstackQuery({
    queryKey: ['messages', params],
    queryFn: () => api.messages.list(params),
    staleTime: 30 * 1000, // 30 seconds - messages change frequently
    refetchInterval: 30 * 1000 // Auto-refresh every 30 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.messages.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });
}

// 🤖 AI Hooks (pendientes de migrar a @altamedica/medical-hooks)

export function useAIRiskAssessment() {
  return useMutation({
    mutationFn: (data: any) => api.ai.riskAssessment(data)
  });
}

export function useAIDiagnosis() {
  return useMutation({
    mutationFn: (data: any) => api.ai.diagnosis(data)
  });
}

export function useAIRecommendations(patientId: string) {
  return useTanstackQuery({
    queryKey: ['ai', 'recommendations', patientId],
    queryFn: () => api.ai.recommendations(patientId),
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

// 📍 Location Hooks

export function useMedicalLocations(params?: any) {
  return useTanstackQuery({
    queryKey: ['medical-locations', params],
    queryFn: () => api.locations.medical(params),
    staleTime: 60 * 60 * 1000 // 1 hour - locations are stable
  });
}

export function useNearbyMedicalLocations(lat: number, lon: number, radius?: number) {
  return useTanstackQuery({
    queryKey: ['medical-locations', 'nearby', lat, lon, radius],
    queryFn: () => api.locations.nearby(lat, lon, radius),
    enabled: !!(lat && lon),
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
}

// 🏥 Health Status Hooks

export function useHealthStatus() {
  return useTanstackQuery({
    queryKey: ['health', 'status'],
    queryFn: api.health.status,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Check every minute
  });
}

// 📊 Analytics Hooks (específicos de web-app, no incluidos en @altamedica/analytics)

export function usePatientStats(params?: any) {
  return useTanstackQuery({
    queryKey: ['analytics', 'patients', params],
    queryFn: () => api.analytics.patientStats(params),
    staleTime: 15 * 60 * 1000 // 15 minutes
  });
}

export function useAppointmentStats(params?: any) {
  return useTanstackQuery({
    queryKey: ['analytics', 'appointments', params],
    queryFn: () => api.analytics.appointmentStats(params),
    staleTime: 15 * 60 * 1000
  });
}

// Notification hooks adicionales

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

// 🔄 Real-time hooks with optimistic updates

export function useOptimisticAppointmentUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.appointments.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments', id] });
      
      // Snapshot the previous value
      const previousAppointment = queryClient.getQueryData(['appointments', id]);
      
      // Optimistically update
      queryClient.setQueryData(['appointments', id], (old: any) => ({
        ...old,
        ...data
      }));
      
      return { previousAppointment };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(['appointments', id], context?.previousAppointment);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['appointments', id] });
    }
  });
}

// Custom hook para manejar paginación

export function usePaginatedQuery<T>(
  queryKey: string[],
  queryFn: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  limit = 20
) {
  const [page, setPage] = useState(1);
  
  const query = useTanstackQuery({
    queryKey: [...queryKey, page, limit],
    queryFn: () => queryFn(page, limit),
    placeholderData: (previousData: any) => previousData
  });
  
  return {
    ...query,
    page,
    setPage,
    nextPage: () => setPage((p: number) => p + 1),
    prevPage: () => setPage((p: number) => Math.max(1, p - 1)),
    hasNextPage: (query.data as any)?.hasMore ?? false,
    hasPreviousPage: page > 1
  };
}
