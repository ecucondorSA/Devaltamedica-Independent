/**
 * ResponseGenerator - Generador de respuestas médicas
 * Separado del God Object AltaAgentWithAI
 */

import type { AltaEmotion } from '../../types/alta.types';

export interface ResponseConfig {
  tone: ResponseTone;
  complexity: ComplexityLevel;
  language: string;
  includeEmoji: boolean;
  maxLength?: number;
}

export enum ResponseTone {
  PROFESSIONAL = 'professional',
  EMPATHETIC = 'empathetic',
  EDUCATIONAL = 'educational',
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
}

export interface MedicalResponse {
  message: string;
  emotion: AltaEmotion;
  suggestions?: string[];
  warnings?: string[];
  educationalContent?: string;
  followUpQuestions?: string[];
}

export class ResponseGenerator {
  private readonly responseTemplates = {
    greeting: {
      professional: 'Buenos días. Soy su asistente médico virtual. ¿En qué puedo ayudarle hoy?',
      empathetic: 'Hola, es un gusto poder asistirle. ¿Cómo se encuentra hoy?',
      educational:
        'Bienvenido al sistema de salud digital. Estoy aquí para ayudarle con información médica.',
    },
    symptomInquiry: {
      professional: 'Por favor, describa sus síntomas con el mayor detalle posible.',
      empathetic: 'Entiendo su preocupación. ¿Podría contarme más sobre lo que está sintiendo?',
      educational:
        'Para poder ayudarle mejor, necesito conocer sus síntomas. Los síntomas son las señales que su cuerpo envía.',
    },
    urgentCare: {
      professional:
        'Sus síntomas requieren atención médica inmediata. Diríjase al servicio de emergencias.',
      empathetic:
        'Comprendo que debe ser preocupante. Es importante que busque atención médica de inmediato.',
      educational:
        'Los síntomas que describe son señales de alerta que requieren evaluación médica urgente.',
    },
  };

  private readonly medicalPhrases = {
    reassurance: [
      'Es comprensible su preocupación',
      'Muchas personas experimentan síntomas similares',
      'Con el tratamiento adecuado, la mayoría mejora',
    ],
    caution: [
      'Es importante no automedicarse',
      'Consulte con un profesional de la salud',
      'Mantenga un registro de sus síntomas',
    ],
    education: ['Es útil saber que', 'Un dato importante es', 'La evidencia médica sugiere'],
  };

  /**
   * Genera una respuesta médica completa
   */
  generateResponse(
    context: string,
    config: ResponseConfig,
    data?: Record<string, unknown>,
  ): MedicalResponse {
    const baseMessage = this.generateBaseMessage(context, config, data);
    const emotion = this.determineEmotion(context, config.tone);
    const suggestions = this.generateSuggestions(context, data);
    const warnings = this.generateWarnings(context, data);
    const educationalContent = this.generateEducationalContent(context, config.complexity);
    const followUpQuestions = this.generateFollowUpQuestions(context);

    return {
      message: this.formatMessage(baseMessage, config),
      emotion,
      suggestions,
      warnings,
      educationalContent,
      followUpQuestions,
    };
  }

  /**
   * Genera mensaje base según contexto
   */
  private generateBaseMessage(context: string, config: ResponseConfig, data?: any): string {
    // Seleccionar plantilla apropiada
    if (context === 'greeting') {
      return (
        this.responseTemplates.greeting[config.tone] || this.responseTemplates.greeting.professional
      );
    }

    if (context === 'symptom_inquiry') {
      return (
        this.responseTemplates.symptomInquiry[config.tone] ||
        this.responseTemplates.symptomInquiry.professional
      );
    }

    if (context === 'urgent_care') {
      return (
        this.responseTemplates.urgentCare[config.tone] ||
        this.responseTemplates.urgentCare.professional
      );
    }

    // Generar respuesta dinámica
    return this.generateDynamicResponse(context, config, data);
  }

  /**
   * Genera respuesta dinámica basada en datos
   */
  private generateDynamicResponse(context: string, config: ResponseConfig, data?: any): string {
    let response = '';

    // Agregar saludo contextual
    const hour = new Date().getHours();
    if (hour < 12) {
      response = 'Buenos días. ';
    } else if (hour < 19) {
      response = 'Buenas tardes. ';
    } else {
      response = 'Buenas noches. ';
    }

    // Agregar contenido principal
    switch (context) {
      case 'diagnosis_result':
        response += this.formatDiagnosisResult(data, config);
        break;
      case 'treatment_plan':
        response += this.formatTreatmentPlan(data, config);
        break;
      case 'follow_up':
        response += this.formatFollowUp(data, config);
        break;
      default:
        response += 'Estoy aquí para ayudarle con su consulta médica.';
    }

    return response;
  }

  /**
   * Formatea resultado de diagnóstico
   */
  private formatDiagnosisResult(data: any, config: ResponseConfig): string {
    if (config.complexity === ComplexityLevel.SIMPLE) {
      return `Basándome en sus síntomas, ${data.condition || 'la condición'} es una posibilidad. 
              Es importante consultar con un médico para confirmar.`;
    }

    if (config.complexity === ComplexityLevel.TECHNICAL) {
      return `El análisis diferencial sugiere ${data.condition || 'múltiples condiciones'} 
              con una probabilidad del ${data.probability || 'N/A'}%. 
              Se recomiendan las siguientes pruebas diagnósticas: ${data.tests?.join(', ') || 'evaluación clínica'}.`;
    }

    return `Sus síntomas podrían estar relacionados con ${data.condition || 'varias condiciones'}. 
            Le recomiendo una evaluación médica para un diagnóstico preciso.`;
  }

