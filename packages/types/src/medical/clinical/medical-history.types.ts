/**
 * @fileoverview Tipos para historia clínica médica
 * @module @altamedica/types/medical/clinical/medical-history
 */

import { z } from 'zod';
import { BaseEntity } from '../../core/base.types';
import { PatientId, DoctorId } from '../../core/branded.types';

/**
 * Antecedente médico personal
 */
export interface PersonalMedicalHistory {
  /** Condición médica */
  condition: string;
  /** Código ICD-10 si disponible */
  icd10Code?: string;
  /** Año de diagnóstico */
  yearDiagnosed?: number;
  /** Estado actual */
  status: 'active' | 'resolved' | 'chronic' | 'in_remission';
  /** Tratamiento actual */
  currentTreatment?: string;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Antecedente médico familiar
 */
export interface FamilyMedicalHistory {
  /** Relación familiar */
  relationship: 'parent' | 'sibling' | 'grandparent' | 'aunt_uncle' | 'cousin' | 'other';
  /** Condición médica */
  condition: string;
  /** Edad de inicio (si se conoce) */
  ageOfOnset?: number;
  /** Edad al momento del diagnóstico en el familiar */
  ageAtDiagnosis?: number;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Antecedente quirúrgico
 */
export interface SurgicalHistory {
  /** Nombre del procedimiento */
  procedure: string;
  /** Fecha de la cirugía */
  date: Date;
  /** Hospital donde se realizó */
  hospital?: string;
  /** Cirujano principal */
  surgeon?: string;
  /** Complicaciones */
  complications?: string;
  /** Resultado */
  outcome: 'successful' | 'complications' | 'failed' | 'unknown';
  /** Notas adicionales */
  notes?: string;
}

/**
 * Hábito social (alcohol, tabaco, drogas)
 */
export interface SocialHabit {
  /** Tipo de hábito */
  type: 'alcohol' | 'tobacco' | 'drugs' | 'other';
  /** Estado actual */
  status: 'never' | 'former' | 'current' | 'occasional';
  /** Cantidad/frecuencia */
  frequency?: string;
  /** Año de inicio */
  startYear?: number;
  /** Año de finalización (si aplica) */
  quitYear?: number;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Historia clínica médica completa
 */
export interface MedicalHistory extends BaseEntity {
  /** ID único */
  id: string;
  /** ID del paciente */
  patientId: PatientId;
  /** Última actualización por */
  lastUpdatedBy: DoctorId;
  
  // Antecedentes personales
  /** Antecedentes médicos personales */
  personalHistory: PersonalMedicalHistory[];
  /** Antecedentes quirúrgicos */
  surgicalHistory: SurgicalHistory[];
  /** Hospitalizaciones previas */
  hospitalizations: Hospitalization[];
  
  // Antecedentes familiares
  /** Antecedentes médicos familiares */
  familyHistory: FamilyMedicalHistory[];
  
  // Hábitos y estilo de vida
  /** Hábitos sociales */
  socialHabits: SocialHabit[];
  /** Actividad física */
  physicalActivity?: {
    frequency: 'none' | 'occasional' | 'regular' | 'intense';
    type?: string;
    hoursPerWeek?: number;
  };
  /** Dieta */
  diet?: {
    type: 'omnivore' | 'vegetarian' | 'vegan' | 'mediterranean' | 'other';
    restrictions?: string[];
    notes?: string;
  };
  
  // Historia reproductiva (si aplica)
  /** Historia reproductiva */
  reproductiveHistory?: {
    pregnancies?: number;
    livebirths?: number;
    miscarriages?: number;
    abortions?: number;
    menarcheAge?: number;
    menopauseAge?: number;
    lastMenstrualPeriod?: Date;
    contraceptiveMethod?: string;
  };
  
  // Historia ocupacional
  /** Historia ocupacional */
  occupationalHistory?: {
    currentOccupation?: string;
    occupationalHazards?: string[];
    yearsInCurrentJob?: number;
    previousOccupations?: Array<{
      occupation: string;
      years: number;
      hazards?: string[];
    }>;
  };
  
  // Revisión por sistemas
  /** Síntomas actuales por sistema */
  reviewOfSystems?: {
    constitutional?: string[];
    cardiovascular?: string[];
    respiratory?: string[];
    gastrointestinal?: string[];
    genitourinary?: string[];
    musculoskeletal?: string[];
    neurological?: string[];
    psychiatric?: string[];
    endocrine?: string[];
    dermatological?: string[];
    hematological?: string[];
  };
  
  /** Comentarios generales */
  generalComments?: string;
  /** Fecha de última revisión completa */
  lastCompleteReview: Date;
}

/**
 * Hospitalización previa
 */
export interface Hospitalization {
  /** Fecha de ingreso */
  admissionDate: Date;
  /** Fecha de alta */
  dischargeDate: Date;
  /** Hospital */
  hospital: string;
  /** Motivo de ingreso */
  reason: string;
  /** Diagnóstico principal */
  primaryDiagnosis?: string;
  /** Procedimientos realizados */
  procedures?: string[];
  /** Complicaciones */
  complications?: string;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Schema de validación para historia médica
 */
export const MedicalHistorySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  lastUpdatedBy: z.string(),
  personalHistory: z.array(z.object({
    condition: z.string(),
    icd10Code: z.string().optional(),
    yearDiagnosed: z.number().optional(),
    status: z.enum(['active', 'resolved', 'chronic', 'in_remission']),
    currentTreatment: z.string().optional(),
    notes: z.string().optional()
  })),
  surgicalHistory: z.array(z.object({
    procedure: z.string(),
    date: z.date(),
    hospital: z.string().optional(),
    surgeon: z.string().optional(),
    complications: z.string().optional(),
    outcome: z.enum(['successful', 'complications', 'failed', 'unknown']),
    notes: z.string().optional()
  })),
  familyHistory: z.array(z.object({
    relationship: z.enum(['parent', 'sibling', 'grandparent', 'aunt_uncle', 'cousin', 'other']),
    condition: z.string(),
    ageOfOnset: z.number().optional(),
    ageAtDiagnosis: z.number().optional(),
    notes: z.string().optional()
  })),
  socialHabits: z.array(z.object({
    type: z.enum(['alcohol', 'tobacco', 'drugs', 'other']),
    status: z.enum(['never', 'former', 'current', 'occasional']),
    frequency: z.string().optional(),
    startYear: z.number().optional(),
    quitYear: z.number().optional(),
    notes: z.string().optional()
  })),
  generalComments: z.string().optional(),
  lastCompleteReview: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para crear nueva historia médica
 */
export const CreateMedicalHistorySchema = MedicalHistorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualizar historia médica
 */
export const UpdateMedicalHistorySchema = CreateMedicalHistorySchema.partial();