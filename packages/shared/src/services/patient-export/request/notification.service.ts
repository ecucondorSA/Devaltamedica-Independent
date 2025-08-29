import { getFirebaseFirestore } from '@altamedica/firebase/client';
import {
  ExportRequest,
  NotificationType,
  RequestNotification,
  RequestPriority
} from './types';
import { logger } from '../../logger.service';

/**
 * Request Notification Service
 * Handles notifications for export request lifecycle events
 * Extracted from lines 1199-1202 of original PatientDataExportService
 * Enhanced with comprehensive notification management and delivery
 */

export class RequestNotificationService {
  private readonly db = getFirebaseFirestore();
  private readonly notificationsCollection = 'request_notifications';
  private readonly usersCollection = 'users';

  private readonly notificationTemplates: Record<NotificationType, NotificationTemplate> = {
    [NotificationType.REQUEST_CREATED]: {
      subject: 'Export Request Created',
      template: 'Your export request for patient {{patientName}} has been created and is being processed.',
      priority: RequestPriority.NORMAL,
    },
    [NotificationType.PROCESSING_STARTED]: {
      subject: 'Export Processing Started',
      template: 'Processing has started for your export request ({{requestId}}). Estimated completion: {{estimatedCompletion}}.',
      priority: RequestPriority.NORMAL,
    },
    [NotificationType.PROGRESS_UPDATE]: {
      subject: 'Export Progress Update',
      template: 'Export progress: {{progress}}% complete. Current stage: {{stage}}.',
      priority: RequestPriority.LOW,
    },
    [NotificationType.COMPLETED]: {
      subject: 'Export Request Completed',
      template: 'Your export request is now ready for download. File size: {{fileSize}}. Download expires in 24 hours.',
      priority: RequestPriority.HIGH,
    },
    [NotificationType.FAILED]: {
      subject: 'Export Request Failed',
      template: 'Unfortunately, your export request failed to complete. Reason: {{errorMessage}}. Please contact support if this persists.',
      priority: RequestPriority.HIGH,
    },
    [NotificationType.CANCELLED]: {
      subject: 'Export Request Cancelled',
      template: 'Your export request has been cancelled. Reason: {{reason}}.',
      priority: RequestPriority.NORMAL,
    },
    [NotificationType.APPROVED]: {
      subject: 'Export Request Approved',
      template: 'Your export request has been approved and will begin processing shortly.',
      priority: RequestPriority.NORMAL,
    },
    [NotificationType.REJECTED]: {
      subject: 'Export Request Rejected',
      template: 'Your export request has been rejected. Reason: {{reason}}. Please contact support for assistance.',
      priority: RequestPriority.HIGH,
    },
  };

  /**
   * Send notification for request event
   */
  async sendRequestNotification(
    request: ExportRequest,
    type: NotificationType,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      logger.info(`Sending ${type} notification for request ${request.id}`, 'RequestNotification');

      // Get user notification preferences
      const userPreferences = await this.getUserNotificationPreferences(request.requestedBy);

      if (!this.shouldSendNotification(type, userPreferences)) {
        logger.info('Notification skipped due to user preferences', 'RequestNotification');
        return;
      }

      // Create notification
      const notification = await this.createNotification(request, type, additionalData);

      // Send via enabled channels
      await this.deliverNotification(notification, userPreferences);

      // Store notification record
      await this.storeNotificationRecord(notification);

      logger.info(`Notification sent successfully: ${type}`, 'RequestNotification');
    } catch (error) {
      logger.error(`Failed to send ${type} notification`, 'RequestNotification', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    requests: ExportRequest[],
    type: NotificationType,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      logger.info(`Sending bulk ${type} notifications for ${requests.length} requests`, 'RequestNotification');

      const notifications = await Promise.allSettled(
        requests.map(request =>
          this.sendRequestNotification(request, type, additionalData)
        )
      );

      const successCount = notifications.filter(result => result.status === 'fulfilled').length;
      const failureCount = notifications.length - successCount;

      logger.info(`Bulk notifications completed: ${successCount} sent, ${failureCount} failed`, 'RequestNotification');
    } catch (error) {
      logger.error('Bulk notification sending failed', 'RequestNotification', error);
    }
  }

  /**
   * Send progress update notification
   */
  async sendProgressUpdate(
    request: ExportRequest,
    progress: number,
    stage: string,
    estimatedTimeRemaining?: number
  ): Promise<void> {
    // Only send progress updates at significant milestones
    if (this.shouldSendProgressUpdate(progress)) {
      await this.sendRequestNotification(request, NotificationType.PROGRESS_UPDATE, {
        progress: Math.round(progress),
        stage,
        estimatedTimeRemaining,
      });
    }
  }

