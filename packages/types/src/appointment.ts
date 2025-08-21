/**
 * Sistema Unificado de Tipos de Citas Médicas
 * Versión consolidada basada en la implementación más completa
 * Cumplimiento RBAC/ABAC - Control de Acceso Granular
 * @module @altamedica/types/appointment
 */

import { z } from 'zod';

// ===============================
// ENUMS Y CONSTANTES
// ===============================

export const AppointmentType = {
  CONSULTATION: 'CONSULTATION',
  FOLLOW_UP: 'FOLLOW_UP',
  PROCEDURE: 'PROCEDURE',
  DIAGNOSTIC_TEST: 'DIAGNOSTIC_TEST',
  VACCINATION: 'VACCINATION',
  SURGERY: 'SURGERY',
  THERAPY_SESSION: 'THERAPY_SESSION',
  EMERGENCY: 'EMERGENCY',
  TELEMEDICINE: 'TELEMEDICINE',
  CHECK_UP: 'CHECK_UP'
} as const;

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED', 
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED'
} as const;

export const UrgencyLevel = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY',
  CRITICAL: 'CRITICAL'
} as const;

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  PHONE_CALL: 'PHONE_CALL',
  WHATSAPP: 'WHATSAPP'
} as const;

// ===============================
// SCHEMAS DE APOYO
// ===============================

// Schema para patrón de recurrencia
export const recurringPatternSchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().min(1).describe('Cada X días/semanas/meses'),
  endDate: z.string().datetime().optional(),
  occurrences: z.number().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().describe('0=domingo, 1=lunes...'),
  monthlyPattern: z.enum(['DAY_OF_MONTH', 'DAY_OF_WEEK']).optional()
});

// Schema para cambio de estado
export const statusChangeSchema = z.object({
  timestamp: z.string().datetime(),
  previousStatus: z.enum(Object.values(AppointmentStatus) as [string, ...string[]]),
  newStatus: z.enum(Object.values(AppointmentStatus) as [string, ...string[]]),
  changedBy: z.string().uuid(),
  reason: z.string().optional(),
  automaticChange: z.boolean().default(false)
});

// Schema para log de notificaciones
export const notificationLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  channel: z.enum(Object.values(NotificationChannel) as [string, ...string[]]),
  recipient: z.string(),
  message: z.string(),
  delivered: z.boolean(),
  opened: z.boolean().optional(),
  clickedThrough: z.boolean().optional(),
  errorMessage: z.string().optional()
});

// Schema para prescripción
export const prescriptionSchema = z.object({
  id: z.string().uuid(),
  medicationName: z.string().min(2),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.number().min(1).describe('días'),
  refillsAllowed: z.number().min(0),
  pharmacyInstructions: z.string(),
  sideEffectWarnings: z.array(z.string()).default([]),
  interactionWarnings: z.array(z.string()).default([]),
  prescribedAt: z.string().datetime(),
  electronicSignature: z.string()
});

// Schema para procedimiento
export const procedureSchema = z.object({
  id: z.string().uuid(),
  procedureName: z.string(),
  cptCode: z.string().describe('Current Procedural Terminology'),
  description: z.string(),
  performedAt: z.string().datetime(),
  performedBy: z.array(z.string().uuid()),
  complications: z.array(z.string()).optional(),
  outcome: z.enum(['SUCCESSFUL', 'PARTIAL', 'FAILED', 'CANCELLED']),
  postProcedureInstructions: z.array(z.string()).default([])
});

// Schema para valor de laboratorio
export const labValueSchema = z.object({
  parameter: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string(),
  abnormalFlag: z.enum(['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW']).optional(),
  status: z.enum(['PRELIMINARY', 'FINAL', 'CORRECTED', 'CANCELLED'])
});

