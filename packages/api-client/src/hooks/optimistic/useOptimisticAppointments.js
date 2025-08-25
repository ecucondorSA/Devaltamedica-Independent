/**
 * 🚀 OPTIMISTIC UPDATES - APPOINTMENTS
 * Mejora la UX con actualizaciones instantáneas
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../client';
import { API_ENDPOINTS } from '../../endpoints';
import { toast } from 'react-hot-toast'; // Asumiendo que se usa para notificaciones
/**
 * Hook para crear cita con optimistic update y rollback automático
 */
export function useOptimisticCreateAppointment() {
    const queryClient = useQueryClient();
    const apiClient = getApiClient();
    return useMutation({
        mutationFn: async (appointmentData) => {
            return apiClient.post(API_ENDPOINTS.appointments.create, appointmentData);
        },
        // Ejecutar antes de la mutación
        onMutate: async (newAppointment) => {
            // Cancelar refetches para evitar conflictos
            await queryClient.cancelQueries({ queryKey: ['appointments'] });
            // Snapshot del estado anterior
            const previousAppointments = queryClient.getQueryData(['appointments']);
            // Crear cita optimista con ID temporal
            const optimisticAppointment = {
                ...newAppointment,
                id: `temp-${Date.now()}`,
                status: 'scheduled',
            };
            // Actualizar cache inmediatamente
            queryClient.setQueryData(['appointments'], (old) => {
                if (!old)
                    return { data: [optimisticAppointment] };
                return {
                    ...old,
                    data: [optimisticAppointment, ...old.data],
                };
            });
            // Mostrar feedback inmediato
            toast.success('Cita agendada correctamente', {
                icon: '📅',
                duration: 2000,
            });
            // Retornar contexto para rollback
            return { previousAppointments, optimisticAppointment };
        },
        // Si hay error, hacer rollback
        onError: (err, newAppointment, context) => {
            if (context?.previousAppointments) {
                queryClient.setQueryData(['appointments'], context.previousAppointments);
            }
            toast.error('Error al agendar la cita. Intente nuevamente.', {
                icon: '❌',
                duration: 4000,
            });
        },
        // Al completarse, reemplazar datos optimistas con reales
        onSuccess: (data, variables, context) => {
            queryClient.setQueryData(['appointments'], (old) => {
                if (!old)
                    return old;
                // Reemplazar la cita temporal con la real
                return {
                    ...old,
                    data: old.data.map((apt) => apt.id === context?.optimisticAppointment.id ? data : apt),
                };
            });
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['availability'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
/**
 * Hook para cancelar cita con feedback instantáneo
 */
export function useOptimisticCancelAppointment() {
    const queryClient = useQueryClient();
    const apiClient = getApiClient();
    return useMutation({
        mutationFn: async ({ id, reason }) => {
            return apiClient.post(API_ENDPOINTS.appointments.cancel(id), { reason });
        },
        onMutate: async ({ id, reason }) => {
            await queryClient.cancelQueries({ queryKey: ['appointments'] });
            const previousAppointments = queryClient.getQueryData(['appointments']);
            // Actualizar estado inmediatamente
            queryClient.setQueryData(['appointments'], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((apt) => apt.id === id
                        ? { ...apt, status: 'cancelled', cancelReason: reason }
                        : apt),
                };
            });
            // UI feedback
            toast.success('Cita cancelada', {
                icon: '🚫',
                duration: 2000,
            });
            return { previousAppointments };
        },
        onError: (err, variables, context) => {
            if (context?.previousAppointments) {
                queryClient.setQueryData(['appointments'], context.previousAppointments);
            }
            toast.error('No se pudo cancelar la cita', {
                icon: '❌',
                duration: 4000,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['availability'] });
        },
    });
}
/**
 * Hook para reprogramar cita con actualización optimista
 */
export function useOptimisticRescheduleAppointment() {
    const queryClient = useQueryClient();
    const apiClient = getApiClient();
    return useMutation({
        mutationFn: async ({ id, newDate, newTime }) => {
            return apiClient.post(API_ENDPOINTS.appointments.reschedule(id), {
                date: newDate,
                time: newTime,
            });
        },
        onMutate: async ({ id, newDate, newTime }) => {
            await queryClient.cancelQueries({ queryKey: ['appointments', id] });
            const previousAppointment = queryClient.getQueryData(['appointments', id]);
            const previousList = queryClient.getQueryData(['appointments']);
            // Actualizar cita específica
            queryClient.setQueryData(['appointments', id], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    date: newDate,
                    time: newTime,
                    rescheduled: true,
                };
            });
            // Actualizar lista
            queryClient.setQueryData(['appointments'], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((apt) => apt.id === id
                        ? { ...apt, date: newDate, time: newTime, rescheduled: true }
                        : apt),
                };
            });
            toast.success('Cita reprogramada exitosamente', {
                icon: '📆',
                duration: 2000,
            });
            return { previousAppointment, previousList };
        },
        onError: (err, variables, context) => {
            if (context?.previousAppointment) {
                queryClient.setQueryData(['appointments', variables.id], context.previousAppointment);
            }
            if (context?.previousList) {
                queryClient.setQueryData(['appointments'], context.previousList);
            }
            toast.error('Error al reprogramar la cita', {
                icon: '❌',
                duration: 4000,
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['availability'] });
        },
    });
}
/**
 * Hook para marcar cita como completada con actualización optimista
 */
export function useOptimisticCompleteAppointment() {
    const queryClient = useQueryClient();
    const apiClient = getApiClient();
    return useMutation({
        mutationFn: async ({ id, notes, prescriptionId }) => {
            return apiClient.put(API_ENDPOINTS.appointments.update(id), {
                status: 'completed',
                notes,
                prescriptionId,
                completedAt: new Date().toISOString(),
            });
        },
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['appointments'] });
            const previousData = {
                appointment: queryClient.getQueryData(['appointments', id]),
                list: queryClient.getQueryData(['appointments']),
            };
            // Actualización optimista
            const updateFn = (apt) => ({
                ...apt,
                status: 'completed',
                notes,
                completedAt: new Date().toISOString(),
            });
            queryClient.setQueryData(['appointments', id], (old) => old ? updateFn(old) : old);
            queryClient.setQueryData(['appointments'], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((apt) => apt.id === id ? updateFn(apt) : apt),
                };
            });
            return previousData;
        },
        onError: (err, variables, context) => {
            // Rollback completo
            if (context?.appointment) {
                queryClient.setQueryData(['appointments', variables.id], context.appointment);
            }
            if (context?.list) {
                queryClient.setQueryData(['appointments'], context.list);
            }
        },
        onSuccess: (data, variables) => {
            // Invalidar datos relacionados
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients', data.patientId] });
            if (variables.prescriptionId) {
                queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            }
        },
    });
}
