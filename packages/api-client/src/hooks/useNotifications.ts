/**
 * 🔔 NOTIFICATION HOOKS - ALTAMEDICA
 * Hooks para gestión de notificaciones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de notificación
const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    'appointment_reminder',
    'appointment_confirmed',
    'appointment_cancelled',
    'prescription_ready',
    'test_results',
    'new_message',
    'payment_due',
    'system_update',
    'marketing',
    'emergency'
  ]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  read: z.boolean(),
  readAt: z.string().optional(),
  actionUrl: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

// Schema de preferencias
const NotificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
  }),
  sms: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
  }),
  push: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});

type Notification = z.infer<typeof NotificationSchema>;
type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// Hook para listar notificaciones
export function useNotifications(params?: QueryParams & {
  type?: Notification['type'];
  priority?: Notification['priority'];
  read?: boolean;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Notification>>(
        API_ENDPOINTS.notifications.list,
        { params }
      );
    },
    refetchInterval: 30 * 1000, // 30 segundos
  });
}

// Hook para obtener una notificación
export function useNotification(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['notifications', id],
    queryFn: async () => {
      return apiClient.get<Notification>(
        API_ENDPOINTS.notifications.get(id),
        { validate: NotificationSchema }
      );
    },
    enabled: !!id,
  });
}

// Hook para marcar como leída
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(
        API_ENDPOINTS.notifications.markAsRead(id)
      );
    },
    onSuccess: (_, id) => {
      // Actualizar notificación en caché
      queryClient.setQueryData<Notification>(
        ['notifications', id],
        (old) => old ? { ...old, read: true, readAt: new Date().toISOString() } : old
      );
      
      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

// Hook para marcar todas como leídas
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post(
        API_ENDPOINTS.notifications.markAllAsRead
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(['notifications', 'unread-count'], { count: 0 });
    },
  });
}

// Hook para contar no leídas
export function useUnreadNotificationsCount() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      return apiClient.get<{ count: number }>(
        '/api/v1/notifications/unread-count'
      );
    },
    refetchInterval: 15 * 1000, // 15 segundos
  });
}

// Hook para obtener preferencias
export function useNotificationPreferences() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      return apiClient.get<NotificationPreferences>(
        API_ENDPOINTS.notifications.preferences,
        { validate: NotificationPreferencesSchema }
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para actualizar preferencias
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      return apiClient.put(
        API_ENDPOINTS.notifications.preferences,
        preferences
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', 'preferences'] 
      });
    },
  });
}

// Hook para eliminar notificación
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(
        `/api/v1/notifications/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Hook para eliminar notificaciones antiguas
export function useDeleteOldNotifications() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (olderThanDays: number = 30) => {
      return apiClient.delete(
        '/api/v1/notifications/old',
        { params: { days: olderThanDays } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Hook para suscribirse a push notifications
export function useSubscribeToPushNotifications() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      return apiClient.post(
        '/api/v1/notifications/push/subscribe',
        subscription.toJSON()
      );
    },
  });
}

// Hook para desuscribirse de push notifications
export function useUnsubscribeFromPushNotifications() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post(
        '/api/v1/notifications/push/unsubscribe'
      );
    },
  });
}