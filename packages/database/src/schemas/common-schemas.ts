/**
 * 🔧 COMMON SCHEMAS - ALTAMEDICA
 * Schemas comunes reutilizables en toda la aplicación
 */

import { z } from 'zod';

// Base Entity Schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().min(1),
  updatedBy: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active')
});

// Service Context Schema
export const ServiceContextSchema = z.object({
  userId: z.string().min(1),
  userRole: z.enum(['patient', 'doctor', 'admin', 'company']),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional()
});

// Pagination Schema
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  cursor: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Address Schema
export const AddressSchema = z.object({
  street: z.string().min(1, "La calle es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  zipCode: z.string().min(3, "El código postal es requerido"),
  country: z.string().default('Mexico')
});

// Contact Info Schema
export const ContactInfoSchema = z.object({
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Número de teléfono inválido").optional(),
  alternativePhone: z.string().optional()
});

// Emergency Contact Schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  relationship: z.string().min(2, "La relación es requerida"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Número inválido"),
  email: z.string().email("Email inválido").optional()
});

// File Attachment Schema
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "El nombre del archivo es requerido"),
  type: z.string().min(1, "El tipo de archivo es requerido"),
  size: z.number().positive("El tamaño debe ser positivo"),
  url: z.string().url("URL inválida"),
  uploadedAt: z.date(),
  uploadedBy: z.string().min(1)
});

// Vital Signs Schema
export const VitalSignsSchema = z.object({
  bloodPressure: z.object({
    systolic: z.number().min(50).max(300, "Presión sistólica fuera de rango"),
    diastolic: z.number().min(30).max(200, "Presión diastólica fuera de rango")
  }).optional(),
  heartRate: z.number().min(30).max(250, "Frecuencia cardíaca fuera de rango").optional(),
  temperature: z.number().min(30).max(45, "Temperatura fuera de rango").optional(),
  weight: z.number().min(1).max(500, "Peso fuera de rango").optional(),
  height: z.number().min(30).max(250, "Altura fuera de rango").optional(),
  oxygenSaturation: z.number().min(0).max(100, "Saturación de oxígeno inválida").optional(),
  respiratoryRate: z.number().min(5).max(60, "Frecuencia respiratoria fuera de rango").optional()
});

// Medical Codes Schema (ICD-10, etc.)
export const MedicalCodeSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  system: z.enum(['ICD-10', 'ICD-11', 'SNOMED-CT', 'CPT', 'LOINC']),
  display: z.string().min(1, "La descripción es requerida"),
  version: z.string().optional()
});

// Medication Schema
export const MedicationSchema = z.object({
  name: z.string().min(1, "El nombre del medicamento es requerido"),
  activeIngredient: z.string().optional(),
  dosage: z.string().min(1, "La dosis es requerida"),
  unit: z.string().min(1, "La unidad es requerida"),
  frequency: z.string().min(1, "La frecuencia es requerida"),
  route: z.enum(['oral', 'intravenous', 'intramuscular', 'topical', 'inhalation', 'other']).default('oral'),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  prescribedBy: z.string().min(1, "El médico prescriptor es requerido"),
  prescribedDate: z.date(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true)
});

// Insurance Schema
export const InsuranceSchema = z.object({
  provider: z.string().min(1, "El proveedor es requerido"),
  policyNumber: z.string().min(1, "El número de póliza es requerido"),
  groupNumber: z.string().optional(),
  memberNumber: z.string().optional(),
  coverageType: z.enum(['basic', 'premium', 'comprehensive']).default('basic'),
  validFrom: z.date(),
  validTo: z.date(),
  isActive: z.boolean().default(true)
});

// Allergy Schema
export const AllergySchema = z.object({
  allergen: z.string().min(1, "El alérgeno es requerido"),
  type: z.enum(['drug', 'food', 'environmental', 'other']),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
  reaction: z.string().min(1, "La reacción es requerida"),
  onsetDate: z.date().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Lab Test Result Schema
export const LabTestSchema = z.object({
  testName: z.string().min(1, "El nombre del examen es requerido"),
  testCode: z.string().optional(),
  result: z.string().min(1, "El resultado es requerido"),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  abnormalFlag: z.enum(['normal', 'high', 'low', 'critical']).default('normal'),
  testDate: z.date(),
  resultDate: z.date(),
  laboratoryName: z.string().min(1, "El laboratorio es requerido"),
  orderedBy: z.string().min(1, "El médico solicitante es requerido"),
  notes: z.string().optional()
});

// Notification Preferences Schema
export const NotificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(true),
  push: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  medicationReminders: z.boolean().default(true),
  testResults: z.boolean().default(true),
  promotions: z.boolean().default(false)
});

// Privacy Settings Schema
export const PrivacySettingsSchema = z.object({
  shareDataForResearch: z.boolean().default(false),
  allowMarketingCommunications: z.boolean().default(false),
  showInDirectory: z.boolean().default(false),
  allowDataExport: z.boolean().default(true)
});

// Audit Log Schema
export const AuditLogSchema = z.object({
  action: z.string().min(1, "La acción es requerida"),
  entityType: z.string().min(1, "El tipo de entidad es requerido"),
  entityId: z.string().min(1, "El ID de entidad es requerido"),
  userId: z.string().min(1, "El ID de usuario es requerido"),
  userRole: z.enum(['patient', 'doctor', 'admin', 'company']),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
  environment: z.string().default('development')
});

// Validation Error Schema
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.any().optional()
});

// API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.array(ValidationErrorSchema).optional()
  }).optional(),
  metadata: z.object({
    timestamp: z.date(),
    requestId: z.string(),
    version: z.string()
  }).optional()
});

// Health Check Schema
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  services: z.record(z.boolean()),
  timestamp: z.date(),
  version: z.string(),
  uptime: z.number(),
  metrics: z.record(z.number()).optional()
});

// Export types
export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type ServiceContext = z.infer<typeof ServiceContextSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type VitalSigns = z.infer<typeof VitalSignsSchema>;
export type MedicalCode = z.infer<typeof MedicalCodeSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type Insurance = z.infer<typeof InsuranceSchema>;
export type Allergy = z.infer<typeof AllergySchema>;
export type LabTest = z.infer<typeof LabTestSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;