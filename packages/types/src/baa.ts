import { z } from 'zod';

/**
 * Business Associate Agreement (BAA) Types
 * Cumple con requisitos HIPAA para asociados de negocio
 * Incluye versionado y trazabilidad para compliance
 */

// Estado del BAA
export const BAAStatusSchema = z.enum([
  'draft',
  'pending_review',
  'pending_signature', 
  'active',
  'expired',
  'terminated',
  'superseded'
]);

// Tipo de entidad
export const EntityTypeSchema = z.enum([
  'healthcare_provider',
  'business_associate',
  'subcontractor',
  'technology_vendor',
  'consulting_firm',
  'other'
]);

// Información de la empresa
export const CompanyInfoSchema = z.object({
  legalName: z.string().min(1),
  tradeName: z.string().optional(),
  taxId: z.string(), // EIN en USA, CUIT en Argentina
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  contactPerson: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    phone: z.string()
  }),
  entityType: EntityTypeSchema
});

// Versión del BAA
export const BAAVersionSchema = z.object({
  versionNumber: z.string(), // e.g., "1.0", "2.1"
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  changes: z.array(z.string()).optional(), // Lista de cambios respecto a versión anterior
  templateId: z.string(), // ID del template base usado
  language: z.enum(['en', 'es', 'pt']).default('es')
});

// Cláusulas y obligaciones
export const BAAObligationsSchema = z.object({
  // Obligaciones de seguridad
  implementSafeguards: z.boolean().default(true),
  reportBreaches: z.boolean().default(true),
  breachNotificationPeriod: z.number().default(60), // días
  
  // Uso y divulgación de PHI
  useOnlyAsPermitted: z.boolean().default(true),
  minimumNecessary: z.boolean().default(true),
  deIdentification: z.boolean().default(false),
  
  // Subcontratistas
  subcontractorsAllowed: z.boolean().default(false),
  subcontractorBAARequired: z.boolean().default(true),
  
  // Retención y destrucción
  retentionPeriod: z.number().optional(), // años
  secureDestruction: z.boolean().default(true),
  returnPHIOnTermination: z.boolean().default(true),
  
  // Auditoría y monitoreo
  allowAudits: z.boolean().default(true),
  auditFrequency: z.enum(['annual', 'biannual', 'quarterly', 'on_demand']).default('annual'),
  
  // Indemnización
  indemnification: z.boolean().default(true),
  liabilityLimit: z.number().optional(), // en USD
  
  // Jurisdicción
  governingLaw: z.string().default('Argentina'),
  disputeResolution: z.enum(['arbitration', 'mediation', 'litigation']).default('mediation')
});

// Firma digital
export const DigitalSignatureSchema = z.object({
  signedBy: z.string(), // userId
  signedAt: z.date(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  signatureMethod: z.enum(['electronic', 'digital_certificate', 'biometric']).default('electronic'),
  signatureData: z.string(), // Hash o datos de la firma
  certificateId: z.string().optional() // Si usa certificado digital
});

// Schema principal del BAA
export const BAASchema = z.object({
  id: z.string(),
  
  // Partes del acuerdo
  coveredEntityId: z.string(), // AltaMedica Platform
  businessAssociateId: z.string(), // ID de la empresa
  
  // Información de las empresas
  coveredEntityInfo: CompanyInfoSchema,
  businessAssociateInfo: CompanyInfoSchema,
  
  // Versión y vigencia
  version: BAAVersionSchema,
  status: BAAStatusSchema,
  
  // Términos y obligaciones
  obligations: BAAObligationsSchema,
  
  // Propósitos permitidos
  permittedPurposes: z.array(z.string()),
  permittedPHITypes: z.array(z.string()),
  
  // Firmas
  coveredEntitySignature: DigitalSignatureSchema.optional(),
  businessAssociateSignature: DigitalSignatureSchema.optional(),
  
  // Documentos adjuntos
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedAt: z.date(),
    uploadedBy: z.string()
  })).optional(),
  
  // Metadatos
  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string(),
  
  // Historial de cambios
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.date(),
    userId: z.string(),
    changes: z.record(z.any()).optional()
  })).optional(),
  
  // Notas y comentarios
  notes: z.string().optional(),
  internalNotes: z.string().optional(), // Solo visible para admins
  
  // Compliance tracking
  lastReviewDate: z.date().optional(),
  nextReviewDate: z.date().optional(),
  complianceScore: z.number().min(0).max(100).optional(),
  complianceIssues: z.array(z.string()).optional()
});

// Template de BAA
export const BAATemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  language: z.enum(['en', 'es', 'pt']),
  content: z.string(), // HTML o Markdown del contenido
  variables: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['text', 'date', 'number', 'boolean', 'select']),
    required: z.boolean(),
    defaultValue: z.any().optional()
  })),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Request para crear BAA
export const CreateBAASchema = BAASchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  coveredEntitySignature: true,
  businessAssociateSignature: true,
  history: true
});

// Request para actualizar BAA
export const UpdateBAASchema = BAASchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// Request para firmar BAA
export const SignBAASchema = z.object({
  baaId: z.string(),
  signatureData: z.string(),
  signatureMethod: z.enum(['electronic', 'digital_certificate', 'biometric']).optional(),
  certificateId: z.string().optional()
});

// Tipos TypeScript
export type BAAStatus = z.infer<typeof BAAStatusSchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
export type BAAVersion = z.infer<typeof BAAVersionSchema>;
export type BAAObligations = z.infer<typeof BAAObligationsSchema>;
export type DigitalSignature = z.infer<typeof DigitalSignatureSchema>;
export type BAA = z.infer<typeof BAASchema>;
export type BAATemplate = z.infer<typeof BAATemplateSchema>;
export type CreateBAA = z.infer<typeof CreateBAASchema>;
export type UpdateBAA = z.infer<typeof UpdateBAASchema>;
export type SignBAA = z.infer<typeof SignBAASchema>;

// Funciones de utilidad
export const generateBAAId = (): string => {
  return `baa_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
};

export const isBAAActive = (baa: BAA): boolean => {
  if (baa.status !== 'active') return false;
  
  const now = new Date();
  if (baa.version.expirationDate && now > baa.version.expirationDate) {
    return false;
  }
  
  return true;
};

export const isBAASignedByBothParties = (baa: BAA): boolean => {
  return !!(baa.coveredEntitySignature && baa.businessAssociateSignature);
};

export const getBAAComplianceStatus = (baa: BAA): {
  isCompliant: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (!isBAAActive(baa)) {
    issues.push('BAA no está activo');
  }
  
  if (!isBAASignedByBothParties(baa)) {
    issues.push('BAA no está firmado por ambas partes');
  }
  
  if (baa.nextReviewDate && new Date() > baa.nextReviewDate) {
    issues.push('BAA requiere revisión');
  }
  
  if (baa.complianceScore && baa.complianceScore < 80) {
    issues.push('Puntuación de compliance baja');
  }
  
  if (baa.complianceIssues && baa.complianceIssues.length > 0) {
    issues.push(...baa.complianceIssues);
  }
  
  return {
    isCompliant: issues.length === 0,
    issues
  };
};