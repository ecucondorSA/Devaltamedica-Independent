// ARCHIVO MIGRADO - Ver notifications/UnifiedNotificationSystem.ts
// Este archivo ha sido consolidado en el sistema unificado de notificaciones

export { 
  notificationService as NotificationService,
  UnifiedNotificationService,
  type Notification,
  type NotificationTemplate,
  type NotificationPreferences,
  CreateNotificationSchema
} from '../notifications/UnifiedNotificationSystem';

// Legacy compatibility
export interface CreateNotificationData {
  userId: string;
  userType: 'patient' | 'doctor' | 'admin';
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

export interface GetNotificationsOptions {
  status?: 'unread' | 'read' | 'archived';
  limit?: number;
  offset?: number;
}