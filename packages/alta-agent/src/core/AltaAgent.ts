/**
 * 🏥 ALTA AGENT - Core Intelligence
 * Asistente Médica de Anamnesis con IA
 * Desarrollada por Dr. Eduardo Marques (Medicina-UBA)
 */

import type { Anamnesis as Medical } from '@altamedica/types/medical';
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import type {
  AltaConfig,
  AltaConversationContext,
  AltaEmotion,
  AltaMessage,
  AltaResponse,
  AltaState,
} from '../types/alta.types';
import { ALTA_PROMPTS, DEFAULT_ALTA_CONFIG } from '../types/alta.types';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// TODO: Mover SECCIONES_ANAMNESIS a @altamedica/types o crear un paquete separado
// Stub temporal para permitir el build
const SECCIONES_ANAMNESIS = {
  DATOS_PERSONALES: 'datos_personales',
  SINTOMAS_PRINCIPALES: 'sintomas_principales',
  HISTORIA_CLINICA: 'historia_clinica',
  MEDICAMENTOS: 'medicamentos',
  ALERGIAS: 'alergias',
  HABITOS: 'habitos',
  EXAMEN_FISICO: 'examen_fisico',
  DIAGNOSTICO: 'diagnostico',
  TRATAMIENTO: 'tratamiento',
};

export class AltaAgent extends EventEmitter {
  protected config: AltaConfig;
  protected state: AltaState;
  protected emotion: AltaEmotion;
  protected context: AltaConversationContext | null;
  private openai: OpenAI | null = null;
  protected conversationHistory: AltaResponse[];
  private medicalKnowledgeBase: any;