  /**
   * Formatea plan de tratamiento
   */
  private formatTreatmentPlan(data: any, config: ResponseConfig): string {
    const treatments = data.treatments || ['seguimiento médico'];

    if (config.tone === ResponseTone.EMPATHETIC) {
      return `Entiendo que puede ser abrumador, pero hay opciones de tratamiento efectivas. 
              ${treatments.join(', ')} son algunas alternativas que su médico podría considerar.`;
    }

    return `El plan de tratamiento recomendado incluye: ${treatments.join(', ')}. 
            Es importante seguir las indicaciones médicas.`;
  }

  /**
   * Formatea seguimiento
   */
  private formatFollowUp(data: any, config: ResponseConfig): string {
    const followUpTime = data.followUpTime || '1 semana';

    return `Se recomienda un seguimiento en ${followUpTime}. 
            Mientras tanto, mantenga un registro de sus síntomas.`;
  }

  /**
   * Determina emoción apropiada
   */
  private determineEmotion(context: string, tone: ResponseTone): AltaEmotion {
    if (context === 'urgent_care') return 'concerned';
    if (context === 'greeting') return 'friendly';
    if (tone === ResponseTone.EMPATHETIC) return 'caring';
    if (tone === ResponseTone.REASSURING) return 'supportive';
    return 'neutral';
  }

  /**
   * Genera sugerencias
   */
  private generateSuggestions(context: string, data?: any): string[] {
    const suggestions: string[] = [];

    if (context === 'symptom_inquiry') {
      suggestions.push('Mantenga un diario de síntomas');
      suggestions.push('Tome nota de factores desencadenantes');
      suggestions.push('Registre la severidad del 1 al 10');
    }

    if (context === 'diagnosis_result' && data?.condition) {
      suggestions.push(`Busque información confiable sobre ${data.condition}`);
      suggestions.push('Prepare preguntas para su médico');
      suggestions.push('Considere una segunda opinión si lo desea');
    }

    return suggestions;
  }

  /**
   * Genera advertencias
   */
  private generateWarnings(context: string, data?: any): string[] {
    const warnings: string[] = [];

    if (data?.urgency === 'high') {
      warnings.push('⚠️ Busque atención médica inmediata');
    }

    if (data?.contraindications) {
      warnings.push('⚠️ Existen contraindicaciones importantes');
    }

    warnings.push('No sustituye una consulta médica profesional');

    return warnings;
  }

  /**
   * Genera contenido educativo
   */
  private generateEducationalContent(context: string, complexity: ComplexityLevel): string {
    if (complexity === ComplexityLevel.SIMPLE) {
      return 'Su salud es importante. Siempre consulte con profesionales médicos.';
    }

    if (context === 'diagnosis_result') {
      return 'El diagnóstico médico es un proceso que considera múltiples factores incluyendo historia clínica, examen físico y pruebas complementarias.';
    }

    return 'La medicina basada en evidencia combina experiencia clínica, valores del paciente y mejor evidencia disponible.';
  }

  /**
   * Genera preguntas de seguimiento
   */
  private generateFollowUpQuestions(context: string): string[] {
    const questions: string[] = [];

    switch (context) {
      case 'symptom_inquiry':
        questions.push('¿Desde cuándo tiene estos síntomas?');
        questions.push('¿Ha tomado algún medicamento?');
        questions.push('¿Tiene antecedentes médicos relevantes?');
        break;
      case 'diagnosis_result':
        questions.push('¿Tiene alguna pregunta sobre el diagnóstico?');
        questions.push('¿Necesita información sobre tratamientos?');
        break;
      default:
        questions.push('¿Hay algo más en lo que pueda ayudarle?');
    }

    return questions;
  }

  /**
   * Formatea mensaje final
   */
  private formatMessage(message: string, config: ResponseConfig): string {
    let formatted = message;

    // Agregar emojis si está habilitado
    if (config.includeEmoji) {
      formatted = this.addEmojis(formatted, config.tone);
    }

    // Limitar longitud si se especifica
    if (config.maxLength && formatted.length > config.maxLength) {
      formatted = formatted.substring(0, config.maxLength - 3) + '...';
    }

    // Asegurar formato correcto
    formatted = this.ensureProperFormatting(formatted);

    return formatted;
  }

  /**
   * Agrega emojis apropiados
   */
  private addEmojis(message: string, tone: ResponseTone): string {
    const emojiMap = {
      [ResponseTone.PROFESSIONAL]: '👨‍⚕️',
      [ResponseTone.EMPATHETIC]: '💙',
      [ResponseTone.EDUCATIONAL]: '📚',
      [ResponseTone.URGENT]: '🚨',
      [ResponseTone.REASSURING]: '🤗',
    };

    return `${emojiMap[tone] || '🏥'} ${message}`;
  }

  /**
   * Asegura formato correcto del mensaje
   */
  private ensureProperFormatting(message: string): string {
    // Eliminar espacios múltiples
    message = message.replace(/\s+/g, ' ');

    // Asegurar puntuación final
    if (!message.match(/[.!?]$/)) {
      message += '.';
    }

    // Capitalizar primera letra
    message = message.charAt(0).toUpperCase() + message.slice(1);

    return message.trim();
  }
}

export default ResponseGenerator;
