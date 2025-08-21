/**
import { logger } from '@altamedica/shared/services/logger.service';

 * 📢 UNIFIED NOTIFICATION SERVICE WRAPPER - ALTAMEDICA
 * Wrapper que mantiene compatibilidad con notification.service.ts legacy
 * pero usa el UnifiedNotificationSystem del backend
 *
 * Funcionalidades:
 * - Browser notifications (push)
 * - Job match notifications con templates
 * - Application updates con templates
 * - Interview scheduling con templates
 * - Preferences management
 * - Multi-channel delivery (push, email, SMS, websocket)
 * - HIPAA compliance integrado
 * - Delivery tracking y audit logging
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== INTERFACES ====================

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

interface LegacyNotificationPreferences {
  jobMatches: boolean;
  applicationUpdates: boolean;
  interviews: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  minMatchScore: number;
}

interface UnifiedNotificationPayload {
  userId: string;
  userType: 'doctor';
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  channels: ('push' | 'email' | 'sms' | 'websocket')[];
  metadata?: Record<string, any>;
  actions?: Array<{
    id: string;
    label: string;
    type: 'button' | 'link';
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// ==================== UNIFIED NOTIFICATION SERVICE ====================

class UnifiedNotificationServiceWrapper {
  private notifications: LegacyNotification[] = [];
  private preferences: LegacyNotificationPreferences;
  private listeners: ((notifications: LegacyNotification[]) => void)[] = [];
  private permission: NotificationPermission = 'default';

  // User authentication
  private user: any = null;
  private token: string | null = null;

  constructor() {
    // Cargar preferencias guardadas (backward compatibility)
    const savedPrefs = localStorage.getItem('notificationPreferences');
    this.preferences = savedPrefs
      ? JSON.parse(savedPrefs)
      : {
          jobMatches: true,
          applicationUpdates: true,
          interviews: true,
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          minMatchScore: 80,
        };

    // Cargar notificaciones guardadas (legacy)
    const savedNotifications = localStorage.getItem('notifications');
    this.notifications = savedNotifications ? JSON.parse(savedNotifications) : [];

    // Solicitar permisos de notificación del navegador
    this.requestNotificationPermission();

    // Inicializar usuario
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      // En un entorno real, esto vendría del hook useAuth
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData);
        this.user = auth.user;
        this.token = auth.token;
      }
    } catch (error) {
      logger.warn('Could not initialize user for notifications:', error);
    }
  }

  // ==================== CORE NOTIFICATION METHODS ====================

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    } else if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async addNotification(notification: Omit<LegacyNotification, 'id' | 'read' | 'createdAt'>) {
    // Crear notificación legacy para backward compatibility
    const newNotification: LegacyNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifyListeners();

    // Enviar al UnifiedNotificationSystem si hay usuario autenticado
    if (this.user && this.token) {
      try {
        await this.sendToUnifiedSystem(notification);
      } catch (error) {
        logger.error('Error sending to UnifiedNotificationSystem:', error);
      }
    }

    // Mostrar notificación del navegador si está permitido
    if (this.shouldShowPushNotification(notification.type)) {
      this.showPushNotification(newNotification);
    }

    return newNotification;
  }

  private async sendToUnifiedSystem(
    notification: Omit<LegacyNotification, 'id' | 'read' | 'createdAt'>,
  ) {
    if (!this.user || !this.token) return;

    // Mapear notificación legacy a formato unificado
    const unifiedPayload: UnifiedNotificationPayload = {
      userId: this.user.uid,
      userType: 'doctor',
      type: this.mapLegacyTypeToUnified(notification.type),
      title: notification.title,
      message: notification.message,
      priority:
        notification.priority === 'high'
          ? 'high'
          : notification.priority === 'medium'
            ? 'medium'
            : 'low',
      channels: this.getChannelsForType(notification.type),
      metadata: notification.data || {},
    };

    if (notification.actionUrl && notification.actionText) {
      unifiedPayload.actions = [
        {
          id: 'primary',
          label: notification.actionText,
          type: 'link',
          action: notification.actionUrl,
          style: 'primary',
        },
      ];
    }

    // Enviar al backend
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(unifiedPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification to unified system: ${response.status}`);
    }

    return await response.json();
  }

  private mapLegacyTypeToUnified(legacyType: LegacyNotification['type']): string {
    const typeMap = {
      job_match: 'doctor_job_match',
      application_update: 'doctor_application_update',
      interview_scheduled: 'doctor_interview_scheduled',
      offer_received: 'doctor_offer_received',
      system: 'system_alert',
    };
    return typeMap[legacyType] || 'system_alert';
  }

  private getChannelsForType(
    type: LegacyNotification['type'],
  ): ('push' | 'email' | 'sms' | 'websocket')[] {
    const channels: ('push' | 'email' | 'sms' | 'websocket')[] = ['websocket'];

    if (this.preferences.pushNotifications) {
      channels.push('push');
    }

    if (this.preferences.emailNotifications) {
      channels.push('email');
    }

    if (this.preferences.smsNotifications) {
      channels.push('sms');
    }

    return channels;
  }

  // ==================== BROWSER NOTIFICATION METHODS ====================

  private shouldShowPushNotification(type: LegacyNotification['type']): boolean {
    if (!this.preferences.pushNotifications || this.permission !== 'granted') {
      return false;
    }

    switch (type) {
      case 'job_match':
        return this.preferences.jobMatches;
      case 'application_update':
      case 'interview_scheduled':
      case 'offer_received':
        return this.preferences.applicationUpdates;
      default:
        return true;
    }
  }

  private showPushNotification(notification: LegacyNotification) {
    if ('Notification' in window && this.permission === 'granted') {
      const pushNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/altamedica-icon.png',
        badge: '/icons/altamedica-badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high',
        data: {
          url: notification.actionUrl,
        },
      });

      pushNotif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        pushNotif.close();
      };
    }
  }

  // ==================== CRUD METHODS ====================

  markAsRead(notificationId: string) {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();

      // Marcar como leída en el sistema unificado
      if (this.user && this.token) {
        this.markAsReadInUnifiedSystem(notificationId).catch(console.error);
      }
    }
  }

  private async markAsReadInUnifiedSystem(notificationId: string) {
    if (!this.token) return;

    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      logger.error('Error marking notification as read in unified system:', error);
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
    this.notifyListeners();

    // Marcar todas como leídas en el sistema unificado
    if (this.user && this.token) {
      this.markAllAsReadInUnifiedSystem().catch(console.error);
    }
  }

  private async markAllAsReadInUnifiedSystem() {
    if (!this.token) return;

    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      logger.error('Error marking all notifications as read in unified system:', error);
    }
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  // ==================== GETTERS ====================

  getNotifications(): LegacyNotification[] {
    return [...this.notifications];
  }

  getUnreadNotifications(): LegacyNotification[] {
    return this.notifications.filter((n) => !n.read);
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  // ==================== SUBSCRIPTION METHODS ====================

  subscribe(listener: (notifications: LegacyNotification[]) => void) {
    this.listeners.push(listener);
    // Notificar inmediatamente con el estado actual
    listener(this.getNotifications());
  }

  unsubscribe(listener: (notifications: LegacyNotification[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getNotifications()));
  }

  // ==================== PERSISTENCE ====================

  private saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  updatePreferences(preferences: Partial<LegacyNotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));

    // Actualizar preferencias en el sistema unificado
    if (this.user && this.token) {
      this.updatePreferencesInUnifiedSystem(preferences).catch(console.error);
    }
  }

  private async updatePreferencesInUnifiedSystem(
    preferences: Partial<LegacyNotificationPreferences>,
  ) {
    if (!this.token) return;

    try {
      // Mapear preferencias legacy a formato unificado
      const unifiedPreferences = {
        preferences: {
          push: preferences.pushNotifications ?? this.preferences.pushNotifications,
          email: preferences.emailNotifications ?? this.preferences.emailNotifications,
          sms: preferences.smsNotifications ?? this.preferences.smsNotifications,
          websocket: true, // Siempre habilitado
        },
        types: {
          doctor_job_match: {
            enabled: preferences.jobMatches ?? this.preferences.jobMatches,
            channels: this.getChannelsForType('job_match'),
          },
          doctor_application_update: {
            enabled: preferences.applicationUpdates ?? this.preferences.applicationUpdates,
            channels: this.getChannelsForType('application_update'),
          },
          doctor_interview_scheduled: {
            enabled: preferences.interviews ?? this.preferences.interviews,
            channels: this.getChannelsForType('interview_scheduled'),
          },
        },
      };

      await fetch(`${API_BASE_URL}/api/v1/notifications/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(unifiedPreferences),
      });
    } catch (error) {
      logger.error('Error updating preferences in unified system:', error);
    }
  }

  getPreferences(): LegacyNotificationPreferences {
    return { ...this.preferences };
  }

  // ==================== SPECIALIZED NOTIFICATION METHODS ====================

  notifyJobMatch(job: {
    id: string;
    title: string;
    company: string;
    matchScore: number;
    salary?: string;
  }) {
    if (!this.preferences.jobMatches) return;
    if (job.matchScore < this.preferences.minMatchScore) return;

    this.addNotification({
      type: 'job_match',
      title: '¡Nueva oportunidad laboral!',
      message: `${job.title} en ${job.company} (${job.matchScore}% de compatibilidad)`,
      priority: job.matchScore >= 90 ? 'high' : 'medium',
      actionUrl: `/marketplace/listings/${job.id}`,
      actionText: 'Ver oferta',
      data: { jobId: job.id, matchScore: job.matchScore },
    });
  }

  notifyApplicationUpdate(application: {
    jobId: string;
    jobTitle: string;
    company: string;
    status: string;
  }) {
    if (!this.preferences.applicationUpdates) return;

    const statusMessages = {
      viewed: 'Tu aplicación ha sido vista',
      interview: '¡Has sido seleccionado para una entrevista!',
      accepted: '¡Felicidades! Tu aplicación ha sido aceptada',
      rejected: 'Tu aplicación no ha sido seleccionada',
    };

    this.addNotification({
      type: 'application_update',
      title:
        statusMessages[application.status as keyof typeof statusMessages] ||
        'Actualización de aplicación',
      message: `${application.jobTitle} en ${application.company}`,
      priority:
        application.status === 'interview' || application.status === 'accepted' ? 'high' : 'medium',
      actionUrl: `/marketplace/applications`,
      actionText: 'Ver aplicaciones',
      data: { jobId: application.jobId, status: application.status },
    });
  }

  notifyInterviewScheduled(interview: {
    jobId: string;
    jobTitle: string;
    company: string;
    date: string;
    time: string;
    type: 'video' | 'phone' | 'in-person';
  }) {
    if (!this.preferences.interviews) return;

    this.addNotification({
      type: 'interview_scheduled',
      title: 'Entrevista programada',
      message: `${interview.jobTitle} en ${interview.company} - ${new Date(interview.date).toLocaleDateString('es-ES')} a las ${interview.time}`,
      priority: 'high',
      actionUrl: `/marketplace/applications`,
      actionText: 'Ver detalles',
      data: interview,
    });
  }

  // ==================== CLEANUP METHODS ====================

  cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.notifications = this.notifications.filter((n) => new Date(n.createdAt) > thirtyDaysAgo);
    this.saveNotifications();
    this.notifyListeners();
  }

  // ==================== SYNC WITH UNIFIED SYSTEM ====================

  async syncWithUnifiedSystem() {
    if (!this.user || !this.token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications?status=unread&limit=50`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const unifiedNotifications = await response.json();

        // Convertir notificaciones unificadas a formato legacy
        const legacyNotifications = unifiedNotifications.data.map((n: any) => ({
          id: n.id,
          type: this.mapUnifiedTypeToLegacy(n.type),
          title: n.title,
          message: n.message,
          read: n.status === 'read',
          createdAt: n.createdAt,
          priority:
            n.priority === 'urgent' || n.priority === 'critical'
              ? 'high'
              : n.priority === 'high'
                ? 'medium'
                : 'low',
          actionUrl: n.actions?.[0]?.action,
          actionText: n.actions?.[0]?.label,
          data: n.metadata,
        }));

        // Merge con notificaciones locales
        this.mergeNotifications(legacyNotifications);
      }
    } catch (error) {
      logger.error('Error syncing with unified system:', error);
    }
  }

  private mapUnifiedTypeToLegacy(unifiedType: string): LegacyNotification['type'] {
    const typeMap: Record<string, LegacyNotification['type']> = {
      doctor_job_match: 'job_match',
      doctor_application_update: 'application_update',
      doctor_interview_scheduled: 'interview_scheduled',
      doctor_offer_received: 'offer_received',
      system_alert: 'system',
    };
    return typeMap[unifiedType] || 'system';
  }

  private mergeNotifications(unifiedNotifications: LegacyNotification[]) {
    const existingIds = new Set(this.notifications.map((n) => n.id));
    const newNotifications = unifiedNotifications.filter((n) => !existingIds.has(n.id));

    if (newNotifications.length > 0) {
      this.notifications = [...newNotifications, ...this.notifications];
      this.saveNotifications();
      this.notifyListeners();
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const notificationServiceUnified = new UnifiedNotificationServiceWrapper();

// Backward compatibility - export the unified service as the legacy service
export { notificationServiceUnified as notificationService };

export default notificationServiceUnified;
