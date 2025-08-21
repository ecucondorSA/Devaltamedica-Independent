// ARCHIVO MIGRADO - Ver notifications/UnifiedNotificationSystem.ts
// Este archivo ha sido consolidado en el sistema unificado de notificaciones

export { 
  notificationService as default,
  notificationService,
  UnifiedNotificationService,
  notificationConfig,
  DEFAULT_TEMPLATES,
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationPreferencesSchema,
  type Notification,
  type NotificationTemplate,
  type NotificationPreferences,
  type NotificationAction,
  type BulkNotificationRequest
} from '../notifications/UnifiedNotificationSystem';

// Legacy compatibility types
export interface NotificationData extends Notification {}
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  deliveryStatus?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    websocket?: boolean;
  };
}