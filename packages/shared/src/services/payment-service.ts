/**
import { logger } from './logger.service';

 * 💳 ALTAMEDICA - SERVICIO DE PAGOS CENTRALIZADO
 * Configuración unificada de MercadoPago para todas las apps
 * Usado por: Companies App, Doctors App, Patients App
 */

export interface MercadoPagoConfig {
  publicKey: string;
  environment: 'test' | 'production';
  country: string;
  currency: string;
}

export interface PaymentData {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
  category_id?: string;
  payer?: {
    email?: string;
    name?: string;
    surname?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'approved' | 'all';
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  notification_url?: string;
  external_reference?: string;
}

export interface PaymentPreferenceResponse {
  success: boolean;
  data?: {
    id: string;
    init_point: string;
    sandbox_init_point: string;
  };
  error?: string;
}

/**
 * Servicio de Pagos Unificado para AltaMedica
 */
export class PaymentService {
  private config: MercadoPagoConfig;

  constructor() {
    this.config = {
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'TEST-12345678-1234-1234-1234-123456789012',
      environment: (process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT as 'test' | 'production') || 'test',
      country: process.env.NEXT_PUBLIC_MERCADOPAGO_COUNTRY || 'AR',
      currency: process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY || 'ARS',
    };
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): MercadoPagoConfig {
    return { ...this.config };
  }

  /**
   * Crear preferencia de pago
   */
  async createPaymentPreference(paymentData: PaymentData): Promise<PaymentPreferenceResponse> {
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

      return result;
    } catch (error) {
      logger.error('Error creating payment preference:', error);
      throw error;
    }
  }

  /**
   * Redirigir a MercadoPago
   */
  redirectToMercadoPago(preferenceId: string): void {
    const isProduction = this.config.environment === 'production';
    const baseUrl = 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=';
    
    if (typeof window !== 'undefined') {
      window.location.href = `${baseUrl}${preferenceId}`;
    }
  }

  /**
   * Cargar SDK de MercadoPago
   */
  loadMercadoPagoSDK(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('SDK solo disponible en el cliente'));
        return;
      }

      // @ts-ignore
      if (!window.MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
          // @ts-ignore
          if (window.MercadoPago) {
            // @ts-ignore
            window.MercadoPago.setPublishableKey(this.config.publicKey);
            // @ts-ignore
            resolve(window.MercadoPago);
          } else {
            reject(new Error('MercadoPago SDK no se cargó correctamente'));
          }
        };
        script.onerror = () => reject(new Error('Error cargando MercadoPago SDK'));
        document.head.appendChild(script);
      } else {
        // @ts-ignore
        resolve(window.MercadoPago);
      }
    });
  }

  /**
   * Validar configuración
   */
  validateConfig(): boolean {
    const { publicKey, environment } = this.config;
    
    if (!publicKey || publicKey === 'TEST-12345678-1234-1234-1234-123456789012') {
      logger.warn('Usando clave pública de prueba de MercadoPago');
    }

    return !!(publicKey && environment);
  }

  /**
   * Obtener información del entorno
   */
  getEnvironmentInfo(): {
    isProduction: boolean;
    environment: string;
    country: string;
    currency: string;
  } {
    return {
      isProduction: this.config.environment === 'production',
      environment: this.config.environment,
      country: this.config.country,
      currency: this.config.currency
    };
  }
}

// Singleton para uso global
let paymentServiceInstance: PaymentService | null = null;

export const getPaymentService = (): PaymentService => {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }
  return paymentServiceInstance;
};

// Funciones de conveniencia para mantener compatibilidad
export const createPaymentPreference = async (paymentData: PaymentData): Promise<PaymentPreferenceResponse> => {
  return getPaymentService().createPaymentPreference(paymentData);
};

export const redirectToMercadoPago = (preferenceId: string): void => {
  getPaymentService().redirectToMercadoPago(preferenceId);
};

export const loadMercadoPagoSDK = (): Promise<any> => {
  return getPaymentService().loadMercadoPagoSDK();
};

export const mercadopagoConfig = getPaymentService().getConfig();

// Export default del servicio
export default getPaymentService();