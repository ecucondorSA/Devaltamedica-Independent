/**
 * Integration Test: Flujo Completo Paciente-Cita-Consulta
 * 
 * Este test valida la integración entre:
 * - API de pacientes
 * - API de citas
 * - API de consultas
 * - Base de datos médica
 * - Notificaciones en tiempo real
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database-setup'
import { createTestPatient, createTestDoctor } from '../helpers/test-data-generators'
import { apiRequest } from '../helpers/api-client'
import { validateHIPAACompliance } from '../helpers/hipaa-validator'

describe('Integration: Flujo Paciente-Cita-Consulta', () => {
  let testPatient: any
  let testDoctor: any
  let testAppointment: any
  let testConsultation: any

  beforeAll(async () => {
    // Setup base de datos de prueba
    await setupTestDatabase()
  })

  beforeEach(async () => {
    // Crear datos de prueba para cada test
    testPatient = await createTestPatient({
      age: 45,
      conditions: ['hypertension'],
      insurance: 'test-insurance-001'
    })

    testDoctor = await createTestDoctor({
      specialty: 'cardiology',
      availability: 'available',
      languages: ['en', 'es']
    })
  })

  afterEach(async () => {
    // Limpiar datos de prueba
    await cleanupTestDatabase()
  })

  describe('Paso 1: Registro y Búsqueda de Doctor', () => {
    it('debe permitir al paciente buscar doctores por especialidad', async () => {
      // Simular búsqueda de doctor por paciente
      const searchRequest = {
        specialty: 'cardiology',
        location: 'remote', // telemedicina
        insurance: 'test-insurance-001',
        language: 'es'
      }

      const response = await apiRequest('POST', '/api/v1/doctors/search', {
        body: searchRequest,
        patientId: testPatient.id
      })

      expect(response.status).toBe(200)
      expect(response.data.doctors).toHaveLength(1)
      expect(response.data.doctors[0].id).toBe(testDoctor.id)
      
      // Validar que no se expone PHI del doctor
      const complianceResult = validateHIPAACompliance(response.data.doctors[0])
      expect(complianceResult.isCompliant).toBe(true)
    })

    it('debe registrar la búsqueda en audit log', async () => {
      await apiRequest('POST', '/api/v1/doctors/search', {
        body: { specialty: 'cardiology' },
        patientId: testPatient.id
      })

      // Verificar registro de auditoría
      const auditLogs = await apiRequest('GET', `/api/v1/audit/patient/${testPatient.id}`)
      
      expect(auditLogs.data.logs).toContainEqual(
        expect.objectContaining({
          action: 'doctor_search',
          patientId: testPatient.id,
          specialty: 'cardiology'
        })
      )
    })
  })

  describe('Paso 2: Reserva de Cita', () => {
    it('debe crear cita con validación de disponibilidad', async () => {
      const appointmentRequest = {
        doctorId: testDoctor.id,
        patientId: testPatient.id,
        type: 'telemedicine',
        preferredDate: '2025-08-15T10:00:00Z',
        duration: 30,
        reason: 'routine_checkup',
        urgency: 'routine'
      }

      const response = await apiRequest('POST', '/api/v1/appointments', {
        body: appointmentRequest,
        patientId: testPatient.id
      })

      expect(response.status).toBe(201)
      expect(response.data.appointment).toMatchObject({
        doctorId: testDoctor.id,
        patientId: testPatient.id,
        status: 'scheduled',
        type: 'telemedicine'
      })

      testAppointment = response.data.appointment

      // Verificar que se actualizó la disponibilidad del doctor
      const doctorAvailability = await apiRequest('GET', `/api/v1/doctors/${testDoctor.id}/availability`)
      expect(doctorAvailability.data.slots).not.toContainEqual(
        expect.objectContaining({ datetime: '2025-08-15T10:00:00Z' })
      )
    })

    it('debe enviar notificaciones a paciente y doctor', async () => {
      const appointmentRequest = {
        doctorId: testDoctor.id,
        patientId: testPatient.id,
        type: 'telemedicine',
        preferredDate: '2025-08-15T10:00:00Z'
      }

      await apiRequest('POST', '/api/v1/appointments', {
        body: appointmentRequest,
        patientId: testPatient.id
      })

      // Verificar notificación al paciente
      const patientNotifications = await apiRequest('GET', `/api/v1/notifications/patient/${testPatient.id}`)
      expect(patientNotifications.data.notifications).toContainEqual(
        expect.objectContaining({
          type: 'appointment_scheduled',
          recipientId: testPatient.id
        })
      )

      // Verificar notificación al doctor
      const doctorNotifications = await apiRequest('GET', `/api/v1/notifications/doctor/${testDoctor.id}`)
      expect(doctorNotifications.data.notifications).toContainEqual(
        expect.objectContaining({
          type: 'appointment_scheduled',
          recipientId: testDoctor.id
        })
      )
    })

    it('debe validar conflictos de horario', async () => {
      // Crear primera cita
      await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          preferredDate: '2025-08-15T10:00:00Z'
        },
        patientId: testPatient.id
      })

      // Intentar crear segunda cita en mismo horario
      const conflictResponse = await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: 'another-patient',
          preferredDate: '2025-08-15T10:00:00Z'
        },
        patientId: 'another-patient'
      })

      expect(conflictResponse.status).toBe(409)
      expect(conflictResponse.data.error).toContain('time_conflict')
    })
  })

  describe('Paso 3: Inicio de Consulta', () => {
    beforeEach(async () => {
      // Crear cita para la consulta
      const appointmentResponse = await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          type: 'telemedicine',
          preferredDate: new Date(Date.now() + 5 * 60 * 1000).toISOString() // +5 min
        },
        patientId: testPatient.id
      })
      testAppointment = appointmentResponse.data.appointment
    })

    it('debe iniciar consulta y crear registro médico', async () => {
      const consultationStart = {
        appointmentId: testAppointment.id,
        startedBy: testDoctor.id,
        consultationType: 'video',
        patientVitals: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          temperature: 36.6,
          oxygenSaturation: 98
        }
      }

      const response = await apiRequest('POST', '/api/v1/consultations/start', {
        body: consultationStart,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(201)
      expect(response.data.consultation).toMatchObject({
        appointmentId: testAppointment.id,
        doctorId: testDoctor.id,
        patientId: testPatient.id,
        status: 'in_progress'
      })

      testConsultation = response.data.consultation

      // Verificar que se creó registro médico
      const medicalRecord = await apiRequest('GET', `/api/v1/medical-records/consultation/${testConsultation.id}`)
      expect(medicalRecord.status).toBe(200)
      expect(medicalRecord.data.record.vitals).toMatchObject(consultationStart.patientVitals)
    })

    it('debe actualizar estado de cita a "in_progress"', async () => {
      await apiRequest('POST', '/api/v1/consultations/start', {
        body: {
          appointmentId: testAppointment.id,
          startedBy: testDoctor.id
        },
        doctorId: testDoctor.id
      })

      // Verificar estado actualizado de la cita
      const updatedAppointment = await apiRequest('GET', `/api/v1/appointments/${testAppointment.id}`)
      expect(updatedAppointment.data.appointment.status).toBe('in_progress')
    })
  })

  describe('Paso 4: Durante la Consulta - Gestión de Datos Médicos', () => {
    beforeEach(async () => {
      // Setup consulta en progreso
      const appointmentResponse = await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          type: 'telemedicine'
        },
        patientId: testPatient.id
      })
      testAppointment = appointmentResponse.data.appointment

      const consultationResponse = await apiRequest('POST', '/api/v1/consultations/start', {
        body: {
          appointmentId: testAppointment.id,
          startedBy: testDoctor.id
        },
        doctorId: testDoctor.id
      })
      testConsultation = consultationResponse.data.consultation
    })

    it('debe permitir al doctor agregar notas y diagnóstico', async () => {
      const medicalNotes = {
        consultationId: testConsultation.id,
        symptoms: ['chest_pain', 'shortness_of_breath'],
        diagnosis: 'mild_hypertension',
        notes: 'Patient reports occasional chest discomfort. BP slightly elevated.',
        recommendations: ['lifestyle_changes', 'follow_up_2_weeks'],
        severity: 'mild'
      }

      const response = await apiRequest('PUT', `/api/v1/consultations/${testConsultation.id}/medical-notes`, {
        body: medicalNotes,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(200)

      // Verificar que las notas se guardaron
      const consultation = await apiRequest('GET', `/api/v1/consultations/${testConsultation.id}`)
      expect(consultation.data.consultation.diagnosis).toBe('mild_hypertension')
      expect(consultation.data.consultation.notes).toContain('chest discomfort')
    })

    it('debe validar autorización del doctor para modificar', async () => {
      // Intentar modificar con doctor no autorizado
      const unauthorizedResponse = await apiRequest('PUT', `/api/v1/consultations/${testConsultation.id}/medical-notes`, {
        body: { diagnosis: 'unauthorized_change' },
        doctorId: 'unauthorized-doctor-id'
      })

      expect(unauthorizedResponse.status).toBe(403)
      expect(unauthorizedResponse.data.error).toContain('unauthorized')
    })
  })

  describe('Paso 5: Finalización de Consulta', () => {
    beforeEach(async () => {
      // Setup consulta completa en progreso
      const appointmentResponse = await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          type: 'telemedicine'
        },
        patientId: testPatient.id
      })
      testAppointment = appointmentResponse.data.appointment

      const consultationResponse = await apiRequest('POST', '/api/v1/consultations/start', {
        body: {
          appointmentId: testAppointment.id,
          startedBy: testDoctor.id
        },
        doctorId: testDoctor.id
      })
      testConsultation = consultationResponse.data.consultation

      // Agregar datos médicos
      await apiRequest('PUT', `/api/v1/consultations/${testConsultation.id}/medical-notes`, {
        body: {
          diagnosis: 'mild_hypertension',
          recommendations: ['lifestyle_changes']
        },
        doctorId: testDoctor.id
      })
    })

    it('debe finalizar consulta y generar resumen', async () => {
      const finalizationData = {
        consultationId: testConsultation.id,
        duration: 25, // minutos
        outcome: 'completed',
        nextAppointment: '2025-09-15T10:00:00Z',
        prescriptions: [{
          medication: 'lisinopril',
          dosage: '5mg',
          frequency: 'once_daily',
          duration: '30_days'
        }]
      }

      const response = await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/complete`, {
        body: finalizationData,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(200)
      expect(response.data.consultation.status).toBe('completed')
      expect(response.data.summary).toBeDefined()

      // Verificar que se actualizó el estado de la cita
      const updatedAppointment = await apiRequest('GET', `/api/v1/appointments/${testAppointment.id}`)
      expect(updatedAppointment.data.appointment.status).toBe('completed')
    })

    it('debe generar facturación automática', async () => {
      await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/complete`, {
        body: {
          consultationId: testConsultation.id,
          duration: 25
        },
        doctorId: testDoctor.id
      })

      // Verificar generación de factura
      const billing = await apiRequest('GET', `/api/v1/billing/consultation/${testConsultation.id}`)
      expect(billing.status).toBe(200)
      expect(billing.data.invoice).toMatchObject({
        consultationId: testConsultation.id,
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        amount: expect.any(Number),
        status: 'pending'
      })
    })

    it('debe enviar resumen al paciente', async () => {
      await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/complete`, {
        body: { duration: 25 },
        doctorId: testDoctor.id
      })

      // Verificar notificación de resumen
      const patientNotifications = await apiRequest('GET', `/api/v1/notifications/patient/${testPatient.id}`)
      
      const summaryNotification = patientNotifications.data.notifications.find(
        (n: any) => n.type === 'consultation_summary'
      )
      
      expect(summaryNotification).toBeDefined()
      expect(summaryNotification.data.consultationId).toBe(testConsultation.id)
    })
  })

  describe('Paso 6: Seguimiento Post-Consulta', () => {
    it('debe programar recordatorios de seguimiento', async () => {
      // Completar consulta con seguimiento
      await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/complete`, {
        body: {
          duration: 25,
          followUpRequired: true,
          followUpDate: '2025-09-15T10:00:00Z'
        },
        doctorId: testDoctor.id
      })

      // Verificar programación de recordatorio
      const reminders = await apiRequest('GET', `/api/v1/reminders/patient/${testPatient.id}`)
      
      expect(reminders.data.reminders).toContainEqual(
        expect.objectContaining({
          type: 'follow_up_reminder',
          patientId: testPatient.id,
          scheduledFor: '2025-09-15T10:00:00Z'
        })
      )
    })
  })

  describe('Validaciones de Compliance Médico', () => {
    it('debe mantener audit trail completo del flujo', async () => {
      // Ejecutar flujo completo
      const appointment = await apiRequest('POST', '/api/v1/appointments', {
        body: {
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          type: 'telemedicine'
        },
        patientId: testPatient.id
      })

      const consultation = await apiRequest('POST', '/api/v1/consultations/start', {
        body: { appointmentId: appointment.data.appointment.id, startedBy: testDoctor.id },
        doctorId: testDoctor.id
      })

      await apiRequest('POST', `/api/v1/consultations/${consultation.data.consultation.id}/complete`, {
        body: { duration: 25 },
        doctorId: testDoctor.id
      })

      // Verificar audit trail completo
      const auditTrail = await apiRequest('GET', `/api/v1/audit/full-trail/patient/${testPatient.id}`)
      
      const expectedActions = [
        'appointment_scheduled',
        'consultation_started', 
        'medical_notes_added',
        'consultation_completed'
      ]

      expectedActions.forEach(action => {
        expect(auditTrail.data.trail).toContainEqual(
          expect.objectContaining({ action })
        )
      })
    })

    it('debe cumplir con todos los requisitos HIPAA', async () => {
      // Ejecutar flujo y verificar compliance
      const flowData = {
        patient: testPatient,
        doctor: testDoctor,
        consultation: testConsultation
      }

      const complianceResult = validateHIPAACompliance(flowData)
      
      expect(complianceResult.isCompliant).toBe(true)
      expect(complianceResult.violations).toHaveLength(0)
      
      // Verificar que todos los datos están encriptados
      expect(complianceResult.encryptionStatus.patient).toBe('encrypted')
      expect(complianceResult.encryptionStatus.medicalNotes).toBe('encrypted')
    })
  })
})