// Schema para rango de referencia
export const referenceRangeSchema = z.object({
  parameter: z.string(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  ageGroup: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  units: z.string()
});

// Schema para resultado de test
export const testResultSchema = z.object({
  id: z.string().uuid(),
  testName: z.string(),
  loincCode: z.string().describe('Logical Observation Identifiers Names and Codes'),
  orderedAt: z.string().datetime(),
  resultDate: z.string().datetime(),
  results: z.array(labValueSchema),
  interpretation: z.string(),
  criticalValues: z.boolean(),
  referenceRanges: z.array(referenceRangeSchema),
  performingLab: z.string(),
  reviewedBy: z.string().uuid(),
  reportUrl: z.string().url().optional()
});

// Schema para cobertura de seguro
export const insuranceCoverageSchema = z.object({
  providerId: z.string().uuid(),
  providerName: z.string(),
  policyNumber: z.string(),
  groupNumber: z.string(),
  coveragePercentage: z.number().min(0).max(100),
  deductible: z.number().min(0),
  copayAmount: z.number().min(0),
  preauthorizationRequired: z.boolean(),
  preauthorizationNumber: z.string().optional(),
  claimNumber: z.string().optional(),
  claimStatus: z.enum(['PENDING', 'APPROVED', 'DENIED', 'PROCESSING'])
});

// Schema para resultado de cita
export const appointmentOutcomeSchema = z.object({
  id: z.string().uuid(),
  completedAt: z.string().datetime(),
  duration: z.number().min(1).describe('minutos reales'),
  diagnosis: z.array(z.string()).optional(),
  prescriptions: z.array(prescriptionSchema).optional(),
  proceduresPerformed: z.array(procedureSchema).optional(),
  testResults: z.array(testResultSchema).optional(),
  followUpRequired: z.boolean(),
  nextAppointmentRecommended: z.string().optional(),
  patientSatisfactionScore: z.number().min(1).max(5).optional(),
  professionalNotes: z.string(),
  billingCode: z.string().optional(),
  insuranceCoverage: insuranceCoverageSchema.optional()
});

// ===============================
// SCHEMA PRINCIPAL DE CITA
// ===============================

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  
  // Datos básicos de la cita
  patientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  facilityId: z.string().uuid(),
  departmentId: z.string().uuid(),
  
  // Información descriptiva
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  
  // Programación temporal
  scheduling: z.object({
    scheduledDateTime: z.string().datetime().describe('ISO 8601'),
    estimatedDuration: z.number().min(15).max(480).describe('minutos'),
    timeZone: z.string().default('America/Argentina/Buenos_Aires'),
    recurringPattern: recurringPatternSchema.optional(),
    bufferTime: z.number().min(0).default(0).describe('minutos entre citas')
  }),
  
  // Detalles clínicos
  clinicalInfo: z.object({
    appointmentType: z.enum(Object.values(AppointmentType) as [string, ...string[]]),
    reasonForVisit: z.string().min(5),
    urgencyLevel: z.enum(Object.values(UrgencyLevel) as [string, ...string[]]),
    specialInstructions: z.string().optional(),
    preparationInstructions: z.array(z.string()).optional(),
    estimatedCost: z.number().min(0).optional(),
    insurancePreauthorization: z.string().optional(),
    symptoms: z.array(z.string()).default([]),
    vitalsRequired: z.boolean().default(false)
  }),
  
  // Estado y seguimiento
  status: z.enum(Object.values(AppointmentStatus) as [string, ...string[]]),
  statusHistory: z.array(statusChangeSchema).default([]),
  
  // Ubicación y modalidad
  location: z.object({
    type: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']),
    room: z.string().optional(),
    floor: z.string().optional(),
    building: z.string().optional(),
    address: z.string().optional(),
    virtualMeetingUrl: z.string().url().optional(),
    virtualMeetingId: z.string().optional(),
    virtualPlatform: z.enum(['ZOOM', 'TEAMS', 'MEET', 'CUSTOM']).optional()
  }),
  
  // Comunicaciones
  notifications: z.object({
    patientReminders: z.array(notificationLogSchema).default([]),
    professionalAlerts: z.array(notificationLogSchema).default([]),
    confirmationRequired: z.boolean().default(true),
    lastConfirmedAt: z.string().datetime().optional(),
    reminderSchedule: z.array(z.object({
      timing: z.number().describe('minutos antes de la cita'),
      channel: z.enum(Object.values(NotificationChannel) as [string, ...string[]]),
      sent: z.boolean().default(false)
    })).default([])
  }),
  
  // Resultado de la cita
  outcome: appointmentOutcomeSchema.optional(),
  
  // Información de pago
  billing: z.object({
    estimatedCost: z.number().min(0).optional(),
    actualCost: z.number().min(0).optional(),
    insuranceCovered: z.boolean().default(false),
    insuranceCoverage: insuranceCoverageSchema.optional(),
    paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'WAIVED', 'INSURANCE_PENDING']),
    paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'OTHER']).optional(),
    invoiceNumber: z.string().optional()
  }),
  
  // Seguimiento
  followUp: z.object({
    required: z.boolean().default(false),
    recommendedDate: z.string().datetime().optional(),
    instructions: z.string().optional(),
    appointmentId: z.string().uuid().optional()
  }),
  
  // Relaciones
  relationships: z.object({
    parentAppointmentId: z.string().uuid().optional(),
    childAppointmentIds: z.array(z.string().uuid()).default([]),
    relatedEncounterId: z.string().uuid().optional()
  }),
  
  // Calificación y feedback
  feedback: z.object({
    patientRating: z.number().min(1).max(5).optional(),
    patientComments: z.string().optional(),
    professionalRating: z.number().min(1).max(5).optional(),
    professionalComments: z.string().optional(),
    qualityScore: z.number().min(0).max(100).optional()
  }),
  
  // Metadata de auditoría
  auditInfo: z.object({
    createdAt: z.string().datetime(),
    createdBy: z.string().uuid(),
    lastModified: z.string().datetime(),
    lastModifiedBy: z.string().uuid(),
    version: z.number().default(1),
    cancellationReason: z.string().optional(),
    rescheduleCount: z.number().default(0),
    accessLog: z.array(z.object({
      userId: z.string().uuid(),
      timestamp: z.string().datetime(),
      action: z.string(),
      ipAddress: z.string().optional()
    })).default([])
  }),
  
  // Etiquetas y categorización
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).optional()
});

