/**
 * FASE 2: Tests Hooks Médicos - useVitalSigns
 * 
 * ⚠️ CRITICAL: Hook para monitoreo de signos vitales en tiempo real
 * - Streaming de datos vitales desde dispositivos médicos
 * - Alertas automáticas para valores críticos  
 * - Trends y análisis predictivo
 * - Integración con WebRTC para telemedicina
 * 
 * Fallas pueden resultar en no detectar emergencias médicas.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useVitalSigns } from '../useVitalSigns'
import { createWrapper } from '../../__tests__/utils'
import type { 
  VitalSigns, 
  VitalSignsReading, 
  VitalSignsAlert, 
  VitalSignsTrend,
  PatientDemographics 
} from '@altamedica/types'

// Mock WebSocket para streaming
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: WebSocket.OPEN,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Mock API client
const mockApiClient = {
  getVitalSigns: vi.fn(),
  getVitalSignsHistory: vi.fn(),
  subscribeToVitalSigns: vi.fn(),
  createVitalSignsAlert: vi.fn(),
  acknowledgeAlert: vi.fn()
}

vi.mock('@altamedica/api-client', () => ({
  apiClient: mockApiClient
}))

// Mock WebSocket
global.WebSocket = vi.fn(() => mockWebSocket) as any

describe('useVitalSigns Hook - FASE 2', () => {
  let queryClient: QueryClient
  let wrapper: any

  const mockPatientId = 'patient-123'
  
  const mockPatientDemo: PatientDemographics = {
    age: 45,
    sex: 'male',
    weight: 80,
    height: 180,
    medicalConditions: ['hypertension'],
    medications: ['lisinopril']
  }

  const mockCurrentVitals: VitalSigns = {
    patientId: mockPatientId,
    timestamp: '2025-08-11T14:30:00Z',
    bloodPressure: {
      systolic: 145,
      diastolic: 92,
      meanArterialPressure: 110
    },
    heartRate: 78,
    respiratoryRate: 16,
    temperature: 37.1,
    oxygenSaturation: 96,
    painLevel: 3,
    consciousnessLevel: 'alert',
    deviceInfo: {
      bloodPressureDevice: 'Omron_HEM-7120',
      pulseOximeterDevice: 'Nonin_3230',
      thermometerDevice: 'Braun_ThermoScan_7'
    }
  }

  const mockVitalSignsHistory: VitalSignsReading[] = [
    {
      id: 'reading-1',
      patientId: mockPatientId,
      timestamp: '2025-08-11T14:30:00Z',
      vitals: mockCurrentVitals,
      takenBy: 'nurse-123',
      location: 'room-205'
    },
    {
      id: 'reading-2',
      patientId: mockPatientId,
      timestamp: '2025-08-11T14:00:00Z',
      vitals: {
        ...mockCurrentVitals,
        bloodPressure: { systolic: 142, diastolic: 88, meanArterialPressure: 106 },
        heartRate: 75
      },
      takenBy: 'nurse-123'
    },
    {
      id: 'reading-3',
      patientId: mockPatientId,
      timestamp: '2025-08-11T13:30:00Z',
      vitals: {
        ...mockCurrentVitals,
        bloodPressure: { systolic: 140, diastolic: 85, meanArterialPressure: 103 },
        heartRate: 72
      },
      takenBy: 'auto-device'
    }
  ]

  const mockAlerts: VitalSignsAlert[] = [
    {
      id: 'alert-1',
      patientId: mockPatientId,
      alertType: 'blood_pressure_elevated',
      severity: 'high',
      message: 'Blood pressure consistently above normal (145/92)',
      triggeredAt: '2025-08-11T14:30:00Z',
      status: 'active',
      thresholdExceeded: {
        parameter: 'systolic_bp',
        value: 145,
        threshold: 140,
        unit: 'mmHg'
      },
      recommendedActions: [
        'notify_physician',
        'recheck_in_15_minutes',
        'consider_medication_adjustment'
      ]
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
    mockApiClient.getVitalSigns.mockResolvedValue({ data: mockCurrentVitals })
    mockApiClient.getVitalSignsHistory.mockResolvedValue({ data: mockVitalSignsHistory })
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Monitoreo de Signos Vitales Actuales', () => {
    it('debe cargar signos vitales actuales del paciente', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { patientDemo: mockPatientDemo }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.currentVitals).toBeUndefined()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.currentVitals).toEqual(mockCurrentVitals)
      expect(result.current.bloodPressure).toEqual({
        systolic: 145,
        diastolic: 92,
        meanArterialPressure: 110
      })
      expect(result.current.heartRate).toBe(78)
      expect(mockApiClient.getVitalSigns).toHaveBeenCalledWith(mockPatientId)
    })

    it('debe categorizar signos vitales según rangos médicos', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { patientDemo: mockPatientDemo }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.vitalCategories).toEqual({
        bloodPressure: 'stage_1_hypertension', // 145/92
        heartRate: 'normal', // 78 bpm
        respiratoryRate: 'normal', // 16 rpm  
        temperature: 'low_grade_fever', // 37.1°C
        oxygenSaturation: 'normal', // 96%
        overall: 'abnormal'
      })
    })

    it('debe calcular scores médicos (NEWS, qSOFA)', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          patientDemo: mockPatientDemo,
          calculateScores: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.medicalScores).toEqual({
        news: {
          score: 3, // BP=1, Temp=1, SpO2=1, RR=0, HR=0, Consciousness=0
          riskLevel: 'medium_risk',
          recommendation: 'increase_monitoring_frequency'
        },
        qSOFA: {
          score: 0, // No criteria met
          sepsisRisk: 'low'
        },
        mews: {
          score: 3,
          priority: 'medium'
        }
      })
    })
  })

  describe('Streaming en Tiempo Real', () => {
    it('debe establecer conexión WebSocket para streaming', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          realTimeStreaming: true,
          streamingInterval: 5000 // 5 segundos
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.isStreaming).toBe(true)
      expect(result.current.streamingStatus).toBe('connected')
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('debe procesar datos streaming y actualizar vitales en tiempo real', async () => {
      let messageHandler: (event: any) => void = () => {}
      
      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          messageHandler = handler
        }
      })

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { realTimeStreaming: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isStreaming).toBe(true))

      // Simular datos streaming
      const newVitalData = {
        timestamp: '2025-08-11T14:35:00Z',
        bloodPressure: { systolic: 150, diastolic: 95 },
        heartRate: 82,
        oxygenSaturation: 95
      }

      act(() => {
        messageHandler({
          data: JSON.stringify({
            type: 'vital_signs_update',
            patientId: mockPatientId,
            data: newVitalData
          })
        })
      })

      expect(result.current.currentVitals?.bloodPressure?.systolic).toBe(150)
      expect(result.current.heartRate).toBe(82)
      expect(result.current.lastUpdated).toBe('2025-08-11T14:35:00Z')
    })

    it('debe manejar desconexiones y reconexión automática', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          realTimeStreaming: true,
          autoReconnect: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isStreaming).toBe(true))

      // Simular desconexión
      act(() => {
        result.current.onConnectionLost()
      })

      expect(result.current.streamingStatus).toBe('disconnected')
      expect(result.current.reconnectAttempts).toBe(1)

      // Simular reconexión exitosa
      await act(async () => {
        await result.current.reconnect()
      })

      expect(result.current.streamingStatus).toBe('connected')
      expect(result.current.isStreaming).toBe(true)
    })
  })

  describe('Detección y Gestión de Alertas', () => {
    it('debe generar alertas automáticas para valores críticos', async () => {
      const criticalVitals = {
        ...mockCurrentVitals,
        bloodPressure: { systolic: 195, diastolic: 125 }, // Crisis hipertensiva
        heartRate: 45, // Bradicardia severa
        oxygenSaturation: 88 // Hipoxemia
      }

      mockApiClient.getVitalSigns.mockResolvedValue({ data: criticalVitals })

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          patientDemo: mockPatientDemo,
          alertsEnabled: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.activeAlerts).toHaveLength(3)
      
      const hypertensiveAlert = result.current.activeAlerts.find(
        alert => alert.alertType === 'hypertensive_crisis'
      )
      expect(hypertensiveAlert).toEqual(
        expect.objectContaining({
          severity: 'critical',
          message: expect.stringContaining('Crisis hipertensiva'),
          recommendedActions: expect.arrayContaining(['immediate_physician_notification'])
        })
      )
    })

    it('debe configurar alertas personalizadas según condiciones del paciente', async () => {
      const diabeticPatient = {
        ...mockPatientDemo,
        medicalConditions: ['diabetes_type_2', 'hypertension']
      }

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          patientDemo: diabeticPatient,
          customAlertThresholds: {
            systolic_bp: { critical: 170, high: 150 }, // Más estricto para diabéticos
            heart_rate: { low: 50, high: 110 }
          }
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.alertThresholds.systolic_bp.high).toBe(150)
      expect(result.current.alertThresholds.systolic_bp.critical).toBe(170)
    })

    it('debe permitir acknowledgment y resolución de alertas', async () => {
      mockApiClient.acknowledgeAlert.mockResolvedValue({ success: true })

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { alertsEnabled: true }),
        { wrapper }
      )

      // Simular alerta activa
      act(() => {
        result.current.triggerAlert({
          alertType: 'blood_pressure_elevated',
          severity: 'high',
          message: 'BP elevated'
        })
      })

      expect(result.current.activeAlerts).toHaveLength(1)

      // Acknowledge alerta
      await act(async () => {
        await result.current.acknowledgeAlert('alert-1', {
          acknowledgedBy: 'nurse-123',
          notes: 'Physician notified, medication adjusted'
        })
      })

      expect(mockApiClient.acknowledgeAlert).toHaveBeenCalledWith('alert-1', {
        acknowledgedBy: 'nurse-123',
        notes: 'Physician notified, medication adjusted'
      })
    })
  })

  describe('Análisis de Tendencias Temporales', () => {
    it('debe cargar y analizar historial de signos vitales', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          includeHistory: true,
          historyPeriod: '24_hours'
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.vitalHistory).toEqual(mockVitalSignsHistory)
      expect(result.current.vitalHistory).toHaveLength(3)
      expect(mockApiClient.getVitalSignsHistory).toHaveBeenCalledWith(
        mockPatientId,
        { period: '24_hours' }
      )
    })

    it('debe calcular trends y predicciones', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          includeHistory: true,
          analyzeTrends: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.trends).toEqual({
        bloodPressure: {
          systolic: {
            trend: 'increasing', // 140 → 142 → 145
            rate: 2.5, // mmHg/hour
            prediction: {
              next_hour: 147,
              confidence: 0.85
            }
          },
          diastolic: {
            trend: 'increasing', // 85 → 88 → 92
            rate: 3.5 // mmHg/hour
          }
        },
        heartRate: {
          trend: 'increasing', // 72 → 75 → 78
          rate: 3, // bpm/hour
          variability: 'normal'
        }
      })
    })

    it('debe identificar patrones circadianos', async () => {
      // Mock historial de 24 horas con patrón circadiano
      const circadianHistory = Array.from({ length: 24 }, (_, hour) => ({
        id: `reading-${hour}`,
        patientId: mockPatientId,
        timestamp: `2025-08-11T${hour.toString().padStart(2, '0')}:00:00Z`,
        vitals: {
          ...mockCurrentVitals,
          bloodPressure: {
            systolic: 120 + Math.sin(hour * Math.PI / 12) * 15, // Patrón circadiano
            diastolic: 80 + Math.sin(hour * Math.PI / 12) * 8
          },
          heartRate: 70 + Math.sin(hour * Math.PI / 12) * 10
        }
      }))

      mockApiClient.getVitalSignsHistory.mockResolvedValue({ data: circadianHistory })

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          includeHistory: true,
          analyzeTrends: true,
          detectCircadianPatterns: true
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.circadianPatterns).toEqual({
        bloodPressure: {
          hasPattern: true,
          peakTime: expect.stringMatching(/06:00|18:00/), // Early morning or evening
          troughTime: expect.stringMatching(/00:00|12:00/), // Midnight or noon
          amplitude: expect.any(Number)
        },
        heartRate: {
          hasPattern: true,
          normalVariation: true
        }
      })
    })
  })

  describe('Integración con Dispositivos Médicos', () => {
    it('debe validar calibración y precisión de dispositivos', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          validateDevices: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.deviceValidation).toEqual({
        bloodPressureDevice: {
          model: 'Omron_HEM-7120',
          calibrationStatus: 'valid',
          lastCalibrated: expect.any(String),
          accuracy: 'clinical_grade'
        },
        pulseOximeterDevice: {
          model: 'Nonin_3230',
          calibrationStatus: 'valid',
          signalQuality: 'good'
        }
      })
    })

    it('debe detectar errores de medición y anomalías', async () => {
      const anomalousVitals = {
        ...mockCurrentVitals,
        bloodPressure: { systolic: 80, diastolic: 120 }, // Imposible
        heartRate: 300, // Imposible
        oxygenSaturation: 110 // >100% imposible
      }

      mockApiClient.getVitalSigns.mockResolvedValue({ data: anomalousVitals })

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          validateReadings: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.measurementErrors).toEqual([
        {
          parameter: 'blood_pressure',
          error: 'diastolic_higher_than_systolic',
          severity: 'critical'
        },
        {
          parameter: 'heart_rate',
          error: 'physiologically_impossible',
          severity: 'critical'
        },
        {
          parameter: 'oxygen_saturation',
          error: 'value_exceeds_maximum',
          severity: 'critical'
        }
      ])

      expect(result.current.dataQuality).toBe('invalid')
    })
  })

  describe('Comparación con Normas Poblacionales', () => {
    it('debe comparar vitales con percentiles por edad/sexo', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          patientDemo: mockPatientDemo,
          compareWithNorms: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.populationComparison).toEqual({
        bloodPressure: {
          systolic: {
            percentile: 85, // Percentil 85 para hombre de 45 años
            interpretation: 'above_average'
          },
          diastolic: {
            percentile: 82,
            interpretation: 'above_average'
          }
        },
        heartRate: {
          percentile: 45, // Normal
          interpretation: 'average'
        }
      })
    })

    it('debe ajustar normas según condiciones médicas', async () => {
      const heartFailurePatient = {
        ...mockPatientDemo,
        medicalConditions: ['heart_failure', 'hypertension'],
        medications: ['metoprolol', 'furosemide']
      }

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          patientDemo: heartFailurePatient,
          compareWithNorms: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Debe usar normas ajustadas para pacientes con insuficiencia cardíaca
      expect(result.current.adjustedNorms).toEqual({
        bloodPressure: {
          target_systolic: 130, // Más estricto
          target_diastolic: 80
        },
        heartRate: {
          target_range: [60, 100], // Considerando beta-bloqueadores
          expected_lower: true
        }
      })
    })
  })

  describe('Performance y Optimización', () => {
    it('debe completar carga inicial en <2 segundos', async () => {
      const startTime = performance.now()

      const { result } = renderHook(
        () => useVitalSigns(mockPatientId),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(2000) // <2 segundos
    })

    it('debe manejar streaming eficiente sin memory leaks', async () => {
      const { result, unmount } = renderHook(
        () => useVitalSigns(mockPatientId, { realTimeStreaming: true }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isStreaming).toBe(true))

      // Simular muchas actualizaciones streaming
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.updateFromStream({
            heartRate: 75 + i % 10,
            timestamp: new Date().toISOString()
          })
        })
      }

      // Cleanup debe limpiar conexiones
      unmount()

      expect(mockWebSocket.close).toHaveBeenCalled()
      expect(mockWebSocket.removeEventListener).toHaveBeenCalled()
    })
  })

  describe('Compliance HIPAA y Auditoría', () => {
    it('debe loggear accesos para audit trail médico', async () => {
      const auditSpy = vi.fn()
      
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          auditLog: true,
          onAuditEvent: auditSpy 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(auditSpy).toHaveBeenCalledWith({
        action: 'vital_signs_accessed',
        patientId: mockPatientId,
        timestamp: expect.any(String),
        userId: expect.any(String),
        source: 'useVitalSigns_hook'
      })
    })

    it('debe manejar datos PHI según regulaciones HIPAA', async () => {
      const { result } = renderHook(
        () => useVitalSigns(mockPatientId, { 
          hipaaCompliant: true 
        }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Verificar que datos sensibles están encriptados/ofuscados en logs
      expect(result.current.debugInfo).not.toContain(mockPatientId)
      expect(result.current.dataEncrypted).toBe(true)
      expect(result.current.accessControlValidated).toBe(true)
    })
  })
})