/**
 * Patient Crystal Ball - Tipos para Predicción de Evolución
 * Sistema de predicción de readmisiones y complicaciones
 * @module @altamedica/types/medical/patient-predictor
 */

import { z } from 'zod';

// ========== Enums ==========

export const RiskLevelSchema = z.enum(['low', 'moderate', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const PredictionTimeframeSchema = z.enum(['24h', '48h', '72h', '7d', '30d']);
export type PredictionTimeframe = z.infer<typeof PredictionTimeframeSchema>;

export const FollowUpTypeSchema = z.enum([
  'phone_call',
  'video_consultation', 
  'in_person',
  'telemetry',
  'home_visit',
  'emergency_contact'
]);
export type FollowUpType = z.infer<typeof FollowUpTypeSchema>;

// ========== Risk Factors ==========

export const RiskFactorSchema = z.object({
  id: z.string(),
  category: z.enum(['demographic', 'clinical', 'social', 'behavioral', 'environmental']),
  description: z.string(),
  weight: z.number().min(0).max(1), // Peso del factor en el cálculo
  isModifiable: z.boolean(),
  interventions: z.array(z.string()).optional()
});
export type RiskFactor = z.infer<typeof RiskFactorSchema>;

// ========== Prediction Models ==========

export const ReadmissionPredictionSchema = z.object({
  patientId: z.string(),
  dischargeDate: z.date(),
  timeframe: PredictionTimeframeSchema,
  probability: z.number().min(0).max(100), // Porcentaje
  confidence: z.number().min(0).max(100), // Confianza en la predicción
  riskLevel: RiskLevelSchema,
  
  contributingFactors: z.array(RiskFactorSchema),
  
  primaryRisks: z.array(z.string()),
  
  historicalData: z.object({
    previousAdmissions: z.number(),
    averageLengthOfStay: z.number(),
    readmissionRate: z.number(),
    medicationAdherence: z.number().min(0).max(100)
  }).optional(),
  
  clinicalMarkers: z.object({
    diagnosis: z.string(),
    comorbidities: z.array(z.string()),
    vitalSigns: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      oxygenSaturation: z.number().optional(),
      temperature: z.number().optional(),
      respiratoryRate: z.number().optional()
    }).optional(),
    labResults: z.array(z.object({
      name: z.string(),
      value: z.string(),
      isAbnormal: z.boolean(),
      trend: z.enum(['improving', 'stable', 'worsening'])
    })).optional()
  }),
  
  socialDeterminants: z.object({
    livesAlone: z.boolean(),
    hasCaregiver: z.boolean(),
    transportationAccess: z.boolean(),
    medicationAffordability: z.boolean(),
    housingStability: z.boolean()
  }).optional()
});
export type ReadmissionPrediction = z.infer<typeof ReadmissionPredictionSchema>;

// ========== Recommendations ==========

export const InterventionRecommendationSchema = z.object({
  id: z.string(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  type: z.enum([
    'extend_observation',
    'home_monitoring',
    'medication_adjustment',
    'social_support',
    'specialist_referral',
    'education',
    'follow_up_scheduling'
  ]),
  title: z.string(),
  description: z.string(),
  expectedImpact: z.string(),
  requiredResources: z.array(z.string()).optional(),
  estimatedCost: z.number().optional(),
  implementationTime: z.string().optional() // "immediate", "24h", "1 week"
});
export type InterventionRecommendation = z.infer<typeof InterventionRecommendationSchema>;

// ========== Follow-up Planning ==========

export const FollowUpPlanSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  
  schedule: z.array(z.object({
    date: z.date(),
    type: FollowUpTypeSchema,
    provider: z.string().optional(),
    purpose: z.string(),
    isAutomated: z.boolean(),
    status: z.enum(['scheduled', 'completed', 'missed', 'cancelled'])
  })),
  
  alerts: z.array(z.object({
    triggerCondition: z.string(),
    action: z.string(),
    severity: RiskLevelSchema,
    autoEscalate: z.boolean()
  })),
  
  monitoringParameters: z.array(z.object({
    parameter: z.string(),
    frequency: z.string(),
    normalRange: z.string(),
    criticalValues: z.string()
  }))
});
export type FollowUpPlan = z.infer<typeof FollowUpPlanSchema>;

