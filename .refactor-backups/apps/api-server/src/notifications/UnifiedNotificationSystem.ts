import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '../lib/firebase-admin';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase-admin/firestore';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  userType: 'patient' | 'doctor' | 'admin' | 'company' | 'staff';
  type: 'appointment_reminder' | 'telemedicine_confirmation' | 'medical_alert' | 'results_ready' | 'doctor_message' | 'system_alert' | 'payment_reminder' | 'prescription_ready' | 'lab_results' | 'emergency_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'unread' | 'read' | 'archived' | 'deleted';
  
  // Delivery channels
  channels: ('push' | 'email' | 'sms' | 'websocket')[];
  deliveryStatus?: {
    push?: 'pending' | 'sent' | 'delivered' | 'failed';
    email?: 'pending' | 'sent' | 'delivered' | 'failed';
    sms?: 'pending' | 'sent' | 'delivered' | 'failed';
    websocket?: 'pending' | 'sent' | 'delivered' | 'failed';
  };
  
  // Metadata and context
  metadata?: Record<string, any>;
  appointmentId?: string;
  sessionId?: string;
  prescriptionId?: string;
  
  // Actions
  actions?: NotificationAction[];
  
  // Scheduling
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string; // URL or action identifier
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationTemplate {
  id: string;
  type: string;
  name: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  variables: string[];
  defaultChannels: ('push' | 'email' | 'sms' | 'websocket')[];
  userTypes: ('patient' | 'doctor' | 'admin' | 'company' | 'staff')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
    websocket: boolean;
  };
  types: Record<string, {
    enabled: boolean;
    channels: ('push' | 'email' | 'sms' | 'websocket')[];
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  updatedAt: Date;
}

export interface BulkNotificationRequest {
  userIds: string[];
  templateId: string;
  variables: Record<string, string>;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  channels?: ('push' | 'email' | 'sms' | 'websocket')[];
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1),
  userType: z.enum(['patient', 'doctor', 'admin', 'company', 'staff']),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).default('medium'),
  channels: z.array(z.enum(['push', 'email', 'sms', 'websocket'])).default(['push']),
  metadata: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['button', 'link']),
    action: z.string(),
    style: z.enum(['primary', 'secondary', 'danger']).optional()
  })).optional()
});

export const UpdateNotificationSchema = z.object({
  status: z.enum(['unread', 'read', 'archived', 'deleted']).optional(),
  readAt: z.string().datetime().optional(),
  archivedAt: z.string().datetime().optional()
});

export const NotificationPreferencesSchema = z.object({
  preferences: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    websocket: z.boolean().default(true)
  }),
  types: z.record(z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['push', 'email', 'sms', 'websocket']))
  })).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string()
  }).optional()
});

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'appointment_reminder',
    name: 'Recordatorio de Cita',
    title: 'Recordatorio: Cita con {{doctorName}}',
    message: 'Su cita con {{doctorName}} está programada para {{appointmentDate}} a las {{appointmentTime}}.',
    priority: 'high',
    variables: ['doctorName', 'appointmentDate', 'appointmentTime'],
    defaultChannels: ['push', 'email'],
    userTypes: ['patient'],
    isActive: true
  },
  {
    type: 'telemedicine_confirmation',
    name: 'Confirmación Telemedicina',
    title: 'Sesión de Telemedicina Confirmada',
    message: 'Su sesión de telemedicina con {{doctorName}} ha sido confirmada para {{sessionDate}} a las {{sessionTime}}.',
    priority: 'high',
    variables: ['doctorName', 'sessionDate', 'sessionTime'],
    defaultChannels: ['push', 'email'],
    userTypes: ['patient', 'doctor'],
    isActive: true
  },
  {
    type: 'medical_alert',
    name: 'Alerta Médica',
    title: 'Alerta Médica - {{alertType}}',
    message: '{{alertMessage}}',
    priority: 'critical',
    variables: ['alertType', 'alertMessage'],
    defaultChannels: ['push', 'email', 'sms'],
    userTypes: ['patient', 'doctor'],
    isActive: true
  },
  {
    type: 'results_ready',
    name: 'Resultados Listos',
    title: 'Sus resultados están listos',
    message: 'Los resultados de {{testName}} ya están disponibles en su portal de paciente.',
    priority: 'high',
    variables: ['testName'],
    defaultChannels: ['push', 'email'],
    userTypes: ['patient'],
    isActive: true
  },
  {
    type: 'prescription_ready',
    name: 'Receta Lista',
    title: 'Su receta está lista',
    message: 'Su receta para {{medicationName}} está lista para retirar en {{pharmacyName}}.',
    priority: 'medium',
    variables: ['medicationName', 'pharmacyName'],
    defaultChannels: ['push', 'sms'],
    userTypes: ['patient'],
    isActive: true
  },
  {
    type: 'payment_reminder',
    name: 'Recordatorio de Pago',
    title: 'Recordatorio de Pago Pendiente',
    message: 'Tiene un pago pendiente de {{amount}} por su consulta del {{consultationDate}}.',
    priority: 'medium',
    variables: ['amount', 'consultationDate'],
    defaultChannels: ['push', 'email'],
    userTypes: ['patient'],
    isActive: true
  }
];

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

