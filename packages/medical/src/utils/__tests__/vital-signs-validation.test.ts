/**
 * CRITICAL MEDICAL UNIT TESTS: Validación de Signos Vitales
 * 
 * ⚠️ CRITICAL: Validación incorrecta de signos vitales puede causar:
 * - No detección de crisis hipertensiva (ACV, infarto)
 * - No alerta de hipotermia severa (shock)
 * - Falta de detección de arritmias letales
 * - No reconocimiento de insuficiencia respiratoria
 * 
 * Este test DEBE detectar TODAS las emergencias médicas.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateVitalSigns,
  categorizeVitalSigns,
  detectEmergencyConditions,
  calculateVitalSignsScore,
  generateVitalSignsAlert,
  predictDeteriorationRisk,
  validateVitalSignsRange,
  VitalSignsValidationError,
  type VitalSigns,
  type VitalSignsValidation,
  type EmergencyCondition,
  type PatientDemographics,
  type VitalSignsThresholds
} from '../vital-signs-validation'

describe('CRITICAL: Validador de Signos Vitales', () => {
  let normalAdult: PatientDemographics
  let pediatricPatient: PatientDemographics
  let geriatricPatient: PatientDemographics
  let pregnantPatient: PatientDemographics

  beforeEach(() => {
    // Adulto sano estándar
    normalAdult = {
      age: 35,
      sex: 'male',
      weight: 75, // kg
      height: 180, // cm
      bmi: 23.1,
      medicalConditions: [],
      medications: []
    }

    // Paciente pediátrico
    pediatricPatient = {
      age: 8,
      sex: 'female',
      weight: 25,
      height: 125,
      bmi: 16.0,
      medicalConditions: [],
      medications: []
    }

    // Paciente geriátrico
    geriatricPatient = {
      age: 78,
      sex: 'female', 
      weight: 60,
      height: 160,
      bmi: 23.4,
      medicalConditions: ['hypertension', 'diabetes', 'heart_failure'],
      medications: ['metoprolol', 'lisinopril', 'digoxin']
    }

    // Paciente embarazada
    pregnantPatient = {
      age: 28,
      sex: 'female',
      weight: 68,
      height: 165,
      bmi: 25.0,
      pregnancyWeeks: 32,
      medicalConditions: [],
      medications: ['prenatal_vitamins']
    }
  })

  describe('Validación de Signos Vitales Normales', () => {
    it('debe validar signos vitales normales en adulto', () => {
      const vitalSigns: VitalSigns = {
        bloodPressure: { systolic: 120, diastolic: 80 },
        heartRate: 72,
        respiratoryRate: 16,
        temperature: 36.8, // Celsius
        oxygenSaturation: 98,
        painLevel: 2
      }

      const validation = validateVitalSigns(vitalSigns, normalAdult)

      expect(validation.isValid).toBe(true)
      expect(validation.overall).toBe('normal')
      expect(validation.emergencyConditions).toHaveLength(0)
      expect(validation.warnings).toHaveLength(0)
      expect(validation.interventionRequired).toBe(false)
    })

    it('debe categorizar signos vitales por rangos apropiados', () => {
      const vitalSigns: VitalSigns = {
        bloodPressure: { systolic: 128, diastolic: 82 }, // Ligeramente elevado
        heartRate: 68,
        respiratoryRate: 14,
        temperature: 37.1,
        oxygenSaturation: 97
      }

      const categorization = categorizeVitalSigns(vitalSigns, normalAdult)

      expect(categorization.bloodPressure).toBe('elevated')
      expect(categorization.heartRate).toBe('normal')
      expect(categorization.respiratoryRate).toBe('normal')
      expect(categorization.temperature).toBe('low_grade_fever')
      expect(categorization.oxygenSaturation).toBe('normal')
    })
  })

  describe('EMERGENCIAS CRÍTICAS - Presión Arterial', () => {
    it('debe detectar CRISIS HIPERTENSIVA (>180/120)', () => {
      const criticalVitals: VitalSigns = {
        bloodPressure: { systolic: 195, diastolic: 125 },
        heartRate: 88,
        respiratoryRate: 18,
        temperature: 36.9,
        oxygenSaturation: 96
      }

      const validation = validateVitalSigns(criticalVitals, normalAdult)

      expect(validation.isValid).toBe(false)
      expect(validation.overall).toBe('critical')
      
      const hypertensiveCrisis = validation.emergencyConditions.find(
        ec => ec.condition === 'hypertensive_crisis'
      )
      
      expect(hypertensiveCrisis).toBeDefined()
      expect(hypertensiveCrisis!.severity).toBe('life_threatening')
      expect(hypertensiveCrisis!.timeToIntervention).toBe('immediate')
      expect(hypertensiveCrisis!.complications).toContain('stroke')
      expect(hypertensiveCrisis!.complications).toContain('myocardial_infarction')
      expect(hypertensiveCrisis!.complications).toContain('aortic_dissection')
    })

    it('debe detectar HIPOTENSIÓN SEVERA (<90/60)', () => {
      const hypotensiveVitals: VitalSigns = {
        bloodPressure: { systolic: 85, diastolic: 55 },
        heartRate: 110, // Taquicardia compensatoria
        respiratoryRate: 22,
        temperature: 35.8, // Hipotermia
        oxygenSaturation: 94
      }

      const validation = validateVitalSigns(hypotensiveVitals, normalAdult)

      const shockCondition = validation.emergencyConditions.find(
        ec => ec.condition === 'shock'
      )

      expect(shockCondition).toBeDefined()
      expect(shockCondition!.type).toBe('hypotensive_shock')
      expect(shockCondition!.severity).toBe('severe')
      expect(shockCondition!.interventions).toContain('IV_fluids')
      expect(shockCondition!.interventions).toContain('vasopressors')
      expect(shockCondition!.interventions).toContain('ICU_monitoring')
    })

    it('debe calcular MAP (Mean Arterial Pressure) y detectar hipoperfusión', () => {
      const vitals: VitalSigns = {
        bloodPressure: { systolic: 95, diastolic: 65 },
        heartRate: 105,
        respiratoryRate: 20,
        temperature: 36.2,
        oxygenSaturation: 95
      }

      const validation = validateVitalSigns(vitals, normalAdult)
      
      // MAP = (2 * diastólica + sistólica) / 3
      const expectedMAP = (2 * 65 + 95) / 3 // = 75
      expect(validation.calculatedMAP).toBeCloseTo(75, 0)
      
      // MAP <65 indica hipoperfusión
      expect(validation.warnings).toContainEqual(
        expect.objectContaining({
          type: 'hypoperfusion_risk',
          message: 'MAP approaching critical threshold'
        })
      )
    })
  })

  describe('EMERGENCIAS CRÍTICAS - Frecuencia Cardíaca', () => {
    it('debe detectar TAQUICARDIA SEVERA (>150 bpm)', () => {
      const tachycardiaVitals: VitalSigns = {
        bloodPressure: { systolic: 110, diastolic: 75 },
        heartRate: 165,
        respiratoryRate: 24,
        temperature: 38.5,
        oxygenSaturation: 92
      }

      const validation = validateVitalSigns(tachycardiaVitals, normalAdult)

      const tachycardia = validation.emergencyConditions.find(
        ec => ec.condition === 'severe_tachycardia'
      )

      expect(tachycardia).toBeDefined()
      expect(tachycardia!.heartRateCategory).toBe('severe_tachycardia')
      expect(tachycardia!.possibleCauses).toContain('arrhythmia')
      expect(tachycardia!.possibleCauses).toContain('sepsis')
      expect(tachycardia!.possibleCauses).toContain('hyperthyroidism')
      expect(tachycardia!.monitoring).toContain('continuous_ECG')
    })

    it('debe detectar BRADICARDIA SEVERA (<40 bpm)', () => {
      const bradycardiaVitals: VitalSigns = {
        bloodPressure: { systolic: 95, diastolic: 60 },
        heartRate: 35,
        respiratoryRate: 14,
        temperature: 36.1,
        oxygenSaturation: 96
      }

      const validation = validateVitalSigns(bradycardiaVitals, geriatricPatient)

      const bradycardia = validation.emergencyConditions.find(
        ec => ec.condition === 'severe_bradycardia'
      )

      expect(bradycardia!.severity).toBe('critical')
      expect(bradycardia!.interventions).toContain('atropine')
      expect(bradycardia!.interventions).toContain('pacing')
      expect(bradycardia!.complications).toContain('cardiac_arrest')
    })
  })

  describe('EMERGENCIAS CRÍTICAS - Respiratorias', () => {
    it('debe detectar INSUFICIENCIA RESPIRATORIA (SpO2 <90%)', () => {
      const respiratoryFailure: VitalSigns = {
        bloodPressure: { systolic: 140, diastolic: 85 },
        heartRate: 95,
        respiratoryRate: 32, // Taquipnea
        temperature: 37.8,
        oxygenSaturation: 85 // Hipoxemia severa
      }

      const validation = validateVitalSigns(respiratoryFailure, normalAdult)

      const hypoxemia = validation.emergencyConditions.find(
        ec => ec.condition === 'severe_hypoxemia'
      )

      expect(hypoxemia!.severity).toBe('life_threatening')
      expect(hypoxemia!.oxygenationStatus).toBe('severe_hypoxemia')
      expect(hypoxemia!.interventions).toContain('high_flow_oxygen')
      expect(hypoxemia!.interventions).toContain('intubation_consideration')
      expect(hypoxemia!.timeToIntervention).toBe('immediate')
    })

    it('debe detectar DEPRESIÓN RESPIRATORIA (FR <8/min)', () => {
      const respiratoryDepression: VitalSigns = {
        bloodPressure: { systolic: 105, diastolic: 70 },
        heartRate: 55,
        respiratoryRate: 6, // Bradipnea severa
        temperature: 35.9,
        oxygenSaturation: 88
      }

      const validation = validateVitalSigns(respiratoryDepression, normalAdult)

      const depression = validation.emergencyConditions.find(
        ec => ec.condition === 'respiratory_depression'
      )

      expect(depression!.severity).toBe('critical')
      expect(depression!.possibleCauses).toContain('opioid_overdose')
      expect(depression!.possibleCauses).toContain('cns_depression')
      expect(depression!.antidotes).toContain('naloxone')
    })
  })

  describe('EMERGENCIAS CRÍTICAS - Temperatura', () => {
    it('debe detectar HIPERTERMIA MALIGNA (>42°C)', () => {
      const malignantHyperthermia: VitalSigns = {
        bloodPressure: { systolic: 160, diastolic: 95 },
        heartRate: 140,
        respiratoryRate: 30,
        temperature: 42.5,
        oxygenSaturation: 89
      }

      const validation = validateVitalSigns(malignantHyperthermia, normalAdult)

      const hyperthermia = validation.emergencyConditions.find(
        ec => ec.condition === 'malignant_hyperthermia'
      )

      expect(hyperthermia!.severity).toBe('life_threatening')
      expect(hyperthermia!.timeToIntervention).toBe('immediate')
      expect(hyperthermia!.interventions).toContain('active_cooling')
      expect(hyperthermia!.interventions).toContain('dantrolene')
      expect(hyperthermia!.complications).toContain('multi_organ_failure')
    })

    it('debe detectar HIPOTERMIA SEVERA (<32°C)', () => {
      const severeHypothermia: VitalSigns = {
        bloodPressure: { systolic: 85, diastolic: 50 },
        heartRate: 45,
        respiratoryRate: 10,
        temperature: 30.8,
        oxygenSaturation: 92
      }

      const validation = validateVitalSigns(severeHypothermia, normalAdult)

      const hypothermia = validation.emergencyConditions.find(
        ec => ec.condition === 'severe_hypothermia'
      )

      expect(hypothermia!.severity).toBe('life_threatening')
      expect(hypothermia!.interventions).toContain('active_rewarming')
      expect(hypothermia!.interventions).toContain('warm_IV_fluids')
      expect(hypothermia!.complications).toContain('cardiac_arrest')
      expect(hypothermia!.complications).toContain('ventricular_fibrillation')
    })
  })

  describe('Validación Pediátrica Especializada', () => {
    it('debe usar rangos pediátricos apropiados por edad', () => {
      const pediatricVitals: VitalSigns = {
        bloodPressure: { systolic: 95, diastolic: 60 }, // Normal para 8 años
        heartRate: 95, // Normal para 8 años (80-120)
        respiratoryRate: 22, // Normal para 8 años (18-24)
        temperature: 37.2,
        oxygenSaturation: 98
      }

      const validation = validateVitalSigns(pediatricVitals, pediatricPatient)

      expect(validation.overall).toBe('normal')
      expect(validation.ageAdjustedNorms).toBeTruthy()
      expect(validation.percentiles.heartRate).toBeGreaterThan(25)
      expect(validation.percentiles.heartRate).toBeLessThan(75)
    })

    it('debe detectar emergencias específicas pediátricas', () => {
      const pediatricEmergency: VitalSigns = {
        bloodPressure: { systolic: 75, diastolic: 45 }, // Hipotensión severa
        heartRate: 180, // Taquicardia severa
        respiratoryRate: 35, // Taquipnea
        temperature: 39.8, // Fiebre alta
        oxygenSaturation: 91
      }

      const validation = validateVitalSigns(pediatricEmergency, pediatricPatient)

      expect(validation.emergencyConditions).toContainEqual(
        expect.objectContaining({
          condition: 'pediatric_septic_shock',
          severity: 'life_threatening'
        })
      )
    })

    it('debe calcular weight-based vital signs para recién nacidos', () => {
      const newborn: PatientDemographics = {
        age: 0.1, // 1 mes
        sex: 'male',
        weight: 4.2, // kg
        height: 52, // cm
        birthWeight: 3.8,
        gestationalAge: 39
      }

      const neonatalVitals: VitalSigns = {
        bloodPressure: { systolic: 70, diastolic: 45 },
        heartRate: 140,
        respiratoryRate: 45,
        temperature: 36.8,
        oxygenSaturation: 96
      }

      const validation = validateVitalSigns(neonatalVitals, newborn)

      expect(validation.ageCategory).toBe('neonate')
      expect(validation.overall).toBe('normal')
      expect(validation.developmentalConsiderations).toBeDefined()
    })
  })

  describe('Validación Geriátrica Especializada', () => {
    it('debe ajustar rangos para población geriátrica', () => {
      const geriatricVitals: VitalSigns = {
        bloodPressure: { systolic: 140, diastolic: 85 }, // Aceptable en geriátricos
        heartRate: 65, // Normal
        respiratoryRate: 18,
        temperature: 36.4, // Ligeramente bajo, normal en elderly
        oxygenSaturation: 95 // Aceptable en elderly
      }

      const validation = validateVitalSigns(geriatricVitals, geriatricPatient)

      expect(validation.overall).toBe('acceptable_for_age')
      expect(validation.geriatricAdjustments).toBeTruthy()
      expect(validation.medicationEffects).toBeDefined() // Considerar efectos de metoprolol
    })

    it('debe detectar fragilidad y riesgo de deterioro', () => {
      const frailVitals: VitalSigns = {
        bloodPressure: { systolic: 105, diastolic: 60 },
        heartRate: 88,
        respiratoryRate: 22,
        temperature: 35.9,
        oxygenSaturation: 93,
        functionalStatus: 'limited_mobility'
      }

      const validation = validateVitalSigns(frailVitals, geriatricPatient)

      expect(validation.frailtyScore).toBeGreaterThan(3)
      expect(validation.deteriorationRisk).toBe('high')
      expect(validation.recommendedMonitoring).toContain('frequent_vitals')
    })
  })

  describe('Validación en Embarazo', () => {
    it('debe usar rangos apropiados para embarazada', () => {
      const pregnancyVitals: VitalSigns = {
        bloodPressure: { systolic: 125, diastolic: 75 },
        heartRate: 85, // Ligeramente elevada, normal en embarazo
        respiratoryRate: 18,
        temperature: 37.0,
        oxygenSaturation: 97
      }

      const validation = validateVitalSigns(pregnancyVitals, pregnantPatient)

      expect(validation.overall).toBe('normal_for_pregnancy')
      expect(validation.pregnancyAdjustments).toBeTruthy()
      expect(validation.trimester).toBe('third')
    })

    it('debe detectar PREECLAMPSIA (BP >140/90 + proteinuria)', () => {
      const preeclampsiaVitals: VitalSigns = {
        bloodPressure: { systolic: 155, diastolic: 95 },
        heartRate: 78,
        respiratoryRate: 16,
        temperature: 36.8,
        oxygenSaturation: 98,
        proteinuria: '2+', // Indicador de preeclampsia
        edema: 'severe'
      }

      const validation = validateVitalSigns(preeclampsiaVitals, pregnantPatient)

      const preeclampsia = validation.emergencyConditions.find(
        ec => ec.condition === 'preeclampsia'
      )

      expect(preeclampsia!.severity).toBe('severe')
      expect(preeclampsia!.maternalRisk).toBe('high')
      expect(preeclampsia!.fetalRisk).toBe('high')
      expect(preeclampsia!.interventions).toContain('magnesium_sulfate')
      expect(preeclampsia!.interventions).toContain('delivery_consideration')
    })
  })

  describe('Algoritmos de Scoring y Predicción', () => {
    it('debe calcular NEWS (National Early Warning Score)', () => {
      const vitals: VitalSigns = {
        bloodPressure: { systolic: 105, diastolic: 65 },
        heartRate: 105,
        respiratoryRate: 24,
        temperature: 38.2,
        oxygenSaturation: 94,
        consciousnessLevel: 'alert'
      }

      const score = calculateVitalSignsScore(vitals, normalAdult, 'NEWS')

      // NEWS scoring: 
      // BP: 1 point (90-100 systolic)
      // HR: 1 point (101-110)
      // RR: 2 points (21-24)
      // Temp: 1 point (38.1-39.0)
      // SpO2: 1 point (94-95)
      // Consciousness: 0 points (alert)
      expect(score.totalScore).toBe(6)
      expect(score.riskLevel).toBe('medium_risk')
      expect(score.recommendedFrequency).toBe('hourly_monitoring')
    })

    it('debe calcular qSOFA (Quick SOFA) para sepsis', () => {
      const sepsisVitals: VitalSigns = {
        bloodPressure: { systolic: 95, diastolic: 60 },
        heartRate: 115,
        respiratoryRate: 26,
        temperature: 38.8,
        oxygenSaturation: 91,
        glasgowComaScale: 13 // Alteración mental
      }

      const qSOFA = calculateVitalSignsScore(sepsisVitals, normalAdult, 'qSOFA')

      // qSOFA: BP ≤100 (1), RR ≥22 (1), GCS <15 (1) = 3 points
      expect(qSOFA.totalScore).toBe(3)
      expect(qSOFA.sepsisRisk).toBe('high')
      expect(qSOFA.recommendedAction).toBe('sepsis_protocol')
    })

    it('debe predecir deterioración usando tendencias', () => {
      const vitalsTrend = [
        { timestamp: '10:00', heartRate: 75, systolic: 120 },
        { timestamp: '11:00', heartRate: 85, systolic: 115 },
        { timestamp: '12:00', heartRate: 95, systolic: 110 },
        { timestamp: '13:00', heartRate: 105, systolic: 105 }
      ]

      const prediction = predictDeteriorationRisk(vitalsTrend, normalAdult)

      expect(prediction.trend).toBe('deteriorating')
      expect(prediction.riskScore).toBeGreaterThan(0.7) // >70% riesgo
      expect(prediction.timeToDeterioration).toBe('2-4_hours')
      expect(prediction.recommendedIntervention).toBe('physician_evaluation')
    })
  })

  describe('Generación de Alertas Inteligentes', () => {
    it('debe generar alerta crítica con instrucciones específicas', () => {
      const criticalVitals: VitalSigns = {
        bloodPressure: { systolic: 200, diastolic: 130 },
        heartRate: 125,
        respiratoryRate: 28,
        temperature: 37.5,
        oxygenSaturation: 89
      }

      const alert = generateVitalSignsAlert(criticalVitals, normalAdult)

      expect(alert).toMatchObject({
        priority: 'CRITICAL',
        color: 'red',
        soundAlert: true,
        autoEscalation: true,
        timeToResponse: '2_minutes',
        escalationLevels: ['nurse', 'physician', 'rapid_response_team']
      })

      expect(alert.instructions).toContain('Administer antihypertensive')
      expect(alert.instructions).toContain('Obtain 12-lead ECG')
      expect(alert.instructions).toContain('Prepare for possible stroke protocol')
    })

    it('debe suprimir alertas de fatiga (alert fatigue prevention)', () => {
      // Simular múltiples alertas menores en corto tiempo
      const minorAlert1 = generateVitalSignsAlert(
        { heartRate: 105, bloodPressure: { systolic: 135, diastolic: 85 } },
        normalAdult,
        { previousAlerts: [] }
      )

      const minorAlert2 = generateVitalSignsAlert(
        { heartRate: 107, bloodPressure: { systolic: 137, diastolic: 87 } },
        normalAdult,
        { 
          previousAlerts: [minorAlert1],
          alertSuppressionEnabled: true 
        }
      )

      expect(minorAlert2.suppressed).toBe(true)
      expect(minorAlert2.suppressionReason).toBe('similar_alert_recent')
      expect(minorAlert2.consolidatedMessage).toBeDefined()
    })
  })

  describe('Casos Edge y Validaciones Extremas', () => {
    it('debe rechazar valores fisiológicamente imposibles', () => {
      expect(() => validateVitalSigns({
        bloodPressure: { systolic: 50, diastolic: 120 }, // Imposible
        heartRate: 300, // Imposible
        temperature: 50, // Imposible
        oxygenSaturation: 120 // Imposible (>100%)
      }, normalAdult)).toThrow(VitalSignsValidationError)
    })

    it('debe manejar signos vitales ausentes o erróneos', () => {
      const incompleteVitals: Partial<VitalSigns> = {
        heartRate: 75,
        temperature: 36.8
        // Missing BP, RR, SpO2
      }

      const validation = validateVitalSigns(incompleteVitals, normalAdult)

      expect(validation.missingValues).toContain('bloodPressure')
      expect(validation.missingValues).toContain('respiratoryRate')
      expect(validation.missingValues).toContain('oxygenSaturation')
      expect(validation.completenessScore).toBeLessThan(0.6)
    })

    it('debe validar coherencia entre signos vitales', () => {
      const incoherentVitals: VitalSigns = {
        bloodPressure: { systolic: 70, diastolic: 45 }, // Hipotensión
        heartRate: 45, // Bradicardia (debería ser taquicardia compensatoria)
        respiratoryRate: 8, // Bradipnea
        temperature: 35.0, // Hipotermia
        oxygenSaturation: 98 // Normal (incoherente con otros signos)
      }

      const validation = validateVitalSigns(incoherentVitals, normalAdult)

      expect(validation.coherenceIssues).toHaveLength(2)
      expect(validation.coherenceIssues).toContainEqual(
        expect.objectContaining({
          type: 'compensatory_response_missing',
          expected: 'tachycardia',
          found: 'bradycardia'
        })
      )
    })
  })

  describe('Performance y Escalabilidad', () => {
    it('debe procesar validación en <100ms', async () => {
      const vitals: VitalSigns = {
        bloodPressure: { systolic: 125, diastolic: 80 },
        heartRate: 75,
        respiratoryRate: 16,
        temperature: 36.8,
        oxygenSaturation: 98
      }

      const startTime = performance.now()
      const validation = await validateVitalSigns(vitals, normalAdult)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // <100ms
      expect(validation).toBeDefined()
    })

    it('debe manejar validación masiva de pacientes', async () => {
      const patients = Array(100).fill(null).map((_, i) => ({
        vitals: {
          bloodPressure: { systolic: 120 + i, diastolic: 80 },
          heartRate: 70 + (i % 20),
          respiratoryRate: 16,
          temperature: 36.8,
          oxygenSaturation: 98
        },
        demographics: normalAdult
      }))

      const startTime = performance.now()
      const validations = await Promise.all(
        patients.map(p => validateVitalSigns(p.vitals, p.demographics))
      )
      const endTime = performance.now()

      expect(validations).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(5000) // <5 segundos para 100 pacientes
    })
  })

  describe('Compliance y Auditoría Médica', () => {
    it('debe generar log de auditoría para validaciones críticas', () => {
      const criticalVitals: VitalSigns = {
        bloodPressure: { systolic: 190, diastolic: 120 },
        heartRate: 150,
        temperature: 40.5,
        oxygenSaturation: 86
      }

      const validation = validateVitalSigns(criticalVitals, normalAdult, {
        auditLog: true,
        clinicianId: 'nurse_123',
        patientId: 'patient_456'
      })

      expect(validation.auditLog).toMatchObject({
        timestamp: expect.any(Date),
        clinicianId: 'nurse_123',
        patientId: 'patient_456',
        vitalSigns: criticalVitals,
        emergencyConditions: expect.any(Array),
        alertsGenerated: expect.any(Array),
        responseTime: expect.any(Number)
      })
    })
  })
})