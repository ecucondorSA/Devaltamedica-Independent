import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { app } from '../app';
import { createTestDatabase, clearTestDatabase } from './test-utils';

// Mock de servicios externos
jest.mock('../services/notificationService', () => ({
  NotificationService: {
    sendNotification: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsArchived: jest.fn(),
    deleteNotification: jest.fn(),
    updateSettings: jest.fn(),
    getSettings: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteAllArchived: jest.fn(),
  },
}));

jest.mock('../services/emailService', () => ({
  EmailService: {
    sendEmail: jest.fn(),
  },
}));

jest.mock('../services/smsService', () => ({
  SMSService: {
    sendSMS: jest.fn(),
  },
}));

jest.mock('../services/pushService', () => ({
  PushService: {
    sendPushNotification: jest.fn(),
  },
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = {
      id: '1',
      email: 'test@example.com',
      role: 'patient',
    };
    next();
  }),
}));

jest.mock('../middleware/hipaa', () => ({
  logHIPAAEvent: jest.fn((req, res, next) => next()),
}));

describe('Notifications API Endpoints', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestDatabase(testDb);
  });

  describe('GET /api/v1/notifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: 'appointment',
          priority: 'high',
          title: 'Nueva cita programada',
          message: 'Tu cita ha sido programada para mañana',
          timestamp: '2024-01-15T10:00:00Z',
          read: false,
          archived: false,
          channels: [
            { type: 'email', sent: true, sentAt: '2024-01-15T10:00:00Z' },
            { type: 'push', sent: true, sentAt: '2024-01-15T10:00:00Z' },
          ],
        },
        {
          id: '2',
          type: 'telemedicine',
          priority: 'normal',
          title: 'Sesión de telemedicina',
          message: 'Tu sesión de telemedicina comenzará en 5 minutos',
          timestamp: '2024-01-15T09:30:00Z',
          read: true,
          archived: false,
          channels: [
            { type: 'in_app', sent: true, sentAt: '2024-01-15T09:30:00Z' },
          ],
        },
      ];

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { notifications: mockNotifications },
        timestamp: expect.any(String),
      });

      expect(NotificationService.getNotifications).toHaveBeenCalledWith('1');
    });

    it('should filter notifications by type', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: 'appointment',
          title: 'Nueva cita programada',
          message: 'Tu cita ha sido programada',
          timestamp: '2024-01-15T10:00:00Z',
          read: false,
          archived: false,
        },
      ];

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/v1/notifications?type=appointment')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { notifications: mockNotifications },
        timestamp: expect.any(String),
      });

      expect(NotificationService.getNotifications).toHaveBeenCalledWith('1', { type: 'appointment' });
    });

    it('should filter notifications by read status', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: 'appointment',
          title: 'Nueva cita programada',
          message: 'Tu cita ha sido programada',
          timestamp: '2024-01-15T10:00:00Z',
          read: false,
          archived: false,
        },
      ];

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { notifications: mockNotifications },
        timestamp: expect.any(String),
      });

      expect(NotificationService.getNotifications).toHaveBeenCalledWith('1', { read: false });
    });

    it('should handle empty notifications list', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { notifications: [] },
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/notifications', () => {
    it('should create and send notification', async () => {
      const mockNotification = {
        id: '1',
        type: 'appointment',
        priority: 'high',
        title: 'Nueva cita programada',
        message: 'Tu cita ha sido programada para mañana',
        timestamp: '2024-01-15T10:00:00Z',
        read: false,
        archived: false,
        channels: [
          { type: 'email', sent: true, sentAt: '2024-01-15T10:00:00Z' },
          { type: 'push', sent: true, sentAt: '2024-01-15T10:00:00Z' },
        ],
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.sendNotification as any).mockResolvedValue(mockNotification);

      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'appointment',
          priority: 'high',
          title: 'Nueva cita programada',
          message: 'Tu cita ha sido programada para mañana',
          channels: ['email', 'push'],
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockNotification,
        message: 'Notificación enviada exitosamente',
        timestamp: expect.any(String),
      });

      expect(NotificationService.sendNotification).toHaveBeenCalledWith('1', {
        type: 'appointment',
        priority: 'high',
        title: 'Nueva cita programada',
        message: 'Tu cita ha sido programada para mañana',
        channels: ['email', 'push'],
      });
    });

    it('should validate notification data', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'invalid',
          title: '',
          message: '',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Datos de notificación inválidos',
        timestamp: expect.any(String),
      });
    });

    it('should validate notification type', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'invalid_type',
          title: 'Test notification',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Tipo de notificación no válido',
        timestamp: expect.any(String),
      });
    });

    it('should validate priority level', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'appointment',
          priority: 'invalid_priority',
          title: 'Test notification',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Nivel de prioridad no válido',
        timestamp: expect.any(String),
      });
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: '1',
        read: true,
        readAt: '2024-01-15T10:30:00Z',
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.markAsRead as any).mockResolvedValue(mockNotification);

      const response = await request(app)
        .patch('/api/v1/notifications/1/read')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockNotification,
        message: 'Notificación marcada como leída',
        timestamp: expect.any(String),
      });

      expect(NotificationService.markAsRead).toHaveBeenCalledWith('1', '1');
    });

    it('should handle non-existent notification', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.markAsRead as any).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/notifications/999/read')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Notificación no encontrada',
        timestamp: expect.any(String),
      });
    });
  });

  describe('PATCH /api/v1/notifications/:id/archive', () => {
    it('should archive notification', async () => {
      const mockNotification = {
        id: '1',
        archived: true,
        archivedAt: '2024-01-15T10:30:00Z',
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.markAsArchived as any).mockResolvedValue(mockNotification);

      const response = await request(app)
        .patch('/api/v1/notifications/1/archive')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockNotification,
        message: 'Notificación archivada',
        timestamp: expect.any(String),
      });

      expect(NotificationService.markAsArchived).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.deleteNotification as any).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/notifications/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Notificación eliminada exitosamente',
        timestamp: expect.any(String),
      });

      expect(NotificationService.deleteNotification).toHaveBeenCalledWith('1', '1');
    });

    it('should handle deletion of non-existent notification', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.deleteNotification as any).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/v1/notifications/999')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Notificación no encontrada',
        timestamp: expect.any(String),
      });
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.markAllAsRead as any).mockResolvedValue(5);

      const response = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { count: 5 },
        message: '5 notificaciones marcadas como leídas',
        timestamp: expect.any(String),
      });

      expect(NotificationService.markAllAsRead).toHaveBeenCalledWith('1');
    });
  });

  describe('DELETE /api/v1/notifications/archived', () => {
    it('should delete all archived notifications', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.deleteAllArchived as any).mockResolvedValue(10);

      const response = await request(app)
        .delete('/api/v1/notifications/archived')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { count: 10 },
        message: '10 notificaciones archivadas eliminadas',
        timestamp: expect.any(String),
      });

      expect(NotificationService.deleteAllArchived).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /api/v1/notifications/settings', () => {
    it('should return user notification settings', async () => {
      const mockSettings = {
        email: true,
        sms: false,
        push: true,
        inApp: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        types: {
          appointment: true,
          telemedicine: true,
          prescription: true,
          lab_result: true,
          system: true,
          emergency: true,
        },
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getSettings as any).mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/v1/notifications/settings')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { settings: mockSettings },
        timestamp: expect.any(String),
      });

      expect(NotificationService.getSettings).toHaveBeenCalledWith('1');
    });
  });

  describe('PATCH /api/v1/notifications/settings', () => {
    it('should update notification settings', async () => {
      const updatedSettings = {
        email: false,
        sms: true,
        push: true,
        inApp: true,
        quietHours: {
          enabled: true,
          start: '23:00',
          end: '07:00',
        },
        types: {
          appointment: true,
          telemedicine: false,
          prescription: true,
          lab_result: true,
          system: false,
          emergency: true,
        },
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.updateSettings as any).mockResolvedValue(updatedSettings);

      const response = await request(app)
        .patch('/api/v1/notifications/settings')
        .set('Authorization', 'Bearer test-token')
        .send(updatedSettings)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { settings: updatedSettings },
        message: 'Configuración actualizada exitosamente',
        timestamp: expect.any(String),
      });

      expect(NotificationService.updateSettings).toHaveBeenCalledWith('1', updatedSettings);
    });

    it('should validate settings data', async () => {
      const invalidSettings = {
        email: 'invalid', // Should be boolean
        quietHours: {
          start: '25:00', // Invalid time
          end: '08:00',
        },
      };

      const response = await request(app)
        .patch('/api/v1/notifications/settings')
        .set('Authorization', 'Bearer test-token')
        .send(invalidSettings)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Configuración de notificaciones inválida',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/notifications/test', () => {
    it('should send test notification', async () => {
      const mockTestNotification = {
        id: 'test-1',
        type: 'system',
        title: 'Notificación de prueba',
        message: 'Esta es una notificación de prueba',
        timestamp: '2024-01-15T10:00:00Z',
        channels: [
          { type: 'email', sent: true, sentAt: '2024-01-15T10:00:00Z' },
        ],
      };

      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.sendNotification as any).mockResolvedValue(mockTestNotification);

      const response = await request(app)
        .post('/api/v1/notifications/test')
        .set('Authorization', 'Bearer test-token')
        .send({
          channel: 'email',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockTestNotification,
        message: 'Notificación de prueba enviada exitosamente',
        timestamp: expect.any(String),
      });

      expect(NotificationService.sendNotification).toHaveBeenCalledWith('1', {
        type: 'system',
        priority: 'normal',
        title: 'Notificación de prueba',
        message: 'Esta es una notificación de prueba para verificar la configuración',
        channels: ['email'],
      });
    });

    it('should validate test channel', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/test')
        .set('Authorization', 'Bearer test-token')
        .send({
          channel: 'invalid_channel',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Canal de notificación no válido',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Channel-specific endpoints', () => {
    describe('POST /api/v1/notifications/email', () => {
      it('should send email notification', async () => {
        const { EmailService } = await import('../services/emailService');
        (EmailService.sendEmail as any).mockResolvedValue({
          messageId: 'email-123',
          sent: true,
        });

        const response = await request(app)
          .post('/api/v1/notifications/email')
          .set('Authorization', 'Bearer test-token')
          .send({
            to: 'test@example.com',
            subject: 'Test Email',
            body: 'This is a test email',
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: { messageId: 'email-123', sent: true },
          message: 'Email enviado exitosamente',
          timestamp: expect.any(String),
        });

        expect(EmailService.sendEmail).toHaveBeenCalledWith({
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email',
        });
      });
    });

    describe('POST /api/v1/notifications/sms', () => {
      it('should send SMS notification', async () => {
        const { SMSService } = await import('../services/smsService');
        (SMSService.sendSMS as any).mockResolvedValue({
          messageId: 'sms-123',
          sent: true,
        });

        const response = await request(app)
          .post('/api/v1/notifications/sms')
          .set('Authorization', 'Bearer test-token')
          .send({
            to: '+1234567890',
            message: 'Test SMS message',
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: { messageId: 'sms-123', sent: true },
          message: 'SMS enviado exitosamente',
          timestamp: expect.any(String),
        });

        expect(SMSService.sendSMS).toHaveBeenCalledWith({
          to: '+1234567890',
          message: 'Test SMS message',
        });
      });
    });

    describe('POST /api/v1/notifications/push', () => {
      it('should send push notification', async () => {
        const { PushService } = await import('../services/pushService');
        (PushService.sendPushNotification as any).mockResolvedValue({
          messageId: 'push-123',
          sent: true,
        });

        const response = await request(app)
          .post('/api/v1/notifications/push')
          .set('Authorization', 'Bearer test-token')
          .send({
            title: 'Test Push',
            body: 'Test push message',
            data: { url: '/dashboard' },
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: { messageId: 'push-123', sent: true },
          message: 'Push notification enviado exitosamente',
          timestamp: expect.any(String),
        });

        expect(PushService.sendPushNotification).toHaveBeenCalledWith('1', {
          title: 'Test Push',
          body: 'Test push message',
          data: { url: '/dashboard' },
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Error interno del servidor',
        timestamp: expect.any(String),
      });
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Datos de notificación inválidos',
        timestamp: expect.any(String),
      });
    });
  });

  describe('HIPAA Compliance', () => {
    it('should log HIPAA events for notification access', async () => {
      const { logHIPAAEvent } = await import('../middleware/hipaa');
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.getNotifications as any).mockResolvedValue([]);

      await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(logHIPAAEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'NOTIFICATION_ACCESS',
          userId: '1',
          details: expect.any(String),
        })
      );
    });

    it('should log HIPAA events for notification creation', async () => {
      const { logHIPAAEvent } = await import('../middleware/hipaa');
      const { NotificationService } = await import('../services/notificationService');
      (NotificationService.sendNotification as any).mockResolvedValue({
        id: '1',
        type: 'appointment',
      });

      await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'appointment',
          title: 'Test notification',
          message: 'Test message',
        })
        .expect(201);

      expect(logHIPAAEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'NOTIFICATION_CREATE',
          userId: '1',
          details: expect.any(String),
        })
      );
    });
  });
}); 