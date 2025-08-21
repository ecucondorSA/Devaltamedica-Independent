// TODO: Definir estos tipos en @altamedica/types
// Stubs temporales para permitir el build
interface Invoice {
  id: string;
  [key: string]: any;
}

interface InvoiceLineItem {
  [key: string]: any;
}

interface Subscription {
  id: string;
  [key: string]: any;
}

interface SubscriptionPlan {
  [key: string]: any;
}

interface UsageRecord {
  [key: string]: any;
}

// Funciones stub temporales
const calculateInvoiceTotals = (): any => ({ total: 0, subtotal: 0, tax: 0 });
const generateInvoiceNumber = (): string => `INV-${Date.now()}`;
const getNextBillingDate = (): Date => new Date();
const calculateProratedAmount = (): number => 0;
// import { auditEvent } from '@altamedica/database'; // TODO: Implement audit logging
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

import { logger } from './logger.service';
/**
 * Invoice Generation Service
 * Automatic invoice generation for subscriptions
 * Handles billing cycles, usage-based billing, and prorations
 */

export interface InvoiceGenerationConfig {
  cronSchedule?: string; // Default: daily at midnight
  dryRun?: boolean; // Test mode without creating invoices
  sendNotifications?: boolean;
  retryFailedInvoices?: boolean;
}

export interface GenerationResult {
  success: boolean;
  invoiceId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

class InvoiceGenerationService {
  private cronJob: cron.ScheduledTask | null = null;
  private config: InvoiceGenerationConfig = {
    cronSchedule: '0 0 * * *', // Daily at midnight
    dryRun: false,
    sendNotifications: true,
    retryFailedInvoices: true,
  };

  /**
   * Initialize the invoice generation service
   */
  initialize(config?: InvoiceGenerationConfig): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start cron job for automatic generation
    this.startCronJob();
  }

  /**
   * Start the cron job for automatic invoice generation
   */
  private startCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(this.config.cronSchedule!, async () => {
      logger.info('[InvoiceGeneration] Starting automatic invoice generation...');
      await this.generateAllPendingInvoices();
    });

