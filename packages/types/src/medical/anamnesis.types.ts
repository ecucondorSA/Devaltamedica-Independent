/**
 * 🏥 ANAMNESIS TYPES - ALTAMEDICA
 * Definiciones de tipos para el sistema de anamnesis médica
 * Incluye gamificación y análisis clínico
 */

import { z } from 'zod';

// Enums y tipos básicos
export type TipoPregunta =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'date'
  | 'boolean'
  | 'seccion';
export type RarezaLogro = 'comun' | 'raro' | 'epico' | 'legendario';
export type UrgencyLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
export type AlertType = 'info' | 'warning' | 'danger' | 'success';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type ValidationSeverity = 'normal' | 'warning' | 'critical';

export type CategoriaAnamnesis =
  | 'DATOS_PERSONALES'
  | 'MOTIVO_CONSULTA'
  | 'ENFERMEDAD_ACTUAL'
  | 'ANTECEDENTES_PERSONALES'
  | 'ANTECEDENTES_FAMILIARES'
  | 'REVISION_SISTEMAS'
  | 'HABITOS'
  | 'ALERGIA_MEDICAMENTOS';

// Interfaces principales
export interface HistoriaMedica {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  datosCuriosos?: string[];
}

export interface LogroAnamnesis {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  puntosRequeridos: number;
  desbloqueado: boolean;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  puntos: number;
  rareza: RarezaLogro;
  condicionDesbloqueo?: string;
}

export interface PreguntaAnamnesis {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: string[];
  historiaPreliminar?: HistoriaMedica;
  explicacionMedica?: string;
  puntosGamificacion: number;
  categoria: CategoriaAnamnesis;
  validacion?: (valor: any) => boolean | string;
  requerida?: boolean;
  orden?: number;
}

export interface RespuestaAnamnesis {
  preguntaId: string;
  respuesta: any;
  puntos: number;
  tiempoRespuesta: number;
  logros: string[];
  contexto: CategoriaAnamnesis;
  timestamp?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  alerts: string[];
  severity: ValidationSeverity;
}

export interface MedicalAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  timestamp?: Date;
  dismissed?: boolean;
}

// Interface ClinicalAnalysis basada en el schema Zod
export interface ClinicalAnalysis {
  urgency: UrgencyLevel;
  alerts: MedicalAlert[];
  differentialDiagnosis: string[];
  recommendations: string[];
  riskFactors: string[];
  followUpNeeded: boolean;
  confidence: number;
  vitalSigns?: import('./clinical/appointment.types').VitalSigns;
  estimatedWaitTime?: number;
}

export interface SeccionAnamnesis {
  id: string;
  titulo: string;
  descripcion: string;
  preguntas: PreguntaAnamnesis[];
  historia: HistoriaMedica;
  logrosDesbloqueables: Logro[];
  orden: number;
  puntosSeccion: number;
}

export interface ProgresoAnamnesis {
  seccionActual: number;
  preguntaActual: number;
  respuestas: Record<string, RespuestaAnamnesis>;
  puntosAcumulados: number;
  logrosObtenidos: string[];
  tiempoTotal: number;
  nivelCompletitud: number;
  completada?: boolean;
  fechaCompletado?: Date;
}

export interface EscenaAnamnesis {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  secciones: string[];
  orden: number;
  puntosEscena: number;
}

export interface NivelGamificacion {
  nivel: number;
  puntosRequeridos: number;
  titulo: string;
  descripcion: string;
  icono: string;
  recompensas: string[];
}

export interface EstadisticasAnamnesis {
  totalPreguntas: number;
  preguntasRespondidas: number;
  porcentajeCompletitud: number;
  tiempoPromedioPorPregunta: number;
  puntosPorCategoria: Record<CategoriaAnamnesis, number>;
  logrosDesbloqueados: number;
  nivelActual: number;
  proximoNivel: number;
}

export interface ResumenMedico {
  datosPaciente: {
    nombre: string;
    edad: number;
    sexo: string;
    ocupacion?: string;
  };
  motivoConsulta: string;
  enfermedadActual: string[];
  antecedentesPersonales: string[];
  antecedentesFamiliares: string[];
  revisionSistemas: Record<string, string>;
  impresionDiagnostica: string[];
  recomendaciones: string[];
  fechaGeneracion: Date;
}

// Zod Schemas para validación
export const VitalSignsSchema = z.object({
  systolic: z.number().min(0).max(300),
  diastolic: z.number().min(0).max(200),
  heartRate: z.number().min(0).max(300),
  temperature: z.number().min(30).max(45),
  spO2: z.number().min(0).max(100),
  respiratoryRate: z.number().min(0).max(100),
  painLevel: z.number().min(0).max(10),
});

export const MedicalAlertSchema = z.object({
  id: z.string(),
  type: z.enum(['info', 'warning', 'danger', 'success']),
  title: z.string(),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.date().optional(),
  dismissed: z.boolean().optional(),
});

export const ClinicalAnalysisSchema = z.object({
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  alerts: z.array(MedicalAlertSchema),
  differentialDiagnosis: z.array(z.string()),
  recommendations: z.array(z.string()),
  riskFactors: z.array(z.string()),
  followUpNeeded: z.boolean(),
  confidence: z.number().min(0).max(100),
  vitalSigns: VitalSignsSchema.optional(),
  estimatedWaitTime: z.number().optional(),
});

export const RespuestaAnamnesisSchema = z.object({
  preguntaId: z.string(),
  respuesta: z.any(),
  puntos: z.number(),
  tiempoRespuesta: z.number(),
  logros: z.array(z.string()),
  contexto: z.enum([
    'DATOS_PERSONALES',
    'MOTIVO_CONSULTA',
    'ENFERMEDAD_ACTUAL',
    'ANTECEDENTES_PERSONALES',
    'ANTECEDENTES_FAMILIARES',
    'REVISION_SISTEMAS',
    'HABITOS',
    'ALERGIA_MEDICAMENTOS',
  ]),
  timestamp: z.date().optional(),
});

export const ResumenMedicoSchema = z.object({
  datosPaciente: z.object({
    nombre: z.string(),
    edad: z.number(),
    sexo: z.string(),
    ocupacion: z.string().optional(),
  }),
  motivoConsulta: z.string(),
  enfermedadActual: z.array(z.string()),
  antecedentesPersonales: z.array(z.string()),
  antecedentesFamiliares: z.array(z.string()),
  revisionSistemas: z.record(z.string()),
  impresionDiagnostica: z.array(z.string()),
  recomendaciones: z.array(z.string()),
  fechaGeneracion: z.date(),
});
