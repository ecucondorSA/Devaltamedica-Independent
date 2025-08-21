/**
 * FASE 2: Tests Hooks Médicos - usePatientRisk
 * 
 * ⚠️ CRITICAL: Hook para evaluación y predicción de riesgo del paciente
 * - Scoring de riesgo cardiovascular, diabetes, sepsis, deterioración
 * - Algoritmos predictivos basados en ML/IA
 * - Early warning systems (NEWS, MEWS, qSOFA)
 * - Alertas preventivas para intervención temprana
 * - Análisis de comorbilidades y factores de riesgo
 * 
 * Fallas pueden resultar en no detectar deterioración clínica temprana.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePatientRisk } from '../usePatientRisk'
import { createWrapper } from '../../__tests__/utils'
import type { 
  PatientRiskProfile,
  RiskFactor,
  RiskScores,
  RiskPrediction,
  RiskAlert,
  ComorbidityAnalysis,
  LabValue,
  VitalSigns
} from '@altamedica/types'

// Mock API client  
const mockApiClient = {
  getPatientRiskProfile: vi.fn(),
  calculateRiskScores: vi.fn(),
  updateRiskAssessment: vi.fn(),
  getLabValues: vi.fn(),
  getPredictiveModels: vi.fn(),
  generateRiskAlerts: vi.fn()
}

vi.mock('@altamedica/api-client', () => ({
  apiClient: mockApiClient
}))

describe('usePatientRisk Hook - FASE 2', () => {
  let queryClient: QueryClient
  let wrapper: any

  const mockPatientId = 'patient-123'
  
  const mockRiskProfile: PatientRiskProfile = {
    patientId: mockPatientId,
    age: 65,
    sex: 'male',
    ethnicity: 'caucasian',
    bmi: 28.5,
    smokingStatus: 'former_smoker',
    familyHistory: [
      { condition: 'coronary_artery_disease', relationship: 'father', ageOfOnset: 55 },
      { condition: 'diabetes_type_2', relationship: 'mother', ageOfOnset: 62 }
    ],
    comorbidities: [
      { 
        condition: 'hypertension',
        severity: 'moderate',
        duration: 8, // años
        controlled: true,
        medications: ['lisinopril', 'hydrochlorothiazide']
      },
      {
        condition: 'diabetes_type_2', 
        severity: 'mild',
        duration: 5,
        controlled: true,
        lastHbA1c: 7.2,
        medications: ['metformin']
      },
      {
        condition: 'hyperlipidemia',
        severity: 'moderate', 
        controlled: false,
        lastLdl: 165,
        medications: []
      }
    ],
    socialFactors: {
      socioeconomicStatus: 'middle_class',
      insurance: 'private',
      medicationAdherence: 85,
      healthcareAccess: 'good'
    },
    lastUpdated: '2025-08-11T14:30:00Z'
  }

  const mockCurrentVitals: VitalSigns = {
    bloodPressure: { systolic: 148, diastolic: 92 },
    heartRate: 88,
    respiratoryRate: 18,
    temperature: 37.2,
    oxygenSaturation: 95,
    consciousnessLevel: 'alert'
  }

  const mockLabValues: LabValue[] = [
    {
      test: 'HbA1c',
      value: 7.2,
      unit: 'percent',
      referenceRange: { min: 4.0, max: 5.6 },
      status: 'elevated',
      date: '2025-08-01T09:00:00Z'
    },
    {
      test: 'LDL_cholesterol',
      value: 165,
      unit: 'mg/dL',
      referenceRange: { min: 0, max: 100 },
      status: 'high',
      date: '2025-07-28T08:30:00Z'
    },
    {
      test: 'creatinine',
      value: 1.2,
      unit: 'mg/dL',
      referenceRange: { min: 0.7, max: 1.3 },
      status: 'normal',
      date: '2025-08-01T09:00:00Z'
    },
    {
      test: 'eGFR',
      value: 68,
      unit: 'mL/min/1.73m²',
      referenceRange: { min: 90, max: 120 },
      status: 'mildly_decreased',
      date: '2025-08-01T09:00:00Z'
    }
  ]

  const mockRiskScores: RiskScores = {
    cardiovascular: {
      framingham: {
        score: 24,
        riskCategory: 'high',
        tenYearRisk: 18.5
      },
      ascvd: {
        score: 19.2,
        riskCategory: 'borderline_high',
        recommendation: 'statin_consideration'
      }
    },
    diabetes: {
      complications: {
        retinopathy: 'low',
        nephropathy: 'moderate',  
        neuropathy: 'low'
      },
      glycemicControl: {
        status: 'suboptimal',
        targetHbA1c: 7.0,
        currentHbA1c: 7.2
      }
    },
    sepsis: {
      qSOFA: 0,
      sirs: 1,
      news: 3,
      risk: 'low'
    },
    mortality: {
      thirtyDay: 2.1,
      oneYear: 8.5,
      riskFactors: ['age', 'diabetes', 'hypertension']
    },
    deterioration: {
      nextSixHours: 5.2,
      nextTwentyFourHours: 12.8,
      earlyWarning: 'medium'
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    wrapper = createWrapper({ queryClient })

    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockApiClient.getPatientRiskProfile.mockResolvedValue({ data: mockRiskProfile })
    mockApiClient.calculateRiskScores.mockResolvedValue({ data: mockRiskScores })
    mockApiClient.getLabValues.mockResolvedValue({ data: mockLabValues })
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Perfil de Riesgo del Paciente', () => {
    it('debe cargar perfil de riesgo completo del paciente', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.riskProfile).toBeUndefined()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.riskProfile).toEqual(mockRiskProfile)
      expect(result.current.comorbidities).toHaveLength(3)
      expect(mockApiClient.getPatientRiskProfile).toHaveBeenCalledWith(mockPatientId)
    })

    it('debe categorizar factores de riesgo por importancia', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const riskFactors = result.current.getRiskFactors()

      expect(riskFactors).toEqual({
        modifiable: [
          expect.objectContaining({
            factor: 'smoking_history',
            impact: 'high',
            actionable: true
          }),
          expect.objectContaining({
            factor: 'bmi_overweight',
            impact: 'moderate',
            actionable: true
          }),
          expect.objectContaining({
            factor: 'uncontrolled_hyperlipidemia', 
            impact: 'high',
            actionable: true
          })
        ],
        nonModifiable: [
          expect.objectContaining({
            factor: 'age_65_plus',
            impact: 'high'
          }),
          expect.objectContaining({
            factor: 'male_sex',
            impact: 'moderate'
          }),
          expect.objectContaining({
            factor: 'family_history_cad',
            impact: 'high'
          })
        ]
      })
    })

    it('debe identificar gaps críticos en manejo de riesgo', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const riskGaps = result.current.identifyRiskGaps()

      expect(riskGaps).toContainEqual({
        gap: 'missing_statin_therapy',
        priority: 'high',
        rationale: 'LDL >160 with diabetes and hypertension',
        recommendation: 'initiate_moderate_intensity_statin',
        evidence: 'ACC_AHA_guidelines'
      })

      expect(riskGaps).toContainEqual({
        gap: 'suboptimal_diabetes_control',
        priority: 'medium',
        rationale: 'HbA1c 7.2% above target of 7.0%',
        recommendation: 'intensify_diabetes_management'
      })
    })
  })

  describe('Cálculo de Risk Scores Médicos', () => {
    it('debe calcular scores de riesgo cardiovascular', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          includeVitals: mockCurrentVitals,
          includeLabValues: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.riskScores.cardiovascular).toEqual({
        framingham: {
          score: 24,
          riskCategory: 'high',
          tenYearRisk: 18.5
        },
        ascvd: {
          score: 19.2,
          riskCategory: 'borderline_high',
          recommendation: 'statin_consideration'
        }
      })

      // Debe recomendar intervenciones basadas en score
      expect(result.current.getCardiovascularRecommendations()).toContainEqual({
        intervention: 'statin_therapy',
        priority: 'high',
        expectedBenefit: '35_percent_risk_reduction'
      })
    })

    it('debe calcular riesgo de complicaciones diabéticas', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { includeLabValues: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.riskScores.diabetes).toEqual({
        complications: {
          retinopathy: 'low',
          nephropathy: 'moderate',
          neuropathy: 'low'
        },
        glycemicControl: {
          status: 'suboptimal',
          targetHbA1c: 7.0,
          currentHbA1c: 7.2
        }
      })

      const diabetesRecommendations = result.current.getDiabetesManagementRecommendations()
      expect(diabetesRecommendations).toContainEqual({
        area: 'nephropathy_prevention',
        recommendation: 'ACE_inhibitor_optimization',
        priority: 'medium',
        monitoring: 'annual_microalbumin'
      })
    })

    it('debe evaluar riesgo de sepsis y deterioración aguda', async () => {
      const sepsisVitals = {
        ...mockCurrentVitals,
        temperature: 38.5,
        heartRate: 105,
        respiratoryRate: 24,
        systolicBP: 95
      }

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { includeVitals: sepsisVitals }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const sepsisRisk = result.current.riskScores.sepsis
      
      expect(sepsisRisk.qSOFA).toBeGreaterThan(0)
      expect(sepsisRisk.sirs).toBeGreaterThan(2)
      expect(sepsisRisk.news).toBeGreaterThan(5)
      expect(sepsisRisk.risk).toBe('moderate')
    })
  })

  describe('Predicción de Deterioración', () => {
    it('debe predecir riesgo de deterioración usando ML models', async () => {
      mockApiClient.getPredictiveModels.mockResolvedValue({
        data: {
          deteriorationModel: {
            nextSixHours: { probability: 0.15, confidence: 0.87 },
            nextTwentyFourHours: { probability: 0.28, confidence: 0.82 },
            factors: ['declining_kidney_function', 'poor_glycemic_control', 'age']
          }
        }
      })

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          enablePredictiveModels: true,
          includeVitals: mockCurrentVitals 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.deteriorationPrediction).toEqual({
        nextSixHours: { probability: 0.15, confidence: 0.87 },
        nextTwentyFourHours: { probability: 0.28, confidence: 0.82 },
        factors: ['declining_kidney_function', 'poor_glycemic_control', 'age']
      })

      expect(result.current.deteriorationRisk).toBe('moderate')
    })

    it('debe generar early warning alerts basado en trends', async () => {
      // Simular trend de deterioro
      const deterioratingTrend = {
        vitalsTrend: {
          bloodPressure: 'declining',
          heartRate: 'increasing', 
          respiratoryRate: 'increasing',
          oxygenSaturation: 'declining'
        },
        labTrend: {
          creatinine: 'increasing',
          lactate: 'increasing'
        }
      }

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          monitorTrends: true,
          trendsData: deterioratingTrend 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const earlyWarnings = result.current.getEarlyWarnings()

      expect(earlyWarnings).toContainEqual({
        type: 'deterioration_pattern',
        severity: 'high',
        message: 'Multiple vital signs showing concerning trends',
        timeframe: '6_hours',
        recommendedAction: 'physician_evaluation'
      })
    })

    it('debe ajustar predicciones según comorbilidades específicas', async () => {
      const heartFailureProfile = {
        ...mockRiskProfile,
        comorbidities: [
          ...mockRiskProfile.comorbidities,
          {
            condition: 'heart_failure',
            severity: 'moderate',
            ejectionFraction: 35,
            nyhaClass: 'II'
          }
        ]
      }

      mockApiClient.getPatientRiskProfile.mockResolvedValue({ data: heartFailureProfile })

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { enablePredictiveModels: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Debe ajustar umbrales de alerta para paciente con IC
      expect(result.current.alertThresholds).toEqual({
        weight_gain: { alert: 2, critical: 3 }, // kg en 24h
        shortness_of_breath: 'increased_sensitivity',
        fluid_retention: 'monitor_closely'
      })
    })
  })

  describe('Análisis de Comorbilidades', () => {
    it('debe analizar interacciones entre comorbilidades', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const comorbidityAnalysis = result.current.analyzeComorbidities()

      expect(comorbidityAnalysis).toEqual({
        interactions: [
          {
            condition1: 'diabetes_type_2',
            condition2: 'hypertension',
            interaction: 'synergistic_cardiovascular_risk',
            riskMultiplier: 2.3,
            managementConsiderations: [
              'tight_blood_pressure_control',
              'ace_inhibitor_preferred'
            ]
          },
          {
            condition1: 'diabetes_type_2',
            condition2: 'hyperlipidemia', 
            interaction: 'accelerated_atherosclerosis',
            riskMultiplier: 1.8
          }
        ],
        overallComplexity: 'moderate',
        polypharmacyRisk: 'low'
      })
    })

    it('debe recomendar screening preventivo basado en riesgos', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const screeningRecommendations = result.current.getPreventiveScreening()

      expect(screeningRecommendations).toContainEqual({
        screening: 'coronary_artery_calcium_score',
        indication: 'borderline_cardiovascular_risk',
        frequency: 'every_5_years',
        nextDue: expect.any(String)
      })

      expect(screeningRecommendations).toContainEqual({
        screening: 'diabetic_eye_exam',
        indication: 'diabetes_mellitus',
        frequency: 'annually',
        overdue: false
      })
    })
  })

  describe('Alertas y Notificaciones de Riesgo', () => {
    it('debe generar alertas automáticas para riesgos críticos', async () => {
      mockApiClient.generateRiskAlerts.mockResolvedValue({
        data: [
          {
            id: 'alert-001',
            type: 'medication_gap',
            severity: 'high',
            message: 'Patient with diabetes and CAD risk not on statin therapy',
            recommendations: ['initiate_statin', 'lipid_panel_recheck'],
            timeframe: '2_weeks'
          },
          {
            id: 'alert-002',
            type: 'deterioration_risk',
            severity: 'medium',
            message: 'Kidney function declining trend detected',
            recommendations: ['nephrology_referral', 'medication_review'],
            timeframe: '1_month'
          }
        ]
      })

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { generateAlerts: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.activeAlerts).toHaveLength(2)
      expect(result.current.activeAlerts[0]).toMatchObject({
        type: 'medication_gap',
        severity: 'high',
        recommendations: ['initiate_statin', 'lipid_panel_recheck']
      })
    })

    it('debe priorizar alertas por urgencia médica', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { generateAlerts: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const prioritizedAlerts = result.current.getPrioritizedAlerts()

      expect(prioritizedAlerts).toEqual([
        expect.objectContaining({
          severity: 'high',
          priority: 1,
          actionRequired: 'immediate'
        }),
        expect.objectContaining({
          severity: 'medium',
          priority: 2,
          actionRequired: 'within_week'
        })
      ])
    })

    it('debe configurar alertas personalizadas según especialidad médica', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          specialtyFocus: 'endocrinology',
          generateAlerts: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const endoAlerts = result.current.getSpecialtyAlerts('endocrinology')

      expect(endoAlerts).toContainEqual({
        type: 'diabetes_management',
        focus: 'glycemic_control',
        target: 'HbA1c_below_7',
        currentStatus: 'suboptimal'
      })
    })
  })

  describe('Monitoreo Temporal de Riesgo', () => {
    it('debe rastrear evolución de riesgo en el tiempo', async () => {
      const riskHistory = [
        { date: '2025-07-01', cardiovascularRisk: 16.2, diabetesControl: 'good' },
        { date: '2025-08-01', cardiovascularRisk: 18.1, diabetesControl: 'suboptimal' },
        { date: '2025-08-11', cardiovascularRisk: 18.5, diabetesControl: 'suboptimal' }
      ]

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          includeHistory: true,
          historyData: riskHistory 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.riskTrends).toEqual({
        cardiovascular: {
          trend: 'increasing',
          rate: 2.3, // increase per month
          significance: 'concerning'
        },
        diabetes: {
          trend: 'stable',
          controlStatus: 'suboptimal_stable'
        }
      })
    })

    it('debe predecir riesgo futuro basado en tendencias', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          enablePrediction: true,
          predictionHorizon: '6_months' 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.riskPrediction).toEqual({
        sixMonthsOut: {
          cardiovascularRisk: 21.3,
          majorEvent: 0.18,
          interventionBenefit: {
            statin: 0.35, // 35% risk reduction
            lifestyle: 0.15
          }
        }
      })
    })
  })

  describe('Recomendaciones de Intervención', () => {
    it('debe generar plan de manejo personalizado', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const managementPlan = result.current.generateManagementPlan()

      expect(managementPlan).toEqual({
        immediate: [
          {
            intervention: 'initiate_statin_therapy',
            priority: 'high',
            expectedBenefit: '35_percent_cv_risk_reduction',
            timeline: '2_weeks'
          }
        ],
        shortTerm: [
          {
            intervention: 'optimize_diabetes_control',
            priority: 'medium',
            target: 'HbA1c_below_7',
            timeline: '3_months'
          }
        ],
        longTerm: [
          {
            intervention: 'lifestyle_modification_program',
            priority: 'medium',
            components: ['diet', 'exercise', 'smoking_cessation'],
            timeline: '6_months'
          }
        ]
      })
    })

    it('debe priorizar intervenciones por costo-efectividad', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          includeCostEffectiveness: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const costEffectiveInterventions = result.current.getCostEffectiveInterventions()

      expect(costEffectiveInterventions).toEqual([
        {
          intervention: 'generic_statin',
          cost: 120, // per year
          qalys: 0.8,
          icer: 150, // cost per QALY
          ranking: 1
        },
        {
          intervention: 'diabetes_education',
          cost: 300,
          qalys: 0.6,
          icer: 500,
          ranking: 2
        }
      ])
    })
  })

  describe('Performance y Caching', () => {
    it('debe completar cálculo de riesgos en <3 segundos', async () => {
      const startTime = performance.now()

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          includeVitals: mockCurrentVitals,
          includeLabValues: true,
          enablePredictiveModels: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(3000) // <3 segundos
    })

    it('debe usar cache inteligente para cálculos complejos', async () => {
      const { result: result1 } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result1.current.isLoading).toBe(false))

      // Segundo hook con mismos parámetros - debe usar cache
      const { result: result2 } = renderHook(
        () => usePatientRisk(mockPatientId),
        { wrapper }
      )

      expect(result2.current.isLoading).toBe(false) // Inmediato
      expect(mockApiClient.calculateRiskScores).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integración con Workflows Clínicos', () => {
    it('debe integrar con sistemas de decision support', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          enableClinicalDecisionSupport: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const clinicalGuidance = result.current.getClinicalDecisionSupport()

      expect(clinicalGuidance).toEqual({
        guidelines: [
          {
            guideline: 'AHA_ACC_Cholesterol_2018',
            recommendation: 'moderate_intensity_statin',
            classOfRecommendation: 'I',
            levelOfEvidence: 'A'
          }
        ],
        alerts: [
          {
            type: 'drug_drug_interaction',
            severity: 'moderate',
            interaction: 'statin_diabetes_medication'
          }
        ]
      })
    })

    it('debe generar reportes para quality measures', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { generateQualityMetrics: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const qualityMetrics = result.current.getQualityMetrics()

      expect(qualityMetrics).toEqual({
        hedis: {
          diabetes_hba1c_control: 'not_met', // >7%
          statin_therapy_diabetes: 'not_met',
          blood_pressure_control: 'met'
        },
        cms: {
          diabetes_eye_exam: 'due',
          preventive_care: 'up_to_date'
        }
      })
    })
  })

  describe('Compliance y Auditoría', () => {
    it('debe mantener audit trail de evaluaciones de riesgo', async () => {
      const auditSpy = vi.fn()

      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { 
          auditLog: true,
          onAuditEvent: auditSpy 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(auditSpy).toHaveBeenCalledWith({
        action: 'risk_assessment_calculated',
        patientId: mockPatientId,
        riskCategories: ['cardiovascular', 'diabetes', 'mortality'],
        calculatedBy: expect.any(String),
        timestamp: expect.any(String)
      })
    })

    it('debe validar integridad de datos de riesgo', async () => {
      const { result } = renderHook(
        () => usePatientRisk(mockPatientId, { validateDataIntegrity: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.dataValidation).toEqual({
        profileCompleteness: 95, // 95%
        missingCriticalData: [],
        dataQualityScore: 'high',
        lastValidated: expect.any(String)
      })
    })
  })
})