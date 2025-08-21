/**
import { logger } from './logger.service';

 * 🔔 NOTIFICATION SERVICE - WRAPPER DEL SISTEMA UNIFICADO
 *
 * Este archivo mantiene compatibilidad con código legacy re-exportando
 * tipos y funcionalidad del UnifiedNotificationSystem.
 *
 * ⚠️ IMPORTANTE: Todo nuevo código debe usar UnifiedNotificationSystem directamente
 * Ubicación: apps/api-server/src/notifications/UnifiedNotificationSystem.ts
 */

// Re-export tipos para compatibilidad
export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: 'user' | 'doctor' | 'patient' | 'company' | 'all';
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'appointment' | 'prescription' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  unread_only?: boolean;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  today: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * NotificationService - Clase wrapper para compatibilidad legacy
 *
 * NOTA: Esta es una implementación placeholder que debe ser
 * reemplazada con llamadas al UnifiedNotificationSystem en el api-server
 */
export class NotificationService {
  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
  ): Promise<NotificationResponse> {
    logger.warn(
      '[NotificationService] Legacy method called. Migrate to UnifiedNotificationSystem',
    );
    // PENDING-LEGACY: realizar llamada HTTP al UnifiedNotificationSystem en api-server
    return {
      notifications: [],
      unread_count: 0,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    logger.warn(
      '[NotificationService] Legacy method called. Migrate to UnifiedNotificationSystem',
    );
    // PENDING-LEGACY: realizar llamada HTTP al UnifiedNotificationSystem en api-server
  }

  async markAllAsRead(userId: string): Promise<void> {
    logger.warn(
      '[NotificationService] Legacy method called. Migrate to UnifiedNotificationSystem',
    );
    // PENDING-LEGACY: realizar llamada HTTP al UnifiedNotificationSystem en api-server
  }

  async getStats(userId: string): Promise<NotificationStats> {
    logger.warn(
      '[NotificationService] Legacy method called. Migrate to UnifiedNotificationSystem',
    );
    // PENDING-LEGACY: realizar llamada HTTP al UnifiedNotificationSystem en api-server
    return {
      total: 0,
      unread: 0,
      urgent: 0,
      today: 0,
    };
  }

  async createNotification(
    notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Notification> {
    logger.warn(
      '[NotificationService] Legacy method called. Migrate to UnifiedNotificationSystem',
    );
    // TODO: Hacer llamada HTTP al api-server UnifiedNotificationSystem
    throw new Error(
      'NotificationService.createNotification not implemented. Use UnifiedNotificationSystem',
    );
  }
}

// Export instancia singleton para compatibilidad
const notificationService = new NotificationService();
export default notificationService;
