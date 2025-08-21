/**
 * @fileoverview Validadores médicos especializados con optimizaciones
 * @module @altamedica/types/validators/medical-validators
 * @description Validaciones específicas para datos médicos con cache y optimizaciones
 */

import { z } from 'zod';
import { createLazySchema, ProgressiveValidator } from './lazy-schemas';

// ==================== MEDICAL DATA VALIDATORS ====================

/**
 * Validador de signos vitales con rangos médicos normales
 */
export const VitalSignsSchema = createLazySchema(
  'vital-signs',
  () => z.object({
    // Presión arterial
    bloodPressureSystolic: z.number()
      .min(60, 'Presión sistólica muy baja')
      .max(250, 'Presión sistólica muy alta')
      .optional(),
    
    bloodPressureDiastolic: z.number()
      .min(30, 'Presión diastólica muy baja')
      .max(150, 'Presión diastólica muy alta')
      .optional(),
    
    // Frecuencia cardíaca
    heartRate: z.number()
      .min(30, 'Frecuencia cardíaca muy baja')
      .max(220, 'Frecuencia cardíaca muy alta')
      .optional(),
    
    // Temperatura
    temperature: z.number()
      .min(32, 'Temperatura muy baja (hipotermia)')
      .max(45, 'Temperatura muy alta (hipertermia)')
      .optional(),
    
    // Frecuencia respiratoria
    respiratoryRate: z.number()
      .min(8, 'Frecuencia respiratoria muy baja')
      .max(60, 'Frecuencia respiratoria muy alta')
      .optional(),
    
    // Saturación de oxígeno
    oxygenSaturation: z.number()
      .min(50, 'Saturación de oxígeno muy baja')
      .max(100, 'Saturación no puede exceder 100%')
      .optional(),
    
    // Peso y altura
    weight: z.number()
      .positive('Peso debe ser positivo')
      .min(0.5, 'Peso muy bajo')
      .max(1000, 'Peso muy alto')
      .optional(),
    
    height: z.number()
      .positive('Altura debe ser positiva')
      .min(30, 'Altura muy baja')
      .max(300, 'Altura muy alta')
      .optional(),
    
    // IMC calculado
    bmi: z.number()
      .min(10, 'IMC muy bajo')
      .max(80, 'IMC muy alto')
      .optional(),
    
    recordedAt: z.date(),
    recordedBy: z.string().min(1, 'Requerido quien registró')
  }).refine(
    (data) => {
      // Validación cruzada: IMC debe coincidir con peso y altura si están presentes
      if (data.weight && data.height && data.bmi) {
        const calculatedBMI = data.weight / Math.pow(data.height / 100, 2);
        const difference = Math.abs(calculatedBMI - data.bmi);
        return difference < 1; // Tolerancia de 1 punto de IMC
      }
      return true;
    },
    { message: 'IMC no coincide con peso y altura proporcionados' }
  ),
  { ttl: 5 * 60 * 1000 } // 5 minutos cache
);

/**
 * Validador de medicamentos con verificación de dosis
 */
export const MedicationSchema = createLazySchema(
  'medication',
  () => z.object({
    name: z.string()
      .min(2, 'Nombre muy corto')
      .max(200, 'Nombre muy largo')
      .regex(/^[a-zA-ZÀ-ÿ\s\-\(\)0-9\.]+$/, 'Caracteres inválidos en nombre'),
    
    dosage: z.string()
      .min(1, 'Dosis requerida')
      .regex(/^\d+(\.\d+)?\s*(mg|g|ml|mcg|UI|%|comp|cap|tab).*$/i, 
        'Formato de dosis inválido (ej: 500mg, 1g, 10ml)'),
    
    frequency: z.string()
      .min(1, 'Frecuencia requerida')
      .regex(/^(cada\s+\d+\s+(hora|horas|día|días)|una\s+vez\s+al\s+día|\d+\s+veces?\s+al\s+día|según\s+necesidad)/i,
        'Formato de frecuencia inválido'),
    
    route: z.enum([
      'oral', 'iv', 'im', 'subcutaneous', 'topical', 'inhalation', 
      'rectal', 'transdermal', 'sublingual', 'other'
    ], { errorMap: () => ({ message: 'Vía de administración inválida' }) }),
    
    startDate: z.date(),
    
    endDate: z.date().optional(),
    
    prescribedBy: z.string()
      .min(1, 'Prescriptor requerido')
      .max(100, 'Nombre del prescriptor muy largo'),
    
    reason: z.string()
      .min(3, 'Razón muy corta')
      .max(500, 'Razón muy larga'),
    
    notes: z.string().max(1000, 'Notas muy largas').optional()
  }).refine(
    (data) => {
      // Validación: fecha de fin debe ser posterior a fecha de inicio
      if (data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    { message: 'Fecha de fin debe ser posterior a fecha de inicio' }
  ),
  { ttl: 10 * 60 * 1000 }
);

/**
 * Validador de alergias médicas
 */
export const AllergySchema = createLazySchema(
  'allergy',
  () => z.object({
    allergen: z.string()
      .min(2, 'Alérgeno debe tener al menos 2 caracteres')
      .max(100, 'Nombre del alérgeno muy largo')
      .regex(/^[a-zA-ZÀ-ÿ\s\-\(\)]+$/, 'Caracteres inválidos en alérgeno'),
    
    severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening'], {
      errorMap: () => ({ message: 'Severidad debe ser: mild, moderate, severe, life_threatening' })
    }),
    
    reaction: z.array(z.string().min(1)).min(1, 'Debe especificar al menos una reacción'),
    
    onsetDate: z.date().optional(),
    
    lastReaction: z.date().optional(),
    
    treatment: z.string().max(500, 'Tratamiento muy largo').optional(),
    
    notes: z.string().max(1000, 'Notas muy largas').optional()
  }).refine(
    (data) => {
      // Validación: última reacción debe ser posterior a fecha de inicio
      if (data.onsetDate && data.lastReaction) {
        return data.lastReaction >= data.onsetDate;
      }
      return true;
    },
    { message: 'Última reacción debe ser posterior a fecha de inicio' }
  ),
  { ttl: 15 * 60 * 1000 }
);

