import { z } from 'zod';

/**
 * Billing Types and Schemas
 * For subscription management and invoicing
 */

// ============= SUBSCRIPTION SCHEMAS =============

export const SubscriptionStatus = z.enum([
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
]);

export const BillingInterval = z.enum(['monthly', 'quarterly', 'yearly']);

export const PlanTier = z.enum(['free', 'starter', 'professional', 'enterprise', 'custom']);

/**
 * Subscription Plan Schema
 */
export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  tier: PlanTier,
  price: z.number().min(0),
  currency: z.string().length(3).default('ARS'), // Argentine Peso default
  interval: BillingInterval,
  features: z.array(z.string()),
  limits: z.object({
    users: z.number().min(1),
    patients: z.number().min(0),
    appointments: z.number().min(0),
    storage: z.number().min(0), // in GB
    telemedicineMinutes: z.number().min(0)
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Subscription Schema
 */
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  planId: z.string().uuid(),
  status: SubscriptionStatus,
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAt: z.date().nullable().optional(),
  canceledAt: z.date().nullable().optional(),
  trialStart: z.date().nullable().optional(),
  trialEnd: z.date().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  
  // Payment gateway references
  externalSubscriptionId: z.string().optional(), // Stripe/MP subscription ID
  externalCustomerId: z.string().optional(),
  
  // Billing details
  quantity: z.number().min(1).default(1),
  discount: z.number().min(0).max(100).default(0), // Percentage
  
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============= INVOICE SCHEMAS =============

export const InvoiceStatus = z.enum([
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
  'partially_paid'
]);

export const InvoiceLineItemType = z.enum([
  'subscription',
  'usage',
  'one_time',
  'discount',
  'tax'
]);

/**
 * Invoice Line Item Schema
 */
export const InvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  type: InvoiceLineItemType,
  description: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number(),
  amount: z.number(), // quantity * unitPrice
  taxRate: z.number().min(0).max(100).default(21), // Argentina IVA 21%
  taxAmount: z.number(),
  total: z.number(), // amount + taxAmount
  metadata: z.record(z.any()).optional()
});

/**
 * Invoice Schema
 */
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(), // Sequential invoice number
  companyId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  status: InvoiceStatus,
  
  // Billing period
  periodStart: z.date(),
  periodEnd: z.date(),
  
  // Amounts (all in currency units, not cents)
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  amountPaid: z.number().min(0).default(0),
  amountDue: z.number().min(0),
  currency: z.string().length(3).default('ARS'),
  
  // Line items
  lineItems: z.array(InvoiceLineItemSchema),
  
  // Dates
  issuedAt: z.date(),
  dueAt: z.date(),
  paidAt: z.date().nullable().optional(),
  voidedAt: z.date().nullable().optional(),
  
  // Payment details
  paymentMethod: z.string().optional(),
  paymentIntentId: z.string().optional(), // Stripe/MP payment reference
  receiptUrl: z.string().url().optional(),
  
  // Argentine tax requirements
  cuit: z.string().optional(), // Company tax ID
  invoiceType: z.enum(['A', 'B', 'C']).default('B'), // Argentine invoice types
  cae: z.string().optional(), // Electronic invoice authorization code
  caeExpiryDate: z.date().optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============= PAYMENT METHOD SCHEMAS =============

export const PaymentMethodType = z.enum([
  'card',
  'bank_transfer',
  'mercadopago',
  'cash',
  'check'
]);

/**
 * Payment Method Schema
 */
export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  type: PaymentMethodType,
  isDefault: z.boolean().default(false),
  
  // Card details (if applicable)
  last4: z.string().length(4).optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(new Date().getFullYear()).optional(),
  
  // Bank details (if applicable)
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  cbu: z.string().optional(), // Argentine bank account identifier
  
  // External references
  externalMethodId: z.string().optional(), // Stripe/MP payment method ID
  
  // Status
  isActive: z.boolean().default(true),
  verifiedAt: z.date().optional(),
  
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============= BILLING HISTORY SCHEMAS =============

/**
 * Billing Event Schema - For audit trail
 */
export const BillingEventSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  type: z.enum([
    'subscription_created',
    'subscription_updated',
    'subscription_canceled',
    'invoice_created',
    'invoice_paid',
    'invoice_failed',
    'payment_method_added',
    'payment_method_removed',
    'payment_method_updated',
    'refund_issued'
  ]),
  resourceId: z.string(), // ID of the affected resource
  resourceType: z.enum(['subscription', 'invoice', 'payment_method']),
  amount: z.number().optional(),
  currency: z.string().optional(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date()
});

// ============= USAGE TRACKING SCHEMAS =============

/**
 * Usage Record Schema - For usage-based billing
 */
export const UsageRecordSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  metric: z.enum([
    'api_calls',
    'storage_gb',
    'telemedicine_minutes',
    'appointments',
    'patients',
    'users'
  ]),
  quantity: z.number().min(0),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

// ============= TYPE EXPORTS =============

export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;
export type BillingInterval = z.infer<typeof BillingInterval>;
export type PlanTier = z.infer<typeof PlanTier>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;

export type InvoiceStatus = z.infer<typeof InvoiceStatus>;
export type InvoiceLineItemType = z.infer<typeof InvoiceLineItemType>;
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;

export type PaymentMethodType = z.infer<typeof PaymentMethodType>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type BillingEvent = z.infer<typeof BillingEventSchema>;
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

// ============= HELPER FUNCTIONS =============

/**
 * Calculate next billing date
 */
export function getNextBillingDate(
  currentPeriodEnd: Date,
  interval: BillingInterval
): Date {
  const date = new Date(currentPeriodEnd);
  
  switch (interval) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date;
}

/**
 * Calculate prorated amount for partial billing period
 */
export function calculateProratedAmount(
  fullAmount: number,
  daysInPeriod: number,
  daysUsed: number
): number {
  return Math.round((fullAmount * daysUsed / daysInPeriod) * 100) / 100;
}

/**
 * Generate sequential invoice number
 */
export function generateInvoiceNumber(
  companyId: string,
  sequence: number,
  prefix = 'INV'
): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(lineItems: InvoiceLineItem[]): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = lineItems
    .filter(item => item.type !== 'tax')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const taxAmount = lineItems
    .filter(item => item.type === 'tax')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const total = subtotal + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}