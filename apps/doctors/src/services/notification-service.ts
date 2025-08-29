/**
 * Servicio de Notificaciones - Wrapper del Sistema Unificado
 * 
 * Este archivo re-exporta el UnifiedNotificationSystem para mantener
 * compatibilidad con código existente.
 * 
 * IMPORTANTE: Todo nuevo código debe usar directamente:
 * - UnifiedNotificationSystem del api-server
 * - O el wrapper notificationServiceUnified
 * 
 * Ubicación del sistema real: apps/api-server/src/notifications/UnifiedNotificationSystem.ts
 */

// Re-export desde implementación unificada
export { 
  notificationServiceUnified as NotificationService,
  notificationServiceUnified as notificationService,
  notificationServiceUnified as default
} from './notificationServiceUnified';

// Re-export tipos si son necesarios para compatibilidad
/*
export type {
  NotificationTemplate,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus
} from './notificationServiceUnified';
*/