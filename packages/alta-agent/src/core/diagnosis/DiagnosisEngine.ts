/**
 * DiagnosisEngine - Motor de diagnóstico médico
 * Separado del God Object AltaAgentWithAI
 */

export interface DiagnosticSession {
  id: string;
  patientId: string;
  startTime: Date;
  currentPhase: DiagnosticPhase;
  collectedData: CollectedData;
  analysis: DiagnosticAnalysis;
  recommendations: DiagnosticRecommendations;
}

export enum DiagnosticPhase {
  INITIAL = 'initial',
  CHIEF_COMPLAINT = 'chief_complaint',
  SYMPTOM_EXPLORATION = 'symptom_exploration',
}

export interface CollectedData {
  chiefComplaint?: string;
  symptoms: Symptom[];
  duration?: string;
  onset?: string;
  triggers?: string[];
  relievingFactors?: string[];
  associatedSymptoms?: string[];
  severity?: number;
  location?: string;
  quality?: string;
  radiation?: string;
  timing?: string;
}

export interface Symptom {
  name: string;
  severity: number;
  duration: string;
  frequency?: string;
  characteristics?: string[];
  affectedArea?: string;
}

export interface DiagnosticAnalysis {
  primaryDiagnosis?: string;
  differentialDiagnoses: DifferentialDiagnosis[];
  riskFactors: string[];
  diagnosticTests?: DiagnosticTest[];
  clinicalPearls?: string[];
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  testsToConfirm?: string[];
}

export interface DiagnosticTest {
  name: string;
  purpose: string;
  urgency: 'immediate' | 'urgent' | 'routine' | 'optional';
  expectedResults?: string;
}

export interface DiagnosticRecommendations {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  followUp?: string;
  referrals?: Referral[];
  lifestyle?: string[];
}

export interface Referral {
  specialty: string;
  urgency: 'emergency' | 'urgent' | 'routine';
  reason: string;
}

export class DiagnosisEngine {
  private sessions: Map<string, DiagnosticSession> = new Map();

