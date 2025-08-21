/**
 * @fileoverview Tipos para citas médicas y consultas
 * @module @altamedica/types/medical/clinical/appointment
 * @description Definiciones de tipos para el sistema de citas médicas
 */

import { z } from 'zod';
import { BaseEntity } from '../../core/base.types';
import { PatientId, DoctorId, AppointmentId } from '../../core/branded.types';
import { ConsultationType, MedicalSpecialty } from '../doctor/doctor.types';

// ==================== ENUMS ====================

/**
 * Estados posibles de una cita médica
 * @enum {string}
 */
export enum AppointmentStatus {
  /** Cita agendada pero no confirmada */
  SCHEDULED = 'scheduled',
  /** Cita confirmada por el paciente */
  CONFIRMED = 'confirmed',
  /** Paciente en sala de espera */
  WAITING = 'waiting',
  /** Consulta en progreso */
  IN_PROGRESS = 'in_progress',
  /** Consulta completada */
  COMPLETED = 'completed',
  /** Cita cancelada */
  CANCELLED = 'cancelled',
  /** Paciente no se presentó */
  NO_SHOW = 'no_show',
  /** Cita reprogramada */
  RESCHEDULED = 'rescheduled'
}

/**
 * Tipos de cita médica
 * @enum {string}
 */
export enum AppointmentType {
  /** Primera consulta */
  FIRST_VISIT = 'first_visit',
  /** Consulta de seguimiento */
  FOLLOW_UP = 'follow_up',
  /** Consulta de urgencia */
  URGENT = 'urgent',
  /** Chequeo de rutina */
  ROUTINE_CHECK = 'routine_check',
  /** Procedimiento médico */
  PROCEDURE = 'procedure',
  /** Consulta preventiva */
  PREVENTIVE = 'preventive',
  /** Segunda opinión */
  SECOND_OPINION = 'second_opinion',
  /** Post-operatorio */
  POST_OPERATIVE = 'post_operative',
  /** Pre-operatorio */
  PRE_OPERATIVE = 'pre_operative'
}

/**
 * Prioridad de la cita
 * @enum {string}
 */
export enum AppointmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

/**
 * Razones de cancelación
 * @enum {string}
 */
export enum CancellationReason {
  PATIENT_REQUEST = 'patient_request',
  DOCTOR_UNAVAILABLE = 'doctor_unavailable',
  PATIENT_ILLNESS = 'patient_illness',
  WEATHER = 'weather',
  EMERGENCY = 'emergency',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other'
}

// ==================== INTERFACES ====================

/**
 * Síntomas reportados por el paciente
 * @interface ReportedSymptom
 */
export interface ReportedSymptom {
  /** Descripción del síntoma */
  description: string;
  /** Severidad (1-10) */
  severity: number;
  /** Duración en días */
  duration: number;
  /** Fecha de inicio */
  onsetDate: Date;
  /** Es síntoma principal */
  isPrimary: boolean;
}

/**
 * Signos vitales registrados
 * @interface VitalSigns
 */
export interface VitalSigns {
  /** Presión sistólica */
  bloodPressureSystolic?: number;
  /** Presión diastólica */
  bloodPressureDiastolic?: number;
  /** Frecuencia cardíaca */
  heartRate?: number;
  /** Temperatura en Celsius */
  temperature?: number;
  /** Frecuencia respiratoria */
  respiratoryRate?: number;
  /** Saturación de oxígeno */
  oxygenSaturation?: number;
  /** Peso en kg */
  weight?: number;
  /** Altura en cm */
  height?: number;
  /** Índice de masa corporal */
  bmi?: number;
  /** Fecha y hora de toma */
  recordedAt: Date;
  /** Quién tomó los signos */
  recordedBy: string;
}

/**
 * Recordatorio de cita
 * @interface AppointmentReminder
 */
