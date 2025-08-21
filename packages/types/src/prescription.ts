/// <reference types="node" />
import { z } from 'zod';

/**
 * Prescription Types and Schemas
 * Medical prescription system with Argentina compliance
 * Compliant with Ley 17.132 (Medical Practice) and Resolution 696/16 (Digital Prescriptions)
 */

// Drug route of administration
export const DrugRouteSchema = z.enum([
  'oral',
  'sublingual', 
  'topical',
  'transdermal',
  'inhalation',
  'nasal',
  'ophthalmic',
  'otic',
  'rectal',
  'vaginal',
  'intramuscular',
  'intravenous',
  'subcutaneous',
  'intradermal',
  'epidural',
  'intrathecal'
]);

// Frequency units
export const FrequencyUnitSchema = z.enum([
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'as_needed',
  'stat', // immediately
  'before_meals',
  'after_meals',
  'at_bedtime'
]);

// Dosage form
export const DosageFormSchema = z.enum([
  'tablet',
  'capsule',
  'liquid',
  'syrup',
  'suspension',
  'solution',
  'injection',
  'cream',
  'ointment',
  'gel',
  'patch',
  'drops',
  'spray',
  'inhaler',
  'suppository',
  'powder'
]);

// Drug/Medication schema
export const MedicationSchema = z.object({
  id: z.string(),
  genericName: z.string().min(1),
  brandName: z.string().optional(),
  manufacturer: z.string().optional(),
  dosageForm: DosageFormSchema,
  strength: z.string(), // e.g., "500mg", "10mg/ml"
  activeIngredients: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  category: z.string().optional(), // therapeutic category
  requiresPrescription: z.boolean().default(true),
  controlledSubstance: z.boolean().default(false),
  anmatRegistration: z.string().optional(), // ANMAT registration number (Argentina)
});

// Prescription dosage instructions
export const DosageInstructionSchema = z.object({
  dose: z.string(), // e.g., "1 tablet", "5ml", "2 puffs"
  route: DrugRouteSchema,
  frequency: z.string(), // e.g., "twice daily", "every 8 hours"
  frequencyUnit: FrequencyUnitSchema.optional(),
  duration: z.string().optional(), // e.g., "7 days", "until finished"
  additionalInstructions: z.string().optional(), // e.g., "take with food"
});

// Main Prescription schema
export const PrescriptionSchema = z.object({
  id: z.string(),
  prescriptionNumber: z.string(), // Unique prescription identifier
  
  // Patient information
  patientId: z.string(),
  patientName: z.string(),
  patientDni: z.string().optional(), // DNI for Argentina
  patientAge: z.number().optional(),
  patientWeight: z.number().optional(), // in kg, for dosage calculations
  
  // Prescriber information
  doctorId: z.string(),
  doctorName: z.string(),
  doctorLicense: z.string(), // Medical license number
  doctorSpecialty: z.string().optional(),
  doctorSignature: z.string().optional(), // Digital signature placeholder
  
  // Medication details
  drug: z.string(), // Generic or brand name
  medicationId: z.string().optional(), // Reference to medication catalog
  dosage: z.string(), // Dosage amount (e.g., "500mg")
  route: DrugRouteSchema,
  frequency: z.string(), // How often (e.g., "3 times daily")
  duration: z.string().optional(), // Duration of treatment
  quantity: z.number(), // Total quantity to dispense
  refills: z.number().default(0), // Number of refills allowed
  
  // Detailed instructions
  instructions: DosageInstructionSchema.optional(),
  pharmacyNotes: z.string().optional(), // Notes for pharmacist
  patientInstructions: z.string().optional(), // Instructions for patient
  
  // Diagnosis and justification
  diagnosis: z.string().optional(),
  icd10Code: z.string().optional(), // ICD-10 diagnosis code
  therapeuticIndication: z.string().optional(),
  
  // Administrative
  status: z.enum(['draft', 'active', 'dispensed', 'cancelled', 'expired']).default('draft'),
  issuedAt: z.date(),
  expiresAt: z.date().optional(), // Prescription expiration
  dispensedAt: z.date().optional(),
  dispensedBy: z.string().optional(), // Pharmacy/pharmacist ID
  
  // Security and compliance
  securityHash: z.string().optional(), // Hash for integrity verification
  digitalSignature: z.string().optional(), // Future: digital signature
  qrCode: z.string().optional(), // QR code for verification
  
  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  
  // Argentina specific
  obraSocial: z.string().optional(), // Health insurance
  planNumber: z.string().optional(), // Insurance plan number
  authorizationCode: z.string().optional(), // Prior authorization if required
});

// Create prescription request
export const CreatePrescriptionSchema = PrescriptionSchema.omit({
  id: true,
  prescriptionNumber: true,
  status: true,
  securityHash: true,
  digitalSignature: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
  dispensedAt: true,
  dispensedBy: true,
}).extend({
  issuedAt: z.string().transform(str => new Date(str)),
  expiresAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

// Update prescription request
export const UpdatePrescriptionSchema = PrescriptionSchema.partial().omit({
  id: true,
  prescriptionNumber: true,
  createdAt: true,
  createdBy: true,
});

// Prescription search filters
export const PrescriptionFilterSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum(['draft', 'active', 'dispensed', 'cancelled', 'expired']).optional(),
  medicationId: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  search: z.string().optional(), // Search in patient name or drug name
});

// Medication search request
export const MedicationSearchSchema = z.object({
  query: z.string().min(2), // Search term
  category: z.string().optional(),
  dosageForm: DosageFormSchema.optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Types
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type CreatePrescription = z.infer<typeof CreatePrescriptionSchema>;
export type UpdatePrescription = z.infer<typeof UpdatePrescriptionSchema>;
export type PrescriptionFilter = z.infer<typeof PrescriptionFilterSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type MedicationSearch = z.infer<typeof MedicationSearchSchema>;
export type DosageInstruction = z.infer<typeof DosageInstructionSchema>;
export type DrugRoute = z.infer<typeof DrugRouteSchema>;
export type FrequencyUnit = z.infer<typeof FrequencyUnitSchema>;
export type DosageForm = z.infer<typeof DosageFormSchema>;

// Helper functions
export const calculatePrescriptionExpiry = (issuedDate: Date, daysValid = 30): Date => {
  const expiryDate = new Date(issuedDate);
  expiryDate.setDate(expiryDate.getDate() + daysValid);
  return expiryDate;
};

export const generatePrescriptionNumber = (): string => {
  const prefix = 'RX';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const isPrescriptionValid = (prescription: Prescription): boolean => {
  if (prescription.status !== 'active') return false;
  if (prescription.expiresAt && new Date() > prescription.expiresAt) return false;
  return true;
};

// Security hash generation (basic version, will be enhanced with crypto)
export const generatePrescriptionHash = (prescription: Partial<Prescription>): string => {
  const data = `${prescription.doctorId}|${prescription.patientId}|${prescription.drug}|${prescription.dosage}|${prescription.issuedAt}`;
  // Basic hash for now, will be replaced with proper crypto
  return Buffer.from(data).toString('base64');
};