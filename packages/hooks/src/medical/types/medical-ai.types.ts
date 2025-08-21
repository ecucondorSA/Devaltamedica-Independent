/**
 * @fileoverview Medical AI types for the hooks package
 * @module @altamedica/hooks/medical/types
 */

export interface MedicalAIConfig {
  enableCache?: boolean;
  cacheTimeout?: number;
  maxHistorySize?: number;
  enableRealTimeAnalysis?: boolean;
  privacyMode?: boolean;
  specialties?: MedicalSpecialty[];
  language?: string;
}

export interface SymptomInput {
  symptom: string;
  severity: number;
  duration: string;
  frequency?: string;
  triggers?: string[];
  location?: string;
}

export interface PatientContext {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  medicalHistory?: {
    chronicConditions?: string[];
    medications?: string[];
    allergies?: string[];
    surgeries?: string[];
    familyHistory?: string[];
  };
  vitals?: VitalSigns;
  lifestyle?: {
    smoking?: boolean;
    alcohol?: string;
    exercise?: string;
    diet?: string;
  };
}

export interface VitalSigns {
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  glucose?: number;
}

export interface AIAnalysisResult {
  id: string;
  timestamp: Date;
  symptoms: SymptomInput[];
  context: PatientContext;
  possibleConditions: PossibleCondition[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  followUpQuestions?: string[];
  specialistRecommendation?: MedicalSpecialty;
  confidenceScore: number;
  warningFlags?: string[];
  metadata?: Record<string, any>;
}

export interface PossibleCondition {
  name: string;
  probability: number;
  description: string;
  commonSymptoms: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  treatmentSuggestions?: string[];
  requiresSpecialist?: boolean;
  specialty?: MedicalSpecialty;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

export interface TreatmentPlan {
  id: string;
  condition: string;
  medications?: string[];
  therapies?: string[];
  lifestyle?: string[];
  followUp: string;
  duration?: string;
  monitoring?: string[];
}

export interface HealthMetric {
  name: string;
  value: number | string;
  unit?: string;
  normalRange?: { min: number; max: number };
  trend?: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface HealthReport {
  patientId: string;
  generatedAt: Date;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: HealthMetric[];
  risks: string[];
  recommendations: string[];
  nextCheckup?: Date;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  medicalTerms?: { [key: string]: string };
}

export interface PreventiveRecommendation {
  category: 'screening' | 'vaccination' | 'lifestyle' | 'supplement';
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  rationale: string;
}

export type MedicalSpecialty = 
  | 'cardiology'
  | 'neurology'
  | 'pulmonology'
  | 'gastroenterology'
  | 'endocrinology'
  | 'orthopedics'
  | 'dermatology'
  | 'psychiatry'
  | 'general';

export interface CriticalAlert {
  type: 'emergency' | 'drug_interaction' | 'allergy' | 'abnormal_vital';
  message: string;
  severity: 'warning' | 'critical';
  action: string;
}

export interface PrivacyViolation {
  field: string;
  value: any;
  reason: string;
}

export interface AnalysisAuditEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  patientId?: string;
  details?: Record<string, any>;
}

export interface SymptomAnalysis {
  symptom: string;
  relatedSymptoms: string[];
  possibleCauses: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  homeRemedies?: string[];
}

export interface AIAnalysisExport {
  format: 'json' | 'pdf' | 'csv';
  includeHistory: boolean;
  dateRange?: { start: Date; end: Date };
  data?: any;
}

// Additional types for the optimized hook
export interface DiagnosticSuggestion {
  condition: string;
  probability: number;
  urgency: 'low' | 'medium' | 'high';
  nextSteps: string[];
}

export interface TreatmentRecommendation {
  treatment: string;
  priority: 'low' | 'medium' | 'high';
  duration?: string;
  contraindications?: string[];
}

export interface MedicalResponse {
  answer: string;
  confidence: number;
  sources?: string[];
}

export interface VitalSignsAnalysis {
  normalRanges: Record<string, { min: number; max: number; unit: string }>;
  abnormalValues: Array<{
    parameter: string;
    value: number;
    status: 'low' | 'high';
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  clinicalInterpretation: string;
  recommendations: string[];
  urgency: 'routine' | 'urgent' | 'immediate';
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

export interface LabResult {
  testName: string;
  value: number | string;
  unit?: string;
  normalRange?: string;
  isAbnormal?: boolean;
}

export interface LabAnalysis {
  abnormalResults: LabResult[];
  interpretation: string;
  recommendations: string[];
}

export interface ImagingData {
  type: string;
  findings: string[];
  date: Date;
}

export interface ImagingAnalysis {
  summary: string;
  findings: string[];
  recommendations: string[];
}

export interface ClinicalGuideline {
  title: string;
  source: string;
  recommendations: string[];
  lastUpdated: Date;
}

export interface UseMedicalAIReturn {
  analyzeSymptoms: (symptoms: SymptomInput[], context: PatientContext) => Promise<AIAnalysisResult>;
  getDiagnosticSuggestions: (symptoms: any, context: any) => Promise<PossibleCondition[]>;
  checkDrugInteractions: (medications: string[]) => Promise<DrugInteraction[]>;
  generateTreatmentPlan: (condition: string, patientContext: PatientContext) => Promise<TreatmentPlan>;
  assessRisk: (context: any) => Promise<string[]>;
  getHealthMetrics: (patientId: string) => Promise<HealthMetric[]>;
  generateHealthReport: (patientId: string) => Promise<HealthReport>;
  translateMedicalTerms: (text: string, targetLanguage: string) => Promise<TranslationResult>;
  getPreventiveRecommendations: (patientContext: PatientContext) => Promise<PreventiveRecommendation[]>;
  isAnalyzing: boolean;
  analysisHistory: AIAnalysisResult[];
  error: Error | null;
  clearHistory: () => void;
  exportAnalysis: (options: AIAnalysisExport) => Promise<Blob>;
  refreshAnalysis: () => void;
  auditLog: AnalysisAuditEntry[];
}