export interface Notification {
  id: string;
  userId: string;
  type: 'appointment-reminder' | 'medical-alert' | 'telemedicine-ready' | 'prescription-ready' | 'system-update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  channels: ('push' | 'email' | 'sms' | 'in-app')[];
  metadata?: {
    appointmentId?: string;
    sessionId?: string;
    prescriptionId?: string;
    actionUrl?: string;
    expiresAt?: Date;
  };
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  type: Notification['type'];
  title: string;
  template: string;
  variables: string[];
  defaultChannels: Notification['channels'];
  isActive: boolean;
}