export interface AppointmentReminder {
  /** Tipo de recordatorio */
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'call';
  /** Tiempo antes de la cita (minutos) */
  minutesBefore: number;
  /** Estado del envío */
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  /** Fecha programada de envío */
  scheduledFor: Date;
  /** Fecha real de envío */
  sentAt?: Date;
  /** Mensaje de error si falló */
  errorMessage?: string;
}

/**
 * Preparación requerida para la cita
 * @interface AppointmentPreparation
 */
export interface AppointmentPreparation {
  /** Instrucciones de preparación */
  instructions: string[];
  /** Requiere ayuno */
  requiresFasting: boolean;
  /** Horas de ayuno requeridas */
  fastingHours?: number;
  /** Medicamentos a suspender */
  medicationsToStop?: string[];
  /** Documentos a traer */
  documentsRequired?: string[];
  /** Estudios previos requeridos */
  requiredTests?: string[];
}

/**
 * Información de telemedicina para la cita
 * @interface TelemedicineInfo
 */
export interface TelemedicineInfo {
  /** Plataforma a usar */
  platform: 'zoom' | 'meet' | 'teams' | 'whatsapp' | 'custom';
  /** URL de la reunión */
  meetingUrl?: string;
  /** ID de la reunión */
  meetingId?: string;
  /** Contraseña de la reunión */
  meetingPassword?: string;
  /** Instrucciones de conexión */
  connectionInstructions?: string;
  /** Prueba de conexión completada */
  connectionTestCompleted: boolean;
  /** Grabación permitida */
  recordingAllowed: boolean;
}

/**
 * Cita médica completa
 * @interface Appointment
 * @extends BaseEntity
 */
export interface Appointment extends BaseEntity {
  /** ID único de la cita (branded type) */
  id: AppointmentId;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor */
  doctorId: DoctorId;
  
  // Información temporal
  /** Fecha y hora de la cita */
  scheduledDate: Date;
  /** Duración estimada en minutos */
  duration: number;
  /** Fecha y hora real de inicio */
  actualStartTime?: Date;
  /** Fecha y hora real de fin */
  actualEndTime?: Date;
  
  // Tipo y estado
  /** Tipo de cita */
  type: AppointmentType;
  /** Estado de la cita */
  status: AppointmentStatus;
  /** Prioridad de la cita */
  priority: AppointmentPriority;
  /** Tipo de consulta */
  consultationType: ConsultationType;
  /** Especialidad médica */
  specialty: MedicalSpecialty;
  
  // Información clínica
  /** Motivo de consulta */
  chiefComplaint: string;
  /** Síntomas reportados */
  symptoms?: ReportedSymptom[];
  /** Notas del paciente */
  patientNotes?: string;
  /** Signos vitales tomados */
  vitalSigns?: VitalSigns;
  
  // Ubicación
  /** Ubicación de la consulta */
  location?: string;
  /** Número de consultorio */
  roomNumber?: string;
  /** Piso/Área */
  floor?: string;
  
  // Telemedicina
  /** Es cita virtual */
  isVirtual: boolean;
  /** Información de telemedicina */
  telemedicineInfo?: TelemedicineInfo;
  
  // Preparación y recordatorios
  /** Preparación requerida */
  preparation?: AppointmentPreparation;
  /** Recordatorios configurados */
  reminders: AppointmentReminder[];
  
  // Información financiera
  /** Costo estimado */
  estimatedCost?: number;
  /** Copago requerido */
  copayAmount?: number;
  /** Pagado */
  isPaid: boolean;
  /** ID de transacción de pago */
  paymentTransactionId?: string;
  
  // Cancelación/Reprogramación
  /** Fecha de cancelación */
  cancelledAt?: Date;
  /** Razón de cancelación */
  cancellationReason?: CancellationReason;
  /** Notas de cancelación */
  cancellationNotes?: string;
  /** ID de cita reprogramada */
  rescheduledToId?: AppointmentId;
  /** ID de cita original (si es reprogramada) */
  rescheduledFromId?: AppointmentId;
  
