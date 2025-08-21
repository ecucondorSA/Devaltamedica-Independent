/**
 * 🏥 MEDICAL SCHEMAS - ALTAMEDICA
 * Schemas específicos para entidades médicas con validaciones HIPAA
 */

import { z } from 'zod';
import { 
  BaseEntitySchema, 
  VitalSignsSchema, 
  MedicationSchema, 
  LabTestSchema, 
  AllergySchema,
  AttachmentSchema 
} from './common-schemas';

// Prescription Schema
export const PrescriptionSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  prescriptionNumber: z.string().min(1, "El número de receta es requerido"),
  medications: z.array(MedicationSchema).min(1, "Debe haber al menos un medicamento"),
  diagnosis: z.string().min(1, "El diagnóstico es requerido"),
  instructions: z.string().optional(),
  prescriptionDate: z.date(),
  validUntil: z.date(),
  isDispensed: z.boolean().default(false),
  dispensedDate: z.date().optional(),
  dispensedBy: z.string().optional(),
  pharmacyId: z.string().optional(),
  refillsAllowed: z.number().min(0).max(12).default(0),
  refillsUsed: z.number().min(0).default(0),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  notes: z.string().optional()
});

// Appointment Schema
export const AppointmentSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  appointmentNumber: z.string().optional(),
  scheduledDate: z.date(),
  estimatedDuration: z.number().min(15).max(480).default(30), // en minutos
  actualStartTime: z.date().optional(),
  actualEndTime: z.date().optional(),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'telemedicine', 'procedure']),
  reason: z.string().min(1, "La razón de la cita es requerida"),
  symptoms: z.array(z.string()).default([]),
  appointmentStatus: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  cancellationReason: z.string().optional(),
  remindersSent: z.number().default(0),
  lastReminderSent: z.date().optional(),
  isTelemedicine: z.boolean().default(false),
  telemedicineRoomId: z.string().optional(),
  notes: z.string().optional(),
  preparationInstructions: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional()
});

// Telemedicine Session Schema
export const TelemedicineSessionSchema = BaseEntitySchema.extend({
  appointmentId: z.string().min(1, "El ID de la cita es requerido"),
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  sessionId: z.string().min(1, "El ID de sesión es requerido"),
  roomId: z.string().min(1, "El ID de sala es requerido"),
  provider: z.enum(['agora', 'zoom', 'meet', 'webrtc']).default('webrtc'),
  sessionStatus: z.enum(['waiting', 'in_progress', 'completed', 'failed', 'cancelled']).default('waiting'),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().optional(), // en minutos
  participantCount: z.number().min(0).default(0),
  maxParticipants: z.number().min(2).max(10).default(2),
  isRecorded: z.boolean().default(false),
  recordingUrl: z.string().optional(),
  connectionQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  technicalIssues: z.array(z.string()).default([]),
  chatHistory: z.array(z.object({
    senderId: z.string(),
    senderRole: z.enum(['patient', 'doctor']),
    message: z.string(),
    timestamp: z.date(),
    type: z.enum(['text', 'file', 'system']).default('text')
  })).default([]),
  joinUrl: z.string().url().optional(),
  sessionToken: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Vital Signs Record Schema
export const VitalSignsRecordSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  recordedBy: z.string().min(1, "El responsable del registro es requerido"),
  recordedByRole: z.enum(['doctor', 'nurse', 'patient', 'device']),
  appointmentId: z.string().optional(),
  deviceId: z.string().optional(),
  measurements: VitalSignsSchema,
  recordingDate: z.date(),
  location: z.string().optional(), // hospital, home, clinic
  notes: z.string().optional(),
  abnormalFlags: z.array(z.string()).default([]),
  alertsTriggered: z.array(z.object({
    type: z.enum(['critical', 'warning', 'info']),
    message: z.string(),
    timestamp: z.date()
  })).default([])
});

