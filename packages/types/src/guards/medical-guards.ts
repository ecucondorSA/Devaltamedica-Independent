/**
 * @fileoverview Type guards inteligentes para tipos médicos
 * @module @altamedica/types/guards/medical-guards
 * @description Guards que validan y refinan tipos médicos con lógica específica
 */

import { z } from 'zod';
import { 
  PatientProfile, 
  DoctorProfile, 
  Appointment,
  MedicalRecord,
  BloodType,
  BiologicalGender,
  MedicalSpecialty 
} from '../medical';
import { PatientId, DoctorId, AppointmentId, MedicalRecordId } from '../core/branded.types';

// ==================== BASIC TYPE GUARDS ====================

/**
 * Verifica si un valor es un PatientId válido
 * @param value - Valor a verificar
 * @returns true si es PatientId
 */
export function isPatientId(value: unknown): value is PatientId {
  return typeof value === 'string' && 
         value.length > 0 && 
         !value.includes(' ') &&
         (value.startsWith('pat_') || /^[a-f\d-]{36}$/i.test(value as string));
}

/**
 * Verifica si un valor es un DoctorId válido
 * @param value - Valor a verificar
 * @returns true si es DoctorId
 */
export function isDoctorId(value: unknown): value is DoctorId {
  return typeof value === 'string' &&
         value.length > 0 &&
         !value.includes(' ') &&
         (value.startsWith('doc_') || /^[a-f\d-]{36}$/i.test(value));
}

/**
 * Verifica si un valor es un tipo de sangre válido
 * @param value - Valor a verificar
 * @returns true si es BloodType válido
 */
export function isValidBloodType(value: unknown): value is BloodType {
  const validTypes: BloodType[] = [
    BloodType.A_POSITIVE, BloodType.A_NEGATIVE,
    BloodType.B_POSITIVE, BloodType.B_NEGATIVE,
    BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE,
    BloodType.O_POSITIVE, BloodType.O_NEGATIVE
  ];
  return validTypes.includes(value as BloodType);
}

/**
 * Verifica si un valor es un género biológico válido
 * @param value - Valor a verificar
 * @returns true si es BiologicalGender válido
 */
export function isValidGender(value: unknown): value is BiologicalGender {
  return Object.values(BiologicalGender).includes(value as BiologicalGender);
}

/**
 * Verifica si un valor es una especialidad médica válida
 * @param value - Valor a verificar
 * @returns true si es MedicalSpecialty válida
 */
export function isValidMedicalSpecialty(value: unknown): value is MedicalSpecialty {
  return Object.values(MedicalSpecialty).includes(value as MedicalSpecialty);
}

// ==================== COMPLEX MEDICAL GUARDS ====================

/**
 * Verifica si un objeto tiene la estructura básica de un paciente
 * @param value - Valor a verificar
 * @returns true si tiene estructura de paciente
 */
export function hasPatientStructure(value: unknown): value is Partial<PatientProfile> {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Verificar campos obligatorios básicos
  return (
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    (obj.dateOfBirth instanceof Date || typeof obj.dateOfBirth === 'string') &&
    isValidGender(obj.gender)
  );
}

/**
 * Verifica si un paciente tiene información médica crítica completa
 * @param patient - Paciente a verificar
 * @returns true si tiene información crítica
 */
export function hasCompleteMedicalInfo(patient: unknown): patient is PatientProfile & {
  bloodType: BloodType;
  allergies: string[];
  chronicConditions: string[];
  medications: any[];
} {
  if (!hasPatientStructure(patient)) return false;
  
  const p = patient as PatientProfile;
  
  return (
    isValidBloodType(p.bloodType) &&
    Array.isArray(p.allergies) &&
    Array.isArray(p.chronicConditions) &&
    Array.isArray(p.medications)
  );
}

/**
 * Verifica si un doctor tiene certificaciones válidas
 * @param doctor - Doctor a verificar
 * @returns true si tiene certificaciones válidas
 */
