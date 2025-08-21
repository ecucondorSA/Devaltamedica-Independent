/**
 * FASE 2: Tests Hooks Médicos - useMedicalHistory
 * 
 * ⚠️ CRITICAL: Hook que gestiona historial médico completo del paciente
 * - Conditions, medications, allergies, family history
 * - Timeline médico con events críticos
 * - Integración con PHI y compliance HIPAA
 * - Cache inteligente para performance médica
 * 
 * Errores aquí pueden causar diagnósticos incorrectos.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMedicalHistory } from '../useMedicalHistory'
import { createWrapper } from '../../__tests__/utils'
import type { MedicalHistory, MedicalEvent, PatientCondition } from '@altamedica/types'

// Mock de API médica
const mockApiClient = {
  getMedicalHistory: vi.fn(),
  updateMedicalHistory: vi.fn(),
  addMedicalEvent: vi.fn(),
  getMedicalTimeline: vi.fn(),
  validateMedicalData: vi.fn()
}

vi.mock('@altamedica/api-client', () => ({
  apiClient: mockApiClient
}))

describe('useMedicalHistory Hook - FASE 2', () => {
  let queryClient: QueryClient
  let wrapper: any

  const mockPatientId = 'patient-123'
  
  const mockMedicalHistory: MedicalHistory = {
    patientId: mockPatientId,
    conditions: [
      {
        id: 'cond-1',
        name: 'Hypertension',
        icd10Code: 'I10',
        diagnosedDate: '2020-03-15T00:00:00Z',
        status: 'active',
        severity: 'moderate',
        managementPlan: ['lifestyle_modification', 'medication'],
        lastReviewed: '2025-08-01T10:00:00Z'
      },
      {
        id: 'cond-2',
        name: 'Type 2 Diabetes',
        icd10Code: 'E11.9',
        diagnosedDate: '2019-11-22T00:00:00Z',
        status: 'active',
        severity: 'mild',
        complications: ['diabetic_retinopathy'],
        hba1c: 7.2
      }
    ],
    medications: [
      {
        id: 'med-1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once_daily',
        startDate: '2020-03-15T00:00:00Z',
        status: 'active',
        indication: 'hypertension',
        prescribedBy: 'dr-smith-123'
      },
      {
        id: 'med-2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        startDate: '2019-11-22T00:00:00Z',
        status: 'active',
        indication: 'diabetes_type_2'
      }
    ],
    allergies: [
      {
        id: 'allergy-1',
        allergen: 'Penicillin',
        reaction: 'rash',
        severity: 'moderate',
        onsetDate: '2015-06-10T00:00:00Z',
        confirmedBy: 'allergy_test'
      }
    ],
    familyHistory: [
      {
        relationship: 'father',
        condition: 'coronary_artery_disease',
        ageOfOnset: 58,
        status: 'deceased',
        causeOfDeath: 'myocardial_infarction'
      },
      {
        relationship: 'mother',
        condition: 'breast_cancer',
        ageOfOnset: 62,
        status: 'survivor'
      }
    ],
    socialHistory: {
      smokingStatus: 'former_smoker',
      quitDate: '2018-01-01T00:00:00Z',
      alcoholUse: 'moderate',
      exerciseFrequency: 'weekly',
      occupation: 'office_worker'
    },
    lastUpdated: '2025-08-11T14:30:00Z'
  }

  const mockMedicalTimeline: MedicalEvent[] = [
    {
      id: 'event-1',
      patientId: mockPatientId,
      eventType: 'diagnosis',
      eventDate: '2020-03-15T10:00:00Z',
      title: 'Hypertension Diagnosed',
      description: 'Blood pressure consistently >140/90',
      relatedCondition: 'cond-1',
      significance: 'major',
      documentedBy: 'dr-smith-123'
    },
    {
      id: 'event-2',
      eventType: 'medication_start',
      eventDate: '2020-03-15T11:00:00Z',
      title: 'Started Lisinopril',
      description: '10mg once daily for hypertension',
      relatedMedication: 'med-1',
      significance: 'major'
    },
    {
      id: 'event-3',
      eventType: 'lab_result',
      eventDate: '2025-07-15T09:00:00Z',
      title: 'HbA1c Result',
      description: 'HbA1c: 7.2% - diabetes control adequate',
      labValues: { hba1c: 7.2, unit: 'percent' },
      significance: 'moderate'
    }
  ]

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
    mockApiClient.getMedicalHistory.mockResolvedValue({ data: mockMedicalHistory })
    mockApiClient.getMedicalTimeline.mockResolvedValue({ data: mockMedicalTimeline })
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Carga de Historial Médico', () => {
    it('debe cargar historial médico completo del paciente', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.medicalHistory).toBeUndefined()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.medicalHistory).toEqual(mockMedicalHistory)
      expect(result.current.conditions).toHaveLength(2)
      expect(result.current.medications).toHaveLength(2)
      expect(result.current.allergies).toHaveLength(1)
      expect(mockApiClient.getMedicalHistory).toHaveBeenCalledWith(mockPatientId)
    })

    it('debe manejar errores de carga y proporcionar fallbacks', async () => {
      const error = new Error('API Error: Patient not found')
      mockApiClient.getMedicalHistory.mockRejectedValue(error)

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
      expect(result.current.medicalHistory).toBeUndefined()
      
      // Debe proporcionar fallbacks seguros
      expect(result.current.conditions).toEqual([])
      expect(result.current.medications).toEqual([])
      expect(result.current.allergies).toEqual([])
    })

    it('debe implementar cache inteligente para performance', async () => {
      // Primer render
      const { result: result1 } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result1.current.isLoading).toBe(false))

      // Segundo render del mismo paciente - debe usar cache
      const { result: result2 } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      expect(result2.current.isLoading).toBe(false) // Inmediato desde cache
      expect(result2.current.medicalHistory).toEqual(mockMedicalHistory)
      expect(mockApiClient.getMedicalHistory).toHaveBeenCalledTimes(1) // Solo una llamada API
    })
  })

  describe('Timeline Médico', () => {
    it('debe cargar timeline médico cronológico', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { includeTimeline: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.timeline).toEqual(mockMedicalTimeline)
      expect(result.current.timeline).toHaveLength(3)
      
      // Verificar orden cronológico (más reciente primero)
      const dates = result.current.timeline!.map(event => new Date(event.eventDate))
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime())
      }
    })

    it('debe filtrar timeline por tipo de evento', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { 
          includeTimeline: true,
          timelineFilters: { eventTypes: ['diagnosis', 'medication_start'] }
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const filteredEvents = result.current.getFilteredTimeline(['diagnosis', 'medication_start'])
      expect(filteredEvents).toHaveLength(2)
      expect(filteredEvents.every(event => 
        ['diagnosis', 'medication_start'].includes(event.eventType)
      )).toBe(true)
    })

    it('debe identificar eventos críticos en timeline', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { includeTimeline: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const criticalEvents = result.current.getCriticalEvents()
      
      expect(criticalEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'diagnosis',
            significance: 'major'
          })
        ])
      )
    })
  })

  describe('Gestión de Condiciones Médicas', () => {
    it('debe proporcionar condiciones activas vs inactivas', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const activeConditions = result.current.getActiveConditions()
      expect(activeConditions).toHaveLength(2)
      expect(activeConditions.every(condition => condition.status === 'active')).toBe(true)

      const inactiveConditions = result.current.getInactiveConditions()
      expect(inactiveConditions).toHaveLength(0)
    })

    it('debe calcular risk score basado en condiciones', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const riskScore = result.current.calculateRiskScore()
      
      expect(riskScore).toMatchObject({
        overall: expect.any(Number),
        cardiovascular: expect.any(Number),
        diabetes: expect.any(Number),
        factors: expect.arrayContaining(['hypertension', 'diabetes_type_2'])
      })
      
      // Con hipertensión y diabetes, el risk score debe ser moderado-alto
      expect(riskScore.overall).toBeGreaterThan(3)
      expect(riskScore.overall).toBeLessThan(8)
    })

    it('debe identificar condiciones que requieren monitoreo', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const conditionsNeedingMonitoring = result.current.getConditionsNeedingMonitoring()
      
      expect(conditionsNeedingMonitoring).toContainEqual(
        expect.objectContaining({
          name: 'Type 2 Diabetes',
          monitoringRequirements: expect.arrayContaining(['hba1c', 'blood_glucose'])
        })
      )
    })
  })

  describe('Gestión de Medicamentos', () => {
    it('debe proporcionar medicamentos actuales vs históricos', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const currentMedications = result.current.getCurrentMedications()
      expect(currentMedications).toHaveLength(2)
      expect(currentMedications.every(med => med.status === 'active')).toBe(true)

      const medicationNames = currentMedications.map(med => med.name)
      expect(medicationNames).toContain('Lisinopril')
      expect(medicationNames).toContain('Metformin')
    })

    it('debe detectar potenciales interacciones medicamentosas', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const interactions = result.current.checkMedicationInteractions()
      
      expect(interactions).toEqual(
        expect.objectContaining({
          hasInteractions: expect.any(Boolean),
          interactionCount: expect.any(Number),
          interactions: expect.any(Array)
        })
      )

      // Con Lisinopril + Metformin, no debería haber interacciones mayores
      expect(interactions.hasInteractions).toBe(false)
    })

    it('debe identificar medicamentos que requieren monitoreo', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const monitoringRequirements = result.current.getMedicationMonitoringRequirements()
      
      expect(monitoringRequirements).toContainEqual(
        expect.objectContaining({
          medication: 'Lisinopril',
          monitoringType: 'kidney_function',
          frequency: 'every_6_months'
        })
      )
    })
  })

  describe('Gestión de Alergias', () => {
    it('debe validar alergias contra nuevos medicamentos', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const allergyCheck = result.current.checkAllergies('amoxicillin')
      
      expect(allergyCheck).toEqual({
        hasAllergy: true,
        allergen: 'Penicillin',
        crossReactivity: true,
        severity: 'moderate',
        recommendation: 'contraindicated'
      })
    })

    it('debe proporcionar alternativas para medicamentos con alergias', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const alternatives = result.current.getSafeAlternatives('penicillin')
      
      expect(alternatives).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            medication: expect.any(String),
            safetyProfile: 'safe',
            efficacyComparison: expect.any(String)
          })
        ])
      )
    })
  })

  describe('Historia Familiar y Factores de Riesgo', () => {
    it('debe calcular riesgo genético basado en historia familiar', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const geneticRisk = result.current.calculateGeneticRisk()
      
      expect(geneticRisk).toMatchObject({
        cardiovascularRisk: 'elevated', // Padre con coronary artery disease
        cancerRisk: {
          breast: 'elevated', // Madre con breast cancer
          overall: 'moderate'
        },
        recommendedScreening: expect.arrayContaining([
          'cardiac_stress_test',
          'mammography_early'
        ])
      })
    })

    it('debe recomendar screenings preventivos basados en historia', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const screeningRecommendations = result.current.getScreeningRecommendations()
      
      expect(screeningRecommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            screening: 'echocardiogram',
            frequency: 'every_2_years',
            reason: 'family_history_cad',
            priority: 'high'
          }),
          expect.objectContaining({
            screening: 'colonoscopy',
            age_to_start: 45,
            reason: 'general_prevention'
          })
        ])
      )
    })
  })

  describe('Mutations - Actualización de Historial', () => {
    it('debe actualizar condición médica existente', async () => {
      mockApiClient.updateMedicalHistory.mockResolvedValue({
        data: { ...mockMedicalHistory, lastUpdated: '2025-08-11T15:00:00Z' }
      })

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.updateCondition('cond-1', {
          severity: 'severe',
          lastReviewed: '2025-08-11T15:00:00Z',
          managementPlan: ['medication', 'lifestyle_modification', 'specialist_referral']
        })
      })

      expect(mockApiClient.updateMedicalHistory).toHaveBeenCalledWith(
        mockPatientId,
        expect.objectContaining({
          conditions: expect.arrayContaining([
            expect.objectContaining({
              id: 'cond-1',
              severity: 'severe'
            })
          ])
        })
      )
    })

    it('debe agregar nueva condición médica', async () => {
      const newCondition: Omit<PatientCondition, 'id'> = {
        name: 'Hyperlipidemia',
        icd10Code: 'E78.5',
        diagnosedDate: '2025-08-11T14:30:00Z',
        status: 'active',
        severity: 'mild',
        diagnosedBy: 'dr-jones-456'
      }

      mockApiClient.addMedicalEvent.mockResolvedValue({
        data: { id: 'event-new', ...newCondition }
      })

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.addCondition(newCondition)
      })

      expect(mockApiClient.addMedicalEvent).toHaveBeenCalledWith(
        mockPatientId,
        expect.objectContaining({
          eventType: 'diagnosis',
          title: 'Hyperlipidemia Diagnosed',
          relatedCondition: newCondition
        })
      )
    })

    it('debe manejar errores de actualización con rollback', async () => {
      const error = new Error('Update failed: Validation error')
      mockApiClient.updateMedicalHistory.mockRejectedValue(error)

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const originalHistory = result.current.medicalHistory

      await act(async () => {
        try {
          await result.current.updateCondition('cond-1', { severity: 'severe' })
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      // Debe hacer rollback a estado original
      expect(result.current.medicalHistory).toEqual(originalHistory)
      expect(result.current.updateError).toBe(error)
    })
  })

  describe('Performance y Cache Management', () => {
    it('debe invalidar cache cuando se actualiza historial', async () => {
      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Simular actualización
      await act(async () => {
        await result.current.invalidateCache()
      })

      // Debe refetch los datos
      expect(mockApiClient.getMedicalHistory).toHaveBeenCalledTimes(2)
    })

    it('debe manejar múltiples requests concurrentes eficientemente', async () => {
      // Renderizar múltiples hooks simultáneamente
      const { result: result1 } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )
      
      const { result: result2 } = renderHook(
        () => useMedicalHistory(mockPatientId),
        { wrapper }
      )

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
        expect(result2.current.isLoading).toBe(false)
      })

      // Debe hacer una sola llamada API gracias al cache
      expect(mockApiClient.getMedicalHistory).toHaveBeenCalledTimes(1)
      expect(result1.current.medicalHistory).toEqual(result2.current.medicalHistory)
    })
  })

  describe('Compliance HIPAA y Seguridad', () => {
    it('debe validar acceso autorizado antes de cargar datos', async () => {
      mockApiClient.validateMedicalData.mockResolvedValue({ authorized: true })

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { validateAccess: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockApiClient.validateMedicalData).toHaveBeenCalledWith({
        patientId: mockPatientId,
        requestingUser: expect.any(String),
        accessType: 'read_medical_history'
      })
    })

    it('debe rechazar acceso no autorizado', async () => {
      mockApiClient.validateMedicalData.mockResolvedValue({ authorized: false })

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { validateAccess: true }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Access denied')
      expect(result.current.medicalHistory).toBeUndefined()
    })

    it('debe loggear accesos para audit trail', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { result } = renderHook(
        () => useMedicalHistory(mockPatientId, { auditLog: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Medical history accessed'),
        expect.objectContaining({
          patientId: mockPatientId,
          timestamp: expect.any(String),
          action: 'read_medical_history'
        })
      )

      logSpy.mockRestore()
    })
  })
})