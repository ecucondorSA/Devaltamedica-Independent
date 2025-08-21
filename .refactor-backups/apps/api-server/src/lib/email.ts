import nodemailer from 'nodemailer'

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'yourpassword'
  }
})

// Método para enviar correo electrónico
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@altamedica.com',
      to,
      subject,
      text,
      html
    })
    logger.info('Correo electrónico enviado a:', to)
  } catch (error) {
    logger.error('Error enviado correo electrónico:', undefined, error)
    throw error
  }
}

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const EmailService = {
  send: async (options: EmailOptions) => sendEmail(options.to, options.subject, options.text, options.html)
}
