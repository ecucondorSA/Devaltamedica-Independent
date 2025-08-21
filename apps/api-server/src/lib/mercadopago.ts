import { MercadoPagoConfig, Preference, Payment, PaymentMethod } from 'mercadopago';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Configuración de MercadoPago para api-server
 * Actualizado para usar SDK v2
 */

// Configurar cliente MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

export const mercadopagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  environment: process.env.MERCADOPAGO_ENVIRONMENT || 'test',
  country: process.env.MERCADOPAGO_COUNTRY || 'AR',
  currency: process.env.MERCADOPAGO_CURRENCY || 'ARS',
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
};

export const createPaymentPreference = async (preferenceData: any) => {
  try {
    const preference = {
      items: [
        {
          id: 'telemedicine-session',
          title: preferenceData.description,
          quantity: 1,
          unit_price: preferenceData.amount,
          currency_id: preferenceData.currency,
        },
      ],
      payer: {
        email: preferenceData.payer.email,
        name: preferenceData.payer.name,
        identification: preferenceData.payer.identification,
      },
      external_reference: preferenceData.external_reference || `altamedica-${Date.now()}`,
      notification_url: preferenceData.notification_url || mercadopagoConfig.webhookUrl,
      back_urls: preferenceData.back_urls,
      auto_return: preferenceData.auto_return || 'approved',
      expires: preferenceData.expires !== false,
      expiration_date_from: preferenceData.expiration_date_from,
      expiration_date_to: preferenceData.expiration_date_to,
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
    return response;
  } catch (error) {
    logger.error('Error creating MercadoPago preference:', undefined, error);
    throw error;
  }
};

export const getPaymentInfo = async (paymentId: string) => {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  } catch (error) {
    logger.error('Error getting payment info:', undefined, error);
    throw error;
  }
};

export const refundPayment = async (paymentId: string, amount?: number) => {
  try {
    const refundData = amount ? { amount } : {};
    const refund = await paymentClient.refund({ 
      id: paymentId,
      body: refundData 
    });
    return refund;
  } catch (error) {
    logger.error('Error refunding payment:', undefined, error);
    throw error;
  }
};

export const getPaymentMethods = async () => {
  try {
    const paymentMethods = await paymentMethodClient.list();
    return paymentMethods;
  } catch (error) {
    logger.error('Error getting payment methods:', undefined, error);
    throw error;
  }
};

export default {
  config: mercadopagoConfig,
  createPaymentPreference,
  getPaymentInfo,
  refundPayment,
  getPaymentMethods,
};