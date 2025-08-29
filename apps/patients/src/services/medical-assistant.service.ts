/**
 * 👨‍⚕️ ASISTENTE MÉDICO VIRTUAL CON IA
 * 
 * Proporciona sugerencias diagnósticas, verificación de interacciones
 * medicamentosas y generación de notas clínicas durante consultas
 */

import { z } from 'zod';

import { logger } from '@altamedica/shared';
// Esquemas de validación
export const DiagnosisSchema = z.object({
  code: z.string(), // ICD-10
  name: z.string(),
  probability: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  differentialDiagnosis: z.array(z.string()).optional(),
});

export const MedicationSchema = z.object({
  name: z.string(),
  genericName: z.string().optional(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  route: z.string(), // oral, IV, IM, etc.
});

export const DrugInteractionSchema = z.object({
  drug1: z.string(),
  drug2: z.string(),
  severity: z.enum(['minor', 'moderate', 'major', 'contraindicated']),
  description: z.string(),
  recommendation: z.string(),
});

export const ClinicalNoteSchema = z.object({
  subjective: z.string(), // S - Lo que el paciente dice
  objective: z.string(),  // O - Hallazgos del examen
  assessment: z.string(),  // A - Evaluación diagnóstica
  plan: z.string(),        // P - Plan de tratamiento
  timestamp: z.date(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type DrugInteraction = z.infer<typeof DrugInteractionSchema>;
export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>;

// Base de conocimiento médico (simplificada para POC)
const COMMON_DIAGNOSES: Record<string, Diagnosis> = {
  'hipertension': {
    code: 'I10',
    name: 'Hipertensión esencial (primaria)',
    probability: 0,
    evidence: ['presión alta', 'dolor de cabeza', 'mareos'],
  },
  'diabetes': {
    code: 'E11',
    name: 'Diabetes mellitus tipo 2',
    probability: 0,
    evidence: ['sed excesiva', 'orina frecuente', 'fatiga', 'glucosa elevada'],
  },
  'gripe': {
    code: 'J11',
    name: 'Influenza',
    probability: 0,
    evidence: ['fiebre', 'tos', 'dolor muscular', 'fatiga'],
  },
  'gastritis': {
    code: 'K29',
    name: 'Gastritis aguda',
    probability: 0,
    evidence: ['dolor abdominal', 'náuseas', 'acidez', 'pérdida de apetito'],
  },
  'ansiedad': {
    code: 'F41.1',
    name: 'Trastorno de ansiedad generalizada',
    probability: 0,
    evidence: ['preocupación excesiva', 'tensión muscular', 'insomnio', 'irritabilidad'],
  },
};

// Base de interacciones medicamentosas
const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    drug1: 'warfarina',
    drug2: 'aspirina',
    severity: 'major',
    description: 'Aumenta significativamente el riesgo de sangrado',
    recommendation: 'Evitar combinación o monitorear INR estrechamente',
  },
  {
    drug1: 'metformina',
    drug2: 'alcohol',
    severity: 'moderate',
    description: 'Puede aumentar el riesgo de acidosis láctica',
    recommendation: 'Limitar consumo de alcohol',
  },
  {
    drug1: 'lisinopril',
    drug2: 'ibuprofeno',
    severity: 'moderate',
    description: 'Puede reducir el efecto antihipertensivo y afectar función renal',
    recommendation: 'Monitorear presión arterial y función renal',
  },
];

// Protocolos clínicos
const CLINICAL_PROTOCOLS: Record<string, string[]> = {
  'hipertension': [
    'Medir presión arterial en ambos brazos',
    'Evaluar daño a órganos diana',
    'Solicitar: CBC, química sanguínea, EKG, urinalisis',
    'Iniciar cambios en estilo de vida',
    'Considerar medicación si PA >140/90 persistente',
  ],
  'diabetes': [
    'Verificar glucosa en ayunas y HbA1c',
    'Evaluar complicaciones: retinopatía, neuropatía, nefropatía',
    'Educación nutricional',
    'Iniciar metformina si no hay contraindicaciones',
    'Monitoreo trimestral',
  ],
};

export class MedicalAssistantService {
  private static instance: MedicalAssistantService;
  
  private constructor() {}
  
  static getInstance(): MedicalAssistantService {
    if (!MedicalAssistantService.instance) {
      MedicalAssistantService.instance = new MedicalAssistantService();
    }
    return MedicalAssistantService.instance;
  }

  /**
   * Sugiere diagnósticos basados en síntomas
   */
  async suggestDiagnosis(symptoms: string[]): Promise<Diagnosis[]> {
    try {
      // Simular procesamiento de IA
      await this.simulateAIProcessing();
      
      const suggestions: Diagnosis[] = [];
      
      // Analizar síntomas contra base de conocimiento
      for (const [key, diagnosis] of Object.entries(COMMON_DIAGNOSES)) {
        const matchingSymptoms = symptoms.filter(symptom =>
          diagnosis.evidence.some(evidence =>
            symptom.toLowerCase().includes(evidence.toLowerCase())
          )
        );
        
        if (matchingSymptoms.length > 0) {
          const probability = (matchingSymptoms.length / diagnosis.evidence.length) * 100;
          suggestions.push({
            ...diagnosis,
            probability: Math.round(probability),
            differentialDiagnosis: this.getDifferentialDiagnosis(key),
          });
        }
      }
      
      // Ordenar por probabilidad
      suggestions.sort((a, b) => b.probability - a.probability);
      
      // Limitar a top 5
      return suggestions.slice(0, 5);
    } catch (error) {
      logger.error('Error al sugerir diagnósticos:', String(error));
      throw new Error('No se pudieron generar sugerencias diagnósticas');
    }
  }

  /**
   * Verifica interacciones entre medicamentos
   */
  async checkDrugInteractions(medications: Medication[]): Promise<DrugInteraction[]> {
    try {
      await this.simulateAIProcessing();
      
      const interactions: DrugInteraction[] = [];
      
      // Verificar cada combinación de medicamentos
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const drug1 = medications[i].name.toLowerCase();
          const drug2 = medications[j].name.toLowerCase();
          
          // Buscar interacciones conocidas
          const interaction = DRUG_INTERACTIONS.find(int =>
            (int.drug1.toLowerCase() === drug1 && int.drug2.toLowerCase() === drug2) ||
            (int.drug1.toLowerCase() === drug2 && int.drug2.toLowerCase() === drug1)
          );
          
          if (interaction) {
            interactions.push(interaction);
          }
        }
      }
      
      // Verificar interacciones con condiciones médicas
      const hasNSAID = medications.some(m => 
        ['ibuprofeno', 'naproxeno', 'diclofenaco'].includes(m.name.toLowerCase())
      );
      
      if (hasNSAID) {
        interactions.push({
          drug1: 'AINE',
          drug2: 'Condición: Úlcera gástrica',
          severity: 'major',
          description: 'Los AINEs pueden empeorar úlceras gástricas',
          recommendation: 'Considerar protector gástrico o alternativa',
        });
      }
      
      return interactions;
    } catch (error) {
      logger.error('Error al verificar interacciones:', String(error));
      throw new Error('No se pudieron verificar las interacciones medicamentosas');
    }
  }

  /**
   * Genera notas clínicas en formato SOAP
   */
  async generateClinicalNotes(
    consultation: {
      symptoms: string[];
      vitalSigns?: Record<string, any>;
      diagnosis?: string[];
      medications?: Medication[];
      patientHistory?: string;
    }
  ): Promise<ClinicalNote> {
    try {
      await this.simulateAIProcessing();
      
      // Generar sección Subjetiva
      const subjective = this.generateSubjective(consultation.symptoms, consultation.patientHistory);
      
      // Generar sección Objetiva
      const objective = this.generateObjective(consultation.vitalSigns);
      
      // Generar sección Assessment
      const assessment = this.generateAssessment(consultation.diagnosis || [], consultation.symptoms);
      
      // Generar sección Plan
      const plan = this.generatePlan(consultation.diagnosis || [], consultation.medications || []);
      
      return {
        subjective,
        objective,
        assessment,
        plan,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error al generar notas clínicas:', String(error));
      throw new Error('No se pudieron generar las notas clínicas');
    }
  }

  /**
   * Obtiene protocolo clínico para una condición
   */
  async getProtocol(condition: string): Promise<string[]> {
    try {
      await this.simulateAIProcessing();
      
      const normalizedCondition = condition.toLowerCase();
      
      // Buscar protocolo específico
      for (const [key, protocol] of Object.entries(CLINICAL_PROTOCOLS)) {
        if (normalizedCondition.includes(key)) {
          return protocol;
        }
      }
      
      // Protocolo genérico si no se encuentra específico
      return [
        'Realizar historia clínica completa',
        'Examen físico dirigido',
        'Solicitar estudios según hallazgos',
        'Establecer diagnóstico diferencial',
        'Iniciar tratamiento según guías clínicas',
        'Programar seguimiento',
      ];
    } catch (error) {
      logger.error('Error al obtener protocolo:', String(error));
      throw new Error('No se pudo obtener el protocolo clínico');
    }
  }

  /**
   * Analiza una conversación en tiempo real
   */
  async analyzeConversation(transcript: string): Promise<{
    keyPoints: string[];
    suggestedQuestions: string[];
    possibleDiagnoses: string[];
    redFlags: string[];
  }> {
    try {
      await this.simulateAIProcessing();
      
      const lowerTranscript = transcript.toLowerCase();
      
      // Extraer puntos clave
      const keyPoints: string[] = [];
      const symptomKeywords = ['dolor', 'fiebre', 'tos', 'mareo', 'náusea', 'fatiga'];
      symptomKeywords.forEach(keyword => {
        if (lowerTranscript.includes(keyword)) {
          keyPoints.push(`Paciente menciona: ${keyword}`);
        }
      });
      
      // Sugerir preguntas de seguimiento
      const suggestedQuestions: string[] = [];
      if (lowerTranscript.includes('dolor')) {
        suggestedQuestions.push('¿Puede describir el tipo de dolor? (punzante, opresivo, ardor)');
        suggestedQuestions.push('¿El dolor se irradia a algún otro lugar?');
      }
      if (lowerTranscript.includes('medicamento')) {
        suggestedQuestions.push('¿Es alérgico a algún medicamento?');
        suggestedQuestions.push('¿Qué medicamentos toma actualmente?');
      }
      
      // Identificar posibles diagnósticos
      const possibleDiagnoses: string[] = [];
      if (lowerTranscript.includes('pecho') && lowerTranscript.includes('dolor')) {
        possibleDiagnoses.push('Evaluar origen cardíaco vs musculoesquelético');
      }
      if (lowerTranscript.includes('fiebre') && lowerTranscript.includes('tos')) {
        possibleDiagnoses.push('Considerar infección respiratoria');
      }
      
      // Identificar red flags
      const redFlags: string[] = [];
      const dangerSigns = ['sangre', 'pérdida de peso', 'dolor severo', 'desmayo'];
      dangerSigns.forEach(sign => {
        if (lowerTranscript.includes(sign)) {
          redFlags.push(`⚠️ Señal de alarma: ${sign}`);
        }
      });
      
      return {
        keyPoints,
        suggestedQuestions: suggestedQuestions.slice(0, 3),
        possibleDiagnoses: possibleDiagnoses.slice(0, 3),
        redFlags,
      };
    } catch (error) {
      logger.error('Error al analizar conversación:', String(error));
      throw new Error('No se pudo analizar la conversación');
    }
  }

  // Métodos auxiliares privados

  private getDifferentialDiagnosis(condition: string): string[] {
    const differentials: Record<string, string[]> = {
      'hipertension': ['Hipertensión secundaria', 'Hipertensión de bata blanca', 'Feocromocitoma'],
      'diabetes': ['Diabetes tipo 1', 'Diabetes gestacional', 'Síndrome metabólico'],
      'gripe': ['COVID-19', 'Resfriado común', 'Neumonía', 'Bronquitis'],
      'gastritis': ['Úlcera péptica', 'ERGE', 'Dispepsia funcional', 'Cáncer gástrico'],
      'ansiedad': ['Depresión', 'Trastorno de pánico', 'Hipertiroidismo', 'Trastorno bipolar'],
    };
    
    return differentials[condition] || [];
  }

  private generateSubjective(symptoms: string[], history?: string): string {
    let subjective = 'Paciente presenta: ';
    subjective += symptoms.join(', ');
    
    if (history) {
      subjective += `\n\nHistoria relevante: ${history}`;
    }
    
    subjective += '\n\nNiega otros síntomas asociados.';
    return subjective;
  }

  private generateObjective(vitalSigns?: Record<string, any>): string {
    let objective = 'Signos vitales: ';
    
    if (vitalSigns) {
      objective += Object.entries(vitalSigns)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } else {
      objective += 'Dentro de límites normales';
    }
    
    objective += '\nExamen físico: Paciente en buen estado general, consciente y orientado.';
    objective += '\nSin signos de dificultad respiratoria aguda.';
    
    return objective;
  }

  private generateAssessment(diagnoses: string[], symptoms: string[]): string {
    let assessment = 'Impresión diagnóstica:\n';
    
    if (diagnoses.length > 0) {
      diagnoses.forEach((dx, index) => {
        assessment += `${index + 1}. ${dx}\n`;
      });
    } else {
      assessment += 'Síndrome en estudio. ';
      assessment += `Síntomas principales: ${symptoms.slice(0, 3).join(', ')}.\n`;
    }
    
    assessment += '\nPaciente estable en este momento.';
    return assessment;
  }

  private generatePlan(diagnoses: string[], medications: Medication[]): string {
    let plan = 'Plan de tratamiento:\n\n';
    
    // Medicamentos
    if (medications.length > 0) {
      plan += 'Medicación:\n';
      medications.forEach((med, index) => {
        plan += `${index + 1}. ${med.name} ${med.dosage} ${med.frequency}\n`;
      });
      plan += '\n';
    }
    
    // Estudios
    plan += 'Estudios solicitados:\n';
    plan += '- Hemograma completo\n';
    plan += '- Química sanguínea\n';
    
    // Recomendaciones
    plan += '\nRecomendaciones:\n';
    plan += '- Reposo relativo\n';
    plan += '- Hidratación adecuada\n';
    plan += '- Control en 48-72 horas o antes si empeora\n';
    
    // Signos de alarma
    plan += '\nSignos de alarma (consultar inmediatamente si presenta):\n';
    plan += '- Dificultad respiratoria\n';
    plan += '- Dolor torácico\n';
    plan += '- Fiebre alta persistente\n';
    
    return plan;
  }

  private async simulateAIProcessing(): Promise<void> {
    // Simular latencia de procesamiento IA
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Exportar instancia singleton
export const medicalAssistant = MedicalAssistantService.getInstance();