/**
 * Validador de diagnósticos ICD-10
 */
export const DiagnosisSchema = createLazySchema(
  'diagnosis',
  () => z.object({
    code: z.string()
      .regex(/^[A-Z]\d{2}(\.[0-9X]{1,2})?$/, 'Código ICD-10 inválido (ej: A09, B99.9, C25.1)'),
    
    description: z.string()
      .min(5, 'Descripción muy corta')
      .max(500, 'Descripción muy larga'),
    
    type: z.enum(['principal', 'secondary', 'complication', 'comorbidity'], {
      errorMap: () => ({ message: 'Tipo de diagnóstico inválido' })
    }),
    
    status: z.enum(['active', 'resolved', 'chronic', 'remission'], {
      errorMap: () => ({ message: 'Estado del diagnóstico inválido' })
    }),
    
    diagnosedAt: z.date(),
    
    diagnosedBy: z.string()
      .min(1, 'Médico diagnosticador requerido')
      .max(100, 'Nombre muy largo'),
    
    severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']).optional(),
    
    confidence: z.number()
      .min(0, 'Confianza mínima 0%')
      .max(100, 'Confianza máxima 100%')
      .optional(),
    
    notes: z.string().max(1000, 'Notas muy largas').optional()
  }),
  { ttl: 20 * 60 * 1000 }
);

/**
 * Validador de estudios de laboratorio
 */
export const LabResultSchema = createLazySchema(
  'lab-result',
  () => z.object({
    testName: z.string()
      .min(2, 'Nombre del estudio muy corto')
      .max(200, 'Nombre del estudio muy largo'),
    
    testCode: z.string()
      .regex(/^[A-Z0-9\-]+$/, 'Código de estudio inválido')
      .optional(),
    
    value: z.union([
      z.number(),
      z.string().min(1, 'Valor no puede estar vacío')
    ]),
    
    unit: z.string()
      .max(20, 'Unidad muy larga')
      .optional(),
    
    referenceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      text: z.string().optional()
    }).optional(),
    
    status: z.enum(['normal', 'abnormal', 'critical', 'pending'], {
      errorMap: () => ({ message: 'Estado del resultado inválido' })
    }),
    
    collectedAt: z.date(),
    
    resultedAt: z.date(),
    
    orderedBy: z.string().min(1, 'Médico solicitante requerido'),
    
    performedBy: z.string().min(1, 'Laboratorio requerido'),
    
    notes: z.string().max(1000, 'Notas muy largas').optional()
  }).refine(
    (data) => {
      // Validación: fecha de resultado debe ser posterior a fecha de recolección
      return data.resultedAt >= data.collectedAt;
    },
    { message: 'Fecha de resultado debe ser posterior a recolección' }
  ),
  { ttl: 30 * 60 * 1000 }
);

// ==================== COMPOSITE VALIDATORS ====================

/**
 * Validador progresivo para perfil de paciente
 */
export const createPatientProfileValidator = () => {
  const baseSchema = z.object({
    // Información básica
    id: z.string().uuid(),
    userId: z.string().uuid(),
    medicalRecordNumber: z.string().min(1),
    
    // Información personal
    dateOfBirth: z.date()
      .refine(date => date < new Date(), 'Fecha debe ser en el pasado')
      .refine(date => date > new Date('1900-01-01'), 'Fecha muy antigua'),
    
    gender: z.enum(['male', 'female', 'other']),
    documentType: z.enum(['DNI', 'PASSPORT', 'CEDULA', 'LC', 'LE']),
    documentNumber: z.string().min(7).max(20),
    
    // Información médica
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.array(AllergySchema).default([]),
    medications: z.array(MedicationSchema).default([]),
    
    // Metadatos
    createdAt: z.date(),
    updatedAt: z.date()
  });
  
  return new ProgressiveValidator(baseSchema);
};

