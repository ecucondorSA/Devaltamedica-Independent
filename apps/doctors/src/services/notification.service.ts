// import { QueryProvider, apiClient } from '@altamedica/api-client';
// import { services } from '@altamedica/api-client';

const QueryProvider: any = {};
const apiClient: any = {};
const services: any = {};

/**
 * 📢 NOTIFICATION SERVICE - DOCTORS APP (PRODUCTION READY)
 * 
 * ✅ MIGRATED TO UNIFIED SYSTEM - NO DUPLICATED CODE
 * 
 * Este archivo re-exporta únicamente el sistema unificado para
 * mantener compatibilidad con código existente.
 * 
 * 🚫 ELIMINADO:
 * - ❌ NotificationService legacy class (320+ líneas duplicadas)
 * - ❌ Browser notifications duplicadas  
 * - ❌ localStorage persistence duplicada
 * - ❌ Preferences management duplicado
 * - ❌ Mock implementations
 * 
 * ✅ AHORA USA:
 * - ✅ UnifiedNotificationSystem del api-server
 * - ✅ Multi-channel delivery (push, email, SMS, websocket)
 * - ✅ HIPAA compliance automático
 * - ✅ Audit logging centralizado
 * - ✅ Enterprise scalability
 * - ✅ Production-ready security
 * 
 * 📍 UBICACIÓN REAL: apps/api-server/src/notifications/UnifiedNotificationSystem.ts
 * 📍 WRAPPER: ./notificationServiceUnified.ts
 */

// ==================== PRODUCTION EXPORTS ====================

// Re-export únicamente del sistema unificado
export { 
  notificationServiceUnified as NotificationService,
  notificationServiceUnified as notificationService,
  notificationServiceUnified as default
} from './notificationServiceUnified';

// Re-export tipos para compatibilidad
/*
export type {
  NotificationTemplate,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus
} from './notificationServiceUnified';
*/

// ==================== DEPRECATED INTERFACES (READ ONLY) ====================

/**
 * @deprecated Use UnifiedNotificationSystem types instead
 * These interfaces are kept for read-only compatibility
 */
interface LegacyNotification {
  id: string;
  type: 'job_match' | 'application_update' | 'interview_scheduled' | 'offer_received' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

/**
 * @deprecated Use UnifiedNotificationSystem preferences instead
 */
interface LegacyNotificationPreferences {
  jobMatches: boolean;
  applicationUpdates: boolean;
  interviews: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  minMatchScore: number;
}

// Export legacy types for backward compatibility only
export type {
  LegacyNotification as Notification,
  LegacyNotificationPreferences as NotificationPreferences
};

// ==================== MIGRATION GUIDE ====================

/**
 * MIGRATION FROM LEGACY TO UNIFIED SYSTEM:
 * 
 * OLD CODE:
 * ```typescript
 * import { notificationService } from './services/notification.service.ts';
 * await notificationService.addNotification({...});
 * ```
 * 
 * NEW CODE:
 * ```typescript
 * import { notificationServiceUnified } from './servicesUnified.ts';
 * await notificationServiceUnified.addNotification({...});
 * ```
 * 
 * OR USE API DIRECTLY:
 * ```typescript
 * import { UnifiedNotificationSystem } from '@api-server/notifications/UnifiedNotificationSystem';
 * await UnifiedNotificationSystem.createNotification({...});
 * ```
 */