/**
 * 🏥 ALTA - Asistente Médica de Anamnesis
 * Desarrollada por Dr. Eduardo Marques (Medicina-UBA)
 *
 * Tipos y definiciones para el sistema Alta
 */

import type { Anamnesis as Medical } from '@altamedica/types/medical';
import { z } from 'zod';

// Estados de Alta
export type AltaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'analyzing' | 'alert';

// Emociones del avatar
export type AltaEmotion = 'neutral' | 'empathetic' | 'concerned' | 'happy' | 'focused' | 'urgent' | 'friendly' | 'caring' | 'supportive';

// Configuración de Alta
export interface AltaConfig {
  // Identificación
  name: string;
  version: string;
  developer: string;
  credentials: string;

  // Avatar 3D
  avatarModel: string; // Path al archivo .glb
  avatarScale: number;
  avatarPosition: [number, number, number];

  // Personalidad
  personality: {
    role: string;
    tone: 'profesional' | 'amigable' | 'empática';
    language: 'es-AR' | 'es-ES' | 'en-US';
    specialties: string[];
  };

  // Capacidades
  features: {
    voiceEnabled: boolean;
    videoEnabled: boolean;
    emotionDetection: boolean;
    urgencyDetection: boolean;
    adaptiveQuestioning: boolean;
    medicalValidation: boolean;
    multilingualSupport: boolean;
  };

  // Configuración médica
  medical: {
    protocolBase: 'alvarez' | 'harrison' | 'cecil';
    specialtyFocus?: string;
    urgencyThreshold: number;
    validationLevel: 'basic' | 'intermediate' | 'strict';
  };
}

// Contexto de conversación
export interface AltaConversationContext {
  sessionId: string;
  patientId: string;
  startTime: Date;
  currentSection: Medical.CategoriaAnamnesis;
  completedSections: Medical.CategoriaAnamnesis[];
  responses: AltaResponse[];
  alerts: Medical.MedicalAlert[];
  urgencyLevel: Medical.UrgencyLevel;
  confidence: number;
  language: string;
  chiefComplaint?: string;
  topics: string[];
  suggestedQuestions?: string[];
  patientAge?: number;
  patientGender?: string;
}

// Respuesta de Alta
export interface AltaResponse {
  id: string;
  timestamp: Date;
  speaker: 'alta' | 'patient';
  content: string;
  intent?: string;
  entities?: Record<string, any>;
  emotion?: AltaEmotion;
  medicalData?: {
    symptoms?: string[];
    medications?: string[];
    allergies?: string[];
    conditions?: string[];
    vitalSigns?: Record<string, number>;
  };
  analysis?: Partial<Medical.ClinicalAnalysis>;
}

// Mensaje de Alta
export interface AltaMessage {
  id?: string;
  text: string;
  sender?: 'alta' | 'patient';
  timestamp?: Date;
  emotion: AltaEmotion;
  animation?: string;
  audio?: string; // URL o base64 del audio TTS
  suggestions?: string[]; // Respuestas sugeridas para el usuario
  attachments?: AltaAttachment[];
  metadata?: {
    confidence: number;
    source: string;
    references?: string[];
    processingTime?: number;
    aiModel?: string;
    urgencyScore?: number;
    entities?: any;
    insights?: any[];
  };
}

// Adjuntos
export interface AltaAttachment {
  type: 'image' | 'document' | 'video' | 'chart' | 'differential-diagnosis';
  url?: string;
  content?: string;
  mimeType?: string;
  title?: string;
  description?: string;
}

// Medical document type (for GenSpark generation)
export interface MedicalDocument {
  id: string;
  type: 'anamnesis' | 'clinical-summary' | 'referral' | 'prescription';
  content: string;
  format: string;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    patientId: string;
    sessionId?: string;
  };
}

// Análisis de síntomas
export interface AltaSymptomAnalysis {
  symptoms: Array<{
    name: string;
    severity: 'leve' | 'moderado' | 'severo';
    duration: string;
    characteristics: string[];
  }>;
  possibleConditions: Array<{
    condition: string;
    probability: number;
    urgency: Medical.UrgencyLevel;
    specialtyRequired: string;
  }>;
  redFlags: string[];
  recommendedActions: string[];
  triageLevel: 1 | 2 | 3 | 4 | 5; // ESI (Emergency Severity Index)
}

// Estado del avatar 3D
export interface AltaAvatarState {
  isLoaded: boolean;
  currentAnimation: string;
  currentEmotion: AltaEmotion;
  isSpeaking: boolean;
  lipSyncData?: Float32Array;
  blinkRate: number;
  headPosition: [number, number, number];
  eyeTarget: [number, number, number];
}

// Eventos de Alta
export type AltaEventType =
  | 'session.start'
  | 'session.end'
  | 'message.received'
  | 'message.sent'
  | 'section.completed'
  | 'urgency.detected'
  | 'error.occurred'
  | 'avatar.loaded'
  | 'voice.start'
  | 'voice.end';

