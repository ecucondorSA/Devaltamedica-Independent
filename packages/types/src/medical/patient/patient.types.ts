/**
 * @fileoverview Tipos para entidades de pacientes
 * @module @altamedica/types/medical/patient
 * @description Definiciones de tipos para pacientes con compliance HIPAA
 */

import { z } from 'zod';
import { BaseEntity } from '../../core/base.types';
import { EncryptedDNI, PatientId } from '../../core/branded.types';

// ==================== ENUMS ====================

/**
 * Tipos de sangre válidos
 * @enum {string}
 */
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

/**
 * Géneros biológicos
 * @enum {string}
 */
export enum BiologicalGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

/**
 * Tipos de documento de identidad (Argentina)
 * @enum {string}
 */
export enum DocumentType {
  DNI = 'DNI',
  PASSPORT = 'PASSPORT',
  CEDULA = 'CEDULA',
  LC = 'LC',
  LE = 'LE'
}

// ==================== INTERFACES ====================

/**
 * Información de contacto de emergencia
 * @interface EmergencyContact
 * @hipaa-note Información sensible - requiere encriptación
 */
export interface EmergencyContact {
  /** Nombre completo del contacto */
  name: string;
  /** Relación con el paciente */
  relationship: string;
  /** Teléfono principal */
  phoneNumber: string;
  /** Teléfono alternativo */
  alternativePhone?: string;
  /** Email de contacto */
  email?: string;
}

/**
 * Información del seguro médico
 * @interface InsuranceInfo
 */
export interface InsuranceInfo {
  /** Proveedor del seguro */
  provider: string;
  /** Número de póliza */
  policyNumber: string;
  /** Número de grupo */
  groupNumber?: string;
  /** Fecha de inicio de cobertura */
  coverageStartDate: Date;
  /** Fecha de fin de cobertura */
  coverageEndDate?: Date;
  /** Plan de cobertura */
  planName?: string;
  /** Copago estándar */
  copayAmount?: number;
}

/**
 * Medicación actual del paciente
 * @interface PatientMedication
 */
export interface PatientMedication {
  /** Identificador opcional (cuando proviene de un catálogo o registro persistido) */
  id?: string;
  /** Nombre del medicamento */
  name: string;
  /** Dosis y unidad */
  dosage: string;
  /** Frecuencia de administración */
  frequency: string;
  /** Vía de administración */
  route: 'oral' | 'iv' | 'im' | 'subcutaneous' | 'topical' | 'other';
  /** Fecha de inicio */
  startDate: Date;
  /** Fecha de fin (si aplica) */
  endDate?: Date;
  /** Médico que prescribió */
  prescribedBy: string;
  /** Razón de la prescripción */
  reason: string;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Perfil completo del paciente con información médica protegida
 * @interface PatientProfile
 * @extends BaseEntity
 * @hipaa-compliant true
 * @pii-level high
 * @encryption-required true
 * @audit-level full
 * @retention-policy 25 years post-death
 * 
 * @description
 * Contiene toda la información médica y personal del paciente.
 * Todos los campos marcados como PHI están encriptados en reposo.
 * 
 * @example
 * ```typescript
 * const patient: PatientProfile = {
 *   id: createPatientId('pat_123'),
 *   userId: 'user_456',
 *   medicalRecordNumber: 'MRN-789',
 *   dateOfBirth: new Date('1990-01-01'),
 *   gender: BiologicalGender.FEMALE,
 *   documentType: DocumentType.DNI,
 *   documentNumber: encryptPHI('12345678'),
 *   bloodType: BloodType.O_POSITIVE,
 *   // ... otros campos
 * };
 * ```
 * 
 * @compliance
 * - HIPAA Privacy Rule: §164.514(b)(2)(i)
 * - GDPR Article 9: Special categories of personal data
 * - Argentina Ley 25.326: Datos sensibles
 * 
 * @security
 * - Acceso restringido por rol
 * - Auditoría completa de accesos
 * - Encriptación AES-256 para PHI
 */
export interface PatientProfile extends BaseEntity {
  /** ID único del paciente (branded type) */
  id: PatientId;
  /** ID del usuario asociado */
  userId: string;
  /** Número de historia clínica */
  medicalRecordNumber: string;
  
  // Información personal (PHI - Protected Health Information)
  /** 
   * Fecha de nacimiento del paciente
   * @phi true
   * @encryption-level AES-256
   * @format ISO 8601 date
   * @validation Must be in the past and reasonable (not before 1900)
   * @compliance HIPAA identifier - requires special handling
   */
  dateOfBirth: Date;
  
  /** 
   * Género biológico asignado al nacer
   * @phi true
   * @values "male" | "female" | "other"
   * @note Usado para cálculos médicos y referencias normales
   * @compliance Sensitive data under GDPR Article 9
   */
  gender: BiologicalGender;
  
  /** 
   * Tipo de documento de identidad según normativa argentina
   * @values "DNI" | "PASSPORT" | "CEDULA" | "LC" | "LE"
   * @regulation RENAPER (Argentina)
   */
  documentType: DocumentType;
  
  /** 
   * Número de documento de identidad
   * @phi true
   * @encryption-required true
   * @type EncryptedDNI - Branded type for additional security
   * @format Encrypted string using AES-256-GCM
   * @compliance HIPAA identifier - unique to individual
   * @audit-required true
   */
  documentNumber: EncryptedDNI;
  
  // Información médica básica
  /** Tipo de sangre */
  bloodType?: BloodType;
  /** Factor RH */
  rhFactor?: '+' | '-';
  /** Altura en centímetros */
  height?: number;
  /** Peso en kilogramos */
  weight?: number;
  
