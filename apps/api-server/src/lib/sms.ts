// Servicio de SMS para notificaciones médicas
// Configurado para usar Twilio (o cualquier otro proveedor)

import { logger } from '@altamedica/shared/services/logger.service';

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions): Promise<void> {
  try {
    // En un entorno real, aquí iría la integración con Twilio o similar
    logger.info('SMS enviado a:', options.to)
    logger.info('Mensaje:', options.message)
    
    // Simulación de envío exitoso
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    logger.error('Error enviando SMS:', undefined, error)
    throw error
  }
}

export const SMSService = {
  send: sendSMS,
  
  // Métodos específicos para el dominio médico
  sendAppointmentReminder: async (phoneNumber: string, appointmentDate: string) => {
    await sendSMS({
      to: phoneNumber,
      message: `Recordatorio: Tiene una cita médica el ${appointmentDate}. AltaMedica.`
    })
  },
  
  sendEmergencyAlert: async (phoneNumber: string, message: string) => {
    await sendSMS({
      to: phoneNumber,
      message: `URGENTE: ${message} - AltaMedica`
    })
  }
}
