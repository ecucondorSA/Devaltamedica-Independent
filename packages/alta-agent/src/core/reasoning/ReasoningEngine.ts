/**
 * ReasoningEngine - Motor de razonamiento médico
 * Extrae lógica de razonamiento del God Object AltaAgentWithAI
 */

export interface ReasoningContext {
  symptoms: string[];
  history: string[];
  vitals?: VitalSigns;
  medications?: string[];
  allergies?: string[];
}

export interface VitalSigns {
  temperature?: number;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface ClinicalReasoning {
  hypothesis: Hypothesis[];
  differentialDiagnosis: Diagnosis[];
  urgencyLevel: UrgencyLevel;
  recommendedActions: string[];
  redFlags: string[];
}

export interface Hypothesis {
  condition: string;
  probability: number;
  evidence: string[];
  contraindications: string[];
}

export interface Diagnosis {
  name: string;
  icd10: string;
  confidence: number;
  symptoms: string[];
}

export enum UrgencyLevel {
  EMERGENCY = 'emergency',
  URGENT = 'urgent',
  SEMI_URGENT = 'semi-urgent',
  NON_URGENT = 'non-urgent',
  PREVENTIVE = 'preventive'
}

export class ReasoningEngine {
  private readonly urgencyPatterns = {
    emergency: [
      'dolor torácico',
      'chest pain',
      'dificultad respiratoria',
      'pérdida de consciencia',
      'convulsiones',
      'hemorragia severa',
      'trauma craneal',
      'stroke symptoms',
    ],
    urgent: [
      'fiebre alta',
      'dolor abdominal severo',
      'vómitos persistentes',
      'deshidratación',
      'herida profunda',
      'fractura',
      'reacción alérgica',
    ],
    semiUrgent: ['dolor moderado', 'fiebre', 'tos persistente', 'infección', 'mareos'],
  };

  private readonly redFlagSymptoms = [
    'pérdida de peso inexplicable',
    'sangrado anormal',
    'dolor que empeora',
    'fiebre nocturna',
    'cambios neurológicos',
    'dolor torácico con ejercicio',
  ];

  /**
   * Analiza síntomas y genera razonamiento clínico
   */
  async analyzeClinicalContext(context: ReasoningContext): Promise<ClinicalReasoning> {
    const urgencyLevel = this.determineUrgency(context.symptoms);
    const redFlags = this.detectRedFlags(context);
    const hypothesis = await this.generateHypothesis(context);
    const differentialDiagnosis = await this.generateDifferentialDiagnosis(context, hypothesis);
    const recommendedActions = this.generateRecommendations(urgencyLevel, redFlags, hypothesis);

    return {
      hypothesis,
      differentialDiagnosis,
      urgencyLevel,
      recommendedActions,
      redFlags,
    };
  }

  /**
   * Determina nivel de urgencia basado en síntomas
   */
  private determineUrgency(symptoms: string[]): UrgencyLevel {
    const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

    for (const symptom of lowerSymptoms) {
      if (this.urgencyPatterns.emergency.some((pattern) => symptom.includes(pattern))) {
        return UrgencyLevel.EMERGENCY;
      }
    }

    for (const symptom of lowerSymptoms) {
      if (this.urgencyPatterns.urgent.some((pattern) => symptom.includes(pattern))) {
        return UrgencyLevel.URGENT;
      }
    }

    for (const symptom of lowerSymptoms) {
      if (this.urgencyPatterns.semiUrgent.some((pattern) => symptom.includes(pattern))) {
        return UrgencyLevel.SEMI_URGENT;
      }
    }

    return UrgencyLevel.NON_URGENT;
  }

  /**
   * Detecta síntomas de alarma (red flags)
   */
  private detectRedFlags(context: ReasoningContext): string[] {
    const redFlags: string[] = [];
    const allSymptoms = [...context.symptoms, ...context.history];

    for (const symptom of allSymptoms) {
      const lowerSymptom = symptom.toLowerCase();
      for (const redFlag of this.redFlagSymptoms) {
        if (lowerSymptom.includes(redFlag)) {
          redFlags.push(redFlag);
        }
      }
    }

    // Verificar signos vitales anormales
    if (context.vitals) {
      if (context.vitals.temperature && context.vitals.temperature > 39) {
        redFlags.push('Fiebre alta (>39°C)');
      }
      if (
        context.vitals.heartRate &&
        (context.vitals.heartRate < 50 || context.vitals.heartRate > 120)
      ) {
        redFlags.push('Frecuencia cardíaca anormal');
      }
      if (context.vitals.oxygenSaturation && context.vitals.oxygenSaturation < 92) {
        redFlags.push('Saturación de oxígeno baja');
      }
    }

    return [...new Set(redFlags)];
  }

  /**
   * Genera hipótesis diagnósticas
   */
  private async generateHypothesis(context: ReasoningContext): Promise<Hypothesis[]> {
    const hypothesis: Hypothesis[] = [];

    // Lógica simplificada - en producción se integraría con IA
    const symptomPatterns = this.matchSymptomPatterns(context.symptoms);

    for (const pattern of symptomPatterns) {
      hypothesis.push({
        condition: pattern.condition,
        probability: pattern.probability,
        evidence: pattern.matchedSymptoms,
        contraindications: this.findContraindications(pattern.condition, context),
      });
    }

    return hypothesis.sort((a, b) => b.probability - a.probability).slice(0, 5);
  }

