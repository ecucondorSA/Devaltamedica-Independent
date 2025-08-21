/**
 * 📋 CENTRALIZED SCHEMAS - ALTAMEDICA DATABASE
 * Todos los schemas Zod centralizados para validación consistente
 * Migrados desde API server y mejorados con validaciones médicas
 */

// Re-export medical schemas
export { MedicalRecordSchema, type MedicalRecord } from '../repositories/MedicalRecordRepository.js';
export { PatientSchema, type Patient } from '../repositories/PatientRepository.js';
export { CompanySchema, type Company } from '../repositories/CompanyRepository.js';
export { MarketplaceOfferSchema, ApplicationSchema, type MarketplaceOffer, type Application } from '../repositories/MarketplaceRepository.js';

// Nuevos schemas centralizados
export * from './medical-schemas';
export * from './user-schemas';
export * from './appointment-schemas';

// Export common schemas but exclude AuditLog to avoid conflict with audit.schema
export {
  BaseEntitySchema,
  ServiceContextSchema,
  PaginationSchema,
  AddressSchema,
  ContactInfoSchema,
  EmergencyContactSchema,
  AttachmentSchema,
  VitalSignsSchema,
  MedicalCodeSchema,
  MedicationSchema,
  InsuranceSchema,
  AllergySchema,
  LabTestSchema,
  NotificationPreferencesSchema,
  PrivacySettingsSchema,
  ValidationErrorSchema,
  ApiResponseSchema,
  HealthCheckSchema,
  type BaseEntity,
  type ServiceContext,
  type Pagination,
  type Address,
  type ContactInfo,
  type EmergencyContact,
  type Attachment,
  type VitalSigns,
  type MedicalCode,
  type Medication,
  type Insurance,
  type Allergy,
  type LabTest,
  type NotificationPreferences,
  type PrivacySettings,
  type ValidationError,
  type ApiResponse,
  type HealthCheck
} from './common-schemas';

// Export audit schema from the specialized audit module  
export * from './audit.schema';