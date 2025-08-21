import Stripe from 'stripe';
import crypto from 'crypto';

import { logger } from './logger.service';
/**
 * Payment Gateway Service
 * Secure integration with payment processor (Stripe/MercadoPago)
 * Compliant with PCI DSS standards
 */

export interface PaymentGatewayConfig {
  provider: 'stripe' | 'mercadopago';
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  environment: 'test' | 'production';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'mercadopago';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  customerId: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  companyId: string;
  externalCustomerId?: string; // Stripe/MP customer ID
  paymentMethods: PaymentMethod[];
}

export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
  customerId: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  signature: string;
  timestamp: number;
}

class PaymentGatewayService {
  private stripe: Stripe | null = null;
  private config: PaymentGatewayConfig | null = null;
  private webhookEndpointSecret: string = '';

  /**
   * Initialize payment gateway with secure configuration
   */
  initialize(config: PaymentGatewayConfig): void {
    this.config = config;

    // Initialize Stripe if selected
    if (config.provider === 'stripe') {
      // Usamos inicialización sin forzar apiVersion para evitar incompatibilidad de tipos en el SDK instalado.
      this.stripe = new Stripe(config.secretKey, {
        // apiVersion omitida para utilizar la versión por defecto del paquete instalado
        typescript: true,
      });
      this.webhookEndpointSecret = config.webhookSecret;
    }

    // TODO: Add MercadoPago initialization
    if (config.provider === 'mercadopago') {
      logger.info('MercadoPago integration pending implementation');
    }
  }

  /**
   * Create or update customer in payment gateway
   */
  async createCustomer(customer: Omit<Customer, 'id' | 'externalCustomerId' | 'paymentMethods'>): Promise<Customer> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const stripeCustomer = await this.stripe.customers.create({
        email: customer.email,
        name: customer.name,
        metadata: {
          companyId: customer.companyId,
          environment: this.config?.environment || 'test'
        }
      });

      return {
        ...customer,
        id: crypto.randomUUID(),
        externalCustomerId: stripeCustomer.id,
        paymentMethods: []
      };
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw new Error('Failed to create customer in payment gateway');
    }
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(
    customerId: string,
    paymentMethodToken: string
  ): Promise<PaymentMethod> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      // Attach payment method to customer
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodToken,
        { customer: customerId }
      );

      // Set as default if it's the first payment method
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted) {
        const paymentMethods = await this.stripe.paymentMethods.list({
          customer: customerId,
          type: 'card'
        });

        if (paymentMethods.data.length === 1) {
          await this.stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethod.id
            }
          });
        }
      }

      return {
        id: paymentMethod.id,
        type: 'card',
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        isDefault: true,
        customerId
      };
    } catch (error) {
      logger.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  /**
   * Create a charge/payment
   */
  async createCharge(request: ChargeRequest): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl?: string;
  }> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency,
        customer: request.customerId,
        payment_method: request.paymentMethodId,
        description: request.description,
        metadata: request.metadata || {},
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        receiptUrl: (paymentIntent as any).charges?.data[0]?.receipt_url || undefined
      };
    } catch (error) {
      logger.error('Error creating charge:', error);
      throw new Error('Failed to process payment');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, any>
  ): Promise<{
    id: string;
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelImmediately = false
  ): Promise<{ success: boolean; cancelAt?: Date }> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      if (cancelImmediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
        return { success: true };
      } else {
        const subscription = await this.stripe.subscriptions.update(
          subscriptionId,
          { cancel_at_period_end: true }
        );
        return {
          success: true,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined
        };
      }
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): boolean {
    if (!this.stripe || !this.webhookEndpointSecret) {
      throw new Error('Webhook verification not configured');
    }

    try {
      // Stripe webhook verification
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookEndpointSecret
      );
      return !!event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Promise<{
    type: string;
    processed: boolean;
    data?: any;
  }> {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookEndpointSecret
      );

      // Process different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          return {
            type: event.type,
            processed: true,
            data: {
              paymentIntentId: event.data.object.id,
              amount: event.data.object.amount / 100,
              currency: event.data.object.currency
            }
          };

        case 'payment_intent.payment_failed':
          return {
            type: event.type,
            processed: true,
            data: {
              paymentIntentId: event.data.object.id,
              error: event.data.object.last_payment_error?.message
            }
          };

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          return {
            type: event.type,
            processed: true,
            data: {
              subscriptionId: event.data.object.id,
              customerId: event.data.object.customer,
              status: event.data.object.status
            }
          };

        case 'invoice.paid':
        case 'invoice.payment_failed':
          return {
            type: event.type,
            processed: true,
            data: {
              invoiceId: event.data.object.id,
              customerId: event.data.object.customer,
              amount: event.data.object.amount_paid / 100,
              status: event.data.object.status
            }
          };

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
          return {
            type: event.type,
            processed: false
          };
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw new Error('Failed to process webhook event');
    }
  }

  /**
   * Get payment gateway public configuration
   */
  getPublicConfig(): {
    provider: string;
    publicKey: string;
    environment: string;
  } | null {
    if (!this.config) return null;

    return {
      provider: this.config.provider,
      publicKey: this.config.publicKey,
      environment: this.config.environment
    };
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string): Promise<{
    clientSecret: string;
    setupIntentId: string;
  }> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      return {
        clientSecret: setupIntent.client_secret!,
        setupIntentId: setupIntent.id
      };
    } catch (error) {
      logger.error('Error creating setup intent:', error);
      throw new Error('Failed to create setup intent');
    }
  }

  /**
   * List customer's payment methods
   */
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      const customer = await this.stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = 
        customer && !customer.deleted && 'invoice_settings' in customer
          ? customer.invoice_settings?.default_payment_method
          : null;

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card' as const,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
        customerId
      }));
    } catch (error) {
      logger.error('Error listing payment methods:', error);
      throw new Error('Failed to list payment methods');
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    if (!this.stripe) throw new Error('Payment gateway not initialized');

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      logger.error('Error removing payment method:', error);
      return false;
    }
  }
}

// Export singleton instance
export const paymentGateway = new PaymentGatewayService();

// Export for testing
export { PaymentGatewayService };