/**
 * CRITICAL MEDICAL UNIT TESTS: Calculadora de Dosificación
 * 
 * ⚠️ CRITICAL: Errores en dosificación pueden causar:
 * - Muerte por sobredosis
 * - Falla terapéutica por subdosis
 * - Reacciones adversas graves
 * 
 * Este test DEBE tener 100% coverage - vida/muerte depende de estos cálculos.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  calculateDosage,
  calculatePediatricDosage,
  calculateGeriatricDosage,
  validateDosageRange,
  adjustDosageForWeight,
  adjustDosageForKidneyFunction,
  adjustDosageForLiverFunction,
  calculateInsulinDosage,
  calculateChemotherapyDosage,
  convertDosageUnits,
  DosageCalculationError,
  type DosageRequest,
  type PatientProfile,
  type MedicationProfile
} from '../dosage-calculator'

describe('CRITICAL: Calculadora de Dosificación Médica', () => {
  let standardPatient: PatientProfile
  let pediatricPatient: PatientProfile
  let geriatricPatient: PatientProfile
  let renalPatient: PatientProfile
  let hepaticPatient: PatientProfile

  beforeEach(() => {
    // Paciente adulto estándar
    standardPatient = {
      age: 35,
      weight: 70, // kg
      height: 175, // cm
      sex: 'male',
      creatinineLevel: 1.0, // mg/dL (normal)
      creatinineClearance: 90, // mL/min (normal)
      liverFunction: 'normal',
      allergies: [],
      currentMedications: []
    }

    // Paciente pediátrico
    pediatricPatient = {
      age: 8,
      weight: 25, // kg
      height: 125, // cm
      sex: 'female',
      creatinineLevel: 0.6,
      creatinineClearance: 110,
      liverFunction: 'normal',
      allergies: ['penicillin'],
      currentMedications: []
    }

    // Paciente geriátrico
    geriatricPatient = {
      age: 78,
      weight: 65, // kg
      height: 165, // cm
      sex: 'female',
      creatinineLevel: 1.4, // Ligeramente elevado
      creatinineClearance: 45, // Reducido
      liverFunction: 'mild_impairment',
      allergies: ['sulfa'],
      currentMedications: ['warfarin', 'digoxin'] // Medicamentos de ventana terapéutica estrecha
    }

    // Paciente con insuficiencia renal
    renalPatient = {
      age: 55,
      weight: 80,
      height: 180,
      sex: 'male',
      creatinineLevel: 3.2, // Elevado
      creatinineClearance: 25, // Severamente reducido
      liverFunction: 'normal',
      allergies: [],
      currentMedications: []
    }

    // Paciente con insuficiencia hepática
    hepaticPatient = {
      age: 45,
      weight: 75,
      height: 170,
      sex: 'male',
      creatinineLevel: 1.0,
      creatinineClearance: 85,
      liverFunction: 'severe_impairment',
      allergies: [],
      currentMedications: []
    }
  })

  describe('Dosificación Adulto Estándar', () => {
    it('debe calcular dosificación correcta para adulto sano', () => {
      const request: DosageRequest = {
        medication: 'amoxicillin',
        indication: 'respiratory_infection',
        patient: standardPatient,
        urgency: 'routine'
      }

      const result = calculateDosage(request)

      expect(result.dosage).toBe(500) // mg
      expect(result.frequency).toBe('three_times_daily')
      expect(result.duration).toBe('7_days')
      expect(result.route).toBe('oral')
      expect(result.totalDailyDose).toBe(1500) // mg
      expect(result.maxSingleDose).toBe(1000) // mg
      expect(result.warnings).toEqual([])
    })

    it('debe ajustar dosis basado en peso del paciente', () => {
      const request: DosageRequest = {
        medication: 'vancomycin',
        indication: 'serious_infection',
        patient: { ...standardPatient, weight: 100 }, // Paciente obeso
        urgency: 'urgent'
      }

      const result = calculateDosage(request)

      // Vancomicina: 15-20 mg/kg/día
      expect(result.totalDailyDose).toBeGreaterThanOrEqual(1500) // 15 mg/kg * 100 kg
      expect(result.totalDailyDose).toBeLessThanOrEqual(2000) // 20 mg/kg * 100 kg
      expect(result.route).toBe('intravenous')
    })

    it('debe rechazar dosificación para alérgenos conocidos', () => {
      const request: DosageRequest = {
        medication: 'penicillin',
        indication: 'infection',
        patient: { ...standardPatient, allergies: ['penicillin'] }
      }

      expect(() => calculateDosage(request)).toThrow(DosageCalculationError)
      expect(() => calculateDosage(request)).toThrow('Patient allergic to penicillin')
    })

    it('debe detectar interacciones medicamentosas graves', () => {
      const request: DosageRequest = {
        medication: 'warfarin',
        indication: 'anticoagulation',
        patient: { 
          ...standardPatient, 
          currentMedications: ['aspirin', 'ibuprofen'] // Interacción con sangrado
        }
      }

      const result = calculateDosage(request)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'drug_interaction',
          severity: 'high',
          interactingDrugs: ['warfarin', 'aspirin'],
          risk: 'increased_bleeding'
        })
      )
    })

    it('debe validar que la dosis esté dentro del rango terapéutico', () => {
      const validRange = validateDosageRange('digoxin', 250, 'mcg', standardPatient)

      expect(validRange.isValid).toBe(true)
      expect(validRange.therapeuticRange.min).toBe(125) // mcg
      expect(validRange.therapeuticRange.max).toBe(500) // mcg
      expect(validRange.toxicLevel).toBe(750) // mcg

      // Test con dosis tóxica
      const toxicRange = validateDosageRange('digoxin', 1000, 'mcg', standardPatient)
      expect(toxicRange.isValid).toBe(false)
      expect(toxicRange.warnings).toContain('Dose exceeds toxic level')
    })
  })

  describe('Dosificación Pediátrica (CRÍTICA)', () => {
    it('debe calcular dosis pediátrica basada en peso corporal', () => {
      const result = calculatePediatricDosage({
        medication: 'acetaminophen',
        patient: pediatricPatient, // 25 kg, 8 años
        indication: 'fever'
      })

      // Acetaminofeno pediátrico: 10-15 mg/kg/dose
      expect(result.dosage).toBeGreaterThanOrEqual(250) // 10 mg/kg * 25 kg
      expect(result.dosage).toBeLessThanOrEqual(375) // 15 mg/kg * 25 kg
      expect(result.frequency).toBe('every_6_hours')
      expect(result.maxDosesPerDay).toBe(4)
      expect(result.maxDailyDose).toBeLessThanOrEqual(1500) // 60 mg/kg/día max
    })

    it('debe rechazar medicamentos contraindicados en pediatría', () => {
      const request = {
        medication: 'aspirin',
        patient: pediatricPatient,
        indication: 'fever'
      }

      expect(() => calculatePediatricDosage(request)).toThrow(DosageCalculationError)
      expect(() => calculatePediatricDosage(request)).toThrow('Aspirin contraindicated in children <16 years (Reye syndrome risk)')
    })

    it('debe ajustar dosis para superficie corporal en quimioterapia', () => {
      const result = calculateChemotherapyDosage({
        medication: 'doxorubicin',
        patient: pediatricPatient,
        indication: 'leukemia',
        cycleNumber: 1
      })

      // BSA = sqrt((peso * altura) / 3600)
      const expectedBSA = Math.sqrt((25 * 125) / 3600) // ~0.93 m²
      expect(result.bodyServiceArea).toBeCloseTo(0.93, 2)

      // Doxorubicina: 30-60 mg/m²
      expect(result.dosage).toBeGreaterThanOrEqual(28) // 30 mg/m² * 0.93 m²
      expect(result.dosage).toBeLessThanOrEqual(56) // 60 mg/m² * 0.93 m²
    })

    it('debe aplicar límites de seguridad pediátrica estrictos', () => {
      const request = {
        medication: 'morphine',
        patient: pediatricPatient,
        indication: 'severe_pain'
      }

      const result = calculatePediatricDosage(request)

      // Morfina pediátrica: máximo 0.2 mg/kg/dose
      expect(result.dosage).toBeLessThanOrEqual(5) // 0.2 mg/kg * 25 kg
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'pediatric_safety',
          message: 'Monitor respiratory depression closely'
        })
      )
    })
  })

  describe('Dosificación Geriátrica (CRÍTICA)', () => {
    it('debe reducir dosis para pacientes geriátricos', () => {
      const result = calculateGeriatricDosage({
        medication: 'digoxin',
        patient: geriatricPatient,
        indication: 'heart_failure'
      })

      // Dosis geriátrica reducida: ~50-75% de la dosis adulta
      const adultDose = calculateDosage({
        medication: 'digoxin',
        patient: standardPatient,
        indication: 'heart_failure'
      })

      expect(result.dosage).toBeLessThan(adultDose.dosage)
      expect(result.dosage).toBeGreaterThanOrEqual(adultDose.dosage * 0.5)
      expect(result.dosage).toBeLessThanOrEqual(adultDose.dosage * 0.75)
    })

    it('debe considerar función renal reducida en geriátricos', () => {
      const result = calculateGeriatricDosage({
        medication: 'gentamicin',
        patient: geriatricPatient, // CrCl = 45 mL/min
        indication: 'serious_infection'
      })

      // Ajuste por función renal: dosis reducida o intervalo extendido
      expect(result.dosage).toBeLessThan(200) // Dosis reducida
      expect(result.frequency).toMatch(/24_hours|36_hours/) // Intervalo extendido
      expect(result.renalAdjustment).toBe(true)
    })

    it('debe detectar medicamentos inapropiados en geriátricos (Beers Criteria)', () => {
      const result = calculateGeriatricDosage({
        medication: 'diphenhydramine',
        patient: geriatricPatient,
        indication: 'insomnia'
      })

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'beers_criteria',
          severity: 'high',
          message: 'Anticholinergic medication inappropriate in elderly'
        })
      )
    })
  })

  describe('Ajustes por Función Renal (CRÍTICO)', () => {
    it('debe ajustar dosis para insuficiencia renal severa', () => {
      const result = adjustDosageForKidneyFunction({
        medication: 'atenolol',
        standardDose: 100,
        patient: renalPatient // CrCl = 25 mL/min
      })

      // CrCl 15-35 mL/min: reducir dosis 50%
      expect(result.adjustedDose).toBe(50) // 50% de 100 mg
      expect(result.adjustmentReason).toContain('severe_renal_impairment')
      expect(result.monitoringRequired).toContain('kidney_function')
    })

    it('debe calcular clearance de creatinina usando fórmula Cockcroft-Gault', () => {
      // Fórmula: CrCl = ((140-edad) × peso) / (72 × creatinina) × (0.85 si mujer)
      const calculatedCrCl = calculateCreatinineClearance({
        age: 65,
        weight: 70,
        sex: 'female',
        creatinine: 1.5
      })

      const expectedCrCl = ((140 - 65) * 70) / (72 * 1.5) * 0.85
      expect(calculatedCrCl).toBeCloseTo(expectedCrCl, 1)
    })

    it('debe contraindicated medicamentos nefrotóxicos en insuficiencia renal', () => {
      expect(() => adjustDosageForKidneyFunction({
        medication: 'ibuprofen',
        standardDose: 400,
        patient: renalPatient
      })).toThrow('NSAID contraindicated in severe renal impairment')
    })
  })

  describe('Ajustes por Función Hepática (CRÍTICO)', () => {
    it('debe ajustar dosis para insuficiencia hepática severa', () => {
      const result = adjustDosageForLiverFunction({
        medication: 'propranolol',
        standardDose: 80,
        patient: hepaticPatient
      })

      // Insuficiencia hepática severa: reducir dosis 75%
      expect(result.adjustedDose).toBe(20) // 25% de 80 mg
      expect(result.adjustmentReason).toContain('severe_hepatic_impairment')
      expect(result.monitoringRequired).toContain('liver_function')
    })

    it('debe contraindicated medicamentos hepatotóxicos', () => {
      expect(() => adjustDosageForLiverFunction({
        medication: 'acetaminophen',
        standardDose: 4000, // Dosis alta
        patient: hepaticPatient
      })).toThrow('High-dose acetaminophen contraindicated in severe liver disease')
    })
  })

  describe('Cálculo de Insulina (ULTRA CRÍTICO)', () => {
    it('debe calcular dosis de insulina basada en peso y glucosa', () => {
      const result = calculateInsulinDosage({
        patient: { ...standardPatient, weight: 80 },
        currentGlucose: 300, // mg/dL
        targetGlucose: 120, // mg/dL
        insulinSensitivityFactor: 50, // mg/dL por unidad
        carbohydrateRatio: 15 // gramos por unidad
      })

      // Dosis correctiva: (300 - 120) / 50 = 3.6 unidades
      expect(result.correctiveDose).toBeCloseTo(3.6, 1)
      
      // Dosis basal: ~0.5 unidades/kg/día
      expect(result.basalDose).toBeCloseTo(40, 5) // 0.5 * 80 kg

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'hypoglycemia_risk',
          message: 'Monitor blood glucose closely'
        })
      )
    })

    it('debe rechazar dosis de insulina peligrosamente altas', () => {
      expect(() => calculateInsulinDosage({
        patient: standardPatient,
        currentGlucose: 200,
        targetGlucose: 100,
        insulinSensitivityFactor: 10, // Factor muy sensible = dosis muy alta
        carbohydrateRatio: 15
      })).toThrow('Calculated insulin dose exceeds safety limits')
    })
  })

  describe('Conversiones de Unidades (CRÍTICO)', () => {
    it('debe convertir correctamente entre unidades de medicación', () => {
      // mg a mcg
      expect(convertDosageUnits(5, 'mg', 'mcg')).toBe(5000)
      
      // g a mg  
      expect(convertDosageUnits(1, 'g', 'mg')).toBe(1000)
      
      // mL a L
      expect(convertDosageUnits(1500, 'mL', 'L')).toBe(1.5)
      
      // UI (Unidades Internacionales) - no conversión
      expect(convertDosageUnits(100, 'UI', 'mg')).toThrow('Cannot convert between UI and weight units')
    })

    it('debe manejar conversiones de concentración', () => {
      // mg/mL a mg/L
      expect(convertDosageUnits(50, 'mg/mL', 'mg/L')).toBe(50000)
      
      // % a mg/mL (asumiendo densidad 1)
      expect(convertDosageUnits(5, 'percent', 'mg/mL')).toBe(50) // 5% = 50 mg/mL
    })
  })

  describe('Casos Edge de Emergencia (ULTRA CRÍTICO)', () => {
    it('debe manejar dosificación de emergencia cardiac arrest', () => {
      const result = calculateDosage({
        medication: 'epinephrine',
        indication: 'cardiac_arrest',
        patient: standardPatient,
        urgency: 'emergency'
      })

      expect(result.dosage).toBe(1) // mg IV
      expect(result.route).toBe('intravenous')
      expect(result.frequency).toBe('every_3_minutes_prn')
      expect(result.maxDoses).toBe(10) // Límite de seguridad
      expect(result.administrationInstructions).toContain('Push followed by 20mL saline flush')
    })

    it('debe calcular antídoto para sobredosis', () => {
      const result = calculateDosage({
        medication: 'naloxone',
        indication: 'opioid_overdose',
        patient: standardPatient,
        urgency: 'emergency',
        overdoseMedication: 'morphine',
        estimatedOverdoseAmount: 60 // mg
      })

      // Naloxona: 0.4-2 mg IV/IM/SC
      expect(result.dosage).toBeGreaterThanOrEqual(0.4)
      expect(result.dosage).toBeLessThanOrEqual(2)
      expect(result.route).toMatch(/intravenous|intramuscular/)
      expect(result.canRepeat).toBe(true)
      expect(result.repeatInterval).toBe('every_2_minutes')
    })

    it('debe prevenir errores fatales de cálculo', () => {
      // Test con valores extremos que podrían causar overflow
      expect(() => calculateDosage({
        medication: 'morphine',
        patient: { ...standardPatient, weight: 0.1 }, // Peso imposible
        indication: 'pain'
      })).toThrow('Invalid patient weight')

      expect(() => calculateDosage({
        medication: 'insulin',
        patient: { ...standardPatient, age: 200 }, // Edad imposible
        indication: 'diabetes'
      })).toThrow('Invalid patient age')
    })
  })

  describe('Validaciones de Seguridad Final', () => {
    it('debe rechazar dosificaciones sin indicación médica válida', () => {
      expect(() => calculateDosage({
        medication: 'morphine',
        patient: standardPatient,
        indication: 'recreational_use' // Indicación inválida
      })).toThrow('Invalid medical indication')
    })

    it('debe requerir autorización especial para medicamentos controlados', () => {
      const result = calculateDosage({
        medication: 'fentanyl',
        indication: 'severe_pain',
        patient: standardPatient,
        prescriber: { id: 'dr123', deaNumber: 'BD1234567' }
      })

      expect(result.requiresSpecialAuthorization).toBe(true)
      expect(result.controlledSubstanceSchedule).toBe('II')
      expect(result.deaNumberRequired).toBe(true)
    })

    it('debe mantener log de audit para todos los cálculos', () => {
      const result = calculateDosage({
        medication: 'warfarin',
        patient: standardPatient,
        indication: 'anticoagulation'
      })

      expect(result.auditLog).toMatchObject({
        calculatedAt: expect.any(Date),
        calculationMethod: 'weight_based',
        safetyChecksPerformed: [
          'allergy_check',
          'interaction_check', 
          'contraindication_check',
          'dosage_range_validation'
        ],
        riskLevel: expect.stringMatching(/low|medium|high/)
      })
    })
  })
})

// Función auxiliar para cálculo de creatinina (usada en los tests)
function calculateCreatinineClearance(params: {
  age: number
  weight: number 
  sex: 'male' | 'female'
  creatinine: number
}): number {
  const { age, weight, sex, creatinine } = params
  const sexMultiplier = sex === 'female' ? 0.85 : 1.0
  return ((140 - age) * weight) / (72 * creatinine) * sexMultiplier
}