export function hasValidCertifications(doctor: unknown): doctor is DoctorProfile & {
  licenses: any[];
  specialties: MedicalSpecialty[];
  isVerified: true;
} {
  if (!doctor || typeof doctor !== 'object') return false;
  
  const d = doctor as Record<string, unknown>;
  
  return (
    Array.isArray(d.licenses) &&
    d.licenses.length > 0 &&
    Array.isArray(d.specialties) &&
    d.specialties.every(isValidMedicalSpecialty) &&
    d.isVerified === true
  );
}

/**
 * Verifica si una cita está en estado que permite modificaciones
 * @param appointment - Cita a verificar
 * @returns true si se puede modificar
 */
export function isModifiableAppointment(appointment: unknown): appointment is Appointment & {
  status: 'scheduled' | 'confirmed';
  scheduledDate: Date;
} {
  if (!appointment || typeof appointment !== 'object') return false;
  
  const apt = appointment as Record<string, unknown>;
  const modifiableStatuses = ['scheduled', 'confirmed'];
  
  return (
    modifiableStatuses.includes(apt.status as string) &&
    (apt.scheduledDate instanceof Date || typeof apt.scheduledDate === 'string') &&
    new Date(apt.scheduledDate as string) > new Date() // Fecha futura
  );
}

/**
 * Verifica si una cita es de telemedicina y tiene configuración válida
 * @param appointment - Cita a verificar
 * @returns true si es telemedicina válida
 */
export function isValidTelemedicineAppointment(appointment: unknown): appointment is Appointment & {
  isVirtual: true;
  telemedicineInfo: NonNullable<Appointment['telemedicineInfo']>;
} {
  if (!appointment || typeof appointment !== 'object') return false;
  
  const apt = appointment as Record<string, unknown>;
  
  return (
    apt.isVirtual === true &&
    apt.telemedicineInfo !== null &&
    apt.telemedicineInfo !== undefined &&
    typeof apt.telemedicineInfo === 'object' &&
    typeof (apt.telemedicineInfo as any).platform === 'string'
  );
}

/**
 * Verifica si un registro médico está firmado y completo
 * @param record - Registro a verificar
 * @returns true si está firmado y completo
 */
export function isSignedMedicalRecord(record: unknown): record is MedicalRecord & {
  signedBy: string;
  signedAt: Date;
  status: 'finalized';
} {
  if (!record || typeof record !== 'object') return false;
  
  const rec = record as Record<string, unknown>;
  
  return (
    typeof rec.signedBy === 'string' &&
    rec.signedBy.length > 0 &&
    (rec.signedAt instanceof Date || typeof rec.signedAt === 'string') &&
    rec.status === 'finalized'
  );
}

// ==================== MEDICAL DATA VALIDATION GUARDS ====================

/**
 * Verifica si los signos vitales están en rangos normales
 * @param vitals - Signos vitales a verificar
 * @returns true si están en rangos normales
 */
export function areVitalSignsNormal(vitals: unknown): vitals is {
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
} {
  if (!vitals || typeof vitals !== 'object') return false;
  
  const v = vitals as Record<string, unknown>;
  
  // Rangos normales para adultos
  return (
    typeof v.bloodPressureSystolic === 'number' &&
    v.bloodPressureSystolic >= 90 && v.bloodPressureSystolic <= 140 &&
    
    typeof v.bloodPressureDiastolic === 'number' &&
    v.bloodPressureDiastolic >= 60 && v.bloodPressureDiastolic <= 90 &&
    
    typeof v.heartRate === 'number' &&
    v.heartRate >= 60 && v.heartRate <= 100 &&
    
    typeof v.temperature === 'number' &&
    v.temperature >= 36.1 && v.temperature <= 37.2
  );
}

/**
 * Verifica si un IMC está en rango saludable
 * @param bmi - IMC a verificar
 * @returns true si está en rango saludable
 */
export function isHealthyBMI(bmi: unknown): bmi is number {
  return typeof bmi === 'number' && bmi >= 18.5 && bmi < 25;
}

/**
 * Verifica si una edad es válida para el contexto médico
 * @param age - Edad a verificar
 * @param context - Contexto médico
 * @returns true si la edad es válida
 */
export function isValidMedicalAge(
  age: unknown, 
  context: 'pediatric' | 'adult' | 'geriatric' | 'any' = 'any'
): age is number {
  if (typeof age !== 'number' || age < 0 || age > 150) return false;
  
  switch (context) {
    case 'pediatric':
      return age < 18;
    case 'adult':
      return age >= 18 && age < 65;
    case 'geriatric':
      return age >= 65;
    case 'any':
    default:
      return true;
  }
}

