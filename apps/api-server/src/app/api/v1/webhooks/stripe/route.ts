import { NextRequest, NextResponse } from 'next/server';
import { paymentGateway } from '@altamedica/shared';
import { auditEvent } from '@/middleware/audit.middleware';
import { headers } from 'next/headers';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Stripe Webhook Handler
 * Processes payment events securely with signature verification
 * POST /api/v1/webhooks/stripe
 */

// Stripe webhook requires raw body
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const payload = await request.text();
    
    // Get Stripe signature from headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      logger.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Process webhook event
    const result = await paymentGateway.processWebhookEvent(
      payload,
      signature
    );

    // Audit the webhook event
    await auditEvent(
      'stripe_webhook',
      `webhook_${result.type}`,
      `payment/webhook`,
      {
        eventType: result.type,
        processed: result.processed,
        data: result.data,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    );

    // Handle specific events
    if (result.processed) {
      switch (result.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(result.data);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(result.data);
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(result.data);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionCancellation(result.data);
          break;
          
        case 'invoice.paid':
          await handleInvoicePaid(result.data);
          break;
          
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(result.data);
          break;
      }
    }

    // Return success to Stripe
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    logger.error('Webhook processing error:', undefined, error);
    
    // Audit the error
    await auditEvent(
      'system',
      'webhook_error',
      'payment/webhook',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
    
    // Return error to Stripe (will retry)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(data: any) {
  logger.info('Payment succeeded:', data);
  
  // TODO: Update order/invoice status
  // TODO: Send confirmation email
  // TODO: Update subscription status if applicable
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(data: any) {
  logger.info('Payment failed:', data);
  
  // TODO: Notify customer
  // TODO: Update order status
  // TODO: Trigger retry logic if applicable
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(data: any) {
  logger.info('Subscription updated:', data);
  
  // TODO: Update local subscription record
  // TODO: Update customer access/features
  // TODO: Send notification email
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(data: any) {
  logger.info('Subscription cancelled:', data);
  
  // TODO: Update local subscription record
  // TODO: Schedule access removal
  // TODO: Send cancellation confirmation
}

/**
 * Handle paid invoice
 */
async function handleInvoicePaid(data: any) {
  logger.info('Invoice paid:', data);
  
  // TODO: Update invoice status in database
  // TODO: Send receipt email
  // TODO: Update accounting records
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(data: any) {
  logger.info('Invoice payment failed:', data);
  
  // TODO: Send payment failure notification
  // TODO: Update subscription status if applicable
  // TODO: Trigger dunning process
}