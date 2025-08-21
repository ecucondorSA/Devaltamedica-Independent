/**
 * @fileoverview Tipos para Machine Learning y AI médica
 * @module @altamedica/types/ai/ml-types
 * @description Definiciones para modelos de IA y ML en medicina
 */

import { z } from 'zod';
import { PatientId, DoctorId } from '../core/branded.types';

// ==================== ML MODEL TYPES ====================

/**
 * Tipos de modelos de machine learning médicos
 * @enum {string}
 */
export enum MedicalMLModelType {
  /** Clasificación de diagnósticos */
  DIAGNOSTIC_CLASSIFIER = 'diagnostic_classifier',
  /** Predicción de riesgo */
  RISK_PREDICTOR = 'risk_predictor',
  /** Análisis de imágenes médicas */
  MEDICAL_IMAGE_ANALYSIS = 'medical_image_analysis',
  /** Procesamiento de lenguaje natural médico */
  MEDICAL_NLP = 'medical_nlp',
  /** Detección de anomalías */
  ANOMALY_DETECTION = 'anomaly_detection',
  /** Recomendación de tratamiento */
  TREATMENT_RECOMMENDER = 'treatment_recommender',
  /** Pronóstico de evolución */
  PROGNOSIS_PREDICTOR = 'prognosis_predictor',
  /** Dosificación de medicamentos */
  DRUG_DOSING = 'drug_dosing',
  /** Detección de interacciones */
  INTERACTION_DETECTOR = 'interaction_detector'
}

/**
 * Estado del modelo de ML
 * @enum {string}
 */
export enum ModelStatus {
  /** En entrenamiento */
  TRAINING = 'training',
  /** Validando */
  VALIDATING = 'validating',
  /** Listo para producción */
  READY = 'ready',
  /** En producción */
  DEPLOYED = 'deployed',
  /** Desactivado */
  INACTIVE = 'inactive',
  /** Obsoleto */
  DEPRECATED = 'deprecated',
  /** Falló */
  FAILED = 'failed'
}

/**
 * Información del modelo de ML médico
 * @interface MedicalMLModel
 */
export interface MedicalMLModel {
  /** ID único del modelo */
  id: string;
  /** Nombre descriptivo */
  name: string;
  /** Tipo de modelo */
  type: MedicalMLModelType;
  /** Versión del modelo */
  version: string;
  /** Descripción */
  description: string;
  /** Estado actual */
  status: ModelStatus;
  /** Algoritmo utilizado */
  algorithm: MLAlgorithm;
  /** Métricas de rendimiento */
  performance: ModelPerformance;
  /** Especialidad médica objetivo */
  targetSpecialty?: string[];
  /** Datos de entrenamiento */
  trainingData: TrainingDataInfo;
  /** Configuración del modelo */
  configuration: ModelConfiguration;
  /** Metadatos */
  metadata: ModelMetadata;
  /** Fecha de creación */
  createdAt: Date;
  /** Última actualización */
  updatedAt: Date;
  /** Creado por */
  createdBy: string;
}

/**
 * Algoritmos de machine learning soportados
 * @enum {string}
 */
export enum MLAlgorithm {
  // Algoritmos tradicionales
  LOGISTIC_REGRESSION = 'logistic_regression',
  RANDOM_FOREST = 'random_forest',
  SVM = 'svm',
  GRADIENT_BOOSTING = 'gradient_boosting',
  NAIVE_BAYES = 'naive_bayes',
  
  // Deep Learning
  NEURAL_NETWORK = 'neural_network',
  CNN = 'convolutional_neural_network',
  RNN = 'recurrent_neural_network',
  LSTM = 'long_short_term_memory',
  TRANSFORMER = 'transformer',
  
  // Ensemble
  ENSEMBLE = 'ensemble',
  VOTING_CLASSIFIER = 'voting_classifier',
  STACKING = 'stacking',
  
  // Unsupervised
  CLUSTERING = 'clustering',
  PCA = 'principal_component_analysis',
  AUTOENCODER = 'autoencoder'
}

/**
 * Métricas de rendimiento del modelo
 * @interface ModelPerformance
 */
export interface ModelPerformance {
  /** Exactitud general */
  accuracy: number;
  /** Precisión */
  precision: number;
  /** Sensibilidad/Recall */
  recall: number;
  /** F1 Score */
  f1Score: number;
  /** Área bajo la curva ROC */
  aucRoc: number;
  /** Especificidad */
  specificity?: number;
  /** Valor predictivo positivo */
  ppv?: number;
  /** Valor predictivo negativo */
  npv?: number;
  /** Métricas por clase */
  classMetrics?: Record<string, ClassMetrics>;
  /** Matriz de confusión */
  confusionMatrix?: number[][];
  /** Intervalo de confianza */
  confidenceInterval?: {
    lower: number;
    upper: number;
    level: number; // e.g., 95 for 95%
  };
}

/**
 * Métricas por clase de clasificación
 * @interface ClassMetrics
 */
