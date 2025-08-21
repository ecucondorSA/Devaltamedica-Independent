/**
 * 📅 APPOINTMENT SCHEMAS - ALTAMEDICA
 * Schemas para citas médicas, horarios y disponibilidad
 */

import { z } from 'zod';
import { BaseEntitySchema, AttachmentSchema } from './common-schemas';

// Time Slot Schema
export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  isAvailable: z.boolean().default(true),
  maxAppointments: z.number().min(1).default(1),
  currentAppointments: z.number().min(0).default(0)
});

// Recurring Pattern Schema
export const RecurringPatternSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().min(1).default(1), // cada N días/semanas/meses  
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=domingo, 6=sábado
  daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
  endDate: z.date().optional(),
  maxOccurrences: z.number().min(1).optional()
});

// Doctor Availability Schema
export const DoctorAvailabilitySchema = BaseEntitySchema.extend({
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  date: z.date(),
  dayOfWeek: z.number().min(0).max(6), // 0=domingo, 6=sábado
  timeSlots: z.array(TimeSlotSchema).min(1, "Debe haber al menos un horario disponible"),
  isHoliday: z.boolean().default(false),
  holidayName: z.string().optional(),
  specialNotes: z.string().optional(),
  appointmentTypes: z.array(z.enum(['consultation', 'follow_up', 'emergency', 'telemedicine', 'procedure'])).default(['consultation']),
  maxAppointmentsPerSlot: z.number().min(1).default(1),
  bufferTime: z.number().min(0).default(15), // minutos entre citas
  isRecurring: z.boolean().default(false),
  recurringPattern: RecurringPatternSchema.optional(),
  overrideDate: z.date().optional(), // para anular disponibilidad recurrente
  isOverride: z.boolean().default(false)
});

// Appointment Reminder Schema
export const AppointmentReminderSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(['email', 'sms', 'push', 'phone']),
  scheduledTime: z.date(),
  sentTime: z.date().optional(),
  status: z.enum(['scheduled', 'sent', 'delivered', 'failed', 'cancelled']).default('scheduled'),
  message: z.string().optional(),
  errorMessage: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  maxRetries: z.number().min(0).default(3)
});

// Extended Appointment Schema (más completo que el de medical-schemas)
export const AppointmentExtendedSchema = BaseEntitySchema.extend({
  appointmentNumber: z.string().min(1, "El número de cita es requerido"),
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  companyId: z.string().optional(), // para citas corporativas
  
  // Fechas y tiempos
  scheduledDate: z.date(),
  scheduledStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  scheduledEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  estimatedDuration: z.number().min(15).max(480).default(30), // en minutos
  actualStartTime: z.date().optional(),
  actualEndTime: z.date().optional(),
  actualDuration: z.number().min(0).optional(),
  
  // Tipo y categoría
  type: z.enum(['consultation', 'follow_up', 'emergency', 'telemedicine', 'procedure', 'checkup', 'specialist_referral']),
  category: z.enum(['routine', 'urgent', 'emergency', 'prevention']).default('routine'),
  specialty: z.string().optional(),
  
  // Motivo y síntomas
  reason: z.string().min(1, "La razón de la cita es requerida"),
  symptoms: z.array(z.string()).default([]),
  chiefComplaint: z.string().optional(),
  detailedDescription: z.string().optional(),
  
  // Estado y seguimiento
  appointmentStatus: z.enum([
    'scheduled', 'confirmed', 'checked_in', 'in_progress', 
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ]).default('scheduled'),
  cancellationReason: z.string().optional(),
  cancellationDate: z.date().optional(),
  cancelledBy: z.string().optional(),
  rescheduleReason: z.string().optional(),
  originalAppointmentId: z.string().optional(),
  
  // Recordatorios
  reminders: z.array(AppointmentReminderSchema).default([]),
  reminderPreferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
    timesBefore: z.array(z.number()).default([24, 2]) // horas antes
  }).optional(),
  
  // Telemedicine
  isTelemedicine: z.boolean().default(false),
  telemedicineInfo: z.object({
    platform: z.enum(['zoom', 'meet', 'webrtc', 'agora']).optional(),
    meetingId: z.string().optional(),
    meetingUrl: z.string().url().optional(),
    password: z.string().optional(),
    roomId: z.string().optional(),
    sessionId: z.string().optional()
  }).optional(),
  
  // Información clínica
  vitalSigns: z.object({
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number()
    }).optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  
  // Instrucciones y preparación
  preparationInstructions: z.string().optional(),
  postVisitInstructions: z.string().optional(),
  requiredDocuments: z.array(z.string()).default([]),
  
  // Seguimiento
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  followUpType: z.enum(['phone', 'in_person', 'telemedicine']).optional(),
  followUpInstructions: z.string().optional(),
  
  // Facturación y pagos
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  insuranceCovered: z.boolean().default(false),
  paymentStatus: z.enum(['pending', 'paid', 'partially_paid', 'refunded', 'cancelled']).default('pending'),
  paymentMethod: z.string().optional(),
  
  // Documentos y archivos
  attachments: z.array(AttachmentSchema).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(), // solo para personal médico
  
  // Métricas y calidad
  patientSatisfactionRating: z.number().min(1).max(5).optional(),
  patientFeedback: z.string().optional(),
  clinicalOutcome: z.enum(['resolved', 'improved', 'unchanged', 'worsened', 'referred']).optional(),
  
  // Metadatos
  source: z.enum(['web', 'mobile', 'phone', 'walk_in', 'referral']).default('web'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  location: z.object({
    type: z.enum(['clinic', 'hospital', 'home', 'online']),
    name: z.string().optional(),
    address: z.string().optional(),
    room: z.string().optional()
  }).optional(),
  
  // Conflictos y validaciones
  hasConflicts: z.boolean().default(false),
  conflictReason: z.string().optional(),
  isDoubleBooked: z.boolean().default(false),
  
  // Notificaciones enviadas
  notificationsSent: z.object({
    confirmation: z.boolean().default(false),
    reminder24h: z.boolean().default(false),
    reminder2h: z.boolean().default(false),
    followUp: z.boolean().default(false)
  }).optional()
});