  /**
   * Inicia una nueva sesión diagnóstica
   */
  startSession(patientId: string): DiagnosticSession {
    const session: DiagnosticSession = {
      id: this.generateSessionId(),
      patientId,
      startTime: new Date(),
      currentPhase: DiagnosticPhase.INITIAL,
      collectedData: {
        symptoms: [],
      },
      analysis: {
        differentialDiagnoses: [],
        riskFactors: [],
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
      },
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Procesa el motivo de consulta principal
   */
  processChiefComplaint(sessionId: string, complaint: string): void {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.collectedData.chiefComplaint = complaint;
    session.currentPhase = DiagnosticPhase.SYMPTOM_EXPLORATION;

    // Extraer síntomas iniciales del complaint
    const extractedSymptoms = this.extractSymptomsFromText(complaint);
    session.collectedData.symptoms.push(...extractedSymptoms);

    this.updateSession(session);
  }

  /**
   * Agrega síntomas a la sesión
   */
  addSymptoms(sessionId: string, symptoms: Symptom[]): void {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.collectedData.symptoms.push(...symptoms);

    // Actualizar fase si tenemos suficientes síntomas
    if (session.collectedData.symptoms.length >= 3) {
      session.currentPhase = DiagnosticPhase.MEDICAL_HISTORY;
    }

    this.updateSession(session);
  }

  /**
   * Analiza los datos recolectados y genera diagnósticos diferenciales
   */
  analyzeSession(sessionId: string): DiagnosticAnalysis {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const analysis: DiagnosticAnalysis = {
      differentialDiagnoses: this.generateDifferentialDiagnoses(session.collectedData),
      riskFactors: this.identifyRiskFactors(session.collectedData),
      diagnosticTests: this.recommendDiagnosticTests(session.collectedData),
      clinicalPearls: this.generateClinicalPearls(session.collectedData),
    };

    // Determinar diagnóstico primario
    if (analysis.differentialDiagnoses.length > 0) {
      const primary = analysis.differentialDiagnoses[0];
      if (primary.probability > 0.7) {
        analysis.primaryDiagnosis = primary.condition;
      }
    }

    session.analysis = analysis;
    session.currentPhase = DiagnosticPhase.ANALYSIS;
    this.updateSession(session);

    return analysis;
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  generateRecommendations(sessionId: string): DiagnosticRecommendations {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const recommendations: DiagnosticRecommendations = {
      immediate: this.generateImmediateActions(session),
      shortTerm: this.generateShortTermActions(session),
      longTerm: this.generateLongTermActions(session),
      followUp: this.determineFollowUp(session),
      referrals: this.determineReferrals(session),
      lifestyle: this.generateLifestyleRecommendations(session),
    };

    session.recommendations = recommendations;
    session.currentPhase = DiagnosticPhase.COMPLETED;
    this.updateSession(session);

    return recommendations;
  }

  /**
   * Extrae síntomas de texto libre
   */
  private extractSymptomsFromText(text: string): Symptom[] {
    const symptoms: Symptom[] = [];
    const symptomKeywords = [
      'dolor',
      'fiebre',
      'tos',
      'mareo',
      'náuseas',
      'vómitos',
      'diarrea',
      'fatiga',
      'debilidad',
      'palpitaciones',
    ];

    const lowerText = text.toLowerCase();
    for (const keyword of symptomKeywords) {
      if (lowerText.includes(keyword)) {
        symptoms.push({
          name: keyword,
          severity: this.estimateSeverityFromText(text, keyword),
          duration: this.extractDurationFromText(text),
        });
      }
    }

    return symptoms;
  }

  /**
   * Genera diagnósticos diferenciales
   */
  private generateDifferentialDiagnoses(data: CollectedData): DifferentialDiagnosis[] {
    const diagnoses: DifferentialDiagnosis[] = [];

    // Matriz de síntomas y condiciones
    const conditionMatrix = [
      {
        condition: 'Infección respiratoria alta',
        symptoms: ['tos', 'fiebre', 'dolor de garganta', 'congestión'],
        tests: ['Hemograma', 'PCR'],
      },
      {
        condition: 'Gastroenteritis',
        symptoms: ['náuseas', 'vómitos', 'diarrea', 'dolor abdominal'],
        tests: ['Coprocultivo', 'Electrolitos'],
      },
      {
        condition: 'Cefalea tensional',
        symptoms: ['dolor de cabeza', 'tensión muscular', 'estrés'],
        tests: ['Examen neurológico'],
      },
    ];

    for (const condition of conditionMatrix) {
      const matchedSymptoms = data.symptoms.filter((s) =>
        condition.symptoms.includes(s.name.toLowerCase()),
      );

      if (matchedSymptoms.length > 0) {
        diagnoses.push({
          condition: condition.condition,
          probability: matchedSymptoms.length / condition.symptoms.length,
          supportingEvidence: matchedSymptoms.map((s) => s.name),
          contradictingEvidence: [],
          testsToConfirm: condition.tests,
        });
      }
    }

    return diagnoses.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Identifica factores de riesgo
   */
  private identifyRiskFactors(data: CollectedData): string[] {
    const riskFactors: string[] = [];

    // Severidad alta
    const highSeveritySymptoms = data.symptoms.filter((s) => s.severity > 7);
    if (highSeveritySymptoms.length > 0) {
      riskFactors.push('Síntomas de alta severidad');
    }

    // Duración prolongada
    if (data.duration && this.parseDuration(data.duration) > 7) {
      riskFactors.push('Síntomas de larga duración');
    }

    // Síntomas múltiples
    if (data.symptoms.length > 5) {
      riskFactors.push('Múltiples síntomas concurrentes');
    }

    return riskFactors;
  }

  /**
   * Recomienda pruebas diagnósticas
   */
  private recommendDiagnosticTests(data: CollectedData): DiagnosticTest[] {
    const tests: DiagnosticTest[] = [];

    // Fiebre -> Hemograma
    if (data.symptoms.some((s) => s.name.toLowerCase().includes('fiebre'))) {
      tests.push({
        name: 'Hemograma completo',
        purpose: 'Evaluar infección y respuesta inmune',
        urgency: 'urgent',
      });
    }

    // Dolor abdominal -> Ecografía
    if (data.symptoms.some((s) => s.name.toLowerCase().includes('dolor abdominal'))) {
      tests.push({
        name: 'Ecografía abdominal',
        purpose: 'Descartar patología orgánica',
        urgency: 'routine',
      });
    }

    return tests;
  }

  /**
   * Genera perlas clínicas
   */
  private generateClinicalPearls(data: CollectedData): string[] {
    const pearls: string[] = [];

    if (data.symptoms.some((s) => s.name.includes('fiebre'))) {
      pearls.push('La fiebre es un mecanismo de defensa del cuerpo');
    }

    if (data.symptoms.some((s) => s.name.includes('dolor'))) {
      pearls.push('El dolor es el quinto signo vital');
    }

    return pearls;
  }

  /**
   * Genera acciones inmediatas
   */
  private generateImmediateActions(session: DiagnosticSession): string[] {
    const actions: string[] = [];
    const severity = Math.max(...session.collectedData.symptoms.map((s) => s.severity));

    if (severity > 8) {
      actions.push('Consultar médico de inmediato');
    }

    if (session.collectedData.symptoms.some((s) => s.name.includes('fiebre'))) {
      actions.push('Tomar temperatura y registrar');
      actions.push('Mantenerse hidratado');
    }

    return actions;
  }

  /**
   * Genera acciones a corto plazo
   */
  private generateShortTermActions(session: DiagnosticSession): string[] {
    return [
      'Mantener registro de síntomas',
      'Seguir tratamiento indicado',
      'Reposo según necesidad',
    ];
  }

  /**
   * Genera acciones a largo plazo
   */
  private generateLongTermActions(session: DiagnosticSession): string[] {
    return ['Control médico regular', 'Mantener hábitos saludables', 'Prevención activa'];
  }

  /**
   * Determina seguimiento necesario
   */
  private determineFollowUp(session: DiagnosticSession): string {
    const severity = Math.max(...session.collectedData.symptoms.map((s) => s.severity));

    if (severity > 7) return 'Control en 24-48 horas';
    if (severity > 5) return 'Control en 3-5 días';
    return 'Control en 1-2 semanas si persisten síntomas';
  }

  /**
   * Determina referencias necesarias
   */
  private determineReferrals(session: DiagnosticSession): Referral[] {
    const referrals: Referral[] = [];

    if (session.analysis.primaryDiagnosis?.includes('cardio')) {
      referrals.push({
        specialty: 'Cardiología',
        urgency: 'urgent',
        reason: 'Evaluación cardiovascular especializada',
      });
    }

    return referrals;
  }

  /**
   * Genera recomendaciones de estilo de vida
   */
  private generateLifestyleRecommendations(session: DiagnosticSession): string[] {
    return [
      'Mantener hidratación adecuada',
      'Descanso de 7-8 horas diarias',
      'Alimentación balanceada',
      'Ejercicio regular según tolerancia',
    ];
  }

  // Utilidades privadas

  private generateSessionId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSession(sessionId: string): DiagnosticSession | undefined {
    return this.sessions.get(sessionId);
  }

  private updateSession(session: DiagnosticSession): void {
    this.sessions.set(session.id, session);
  }

  private estimateSeverityFromText(text: string, symptom: string): number {
    const severityWords = {
      high: ['severo', 'intenso', 'muy fuerte', 'insoportable'],
      medium: ['moderado', 'regular', 'molesto'],
      low: ['leve', 'poco', 'ligero'],
    };

    const lowerText = text.toLowerCase();

    if (severityWords.high.some((word) => lowerText.includes(word))) return 8;
    if (severityWords.medium.some((word) => lowerText.includes(word))) return 5;
    if (severityWords.low.some((word) => lowerText.includes(word))) return 3;

    return 5; // Default medio
  }

  private extractDurationFromText(text: string): string {
    const durationPattern = /(\d+)\s*(días?|semanas?|meses?|horas?)/i;
    const match = text.match(durationPattern);
    return match ? match[0] : 'No especificado';
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}

export default DiagnosisEngine;
