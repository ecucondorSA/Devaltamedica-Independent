/**
import { logger } from './services/logger.service';

 * 💳 PAYMENTS CONFIGURATION - ALTAMEDICA
 * Configuración centralizada de MercadoPago y otros proveedores de pago
 */

// Definir tipos para MercadoPago
declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export const mercadopagoConfig = {
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'TEST-12345678-1234-1234-1234-123456789012',
  environment: process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT || 'test',
  country: process.env.NEXT_PUBLIC_MERCADOPAGO_COUNTRY || 'AR',
  currency: process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY || 'ARS',
};

export const createPaymentPreference = async (paymentData: any) => {
  try {
    const response = await fetch('/api/v1/payments/mercadopago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al crear preferencia de pago');
    }

    return result.data;
  } catch (error) {
    logger.error('Error creating payment preference:', error);
    throw error;
  }
};

export const redirectToMercadoPago = (preferenceId: string, isProduction: boolean = false) => {
  const baseUrl = isProduction 
    ? 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id='
    : 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=';
    
  window.location.href = `${baseUrl}${preferenceId}`;
};

export const loadMercadoPagoSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && !window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        if (window.MercadoPago) {
          window.MercadoPago.setPublishableKey(mercadopagoConfig.publicKey);
          resolve(window.MercadoPago);
        } else {
          reject(new Error('MercadoPago SDK no se cargó correctamente'));
        }
      };
      script.onerror = () => reject(new Error('Error cargando MercadoPago SDK'));
      document.head.appendChild(script);
    } else if (window.MercadoPago) {
      resolve(window.MercadoPago);
    } else {
      reject(new Error('MercadoPago SDK no disponible'));
    }
  });
};

export default {
  config: mercadopagoConfig,
  createPaymentPreference,
  redirectToMercadoPago,
  loadMercadoPagoSDK,
};