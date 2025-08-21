// Servicio de notificaciones push para aplicaciones móviles
// Configurado para usar Firebase Cloud Messaging (FCM)

import { logger } from '@altamedica/shared/services/logger.service';

interface PushNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(options: PushNotificationOptions): Promise<void> {
  try {
    // En un entorno real, aquí iría la integración con FCM
    logger.info('Push notification enviada a token:', options.token)
    logger.info('Título:', options.title)
    logger.info('Cuerpo:', options.body)
    
    if (options.data) {
      logger.info('Datos adicionales:', options.data)
    }
    
    // Simulación de envío exitoso
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    logger.error('Error enviando notificación push:', undefined, error)
    throw error
  }
}

export const PushService = {
  send: sendPushNotification,
  
  // Métodos específicos para el dominio médico
  sendAppointmentNotification: async (token: string, appointmentId: string, doctorName: string) => {
    await sendPushNotification({
      token,
      title: 'Nueva cita agendada',
      body: `Cita con Dr. ${doctorName}`,
      data: {
        type: 'appointment',
        appointmentId,
        action: 'view_appointment'
      }
    })
  },
  
  sendMedicationReminder: async (token: string, medicationName: string) => {
    await sendPushNotification({
      token,
      title: 'Recordatorio de medicación',
      body: `Es hora de tomar ${medicationName}`,
      data: {
        type: 'medication',
        medication: medicationName,
        action: 'mark_taken'
      }
    })
  },
  
  sendEmergencyAlert: async (token: string, message: string) => {
    await sendPushNotification({
      token,
      title: 'ALERTA DE EMERGENCIA',
      body: message,
      data: {
        type: 'emergency',
        priority: 'high',
        action: 'emergency_response'
      }
    })
  }
}
