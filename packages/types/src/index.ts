// ==================== COMMON TYPES ====================
export { User, UserRole, UserWithName, userToNameFormat, normalizeUser } from './types/base';
// Location se exporta más abajo para evitar duplicación

export type Hospital = {
  id: string;
  name: string;
};

export default {};
/**
 * @fileoverview Punto de entrada simplificado para @altamedica/types
 * @module @altamedica/types
 * @description Exporta tipos básicos esenciales para compilación
 */

// ==================== CORE TYPES ====================
export * from './core';
// Exportar solo Location desde common para evitar conflictos
export type { Location } from './common';

// ==================== AUTH TYPES (exports explícitos para evitar conflictos) ====================
export type {
  AuthContext,
  AuthResult,
  AuthToken,
  SSOLoginRequest,
  SSOLoginResponse,
} from './auth/auth-token';
export {
  isAdminRole,
  isBusinessRole,
  isClinicalRole,
  isCompanyRole,
  isDoctorRole,
  isPatientRole,
  normalizeUserRole,
  Roles,
  UserRole,
} from './auth/roles';

// ==================== MEDICAL DOMAIN ====================
export * from './medical';
// Re-export específicos de medication para evitar conflictos
export {
  CreateMedicationSchema,
  MedicationSchema,
  MedicationSearchSchema,
  UpdateMedicationSchema,
} from './medical/medication.types';
export type { DosageForm, MedicationCategory, MedicationSearch } from './medical/medication.types';

// ==================== TYPE ALIASES FOR BACKWARD COMPATIBILITY ====================
// These re-exports provide compatibility for hooks that expect specific named exports
export type { Appointment, VitalSigns } from './medical/clinical/appointment.types';
export type { LabResult } from './medical/clinical/lab-result.types';
export type { MedicalHistory } from './medical/clinical/medical-history.types';
export type { Medication } from './medical/medication.types'; // Nuevo tipo Medication con id obligatorio
export type { PatientProfile as Patient } from './medical/patient/patient.types';

// ==================== API TYPES ====================
export * from './api';

// ==================== SECURITY TYPES ====================
export * from './security';

// ==================== SIGNALING TYPES ====================
export * from './signaling';

// ==================== TELEMEDICINE QoS TYPES ====================
export * from './telemedicine/qos.types';

// ==================== AUDIT TYPES ====================
export * from './audit';

// ==================== BILLING TYPES ====================
export * from './billing';

// ==================== BAA TYPES ====================
export * from './baa';

// ==================== PRESCRIPTION TYPES ====================
export * from './prescription';

// ==================== BUSINESS / COMPANY DOMAIN ====================
// Export selectivo para evitar colisiones (Optional, PaginatedResponse) ya definidos en core/company.
// Evitamos re-exportar utilitarios genéricos con el mismo nombre.
export type {
  Address,
  ApplicationStatus,
  BusinessHours,
  Company,
  CompanyAnalytics,
  CompanyDoctor,
  CompanyFilters,
  CompanyFormData,
  CompanySize,
  CompanyStatus,
  CompanyType,
  ContactInfo,
  CreateCompanyData,
  CreateJobOfferData,
  DoctorStatus,
  EmploymentType,
  ExperienceLevel,
  JobApplication, // nombre no colisiona tras export selectivo
  JobFilters,
  JobOffer,
  JobOfferFormData,
  JobStatus,
  JobType,
  UpdateCompanyData,
  UpdateJobOfferData,
} from './company';
// Esquemas de validación de dominio Company
export {
  AddressSchema,
  BusinessHoursSchema,
  CompanySchema,
  ContactInfoSchema,
  JobOfferSchema,
} from './company';
export * from './employee';

// ==================== B2C COMMUNICATION ====================
// This exports JobApplication and other B2C communication types
export * from './b2c/company-doctor-communication.types';

// ==================== AI TYPES ====================
export * from './ai';

// ==================== MARKETPLACE DOMAIN ====================
// Export everything except Coordinates to avoid conflict with core types
export type {
  // Marketplace Company Types
  MarketplaceCompanyType,
  MarketplaceDoctor,
  MarketplaceDoctorService,
  MarketplaceDoctorVerificationStatus,
  MarketplaceJobOffer,
  // Marketplace Doctor Types
  MarketplaceWorkArrangement,
} from './marketplace';

// ==================== LEGACY EXPORTS (DEPRECATED) ====================
// Estos exports se mantendrán temporalmente para compatibilidad
// y serán removidos en la versión 2.0

import { z } from 'zod';

/**
 * @deprecated Use UserRole from '@altamedica/types/core' instead
 */
export const UserRoleSchema = z.enum(['admin', 'doctor', 'patient', 'staff']);

/**
 * @deprecated Use specific types from their respective modules
 */
export const SpecialtySchema = z.enum([
  'cardiology',
  'dermatology',
  'endocrinology',
  'gastroenterology',
  'general_practice',
  'gynecology',
  'neurology',
  'oncology',
  'ophthalmology',
  'orthopedics',
  'pediatrics',
  'psychiatry',
  'pulmonology',
  'radiology',
  'surgery',
  'urology',
]);

// ==================== MONITORING / HOSPITAL INTEGRATION ====================
// Export explícito renombrado para evitar colisión con módulos médicos
export type { DataSource, MonitoringValidationResult, SaturationLevel } from './monitoring.types';

// ==================== VERSION INFO ====================
export const TYPES_VERSION = '1.1.2'; // Added Medication types and catalog support
export const TYPES_COMPATIBILITY = {
  minimum: '1.0.0',
  breaking: '2.0.0',
};
