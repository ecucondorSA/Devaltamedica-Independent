/**
 * FASE 2: Tests Hooks Médicos - usePrescriptions
 * 
 * ⚠️ CRITICAL: Hook para gestión completa de prescripciones médicas
 * - CRUD de prescripciones con validación médica
 * - Detección automática de interacciones medicamentosas
 * - Integración con farmacias y seguros médicos
 * - Tracking de adherencia del paciente
 * - Compliance con DEA para sustancias controladas
 * 
 * Errores pueden causar sobredosis, subdosis o interacciones fatales.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePrescriptions } from '../usePrescriptions'
import { createWrapper } from '../../__tests__/utils'
import type { 
  Prescription, 
  Medication,
  DrugInteraction,
  PharmacyOrder,
  PrescriptionStatus,
  AdherenceTracking,
  RefillRequest
} from '@altamedica/types'

// Mock API client
const mockApiClient = {
  getPrescriptions: vi.fn(),
  createPrescription: vi.fn(),
  updatePrescription: vi.fn(),
  cancelPrescription: vi.fn(),
  checkDrugInteractions: vi.fn(),
  submitToPharmacy: vi.fn(),
  trackAdherence: vi.fn(),
  requestRefill: vi.fn(),
  validatePrescription: vi.fn()
}

vi.mock('@altamedica/api-client', () => ({
  apiClient: mockApiClient
}))

describe('usePrescriptions Hook - FASE 2', () => {
  let queryClient: QueryClient
  let wrapper: any

  const mockPatientId = 'patient-123'
  const mockDoctorId = 'doctor-456'
  
  const mockPrescriptions: Prescription[] = [
    {
      id: 'rx-001',
      patientId: mockPatientId,
      doctorId: mockDoctorId,
      prescriptionNumber: 'RX2025081100123',
      status: 'active',
      dateWritten: '2025-08-11T10:00:00Z',
      dateFilled: '2025-08-11T14:30:00Z',
      expirationDate: '2025-08-11T10:00:00Z',
      medications: [
        {
          id: 'med-001',
          name: 'Lisinopril',
          genericName: 'lisinopril',
          strength: '10mg',
          dosageForm: 'tablet',
          directions: 'Take one tablet by mouth once daily',
          quantity: 30,
          refillsRemaining: 2,
          daySupply: 30,
          ndc: '0093-1055-01'
        }
      ],
      pharmacy: {
        id: 'pharmacy-001',
        name: 'CVS Pharmacy',
        address: '123 Main St, Boston MA 02101',
        phone: '(555) 123-4567'
      },
      insurance: {
        planId: 'ins-001',
        copay: 15.99,
        coverage: 'generic_preferred'
      },
      digitalSignature: 'dr_signature_hash_12345',
      deaNumber: 'BD1234567'
    },
    {
      id: 'rx-002', 
      patientId: mockPatientId,
      doctorId: mockDoctorId,
      prescriptionNumber: 'RX2025081100124',
      status: 'pending_approval',
      dateWritten: '2025-08-11T11:00:00Z',
      medications: [
        {
          id: 'med-002',
          name: 'Metformin',
          genericName: 'metformin',
          strength: '500mg',
          dosageForm: 'tablet',
          directions: 'Take one tablet by mouth twice daily with meals',
          quantity: 60,
          refillsRemaining: 5,
          daySupply: 30
        }
      ],
      requiresApproval: true,
      approvalReason: 'prior_authorization_required'
    }
  ]

  const mockDrugInteractions: DrugInteraction[] = [
    {
      id: 'interaction-001',
      drug1: 'warfarin',
      drug2: 'aspirin',
      severity: 'major',
      mechanism: 'increased_bleeding_risk',
      clinicalEffects: ['hemorrhage', 'bruising'],
      management: 'monitor_inr_closely',
      documentation: 'well_established',
      frequency: 'common'
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
    mockApiClient.getPrescriptions.mockResolvedValue({ data: mockPrescriptions })
    mockApiClient.checkDrugInteractions.mockResolvedValue({ data: mockDrugInteractions })
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Gestión de Prescripciones', () => {
    it('debe cargar prescripciones del paciente', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.prescriptions).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.prescriptions).toEqual(mockPrescriptions)
      expect(result.current.prescriptions).toHaveLength(2)
      expect(mockApiClient.getPrescriptions).toHaveBeenCalledWith({
        patientId: mockPatientId
      })
    })

    it('debe filtrar prescripciones por estado', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const activePrescriptions = result.current.getActivePrescriptions()
      expect(activePrescriptions).toHaveLength(1)
      expect(activePrescriptions[0].status).toBe('active')

      const pendingPrescriptions = result.current.getPendingPrescriptions()
      expect(pendingPrescriptions).toHaveLength(1)
      expect(pendingPrescriptions[0].status).toBe('pending_approval')

      const expiredPrescriptions = result.current.getExpiredPrescriptions()
      expect(expiredPrescriptions).toHaveLength(0)
    })

    it('debe calcular próximos vencimientos y refills necesarios', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const upcomingRefills = result.current.getUpcomingRefills()
      
      expect(upcomingRefills).toEqual([
        expect.objectContaining({
          prescriptionId: 'rx-001',
          medicationName: 'Lisinopril',
          daysRemaining: expect.any(Number),
          refillsRemaining: 2,
          urgency: expect.stringMatching(/low|medium|high/)
        })
      ])
    })
  })

  describe('Creación de Nueva Prescripción', () => {
    it('debe crear nueva prescripción con validaciones médicas', async () => {
      const newPrescription = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        medications: [
          {
            name: 'Atorvastatin',
            strength: '20mg',
            directions: 'Take one tablet by mouth once daily in the evening',
            quantity: 30,
            refills: 2,
            indication: 'hyperlipidemia'
          }
        ]
      }

      mockApiClient.createPrescription.mockResolvedValue({
        data: {
          id: 'rx-003',
          ...newPrescription,
          prescriptionNumber: 'RX2025081100125',
          status: 'pending_approval',
          dateWritten: '2025-08-11T15:00:00Z'
        }
      })

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.createPrescription(newPrescription)
      })

      expect(mockApiClient.createPrescription).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: mockPatientId,
          doctorId: mockDoctorId,
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: 'Atorvastatin',
              strength: '20mg'
            })
          ])
        })
      )

      // Debe refetch las prescripciones
      expect(mockApiClient.getPrescriptions).toHaveBeenCalledTimes(2)
    })

    it('debe validar dosis y contraindicaciones antes de crear', async () => {
      mockApiClient.validatePrescription.mockResolvedValue({
        data: {
          valid: false,
          errors: [
            {
              type: 'dosage_excessive',
              medication: 'Morphine',
              message: 'Dosage exceeds recommended maximum for patient age/weight'
            }
          ]
        }
      })

      const invalidPrescription = {
        patientId: mockPatientId,
        medications: [
          {
            name: 'Morphine',
            strength: '100mg', // Dosis excesiva
            directions: 'Take twice daily'
          }
        ]
      }

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        try {
          await result.current.createPrescription(invalidPrescription)
        } catch (error: any) {
          expect(error.message).toContain('dosage_excessive')
        }
      })

      expect(mockApiClient.createPrescription).not.toHaveBeenCalled()
    })

    it('debe manejar sustancias controladas con DEA validation', async () => {
      const controlledSubstance = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        medications: [
          {
            name: 'Oxycodone',
            strength: '5mg',
            quantity: 30,
            controlledSubstance: true,
            scheduleII: true,
            indication: 'severe_pain_post_surgery'
          }
        ],
        deaNumber: 'BD1234567'
      }

      mockApiClient.createPrescription.mockResolvedValue({
        data: {
          id: 'rx-controlled-001',
          ...controlledSubstance,
          status: 'pending_dea_validation',
          specialHandling: true
        }
      })

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.createPrescription(controlledSubstance)
      })

      expect(mockApiClient.createPrescription).toHaveBeenCalledWith(
        expect.objectContaining({
          deaNumber: 'BD1234567',
          medications: expect.arrayContaining([
            expect.objectContaining({
              controlledSubstance: true,
              scheduleII: true
            })
          ])
        })
      )
    })
  })

  describe('Detección de Interacciones Medicamentosas', () => {
    it('debe verificar interacciones automáticamente al cargar prescripciones', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          checkInteractions: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.drugInteractions).toEqual(mockDrugInteractions)
      expect(mockApiClient.checkDrugInteractions).toHaveBeenCalledWith({
        patientId: mockPatientId,
        medications: expect.any(Array)
      })
    })

    it('debe alertar sobre interacciones críticas', async () => {
      const criticalInteraction = {
        ...mockDrugInteractions[0],
        severity: 'contraindicated',
        clinicalEffects: ['death', 'severe_hemorrhage']
      }

      mockApiClient.checkDrugInteractions.mockResolvedValue({
        data: [criticalInteraction]
      })

      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          checkInteractions: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.criticalInteractions).toHaveLength(1)
      expect(result.current.criticalInteractions[0]).toEqual(criticalInteraction)
      expect(result.current.hasContraindications).toBe(true)
    })

    it('debe verificar interacciones al agregar nueva medicación', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          checkInteractions: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const newMedication = {
        name: 'Warfarin',
        strength: '5mg'
      }

      const interactionCheck = await act(async () => {
        return await result.current.checkNewMedicationInteractions(newMedication)
      })

      expect(interactionCheck).toEqual({
        hasInteractions: true,
        interactions: mockDrugInteractions,
        recommendation: 'monitor_closely',
        severity: 'major'
      })
    })
  })

  describe('Integración con Farmacias', () => {
    it('debe enviar prescripción a farmacia seleccionada', async () => {
      const pharmacyOrder: PharmacyOrder = {
        prescriptionId: 'rx-001',
        pharmacyId: 'pharmacy-001',
        deliveryMethod: 'pickup',
        insurance: {
          planId: 'ins-001',
          memberId: 'member-123'
        }
      }

      mockApiClient.submitToPharmacy.mockResolvedValue({
        data: {
          orderId: 'order-001',
          status: 'submitted',
          estimatedReadyTime: '2025-08-11T16:00:00Z'
        }
      })

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.sendToPharmacy(pharmacyOrder)
      })

      expect(mockApiClient.submitToPharmacy).toHaveBeenCalledWith(pharmacyOrder)
      expect(result.current.pharmacyOrders).toContainEqual(
        expect.objectContaining({
          orderId: 'order-001',
          status: 'submitted'
        })
      )
    })

    it('debe rastrear estado de prescripciones en farmacia', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          trackPharmacyStatus: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const pharmacyStatus = result.current.getPharmacyStatus('rx-001')
      
      expect(pharmacyStatus).toEqual({
        status: 'ready_for_pickup',
        pharmacy: expect.objectContaining({
          name: 'CVS Pharmacy'
        }),
        estimatedCost: expect.any(Number),
        insuranceCoverage: expect.any(Object)
      })
    })

    it('debe manejar problemas de seguros y autorizaciones previas', async () => {
      const insuranceIssue = {
        prescriptionId: 'rx-002',
        issue: 'prior_authorization_required',
        message: 'Insurance requires prior authorization for brand medication',
        alternatives: ['generic_metformin', 'extended_release_metformin']
      }

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Simular problema de seguro
      act(() => {
        result.current.handleInsuranceIssue(insuranceIssue)
      })

      expect(result.current.insuranceIssues).toContainEqual(insuranceIssue)
      expect(result.current.getInsuranceAlternatives('rx-002')).toEqual([
        'generic_metformin',
        'extended_release_metformin'
      ])
    })
  })

  describe('Tracking de Adherencia', () => {
    it('debe monitorear adherencia del paciente a medicamentos', async () => {
      const adherenceData: AdherenceTracking = {
        patientId: mockPatientId,
        prescriptionId: 'rx-001',
        medication: 'Lisinopril',
        period: '30_days',
        dosesGiven: 25,
        dosesExpected: 30,
        adherenceRate: 83.3,
        missedDoses: [
          '2025-08-05T08:00:00Z',
          '2025-08-07T08:00:00Z',
          '2025-08-09T08:00:00Z'
        ]
      }

      mockApiClient.trackAdherence.mockResolvedValue({ data: adherenceData })

      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          trackAdherence: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const adherence = result.current.getAdherenceData('rx-001')

      expect(adherence).toEqual(adherenceData)
      expect(result.current.adherenceAlerts).toContainEqual(
        expect.objectContaining({
          prescriptionId: 'rx-001',
          alertType: 'poor_adherence',
          adherenceRate: 83.3,
          recommendation: 'patient_education_needed'
        })
      )
    })

    it('debe generar recordatorios para dosis olvidadas', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          enableReminders: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const reminders = result.current.getMedicationReminders()

      expect(reminders).toEqual([
        expect.objectContaining({
          prescriptionId: 'rx-001',
          medication: 'Lisinopril',
          nextDoseTime: expect.any(String),
          reminderType: 'dose_due',
          priority: 'normal'
        })
      ])
    })
  })

  describe('Gestión de Refills', () => {
    it('debe procesar solicitudes de refill', async () => {
      const refillRequest: RefillRequest = {
        prescriptionId: 'rx-001',
        requestedBy: 'patient',
        requestDate: '2025-08-11T15:00:00Z',
        pharmacyId: 'pharmacy-001'
      }

      mockApiClient.requestRefill.mockResolvedValue({
        data: {
          refillId: 'refill-001',
          status: 'approved',
          refillNumber: 1,
          estimatedReadyTime: '2025-08-12T10:00:00Z'
        }
      })

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestRefill(refillRequest)
      })

      expect(mockApiClient.requestRefill).toHaveBeenCalledWith(refillRequest)
      expect(result.current.pendingRefills).toContainEqual(
        expect.objectContaining({
          refillId: 'refill-001',
          status: 'approved'
        })
      )
    })

    it('debe manejar refills que requieren nueva prescripción', async () => {
      const expiredPrescription = {
        ...mockPrescriptions[0],
        refillsRemaining: 0,
        status: 'expired' as PrescriptionStatus
      }

      const refillRequest: RefillRequest = {
        prescriptionId: 'rx-001',
        requestedBy: 'patient'
      }

      mockApiClient.requestRefill.mockResolvedValue({
        data: {
          status: 'requires_new_prescription',
          message: 'No refills remaining, contact prescriber'
        }
      })

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        const refillResult = await result.current.requestRefill(refillRequest)
        expect(refillResult.requiresNewPrescription).toBe(true)
      })

      expect(result.current.refillsRequiringNewRx).toContainEqual(
        expect.objectContaining({
          prescriptionId: 'rx-001',
          reason: 'no_refills_remaining'
        })
      )
    })
  })

  describe('Análisis y Reportes', () => {
    it('debe generar resumen de medicamentos activos', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const medicationSummary = result.current.getMedicationSummary()

      expect(medicationSummary).toEqual({
        totalPrescriptions: 2,
        activePrescriptions: 1,
        pendingPrescriptions: 1,
        medicationCategories: [
          'ace_inhibitor', // Lisinopril
          'antidiabetic'   // Metformin
        ],
        monthlyDrugCost: expect.any(Number),
        adherenceOverall: expect.any(Number)
      })
    })

    it('debe identificar oportunidades de optimización', async () => {
      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          analyzeOptimization: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const optimizations = result.current.getOptimizationOpportunities()

      expect(optimizations).toEqual([
        expect.objectContaining({
          type: 'generic_substitution',
          prescription: 'rx-001',
          currentCost: expect.any(Number),
          potentialSavings: expect.any(Number),
          recommendation: 'Switch to generic equivalent'
        }),
        expect.objectContaining({
          type: 'dosage_optimization',
          recommendation: 'Consider once-daily formulation'
        })
      ])
    })
  })

  describe('Error Handling y Recovery', () => {
    it('debe manejar errores de farmacia y reintentar', async () => {
      const pharmacyError = new Error('Pharmacy system temporarily unavailable')
      mockApiClient.submitToPharmacy.mockRejectedValueOnce(pharmacyError)
      
      // Segundo intento exitoso
      mockApiClient.submitToPharmacy.mockResolvedValueOnce({
        data: { orderId: 'order-001', status: 'submitted' }
      })

      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          autoRetry: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.sendToPharmacy({
          prescriptionId: 'rx-001',
          pharmacyId: 'pharmacy-001'
        })
      })

      expect(mockApiClient.submitToPharmacy).toHaveBeenCalledTimes(2)
      expect(result.current.pharmacyOrders).toHaveLength(1)
    })

    it('debe mantener estado consistente en caso de errores', async () => {
      const error = new Error('Validation failed')
      mockApiClient.createPrescription.mockRejectedValue(error)

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const originalCount = result.current.prescriptions.length

      await act(async () => {
        try {
          await result.current.createPrescription({
            patientId: mockPatientId,
            medications: [{ name: 'Invalid' }]
          })
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      // Estado debe permanecer sin cambios
      expect(result.current.prescriptions).toHaveLength(originalCount)
      expect(result.current.error).toBe(error)
    })
  })

  describe('Performance y Cache', () => {
    it('debe completar carga de prescripciones en <1 segundo', async () => {
      const startTime = performance.now()

      const { result } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // <1 segundo
    })

    it('debe usar cache para requests duplicados', async () => {
      // Primer hook
      const { result: result1 } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      await waitFor(() => expect(result1.current.isLoading).toBe(false))

      // Segundo hook con mismo paciente - debe usar cache
      const { result: result2 } = renderHook(
        () => usePrescriptions({ patientId: mockPatientId }),
        { wrapper }
      )

      expect(result2.current.isLoading).toBe(false) // Inmediato desde cache
      expect(mockApiClient.getPrescriptions).toHaveBeenCalledTimes(1)
    })
  })

  describe('Compliance DEA y Auditoría', () => {
    it('debe mantener audit trail para sustancias controladas', async () => {
      const auditSpy = vi.fn()

      const { result } = renderHook(
        () => usePrescriptions({ 
          patientId: mockPatientId,
          onAuditEvent: auditSpy 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Crear prescripción de sustancia controlada
      await act(async () => {
        await result.current.createPrescription({
          patientId: mockPatientId,
          medications: [
            {
              name: 'Oxycodone',
              controlledSubstance: true,
              scheduleII: true
            }
          ],
          deaNumber: 'BD1234567'
        })
      })

      expect(auditSpy).toHaveBeenCalledWith({
        action: 'controlled_substance_prescribed',
        patientId: mockPatientId,
        medication: 'Oxycodone',
        schedule: 'II',
        deaNumber: 'BD1234567',
        timestamp: expect.any(String)
      })
    })
  })
})