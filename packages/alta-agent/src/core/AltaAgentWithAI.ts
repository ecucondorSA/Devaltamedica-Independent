/**
 * 🏥 ALTA AGENT WITH AI - Enhanced with Manus & GenSpark
 * Integración con agentes de IA para razonamiento médico real
 * Desarrollado por Dr. Eduardo Marques (Medicina-UBA)
 */

import type {
  AltaConfig,
  AltaConversationContext,
  AltaEmotion,
  AltaMessage,
} from '../types/alta.types';
import { AltaAgent } from './AltaAgent';

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
// Manus SDK - Conversational AI & Medical NLP
interface ManusSDK {
  initialize(config: ManusConfig): Promise<void>;
  processConversation(input: ManusInput): Promise<ManusResponse>;
  analyzeMedicalText(text: string): Promise<MedicalAnalysis>;
  detectUrgency(symptoms: string[]): Promise<UrgencyResult>;
  extractEntities(text: string): Promise<MedicalEntities>;
  generateFollowUp(context: any): Promise<string[]>;
}

interface ManusConfig {
  apiKey: string;
  model: 'medical-v2' | 'clinical-reasoning' | 'emergency-detection';
  language: string;
  specialtyContext: string[];
  complianceMode: 'HIPAA' | 'GDPR' | 'Argentina';
}

// Modo de anamnesis
export type AnamnesisMode = 'preventive' | 'illness' | 'emergency' | 'followup' | 'complete';

// Secciones de anamnesis completa
export type AnamnesisSection =
  | 'identification'
  | 'demographics'
  | 'chief_complaint'
  | 'current_illness'
  | 'past_medical_history'
  | 'surgical_history'
  | 'medications'
  | 'allergies'
  | 'family_history'
  | 'social_history'
  | 'habits'
  | 'vaccinations'
  | 'review_of_systems'
  | 'vital_signs'
  | 'physical_exam'
  | 'preventive_care'
  | 'mental_health'
  | 'sexual_health'
  | 'occupational_health'
  | 'travel_history'
  | 'genetic_screening'
  | 'emergency_contacts';

// Personal Health Record - Registro completo de salud
interface PersonalHealthRecord {
  id: string;
  patientId: string;
  createdAt: Date;
  lastUpdated: Date;
  mode: AnamnesisMode;

  // Datos demográficos básicos
  demographics: {
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    bloodType?: string;
    dni?: string;
    socialSecurity?: string;
    insurance?: InsuranceInfo[];
    emergencyContacts: EmergencyContact[];
  };

  // Historia médica pasada (para personas sanas que quieren guardar su historia)
  medicalHistory: {
    childhoodDiseases: string[];
    chronicConditions: ChronicCondition[];
    pastIllnesses: PastIllness[];
    hospitalizations: Hospitalization[];
    surgeries: Surgery[];
    accidents: Accident[];
    transfusions: BloodTransfusion[];
  };

  // Medicamentos y alergias
  pharmacological: {
    currentMedications: Medication[];
    pastMedications: Medication[];
    allergies: Allergy[];
    adverseReactions: AdverseReaction[];
  };

  // Historia familiar (genética y hereditaria)
  familyHistory: {
    parents: FamilyMember[];
    siblings: FamilyMember[];
    grandparents: FamilyMember[];
    significantConditions: string[]; // diabetes, cáncer, cardiopatías, etc.
    geneticTesting?: GeneticTest[];
  };

  // Historia social y hábitos
  socialHistory: {
    occupation: string;
    occupationalHazards: string[];
    education: string;
    maritalStatus: string;
    children: number;
    livingConditions: string;
    exercise: ExerciseHabit;
    diet: DietaryHabit;
    tobacco: SubstanceUse;
    alcohol: SubstanceUse;
    drugs: SubstanceUse;
    sleep: SleepPattern;
    stress: StressLevel;
  };

  // Vacunación y prevención
  preventiveCare: {
    vaccinations: Vaccination[];
    screenings: Screening[];
    checkups: Checkup[];
    dentalCare: DentalRecord[];
    visionCare: VisionRecord[];
    gynecological?: GynecologicalRecord[];
    prostate?: ProstateRecord[];
  };

  // Salud mental
  mentalHealth: {
    currentStatus: string;
    history: MentalHealthHistory[];
    medications: PsychiatricMedication[];
    therapy: TherapyRecord[];
    hospitalizations: PsychiatricHospitalization[];
  };

  // Signos vitales y métricas basales (cuando está sano)
  baselineMetrics: {
    height: number;
    weight: number;
    bmi: number;
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    lastMeasured: Date;
  };

  // Documentos y archivos
  documents: {
    labResults: LabResult[];
    imagingStudies: ImagingStudy[];
    reports: MedicalReport[];
    prescriptions: Prescription[];
    certificates: MedicalCertificate[];
  };

  // Timeline de eventos médicos
  timeline: MedicalTimelineEvent[];

  // Preferencias médicas
  preferences: {
    preferredHospital?: string;
    preferredDoctor?: string;
    advanceDirectives?: AdvanceDirective;
    organDonor?: boolean;
    researchParticipation?: boolean;
    dataSharing?: DataSharingPreference;
  };

  // Estado actual (si está enfermo)
  currentHealth?: {
    chiefComplaint?: string;
    symptoms?: Symptom[];
    onset?: Date;
    severity?: 'mild' | 'moderate' | 'severe';
    urgencyLevel?: UrgencyResult;
  };
}

// Interfaces auxiliares para PHR
interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validUntil: Date;
  coverage: string[];
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
}

interface ChronicCondition {
  name: string;
  icd10Code?: string;
  diagnosedDate: Date;
  managedWith: string[];
  controlStatus: 'controlled' | 'uncontrolled' | 'remission';
}

interface PastIllness {
  name: string;
  date: Date;
  duration: string;
  treatment: string;
  complications?: string[];
  resolved: boolean;
}

interface Hospitalization {
  reason: string;
  hospital: string;
  admissionDate: Date;
  dischargeDate: Date;
  procedures?: string[];
  complications?: string[];
}

interface Surgery {
  procedure: string;
  date: Date;
  hospital: string;
  surgeon?: string;
  anesthesia: string;
  complications?: string[];
  outcome: string;
}