  // Seguimiento
  /** Requiere seguimiento */
  requiresFollowUp: boolean;
  /** Fecha sugerida de seguimiento */
  followUpDate?: Date;
  /** ID de cita de seguimiento */
  followUpAppointmentId?: AppointmentId;
  
  // Metadata
  /** Creado por (userId) */
  createdBy: string;
  /** Última modificación por */
  lastModifiedBy?: string;
  /** Número de recordatorios enviados */
  remindersSent: number;
  /** Veces que fue reprogramada */
  rescheduleCount: number;
}

/**
 * Solicitud de cita
 * @interface AppointmentRequest
 */
export interface AppointmentRequest {
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor (opcional si no se ha elegido) */
  doctorId?: DoctorId;
  /** Especialidad requerida */
  specialty: MedicalSpecialty;
  /** Tipo de cita */
  type: AppointmentType;
  /** Tipo de consulta preferida */
  preferredConsultationType: ConsultationType;
  /** Fechas preferidas */
  preferredDates: Date[];
  /** Horarios preferidos */
  preferredTimeSlots?: string[];
  /** Motivo de consulta */
  chiefComplaint: string;
  /** Urgencia */
  isUrgent: boolean;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Resumen post-consulta
 * @interface AppointmentSummary
 */
export interface AppointmentSummary {
  /** ID de la cita */
  appointmentId: AppointmentId;
  /** Diagnósticos realizados */
  diagnoses: Diagnosis[];
  /** Prescripciones emitidas */
  prescriptions: PrescriptionSummary[];
  /** Órdenes de laboratorio */
  labOrders?: string[];
  /** Órdenes de imágenes */
  imagingOrders?: string[];
  /** Recomendaciones */
  recommendations: string[];
  /** Plan de tratamiento */
  treatmentPlan?: string;
  /** Notas del doctor */
  doctorNotes: string;
  /** Pronóstico */
  prognosis?: string;
  /** Referido a especialista */
  referrals?: Referral[];
}

/**
 * Diagnóstico realizado
 * @interface Diagnosis
 */
export interface Diagnosis {
  /** Código ICD-10 */
  icd10Code: string;
  /** Descripción del diagnóstico */
  description: string;
  /** Es diagnóstico principal */
  isPrimary: boolean;
  /** Certeza del diagnóstico */
  certainty: 'confirmed' | 'provisional' | 'differential' | 'ruled_out';
}

/**
 * Resumen de prescripción
 * @interface PrescriptionSummary
 */
export interface PrescriptionSummary {
  /** Nombre del medicamento */
  medication: string;
  /** Dosis */
  dosage: string;
  /** Frecuencia */
  frequency: string;
  /** Duración del tratamiento */
  duration: string;
  /** Instrucciones especiales */
  instructions?: string;
}

/**
 * Referencia a especialista
 * @interface Referral
 */
export interface Referral {
  /** Especialidad a la que se refiere */
  specialty: MedicalSpecialty;
  /** Doctor específico (si se conoce) */
  referredDoctorId?: DoctorId;
  /** Razón de la referencia */
  reason: string;
  /** Urgencia de la referencia */
  urgency: 'routine' | 'urgent' | 'emergency';
  /** Notas para el especialista */
  notes?: string;
}

// ==================== SCHEMAS ====================

/**
 * Schema de validación para citas
 */
export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  scheduledDate: z.date(),
  duration: z.number().positive(),
  type: z.nativeEnum(AppointmentType),
  status: z.nativeEnum(AppointmentStatus),
  priority: z.nativeEnum(AppointmentPriority),
  consultationType: z.nativeEnum(ConsultationType),
  specialty: z.nativeEnum(MedicalSpecialty),
  chiefComplaint: z.string(),
  isVirtual: z.boolean(),
  isPaid: z.boolean(),
  requiresFollowUp: z.boolean(),
  createdBy: z.string(),
  remindersSent: z.number().min(0),
  rescheduleCount: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para crear cita
 */
export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  status: true,
  remindersSent: true,
  rescheduleCount: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualizar cita
 */
export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();