export interface ClassMetrics {
  /** Nombre de la clase */
  className: string;
  /** Precisión para esta clase */
  precision: number;
  /** Recall para esta clase */
  recall: number;
  /** F1 Score para esta clase */
  f1Score: number;
  /** Soporte (número de muestras) */
  support: number;
}

/**
 * Información de datos de entrenamiento
 * @interface TrainingDataInfo
 */
export interface TrainingDataInfo {
  /** Número total de muestras */
  totalSamples: number;
  /** Muestras de entrenamiento */
  trainingSamples: number;
  /** Muestras de validación */
  validationSamples: number;
  /** Muestras de prueba */
  testSamples: number;
  /** Características utilizadas */
  features: string[];
  /** Clases objetivo */
  targetClasses?: string[];
  /** Distribución de clases */
  classDistribution?: Record<string, number>;
  /** Fuente de los datos */
  dataSource: string;
  /** Período de recolección */
  collectionPeriod: {
    startDate: Date;
    endDate: Date;
  };
  /** Criterios de inclusión */
  inclusionCriteria?: string[];
  /** Criterios de exclusión */
  exclusionCriteria?: string[];
}

/**
 * Configuración del modelo
 * @interface ModelConfiguration
 */
export interface ModelConfiguration {
  /** Hiperparámetros */
  hyperparameters: Record<string, any>;
  /** Configuración de entrenamiento */
  trainingConfig: {
    /** Épocas de entrenamiento */
    epochs?: number;
    /** Tamaño de batch */
    batchSize?: number;
    /** Tasa de aprendizaje */
    learningRate?: number;
    /** Función de pérdida */
    lossFunction?: string;
    /** Optimizador */
    optimizer?: string;
    /** Regularización */
    regularization?: {
      l1?: number;
      l2?: number;
      dropout?: number;
    };
  };
  /** Configuración de validación */
  validationConfig: {
    /** Método de validación cruzada */
    crossValidation?: 'k-fold' | 'stratified' | 'time-series';
    /** Número de folds */
    folds?: number;
    /** Estrategia de división */
    splitStrategy?: 'random' | 'stratified' | 'time-based';
  };
  /** Preprocesamiento */
  preprocessing: {
    /** Normalización */
    normalization?: 'standard' | 'minmax' | 'robust';
    /** Manejo de valores faltantes */
    missingValues?: 'mean' | 'median' | 'mode' | 'drop';
    /** Selección de características */
    featureSelection?: string[];
    /** Transformaciones */
    transformations?: string[];
  };
}

/**
 * Metadatos del modelo
 * @interface ModelMetadata
 */
export interface ModelMetadata {
  /** Framework utilizado */
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'keras' | 'xgboost' | 'other';
  /** Versión del framework */
  frameworkVersion: string;
  /** Entorno de entrenamiento */
  trainingEnvironment: {
    pythonVersion: string;
    gpuUsed: boolean;
    gpuType?: string;
    memoryUsed: string;
  };
  /** Tiempo de entrenamiento */
  trainingTime: number; // en minutos
  /** Tamaño del modelo */
  modelSize: number; // en MB
  /** Checksum del modelo */
  checksum: string;
  /** Tags descriptivos */
  tags: string[];
  /** Comentarios */
  comments?: string;
  /** Referencias bibliográficas */
  references?: string[];
}

// ==================== PREDICTION TYPES ====================

/**
 * Resultado de predicción médica
 * @interface MedicalPrediction
 * @template T - Tipo de la predicción
 */
export interface MedicalPrediction<T = any> {
  /** ID único de la predicción */
  id: string;
  /** ID del modelo utilizado */
  modelId: string;
  /** Resultado de la predicción */
  prediction: T;
  /** Nivel de confianza (0-1) */
  confidence: number;
  /** Probabilidades por clase */
  probabilities?: Record<string, number>;
  /** Características utilizadas */
  inputFeatures: Record<string, any>;
  /** Timestamp de la predicción */
  timestamp: Date;
  /** Contexto médico */
  medicalContext: {
    patientId: PatientId;
    doctorId?: DoctorId;
    appointmentId?: string;
    medicalRecordId?: string;
  };
  /** Interpretabilidad */
  interpretation?: PredictionInterpretation;
  /** Validado por médico */
  medicalValidation?: MedicalValidation;
}

/**
 * Interpretación de la predicción
 * @interface PredictionInterpretation
 */
export interface PredictionInterpretation {
  /** Importancia de características */
  featureImportance: Record<string, number>;
  /** Explicación SHAP */
  shapValues?: Record<string, number>;
  /** Explicación LIME */
  limeExplanation?: string;
  /** Reglas de decisión */
  decisionRules?: string[];
  /** Casos similares */
  similarCases?: string[];
  /** Justificación médica */
  medicalRationale?: string;
}

/**
 * Validación médica de la predicción
 * @interface MedicalValidation
 */