interface Accident {
  type: string;
  date: Date;
  injuries: string[];
  treatment: string;
  sequelae?: string[];
}

interface BloodTransfusion {
  date: Date;
  reason: string;
  units: number;
  reactions?: string[];
}

interface Allergy {
  allergen: string;
  type: 'medication' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  symptoms: string[];
  confirmedBy?: 'history' | 'testing';
}

interface AdverseReaction {
  substance: string;
  reaction: string;
  date?: Date;
  severity: string;
}

interface FamilyMember {
  relationship: string;
  alive: boolean;
  ageOrDeathAge?: number;
  conditions: string[];
  causeOfDeath?: string;
}

interface GeneticTest {
  test: string;
  date: Date;
  result: string;
  implications?: string[];
}

interface ExerciseHabit {
  frequency: string;
  type: string[];
  duration: string;
  intensity: 'low' | 'moderate' | 'high';
}

interface DietaryHabit {
  type: string; // vegetarian, vegan, omnivore, etc.
  restrictions: string[];
  supplements: string[];
  waterIntake: string;
}

interface SubstanceUse {
  use: 'never' | 'former' | 'current';
  amount?: string;
  frequency?: string;
  quitDate?: Date;
  yearsOfUse?: number;
}

interface SleepPattern {
  hoursPerNight: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  issues?: string[];
}

interface StressLevel {
  level: 'low' | 'moderate' | 'high' | 'severe';
  sources: string[];
  copingMechanisms: string[];
}

interface Vaccination {
  vaccine: string;
  date: Date;
  booster?: boolean;
  nextDue?: Date;
  lotNumber?: string;
}

interface Screening {
  type: string;
  date: Date;
  result: string;
  nextDue: Date;
}

interface Checkup {
  date: Date;
  doctor: string;
  findings: string[];
  recommendations: string[];
}

interface DentalRecord {
  date: Date;
  procedure: string;
  dentist: string;
  findings?: string[];
}

interface VisionRecord {
  date: Date;
  prescription?: {
    rightEye: string;
    leftEye: string;
  };
  conditions?: string[];
}

interface GynecologicalRecord {
  lastPap: Date;
  lastMammogram?: Date;
  pregnancies?: number;
  births?: number;
  menstrualHistory?: string;
}

interface ProstateRecord {
  lastPSA: Date;
  psaValue?: number;
  lastExam: Date;
  findings?: string[];
}

interface MentalHealthHistory {
  condition: string;
  diagnosedDate?: Date;
  treatment: string[];
  status: 'active' | 'remission' | 'resolved';
}

interface PsychiatricMedication {
  name: string;
  dosage: string;
  startDate: Date;
  endDate?: Date;
  effectiveness: string;
}

interface TherapyRecord {
  type: string;
  therapist?: string;
  startDate: Date;
  endDate?: Date;
  frequency: string;
}

interface PsychiatricHospitalization {
  facility: string;
  admissionDate: Date;
  dischargeDate: Date;
  reason: string;
  treatment: string[];
}

interface LabResult {
  test: string;
  date: Date;
  values: Record<string, any>;
  abnormal?: string[];
  fileUrl?: string;
}

interface ImagingStudy {
  type: string;
  date: Date;
  bodyPart: string;
  findings: string;
  fileUrl?: string;
}

interface MedicalReport {
  type: string;
  date: Date;
  author: string;
  content: string;
  fileUrl?: string;
}

interface Prescription {
  medication: string;
  prescribedBy: string;
  date: Date;
  instructions: string;
  fileUrl?: string;
}

interface MedicalCertificate {
  type: string;
  issuedDate: Date;
  validUntil?: Date;
  purpose: string;
  fileUrl?: string;
}

interface MedicalTimelineEvent {
  date: Date;
  type:
    | 'diagnosis'
    | 'procedure'
    | 'medication'
    | 'vaccination'
    | 'screening'
    | 'hospitalization'
    | 'emergency';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  documents?: string[];
}

interface AdvanceDirective {
  livingWill?: boolean;
  dnr?: boolean;
  powerOfAttorney?: string;
  specificInstructions?: string;
}

interface DataSharingPreference {
  shareWithFamily: boolean;
  shareWithResearch: boolean;
  shareWithInsurance: boolean;
  anonymousDataSharing: boolean;
}

interface ManusInput {
  message: string;
  context: AltaConversationContext;
  patientHistory?: any[];
  sessionId: string;
  mode: AnamnesisMode;
  isFirstTime?: boolean;
}

interface ManusResponse {
  text: string;
  entities: MedicalEntities;
  urgencyLevel: number;
  clinicalInsights: ClinicalInsight[];
  suggestedQuestions: string[];
  differentialDiagnosis?: DiagnosisOption[];
  recommendedActions?: string[];
  emotion: 'empathetic' | 'concerned' | 'urgent' | 'reassuring';
}

interface MedicalAnalysis {
  symptoms: Symptom[];
  conditions: Condition[];
  medications: Medication[];
  vitals: VitalSign[];
  timeline: TimelineEvent[];
  riskFactors: string[];
}

interface MedicalEntities {
  symptoms: string[];
  bodyParts: string[];
  medications: string[];
  conditions: string[];
  temporalExpressions: string[];
  measurements: { value: number; unit: string; type: string }[];
}

interface UrgencyResult {
  level: 'routine' | 'urgent' | 'emergency';
  score: number;
  reasons: string[];
  recommendedTimeframe: string;
  triageCategory: number;
}

interface ClinicalInsight {
  type: 'warning' | 'info' | 'critical';
  message: string;
  relevance: number;
  sources: string[];
}

interface DiagnosisOption {
  condition: string;
  probability: number;
  supportingSymptoms: string[];
  contradictingSymptoms: string[];
  additionalTestsNeeded: string[];
}

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  frequency: string;
  triggers?: string[];
  relievers?: string[];
}

interface Condition {
  name: string;
  icd10Code?: string;
  diagnosedDate?: string;
  status: 'active' | 'resolved' | 'chronic';
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  reason: string;
}

interface VitalSign {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  isAbnormal: boolean;
}

interface TimelineEvent {
  date: string;
  event: string;
  category: 'symptom' | 'diagnosis' | 'treatment' | 'test';
  importance: 'low' | 'medium' | 'high';
}