// ===============================
// SCHEMAS DERIVADOS
// ===============================

// Schema para crear una nueva cita
export const createAppointmentSchema = appointmentSchema.omit({
  id: true,
  status: true,
  statusHistory: true,
  outcome: true,
  auditInfo: true,
  notifications: true,
  feedback: true,
  relationships: true
}).extend({
  status: z.enum(Object.values(AppointmentStatus) as [string, ...string[]]).default('SCHEDULED'),
  auditInfo: z.object({
    createdBy: z.string().uuid()
  })
});

// Schema para actualizar una cita
export const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().uuid(),
  auditInfo: z.object({
    lastModifiedBy: z.string().uuid()
  })
});

// Schema para filtros de búsqueda
export const appointmentFiltersSchema = z.object({
  // IDs específicos
  ids: z.array(z.string().uuid()).optional(),
  patientId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  
  // Filtros de estado
  status: z.array(z.enum(Object.values(AppointmentStatus) as [string, ...string[]])).optional(),
  appointmentType: z.array(z.enum(Object.values(AppointmentType) as [string, ...string[]])).optional(),
  urgencyLevel: z.array(z.enum(Object.values(UrgencyLevel) as [string, ...string[]])).optional(),
  
  // Filtros de fecha
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  
  // Filtros de ubicación
  locationType: z.array(z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID'])).optional(),
  room: z.string().optional(),
  
  // Filtros de pago
  paymentStatus: z.array(z.enum(['PENDING', 'PAID', 'PARTIAL', 'WAIVED', 'INSURANCE_PENDING'])).optional(),
  insuranceCovered: z.boolean().optional(),
  
  // Búsqueda y otros
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  followUpRequired: z.boolean().optional(),
  includeDeleted: z.boolean().default(false),
  
  // Paginación y ordenamiento
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['scheduledDateTime', 'createdAt', 'status', 'patientId', 'professionalId']).default('scheduledDateTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Schema para estadísticas de citas
export const appointmentStatsSchema = z.object({
  totalCount: z.number(),
  statusBreakdown: z.record(z.string(), z.number()),
  typeBreakdown: z.record(z.string(), z.number()),
  averageDuration: z.number(),
  averageSatisfactionScore: z.number().optional(),
  noShowRate: z.number(),
  cancellationRate: z.number(),
  utilizationRate: z.number()
});

// ===============================
// TIPOS TYPESCRIPT
// ===============================

// Tipos principales
export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>;
export type AppointmentStats = z.infer<typeof appointmentStatsSchema>;

// Tipos de componentes
export type RecurringPattern = z.infer<typeof recurringPatternSchema>;
export type StatusChange = z.infer<typeof statusChangeSchema>;
export type NotificationLog = z.infer<typeof notificationLogSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type Procedure = z.infer<typeof procedureSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
export type LabValue = z.infer<typeof labValueSchema>;
export type ReferenceRange = z.infer<typeof referenceRangeSchema>;
export type InsuranceCoverage = z.infer<typeof insuranceCoverageSchema>;
export type AppointmentOutcome = z.infer<typeof appointmentOutcomeSchema>;

// Tipos de enums
export type AppointmentType = typeof AppointmentType[keyof typeof AppointmentType];
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];
export type UrgencyLevel = typeof UrgencyLevel[keyof typeof UrgencyLevel];
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

// ===============================
// FUNCIONES DE UTILIDAD
// ===============================

/**
 * Verifica si una cita puede ser cancelada según las reglas de negocio
 */
export function canCancelAppointment(appointment: Appointment): boolean {
  const nonCancellableStatuses: AppointmentStatus[] = ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
  return !nonCancellableStatuses.includes(appointment.status as AppointmentStatus);
}

/**
 * Verifica si una cita puede ser reprogramada
 */
export function canRescheduleAppointment(appointment: Appointment): boolean {
  const nonReschedulableStatuses: AppointmentStatus[] = ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
  return !nonReschedulableStatuses.includes(appointment.status as AppointmentStatus);
}

/**
 * Calcula el tiempo restante hasta la cita
 */
export function getTimeUntilAppointment(appointment: Appointment): number {
  const appointmentTime = new Date(appointment.scheduling.scheduledDateTime).getTime();
  const now = new Date().getTime();
  return Math.max(0, appointmentTime - now);
}

/**
 * Verifica si una cita es virtual
 */
export function isVirtualAppointment(appointment: Appointment): boolean {
  return appointment.location.type === 'VIRTUAL' || appointment.location.type === 'HYBRID';
}

/**
 * Obtiene la duración total incluyendo el buffer time
 */
export function getTotalDuration(appointment: Appointment): number {
  return appointment.scheduling.estimatedDuration + appointment.scheduling.bufferTime;
}