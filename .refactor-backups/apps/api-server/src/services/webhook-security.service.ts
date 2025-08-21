import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Webhook Security Service
 * 
 * Implements webhook signature verification for:
 * - Stripe payments
 * - MercadoPago payments
 * - Custom webhooks
 * 
 * Features:
 * - Signature verification
 * - Replay attack prevention
 * - Idempotency handling
 * - Event deduplication
 */

// Configuration schema
const WebhookConfigSchema = z.object({
  stripe: z.object({
    webhookSecret: z.string().min(1).optional(),
    toleranceSeconds: z.number().default(300), // 5 minutes
  }),
  mercadopago: z.object({
    webhookSecret: z.string().min(1).optional(),
    xSignature: z.string().optional(),
    xRequestId: z.string().optional(),
  }),
  replay: z.object({
    windowSeconds: z.number().default(300), // 5 minutes
    maxRetries: z.number().default(3),
  }),
});

type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Event processing record
interface ProcessedEvent {
  id: string;
  provider: string;
  timestamp: number;
  signature: string;
  processed: boolean;
  retryCount: number;
  result?: any;
  error?: string;
}

export class WebhookSecurityService {
  private config: WebhookConfig;
  private stripe?: Stripe;
  private processedEvents = new Map<string, ProcessedEvent>();
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.config = this.loadConfig();
    this.initializeProviders();
    this.startCleanup();
  }

  /**
   * Load webhook configuration from environment
   */
  private loadConfig(): WebhookConfig {
    return WebhookConfigSchema.parse({
      stripe: {
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        toleranceSeconds: parseInt(process.env.STRIPE_WEBHOOK_TOLERANCE || '300'),
      },
      mercadopago: {
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
        xSignature: process.env.MERCADOPAGO_X_SIGNATURE,
        xRequestId: process.env.MERCADOPAGO_X_REQUEST_ID,
      },
      replay: {
        windowSeconds: parseInt(process.env.WEBHOOK_REPLAY_WINDOW || '300'),
        maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3'),
      },
    });
  }

  /**
   * Initialize payment providers
   */
  private initializeProviders(): void {
    // Initialize Stripe if configured
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: true,
      });
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  public verifyStripeWebhook(req: Request): Stripe.Event {
    if (!this.config.stripe.webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new Error('Missing Stripe signature header');
    }

    try {
      // Construct event with signature verification
      const event = this.stripe.webhooks.constructEvent(
        req.body, // Raw body required
        signature,
        this.config.stripe.webhookSecret
      );

      // Check for replay attack
      this.checkReplayAttack(`stripe_${event.id}`, signature);

      // Record processed event
      this.recordProcessedEvent({
        id: event.id,
        provider: 'stripe',
        timestamp: event.created * 1000,
        signature,
        processed: false,
        retryCount: 0,
      });

      logger.info(`[Webhook] Stripe event verified: ${event.type} (${event.id})`);

      return event;
    } catch (error) {
      logger.error('[Webhook] Stripe signature verification failed:', undefined, error);
      throw new Error('Invalid Stripe webhook signature');
    }
  }

  /**
   * Verify MercadoPago webhook signature
   */
  public verifyMercadoPagoWebhook(req: Request): any {
    if (!this.config.mercadopago.webhookSecret) {
      throw new Error('MercadoPago webhook secret not configured');
    }

    // MercadoPago signature format: "ts=timestamp,v1=signature"
    const xSignature = req.headers['x-signature'] as string;
    const xRequestId = req.headers['x-request-id'] as string;
    
    if (!xSignature || !xRequestId) {
      throw new Error('Missing MercadoPago signature headers');
    }

    // Parse signature
    const signatureParts = xSignature.split(',');
    const timestamp = signatureParts[0]?.replace('ts=', '');
    const signature = signatureParts[1]?.replace('v1=', '');

    if (!timestamp || !signature) {
      throw new Error('Invalid MercadoPago signature format');
    }

    // Verify timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp);
    
    if (Math.abs(currentTime - signatureTime) > this.config.replay.windowSeconds) {
      throw new Error('MercadoPago webhook timestamp outside tolerance window');
    }

    // Construct signature payload
    const payload = `id:${xRequestId};request-id:${xRequestId};ts:${timestamp};`;
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', this.config.mercadopago.webhookSecret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison
    if (!this.secureCompare(signature, expectedSignature)) {
      throw new Error('Invalid MercadoPago webhook signature');
    }

    // Check for replay attack
    this.checkReplayAttack(`mercadopago_${xRequestId}`, signature);

    // Parse body
    const event = req.body;

    // Record processed event
    this.recordProcessedEvent({
      id: xRequestId,
      provider: 'mercadopago',
      timestamp: signatureTime * 1000,
      signature,
      processed: false,
      retryCount: 0,
    });

    logger.info(`[Webhook] MercadoPago event verified: ${event.type} (${xRequestId})`);

    return event;
  }

  /**
   * Verify custom webhook signature (HMAC-SHA256)
   */
  public verifyCustomWebhook(
    req: Request,
    secret: string,
    options?: {
      signatureHeader?: string;
      timestampHeader?: string;
      algorithm?: string;
    }
  ): any {
    const opts = {
      signatureHeader: 'x-webhook-signature',
      timestampHeader: 'x-webhook-timestamp',
      algorithm: 'sha256',
      ...options,
    };

    const signature = req.headers[opts.signatureHeader] as string;
    const timestamp = req.headers[opts.timestampHeader] as string;

    if (!signature) {
      throw new Error(`Missing signature header: ${opts.signatureHeader}`);
    }

    // Verify timestamp if provided
    if (timestamp) {
      const currentTime = Date.now();
      const signatureTime = parseInt(timestamp);
      
      if (Math.abs(currentTime - signatureTime) > this.config.replay.windowSeconds * 1000) {
        throw new Error('Webhook timestamp outside tolerance window');
      }
    }

    // Construct payload
    const payload = timestamp 
      ? `${timestamp}.${JSON.stringify(req.body)}`
      : JSON.stringify(req.body);

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac(opts.algorithm as any, secret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison
    if (!this.secureCompare(signature, expectedSignature)) {
      throw new Error('Invalid webhook signature');
    }

    logger.info('[Webhook] Custom webhook verified');

    return req.body;
  }

  /**
   * Express middleware for Stripe webhooks
   */
  public stripeWebhookMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const event = this.verifyStripeWebhook(req);
        (req as any).webhookEvent = event;
        next();
      } catch (error) {
        logger.error('[Webhook] Stripe verification failed:', undefined, error);
        res.status(400).json({
          error: 'Webhook signature verification failed',
        });
      }
    };
  }

  /**
   * Express middleware for MercadoPago webhooks
   */
  public mercadoPagoWebhookMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const event = this.verifyMercadoPagoWebhook(req);
        (req as any).webhookEvent = event;
        next();
      } catch (error) {
        logger.error('[Webhook] MercadoPago verification failed:', undefined, error);
        res.status(400).json({
          error: 'Webhook signature verification failed',
        });
      }
    };
  }

  /**
   * Idempotency handling
   */
  public async handleIdempotently<T>(
    eventId: string,
    handler: () => Promise<T>
  ): Promise<T> {
    // Check if event was already processed
    const existing = this.processedEvents.get(eventId);
    
    if (existing?.processed && existing.result) {
      logger.info(`[Webhook] Idempotent response for event ${eventId}`);
      return existing.result;
    }

    // Check retry limit
    if (existing && existing.retryCount >= this.config.replay.maxRetries) {
      throw new Error(`Max retries exceeded for event ${eventId}`);
    }

    try {
      // Process event
      const result = await handler();

      // Update record
      if (existing) {
        existing.processed = true;
        existing.result = result;
        existing.retryCount++;
      }

      return result;
    } catch (error) {
      // Update retry count
      if (existing) {
        existing.retryCount++;
        existing.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      throw error;
    }
  }

  /**
   * Check for replay attack
   */
  private checkReplayAttack(eventId: string, signature: string): void {
    const existing = this.processedEvents.get(eventId);
    
    if (existing) {
      // Check if same signature (duplicate)
      if (existing.signature === signature) {
        logger.warn(`[Webhook] Duplicate event detected: ${eventId}`);
        return;
      }
      
      // Different signature for same ID is suspicious
      throw new Error(`Replay attack detected for event ${eventId}`);
    }
  }

  /**
   * Record processed event
   */
  private recordProcessedEvent(event: ProcessedEvent): void {
    this.processedEvents.set(event.id, event);
  }

  /**
   * Secure string comparison (constant-time)
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    // Clean up old events every minute
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEvents();
    }, 60000); // 1 minute
  }

  /**
   * Clean up old processed events
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - (this.config.replay.windowSeconds * 2 * 1000);
    let removed = 0;

    for (const [id, event] of this.processedEvents.entries()) {
      if (event.timestamp < cutoff) {
        this.processedEvents.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`[Webhook] Cleaned up ${removed} old events`);
    }
  }

  /**
   * Get webhook statistics
   */
  public getStatistics(): any {
    const events = Array.from(this.processedEvents.values());
    
    return {
      totalEvents: events.length,
      processedEvents: events.filter(e => e.processed).length,
      failedEvents: events.filter(e => e.error).length,
      byProvider: {
        stripe: events.filter(e => e.provider === 'stripe').length,
        mercadopago: events.filter(e => e.provider === 'mercadopago').length,
      },
      oldestEvent: events.length > 0 
        ? new Date(Math.min(...events.map(e => e.timestamp))).toISOString()
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.processedEvents.clear();
    
    logger.info('[Webhook] Security service disposed');
  }
}

// Singleton instance
let webhookSecurityService: WebhookSecurityService | null = null;

export function getWebhookSecurityService(): WebhookSecurityService {
  if (!webhookSecurityService) {
    webhookSecurityService = new WebhookSecurityService();
  }
  return webhookSecurityService;
}

// Export default instance
export default getWebhookSecurityService();