// GenSpark SDK - Dynamic Content Generation
interface GenSparkSDK {
  initialize(config: GenSparkConfig): Promise<void>;
  generateDocument(params: DocumentParams): Promise<GeneratedDocument>;
  createForm(params: FormParams): Promise<DynamicForm>;
  generateEducationalContent(topic: string, level: string): Promise<EducationalContent>;
  createVisualization(data: any, type: string): Promise<Visualization>;
}

interface GenSparkConfig {
  apiKey: string;
  templates: 'medical' | 'clinical' | 'patient-friendly';
  outputFormat: 'html' | 'pdf' | 'markdown' | 'fhir';
  language: string;
  complianceStandards: string[];
}

interface DocumentParams {
  type: 'anamnesis' | 'clinical-summary' | 'referral' | 'prescription' | 'lab-order';
  data: any;
  style: 'professional' | 'patient-friendly' | 'detailed';
  includeRecommendations: boolean;
}

interface GeneratedDocument {
  content: string;
  format: string;
  metadata: {
    generatedAt: string;
    version: string;
    compliance: string[];
    digitalSignature?: string;
  };
  sections: DocumentSection[];
  attachments?: any[];
}

interface DocumentSection {
  title: string;
  content: string;
  type: 'text' | 'table' | 'list' | 'chart';
  importance: 'required' | 'recommended' | 'optional';
}

interface FormParams {
  purpose: 'intake' | 'followup' | 'screening' | 'consent';
  specialty: string;
  patientProfile: any;
  requiredFields: string[];
  conditionalLogic: boolean;
}

interface DynamicForm {
  fields: FormField[];
  validation: ValidationRule[];
  layout: 'single-column' | 'multi-column' | 'wizard';
  submitEndpoint: string;
  saveProgress: boolean;
}

interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: any[];
  validation?: string;
  conditional?: {
    showIf: string;
    value: any;
  };
}

interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

interface EducationalContent {
  title: string;
  content: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  readingTime: number;
  keyPoints: string[];
  references: string[];
  multimedia?: {
    images: string[];
    videos: string[];
    infographics: string[];
  };
}

interface Visualization {
  type: 'chart' | 'timeline' | 'anatomy' | 'flowchart';
  data: any;
  interactive: boolean;
  exportFormats: string[];
  accessibility: {
    altText: string;
    description: string;
  };
}

/**
 * Alta Agent mejorado con capacidades de IA reales
 * Integra Manus para conversación y GenSpark para generación de contenido
 */
export class AltaAgentWithAI extends AltaAgent {
  private manus?: ManusSDK;
  private genSpark?: GenSparkSDK;
  private isAIInitialized: boolean = false;
  private conversationMemory: Map<string, any> = new Map();
  private clinicalContext: Map<string, any> = new Map();
  private healthProfile: Map<string, PersonalHealthRecord> = new Map();
  private anamnesisMode: AnamnesisMode = 'complete';
  private currentSection: AnamnesisSection = 'identification';
  private completedSections: Set<AnamnesisSection> = new Set();

  constructor(config: Partial<AltaConfig> & { mode?: AnamnesisMode } = {}) {
    super(config);
    this.anamnesisMode = config.mode || 'complete';
    this.initializeAIAgents();
  }

  /**
   * Inicializar los agentes de IA
   */
  private async initializeAIAgents(): Promise<void> {
    try {
      // Inicializar Manus SDK para procesamiento conversacional
      if (process.env.NEXT_PUBLIC_MANUS_API_KEY) {
        this.manus = await this.createManusInstance();
        await this.manus.initialize({
          apiKey: process.env.NEXT_PUBLIC_MANUS_API_KEY,
          model: 'clinical-reasoning',
          language: (this as any).config.personality.language,
          specialtyContext: (this as any).config.personality.specialties || ['medicina-general'],
          complianceMode: 'Argentina',
        });
      }

      // Inicializar GenSpark SDK para generación de contenido
      if (process.env.NEXT_PUBLIC_GENSPARK_API_KEY) {
        this.genSpark = await this.createGenSparkInstance();
        await this.genSpark.initialize({
          apiKey: process.env.NEXT_PUBLIC_GENSPARK_API_KEY,
          templates: 'medical',
          outputFormat: 'html',
          language: (this as any).config.personality.language,
          complianceStandards: ['Argentina-Ley-26529', 'HIPAA'],
        });
      }

      this.isAIInitialized = !!(this.manus || this.genSpark);

      if (this.isAIInitialized) {
        logger.info('✅ AI Agents initialized successfully');
        this.emit('ai.initialized', { manus: !!this.manus, genSpark: !!this.genSpark });
      }
    } catch (error) {
      logger.error('Error initializing AI agents:', error);
      // Fallback to base implementation if AI fails
      this.isAIInitialized = false;
    }
  }

