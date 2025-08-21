import { Router } from 'express';
import { notificationService } from '../notifications/UnifiedNotificationSystem';

import { logger } from '@altamedica/shared/services/logger.service';
const router = Router();

// Obtener notificaciones del usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType, status, limit, offset } = req.query;

    if (!userType || !['patient', 'doctor', 'admin'].includes(userType as string)) {
      return res.status(400).json({
        error: 'userType is required and must be patient, doctor, or admin'
      });
    }

    const notifications = await notificationService.getUserNotifications(
      userId,
      userType as 'patient' | 'doctor' | 'admin',
      {
        status: status as 'unread' | 'read' | 'archived',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    res.json(notifications);
  } catch (error) {
    logger.error('Error getting user notifications:', undefined, error);
    res.status(500).json({
      error: 'Failed to get notifications'
    });
  }
});

// Obtener estadísticas de notificaciones
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;

    if (!userType || !['patient', 'doctor', 'admin'].includes(userType as string)) {
      return res.status(400).json({
        error: 'userType is required and must be patient, doctor, or admin'
      });
    }

    const stats = await notificationService.getNotificationStats(
      userId,
      userType as 'patient' | 'doctor' | 'admin'
    );

    res.json(stats);
  } catch (error) {
    logger.error('Error getting notification stats:', undefined, error);
    res.status(500).json({
      error: 'Failed to get notification stats'
    });
  }
});

// Marcar notificación como leída
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Error marking notification as read:', undefined, error);
    res.status(500).json({
      error: 'Failed to mark notification as read'
    });
  }
});

// Marcar notificación como archivada
router.put('/:notificationId/archive', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsArchived(notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Error archiving notification:', undefined, error);
    res.status(500).json({
      error: 'Failed to archive notification'
    });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;

    if (!userType || !['patient', 'doctor', 'admin'].includes(userType as string)) {
      return res.status(400).json({
        error: 'userType is required and must be patient, doctor, or admin'
      });
    }

    const count = await notificationService.markAllAsRead(
      userId,
      userType as 'patient' | 'doctor' | 'admin'
    );

    res.json({ count, message: `${count} notifications marked as read` });
  } catch (error) {
    logger.error('Error marking all notifications as read:', undefined, error);
    res.status(500).json({
      error: 'Failed to mark notifications as read'
    });
  }
});

// Eliminar notificación
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const deleted = await notificationService.deleteNotification(notificationId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Error deleting notification:', undefined, error);
    res.status(500).json({
      error: 'Failed to delete notification'
    });
  }
});

// Crear notificación personalizada
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userType,
      type,
      title,
      message,
      priority,
      metadata,
      scheduledFor
    } = req.body;

    if (!userId || !userType || !type || !title || !message || !priority) {
      return res.status(400).json({
        error: 'Missing required fields: userId, userType, type, title, message, priority'
      });
    }

    if (!['patient', 'doctor', 'admin'].includes(userType)) {
      return res.status(400).json({
        error: 'userType must be patient, doctor, or admin'
      });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        error: 'priority must be low, medium, high, or urgent'
      });
    }

    const notification = await notificationService.createNotification({
      userId,
      userType,
      type,
      title,
      message,
      priority,
      status: 'unread',
      metadata,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
    });

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating notification:', undefined, error);
    res.status(500).json({
      error: 'Failed to create notification'
    });
  }
});

// Crear recordatorio de cita
router.post('/appointment-reminder', async (req, res) => {
  try {
    const {
      userId,
      userType,
      appointmentData,
      reminderHours
    } = req.body;

    if (!userId || !userType || !appointmentData) {
      return res.status(400).json({
        error: 'Missing required fields: userId, userType, appointmentData'
      });
    }

    const notification = await notificationService.createAppointmentReminder(
      userId,
      userType,
      appointmentData,
      reminderHours
    );

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating appointment reminder:', undefined, error);
    res.status(500).json({
      error: 'Failed to create appointment reminder'
    });
  }
});

// Crear confirmación de telemedicina
router.post('/telemedicine-confirmation', async (req, res) => {
  try {
    const {
      userId,
      userType,
      telemedicineData
    } = req.body;

    if (!userId || !userType || !telemedicineData) {
      return res.status(400).json({
        error: 'Missing required fields: userId, userType, telemedicineData'
      });
    }

    const notification = await notificationService.createTelemedicineConfirmation(
      userId,
      userType,
      telemedicineData
    );

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating telemedicine confirmation:', undefined, error);
    res.status(500).json({
      error: 'Failed to create telemedicine confirmation'
    });
  }
});

// Crear alerta médica
router.post('/medical-alert', async (req, res) => {
  try {
    const {
      userId,
      userType,
      alertMessage
    } = req.body;

    if (!userId || !userType || !alertMessage) {
      return res.status(400).json({
        error: 'Missing required fields: userId, userType, alertMessage'
      });
    }

    const notification = await notificationService.createMedicalAlert(
      userId,
      userType,
      alertMessage
    );

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating medical alert:', undefined, error);
    res.status(500).json({
      error: 'Failed to create medical alert'
    });
  }
});

// Crear mensaje del médico
router.post('/doctor-message', async (req, res) => {
  try {
    const {
      patientId,
      doctorName,
      message
    } = req.body;

    if (!patientId || !doctorName || !message) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, doctorName, message'
      });
    }

    const notification = await notificationService.createDoctorMessage(
      patientId,
      doctorName,
      message
    );

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating doctor message:', undefined, error);
    res.status(500).json({
      error: 'Failed to create doctor message'
    });
  }
});

// Obtener todas las notificaciones (para administración)
router.get('/admin/all', async (req, res) => {
  try {
    const { userType, status, priority, limit, offset } = req.query;

    const notifications = await notificationService.getAllNotifications({
      userType: userType as 'patient' | 'doctor' | 'admin',
      status: status as 'unread' | 'read' | 'archived',
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Error getting all notifications:', undefined, error);
    res.status(500).json({
      error: 'Failed to get notifications'
    });
  }
});

// Limpiar notificaciones antiguas
router.post('/admin/cleanup', async (req, res) => {
  try {
    const { daysToKeep } = req.body;
    const deletedCount = await notificationService.cleanupOldNotifications(daysToKeep);

    res.json({
      message: `Cleaned up ${deletedCount} old notifications`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up notifications:', undefined, error);
    res.status(500).json({
      error: 'Failed to cleanup notifications'
    });
  }
});

export default router; 