  // Arrays de información médica crítica
  /** 
   * Alergias conocidas del paciente
   * @phi true
   * @critical-for-safety true
   * @alert-level high
   * @description Lista de sustancias que causan reacciones alérgicas
   * @example ["Penicilina", "Mariscos", "Polen de gramíneas"]
   * @validation Cada alergia debe estar en formato estándar
   * @clinical-impact Vital para prevenir reacciones adversas
   * @compliance Debe ser visible en todos los encuentros clínicos
   */
  allergies: string[];
  
  /** 
   * Condiciones médicas crónicas
   * @phi true
   * @critical-for-care true
   * @description Enfermedades de larga duración que requieren manejo continuo
   * @example ["Diabetes Tipo 2", "Hipertensión Arterial", "Asma"]
   * @coding-system ICD-10 preferred
   * @clinical-impact Afecta planes de tratamiento y prescripciones
   * @monitoring-required true
   */
  chronicConditions: string[];
  
  /** 
   * Medicaciones actuales del paciente
   * @phi true
   * @critical-for-safety true
   * @drug-interaction-check required
   * @description Lista completa de medicamentos que toma el paciente
   * @validation Verificar interacciones antes de nuevas prescripciones
   * @update-frequency Regular - al menos cada consulta
   * @compliance Requerido para cumplimiento regulatorio
   */
  medications: PatientMedication[];
  /** Cirugías previas */
  surgeries: PastSurgery[];
  /** Vacunas aplicadas */
  vaccinations: Vaccination[];
  
  // Información de contacto y seguro
  /** Contacto de emergencia */
  emergencyContact?: EmergencyContact;
  /** Información del seguro */
  insuranceInfo?: InsuranceInfo;
  
  // Asociación con empresa
  /** ID de la empresa (si aplica) */
  companyId?: string;
  
  // Preferencias y configuración
  /** Preferencias del paciente */
  preferences?: PatientPreferences;
  
  // Compliance y consentimiento
  /** Consentimiento para tratamiento de datos */
  dataConsent: DataConsent;
  /** Directivas anticipadas */
  advanceDirectives?: AdvanceDirectives;
}

/**
 * Cirugía previa del paciente
 * @interface PastSurgery
 */
export interface PastSurgery {
  /** Nombre del procedimiento */
  procedure: string;
  /** Fecha de la cirugía */
  date: Date;
  /** Hospital donde se realizó */
  hospital: string;
  /** Cirujano principal */
  surgeon: string;
  /** Complicaciones (si hubo) */
  complications?: string;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Registro de vacunación
 * @interface Vaccination
 */
export interface Vaccination {
  /** Nombre de la vacuna */
  vaccine: string;
  /** Fecha de aplicación */
  date: Date;
  /** Dosis (1ra, 2da, refuerzo, etc) */
  dose: string;
  /** Lote de la vacuna */
  lotNumber?: string;
  /** Lugar de aplicación */
  administeredAt: string;
  /** Profesional que administró */
  administeredBy: string;
  /** Fecha de próxima dosis */
  nextDoseDate?: Date;
}

/**
 * Preferencias del paciente
 * @interface PatientPreferences
 */
export interface PatientPreferences {
  /** Idioma preferido para comunicación */
  preferredLanguage: string;
  /** Método de contacto preferido */
  preferredContactMethod: 'phone' | 'email' | 'sms' | 'whatsapp';
  /** Horario preferido para citas */
  preferredAppointmentTimes?: {
    dayOfWeek: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  };
  /** Preferencias de notificación */
  notificationPreferences: {
    appointmentReminders: boolean;
    medicationReminders: boolean;
    healthTips: boolean;
    labResults: boolean;
  };
}

/**
 * Consentimiento de datos del paciente
 * @interface DataConsent
 */
export interface DataConsent {
  /** Consentimiento para tratamiento de datos */
  dataProcessing: boolean;
  /** Fecha del consentimiento */
  consentDate: Date;
  /** Versión del acuerdo de consentimiento */
  consentVersion: string;
  /** Consentimiento para compartir con terceros */
  shareWithThirdParties?: boolean;
  /** Consentimiento para investigación */
  researchParticipation?: boolean;
  /** IP desde donde se dio el consentimiento */
  consentIP?: string;
}

/**
 * Directivas anticipadas del paciente
 * @interface AdvanceDirectives
 */
export interface AdvanceDirectives {
  /** Tiene directivas anticipadas */
  hasDirectives: boolean;
  /** Tipo de directivas */
  type?: 'living_will' | 'power_of_attorney' | 'dnr' | 'other';
  /** Fecha de las directivas */
  date?: Date;
  /** Ubicación del documento */
  documentLocation?: string;
  /** Persona designada para decisiones médicas */
  healthcareProxy?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

// ==================== SCHEMAS ====================

/**
 * Schema de validación para perfil de paciente
 */
export const PatientProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  medicalRecordNumber: z.string(),
  dateOfBirth: z.date(),
  gender: z.nativeEnum(BiologicalGender),
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string(),
  bloodType: z.nativeEnum(BloodType).optional(),
  rhFactor: z.enum(['+', '-']).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    route: z.enum(['oral', 'iv', 'im', 'subcutaneous', 'topical', 'other']),
    startDate: z.date(),
    endDate: z.date().optional(),
    prescribedBy: z.string(),
    reason: z.string(),
    notes: z.string().optional()
  })),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phoneNumber: z.string(),
    alternativePhone: z.string().optional(),
    email: z.string().email().optional()
  }).optional(),
  insuranceInfo: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional(),
    coverageStartDate: z.date(),
    coverageEndDate: z.date().optional(),
    planName: z.string().optional(),
    copayAmount: z.number().optional()
  }).optional(),
  companyId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para creación de paciente
 */
export const CreatePatientSchema = PatientProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualización de paciente
 */
export const UpdatePatientSchema = CreatePatientSchema.partial();