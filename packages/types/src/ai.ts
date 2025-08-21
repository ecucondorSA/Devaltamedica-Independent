import { z } from 'zod';

// AI Job Types - Factory function to create schema
export const createAIJobTypeSchema = () => z.enum([
  'summarize_medical_record',
  'analyze_symptoms',
  'generate_prescription',
  'analyze_lab_results',
  'generate_treatment_plan',
  'medical_risk_assessment',
  'drug_interaction_check',
  'diagnostic_assistance'
]);

// Keep the old export for backwards compatibility
export const AIJobType = createAIJobTypeSchema();
export type AIJobTypeEnum = z.infer<ReturnType<typeof createAIJobTypeSchema>>;

// AI Job Status - Factory function to create schema
export const createAIJobStatusSchema = () => z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

// Keep the old export for backwards compatibility
export const AIJobStatus = createAIJobStatusSchema();
export type AIJobStatusEnum = z.infer<ReturnType<typeof createAIJobStatusSchema>>;

// AI Job Schema - Factory function to create schema
export const createAIJobSchema = () => z.object({
  id: z.string(),
  type: createAIJobTypeSchema(),
  patientId: z.string(),
  status: createAIJobStatusSchema(),
  context: z.record(z.any()).optional().default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  result: z.any().nullable(),
  error: z.string().nullable(),
  processingTime: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal').optional(),
  metadata: z.record(z.any()).optional()
});

// Keep the old export for backwards compatibility
export const AIJobSchema = createAIJobSchema();
export type AIJob = z.infer<ReturnType<typeof createAIJobSchema>>;

// AI Result Schemas for different job types
export const MedicalRecordSummaryResult = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export const SymptomAnalysisResult = z.object({
  possibleConditions: z.array(z.object({
    condition: z.string(),
    probability: z.number(),
    severity: z.enum(['low', 'medium', 'high', 'critical'])
  })),
  recommendedActions: z.array(z.string()),
  urgencyLevel: z.enum(['routine', 'soon', 'urgent', 'emergency'])
});

export const PrescriptionGenerationResult = z.object({
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string()
  })),
  warnings: z.array(z.string()),
  contraindications: z.array(z.string())
});

export const LabResultsAnalysisResult = z.object({
  interpretation: z.string(),
  abnormalValues: z.array(z.object({
    parameter: z.string(),
    value: z.string(),
    referenceRange: z.string(),
    significance: z.string()
  })),
  followUpRecommended: z.boolean(),
  criticalAlerts: z.array(z.string())
});

export type MedicalRecordSummary = z.infer<typeof MedicalRecordSummaryResult>;
export type SymptomAnalysis = z.infer<typeof SymptomAnalysisResult>;
export type PrescriptionGeneration = z.infer<typeof PrescriptionGenerationResult>;
export type LabResultsAnalysis = z.infer<typeof LabResultsAnalysisResult>;