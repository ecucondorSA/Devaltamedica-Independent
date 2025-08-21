import { z } from 'zod';

// Enums para mayor type safety
export const AppointmentStatus = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada", 
  CANCELLED: "Cancelada",
  NO_SHOW: "No Show",
  IN_PROGRESS: "En Progreso",
  RESCHEDULED: "Reprogramada"
} as const;

export const AppointmentType = {
  CONSULTATION: "Consulta",
  FOLLOW_UP: "Seguimiento", 
  EMERGENCY: "Emergencia",
  PROCEDURE: "Procedimiento",
  SURGERY: "Cirugía",
  TELEMEDICINE: "Telemedicina",
  CHECK_UP: "Chequeo",
  VACCINATION: "Vacunación"
} as const;

export const Priority = {
  LOW: "Baja",
  NORMAL: "Normal", 
  HIGH: "Alta",
  URGENT: "Urgente",
  CRITICAL: "Crítica"
} as const;

// Esquema para información del paciente en la cita
export const appointmentPatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dni: z.string().optional(),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

// Esquema para información del doctor en la cita
export const appointmentDoctorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  specialty: z.string(),
  licenseNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Esquema para notas médicas
export const medicalNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  type: z.enum(["Síntomas", "Diagnóstico", "Tratamiento", "Observaciones", "Prescripción"]),
  isPrivate: z.boolean().default(false),
});

// Esquema principal de cita expandido
export const appointmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2, { message: "El título debe tener al menos 2 caracteres." }),
  description: z.string().optional(),
  
  // Fechas y duración
  start: z.date(),
  end: z.date(),
  duration: z.number().min(15).max(480).optional(), // en minutos
  timezone: z.string().default("America/Argentina/Buenos_Aires"),
  
  // Participantes
  doctor: appointmentDoctorSchema,
  patient: appointmentPatientSchema.optional(),
  patientName: z.string().min(2).optional(), // Para citas sin paciente registrado
  
  // Estado y tipo
  status: z.enum(Object.values(AppointmentStatus) as [string, ...string[]]),
  type: z.enum(Object.values(AppointmentType) as [string, ...string[]]),
  priority: z.enum(Object.values(Priority) as [string, ...string[]]).default(Priority.NORMAL),
  
  // Ubicación y modalidad
  location: z.string().optional(),
  room: z.string().optional(),
  isVirtual: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
  meetingId: z.string().optional(),
  
  // Información médica
  symptoms: z.array(z.string()).default([]),
  diagnosis: z.string().optional(),
  medicalNotes: z.array(medicalNoteSchema).default([]),
  prescriptions: z.array(z.string()).default([]),
  
  // Información administrativa
  cost: z.number().min(0).optional(),
  insuranceCovered: z.boolean().default(false),
  paymentStatus: z.enum(["Pendiente", "Pagado", "Parcial", "Exento"]).default("Pendiente"),
  
  // Recordatorios y notificaciones
  reminderSent: z.boolean().default(false),
  reminderTime: z.number().optional(), // minutos antes de la cita
  notifyPatient: z.boolean().default(true),
  notifyDoctor: z.boolean().default(true),
  
  // Seguimiento
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  followUpAppointmentId: z.string().uuid().optional(),
  parentAppointmentId: z.string().uuid().optional(), // Para seguimientos
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  
  // Campos opcionales para funcionalidad avanzada
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.enum(["Diaria", "Semanal", "Mensual", "Anual"]),
    interval: z.number().min(1),
    endDate: z.date().optional(),
    occurrences: z.number().optional(),
  }).optional(),
  
  // Rating y feedback
  patientRating: z.number().min(1).max(5).optional(),
  patientFeedback: z.string().optional(),
  doctorNotes: z.string().optional(),
});

// Esquema para crear una nueva cita (campos requeridos mínimos)
export const createAppointmentSchema = appointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  medicalNotes: true,
  reminderSent: true,
}).extend({
  doctorId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
});

// Esquema para actualizar una cita
export const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().uuid(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().uuid(),
});

// Esquema para filtros de búsqueda
export const appointmentFiltersSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.array(z.enum(Object.values(AppointmentStatus) as [string, ...string[]])).optional(),
  type: z.array(z.enum(Object.values(AppointmentType) as [string, ...string[]])).optional(),
  priority: z.array(z.enum(Object.values(Priority) as [string, ...string[]])).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  isVirtual: z.boolean().optional(),
  paymentStatus: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Tipos TypeScript inferidos
export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>;
export type AppointmentPatient = z.infer<typeof appointmentPatientSchema>;
export type AppointmentDoctor = z.infer<typeof appointmentDoctorSchema>;
export type MedicalNote = z.infer<typeof medicalNoteSchema>;

// Tipos para enums
export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];
export type AppointmentTypeType = typeof AppointmentType[keyof typeof AppointmentType];
export type PriorityType = typeof Priority[keyof typeof Priority];