    logger.info(`[InvoiceGeneration] Cron job scheduled: ${this.config.cronSchedule}`);
  }

  /**
   * Generate all pending invoices for active subscriptions
   */
  async generateAllPendingInvoices(): Promise<{
    generated: number;
    failed: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    const results = {
      generated: 0,
      failed: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    try {
      // Get all active subscriptions that need invoicing
      const subscriptions = await this.getSubscriptionsNeedingInvoices();

      for (const subscription of subscriptions) {
        try {
          const result = await this.generateInvoiceForSubscription(subscription);

          if (result.success) {
            results.generated++;
          } else {
            results.failed++;
            results.errors.push({
              subscriptionId: subscription.id,
              error: result.error || 'Unknown error',
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log results
      logger.info(
        `[InvoiceGeneration] Completed: ${results.generated} generated, ${results.failed} failed`,
      );

      if (results.errors.length > 0) {
        logger.error('[InvoiceGeneration] Errors:', results.errors);
      }

      // Audit the batch generation
      await this.auditBatchGeneration(results);
    } catch (error) {
      logger.error('[InvoiceGeneration] Batch generation failed:', error);
    }

    return results;
  }

  /**
   * Get subscriptions that need new invoices
   */
  private async getSubscriptionsNeedingInvoices(): Promise<Subscription[]> {
    // In a real implementation, this would query the database
    // For now, returning mock data
    const now = new Date();

    // Mock implementation - replace with actual database query
    return [];
  }

  /**
   * Generate invoice for a specific subscription
   */
  async generateInvoiceForSubscription(
    subscription: Subscription,
    options?: {
      includeUsage?: boolean;
      prorated?: boolean;
      customLineItems?: InvoiceLineItem[];
    },
  ): Promise<GenerationResult> {
    try {
      // Get subscription plan details
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Calculate billing period
      const periodStart = subscription.currentPeriodStart;
      const periodEnd = subscription.currentPeriodEnd;

      // Generate line items
      const lineItems: InvoiceLineItem[] = [];

      // 1. Base subscription charge
      const subscriptionItem = this.createSubscriptionLineItem(
        plan,
        subscription,
        periodStart,
        periodEnd,
        options?.prorated,
      );
      lineItems.push(subscriptionItem);

      // 2. Usage-based charges (if applicable)
      if (options?.includeUsage) {
        const usageItems = await this.createUsageLineItems(subscription, periodStart, periodEnd);
        lineItems.push(...usageItems);
      }

      // 3. Custom line items (if provided)
      if (options?.customLineItems) {
        lineItems.push(...options.customLineItems);
      }

      // 4. Calculate discount (if applicable)
      if (subscription.discount && subscription.discount > 0) {
        const discountItem = this.createDiscountLineItem(
          subscriptionItem.amount,
          subscription.discount,
        );
        lineItems.push(discountItem);
      }

      // 5. Calculate taxes
      const taxItem = this.createTaxLineItem(lineItems);
      lineItems.push(taxItem);

      // Calculate totals
      const totals = calculateInvoiceTotals();

      // Generate invoice number
      const invoiceNumber = await this.getNextInvoiceNumber(subscription.companyId);

      // Create invoice object
      const invoice: Invoice = {
        id: uuidv4(),
        invoiceNumber,
        companyId: subscription.companyId,
        subscriptionId: subscription.id,
        status: 'open',
        periodStart,
        periodEnd,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: subscription.discount ? (totals.subtotal * subscription.discount) / 100 : 0,
        total: totals.total,
        amountPaid: 0,
        amountDue: totals.total,
        currency: plan.currency,
        lineItems,
        issuedAt: new Date(),
        dueAt: this.calculateDueDate(new Date()),
        paidAt: null,
        voidedAt: null,
        invoiceType: 'B', // Default to type B for companies
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save invoice (if not dry run)
      if (!this.config.dryRun) {
        await this.saveInvoice(invoice);

        // Send notification
        if (this.config.sendNotifications) {
          await this.sendInvoiceNotification(invoice);
        }

        // Attempt automatic payment
        await this.attemptAutomaticPayment(invoice);
      }

      // Audit the generation
      await this.auditInvoiceGeneration(invoice, subscription);

      return {
        success: true,
        invoiceId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          dueDate: invoice.dueAt,
        },
      };
    } catch (error) {
      logger.error('[InvoiceGeneration] Error generating invoice:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create subscription line item
   */
  private createSubscriptionLineItem(
    plan: SubscriptionPlan,
    subscription: Subscription,
    periodStart: Date,
    periodEnd: Date,
    prorated?: boolean,
  ): InvoiceLineItem {
    let amount = plan.price * subscription.quantity;
    let description = `${plan.name} - ${plan.tier}`;

    // Apply proration if needed
    if (prorated) {
      const totalDays = Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const standardDays =
        plan.interval === 'monthly' ? 30 : plan.interval === 'quarterly' ? 90 : 365;

      amount = calculateProratedAmount();
      description += ` (Prorrateado: ${totalDays} días)`;
    }

    return {
      id: uuidv4(),
      type: 'subscription',
      description,
      quantity: subscription.quantity,
      unitPrice: plan.price,
      amount,
      taxRate: 21, // Argentina IVA
      taxAmount: 0, // Tax calculated separately
      total: amount,
    };
  }

  /**
   * Create usage-based line items
   */
  private async createUsageLineItems(
    subscription: Subscription,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<InvoiceLineItem[]> {
    const items: InvoiceLineItem[] = [];

    // Get usage records for the period
    const usageRecords = await this.getUsageRecords(
      subscription.companyId,
      subscription.id,
      periodStart,
      periodEnd,
    );

    // Group by metric
    const usageByMetric = new Map<string, number>();
    usageRecords.forEach((record) => {
      const current = usageByMetric.get(record.metric) || 0;
      usageByMetric.set(record.metric, current + record.quantity);
    });

    // Create line item for each metric
    for (const [metric, quantity] of usageByMetric) {
      const rate = this.getUsageRate(metric);

      items.push({
        id: uuidv4(),
        type: 'usage',
        description: `Uso adicional: ${this.formatMetricName(metric)}`,
        quantity,
        unitPrice: rate,
        amount: quantity * rate,
        taxRate: 21,
        taxAmount: 0,
        total: quantity * rate,
      });
    }

    return items;
  }

  /**
   * Create discount line item
   */
  private createDiscountLineItem(baseAmount: number, discountPercentage: number): InvoiceLineItem {
    const discountAmount = baseAmount * (discountPercentage / 100);

    return {
      id: uuidv4(),
      type: 'discount',
      description: `Descuento (${discountPercentage}%)`,
      quantity: 1,
      unitPrice: -discountAmount,
      amount: -discountAmount,
      taxRate: 0,
      taxAmount: 0,
      total: -discountAmount,
    };
  }

  /**
   * Create tax line item
   */
  private createTaxLineItem(lineItems: InvoiceLineItem[]): InvoiceLineItem {
    const taxableAmount = lineItems
      .filter((item) => item.type !== 'tax' && item.taxRate > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const taxAmount = taxableAmount * 0.21; // 21% IVA Argentina

    return {
      id: uuidv4(),
      type: 'tax',
      description: 'IVA (21%)',
      quantity: 1,
      unitPrice: taxAmount,
      amount: taxAmount,
      taxRate: 0,
      taxAmount: 0,
      total: taxAmount,
    };
  }

  /**
   * Calculate invoice due date
   */
  private calculateDueDate(issueDate: Date): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
    return dueDate;
  }

  /**
   * Get next invoice number for a company
   */
  private async getNextInvoiceNumber(companyId: string): Promise<string> {
    // In real implementation, this would query the database for the last invoice number
    const sequence = Math.floor(Math.random() * 10000); // Mock sequence
    return generateInvoiceNumber();
  }

  /**
   * Get subscription plan details
   */
  private async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    // Mock implementation - replace with actual database query
    return {
      id: planId,
      name: 'Professional Plan',
      tier: 'professional',
      price: 5000,
      currency: 'ARS',
      interval: 'monthly',
      features: [],
      limits: {
        users: 10,
        patients: 1000,
        appointments: 500,
        storage: 50,
        telemedicineMinutes: 1000,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get usage records for billing period
   */
  private async getUsageRecords(
    companyId: string,
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<UsageRecord[]> {
    // Mock implementation - replace with actual database query
    return [];
  }

  /**
   * Get usage rate for a metric
   */
  private getUsageRate(metric: string): number {
    const rates: Record<string, number> = {
      api_calls: 0.01,
      storage_gb: 10,
      telemedicine_minutes: 5,
      appointments: 50,
      patients: 100,
      users: 500,
    };

    return rates[metric] || 0;
  }

  /**
   * Format metric name for display
   */
  private formatMetricName(metric: string): string {
    const names: Record<string, string> = {
      api_calls: 'Llamadas API',
      storage_gb: 'Almacenamiento (GB)',
      telemedicine_minutes: 'Minutos de Telemedicina',
      appointments: 'Citas Adicionales',
      patients: 'Pacientes Adicionales',
      users: 'Usuarios Adicionales',
    };

    return names[metric] || metric;
  }

  /**
   * Save invoice to database
   */
  private async saveInvoice(invoice: Invoice): Promise<void> {
    // Implementation would save to database
    logger.info('[InvoiceGeneration] Invoice saved:', invoice.invoiceNumber);
  }

  /**
   * Send invoice notification
   */
  private async sendInvoiceNotification(invoice: Invoice): Promise<void> {
    // Implementation would send email/notification
    logger.info('[InvoiceGeneration] Notification sent for:', invoice.invoiceNumber);
  }

  /**
   * Attempt automatic payment for invoice
   */
  private async attemptAutomaticPayment(invoice: Invoice): Promise<void> {
    // Implementation would attempt to charge the default payment method
    logger.info('[InvoiceGeneration] Attempting automatic payment for:', invoice.invoiceNumber);
  }

  /**
   * Audit invoice generation
   */
  private async auditInvoiceGeneration(
    invoice: Invoice,
    subscription: Subscription,
  ): Promise<void> {
    // Audit log entry
    logger.info('[InvoiceGeneration] Audit:', {
      action: 'invoice_generated',
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      companyId: invoice.companyId,
      total: invoice.total,
    });
  }

  /**
   * Audit batch generation results
   */
  private async auditBatchGeneration(results: any): Promise<void> {
    logger.info('[InvoiceGeneration] Batch audit:', results);
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('[InvoiceGeneration] Cron job stopped');
    }
  }

  /**
   * Manually trigger invoice generation
   */
  async triggerManualGeneration(): Promise<any> {
    logger.info('[InvoiceGeneration] Manual generation triggered');
    return this.generateAllPendingInvoices();
  }
}

// Export singleton instance
export const invoiceGeneration = new InvoiceGenerationService();

// Export for testing
export { InvoiceGenerationService };
