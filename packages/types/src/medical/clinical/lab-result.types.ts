/**
 * @fileoverview Tipos para resultados de laboratorio
 * @module @altamedica/types/medical/clinical/lab-result
 */

import { z } from 'zod';
import { BaseEntity } from '../../core/base.types';
import { PatientId, DoctorId } from '../../core/branded.types';

/**
 * Estado del resultado de laboratorio
 */
export enum LabResultStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  AMENDED = 'amended'
}

/**
 * Categoría del estudio de laboratorio
 */
export enum LabCategory {
  HEMATOLOGY = 'hematology',
  BIOCHEMISTRY = 'biochemistry',
  IMMUNOLOGY = 'immunology',
  MICROBIOLOGY = 'microbiology',
  HORMONES = 'hormones',
  TUMOR_MARKERS = 'tumor_markers',
  GENETICS = 'genetics',
  TOXICOLOGY = 'toxicology',
  OTHER = 'other'
}

/**
 * Resultado individual de un parámetro de laboratorio
 */
export interface LabParameter {
  /** Nombre del parámetro */
  name: string;
  /** Valor obtenido */
  value: string | number;
  /** Unidad de medida */
  unit?: string;
  /** Valor de referencia mínimo */
  referenceMin?: number;
  /** Valor de referencia máximo */
  referenceMax?: number;
  /** Rango de referencia como texto */
  referenceRange?: string;
  /** Indica si está fuera del rango normal */
  abnormal: boolean;
  /** Indicador visual (H=alto, L=bajo, N=normal) */
  flag?: 'H' | 'L' | 'N' | 'HH' | 'LL';
  /** Comentarios del laboratorio */
  comments?: string;
}

/**
 * Resultado completo de laboratorio
 */
export interface LabResult extends BaseEntity {
  /** ID único del resultado */
  id: string;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor que ordenó */
  orderedBy: DoctorId;
  /** Número de orden */
  orderNumber: string;
  /** Nombre del estudio */
  studyName: string;
  /** Categoría del estudio */
  category: LabCategory;
  /** Estado del resultado */
  status: LabResultStatus;
  /** Fecha de orden */
  orderedAt: Date;
  /** Fecha de toma de muestra */
  specimenCollectedAt?: Date;
  /** Fecha del resultado */
  resultedAt?: Date;
  /** Parámetros medidos */
  parameters: LabParameter[];
  /** Comentarios generales */
  generalComments?: string;
  /** Laboratorio que procesó */
  laboratory: string;
  /** Tecnólogo responsable */
  technician?: string;
  /** Doctor que validó */
  validatedBy?: string;
  /** Prioridad del estudio */
  priority: 'routine' | 'urgent' | 'stat';
  /** Indica si requiere seguimiento */
  requiresFollowUp: boolean;
  /** Archivos adjuntos (PDFs, imágenes) */
  attachments?: string[];
}

/**
 * Schema de validación para resultado de laboratorio
 */
export const LabResultSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  orderedBy: z.string(),
  orderNumber: z.string(),
  studyName: z.string(),
  category: z.nativeEnum(LabCategory),
  status: z.nativeEnum(LabResultStatus),
  orderedAt: z.date(),
  specimenCollectedAt: z.date().optional(),
  resultedAt: z.date().optional(),
  parameters: z.array(z.object({
    name: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    referenceMin: z.number().optional(),
    referenceMax: z.number().optional(),
    referenceRange: z.string().optional(),
    abnormal: z.boolean(),
    flag: z.enum(['H', 'L', 'N', 'HH', 'LL']).optional(),
    comments: z.string().optional()
  })),
  generalComments: z.string().optional(),
  laboratory: z.string(),
  technician: z.string().optional(),
  validatedBy: z.string().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']),
  requiresFollowUp: z.boolean(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para crear nuevo resultado
 */
export const CreateLabResultSchema = LabResultSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualizar resultado
 */
export const UpdateLabResultSchema = CreateLabResultSchema.partial();