// Medical History Schema
export const MedicalHistorySchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  recordType: z.enum(['family_history', 'surgical_history', 'social_history', 'immunization_history']),
  condition: z.string().min(1, "La condición es requerida"),
  relationship: z.string().optional(), // para family history
  onsetDate: z.date().optional(),
  resolvedDate: z.date().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  treatment: z.string().optional(),
  outcome: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  attachments: z.array(AttachmentSchema).default([])
});

// Clinical Notes Schema
export const ClinicalNotesSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  authorId: z.string().min(1, "El ID del autor es requerido"),
  authorRole: z.enum(['doctor', 'nurse', 'specialist']),
  appointmentId: z.string().optional(),
  noteType: z.enum(['progress_note', 'assessment', 'plan', 'discharge_summary', 'consultation_note']),
  subject: z.string().min(1, "El asunto es requerido"),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  isPrivate: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  templateId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  reviewedBy: z.string().optional(),
  reviewedDate: z.date().optional(),
  signedBy: z.string().optional(),
  signedDate: z.date().optional(),
  attachments: z.array(AttachmentSchema).default([])
});

// Diagnostic Report Schema
export const DiagnosticReportSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  doctorId: z.string().min(1, "El ID del doctor es requerido"),
  reportNumber: z.string().min(1, "El número de reporte es requerido"),
  reportType: z.enum(['lab', 'imaging', 'pathology', 'genetic', 'other']),
  studyDate: z.date(),
  reportDate: z.date(),
  status: z.enum(['preliminary', 'final', 'corrected', 'cancelled']).default('preliminary'),
  clinicalIndication: z.string().min(1, "La indicación clínica es requerida"),
  findings: z.string().min(1, "Los hallazgos son requeridos"),
  impression: z.string().min(1, "La impresión diagnóstica es requerida"),
  recommendations: z.string().optional(),
  urgency: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  abnormalFlag: z.boolean().default(false),
  criticalValues: z.array(z.string()).default([]),
  testResults: z.array(LabTestSchema).default([]),
  images: z.array(AttachmentSchema).default([]),
  reportedBy: z.string().min(1, "El responsable del reporte es requerido"),
  reviewedBy: z.string().optional(),
  reviewDate: z.date().optional(),
  distributionList: z.array(z.string()).default([]),
  notes: z.string().optional()
});

// Care Plan Schema
export const CarePlanSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  authorId: z.string().min(1, "El ID del autor es requerido"),
  careTeam: z.array(z.object({
    memberId: z.string(),
    role: z.enum(['primary_doctor', 'specialist', 'nurse', 'therapist', 'pharmacist']),
    name: z.string(),
    contactInfo: z.string().optional()
  })).min(1, "Debe haber al menos un miembro del equipo"),
  planTitle: z.string().min(1, "El título del plan es requerido"),
  planDescription: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  startDate: z.date(),
  endDate: z.date().optional(),
  goals: z.array(z.object({
    id: z.string(),
    description: z.string(),
    targetDate: z.date().optional(),
    status: z.enum(['not_started', 'in_progress', 'achieved', 'cancelled']).default('not_started'),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  })).default([]),
  activities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    frequency: z.string(),
    assignedTo: z.string(),
    dueDate: z.date().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled')
  })).default([]),
  currentStatus: z.enum(['active', 'on_hold', 'completed', 'cancelled']).default('active'),
  reviewDate: z.date().optional(),
  lastReviewDate: z.date().optional(),
  notes: z.string().optional()
});

// Export types
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type TelemedicineSession = z.infer<typeof TelemedicineSessionSchema>;
export type VitalSignsRecord = z.infer<typeof VitalSignsRecordSchema>;
export type MedicalHistory = z.infer<typeof MedicalHistorySchema>;
export type ClinicalNotes = z.infer<typeof ClinicalNotesSchema>;
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;
export type CarePlan = z.infer<typeof CarePlanSchema>;