export interface AltaEvent {
  type: AltaEventType;
  timestamp: Date;
  data?: any;
}

// Schemas de validación con Zod
export const AltaConfigSchema = z.object({
  name: z.string().default('Alta'),
  version: z.string().default('1.0.0'),
  developer: z.string().default('Dr. Eduardo Marques'),
  credentials: z.string().default('Medicina-UBA'),
  avatarModel: z.string(),
  avatarScale: z.number().default(1),
  avatarPosition: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  personality: z.object({
    role: z.string().default('Asistente Médica'),
    tone: z.enum(['profesional', 'amigable', 'empática']).default('empática'),
    language: z.enum(['es-AR', 'es-ES', 'en-US']).default('es-AR'),
    specialties: z.array(z.string()).default(['medicina-general']),
  }),
  features: z.object({
    voiceEnabled: z.boolean().default(true),
    videoEnabled: z.boolean().default(true),
    emotionDetection: z.boolean().default(true),
    urgencyDetection: z.boolean().default(true),
    adaptiveQuestioning: z.boolean().default(true),
    medicalValidation: z.boolean().default(true),
    multilingualSupport: z.boolean().default(false),
  }),
  medical: z.object({
    protocolBase: z.enum(['alvarez', 'harrison', 'cecil']).default('alvarez'),
    specialtyFocus: z.string().optional(),
    urgencyThreshold: z.number().default(0.7),
    validationLevel: z.enum(['basic', 'intermediate', 'strict']).default('intermediate'),
  }),
});

// Tipo inferido del schema
export type ValidatedAltaConfig = z.infer<typeof AltaConfigSchema>;

// Prompts base de Alta
export const ALTA_PROMPTS = {
  greeting: `Hola, soy Alta, tu asistente médica virtual. Fui desarrollada por el Dr. Eduardo Marques de la UBA para ayudarte con tu historia clínica. ¿Cómo te sentís hoy?`,

  empathy: {
    pain: 'Entiendo que estés sintiendo dolor. Vamos a explorar esto juntos para poder ayudarte mejor.',
    worry: 'Es completamente normal sentirse preocupado. Estoy acá para escucharte y orientarte.',
    confusion: 'No te preocupes si no sabés cómo describirlo. Podemos ir paso a paso.',
  },

  sections: {
    identification:
      'Primero necesito conocerte un poco mejor. ¿Podrías decirme tu nombre completo?',
    chiefComplaint: '¿Qué es lo que te trae por acá hoy? Contame con tus propias palabras.',
    currentIllness: 'Hablemos más sobre lo que estás sintiendo. ¿Cuándo comenzaron estos síntomas?',
    medicalHistory: '¿Tenés alguna condición médica previa que deba conocer?',
    familyHistory: '¿Hay antecedentes médicos importantes en tu familia?',
    medications: '¿Estás tomando algún medicamento actualmente?',
    allergies: '¿Sos alérgico a algún medicamento o sustancia?',
  },

  urgency: {
    emergency:
      '⚠️ Detecté síntomas que requieren atención inmediata. Por favor, dirigite al servicio de emergencias más cercano o llamá al 107.',
    urgent:
      'Estos síntomas necesitan evaluación médica pronta. Te recomiendo agendar una consulta lo antes posible.',
    routine: 'Basándome en lo que me contaste, podés agendar una consulta de rutina con tu médico.',
  },

  clarification: {
    duration: '¿Hace cuánto tiempo que tenés estos síntomas? ¿Días, semanas, meses?',
    intensity: 'En una escala del 1 al 10, ¿qué tan intenso es?',
    frequency: '¿Es constante o va y viene? ¿Con qué frecuencia?',
    triggers: '¿Notaste algo que lo mejore o empeore?',
    associated: '¿Hay algún otro síntoma que aparezca junto con este?',
  },

  closing: {
    complete:
      'Excelente, ya tengo toda la información necesaria. Estoy preparando tu resumen médico.',
    partial: 'Guardé tu progreso. Podemos continuar cuando quieras.',
    emergency: 'Recordá buscar atención médica inmediata. Tu salud es lo más importante.',
  },
};

// Configuración por defecto
export const DEFAULT_ALTA_CONFIG: AltaConfig = {
  name: 'Alta',
  version: '1.0.0',
  developer: 'Dr. Eduardo Marques',
  credentials: 'Medicina-UBA',
  avatarModel: '/models/alta-avatar.glb',
  avatarScale: 1,
  avatarPosition: [0, 0, 0],
  personality: {
    role: 'Asistente Médica de Anamnesis',
    tone: 'empática',
    language: 'es-AR',
    specialties: ['medicina-general', 'medicina-interna'],
  },
  features: {
    voiceEnabled: true,
    videoEnabled: true,
    emotionDetection: true,
    urgencyDetection: true,
    adaptiveQuestioning: true,
    medicalValidation: true,
    multilingualSupport: false,
  },
  medical: {
    protocolBase: 'alvarez',
    urgencyThreshold: 0.7,
    validationLevel: 'intermediate',
  },
};
