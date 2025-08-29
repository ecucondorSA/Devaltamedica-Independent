/**
 * 🏥 SERVICIO DE TRIAJE MÉDICO CON IA
 * 
 * Evaluación inteligente de síntomas 24/7 para determinar urgencia
 * y recomendar acciones apropiadas al paciente
 */

import { z } from 'zod';

import { logger } from '@altamedica/shared';
// Esquemas de validación
export const SymptomSchema = z.object({
  name: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  duration: z.string(),
  location: z.string().optional(),
  characteristics: z.array(z.string()).optional(),
});

export const TriageResultSchema = z.object({
  urgencyLevel: z.enum(['emergency', 'urgent', 'semi-urgent', 'routine']),
  recommendedAction: z.string(),
  estimatedWaitTime: z.string(),
  suggestedSpecialty: z.string().optional(),
  redFlags: z.array(z.string()),
  instructions: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export type Symptom = z.infer<typeof SymptomSchema>;
export type TriageResult = z.infer<typeof TriageResultSchema>;

// Enumeraciones médicas
export enum UrgencyLevel {
  EMERGENCY = 'emergency',     // Requiere atención inmediata
  URGENT = 'urgent',           // Dentro de 2 horas
  SEMI_URGENT = 'semi-urgent', // Dentro de 24 horas
  ROUTINE = 'routine'          // Puede esperar días
}

// Base de conocimiento médico (simplificada para POC)
const EMERGENCY_SYMPTOMS = [
  'dolor en el pecho', 'dificultad para respirar', 'pérdida de consciencia',
  'sangrado abundante', 'dolor de cabeza severo súbito', 'parálisis',
  'convulsiones', 'dolor abdominal severo', 'vómitos con sangre'
];

const URGENT_SYMPTOMS = [
  'fiebre alta', 'dolor moderado persistente', 'vómitos repetidos',
  'mareos severos', 'herida profunda', 'reacción alérgica',
  'dolor al orinar con fiebre', 'dolor de oído severo'
];

const SPECIALTY_MAPPING: Record<string, string[]> = {
  cardiología: ['dolor en el pecho', 'palpitaciones', 'presión alta', 'arritmia'],
  neurología: ['dolor de cabeza', 'mareos', 'hormigueo', 'pérdida de memoria'],
  gastroenterología: ['dolor abdominal', 'náuseas', 'diarrea', 'acidez'],
  traumatología: ['dolor articular', 'lesión', 'fractura', 'esguince'],
  dermatología: ['sarpullido', 'picazón', 'manchas en la piel', 'acné'],
  pediatría: ['fiebre en niños', 'tos en niños', 'irritabilidad', 'rechazo al alimento'],
};

export class TriageAgentService {
  private static instance: TriageAgentService;
  
  private constructor() {}
  
  static getInstance(): TriageAgentService {
    if (!TriageAgentService.instance) {
      TriageAgentService.instance = new TriageAgentService();
    }
    return TriageAgentService.instance;
  }

  /**
   * Evalúa síntomas y determina nivel de urgencia
   */
  async evaluateSymptoms(symptoms: Symptom[]): Promise<TriageResult> {
    try {
      // Simular procesamiento de IA (en producción, llamaría a Manus/GPT)
      await this.simulateAIProcessing();
      
      // Análisis de urgencia
      const urgencyLevel = this.determineUrgencyLevel(symptoms);
      const specialty = this.suggestSpecialty(symptoms);
      const redFlags = this.identifyRedFlags(symptoms);
      
      // Generar recomendaciones
      const result: TriageResult = {
        urgencyLevel,
        recommendedAction: this.getRecommendedAction(urgencyLevel),
        estimatedWaitTime: this.getEstimatedWaitTime(urgencyLevel),
        suggestedSpecialty: specialty,
        redFlags,
        instructions: this.getInstructions(urgencyLevel, symptoms),
        confidence: this.calculateConfidence(symptoms),
      };
      
      return TriageResultSchema.parse(result);
    } catch (error) {
      logger.error('Error en evaluación de triaje:', String(error));
      throw new Error('No se pudo completar la evaluación de triaje');
    }
  }

  /**
   * Determina el nivel de urgencia basado en síntomas
   */
  private determineUrgencyLevel(symptoms: Symptom[]): UrgencyLevel {
    const symptomTexts = symptoms.map(s => s.name.toLowerCase());
    
    // Check emergency symptoms
    if (symptomTexts.some(s => EMERGENCY_SYMPTOMS.some(es => s.includes(es)))) {
      return UrgencyLevel.EMERGENCY;
    }
    
    // Check urgent symptoms
    if (symptomTexts.some(s => URGENT_SYMPTOMS.some(us => s.includes(us)))) {
      return UrgencyLevel.URGENT;
    }
    
    // Check severity
    const hasSevere = symptoms.some(s => s.severity === 'severe');
    if (hasSevere) {
      return UrgencyLevel.URGENT;
    }
    
    const hasModerate = symptoms.some(s => s.severity === 'moderate');
    if (hasModerate) {
      return UrgencyLevel.SEMI_URGENT;
    }
    
    return UrgencyLevel.ROUTINE;
  }

  /**
   * Sugiere especialidad médica apropiada
   */
  private suggestSpecialty(symptoms: Symptom[]): string {
    const symptomTexts = symptoms.map(s => s.name.toLowerCase());
    
    for (const [specialty, keywords] of Object.entries(SPECIALTY_MAPPING)) {
      if (symptomTexts.some(s => keywords.some(k => s.includes(k)))) {
        return specialty;
      }
    }
    
    return 'medicina general';
  }

  /**
   * Identifica señales de alarma
   */
  private identifyRedFlags(symptoms: Symptom[]): string[] {
    const redFlags: string[] = [];
    
    symptoms.forEach(symptom => {
      if (symptom.severity === 'severe') {
        redFlags.push(`${symptom.name} severo`);
      }
      
      if (symptom.duration && symptom.duration.includes('súbito')) {
        redFlags.push(`Inicio súbito de ${symptom.name}`);
      }
      
      // Agregar más lógica de red flags
      const emergencyKeywords = ['sangre', 'pérdida', 'intenso', 'agudo'];
      if (emergencyKeywords.some(k => symptom.name.toLowerCase().includes(k))) {
        redFlags.push(symptom.name);
      }
    });
    
    return redFlags;
  }

  /**
   * Obtiene acción recomendada según urgencia
   */
  private getRecommendedAction(urgencyLevel: UrgencyLevel): string {
    const actions: Record<UrgencyLevel, string> = {
      [UrgencyLevel.EMERGENCY]: '🚨 Llamar al 911 o ir a emergencias INMEDIATAMENTE',
      [UrgencyLevel.URGENT]: '⚠️ Visitar urgencias o clínica en las próximas 2 horas',
      [UrgencyLevel.SEMI_URGENT]: '📅 Agendar cita para hoy o mañana',
      [UrgencyLevel.ROUTINE]: '📋 Agendar cita de rutina en los próximos días',
    };
    
    return actions[urgencyLevel];
  }

  /**
   * Estima tiempo de espera
   */
  private getEstimatedWaitTime(urgencyLevel: UrgencyLevel): string {
    const waitTimes: Record<UrgencyLevel, string> = {
      [UrgencyLevel.EMERGENCY]: 'Atención inmediata',
      [UrgencyLevel.URGENT]: '15-30 minutos',
      [UrgencyLevel.SEMI_URGENT]: '2-4 horas',
      [UrgencyLevel.ROUTINE]: '1-3 días',
    };
    
    return waitTimes[urgencyLevel];
  }

  /**
   * Genera instrucciones para el paciente
   */
  private getInstructions(urgencyLevel: UrgencyLevel, symptoms: Symptom[]): string[] {
    const instructions: string[] = [];
    
    // Instrucciones generales por urgencia
    if (urgencyLevel === UrgencyLevel.EMERGENCY) {
      instructions.push('No conducir - llamar ambulancia si es necesario');
      instructions.push('Llevar lista de medicamentos actuales');
      instructions.push('Contactar a un familiar o amigo');
    } else if (urgencyLevel === UrgencyLevel.URGENT) {
      instructions.push('Preparar historial médico reciente');
      instructions.push('Llevar identificación y seguro médico');
      instructions.push('Evitar comer o beber hasta ser evaluado');
    } else {
      instructions.push('Monitorear síntomas y anotar cambios');
      instructions.push('Tomar medicación habitual según prescripción');
      instructions.push('Descansar y mantenerse hidratado');
    }
    
    // Instrucciones específicas por síntomas
    const hasFebre = symptoms.some(s => s.name.toLowerCase().includes('fiebre'));
    if (hasFebre) {
      instructions.push('Tomar temperatura cada 4 horas');
      instructions.push('Usar paracetamol según indicaciones del envase');
    }
    
    const hasDolor = symptoms.some(s => s.name.toLowerCase().includes('dolor'));
    if (hasDolor) {
      instructions.push('Evitar esfuerzos físicos');
      instructions.push('Aplicar frío o calor según alivie');
    }
    
    return instructions;
  }

  /**
   * Calcula confianza en la evaluación
   */
  private calculateConfidence(symptoms: Symptom[]): number {
    // Factores que aumentan confianza
    let confidence = 50; // Base
    
    // Más síntomas = más confianza
    confidence += Math.min(symptoms.length * 5, 20);
    
    // Síntomas claros aumentan confianza
    const hasSpecificSymptoms = symptoms.some(s => 
      EMERGENCY_SYMPTOMS.includes(s.name.toLowerCase()) ||
      URGENT_SYMPTOMS.includes(s.name.toLowerCase())
    );
    if (hasSpecificSymptoms) confidence += 20;
    
    // Severidad clara aumenta confianza
    const hasClearSeverity = symptoms.every(s => s.severity);
    if (hasClearSeverity) confidence += 10;
    
    return Math.min(confidence, 95); // Máximo 95% para mantener humildad médica
  }

  /**
   * Simula procesamiento de IA (para POC)
   */
  private async simulateAIProcessing(): Promise<void> {
    // Simular latencia de procesamiento
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Genera preguntas de seguimiento para refinar triaje
   */
  async generateFollowUpQuestions(symptoms: Symptom[]): Promise<string[]> {
    const questions: string[] = [];
    
    // Preguntas basadas en síntomas
    symptoms.forEach(symptom => {
      if (symptom.name.toLowerCase().includes('dolor')) {
        questions.push('¿El dolor empeora con el movimiento?');
        questions.push('¿Hay algo que alivie el dolor?');
        questions.push('En una escala del 1 al 10, ¿qué tan intenso es el dolor?');
      }
      
      if (symptom.name.toLowerCase().includes('fiebre')) {
        questions.push('¿Cuánto marca el termómetro?');
        questions.push('¿Tiene escalofríos o sudoración?');
        questions.push('¿Ha tomado algún antipirético?');
      }
      
      if (symptom.severity === 'severe') {
        questions.push('¿Es la primera vez que experimenta este síntoma?');
        questions.push('¿Ha empeorado en las últimas horas?');
      }
    });
    
    // Preguntas generales importantes
    questions.push('¿Tiene alguna condición médica preexistente?');
    questions.push('¿Está tomando algún medicamento actualmente?');
    questions.push('¿Es alérgico a algún medicamento?');
    
    // Limitar a 5 preguntas más relevantes
    return questions.slice(0, 5);
  }

  /**
   * Registra evaluación para auditoría y mejora continua
   */
  async logTriageEvaluation(
    patientId: string,
    symptoms: Symptom[],
    result: TriageResult
  ): Promise<void> {
    try {
      // En producción, esto iría a una base de datos
      logger.info('Triaje registrado:', {
        timestamp: new Date().toISOString(),
        patientId,
        symptoms,
        result,
        // Cumplimiento HIPAA
        auditTrail: {
          action: 'TRIAGE_EVALUATION',
          resource: 'patient_symptoms',
          outcome: result.urgencyLevel,
        }
      });
    } catch (error) {
      logger.error('Error al registrar triaje:', String(error));
      // No fallar la operación principal por error de logging
    }
  }
}

// Exportar instancia singleton
export const triageAgent = TriageAgentService.getInstance();