// ========== Crystal Ball Prediction (Main) ==========

export const PatientCrystalBallPredictionSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string(),
  doctorId: z.string(),
  createdAt: z.date(),
  
  // Patient Context
  patient: z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    diagnosis: z.string(),
    admissionDate: z.date(),
    plannedDischargeDate: z.date()
  }),
  
  // Main Predictions
  predictions: z.object({
    readmission: ReadmissionPredictionSchema,
    complications: z.array(z.object({
      type: z.string(),
      probability: z.number(),
      timeframe: PredictionTimeframeSchema,
      preventable: z.boolean()
    })).optional(),
    mortalityRisk: z.object({
      probability: z.number(),
      timeframe: PredictionTimeframeSchema,
      modifiableFactors: z.array(z.string())
    }).optional()
  }),
  
  // AI Recommendations
  recommendations: z.object({
    primaryAction: z.string(),
    interventions: z.array(InterventionRecommendationSchema),
    alternativePlans: z.array(z.object({
      scenario: z.string(),
      plan: z.string(),
      outcomes: z.string()
    })).optional()
  }),
  
  // Follow-up
  followUpPlan: FollowUpPlanSchema.optional(),
  
  // Metadata
  metadata: z.object({
    modelVersion: z.string(),
    dataQuality: z.number().min(0).max(100),
    lastUpdated: z.date(),
    dataPoints: z.number(),
    accuracy: z.object({
      historical: z.number().optional(),
      confidence: z.number()
    })
  })
});
export type PatientCrystalBallPrediction = z.infer<typeof PatientCrystalBallPredictionSchema>;

// ========== API Request/Response ==========

export const PredictionRequestSchema = z.object({
  patientId: z.string(),
  dischargeDate: z.date().optional(),
  includeInterventions: z.boolean().default(true),
  includeFollowUpPlan: z.boolean().default(true),
  timeframes: z.array(PredictionTimeframeSchema).default(['24h', '48h', '72h'])
});
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

export const PredictionResponseSchema = z.object({
  success: z.boolean(),
  prediction: PatientCrystalBallPredictionSchema,
  warnings: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional()
});
export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;

// ========== Real-time Monitoring ==========

export const PatientMonitoringAlertSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  timestamp: z.date(),
  type: z.enum(['vital_signs', 'symptoms', 'medication', 'appointment', 'social']),
  severity: RiskLevelSchema,
  message: z.string(),
  data: z.record(z.any()).optional(),
  actionRequired: z.boolean(),
  autoResolved: z.boolean().default(false)
});
export type PatientMonitoringAlert = z.infer<typeof PatientMonitoringAlertSchema>;

// ========== Batch Operations ==========

export const BatchPredictionRequestSchema = z.object({
  patientIds: z.array(z.string()).max(100),
  filters: z.object({
    department: z.string().optional(),
    diagnosis: z.string().optional(),
    riskThreshold: z.number().optional(),
    dischargeWindow: z.object({
      start: z.date(),
      end: z.date()
    }).optional()
  }).optional()
});
export type BatchPredictionRequest = z.infer<typeof BatchPredictionRequestSchema>;

// ========== Export all schemas ==========

export const PatientPredictorSchemas = {
  RiskLevel: RiskLevelSchema,
  PredictionTimeframe: PredictionTimeframeSchema,
  FollowUpType: FollowUpTypeSchema,
  RiskFactor: RiskFactorSchema,
  ReadmissionPrediction: ReadmissionPredictionSchema,
  InterventionRecommendation: InterventionRecommendationSchema,
  FollowUpPlan: FollowUpPlanSchema,
  PatientCrystalBallPrediction: PatientCrystalBallPredictionSchema,
  PredictionRequest: PredictionRequestSchema,
  PredictionResponse: PredictionResponseSchema,
  PatientMonitoringAlert: PatientMonitoringAlertSchema,
  BatchPredictionRequest: BatchPredictionRequestSchema
};