  constructor(config: Partial<AltaConfig> = {}) {
    super();

    // Configuración inicial
    this.config = { ...DEFAULT_ALTA_CONFIG, ...config };
    this.state = 'idle';
    this.emotion = 'neutral';
    this.context = null;
    this.conversationHistory = [];

    // Inicializar OpenAI si hay API key
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Solo para desarrollo
      });
    }

    // Cargar base de conocimiento médico (Álvarez)
    this.medicalKnowledgeBase = SECCIONES_ANAMNESIS;

    // Log de inicialización
    logger.info(`🏥 Alta Agent v${this.config.version} iniciada`);
    logger.info(`👨‍⚕️ Desarrollada por ${this.config.developer} (${this.config.credentials})`);
  }

  /**
   * Iniciar sesión de anamnesis
   */
  async startSession(patientId: string, language: string = 'es-AR'): Promise<AltaMessage> {
    this.setState('thinking');

    // Crear contexto de conversación
    this.context = {
      sessionId: this.generateSessionId(),
      patientId,
      startTime: new Date(),
      currentSection: 'DATOS_PERSONALES',
      completedSections: [],
      responses: [],
      alerts: [],
      urgencyLevel: 'ROUTINE',
      confidence: 1.0,
      language,
      topics: [],
    };

    // Emitir evento de inicio
    const ctx = this.context as NonNullable<typeof this.context>;
    this.emit('session.start', { sessionId: ctx.sessionId, patientId });

    // Cambiar estado y emoción
    this.setState('speaking');
    this.setEmotion('happy');

    // Mensaje de bienvenida
    const greeting: AltaMessage = {
      text: ALTA_PROMPTS.greeting,
      emotion: 'happy',
      animation: 'wave',
      suggestions: [
        'Me siento bien',
        'Tengo algunos síntomas',
        'Necesito renovar recetas',
        'Consulta de control',
      ],
    };

    // Guardar en historial
    this.addToHistory('alta', greeting.text);

    return greeting;
  }

  /**
   * Procesar mensaje del paciente
   */
  async processMessage(message: string): Promise<AltaMessage> {
    if (!this.context) {
      throw new Error('No hay sesión activa. Llame a startSession primero.');
    }

    this.setState('listening');

    // Agregar mensaje del paciente al historial
    this.addToHistory('patient', message);

    // Análisis del mensaje
    this.setState('thinking');
    const analysis = await this.analyzeMessage(message);

    // Detectar urgencias
    if (analysis.urgency !== 'ROUTINE') {
      await this.handleUrgency(analysis);
    }

    // Extraer información médica
    const medicalData = this.extractMedicalInfo(message);

    // Generar respuesta contextual
    const response = await this.generateResponse(message, analysis, medicalData);

    // Actualizar estado y emoción
    this.setState('speaking');
    this.setEmotion(this.determineEmotion(analysis));

    // Agregar respuesta al historial
    this.addToHistory('alta', response.text, {
      analysis,
      medicalData,
    });

    // Emitir evento
    this.emit('message.sent', response);

    return response;
  }

  /**
   * Analizar mensaje para detectar información médica relevante
   */
  private async analyzeMessage(message: string): Promise<Partial<Medical.ClinicalAnalysis>> {
    // Análisis básico sin IA (para funcionar sin OpenAI)
    const urgencyKeywords = {
      EMERGENCY: ['dolor pecho', 'no puedo respirar', 'sangrado', 'desmayo', 'convulsión'],
      URGENT: ['fiebre alta', 'dolor intenso', 'vómitos', 'mareos', 'dolor cabeza fuerte'],
      ROUTINE: ['control', 'chequeo', 'renovar receta', 'consulta'],
    };

    let urgency: Medical.UrgencyLevel = 'ROUTINE';
    const alerts: Medical.MedicalAlert[] = [];

    // Detectar urgencia por palabras clave
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some((kw) => message.toLowerCase().includes(kw))) {
        urgency = level as Medical.UrgencyLevel;
        if (level === 'EMERGENCY') {
          alerts.push({
            id: this.generateId(),
            type: 'danger',
            title: 'Urgencia Médica Detectada',
            message: 'Se detectaron síntomas que requieren atención inmediata',
            priority: 'critical',
          });
        }
        break;
      }
    }

    // Si tenemos OpenAI, hacer análisis más profundo
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Eres Alta, una asistente médica experta en anamnesis. 
                       Analiza el siguiente mensaje del paciente y extrae:
                       1. Nivel de urgencia (ROUTINE, URGENT, EMERGENCY)
                       2. Síntomas mencionados
                       3. Posibles diagnósticos diferenciales
                       4. Recomendaciones
                       Responde en formato JSON.`,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const aiAnalysis = JSON.parse(completion.choices[0].message.content || '{}');

        return {
          urgency: aiAnalysis.urgency || urgency,
          alerts: [...alerts, ...(aiAnalysis.alerts || [])],
          differentialDiagnosis: aiAnalysis.differentialDiagnosis || [],
          recommendations: aiAnalysis.recommendations || [],
          riskFactors: aiAnalysis.riskFactors || [],
          followUpNeeded: aiAnalysis.followUpNeeded || false,
          confidence: aiAnalysis.confidence || 0.8,
        };
      } catch (error) {
        logger.error('Error en análisis con OpenAI:', error);
      }
    }

    // Retornar análisis básico
    return {
      urgency,
      alerts,
      differentialDiagnosis: [],
      recommendations: this.getBasicRecommendations(urgency),
      riskFactors: [],
      followUpNeeded: urgency !== 'ROUTINE',
      confidence: 0.7,
    };
  }

  /**
   * Extraer información médica del mensaje
   */
  private extractMedicalInfo(message: string): any {
    const medicalData: any = {
      symptoms: [],
      medications: [],
      allergies: [],
      conditions: [],
    };

    // Patrones para detectar información médica
    const patterns = {
      symptoms: /dolor|fiebre|tos|náuseas|mareo|cansancio|fatiga/gi,
      medications: /paracetamol|ibuprofeno|aspirina|antibiótico|medicamento/gi,
      allergies: /alergia|alérgico/gi,
      conditions: /diabetes|hipertensión|asma|artritis/gi,
    };

    // Extraer síntomas
    const symptomMatches = message.match(patterns.symptoms);
    if (symptomMatches) {
      medicalData.symptoms = [...new Set(symptomMatches.map((s) => s.toLowerCase()))];
    }

    // Extraer medicamentos
    const medMatches = message.match(patterns.medications);
    if (medMatches) {
      medicalData.medications = [...new Set(medMatches.map((m) => m.toLowerCase()))];
    }

    return medicalData;
  }

  /**
   * Generar respuesta basada en el contexto
   */
  private async generateResponse(
    message: string,
    analysis: Partial<Medical.ClinicalAnalysis>,
    medicalData: any,
  ): Promise<AltaMessage> {
    let responseText = '';
    let suggestions: string[] = [];
    let emotion: AltaEmotion = 'neutral';

    // Respuesta según urgencia
    if (analysis.urgency === 'EMERGENCY') {
      responseText = ALTA_PROMPTS.urgency.emergency;
      emotion = 'urgent';
      suggestions = ['Llamar al 107', 'Ir a emergencias', 'Contactar médico de cabecera'];
    } else if (analysis.urgency === 'URGENT') {
      responseText = ALTA_PROMPTS.urgency.urgent;
      emotion = 'concerned';
      suggestions = [
        'Agendar consulta urgente',
        'Describir más síntomas',
        'Ver disponibilidad hoy',
      ];
    } else {
      // Continuar con la anamnesis normal
      responseText = this.getNextQuestion();
      emotion = 'empathetic';
      suggestions = this.getCurrentSuggestions();
    }

    // Si hay síntomas detectados, hacer preguntas de seguimiento
    if (medicalData.symptoms.length > 0) {
      const symptom = medicalData.symptoms[0];
      responseText = `Entiendo que tenés ${symptom}. ${ALTA_PROMPTS.clarification.duration}`;
      suggestions = ['Hoy', 'Hace unos días', 'Hace una semana', 'Más de un mes'];
    }

    return {
      text: responseText,
      emotion,
      animation: this.getAnimationForEmotion(emotion),
      suggestions,
      metadata: {
        confidence: analysis.confidence || 0.8,
        source: 'alta-medical-knowledge',
      },
    };
  }

  /**
   * Obtener siguiente pregunta según la sección actual
   */
  private getNextQuestion(): string {
    if (!this.context) return ALTA_PROMPTS.greeting;

    const section = this.context.currentSection;
    const prompts = ALTA_PROMPTS.sections;

    switch (section) {
      case 'DATOS_PERSONALES':
        return prompts.identification;
      case 'MOTIVO_CONSULTA':
        return prompts.chiefComplaint;
      case 'ENFERMEDAD_ACTUAL':
        return prompts.currentIllness;
      case 'ANTECEDENTES_PERSONALES':
        return prompts.medicalHistory;
      case 'ANTECEDENTES_FAMILIARES':
        return prompts.familyHistory;
      default:
        return prompts.chiefComplaint;
    }
  }

  /**
   * Obtener sugerencias para la sección actual
   */
  private getCurrentSuggestions(): string[] {
    if (!this.context) return [];

    const section = this.context.currentSection;

    const suggestionMap: Record<string, string[]> = {
      DATOS_PERSONALES: ['Siguiente', 'Saltar esta sección'],
      MOTIVO_CONSULTA: ['Dolor', 'Malestar general', 'Control', 'Renovar recetas'],
      ENFERMEDAD_ACTUAL: ['Hoy', 'Ayer', 'Hace una semana', 'Hace un mes'],
      ANTECEDENTES_PERSONALES: ['Sí', 'No', 'No estoy seguro'],
      ANTECEDENTES_FAMILIARES: ['Diabetes', 'Hipertensión', 'Cáncer', 'Ninguno'],
    };

    return suggestionMap[section] || [];
  }

  /**
   * Manejar situaciones de urgencia
   */
  private async handleUrgency(analysis: Partial<Medical.ClinicalAnalysis>): Promise<void> {
    if (!this.context) return;

    // Actualizar contexto
    this.context.urgencyLevel = analysis.urgency || 'ROUTINE';
    this.context.alerts = [...this.context.alerts, ...(analysis.alerts || [])];

    // Emitir evento de urgencia
    this.emit('urgency.detected', {
      level: analysis.urgency,
      alerts: analysis.alerts,
      recommendations: analysis.recommendations,
    });

    // Log para auditoría
    logger.warn(`⚠️ Alta detectó urgencia: ${analysis.urgency}`);
    logger.warn('Alertas:', analysis.alerts);
  }

  /**
   * Determinar emoción basada en el análisis
   */
  private determineEmotion(analysis: Partial<Medical.ClinicalAnalysis>): AltaEmotion {
    if (analysis.urgency === 'EMERGENCY') return 'urgent';
    if (analysis.urgency === 'URGENT') return 'concerned';
    if (analysis.alerts && analysis.alerts.length > 0) return 'focused';
    return 'empathetic';
  }

  /**
   * Obtener animación para la emoción
   */
  private getAnimationForEmotion(emotion: AltaEmotion): string {
    const animationMap: Record<AltaEmotion, string> = {
      neutral: 'idle',
      empathetic: 'nod',
      concerned: 'tilt_head',
      happy: 'smile',
      focused: 'lean_forward',
      urgent: 'alert',
    };

    return animationMap[emotion] || 'idle';
  }

  /**
   * Obtener recomendaciones básicas
   */
  private getBasicRecommendations(urgency: Medical.UrgencyLevel): string[] {
    const recommendations: Record<Medical.UrgencyLevel, string[]> = {
      EMERGENCY: [
        'Buscar atención médica inmediata',
        'Llamar al servicio de emergencias (107)',
        'No automedicarse',
      ],
      URGENT: ['Agendar consulta médica pronto', 'Monitorear síntomas', 'Mantener reposo'],
      ROUTINE: [
        'Completar la anamnesis',
        'Agendar consulta de rutina',
        'Mantener hábitos saludables',
      ],
    };

    return recommendations[urgency] || recommendations.ROUTINE;
  }

  /**
   * Generar resumen de la anamnesis
   */
  async generateSummary(): Promise<string> {
    if (!this.context) {
      throw new Error('No hay sesión activa para generar resumen');
    }

    const summary = {
      pacienteId: this.context.patientId,
      fecha: new Date().toISOString(),
      duracion: this.getSessionDuration(),
      seccionesCompletadas: this.context.completedSections,
      urgencia: this.context.urgencyLevel,
      alertas: this.context.alerts,
      respuestas: this.conversationHistory.filter((r) => r.speaker === 'patient'),
      recomendaciones: this.getBasicRecommendations(this.context.urgencyLevel),
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Finalizar sesión
   */
  async endSession(): Promise<void> {
    if (!this.context) return;

    // Generar resumen
    const summary = await this.generateSummary();

    // Emitir evento de fin
    this.emit('session.end', {
      sessionId: this.context.sessionId,
      summary,
    });

    // Limpiar estado
    this.context = null;
    this.conversationHistory = [];
    this.setState('idle');
    this.setEmotion('neutral');

    logger.info('🏥 Sesión de Alta finalizada');
  }

  // Métodos auxiliares

  private setState(state: AltaState): void {
    this.state = state;
    this.emit('state.changed', state);
  }

  private setEmotion(emotion: AltaEmotion): void {
    this.emotion = emotion;
    this.emit('emotion.changed', emotion);
  }

  protected addToHistory(speaker: 'alta' | 'patient', content: string, additionalData?: any): void {
    const response: AltaResponse = {
      id: this.generateId(),
      timestamp: new Date(),
      speaker,
      content,
      emotion: speaker === 'alta' ? this.emotion : undefined,
      ...additionalData,
    };

    this.conversationHistory.push(response);

    if (this.context) {
      this.context.responses.push(response);
    }
  }

  // Protected accessors for subclasses
  protected get conversationContext(): AltaConversationContext | null {
    return this.context;
  }

  protected get history(): AltaResponse[] {
    return this.conversationHistory;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `alta-session-${this.generateId()}`;
  }

  private getSessionDuration(): string {
    if (!this.context) return '0 minutos';

    const duration = Date.now() - this.context.startTime.getTime();
    const minutes = Math.floor(duration / 60000);

    return `${minutes} minutos`;
  }

  // Métodos públicos para control externo

  public getState(): AltaState {
    return this.state;
  }

  public getEmotion(): AltaEmotion {
    return this.emotion;
  }

  public getContext(): AltaConversationContext | null {
    return this.context;
  }

  public getHistory(): AltaResponse[] {
    return this.conversationHistory;
  }

  public isSessionActive(): boolean {
    return this.context !== null;
  }
}