  /**
   * Send completion notification with download details
   */
  async sendCompletionNotification(
    request: ExportRequest,
    downloadUrl: string,
    fileSize: number,
    expiresAt: Date
  ): Promise<void> {
    await this.sendRequestNotification(request, NotificationType.COMPLETED, {
      downloadUrl,
      fileSize: this.formatFileSize(fileSize),
      expiresAt: expiresAt.toLocaleString(),
      downloadExpiry: '24 hours',
    });
  }

  /**
   * Send failure notification with error details
   */
  async sendFailureNotification(
    request: ExportRequest,
    errorMessage: string,
    retryPossible: boolean = false
  ): Promise<void> {
    await this.sendRequestNotification(request, NotificationType.FAILED, {
      errorMessage,
      retryPossible,
      supportEmail: 'soporte@altamedica.com',
    });
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
    try {
      const userDoc = await this.db.collection(this.usersCollection).doc(userId).get();

      if (!userDoc.exists) {
        return this.getDefaultNotificationPreferences();
      }

      const userData = userDoc.data();
      return userData?.notificationPreferences || this.getDefaultNotificationPreferences();
    } catch (error) {
      logger.warn(`Failed to get preferences for user ${userId}`, 'RequestNotification', error);
      return this.getDefaultNotificationPreferences();
    }
  }

  /**
   * Create notification object
   */
  private async createNotification(
    request: ExportRequest,
    type: NotificationType,
    additionalData: Record<string, any>
  ): Promise<RequestNotification> {
    const template = this.notificationTemplates[type];
    const templateData = {
      ...additionalData,
      requestId: request.id,
      patientId: request.patientId,
      patientName: await this.getPatientName(request.patientId),
      requestedBy: request.requestedBy,
      createdAt: request.createdAt.toLocaleString(),
      estimatedCompletion: request.estimatedCompletionAt?.toLocaleString() || 'Unknown',
    };

    return {
      type,
      recipient: request.requestedBy,
      subject: this.interpolateTemplate(template.subject, templateData),
      message: this.interpolateTemplate(template.template, templateData),
      priority: template.priority,
      metadata: {
        requestId: request.id,
        patientId: request.patientId,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    };
  }

  /**
   * Deliver notification via available channels
   */
  private async deliverNotification(
    notification: RequestNotification,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const deliveryPromises: Promise<void>[] = [];

    // Email notifications
    if (preferences.email.enabled && this.shouldSendViaEmail(notification.type, preferences)) {
      deliveryPromises.push(this.sendEmailNotification(notification));
    }

    // Web push notifications
    if (preferences.webPush.enabled && this.shouldSendViaWebPush(notification.type, preferences)) {
      deliveryPromises.push(this.sendWebPushNotification(notification));
    }

    // SMS notifications (for urgent notifications only)
    if (preferences.sms.enabled && notification.priority === RequestPriority.URGENT) {
      deliveryPromises.push(this.sendSMSNotification(notification));
    }

    // In-app notifications
    if (preferences.inApp.enabled) {
      deliveryPromises.push(this.sendInAppNotification(notification));
    }

    // Wait for all deliveries (don't fail if some channels fail)
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: RequestNotification): Promise<void> {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      logger.info(`Email notification sent to ${notification.recipient}`, 'RequestNotification');

      // Mock implementation - replace with actual email service
      await this.mockEmailDelivery(notification);
    } catch (error) {
      logger.error('Email delivery failed', 'RequestNotification', error);
    }
  }

