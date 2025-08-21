/**
 * @fileoverview Tipos para entidades de doctores y profesionales médicos
 * @module @altamedica/types/medical/doctor
 * @description Definiciones de tipos para profesionales médicos con compliance regulatorio
 */

import { z } from 'zod';
import { BaseEntity, BaseUser } from '../../core/base.types';
import { DoctorId } from '../../core/branded.types';

// ==================== ENUMS ====================

/**
 * Especialidades médicas disponibles
 * @enum {string}
 */
export enum MedicalSpecialty {
  ANESTHESIOLOGY = 'anesthesiology',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology',
  EMERGENCY_MEDICINE = 'emergency_medicine',
  ENDOCRINOLOGY = 'endocrinology',
  FAMILY_MEDICINE = 'family_medicine',
  GASTROENTEROLOGY = 'gastroenterology',
  GENERAL_PRACTICE = 'general_practice',
  GERIATRICS = 'geriatrics',
  GYNECOLOGY = 'gynecology',
  HEMATOLOGY = 'hematology',
  INFECTIOUS_DISEASE = 'infectious_disease',
  INTERNAL_MEDICINE = 'internal_medicine',
  NEPHROLOGY = 'nephrology',
  NEUROLOGY = 'neurology',
  OBSTETRICS = 'obstetrics',
  ONCOLOGY = 'oncology',
  OPHTHALMOLOGY = 'ophthalmology',
  ORTHOPEDICS = 'orthopedics',
  OTOLARYNGOLOGY = 'otolaryngology',
  PATHOLOGY = 'pathology',
  PEDIATRICS = 'pediatrics',
  PHYSICAL_THERAPY = 'physical_therapy',
  PLASTIC_SURGERY = 'plastic_surgery',
  PSYCHIATRY = 'psychiatry',
  PULMONOLOGY = 'pulmonology',
  RADIOLOGY = 'radiology',
  RHEUMATOLOGY = 'rheumatology',
  SPORTS_MEDICINE = 'sports_medicine',
  SURGERY = 'surgery',
  UROLOGY = 'urology'
}

/**
 * Estado de la licencia médica
 * @enum {string}
 */
export enum LicenseStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

/**
 * Tipos de consulta que ofrece el doctor
 * @enum {string}
 */
export enum ConsultationType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit',
  EMERGENCY = 'emergency'
}

// ==================== INTERFACES ====================

/**
 * Información de educación médica
 * @interface MedicalEducation
 */
export interface MedicalEducation {
  /** Institución educativa */
  institution: string;
  /** Título obtenido */
  degree: string;
  /** Campo de estudio */
  fieldOfStudy: string;
  /** Año de graduación */
  graduationYear: number;
  /** País donde estudió */
  country: string;
  /** Honores o distinciones */
  honors?: string[];
}

/**
 * Certificación o especialización
 * @interface MedicalCertification
 */
export interface MedicalCertification {
  /** Nombre de la certificación */
  name: string;
  /** Organismo emisor */
  issuingOrganization: string;
  /** Fecha de obtención */
  issueDate: Date;
  /** Fecha de expiración */
  expirationDate?: Date;
  /** Número de certificación */
  certificationNumber: string;
  /** Especialidad relacionada */
  specialty?: MedicalSpecialty;
}

/**
 * Experiencia laboral médica
 * @interface MedicalExperience
 */
export interface MedicalExperience {
  /** Nombre de la institución */
  institution: string;
  /** Cargo/Posición */
  position: string;
  /** Departamento */
  department?: string;
  /** Fecha de inicio */
  startDate: Date;
  /** Fecha de fin (null si es actual) */
  endDate?: Date;
  /** Es trabajo actual */
  isCurrent: boolean;
  /** Descripción de responsabilidades */
  responsibilities?: string[];
  /** Logros destacados */
  achievements?: string[];
}

/**
 * Información de licencia médica
 * @interface MedicalLicense
 */
export interface MedicalLicense {
  /** Número de licencia */
  licenseNumber: string;
  /** Tipo de licencia */
  licenseType: 'national' | 'provincial' | 'specialty';
  /** Provincia/Estado de emisión */
  issuingAuthority: string;
  /** Estado de la licencia */
  status: LicenseStatus;
  /** Fecha de emisión */
  issueDate: Date;
  /** Fecha de expiración */
  expirationDate?: Date;
  /** Restricciones (si aplica) */
  restrictions?: string[];
}

/**
 * Horario de atención del doctor
 * @interface DoctorSchedule
 */
export interface DoctorSchedule {
  /** Día de la semana (0-6, 0=Domingo) */
  dayOfWeek: number;
  /** Hora de inicio (formato HH:mm) */
  startTime: string;
  /** Hora de fin (formato HH:mm) */
  endTime: string;
  /** Ubicación de consulta */
  location?: string;
  /** Tipos de consulta disponibles */
  consultationTypes: ConsultationType[];
  /** Duración de consulta en minutos */
  slotDuration: number;
  /** Tiempo entre consultas en minutos */
  bufferTime?: number;
}

/**
 * Configuración de telemedicina
 * @interface TelemedicineConfig
 */
