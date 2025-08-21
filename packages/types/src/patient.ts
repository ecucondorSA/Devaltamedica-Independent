import { z } from 'zod';

// Enums para Patient
export const Gender = {
  MALE: "Masculino",
  FEMALE: "Femenino", 
  OTHER: "Otro"
} as const;

export const BloodType = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+", 
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-"
} as const;

export const PatientStatus = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  DECEASED: "Fallecido",
  TRANSFERRED: "Transferido"
} as const;

export const MaritalStatus = {
  SINGLE: "Soltero",
  MARRIED: "Casado", 
  DIVORCED: "Divorciado",
  WIDOWED: "Viudo",
  OTHER: "Otro"
} as const;

// Esquema para contacto de emergencia
export const emergencyContactSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  relationship: z.string().min(2, { message: "La relación debe tener al menos 2 caracteres." }),
  phone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

// Esquema para información de seguro
export const insuranceSchema = z.object({
  provider: z.string().min(2, { message: "El proveedor debe tener al menos 2 caracteres." }),
  planNumber: z.string().min(2, { message: "El número de plan es requerido." }),
  groupNumber: z.string().optional(),
  expirationDate: z.date().optional(),
  coverage: z.string().optional(),
  copay: z.number().min(0).optional(),
  deductible: z.number().min(0).optional(),
});

// Esquema para signos vitales
export const vitalSignsSchema = z.object({
  heartRate: z.number().min(30).max(300).optional(), // latidos por minuto
  bloodPressure: z.object({
    systolic: z.number().min(70).max(300),
    diastolic: z.number().min(40).max(200),
  }).optional(),
  temperature: z.number().min(30).max(45).optional(), // Celsius
  oxygenSaturation: z.number().min(70).max(100).optional(), // porcentaje
  weight: z.number().min(0.5).max(500).optional(), // kg
  height: z.number().min(30).max(250).optional(), // cm
  bmi: z.number().min(10).max(60).optional(),
  lastUpdated: z.string().datetime(),
});

// Esquema para alergia
export const allergySchema = z.object({
  id: z.string().uuid(),
  allergen: z.string().min(2, { message: "El alérgeno debe tener al menos 2 caracteres." }),
  severity: z.enum(["Leve", "Moderada", "Severa", "Crítica"]),
  reaction: z.string().optional(),
  diagnosedDate: z.date().optional(),
  notes: z.string().optional(),
});

// Esquema para condición crónica
export const chronicConditionSchema = z.object({
  id: z.string().uuid(),
  condition: z.string().min(2, { message: "La condición debe tener al menos 2 caracteres." }),
  diagnosedDate: z.date().optional(),
  severity: z.enum(["Leve", "Moderada", "Severa"]).optional(),
  status: z.enum(["Activa", "Controlada", "En Remisión", "Curada"]).default("Activa"),
  medications: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Esquema para medicación actual
export const medicationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "El nombre del medicamento debe tener al menos 2 caracteres." }),
  dosage: z.string().min(1, { message: "La dosis es requerida." }),
  frequency: z.string().min(1, { message: "La frecuencia es requerida." }),
  prescribedBy: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

// Esquema para historial médico
export const medicalHistorySchema = z.object({
  id: z.string().uuid(),
  date: z.date(),
  description: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres." }),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  doctor: z.string().min(2, { message: "El nombre del doctor es requerido." }),
  specialty: z.string().optional(),
  appointmentId: z.string().uuid().optional(),
  attachments: z.array(z.string()).default([]), // URLs de archivos
});

// Esquema principal del paciente
export const patientSchema = z.object({
  id: z.string().uuid(),
  
  // Información personal básica
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  dateOfBirth: z.date(),
  gender: z.enum(Object.values(Gender) as [string, ...string[]]),
  dni: z.string().min(7, { message: "El DNI debe tener al menos 7 caracteres." }),
  
  // Información de contacto
  email: z.string().email({ message: "Email inválido." }),
  phone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }),
  alternativePhone: z.string().optional(),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  city: z.string().min(2, { message: "La ciudad debe tener al menos 2 caracteres." }),
  state: z.string().min(2, { message: "El estado/provincia debe tener al menos 2 caracteres." }),
  zipCode: z.string().min(3, { message: "El código postal debe tener al menos 3 caracteres." }),
  country: z.string().min(2, { message: "El país debe tener al menos 2 caracteres." }).default("Argentina"),
  
  // Información médica básica
  bloodType: z.enum(Object.values(BloodType) as [string, ...string[]]).optional(),
  maritalStatus: z.enum(Object.values(MaritalStatus) as [string, ...string[]]).optional(),
  occupation: z.string().optional(),
  
  // Información de emergencia y seguro
  emergencyContact: emergencyContactSchema,
  insurance: insuranceSchema.optional(),
  
  // Estado y preferencias
  status: z.enum(Object.values(PatientStatus) as [string, ...string[]]).default(PatientStatus.ACTIVE),
  preferredLanguage: z.string().default("Español"),
  preferredCommunication: z.enum(["Email", "Teléfono", "SMS", "WhatsApp"]).default("Email"),
  
  // Información médica detallada
  allergies: z.array(allergySchema).default([]),
  chronicConditions: z.array(chronicConditionSchema).default([]),
  currentMedications: z.array(medicationSchema).default([]),
  vitals: vitalSignsSchema.optional(),
  
  // Historial médico
  medicalHistory: z.array(medicalHistorySchema).default([]),
  
  // Información adicional
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  
  // Preferencias de privacidad
  consentForMarketing: z.boolean().default(false),
  consentForDataSharing: z.boolean().default(false),
  
  // Información de última visita
  lastVisit: z.string().datetime().optional(),
  nextAppointment: z.string().datetime().optional(),
  totalVisits: z.number().min(0).default(0),
  totalSpent: z.number().min(0).default(0),
});

// Esquema para crear un nuevo paciente
export const createPatientSchema = patientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalVisits: true,
  totalSpent: true,
  medicalHistory: true,
});

// Esquema para actualizar un paciente
export const updatePatientSchema = patientSchema.partial().extend({
  id: z.string().uuid(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().uuid(),
});

// Esquema para filtros de búsqueda de pacientes
export const patientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(Object.values(PatientStatus) as [string, ...string[]])).optional(),
  gender: z.array(z.enum(Object.values(Gender) as [string, ...string[]])).optional(),
  bloodType: z.array(z.enum(Object.values(BloodType) as [string, ...string[]])).optional(),
  ageRange: z.object({
    min: z.number().min(0).max(150),
    max: z.number().min(0).max(150),
  }).optional(),
  hasInsurance: z.boolean().optional(),
  hasAllergies: z.boolean().optional(),
  hasChronicConditions: z.boolean().optional(),
  lastVisitFrom: z.date().optional(),
  lastVisitTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

// Tipos TypeScript inferidos
export type Patient = z.infer<typeof patientSchema>;
export type CreatePatient = z.infer<typeof createPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;
export type PatientFilters = z.infer<typeof patientFiltersSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type Insurance = z.infer<typeof insuranceSchema>;
export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type Allergy = z.infer<typeof allergySchema>;
export type ChronicCondition = z.infer<typeof chronicConditionSchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;

// Tipos para enums
export type GenderType = typeof Gender[keyof typeof Gender];
export type BloodTypeType = typeof BloodType[keyof typeof BloodType];
export type PatientStatusType = typeof PatientStatus[keyof typeof PatientStatus];
export type MaritalStatusType = typeof MaritalStatus[keyof typeof MaritalStatus];