  /**
   * Crear instancia de Manus SDK (placeholder para SDK real)
   */
  private async createManusInstance(): Promise<ManusSDK> {
    // TODO: Cuando tengas el SDK real, reemplazar con:
    // return new ManusSDK();

    // Implementación simulada para demostración
    return {
      initialize: async (config: ManusConfig) => {
        logger.info('Manus SDK initialized with config:', config);
      },

      processConversation: async (input: ManusInput): Promise<ManusResponse> => {
        // Procesamiento diferenciado según modo de anamnesis
        if (input.mode === 'preventive') {
          // Modo preventivo: enfoque en recolección de datos históricos
          return {
            text: this.generatePreventiveResponse(input.message, input.context),
            entities: await this.extractMedicalEntities(input.message),
            urgencyLevel: 0,
            clinicalInsights: [],
            suggestedQuestions: this.generatePreventiveQuestions(input.context),
            recommendedActions: ['Completar perfil de salud', 'Programar chequeo anual'],
            emotion: 'empathetic',
          };
        } else if (input.mode === 'illness' || input.mode === 'emergency') {
          // Modo enfermedad: detección de urgencias activa
          const urgencyKeywords = ['dolor pecho', 'falta aire', 'desmayo', 'sangrado'];
          const hasUrgency = urgencyKeywords.some((kw) => input.message.toLowerCase().includes(kw));

          return {
            text: this.generateIntelligentResponse(input.message, hasUrgency),
            entities: await this.extractMedicalEntities(input.message),
            urgencyLevel: hasUrgency ? 0.8 : 0.2,
            clinicalInsights: this.generateClinicalInsights(input.message),
            suggestedQuestions: this.generateFollowUpQuestions(input.context),
            differentialDiagnosis: hasUrgency
              ? this.generateDifferentialDiagnosis(input.message)
              : undefined,
            recommendedActions: hasUrgency
              ? ['Consultar médico inmediatamente', 'Ir a emergencias']
              : [],
            emotion: hasUrgency ? 'urgent' : 'empathetic',
          };
        } else {
          // Modo completo: combina ambos enfoques
          const hasSymptoms = this.detectCurrentSymptoms(input.message);

          return {
            text: this.generateCompleteResponse(input.message, input.context, hasSymptoms),
            entities: await this.extractMedicalEntities(input.message),
            urgencyLevel: hasSymptoms ? 0.5 : 0,
            clinicalInsights: hasSymptoms ? this.generateClinicalInsights(input.message) : [],
            suggestedQuestions: this.generateCompleteQuestions(input.context, this.currentSection),
            recommendedActions: this.getRecommendedActions(input.mode, hasSymptoms),
            emotion: 'empathetic',
          };
        }
      },

      analyzeMedicalText: async (text: string): Promise<MedicalAnalysis> => {
        return {
          symptoms: this.extractSymptoms(text),
          conditions: [],
          medications: [],
          vitals: [],
          timeline: [],
          riskFactors: [],
        };
      },

      detectUrgency: async (symptoms: string[]): Promise<UrgencyResult> => {
        const urgentSymptoms = [
          'dolor torácico',
          'dificultad respiratoria',
          'pérdida de conciencia',
        ];
        const hasUrgent = symptoms.some((s) => urgentSymptoms.some((us) => s.includes(us)));

        return {
          level: hasUrgent ? 'emergency' : 'routine',
          score: hasUrgent ? 0.9 : 0.3,
          reasons: hasUrgent ? ['Síntomas de emergencia detectados'] : [],
          recommendedTimeframe: hasUrgent ? 'Inmediato' : 'Dentro de 48 horas',
          triageCategory: hasUrgent ? 1 : 4,
        };
      },

      extractEntities: async (text: string): Promise<MedicalEntities> => {
        return this.extractMedicalEntities(text);
      },

      generateFollowUp: async (context: any): Promise<string[]> => {
        return this.generateFollowUpQuestions(context);
      },
    };
  }