export interface TelemedicineConfig {
  /** Plataformas habilitadas */
  platforms: ('zoom' | 'meet' | 'teams' | 'custom')[];
  /** Horarios específicos para telemedicina */
  availableHours?: DoctorSchedule[];
  /** Requiere pago anticipado */
  requiresAdvancePayment: boolean;
  /** Tiempo máximo de consulta en minutos */
  maxConsultationTime: number;
  /** Especialidades disponibles por telemedicina */
  availableSpecialties: MedicalSpecialty[];
}

/**
 * Perfil completo del doctor
 * @interface DoctorProfile
 * @extends BaseEntity
 */
export interface DoctorProfile extends BaseEntity {
  /** ID único del doctor (branded type) */
  id: DoctorId;
  /** ID del usuario asociado */
  userId: string;
  
  // Información profesional
  /** Número de colegiado/matrícula */
  registrationNumber: string;
  /** Especialidades del doctor */
  specialties: MedicalSpecialty[];
  /** Especialidad principal */
  primarySpecialty: MedicalSpecialty;
  /** Sub-especialidades */
  subSpecialties?: string[];
  
  // Licencias y certificaciones
  /** Licencias médicas */
  licenses: MedicalLicense[];
  /** Certificaciones adicionales */
  certifications: MedicalCertification[];
  
  // Educación y experiencia
  /** Educación médica */
  education: MedicalEducation[];
  /** Experiencia laboral */
  experience: MedicalExperience[];
  /** Años de experiencia total */
  yearsOfExperience: number;
  
  // Información de práctica
  /** Biografía profesional */
  bio?: string;
  /** Idiomas que habla */
  languages: string[];
  /** Afiliaciones hospitalarias actuales */
  hospitalAffiliations: string[];
  /** Sociedades médicas a las que pertenece */
  medicalSocieties?: string[];
  
  // Configuración de consultas
  /** Horarios de atención */
  schedule: DoctorSchedule[];
  /** Tarifa de consulta estándar */
  consultationFee: number;
  /** Tarifas por tipo de consulta */
  feesByType?: Record<ConsultationType, number>;
  /** Seguros médicos aceptados */
  acceptedInsurance: string[];
  
  // Telemedicina
  /** Ofrece telemedicina */
  offersTelemedicine: boolean;
  /** Configuración de telemedicina */
  telemedicineConfig?: TelemedicineConfig;
  
  // Métricas y calificaciones
  /** Calificación promedio (1-5) */
  averageRating?: number;
  /** Número total de reseñas */
  totalReviews?: number;
  /** Número total de pacientes atendidos */
  totalPatients?: number;
  /** Tasa de satisfacción */
  satisfactionRate?: number;
  
  // Asociación con empresa
  /** ID de la empresa/clínica */
  companyId?: string;
  /** Es médico verificado */
  isVerified: boolean;
  /** Fecha de verificación */
  verificationDate?: Date;
  
  // Configuración adicional
  /** Acepta nuevos pacientes */
  acceptingNewPatients: boolean;
  /** Servicios especiales que ofrece */
  specialServices?: string[];
  /** Procedimientos que realiza */
  procedures?: string[];
}

/**
 * Disponibilidad del doctor
 * @interface DoctorAvailability
 */
export interface DoctorAvailability {
  /** ID del doctor */
  doctorId: DoctorId;
  /** Fecha específica */
  date: Date;
  /** Slots disponibles */
  availableSlots: TimeSlot[];
  /** Está de guardia */
  isOnCall: boolean;
  /** Ubicación para esa fecha */
  location?: string;
}

/**
 * Slot de tiempo disponible
 * @interface TimeSlot
 */
export interface TimeSlot {
  /** Hora de inicio */
  startTime: Date;
  /** Hora de fin */
  endTime: Date;
  /** Tipo de consulta disponible */
  consultationType: ConsultationType;
  /** Está disponible */
  isAvailable: boolean;
  /** Está reservado */
  isBooked: boolean;
  /** ID de la cita (si está reservado) */
  appointmentId?: string;
}

// ==================== SCHEMAS ====================

/**
 * Schema de validación para perfil de doctor
 */
export const DoctorProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  registrationNumber: z.string(),
  specialties: z.array(z.nativeEnum(MedicalSpecialty)),
  primarySpecialty: z.nativeEnum(MedicalSpecialty),
  subSpecialties: z.array(z.string()).optional(),
  licenses: z.array(z.object({
    licenseNumber: z.string(),
    licenseType: z.enum(['national', 'provincial', 'specialty']),
    issuingAuthority: z.string(),
    status: z.nativeEnum(LicenseStatus),
    issueDate: z.date(),
    expirationDate: z.date().optional(),
    restrictions: z.array(z.string()).optional()
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    graduationYear: z.number(),
    country: z.string(),
    honors: z.array(z.string()).optional()
  })),
  yearsOfExperience: z.number().min(0),
  languages: z.array(z.string()),
  consultationFee: z.number().positive(),
  offersTelemedicine: z.boolean(),
  isVerified: z.boolean(),
  acceptingNewPatients: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para creación de doctor
 */
export const CreateDoctorSchema = DoctorProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true
});

/**
 * Schema para actualización de doctor
 */
export const UpdateDoctorSchema = CreateDoctorSchema.partial();