export const notificationConfig = {
  collections: {
    notifications: 'notifications',
    templates: 'notification_templates',
    preferences: 'notification_preferences'
  },
  
  delivery: {
    push: {
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      vapidKey: process.env.VAPID_PUBLIC_KEY,
      fcmServerKey: process.env.FCM_SERVER_KEY
    },
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      from: process.env.EMAIL_FROM || 'noreply@altamedica.com',
      apiKey: process.env.SENDGRID_API_KEY
    },
    sms: {
      enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
      provider: process.env.SMS_PROVIDER || 'twilio',
      from: process.env.SMS_FROM,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN
    },
    websocket: {
      enabled: process.env.WEBSOCKET_NOTIFICATIONS_ENABLED === 'true',
      endpoint: process.env.WEBSOCKET_ENDPOINT || 'ws://localhost:3001'
    }
  },
  
  limits: {
    maxNotificationsPerUser: 1000,
    maxBulkRecipients: 1000,
    retentionDays: 90
  }
};

// ============================================================================
// UNIFIED NOTIFICATION SERVICE
// ============================================================================

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private templates: Map<string, NotificationTemplate> = new Map();
  private templatesLoaded: boolean = false;

  constructor() {
    this.initializeTemplates();
  }

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  private async initializeTemplates() {
    if (this.templatesLoaded) return;
    
    try {
      // Load templates from Firebase
      const templatesRef = collection(adminDb, notificationConfig.collections.templates);
      const snapshot = await getDocs(templatesRef);
      
      if (snapshot.empty) {
        // Create default templates
        for (const template of DEFAULT_TEMPLATES) {
          await this.createTemplate(template);
        }
      } else {
        // Load existing templates
        snapshot.forEach(doc => {
          const template = { id: doc.id, ...doc.data() } as NotificationTemplate;
          this.templates.set(template.type, template);
        });
      }
      
      this.templatesLoaded = true;
    } catch (error) {
      logger.error('Failed to initialize notification templates:', undefined, error);
    }
  }

  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const template: Omit<NotificationTemplate, 'id'> = {
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(adminDb, notificationConfig.collections.templates), template);
    const fullTemplate = { id: docRef.id, ...template };
    this.templates.set(template.type, fullTemplate);
    
    return docRef.id;
  }

  async getTemplate(type: string): Promise<NotificationTemplate | null> {
    await this.initializeTemplates();
    return this.templates.get(type) || null;
  }

  // ============================================================================
  // NOTIFICATION CREATION
  // ============================================================================

  async createNotification(data: z.infer<typeof CreateNotificationSchema>): Promise<Notification> {
    const validatedData = CreateNotificationSchema.parse(data);
    
    // Check user notification preferences
    const preferences = await this.getUserPreferences(validatedData.userId);
    const channels = this.filterChannelsByPreferences(validatedData.channels, preferences, validatedData.type);

    const notification: Omit<Notification, 'id'> = {
      ...validatedData,
      channels,
      status: 'unread',
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(adminDb, notificationConfig.collections.notifications), {
      ...notification,
      scheduledFor: notification.scheduledFor ? Timestamp.fromDate(notification.scheduledFor) : null,
      expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const fullNotification = { id: docRef.id, ...notification };

    // Schedule delivery if not scheduled for later
    if (!validatedData.scheduledFor) {
      await this.deliverNotification(fullNotification);
    }

    return fullNotification;
  }

  async createNotificationFromTemplate(
    templateType: string, 
    userId: string, 
    variables: Record<string, string>,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
      channels?: ('push' | 'email' | 'sms' | 'websocket')[];
      scheduledFor?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    const template = await this.getTemplate(templateType);
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }

    // Replace variables in template
    const title = this.replaceVariables(template.title, variables);
    const message = this.replaceVariables(template.message, variables);

    // Get user type (this would typically come from user service)
    const userType = await this.getUserType(userId);

    return this.createNotification({
      userId,
      userType,
      type: template.type,
      title,
      message,
      priority: options?.priority || template.priority,
      channels: options?.channels || template.defaultChannels,
      scheduledFor: options?.scheduledFor?.toISOString(),
      metadata: options?.metadata
    });
  }

  async createBulkNotifications(request: BulkNotificationRequest): Promise<Notification[]> {
    if (request.userIds.length > notificationConfig.limits.maxBulkRecipients) {
      throw new Error(`Too many recipients. Maximum allowed: ${notificationConfig.limits.maxBulkRecipients}`);
    }

    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    const notifications: Notification[] = [];

    for (const userId of request.userIds) {
      try {
        const userType = await this.getUserType(userId);
        const notification = await this.createNotificationFromTemplate(
          request.templateId,
          userId,
          request.variables,
          {
            priority: request.priority,
            channels: request.channels,
            scheduledFor: request.scheduledFor,
            metadata: request.metadata
          }
        );
        notifications.push(notification);
      } catch (error) {
        logger.error(`Failed to create notification for user ${userId}:`, undefined, error);
      }
    }

    return notifications;
  }

  // ============================================================================
  // NOTIFICATION RETRIEVAL
  // ============================================================================

  async getNotification(notificationId: string): Promise<Notification | null> {
    const docRef = doc(adminDb, notificationConfig.collections.notifications, notificationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      scheduledFor: data.scheduledFor?.toDate(),
      sentAt: data.sentAt?.toDate(),
      readAt: data.readAt?.toDate(),
      archivedAt: data.archivedAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Notification;
  }

  async getUserNotifications(
    userId: string, 
    options: {
      status?: 'unread' | 'read' | 'archived';
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'priority' | 'readAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    let q = query(
      collection(adminDb, notificationConfig.collections.notifications),
      where('userId', '==', userId),
      where('status', '!=', 'deleted')
    );

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    // Add ordering
    const orderField = options.orderBy || 'createdAt';
    const orderDir = options.orderDirection || 'desc';
    q = query(q, orderBy(orderField, orderDir));

    // Add pagination
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate(),
        sentAt: data.sentAt?.toDate(),
        readAt: data.readAt?.toDate(),
        archivedAt: data.archivedAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Notification;
    });

    return {
      notifications,
      total: notifications.length
    };
  }

  // ============================================================================
  // NOTIFICATION UPDATES
  // ============================================================================

  async updateNotification(notificationId: string, updates: z.infer<typeof UpdateNotificationSchema>): Promise<Notification | null> {
    const validatedUpdates = UpdateNotificationSchema.parse(updates);
    
    const updateData: any = {
      ...validatedUpdates,
      updatedAt: serverTimestamp()
    };

    if (validatedUpdates.readAt) {
      updateData.readAt = Timestamp.fromDate(new Date(validatedUpdates.readAt));
    }
    if (validatedUpdates.archivedAt) {
      updateData.archivedAt = Timestamp.fromDate(new Date(validatedUpdates.archivedAt));
    }

    const docRef = doc(adminDb, notificationConfig.collections.notifications, notificationId);
    await updateDoc(docRef, updateData);

    return this.getNotification(notificationId);
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.updateNotification(notificationId, {
      status: 'read',
      readAt: new Date().toISOString()
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { notifications } = await this.getUserNotifications(userId, { status: 'unread' });
    
    const updatePromises = notifications.map(notification =>
      this.updateNotification(notification.id, {
        status: 'read',
        readAt: new Date().toISOString()
      })
    );

    await Promise.all(updatePromises);
    return notifications.length;
  }

  async archiveNotification(notificationId: string): Promise<Notification | null> {
    return this.updateNotification(notificationId, {
      status: 'archived',
      archivedAt: new Date().toISOString()
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.updateNotification(notificationId, {
      status: 'deleted'
    });
  }

  // ============================================================================
  // DELIVERY METHODS
  // ============================================================================

  private async deliverNotification(notification: Notification): Promise<void> {
    const deliveryPromises = notification.channels.map(channel => 
      this.deliverToChannel(notification, channel)
    );

    const results = await Promise.allSettled(deliveryPromises);
    
    // Update delivery status
    const deliveryStatus: any = {};
    results.forEach((result, index) => {
      const channel = notification.channels[index];
      deliveryStatus[channel] = result.status === 'fulfilled' ? 'delivered' : 'failed';
    });

    // Update notification with delivery status
    const docRef = doc(adminDb, notificationConfig.collections.notifications, notification.id);
    await updateDoc(docRef, {
      deliveryStatus,
      sentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  private async deliverToChannel(notification: Notification, channel: 'push' | 'email' | 'sms' | 'websocket'): Promise<boolean> {
    try {
      switch (channel) {
        case 'push':
          return await this.sendPushNotification(notification);
        case 'email':
          return await this.sendEmailNotification(notification);
        case 'sms':
          return await this.sendSMSNotification(notification);
        case 'websocket':
          return await this.sendWebSocketNotification(notification);
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Failed to deliver notification via ${channel}:`, undefined, error);
      return false;
    }
  }

  private async sendPushNotification(notification: Notification): Promise<boolean> {
    if (!notificationConfig.delivery.push.enabled) {
      logger.info('Push notifications disabled');
      return false;
    }

    // Implementation would integrate with FCM, WebPush, etc.
    logger.info('Sending push notification:', notification.title);
    return true;
  }

  private async sendEmailNotification(notification: Notification): Promise<boolean> {
    if (!notificationConfig.delivery.email.enabled) {
      logger.info('Email notifications disabled');
      return false;
    }

    // Implementation would integrate with SendGrid, SES, etc.
    logger.info('Sending email notification:', notification.title);
    return true;
  }

  private async sendSMSNotification(notification: Notification): Promise<boolean> {
    if (!notificationConfig.delivery.sms.enabled) {
      logger.info('SMS notifications disabled');
      return false;
    }

    // Implementation would integrate with Twilio, AWS SNS, etc.
    logger.info('Sending SMS notification:', notification.title);
    return true;
  }

  private async sendWebSocketNotification(notification: Notification): Promise<boolean> {
    if (!notificationConfig.delivery.websocket.enabled) {
      logger.info('WebSocket notifications disabled');
      return false;
    }

    // Implementation would integrate with Socket.IO
    logger.info('Sending WebSocket notification:', notification.title);
    return true;
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    const docRef = doc(adminDb, notificationConfig.collections.preferences, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Return default preferences
      return {
        userId,
        preferences: {
          push: true,
          email: true,
          sms: false,
          websocket: true
        },
        types: {},
        updatedAt: new Date()
      };
    }

    const data = docSnap.data();
    return {
      userId,
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as NotificationPreferences;
  }

  async updateUserPreferences(userId: string, preferences: z.infer<typeof NotificationPreferencesSchema>): Promise<NotificationPreferences> {
    const validatedPreferences = NotificationPreferencesSchema.parse(preferences);
    
    const docRef = doc(adminDb, notificationConfig.collections.preferences, userId);
    const updateData = {
      ...validatedPreferences,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);

    return {
      userId,
      ...validatedPreferences,
      updatedAt: new Date()
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  private filterChannelsByPreferences(
    channels: ('push' | 'email' | 'sms' | 'websocket')[],
    preferences: NotificationPreferences | null,
    notificationType: string
  ): ('push' | 'email' | 'sms' | 'websocket')[] {
    if (!preferences) return channels;

    // Apply global preferences
    let filteredChannels = channels.filter(channel => preferences.preferences[channel]);

    // Apply type-specific preferences
    if (preferences.types[notificationType]) {
      const typePrefs = preferences.types[notificationType];
      if (typePrefs.enabled) {
        filteredChannels = filteredChannels.filter(channel => 
          typePrefs.channels.includes(channel)
        );
      } else {
        filteredChannels = [];
      }
    }

    return filteredChannels;
  }

  private async getUserType(userId: string): Promise<'patient' | 'doctor' | 'admin' | 'company' | 'staff'> {
    // This would typically query the user service or database
    // For now, returning a default value
    return 'patient';
  }

  // ============================================================================
  // CLEANUP METHODS
  // ============================================================================

  async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date();
    const expiredQuery = query(
      collection(adminDb, notificationConfig.collections.notifications),
      where('expiresAt', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(expiredQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return snapshot.docs.length;
  }

  async cleanupOldNotifications(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - notificationConfig.limits.retentionDays);

    const oldQuery = query(
      collection(adminDb, notificationConfig.collections.notifications),
      where('createdAt', '<=', Timestamp.fromDate(cutoffDate)),
      where('status', 'in', ['read', 'archived', 'deleted'])
    );

    const snapshot = await getDocs(oldQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return snapshot.docs.length;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const notificationService = UnifiedNotificationService.getInstance();
export default notificationService;