export interface MedicalValidation {
  /** Validado por */
  validatedBy: DoctorId;
  /** Fecha de validación */
  validatedAt: Date;
  /** Resultado de la validación */
  result: 'correct' | 'incorrect' | 'partially_correct' | 'inconclusive';
  /** Comentarios del médico */
  comments?: string;
  /** Diagnóstico real */
  actualDiagnosis?: string;
  /** Acciones tomadas */
  actionsTaken?: string[];
}

// ==================== SPECIALIZED PREDICTIONS ====================

/**
 * Predicción de diagnóstico
 * @interface DiagnosticPrediction
 */
export interface DiagnosticPrediction extends MedicalPrediction<{
  /** Diagnósticos más probables */
  diagnoses: Array<{
    /** Código ICD-10 */
    icd10Code: string;
    /** Descripción */
    description: string;
    /** Probabilidad */
    probability: number;
    /** Severidad estimada */
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  /** Diagnóstico diferencial */
  differentialDiagnosis: string[];
  /** Estudios recomendados */
  recommendedTests: string[];
  /** Signos de alarma */
  redFlags: string[];
}> {}

/**
 * Predicción de riesgo
 * @interface RiskPrediction
 */
export interface RiskPrediction extends MedicalPrediction<{
  /** Tipo de riesgo */
  riskType: 'cardiovascular' | 'diabetes' | 'cancer' | 'infection' | 'mortality' | 'readmission';
  /** Nivel de riesgo */
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  /** Score numérico */
  riskScore: number;
  /** Percentil poblacional */
  percentile: number;
  /** Factores de riesgo identificados */
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    modifiable: boolean;
  }>;
  /** Recomendaciones de prevención */
  preventionRecommendations: string[];
  /** Horizonte temporal */
  timeHorizon: string; // e.g., "1 year", "5 years"
}> {}

/**
 * Predicción de evolución/pronóstico
 * @interface PrognosisPrediction
 */
export interface PrognosisPrediction extends MedicalPrediction<{
  /** Evolución esperada */
  expectedOutcome: 'excellent' | 'good' | 'fair' | 'poor' | 'grave';
  /** Tiempo estimado de recuperación */
  recoveryTime?: {
    minimum: number;
    maximum: number;
    unit: 'days' | 'weeks' | 'months';
  };
  /** Complicaciones posibles */
  potentialComplications: Array<{
    complication: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  /** Marcadores de seguimiento */
  followUpMarkers: string[];
  /** Intervenciones sugeridas */
  suggestedInterventions: string[];
}> {}

// ==================== TRAINING & DEPLOYMENT ====================

/**
 * Solicitud de entrenamiento de modelo
 * @interface ModelTrainingRequest
 */
export interface ModelTrainingRequest {
  /** Nombre del modelo */
  modelName: string;
  /** Tipo de modelo */
  modelType: MedicalMLModelType;
  /** Algoritmo a utilizar */
  algorithm: MLAlgorithm;
  /** Conjunto de datos */
  datasetId: string;
  /** Configuración */
  configuration: ModelConfiguration;
  /** Especialidad objetivo */
  targetSpecialty?: string;
  /** Objetivo clínico */
  clinicalObjective: string;
  /** Prioridad del entrenamiento */
  priority: 'low' | 'normal' | 'high' | 'urgent';
  /** Recursos requeridos */
  resourceRequirements?: {
    gpu: boolean;
    memory: string;
    storage: string;
    estimatedTime: number;
  };
}

/**
 * Estado del entrenamiento
 * @interface TrainingStatus
 */
export interface TrainingStatus {
  /** ID del trabajo */
  jobId: string;
  /** Estado actual */
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Progreso (0-100) */
  progress: number;
  /** Época actual */
  currentEpoch?: number;
  /** Total de épocas */
  totalEpochs?: number;
  /** Pérdida actual */
  currentLoss?: number;
  /** Métricas de validación */
  validationMetrics?: Record<string, number>;
  /** Tiempo transcurrido */
  elapsedTime: number;
  /** Tiempo estimado restante */
  estimatedTimeRemaining?: number;
  /** Logs de entrenamiento */
  logs: string[];
  /** Errores */
  errors?: string[];
}

// ==================== SCHEMAS ====================

/**
 * Schema para modelo de ML médico
 */
export const MedicalMLModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(MedicalMLModelType),
  version: z.string(),
  description: z.string(),
  status: z.nativeEnum(ModelStatus),
  algorithm: z.nativeEnum(MLAlgorithm),
  performance: z.object({
    accuracy: z.number().min(0).max(1),
    precision: z.number().min(0).max(1),
    recall: z.number().min(0).max(1),
    f1Score: z.number().min(0).max(1),
    aucRoc: z.number().min(0).max(1)
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string()
});

/**
 * Schema para predicción médica
 */
export const MedicalPredictionSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  prediction: z.any(),
  confidence: z.number().min(0).max(1),
  timestamp: z.date(),
  medicalContext: z.object({
    patientId: z.string(),
    doctorId: z.string().optional(),
    appointmentId: z.string().optional(),
    medicalRecordId: z.string().optional()
  })
});