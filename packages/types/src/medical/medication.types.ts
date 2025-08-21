/**
 * @fileoverview Tipos para medicamentos y catálogo de medicación
 * @module @altamedica/types/medical/medication
 * @description Definiciones de tipos para el catálogo de medicamentos
 */

import { z } from 'zod';

// ==================== ENUMS & TYPES ====================

/**
 * Formas de dosificación disponibles
 */
export type DosageForm = 
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'drops'
  | 'inhaler'
  | 'patch'
  | 'suppository'
  | 'solution'
  | 'suspension'
  | 'gel'
  | 'spray'
  | 'powder'
  | 'other';

/**
 * Categorías de medicamentos
 */
export type MedicationCategory = 
  | 'antibiotic'
  | 'analgesic'
  | 'antihypertensive'
  | 'antidiabetic'
  | 'antihistamine'
  | 'antidepressant'
  | 'anxiolytic'
  | 'anticoagulant'
  | 'anticonvulsant'
  | 'antiviral'
  | 'antifungal'
  | 'bronchodilator'
  | 'corticosteroid'
  | 'diuretic'
  | 'immunosuppressant'
  | 'proton_pump_inhibitor'
  | 'statin'
  | 'vitamin'
  | 'other';

// ==================== INTERFACES ====================

/**
 * Medicamento del catálogo con toda la información
 * @interface Medication
 */
export interface Medication {
  /** Identificador único del medicamento */
  id: string;
  /** Nombre comercial del medicamento */
  name: string;
  /** Nombre genérico o principio activo */
  genericName: string;
  /** Laboratorio o fabricante */
  manufacturer: string;
  /** Forma de dosificación */
  dosageForm: DosageForm;
  /** Concentración disponible (ej: "500mg", "10mg/ml") */
  strength: string;
  /** Categoría terapéutica */
  category: MedicationCategory;
  /** Requiere prescripción médica */
  requiresPrescription: boolean;
  /** Medicamento controlado */
  controlled: boolean;
  /** Descripción del medicamento */
  description?: string;
  /** Indicaciones de uso */
  indications?: string[];
  /** Contraindicaciones */
  contraindications?: string[];
  /** Efectos secundarios comunes */
  sideEffects?: string[];
  /** Interacciones medicamentosas conocidas */
  interactions?: string[];
  /** Advertencias especiales */
  warnings?: string[];
  /** Código de barras */
  barcode?: string;
  /** Precio de referencia */
  price?: number;
  /** Estado activo en el catálogo */
  active: boolean;
  /** Fecha de creación */
  createdAt?: Date;
  /** Fecha de actualización */
  updatedAt?: Date;
}

/**
 * Medicamento con ID extendido para catálogos
 * Compatible con PatientMedication pero con ID obligatorio
 */
export interface MedicationWithId extends Medication {
  id: string;
}

/**
 * Criterios de búsqueda de medicamentos
 * @interface MedicationSearch
 */
export interface MedicationSearch {
  /** Texto de búsqueda (nombre o genérico) */
  query?: string;
  /** Filtrar por categoría */
  category?: MedicationCategory;
  /** Filtrar por forma de dosificación */
  dosageForm?: DosageForm;
  /** Solo medicamentos que requieren prescripción */
  requiresPrescription?: boolean;
  /** Solo medicamentos controlados */
  controlled?: boolean;
  /** Solo medicamentos activos */
  activeOnly?: boolean;
  /** Límite de resultados */
  limit?: number;
  /** Offset para paginación */
  offset?: number;
}

/**
 * Resultado de búsqueda de medicamentos
 */
export interface MedicationSearchResult {
  /** Medicamentos encontrados */
  medications: Medication[];
  /** Total de resultados */
  total: number;
  /** Offset actual */
  offset: number;
  /** Límite aplicado */
  limit: number;
}

// ==================== SCHEMAS ====================

/**
 * Schema de validación para Medication
 */
export const MedicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  genericName: z.string().min(1),
  manufacturer: z.string().min(1),
  dosageForm: z.enum([
    'tablet', 'capsule', 'syrup', 'injection', 'cream',
    'ointment', 'drops', 'inhaler', 'patch', 'suppository',
    'solution', 'suspension', 'gel', 'spray', 'powder', 'other'
  ] as const),
  strength: z.string().min(1),
  category: z.enum([
    'antibiotic', 'analgesic', 'antihypertensive', 'antidiabetic',
    'antihistamine', 'antidepressant', 'anxiolytic', 'anticoagulant',
    'anticonvulsant', 'antiviral', 'antifungal', 'bronchodilator',
    'corticosteroid', 'diuretic', 'immunosuppressant',
    'proton_pump_inhibitor', 'statin', 'vitamin', 'other'
  ] as const),
  requiresPrescription: z.boolean(),
  controlled: z.boolean(),
  description: z.string().optional(),
  indications: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  barcode: z.string().optional(),
  price: z.number().positive().optional(),
  active: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

/**
 * Schema para crear un medicamento
 */
export const CreateMedicationSchema = MedicationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualizar un medicamento
 */
export const UpdateMedicationSchema = CreateMedicationSchema.partial();

/**
 * Schema para búsqueda de medicamentos
 */
export const MedicationSearchSchema = z.object({
  query: z.string().optional(),
  category: z.enum([
    'antibiotic', 'analgesic', 'antihypertensive', 'antidiabetic',
    'antihistamine', 'antidepressant', 'anxiolytic', 'anticoagulant',
    'anticonvulsant', 'antiviral', 'antifungal', 'bronchodilator',
    'corticosteroid', 'diuretic', 'immunosuppressant',
    'proton_pump_inhibitor', 'statin', 'vitamin', 'other'
  ] as const).optional(),
  dosageForm: z.enum([
    'tablet', 'capsule', 'syrup', 'injection', 'cream',
    'ointment', 'drops', 'inhaler', 'patch', 'suppository',
    'solution', 'suspension', 'gel', 'spray', 'powder', 'other'
  ] as const).optional(),
  requiresPrescription: z.boolean().optional(),
  controlled: z.boolean().optional(),
  activeOnly: z.boolean().optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().min(0).optional()
});

// ==================== TYPE GUARDS ====================

/**
 * Verifica si un objeto es un Medication válido
 */
export function isMedication(obj: unknown): obj is Medication {
  return MedicationSchema.safeParse(obj).success;
}

/**
 * Verifica si un objeto es un MedicationSearch válido
 */
export function isMedicationSearch(obj: unknown): obj is MedicationSearch {
  return MedicationSearchSchema.safeParse(obj).success;
}