  /**
   * Send web push notification
   */
  private async sendWebPushNotification(notification: RequestNotification): Promise<void> {
    try {
      // This would integrate with web push service
      logger.info(`Web push notification sent to ${notification.recipient}`, 'RequestNotification');

      // Mock implementation
      await this.mockWebPushDelivery(notification);
    } catch (error) {
      logger.error('Web push delivery failed', 'RequestNotification', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: RequestNotification): Promise<void> {
    try {
      // This would integrate with SMS service (Twilio, AWS SNS, etc.)
      logger.info(`SMS notification sent to ${notification.recipient}`, 'RequestNotification');

      // Mock implementation
      await this.mockSMSDelivery(notification);
    } catch (error) {
      logger.error('SMS delivery failed', 'RequestNotification', error);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: RequestNotification): Promise<void> {
    try {
      // Store in database for in-app display
      const inAppNotification = {
        userId: notification.recipient,
        type: notification.type,
        title: notification.subject,
        message: notification.message,
        read: false,
        createdAt: new Date(),
        metadata: notification.metadata,
      };

      await this.db.collection('in_app_notifications').add(inAppNotification);
      logger.info(`In-app notification stored for ${notification.recipient}`, 'RequestNotification');
    } catch (error) {
      logger.error('In-app notification storage failed', 'RequestNotification', error);
    }
  }

  /**
   * Store notification record for audit
   */
  private async storeNotificationRecord(notification: RequestNotification): Promise<void> {
    try {
      const record = {
        ...notification,
        sentAt: new Date(),
        deliveryStatus: 'sent',
      };

      await this.db.collection(this.notificationsCollection).add(record);
    } catch (error) {
      logger.error('Failed to store notification record', 'RequestNotification', error);
    }
  }

  /**
   * Interpolate template with data
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    type: NotificationType,
    preferences: UserNotificationPreferences
  ): boolean {
    // Always send critical notifications
    if (this.isCriticalNotification(type)) {
      return true;
    }

    // Check user preferences for non-critical notifications
    return preferences.types[type] !== false;
  }

  /**
   * Check if progress update should be sent
   */
  private shouldSendProgressUpdate(progress: number): boolean {
    // Send updates at 25%, 50%, 75%, and 90%
    const milestones = [25, 50, 75, 90];
    return milestones.some(milestone =>
      Math.abs(progress - milestone) < 1
    );
  }

  /**
   * Check if notification is critical
   */
  private isCriticalNotification(type: NotificationType): boolean {
    return [
      NotificationType.COMPLETED,
      NotificationType.FAILED,
      NotificationType.REJECTED
    ].includes(type);
  }

  /**
   * Determine if notification should be sent via email
   */
  private shouldSendViaEmail(
    type: NotificationType,
    preferences: UserNotificationPreferences
  ): boolean {
    return preferences.email.types.includes(type);
  }

  /**
   * Determine if notification should be sent via web push
   */
  private shouldSendViaWebPush(
    type: NotificationType,
    preferences: UserNotificationPreferences
  ): boolean {
    return preferences.webPush.types.includes(type);
  }

  /**
   * Get patient name for notifications
   */
  private async getPatientName(patientId: string): Promise<string> {
    try {
      const patientDoc = await this.db.collection('patients').doc(patientId).get();

      if (!patientDoc.exists) {
        return 'Unknown Patient';
      }

      const patient = patientDoc.data();
      return `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown Patient';
    } catch (error) {
      logger.warn(`Failed to get patient name for ${patientId}`, 'RequestNotification', error);
      return 'Unknown Patient';
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get default notification preferences
   */
  private getDefaultNotificationPreferences(): UserNotificationPreferences {
    return {
      email: {
        enabled: true,
        types: [
          NotificationType.COMPLETED,
          NotificationType.FAILED,
          NotificationType.REQUEST_CREATED,
        ],
      },
      webPush: {
        enabled: true,
        types: [
          NotificationType.COMPLETED,
          NotificationType.FAILED,
          NotificationType.PROGRESS_UPDATE,
        ],
      },
      sms: {
        enabled: false,
        types: [],
      },
      inApp: {
        enabled: true,
        types: Object.values(NotificationType),
      },
      types: Object.values(NotificationType).reduce((acc, type) => {
        acc[type] = true;
        return acc;
      }, {} as Record<NotificationType, boolean>),
    };
  }

  /**
   * Mock email delivery (replace with actual service)
   */
  private async mockEmailDelivery(notification: RequestNotification): Promise<void> {
    // Simulate email delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock web push delivery (replace with actual service)
   */
  private async mockWebPushDelivery(notification: RequestNotification): Promise<void> {
    // Simulate web push delivery delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Mock SMS delivery (replace with actual service)
   */
  private async mockSMSDelivery(notification: RequestNotification): Promise<void> {
    // Simulate SMS delivery delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Supporting interfaces
interface NotificationTemplate {
  subject: string;
  template: string;
  priority: RequestPriority;
}

interface UserNotificationPreferences {
  email: {
    enabled: boolean;
    types: NotificationType[];
  };
  webPush: {
    enabled: boolean;
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
  };
  types: Record<NotificationType, boolean>;
}

// Export singleton instance
export const requestNotificationService = new RequestNotificationService();