  /**
   * Crear instancia de GenSpark SDK (placeholder para SDK real)
   */
  private async createGenSparkInstance(): Promise<GenSparkSDK> {
    // TODO: Cuando tengas el SDK real, reemplazar con:
    // return new GenSparkSDK();

    // Implementación simulada para demostración
    return {
      initialize: async (config: GenSparkConfig) => {
        logger.info('GenSpark SDK initialized with config:', config);
      },

      generateDocument: async (params: DocumentParams): Promise<GeneratedDocument> => {
        const sections = this.generateDocumentSections(params);

        return {
          content: sections.map((s) => s.content).join('\n\n'),
          format: 'html',
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            compliance: ['Argentina-Ley-26529'],
            digitalSignature: 'SHA256:' + Math.random().toString(36),
          },
          sections,
          attachments: [],
        };
      },

      createForm: async (params: FormParams): Promise<DynamicForm> => {
        return {
          fields: this.generateFormFields(params),
          validation: [],
          layout: 'wizard',
          submitEndpoint: '/api/v1/anamnesis/submit',
          saveProgress: true,
        };
      },

      generateEducationalContent: async (
        topic: string,
        level: string,
      ): Promise<EducationalContent> => {
        return {
          title: `Información sobre ${topic}`,
          content: `Contenido educativo adaptado sobre ${topic}...`,
          difficulty: level as any,
          readingTime: 5,
          keyPoints: ['Punto 1', 'Punto 2', 'Punto 3'],
          references: ['Álvarez - Semiología Médica'],
          multimedia: {
            images: [],
            videos: [],
            infographics: [],
          },
        };
      },

      createVisualization: async (data: any, type: string): Promise<Visualization> => {
        return {
          type: type as any,
          data,
          interactive: true,
          exportFormats: ['png', 'svg', 'pdf'],
          accessibility: {
            altText: 'Visualización médica',
            description: 'Gráfico interactivo de datos médicos',
          },
        };
      },
    };
  }

  /**
   * Procesar mensaje con IA mejorada
   */
  async processMessage(message: string): Promise<AltaMessage> {
    // Si no hay IA, usar implementación base
    if (!this.isAIInitialized || !this.manus) {
      return super.processMessage(message);
    }

    try {
      // Actualizar estado
      this.state = 'thinking';
      this.emit('state.changed', this.state);

      // Procesar con Manus AI
      const manusResponse = await this.manus.processConversation({
        message,
        context: this.conversationContext!,
        patientHistory: this.conversationMemory.get(this.conversationContext?.patientId || ''),
        sessionId: this.conversationContext?.sessionId || '',
        mode: this.anamnesisMode,
      });

      // Actualizar análisis clínico
      if (manusResponse.clinicalInsights.length > 0) {
        const analysis = await this.manus.analyzeMedicalText(message);
        this.clinicalContext.set(this.conversationContext?.patientId || '', analysis);
      }

      // Detectar urgencia con IA
      if (manusResponse.urgencyLevel > 0.7) {
        this.emotion = 'urgent';
        this.emit('urgency.detected', {
          level: manusResponse.urgencyLevel,
          reasons: manusResponse.recommendedActions,
          timestamp: new Date(),
        });
      } else {
        this.emotion = manusResponse.emotion as AltaEmotion;
      }

      // Actualizar contexto de conversación
      if (this.conversationContext) {
        this.conversationContext.topics = [
          ...this.conversationContext.topics,
          ...manusResponse.entities.symptoms,
          ...manusResponse.entities.conditions,
        ];

        // Agregar preguntas sugeridas al contexto
        this.conversationContext.suggestedQuestions = manusResponse.suggestedQuestions;
      }

      // Construir respuesta de Alta
      const altaMessage: AltaMessage = {
        text: manusResponse.text,
        emotion: this.emotion,
        timestamp: new Date(),
        metadata: {
          confidence: 0.9,
          source: 'manus-ai',
          processingTime: 0,
          aiModel: 'manus-clinical-v2',
          urgencyScore: manusResponse.urgencyLevel,
          entities: manusResponse.entities,
          insights: manusResponse.clinicalInsights,
        },
        suggestions: manusResponse.suggestedQuestions,
        attachments: manusResponse.differentialDiagnosis
          ? [
              {
                type: 'differential-diagnosis',
                content: JSON.stringify(manusResponse.differentialDiagnosis),
                mimeType: 'application/json',
              },
            ]
          : undefined,
      };

      // Guardar en historial
      this.addToHistory('alta', altaMessage.text);

      // Actualizar estado
      this.state = 'speaking';
      this.emit('state.changed', this.state);
      this.emit('message.sent', altaMessage);

      return {
        id: Math.random().toString(36).substring(7),
        text: altaMessage.text,
        sender: 'alta',
        timestamp: altaMessage.timestamp,
        emotion: altaMessage.emotion,
        metadata: altaMessage.metadata,
      };
    } catch (error) {
      logger.error('Error processing message with AI:', error);
      // Fallback to base implementation
      return super.processMessage(message);
    }
  }

  /**
   * Generar resumen de anamnesis con GenSpark
   */
  async generateSummary(): Promise<string> {
    if (!this.genSpark || !this.conversationContext) {
      return super.generateSummary();
    }

    try {
      // Obtener análisis clínico acumulado
      const clinicalAnalysis = this.clinicalContext.get(this.conversationContext.patientId);

      // Generar documento de anamnesis con GenSpark
      const document = await this.genSpark.generateDocument({
        type: 'anamnesis',
        data: {
          patient: this.conversationContext.patientId,
          sessionDate: this.conversationContext.startTime,
          duration: Date.now() - this.conversationContext.startTime.getTime(),
          chiefComplaint: this.conversationContext.chiefComplaint,
          history: this.history,
          clinicalAnalysis,
          topics: this.conversationContext.topics,
        },
        style: 'professional',
        includeRecommendations: true,
      });

      // Generar visualización timeline si hay eventos
      if ((clinicalAnalysis as any)?.timeline?.length) {
        const timeline = await this.genSpark.createVisualization(
          (clinicalAnalysis as any).timeline,
          'timeline',
        );

        // Agregar visualización al documento
        document.attachments = [timeline];
      }

      // Emitir evento con documento completo
      this.emit('document.generated', document);

      return document.content;
    } catch (error) {
      logger.error('Error generating summary with AI:', error);
      return super.generateSummary();
    }
  }

  /**
   * Generar formulario dinámico para anamnesis
   */
  async generateDynamicForm(purpose: string, specialty: string): Promise<DynamicForm | null> {
    if (!this.genSpark) return null;

    try {
      const form = await this.genSpark.createForm({
        purpose: purpose as any,
        specialty,
        patientProfile: {
          id: this.conversationContext?.patientId,
          age: this.conversationContext?.patientAge,
          gender: this.conversationContext?.patientGender,
        },
        requiredFields: ['motivo_consulta', 'sintomas_actuales', 'antecedentes'],
        conditionalLogic: true,
      });

      this.emit('form.generated', form);
      return form;
    } catch (error) {
      logger.error('Error generating dynamic form:', error);
      return null;
    }
  }

  /**
   * Generar contenido educativo para el paciente
   */
  async generateEducationalContent(topic: string): Promise<EducationalContent | null> {
    if (!this.genSpark) return null;

    try {
      // Determinar nivel basado en el perfil del paciente
      const level = 'intermediate'; // Podría ser dinámico basado en el paciente

      const content = await this.genSpark.generateEducationalContent(topic, level);

      this.emit('education.generated', content);
      return content;
    } catch (error) {
      logger.error('Error generating educational content:', error);
      return null;
    }
  }

  /**
   * Obtener diagnóstico diferencial con IA
   */
  async getDifferentialDiagnosis(): Promise<DiagnosisOption[] | null> {
    if (!this.manus || !this.conversationContext) return null;

    try {
      const symptoms = this.conversationContext.topics.filter(
        (t) =>
          t.toLowerCase().includes('dolor') ||
          t.toLowerCase().includes('molestia') ||
          t.toLowerCase().includes('síntoma'),
      );

      const urgencyResult = await this.manus.detectUrgency(symptoms);

      if (urgencyResult.level !== 'routine') {
        // Solo generar diagnóstico diferencial para casos no rutinarios
        const response = await this.manus.processConversation({
          message: `Diagnóstico diferencial para: ${symptoms.join(', ')}`,
          context: this.conversationContext,
          sessionId: this.conversationContext.sessionId,
          mode: this.anamnesisMode,
        });

        return response.differentialDiagnosis || null;
      }

      return null;
    } catch (error) {
      logger.error('Error getting differential diagnosis:', error);
      return null;
    }
  }

  // Métodos auxiliares para la simulación (serán reemplazados por el SDK real)

  private generateIntelligentResponse(message: string, hasUrgency: boolean): string {
    if (hasUrgency) {
      return (
        `Entiendo que estás experimentando síntomas que requieren atención médica inmediata. ` +
        `Es importante que busques ayuda médica de urgencia. Mientras tanto, ` +
        `¿podés decirme desde cuándo tenés estos síntomas y si hay algo que los mejore o empeore?`
      );
    }

    const responses = [
      `Comprendo lo que me contás. Para ayudarte mejor, ¿podés darme más detalles sobre...`,
      `Es importante que hablemos sobre esto. Contame, ¿cómo empezó este síntoma?`,
      `Entiendo tu preocupación. Vamos a explorar esto juntos. ¿Desde cuándo notaste...`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private async extractMedicalEntities(text: string): Promise<MedicalEntities> {
    // Simulación de extracción de entidades médicas
    const entities: MedicalEntities = {
      symptoms: [],
      bodyParts: [],
      medications: [],
      conditions: [],
      temporalExpressions: [],
      measurements: [],
    };

    // Detectar síntomas
    const symptomPatterns = ['dolor', 'fiebre', 'tos', 'mareo', 'náuseas', 'fatiga'];
    symptomPatterns.forEach((pattern) => {
      if (text.toLowerCase().includes(pattern)) {
        entities.symptoms.push(pattern);
      }
    });

    // Detectar partes del cuerpo
    const bodyPartPatterns = ['cabeza', 'pecho', 'estómago', 'espalda', 'piernas'];
    bodyPartPatterns.forEach((pattern) => {
      if (text.toLowerCase().includes(pattern)) {
        entities.bodyParts.push(pattern);
      }
    });

    // Detectar expresiones temporales
    const temporalPatterns = ['hace', 'desde', 'durante', 'días', 'semanas', 'meses'];
    temporalPatterns.forEach((pattern) => {
      if (text.toLowerCase().includes(pattern)) {
        entities.temporalExpressions.push(pattern);
      }
    });

    // Detectar mediciones
    const measurementRegex = /(\d+\.?\d*)\s*(°C|mg|ml|cm|kg|mmHg)/gi;
    const matches = text.matchAll(measurementRegex);
    for (const match of matches) {
      entities.measurements.push({
        value: parseFloat(match[1]),
        unit: match[2],
        type: this.inferMeasurementType(match[2]),
      });
    }

    return entities;
  }

  private inferMeasurementType(unit: string): string {
    const typeMap: Record<string, string> = {
      '°C': 'temperature',
      mg: 'dosage',
      ml: 'volume',
      cm: 'length',
      kg: 'weight',
      mmHg: 'blood_pressure',
    };
    return typeMap[unit] || 'unknown';
  }

  private generateClinicalInsights(message: string): ClinicalInsight[] {
    const insights: ClinicalInsight[] = [];

    // Detectar patrones críticos
    if (message.toLowerCase().includes('dolor pecho')) {
      insights.push({
        type: 'critical',
        message: 'Dolor torácico requiere evaluación cardiovascular inmediata',
        relevance: 1.0,
        sources: ['ACC/AHA Guidelines', 'Álvarez - Semiología'],
      });
    }

    if (message.toLowerCase().includes('fiebre') && message.toLowerCase().includes('tos')) {
      insights.push({
        type: 'warning',
        message: 'Síntomas respiratorios con fiebre requieren evaluación por posible infección',
        relevance: 0.8,
        sources: ['CDC Guidelines', 'WHO Respiratory Infections'],
      });
    }

    return insights;
  }

  private generateFollowUpQuestions(context: AltaConversationContext): string[] {
    const questions: string[] = [];

    // Preguntas basadas en el contexto
    if (context.chiefComplaint?.includes('dolor')) {
      questions.push(
        '¿El dolor es constante o va y viene?',
        '¿Hay algo que mejore o empeore el dolor?',
        'En una escala del 1 al 10, ¿qué tan intenso es el dolor?',
      );
    }

    if (context.topics.some((t) => t.includes('medicamento'))) {
      questions.push(
        '¿Tenés alguna alergia a medicamentos?',
        '¿Qué medicamentos estás tomando actualmente?',
      );
    }

    // Preguntas generales si no hay contexto específico
    if (questions.length === 0) {
      questions.push(
        '¿Tenés antecedentes médicos importantes?',
        '¿Hay antecedentes familiares de enfermedades?',
        '¿Tomás algún medicamento regularmente?',
      );
    }

    return questions;
  }

  private generateDifferentialDiagnosis(message: string): DiagnosisOption[] {
    const diagnoses: DiagnosisOption[] = [];

    if (message.toLowerCase().includes('dolor pecho')) {
      diagnoses.push(
        {
          condition: 'Angina de pecho',
          probability: 0.4,
          supportingSymptoms: ['dolor torácico', 'disnea'],
          contradictingSymptoms: [],
          additionalTestsNeeded: ['ECG', 'Troponinas', 'Radiografía de tórax'],
        },
        {
          condition: 'Reflujo gastroesofágico',
          probability: 0.3,
          supportingSymptoms: ['dolor retroesternal', 'acidez'],
          contradictingSymptoms: ['disnea severa'],
          additionalTestsNeeded: ['Endoscopia'],
        },
      );
    }

    return diagnoses;
  }

  private extractSymptoms(text: string): Symptom[] {
    const symptoms: Symptom[] = [];

    // Lógica simplificada de extracción
    if (text.toLowerCase().includes('dolor')) {
      symptoms.push({
        name: 'Dolor',
        severity: 'moderate',
        duration: 'Reciente',
        frequency: 'Constante',
      });
    }

    return symptoms;
  }

  private generateDocumentSections(params: DocumentParams): DocumentSection[] {
    const sections: DocumentSection[] = [];

    sections.push({
      title: 'Motivo de Consulta',
      content: params.data.chiefComplaint || 'No especificado',
      type: 'text',
      importance: 'required',
    });

    sections.push({
      title: 'Historia de Enfermedad Actual',
      content: this.formatHistory(params.data.history),
      type: 'text',
      importance: 'required',
    });

    if (params.includeRecommendations) {
      sections.push({
        title: 'Recomendaciones',
        content: 'Seguimiento médico recomendado',
        type: 'list',
        importance: 'recommended',
      });
    }

    return sections;
  }

  private formatHistory(history: any[]): string {
    if (!history || history.length === 0) return 'Sin historial disponible';

    return history.map((h) => `${new Date(h.timestamp).toLocaleString()}: ${h.text}`).join('\n');
  }

  private generateFormFields(params: FormParams): FormField[] {
    const fields: FormField[] = [];

    // Campos básicos para anamnesis
    fields.push(
      {
        id: 'motivo_consulta',
        type: 'text',
        label: 'Motivo de Consulta',
        required: true,
        validation: 'minLength:10',
      },
      {
        id: 'sintomas_actuales',
        type: 'text',
        label: 'Síntomas Actuales',
        required: true,
        validation: 'minLength:20',
      },
      {
        id: 'duracion_sintomas',
        type: 'select',
        label: 'Duración de los Síntomas',
        required: true,
        options: [
          { value: 'horas', label: 'Horas' },
          { value: 'dias', label: 'Días' },
          { value: 'semanas', label: 'Semanas' },
          { value: 'meses', label: 'Meses' },
        ],
      },
    );

    // Campos condicionales según especialidad
    if (params.specialty === 'cardiologia') {
      fields.push({
        id: 'dolor_toracico',
        type: 'checkbox',
        label: '¿Presenta dolor torácico?',
        required: false,
      });
    }

    return fields;
  }

  /**
   * Obtener capacidades de IA disponibles
   */
  getAICapabilities(): {
    manus: boolean;
    genSpark: boolean;
    features: string[];
  } {
    const features: string[] = [];

    if (this.manus) {
      features.push(
        'Procesamiento conversacional inteligente',
        'Análisis médico con NLP',
        'Detección de urgencias con IA',
        'Extracción de entidades médicas',
        'Diagnóstico diferencial',
      );
    }

    if (this.genSpark) {
      features.push(
        'Generación de documentos médicos',
        'Formularios dinámicos adaptivos',
        'Contenido educativo personalizado',
        'Visualizaciones médicas interactivas',
      );
    }

    return {
      manus: !!this.manus,
      genSpark: !!this.genSpark,
      features,
    };
  }

  /**
   * Métodos específicos para anamnesis preventiva
   */

  private generatePreventiveResponse(message: string, context: AltaConversationContext): string {
    const responses: Record<AnamnesisSection, string> = {
      identification:
        'Excelente, empecemos creando tu perfil de salud. ¿Cuál es tu nombre completo y fecha de nacimiento?',
      demographics:
        'Perfecto. Ahora necesito algunos datos básicos. ¿Cuál es tu tipo de sangre si lo conocés? ¿Tenés obra social?',
      past_medical_history:
        'Hablemos de tu historia médica. ¿Qué enfermedades tuviste en la infancia? ¿Sarampión, varicela, paperas?',
      surgical_history:
        '¿Te han operado alguna vez? Incluyendo cirugías menores como muelas del juicio.',
      medications: '¿Tomás algún medicamento regularmente? Incluí vitaminas y suplementos.',
      allergies: '¿Tenés alguna alergia conocida? Medicamentos, alimentos, polen, etc.',
      family_history:
        'Contame sobre la salud de tu familia. ¿Tus padres están vivos? ¿Qué condiciones médicas tienen o tuvieron?',
      social_history: '¿A qué te dedicás? ¿Hacés ejercicio regularmente? ¿Cómo es tu dieta?',
      habits: 'Hablemos de hábitos. ¿Fumás o fumaste? ¿Consumís alcohol? ¿Cuántas horas dormís?',
      vaccinations:
        '¿Tenés tu calendario de vacunación al día? ¿Recordás cuándo fue tu última vacuna antigripal?',
      preventive_care:
        '¿Cuándo fue tu último chequeo médico completo? ¿Te hacés controles anuales?',
      mental_health: '¿Cómo está tu salud mental? ¿Sentís estrés? ¿Dormís bien?',
      emergency_contacts: 'Por último, ¿quién deberíamos contactar en caso de emergencia?',
      // ... agregar todas las secciones
    } as any;

    return responses[this.currentSection] || 'Continuemos completando tu perfil de salud...';
  }

  private generatePreventiveQuestions(context: AltaConversationContext): string[] {
    const questions: string[] = [];

    // Preguntas según la sección actual
    switch (this.currentSection) {
      case 'past_medical_history':
        questions.push(
          '¿Tuviste varicela en la infancia?',
          '¿Alguna hospitalización previa?',
          '¿Fracturas o accidentes importantes?',
        );
        break;
      case 'family_history':
        questions.push(
          '¿Hay diabetes en tu familia?',
          '¿Antecedentes de cáncer?',
          '¿Enfermedades cardíacas?',
          '¿Hipertensión?',
        );
        break;
      case 'vaccinations':
        questions.push('¿Tenés la vacuna del COVID-19?', '¿Hepatitis B?', '¿Última antitetánica?');
        break;
      default:
        questions.push(
          '¿Querés agregar algo más sobre este tema?',
          '¿Hay algo importante que no hayamos cubierto?',
        );
    }

    return questions;
  }

  private generateCompleteResponse(
    message: string,
    context: AltaConversationContext,
    hasSymptoms: boolean,
  ): string {
    if (hasSymptoms) {
      return 'Entiendo que tenés síntomas actuales. Vamos a documentarlos, pero también completaremos tu perfil de salud completo para tener toda la información.';
    }

    return 'Excelente decisión completar tu perfil de salud. Esto nos ayudará a brindarte mejor atención cuando lo necesites. Continuemos...';
  }

  private generateCompleteQuestions(
    context: AltaConversationContext,
    section: AnamnesisSection,
  ): string[] {
    // Combina preguntas preventivas y de enfermedad según el contexto
    const preventive = this.generatePreventiveQuestions(context);
    const clinical = this.generateFollowUpQuestions(context);

    return [...new Set([...preventive, ...clinical])].slice(0, 5);
  }

  private detectCurrentSymptoms(message: string): boolean {
    const symptomKeywords = [
      'dolor',
      'duele',
      'molestia',
      'ardor',
      'fiebre',
      'temperatura',
      'calor',
      'tos',
      'flema',
      'mocos',
      'mareo',
      'vértigo',
      'inestable',
      'náuseas',
      'vómito',
      'malestar',
      'cansancio',
      'fatiga',
      'débil',
    ];

    const lowerMessage = message.toLowerCase();
    return symptomKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private getRecommendedActions(mode: AnamnesisMode, hasSymptoms: boolean): string[] {
    const actions: string[] = [];

    if (mode === 'preventive') {
      actions.push(
        'Completar todas las secciones del perfil',
        'Subir resultados de laboratorios recientes',
        'Programar chequeo anual',
      );
    }

    if (hasSymptoms) {
      actions.push('Documentar síntomas actuales', 'Considerar consulta médica');
    }

    if (mode === 'complete') {
      actions.push(
        'Guardar perfil de salud',
        'Configurar recordatorios de vacunas',
        'Establecer médico de cabecera',
      );
    }

    return actions;
  }

  /**
   * Iniciar sesión de anamnesis con modo específico
   */
  async startAnamnesisSession(patientId: string, mode: AnamnesisMode): Promise<AltaMessage> {
    this.anamnesisMode = mode;
    this.currentSection = mode === 'illness' ? 'chief_complaint' : 'identification';
    this.completedSections.clear();

    // Recuperar o crear PHR
    let phr = this.healthProfile.get(patientId);
    if (!phr) {
      phr = this.createEmptyPHR(patientId, mode);
      this.healthProfile.set(patientId, phr);
    }

    const greeting = this.getGreetingByMode(mode);

    // Iniciar sesión base
    const response = await this.startSession(patientId);

    return {
      ...response,
      text: greeting,
    };
  }

  private createEmptyPHR(patientId: string, mode: AnamnesisMode): PersonalHealthRecord {
    return {
      id: `phr-${Date.now()}`,
      patientId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      mode,
      demographics: {
        fullName: '',
        dateOfBirth: new Date(),
        gender: '',
        emergencyContacts: [],
      },
      medicalHistory: {
        childhoodDiseases: [],
        chronicConditions: [],
        pastIllnesses: [],
        hospitalizations: [],
        surgeries: [],
        accidents: [],
        transfusions: [],
      },
      pharmacological: {
        currentMedications: [],
        pastMedications: [],
        allergies: [],
        adverseReactions: [],
      },
      familyHistory: {
        parents: [],
        siblings: [],
        grandparents: [],
        significantConditions: [],
      },
      socialHistory: {
        occupation: '',
        occupationalHazards: [],
        education: '',
        maritalStatus: '',
        children: 0,
        livingConditions: '',
        exercise: { frequency: '', type: [], duration: '', intensity: 'moderate' },
        diet: { type: '', restrictions: [], supplements: [], waterIntake: '' },
        tobacco: { use: 'never' },
        alcohol: { use: 'never' },
        drugs: { use: 'never' },
        sleep: { hoursPerNight: 8, quality: 'good' },
        stress: { level: 'moderate', sources: [], copingMechanisms: [] },
      },
      preventiveCare: {
        vaccinations: [],
        screenings: [],
        checkups: [],
        dentalCare: [],
        visionCare: [],
      },
      mentalHealth: {
        currentStatus: '',
        history: [],
        medications: [],
        therapy: [],
        hospitalizations: [],
      },
      baselineMetrics: {
        height: 0,
        weight: 0,
        bmi: 0,
        bloodPressure: { systolic: 120, diastolic: 80 },
        heartRate: 70,
        temperature: 36.5,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        lastMeasured: new Date(),
      },
      documents: {
        labResults: [],
        imagingStudies: [],
        reports: [],
        prescriptions: [],
        certificates: [],
      },
      timeline: [],
      preferences: {
        dataSharing: {
          shareWithFamily: true,
          shareWithResearch: false,
          shareWithInsurance: false,
          anonymousDataSharing: true,
        },
      },
    };
  }

  private getGreetingByMode(mode: AnamnesisMode): string {
    const greetings = {
      preventive:
        '¡Hola! Soy Alta, tu asistente médica. Qué bueno que decidiste crear tu perfil de salud completo. Esto te será muy útil para futuras consultas y emergencias. Vamos a ir paso a paso para documentar toda tu historia médica. ¿Empezamos?',
      illness:
        'Hola, soy Alta. Entiendo que no te estás sintiendo bien. Primero voy a ayudarte con tus síntomas actuales y luego, si querés, podemos completar tu perfil de salud. ¿Qué es lo que te está molestando?',
      emergency:
        '⚠️ Detecto que podría ser una emergencia. Voy a hacer preguntas rápidas y específicas. Si es grave, no dudes en llamar al 107 o ir a emergencias. ¿Cuál es el problema principal?',
      followup:
        'Hola nuevamente. Veo que ya tenemos tu perfil. ¿Venís por un seguimiento o hay algo nuevo que querés agregar a tu historia médica?',
      complete:
        'Bienvenido a AltaMedica. Voy a ayudarte a crear un perfil de salud completo que incluye tanto tu historia médica como cualquier síntoma actual. Esto tomará unos 20-30 minutos pero valdrá la pena. ¿Listo para empezar?',
    };

    return greetings[mode];
  }

  private getTotalSectionsByMode(mode: AnamnesisMode): number {
    const sectionCounts = {
      preventive: 15, // Solo secciones históricas
      illness: 8, // Solo enfermedad actual
      emergency: 3, // Mínimo necesario
      followup: 5, // Actualización parcial
      complete: 22, // Todas las secciones
    };

    return sectionCounts[mode];
  }

  /**
   * Generar PHR completo con GenSpark
   */
  async generateCompletePHR(patientId: string): Promise<GeneratedDocument | null> {
    if (!this.genSpark) return null;

    const phr = this.healthProfile.get(patientId);
    if (!phr) return null;

    try {
      const document = await this.genSpark.generateDocument({
        type: 'anamnesis',
        data: {
          phr,
          completedSections: Array.from(this.completedSections),
          mode: this.anamnesisMode,
          generatedAt: new Date(),
          completeness:
            (this.completedSections.size / this.getTotalSectionsByMode(this.anamnesisMode)) * 100,
        },
        style: 'professional',
        includeRecommendations: true,
      });

      // Generar visualización de timeline médico
      if (phr.timeline.length > 0) {
        const timeline = await this.genSpark.createVisualization(phr.timeline, 'timeline');
        document.attachments = [timeline];
      }

      this.emit('phr.generated', { patientId, document });

      return document;
    } catch (error) {
      logger.error('Error generating PHR:', error);
      return null;
    }
  }

  /**
   * Obtener progreso de anamnesis
   */
  getAnamnesisProgress(): {
    mode: AnamnesisMode;
    currentSection: AnamnesisSection;
    completedSections: string[];
    totalSections: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
  } {
    const totalSections = this.getTotalSectionsByMode(this.anamnesisMode);
    const completed = this.completedSections.size;
    const percentComplete = (completed / totalSections) * 100;
    const avgTimePerSection = 2; // minutos
    const estimatedTimeRemaining = (totalSections - completed) * avgTimePerSection;

    return {
      mode: this.anamnesisMode,
      currentSection: this.currentSection,
      completedSections: Array.from(this.completedSections),
      totalSections,
      percentComplete,
      estimatedTimeRemaining,
    };
  }
}

// Exportar tipos para uso externo
export type {
  ClinicalInsight,
  DiagnosisOption,
  DynamicForm,
  EducationalContent,
  GeneratedDocument,
  GenSparkConfig,
  GenSparkSDK,
  ManusConfig,
  ManusResponse,
  ManusSDK,
  MedicalAnalysis,
  MedicalEntities,
  UrgencyResult,
  Visualization,
};