// Appointment Queue Schema (para sala de espera)
export const AppointmentQueueSchema = BaseEntitySchema.extend({
  appointmentId: z.string().min(1, "El ID de la cita es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  queueDate: z.date(),
  queuePosition: z.number().min(1),
  checkInTime: z.date(),
  calledTime: z.date().optional(),
  seenTime: z.date().optional(),
  estimatedWaitTime: z.number().min(0).optional(), // en minutos
  actualWaitTime: z.number().min(0).optional(),
  queueStatus: z.enum(['waiting', 'called', 'in_progress', 'completed', 'left']).default('waiting'),
  specialRequests: z.string().optional(),
  accompaniedBy: z.string().optional(),
  wheelchairAccess: z.boolean().default(false),
  interpreter: z.boolean().default(false),
  interpreterLanguage: z.string().optional()
});

// Doctor Schedule Template Schema
export const ScheduleTemplateSchema = BaseEntitySchema.extend({
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  templateName: z.string().min(1, "El nombre de la plantilla es requerido"),
  isDefault: z.boolean().default(false),
  weeklySchedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    isWorkingDay: z.boolean().default(true),
    timeSlots: z.array(TimeSlotSchema).default([]),
    breakTimes: z.array(z.object({
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      reason: z.string().optional()
    })).default([])
  })).length(7), // 7 días de la semana
  exceptions: z.array(z.object({
    date: z.date(),
    reason: z.string(),
    isAvailable: z.boolean().default(false),
    customSchedule: z.array(TimeSlotSchema).optional()
  })).default([]),
  validFrom: z.date(),
  validTo: z.date().optional(),
  timeZone: z.string().default('America/Mexico_City')
});

// Appointment Statistics Schema
export const AppointmentStatsSchema = z.object({
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  companyId: z.string().optional(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date()
  }),
  metrics: z.object({
    totalAppointments: z.number().min(0),
    completedAppointments: z.number().min(0),
    cancelledAppointments: z.number().min(0),
    noShowAppointments: z.number().min(0),
    rescheduledAppointments: z.number().min(0),
    averageDuration: z.number().min(0),
    averageWaitTime: z.number().min(0),
    patientSatisfactionAvg: z.number().min(0).max(5),
    revenue: z.number().min(0),
    utilizationRate: z.number().min(0).max(100) // porcentaje
  }),
  byType: z.record(z.number()).optional(),
  byStatus: z.record(z.number()).optional(),
  byDay: z.record(z.number()).optional(),
  trends: z.array(z.object({
    date: z.date(),
    count: z.number(),
    type: z.string()
  })).optional()
});

// Export types
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type RecurringPattern = z.infer<typeof RecurringPatternSchema>;
export type DoctorAvailability = z.infer<typeof DoctorAvailabilitySchema>;
export type AppointmentReminder = z.infer<typeof AppointmentReminderSchema>;
export type AppointmentExtended = z.infer<typeof AppointmentExtendedSchema>;
export type AppointmentQueue = z.infer<typeof AppointmentQueueSchema>;
export type ScheduleTemplate = z.infer<typeof ScheduleTemplateSchema>;
export type AppointmentStats = z.infer<typeof AppointmentStatsSchema>;