// ==================== MEDICATION GUARDS ====================

/**
 * Verifica si un medicamento tiene dosificación válida
 * @param medication - Medicamento a verificar
 * @returns true si tiene dosificación válida
 */
export function hasValidDosage(medication: unknown): medication is {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
} {
  if (!medication || typeof medication !== 'object') return false;
  
  const med = medication as Record<string, unknown>;
  
  return (
    typeof med.name === 'string' && med.name.length > 0 &&
    typeof med.dosage === 'string' && /\d+\s*(mg|g|ml|mcg|UI)/.test(med.dosage) &&
    typeof med.frequency === 'string' && med.frequency.length > 0 &&
    typeof med.route === 'string' && med.route.length > 0
  );
}

/**
 * Verifica si hay interacciones medicamentosas conocidas
 * @param medications - Lista de medicamentos
 * @returns true si hay interacciones detectadas
 */
export function hasKnownDrugInteractions(medications: unknown): medications is Array<{
  name: string;
  interactions: string[];
}> {
  if (!Array.isArray(medications)) return false;
  
  // Interacciones conocidas básicas
  const knownInteractions = [
    ['warfarina', 'aspirina'],
    ['digoxina', 'amiodarona'],
    ['metformina', 'alcohol']
  ];
  
  const medicationNames = medications
    .map(m => typeof m === 'object' && m && 'name' in m ? (m as any).name : '')
    .filter(name => typeof name === 'string')
    .map(name => name.toLowerCase());
  
  return knownInteractions.some(interaction =>
    interaction.every(drug => 
      medicationNames.some(med => med.includes(drug))
    )
  );
}

// ==================== COMPOSITE GUARDS ====================

/**
 * Verifica si un paciente está listo para alta médica
 * @param patient - Paciente a verificar
 * @returns true si está listo para alta
 */
export function isReadyForDischarge(patient: unknown): patient is PatientProfile & {
  vitalSigns: { status: 'stable' };
  medications: any[];
  dischargeInstructions: string;
} {
  if (!hasPatientStructure(patient)) return false;
  
  const p = patient as any;
  
  return (
    p.vitalSigns?.status === 'stable' &&
    Array.isArray(p.medications) &&
    typeof p.dischargeInstructions === 'string' &&
    p.dischargeInstructions.length > 0
  );
}

/**
 * Verifica si un doctor puede atender en telemedicina
 * @param doctor - Doctor a verificar
 * @returns true si puede atender por telemedicina
 */
export function canProvideTelemedicine(doctor: unknown): doctor is DoctorProfile & {
  offersTelemedicine: true;
  telemedicineConfig: NonNullable<DoctorProfile['telemedicineConfig']>;
  isVerified: true;
} {
  if (!doctor || typeof doctor !== 'object') return false;
  
  const d = doctor as Record<string, unknown>;
  
  return (
    d.offersTelemedicine === true &&
    d.telemedicineConfig !== null &&
    d.telemedicineConfig !== undefined &&
    typeof d.telemedicineConfig === 'object' &&
    d.isVerified === true
  );
}

// ==================== EXPORT CONVENIENCE GUARDS ====================

/**
 * Guards médicos agrupados por categoría
 */
export const MedicalGuards = {
  // Identificadores
  patient: { isPatientId, hasPatientStructure, hasCompleteMedicalInfo },
  doctor: { isDoctorId, hasValidCertifications, canProvideTelemedicine },
  appointment: { isModifiableAppointment, isValidTelemedicineAppointment },
  record: { isSignedMedicalRecord },
  
  // Tipos básicos
  bloodType: { isValidBloodType },
  gender: { isValidGender },
  specialty: { isValidMedicalSpecialty },
  
  // Datos médicos
  vitals: { areVitalSignsNormal },
  bmi: { isHealthyBMI },
  age: { isValidMedicalAge },
  
  // Medicamentos
  medication: { hasValidDosage, hasKnownDrugInteractions },
  
  // Estados complejos
  discharge: { isReadyForDischarge }
} as const;