// ==================== VALIDATION HELPERS ====================

/**
 * Valida edad mínima requerida
 * @param minAge - Edad mínima
 * @returns Validador de fecha de nacimiento
 */
export const createAgeValidator = (minAge: number) => 
  z.date().refine(
    (birthDate) => {
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= minAge;
      }
      
      return age >= minAge;
    },
    { message: `Debe ser mayor de ${minAge} años` }
  );

/**
 * Valida interacciones medicamentosas básicas
 * @param medications - Lista de medicamentos
 * @returns Resultado de validación
 */
export const validateDrugInteractions = (medications: any[]): {
  hasInteractions: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
  }>;
} => {
  // Base de datos simplificada de interacciones conocidas
  const knownInteractions = [
    {
      drugs: ['warfarina', 'aspirina'],
      severity: 'major' as const,
      description: 'Riesgo aumentado de sangrado'
    },
    {
      drugs: ['digoxina', 'amiodarona'],
      severity: 'major' as const,
      description: 'Toxicidad de digoxina'
    },
    {
      drugs: ['metformina', 'alcohol'],
      severity: 'moderate' as const,
      description: 'Riesgo de acidosis láctica'
    }
  ];
  
  const interactions = [];
  const medicationNames = medications.map(m => m.name?.toLowerCase() || '');
  
  for (const interaction of knownInteractions) {
    const foundDrugs = interaction.drugs.filter(drug => 
      medicationNames.some(med => med.includes(drug))
    );
    
    if (foundDrugs.length >= 2) {
      interactions.push({
        drug1: foundDrugs[0],
        drug2: foundDrugs[1],
        severity: interaction.severity,
        description: interaction.description
      });
    }
  }
  
  return {
    hasInteractions: interactions.length > 0,
    interactions
  };
};

/**
 * Calcula IMC y valida rangos
 * @param weight - Peso en kg
 * @param height - Altura en cm
 * @returns Resultado del cálculo
 */
export const calculateAndValidateBMI = (weight: number, height: number): {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely_obese';
  isHealthy: boolean;
} => {
  const bmi = weight / Math.pow(height / 100, 2);
  
  let category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely_obese';
  let isHealthy = false;
  
  if (bmi < 18.5) {
    category = 'underweight';
  } else if (bmi < 25) {
    category = 'normal';
    isHealthy = true;
  } else if (bmi < 30) {
    category = 'overweight';
  } else if (bmi < 40) {
    category = 'obese';
  } else {
    category = 'severely_obese';
  }
  
  return { bmi: Math.round(bmi * 10) / 10, category, isHealthy };
};

// ==================== BATCH MEDICAL VALIDATION ====================

/**
 * Validador batch especializado para datos médicos
 */
export class MedicalBatchValidator {
  /**
   * Valida un lote de pacientes
   * @param patients - Array de datos de pacientes
   * @returns Resultados de validación
   */
  static async validatePatients(patients: any[]): Promise<{
    valid: any[];
    invalid: Array<{ index: number; errors: string[]; data: any }>;
    warnings: Array<{ index: number; warnings: string[]; data: any }>;
  }> {
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const validator = createPatientProfileValidator();
      
      try {
        const result = validator.validateComplete();
        
        if (result.success) {
          // Verificar warnings médicos
          const patientWarnings = [];
          
          // Verificar interacciones medicamentosas
          if (patient.medications?.length > 0) {
            const drugCheck = validateDrugInteractions(patient.medications);
            if (drugCheck.hasInteractions) {
              patientWarnings.push(
                ...drugCheck.interactions.map(i => 
                  `Interacción ${i.severity}: ${i.drug1} + ${i.drug2} - ${i.description}`
                )
              );
            }
          }
          
          // Verificar IMC si hay peso y altura
          if (patient.weight && patient.height) {
            const bmiResult = calculateAndValidateBMI(patient.weight, patient.height);
            if (!bmiResult.isHealthy) {
              patientWarnings.push(`IMC ${bmiResult.bmi} (${bmiResult.category})`);
            }
          }
          
          valid.push(result.data);
          
          if (patientWarnings.length > 0) {
            warnings.push({
              index: i,
              warnings: patientWarnings,
              data: patient
            });
          }
        } else {
          invalid.push({
            index: i,
            errors: result.error.errors.map(e => e.message),
            data: patient
          });
        }
      } catch (error) {
        invalid.push({
          index: i,
          errors: [`Error de validación: ${error}`],
          data: patient
        });
      }
    }
    
    return { valid, invalid, warnings };
  }
}