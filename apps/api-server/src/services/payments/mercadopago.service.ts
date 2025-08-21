/**
 * 💳 MERCADOPAGO SERVICE - ALTAMEDICA
 * Integración completa con MercadoPago para el mercado latinoamericano
 */

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración de MercadoPago SDK v2
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

// Esquemas de validación
const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU']),
  description: z.string().min(1),
  payer: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    identification: z.object({
      type: z.enum(['CPF', 'CNPJ', 'DNI', 'CC', 'CE', 'RUT']),
      number: z.string().min(1),
    }),
  }),
  external_reference: z.string().optional(),
  notification_url: z.string().url().optional(),
  back_urls: z.object({
    success: z.string().url(),
    failure: z.string().url(),
    pending: z.string().url(),
  }),
  auto_return: z.enum(['approved', 'all']).default('approved'),
  expires: z.boolean().default(true),
  expiration_date_from: z.string().optional(),
  expiration_date_to: z.string().optional(),
});

const PaymentNotificationSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

// Tipos de datos
export interface PaymentRequest {
  amount: number;
  currency: 'ARS' | 'BRL' | 'CLP' | 'COP' | 'MXN' | 'PEN' | 'UYU';
  description: string;
  payer: {
    email: string;
    name: string;
    identification: {
      type: 'CPF' | 'CNPJ' | 'DNI' | 'CC' | 'CE' | 'RUT';
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
}

export interface PaymentResponse {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
}

export interface PaymentNotification {
  type: string;
  data: {
    id: string;
  };
}

export class MercadoPagoService {
  private readonly db = adminDb;

  /**
   * Crear preferencia de pago
   */
  async createPaymentPreference(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validar datos de entrada
      const parseResult = PaymentRequestSchema.safeParse(paymentData);
      if (!parseResult.success) {
        throw new Error(`Validation error: ${parseResult.error.flatten().formErrors.join(', ')}`);
      }
      const validatedData = parseResult.data;

      // Crear preferencia en MercadoPago
      const preference = {
        items: [
          {
            id: 'telemedicine-session',
            title: validatedData.description,
            quantity: 1,
            unit_price: validatedData.amount,
            currency_id: validatedData.currency,
          },
        ],
        payer: {
          email: validatedData.payer.email,
          name: validatedData.payer.name,
          identification: validatedData.payer.identification,
        },
        external_reference: validatedData.external_reference || `altamedica-${Date.now()}`,
        notification_url: validatedData.notification_url || `${process.env.API_URL}/api/v1/payments/mercadopago/webhook`,
        back_urls: validatedData.back_urls,
        auto_return: validatedData.auto_return,
        expires: validatedData.expires,
        expiration_date_from: validatedData.expiration_date_from,
        expiration_date_to: validatedData.expiration_date_to,
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' }, // Excluir pagos en efectivo para telemedicina
          ],
          installments: 12, // Permitir hasta 12 cuotas
        },
        statement_descriptor: 'ALTAMEDICA',
        binary_mode: true, // Solo éxito o fallo, no pendiente
      };

      const response = await preferenceClient.create({ body: preference });

      // Guardar en base de datos
      await this.savePaymentPreference(response.body);

      return {
        id: response.body.id,
        status: response.body.status,
        status_detail: 'pending',
        external_reference: response.body.external_reference,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point,
        date_created: response.body.date_created,
        payer: {
          email: validatedData.payer.email,
          identification: validatedData.payer.identification,
        },
        items: response.body.items,
      };
    } catch (error) {
      logger.error('Error creating MercadoPago preference:', undefined, error);
      throw new Error(`Error creating payment preference: ${error.message}`);
    }
  }

  /**
   * Procesar notificación de webhook
   */
  async processWebhook(notification: PaymentNotification): Promise<void> {
    try {
      // Validar notificación
      const parseResult = PaymentNotificationSchema.safeParse(notification);
      if (!parseResult.success) {
        throw new Error(`Invalid notification: ${parseResult.error.flatten().formErrors.join(', ')}`);
      }
      const validatedNotification = parseResult.data;

      // Obtener información del pago
      const payment = await paymentClient.get({ id: validatedNotification.data.id });
      const paymentData = payment;

      // Actualizar estado en base de datos
      await this.updatePaymentStatus(paymentData);

      // Procesar según el estado
      switch (paymentData.status) {
        case 'approved':
          await this.handleApprovedPayment(paymentData);
          break;
        case 'rejected':
          await this.handleRejectedPayment(paymentData);
          break;
        case 'pending':
          await this.handlePendingPayment(paymentData);
          break;
        case 'in_process':
          await this.handleInProcessPayment(paymentData);
          break;
        default:
          logger.info(`Payment status not handled: ${paymentData.status}`);
      }
    } catch (error) {
      logger.error('Error processing MercadoPago webhook:', undefined, error);
      throw new Error(`Error processing webhook: ${error.message}`);
    }
  }

  /**
   * Obtener información de un pago
   */
  async getPaymentInfo(paymentId: string): Promise<any> {
    try {
      const payment = await mercadopago.payment.findById(paymentId);
      return payment.body;
    } catch (error) {
      logger.error('Error getting payment info:', undefined, error);
      throw new Error(`Error getting payment info: ${error.message}`);
    }
  }

  /**
   * Reembolsar un pago
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundData = amount ? { amount } : {};
      const refund = await mercadopago.refund.create({
        payment_id: paymentId,
        ...refundData,
      });
      return refund.body;
    } catch (error) {
      logger.error('Error refunding payment:', undefined, error);
      throw new Error(`Error refunding payment: ${error.message}`);
    }
  }

  /**
   * Crear pago con tarjeta guardada
   */
  async createCardPayment(paymentData: {
    transaction_amount: number;
    token: string;
    description: string;
    installments: number;
    payment_method_id: string;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
  }): Promise<any> {
    try {
      const payment = await mercadopago.payment.create({
        transaction_amount: paymentData.transaction_amount,
        token: paymentData.token,
        description: paymentData.description,
        installments: paymentData.installments,
        payment_method_id: paymentData.payment_method_id,
        payer: paymentData.payer,
        external_reference: `altamedica-${Date.now()}`,
        notification_url: `${process.env.API_URL}/api/v1/payments/mercadopago/webhook`,
      });

      return payment.body;
    } catch (error) {
      logger.error('Error creating card payment:', undefined, error);
      throw new Error(`Error creating card payment: ${error.message}`);
    }
  }

  /**
   * Guardar preferencia en base de datos
   */
  private async savePaymentPreference(preference: any): Promise<void> {
    try {
      await this.db.collection('payments').doc(preference.id).set({
        preference_id: preference.id,
        external_reference: preference.external_reference,
        status: 'pending',
        amount: preference.items[0]?.unit_price,
        currency: preference.items[0]?.currency_id,
        payer_email: preference.payer?.email,
        created_at: new Date(),
        updated_at: new Date(),
        payment_method: 'mercadopago',
      });
    } catch (error) {
      logger.error('Error saving payment preference:', undefined, error);
    }
  }

  /**
   * Actualizar estado del pago en base de datos
   */
  private async updatePaymentStatus(paymentData: any): Promise<void> {
    try {
      const paymentRef = this.db.collection('payments').doc(paymentData.external_reference);
      
      await paymentRef.update({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        payment_id: paymentData.id,
        updated_at: new Date(),
        payment_data: paymentData,
      });
    } catch (error) {
      logger.error('Error updating payment status:', undefined, error);
    }
  }

  /**
   * Manejar pago aprobado
   */
  private async handleApprovedPayment(paymentData: any): Promise<void> {
    try {
      logger.info(`Payment approved: ${paymentData.id}`);
      
      // Actualizar sesión de telemedicina
      if (paymentData.external_reference) {
        await this.updateTelemedicineSession(paymentData.external_reference, 'paid');
      }

      // Enviar notificación al paciente
      await this.sendPaymentConfirmation(paymentData);

      // Enviar notificación al doctor
      await this.sendDoctorNotification(paymentData);
    } catch (error) {
      logger.error('Error handling approved payment:', undefined, error);
    }
  }

  /**
   * Manejar pago rechazado
   */
  private async handleRejectedPayment(paymentData: any): Promise<void> {
    try {
      logger.info(`Payment rejected: ${paymentData.id}`);
      
      // Actualizar sesión de telemedicina
      if (paymentData.external_reference) {
        await this.updateTelemedicineSession(paymentData.external_reference, 'payment_failed');
      }

      // Enviar notificación de pago fallido
      await this.sendPaymentFailureNotification(paymentData);
    } catch (error) {
      logger.error('Error handling rejected payment:', undefined, error);
    }
  }

  /**
   * Manejar pago pendiente
   */
  private async handlePendingPayment(paymentData: any): Promise<void> {
    try {
      logger.info(`Payment pending: ${paymentData.id}`);
      
      // Actualizar sesión de telemedicina
      if (paymentData.external_reference) {
        await this.updateTelemedicineSession(paymentData.external_reference, 'payment_pending');
      }
    } catch (error) {
      logger.error('Error handling pending payment:', undefined, error);
    }
  }

  /**
   * Manejar pago en proceso
   */
  private async handleInProcessPayment(paymentData: any): Promise<void> {
    try {
      logger.info(`Payment in process: ${paymentData.id}`);
      
      // Actualizar sesión de telemedicina
      if (paymentData.external_reference) {
        await this.updateTelemedicineSession(paymentData.external_reference, 'payment_processing');
      }
    } catch (error) {
      logger.error('Error handling in process payment:', undefined, error);
    }
  }

  /**
   * Actualizar sesión de telemedicina
   */
  private async updateTelemedicineSession(sessionId: string, status: string): Promise<void> {
    try {
      const sessionRef = this.db.collection('telemedicine_sessions').doc(sessionId);
      await sessionRef.update({
        payment_status: status,
        updated_at: new Date(),
      });
    } catch (error) {
      logger.error('Error updating telemedicine session:', undefined, error);
    }
  }

  /**
   * Enviar confirmación de pago
   */
  private async sendPaymentConfirmation(paymentData: any): Promise<void> {
    try {
      // Implementar envío de email/SMS de confirmación
      logger.info(`Payment confirmation sent for: ${paymentData.id}`);
    } catch (error) {
      logger.error('Error sending payment confirmation:', undefined, error);
    }
  }

  /**
   * Enviar notificación al doctor
   */
  private async sendDoctorNotification(paymentData: any): Promise<void> {
    try {
      // Implementar notificación al doctor
      logger.info(`Doctor notification sent for payment: ${paymentData.id}`);
    } catch (error) {
      logger.error('Error sending doctor notification:', undefined, error);
    }
  }

  /**
   * Enviar notificación de pago fallido
   */
  private async sendPaymentFailureNotification(paymentData: any): Promise<void> {
    try {
      // Implementar notificación de pago fallido
      logger.info(`Payment failure notification sent for: ${paymentData.id}`);
    } catch (error) {
      logger.error('Error sending payment failure notification:', undefined, error);
    }
  }

  /**
   * Obtener métodos de pago disponibles
   */
  async getPaymentMethods(country: string = 'AR'): Promise<any> {
    try {
      const paymentMethods = await mercadopago.payment_methods.list({ country });
      return paymentMethods.body;
    } catch (error) {
      logger.error('Error getting payment methods:', undefined, error);
      throw new Error(`Error getting payment methods: ${error.message}`);
    }
  }

  /**
   * Validar tarjeta de crédito
   */
  async validateCard(cardNumber: string, cardholderName: string, expirationMonth: string, expirationYear: string): Promise<any> {
    try {
      const cardToken = await mercadopago.card_token.create({
        card_number: cardNumber,
        cardholder: {
          name: cardholderName,
        },
        expiration_month: expirationMonth,
        expiration_year: expirationYear,
      });
      return cardToken.body;
    } catch (error) {
      logger.error('Error validating card:', undefined, error);
      throw new Error(`Error validating card: ${error.message}`);
    }
  }
}

export default new MercadoPagoService(); 