  /**
   * Genera diagnóstico diferencial
   */
  private async generateDifferentialDiagnosis(
    context: ReasoningContext,
    hypothesis: Hypothesis[],
  ): Promise<Diagnosis[]> {
    const diagnoses: Diagnosis[] = [];

    for (const hypo of hypothesis) {
      const icd10 = this.mapToICD10(hypo.condition);
      diagnoses.push({
        name: hypo.condition,
        icd10,
        confidence: hypo.probability,
        symptoms: hypo.evidence,
      });
    }

    return diagnoses;
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generateRecommendations(
    urgency: UrgencyLevel,
    redFlags: string[],
    hypothesis: Hypothesis[],
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones por urgencia
    switch (urgency) {
      case UrgencyLevel.EMERGENCY:
        recommendations.push('🚨 Llamar al 911 o acudir a emergencias inmediatamente');
        recommendations.push('No conducir - solicitar ambulancia si es posible');
        break;
      case UrgencyLevel.URGENT:
        recommendations.push('⚠️ Consultar con un médico dentro de las próximas 24 horas');
        recommendations.push('Acudir a guardia médica si los síntomas empeoran');
        break;
      case UrgencyLevel.SEMI_URGENT:
        recommendations.push('📅 Programar consulta médica en los próximos días');
        recommendations.push('Monitorear síntomas y registrar cambios');
        break;
      case UrgencyLevel.NON_URGENT:
        recommendations.push('💊 Considerar consulta de rutina');
        recommendations.push('Mantener registro de síntomas');
        break;
      case UrgencyLevel.PREVENTIVE:
        recommendations.push('✅ Mantener controles preventivos regulares');
        break;
    }

    // Recomendaciones por red flags
    if (redFlags.length > 0) {
      recommendations.push('⚠️ Se detectaron síntomas de alarma - consultar médico pronto');
    }

    // Recomendaciones específicas por hipótesis principal
    if (hypothesis.length > 0 && hypothesis[0].probability > 0.7) {
      const mainCondition = hypothesis[0].condition;
      recommendations.push(...this.getConditionSpecificRecommendations(mainCondition));
    }

    return recommendations;
  }

  /**
   * Mapea patrones de síntomas a condiciones
   */
  private matchSymptomPatterns(symptoms: string[]): Array<{
    condition: string;
    probability: number;
    matchedSymptoms: string[];
  }> {
    // Implementación simplificada - en producción usaría ML
    const patterns = [
      {
        condition: 'Gripe',
        keywords: ['fiebre', 'tos', 'dolor muscular', 'fatiga'],
        probability: 0,
      },
      {
        condition: 'COVID-19',
        keywords: ['fiebre', 'tos seca', 'pérdida de olfato', 'dificultad respiratoria'],
        probability: 0,
      },
      {
        condition: 'Migraña',
        keywords: ['dolor de cabeza', 'náuseas', 'sensibilidad a la luz'],
        probability: 0,
      },
    ];

    const results = [];
    for (const pattern of patterns) {
      const matchedSymptoms = symptoms.filter((s) =>
        pattern.keywords.some((k) => s.toLowerCase().includes(k)),
      );

      if (matchedSymptoms.length > 0) {
        results.push({
          condition: pattern.condition,
          probability: matchedSymptoms.length / pattern.keywords.length,
          matchedSymptoms,
        });
      }
    }

    return results;
  }

  /**
   * Encuentra contraindicaciones para una condición
   */
  private findContraindications(condition: string, context: ReasoningContext): string[] {
    const contraindications: string[] = [];

    // Verificar medicamentos que podrían interferir
    if (context.medications) {
      // Lógica simplificada
      if (condition === 'Hipertensión' && context.medications.includes('ibuprofeno')) {
        contraindications.push('El ibuprofeno puede elevar la presión arterial');
      }
    }

    // Verificar alergias
    if (context.allergies) {
      // Lógica simplificada
      if (condition === 'Infección' && context.allergies.includes('penicilina')) {
        contraindications.push('Alergia a penicilina - considerar antibióticos alternativos');
      }
    }

    return contraindications;
  }

  /**
   * Mapea condición a código ICD-10
   */
  private mapToICD10(condition: string): string {
    const icd10Map: Record<string, string> = {
      Gripe: 'J11.1',
      'COVID-19': 'U07.1',
      Migraña: 'G43.9',
      Hipertensión: 'I10',
      'Diabetes tipo 2': 'E11.9',
    };

    return icd10Map[condition] || 'R69';
  }

  /**
   * Obtiene recomendaciones específicas por condición
   */
  private getConditionSpecificRecommendations(condition: string): string[] {
    const recommendations: Record<string, string[]> = {
      Gripe: [
        'Descansar adecuadamente',
        'Mantenerse hidratado',
        'Considerar antivirales si es dentro de 48 horas',
      ],
      'COVID-19': [
        'Aislarse según protocolo local',
        'Monitorear saturación de oxígeno',
        'Contactar si hay dificultad respiratoria',
      ],
      Migraña: [
        'Descansar en ambiente oscuro y silencioso',
        'Aplicar compresas frías',
        'Considerar medicación preventiva si es recurrente',
      ],
    };

    return recommendations[condition] || [];
  }
}

export default ReasoningEngine;
