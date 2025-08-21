/**
 * Integration Test: Flujo Completo de Prescripciones Médicas
 * 
 * Este test valida la integración entre:
 * - API de prescripciones
 * - Validador de interacciones medicamentosas
 * - Sistema de notificaciones
 * - Base de datos de medicamentos
 * - Integración con farmacia
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database-setup'
import { createTestPatient, createTestDoctor, createTestConsultation } from '../helpers/test-data-generators'
import { apiRequest } from '../helpers/api-client'
import { validateHIPAACompliance } from '../helpers/hipaa-validator'

describe('Integration: Flujo de Prescripciones Médicas', () => {
  let testPatient: any
  let testDoctor: any
  let testConsultation: any
  let testPrescription: any

  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    // Crear datos de prueba
    testPatient = await createTestPatient({
      age: 45,
      conditions: ['hypertension', 'diabetes_type_2'],
      allergies: ['penicillin', 'sulfa'],
      currentMedications: ['metformin', 'lisinopril']
    })

    testDoctor = await createTestDoctor({
      specialty: 'internal_medicine',
      licenseNumber: 'MD12345',
      prescriptionAuthority: true,
      deaNumber: 'BD1234567'
    })

    testConsultation = await createTestConsultation({
      patientId: testPatient.id,
      doctorId: testDoctor.id,
      status: 'in_progress',
      type: 'telemedicine'
    })
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  describe('Paso 1: Creación de Prescripción', () => {
    it('debe crear prescripción con validación médica completa', async () => {
      const prescriptionRequest = {
        consultationId: testConsultation.id,
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        medications: [{
          name: 'atorvastatin',
          genericName: 'atorvastatin calcium',
          dosage: '20mg',
          frequency: 'once_daily',
          duration: '90_days',
          instructions: 'Take with food in the evening',
          quantity: 90,
          refills: 2,
          indication: 'hyperlipidemia'
        }]
      }

      const response = await apiRequest('POST', '/api/v1/prescriptions', {
        body: prescriptionRequest,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(201)
      expect(response.data.prescription).toMatchObject({
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        status: 'pending_approval',
        medications: expect.arrayContaining([
          expect.objectContaining({
            name: 'atorvastatin',
            dosage: '20mg'
          })
        ])
      })

      testPrescription = response.data.prescription

      // Verificar que se generó número de prescripción único
      expect(testPrescription.prescriptionNumber).toMatch(/^RX\d{10}$/)
    })

    it('debe validar autorización del doctor para prescribir', async () => {
      // Crear doctor sin autorización de prescripción
      const unauthorizedDoctor = await createTestDoctor({
        specialty: 'physical_therapy',
        prescriptionAuthority: false
      })

      const prescriptionRequest = {
        consultationId: testConsultation.id,
        patientId: testPatient.id,
        medications: [{
          name: 'controlled_substance',
          schedule: 'II'
        }]
      }

      const response = await apiRequest('POST', '/api/v1/prescriptions', {
        body: prescriptionRequest,
        doctorId: unauthorizedDoctor.id
      })

      expect(response.status).toBe(403)
      expect(response.data.error).toContain('prescription_authority_required')
    })

    it('debe validar DEA number para sustancias controladas', async () => {
      const controlledPrescription = {
        consultationId: testConsultation.id,
        patientId: testPatient.id,
        medications: [{
          name: 'oxycodone',
          schedule: 'II',
          dosage: '5mg',
          quantity: 30
        }]
      }

      const response = await apiRequest('POST', '/api/v1/prescriptions', {
        body: controlledPrescription,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(201)
      
      // Verificar que se registró correctamente la sustancia controlada
      expect(response.data.prescription.controlledSubstance).toBe(true)
      expect(response.data.prescription.deaNumberUsed).toBe(testDoctor.deaNumber)
    })
  })

  describe('Paso 2: Validación de Interacciones Medicamentosas', () => {
    beforeEach(async () => {
      // Crear prescripción base
      const prescriptionResponse = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'atorvastatin',
            dosage: '20mg'
          }]
        },
        doctorId: testDoctor.id
      })
      testPrescription = prescriptionResponse.data.prescription
    })

    it('debe detectar interacciones con medicamentos actuales', async () => {
      // Intentar agregar medicamento que interactúa
      const interactingMedication = {
        prescriptionId: testPrescription.id,
        medication: {
          name: 'warfarin', // Conocida interacción con atorvastatin
          dosage: '5mg',
          frequency: 'once_daily'
        }
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/add-medication`, {
        body: interactingMedication,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(200)
      expect(response.data.warnings).toHaveLength(1)
      expect(response.data.warnings[0]).toMatchObject({
        type: 'drug_interaction',
        severity: 'moderate',
        drugs: ['atorvastatin', 'warfarin'],
        description: expect.stringContaining('bleeding risk')
      })
    })

    it('debe validar alergias del paciente', async () => {
      // Intentar prescribir medicamento al que el paciente es alérgico
      const allergyMedication = {
        prescriptionId: testPrescription.id,
        medication: {
          name: 'penicillin', // Paciente alérgico a penicilina
          dosage: '500mg'
        }
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/add-medication`, {
        body: allergyMedication,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('patient_allergy')
      expect(response.data.allergen).toBe('penicillin')
    })

    it('debe verificar contraindicaciones por condiciones médicas', async () => {
      // Medicamento contraindicado para diabetes
      const contraindicatedMedication = {
        prescriptionId: testPrescription.id,
        medication: {
          name: 'prednisone', // Puede empeorar diabetes
          dosage: '10mg'
        }
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/add-medication`, {
        body: contraindicatedMedication,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(200)
      expect(response.data.warnings).toContainEqual(
        expect.objectContaining({
          type: 'contraindication',
          condition: 'diabetes_type_2',
          severity: 'high'
        })
      )
    })
  })

  describe('Paso 3: Aprobación y Autorización', () => {
    beforeEach(async () => {
      const prescriptionResponse = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'atorvastatin',
            dosage: '20mg',
            duration: '90_days'
          }]
        },
        doctorId: testDoctor.id
      })
      testPrescription = prescriptionResponse.data.prescription
    })

    it('debe aprobar prescripción con firma digital del doctor', async () => {
      const approvalRequest = {
        prescriptionId: testPrescription.id,
        digitalSignature: 'doctor_digital_signature_hash',
        approvalTimestamp: new Date().toISOString(),
        notes: 'Reviewed patient history and drug interactions'
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: approvalRequest,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(200)
      expect(response.data.prescription.status).toBe('approved')
      expect(response.data.prescription.approvedAt).toBeDefined()
      expect(response.data.prescription.digitalSignature).toBe('doctor_digital_signature_hash')
    })

    it('debe generar código de verificación para farmacia', async () => {
      // Aprobar prescripción
      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })

      // Verificar generación de código de farmacia
      const prescriptionDetails = await apiRequest('GET', `/api/v1/prescriptions/${testPrescription.id}`)
      
      expect(prescriptionDetails.data.prescription.pharmacyCode).toMatch(/^PH\d{8}$/)
      expect(prescriptionDetails.data.prescription.qrCode).toBeDefined()
    })

    it('debe registrar en audit trail médico', async () => {
      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })

      // Verificar audit trail
      const auditLogs = await apiRequest('GET', `/api/v1/audit/prescription/${testPrescription.id}`)
      
      expect(auditLogs.data.logs).toContainEqual(
        expect.objectContaining({
          action: 'prescription_approved',
          doctorId: testDoctor.id,
          patientId: testPatient.id,
          prescriptionId: testPrescription.id
        })
      )
    })
  })

  describe('Paso 4: Notificaciones al Paciente', () => {
    beforeEach(async () => {
      // Crear y aprobar prescripción
      const prescriptionResponse = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'atorvastatin',
            dosage: '20mg'
          }]
        },
        doctorId: testDoctor.id
      })
      testPrescription = prescriptionResponse.data.prescription

      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })
    })

    it('debe enviar notificación de prescripción lista', async () => {
      // Verificar notificación al paciente
      const patientNotifications = await apiRequest('GET', `/api/v1/notifications/patient/${testPatient.id}`)
      
      expect(patientNotifications.data.notifications).toContainEqual(
        expect.objectContaining({
          type: 'prescription_ready',
          patientId: testPatient.id,
          data: expect.objectContaining({
            prescriptionId: testPrescription.id,
            medicationCount: 1
          })
        })
      )
    })

    it('debe generar PDF de prescripción para descarga', async () => {
      const pdfResponse = await apiRequest('GET', `/api/v1/prescriptions/${testPrescription.id}/pdf`, {
        patientId: testPatient.id
      })

      expect(pdfResponse.status).toBe(200)
      expect(pdfResponse.headers['content-type']).toBe('application/pdf')
      expect(pdfResponse.data.pdfUrl).toBeDefined()
    })

    it('debe enviar instrucciones de medicamento por SMS/Email', async () => {
      // Verificar que se enviaron instrucciones
      const instructionsLog = await apiRequest('GET', `/api/v1/communications/sent/${testPatient.id}`)
      
      const smsInstruction = instructionsLog.data.communications.find((c: any) => 
        c.type === 'sms' && c.content.includes('atorvastatin')
      )
      
      expect(smsInstruction).toBeDefined()
      expect(smsInstruction.content).toContain('Take with food in the evening')
    })
  })

  describe('Paso 5: Integración con Farmacia', () => {
    beforeEach(async () => {
      // Setup prescripción aprobada
      const prescriptionResponse = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'atorvastatin',
            dosage: '20mg',
            quantity: 90
          }]
        },
        doctorId: testDoctor.id
      })
      testPrescription = prescriptionResponse.data.prescription

      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })
    })

    it('debe enviar prescripción a farmacia preferida del paciente', async () => {
      const pharmacyRequest = {
        prescriptionId: testPrescription.id,
        pharmacyId: 'pharmacy_123',
        patientPreference: true
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/send-to-pharmacy`, {
        body: pharmacyRequest,
        patientId: testPatient.id
      })

      expect(response.status).toBe(200)
      expect(response.data.pharmacyTransmission).toMatchObject({
        pharmacyId: 'pharmacy_123',
        transmissionId: expect.any(String),
        status: 'sent',
        sentAt: expect.any(String)
      })
    })

    it('debe actualizar estado cuando farmacia confirma recepción', async () => {
      // Simular confirmación de farmacia
      const confirmationRequest = {
        prescriptionId: testPrescription.id,
        pharmacyId: 'pharmacy_123',
        confirmationCode: 'CONF123456',
        estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // +30 min
      }

      const response = await apiRequest('POST', '/api/v1/pharmacy/confirm-receipt', {
        body: confirmationRequest,
        headers: { 'X-Pharmacy-API-Key': 'test_pharmacy_key' }
      })

      expect(response.status).toBe(200)

      // Verificar actualización de estado
      const updatedPrescription = await apiRequest('GET', `/api/v1/prescriptions/${testPrescription.id}`)
      expect(updatedPrescription.data.prescription.pharmacyStatus).toBe('received')
      expect(updatedPrescription.data.prescription.estimatedReadyTime).toBeDefined()
    })

    it('debe notificar al paciente cuando medicamento esté listo', async () => {
      // Simular que farmacia marca como listo
      await apiRequest('POST', '/api/v1/pharmacy/ready-for-pickup', {
        body: {
          prescriptionId: testPrescription.id,
          pharmacyId: 'pharmacy_123'
        },
        headers: { 'X-Pharmacy-API-Key': 'test_pharmacy_key' }
      })

      // Verificar notificación al paciente
      const notifications = await apiRequest('GET', `/api/v1/notifications/patient/${testPatient.id}`)
      
      expect(notifications.data.notifications).toContainEqual(
        expect.objectContaining({
          type: 'prescription_ready_pickup',
          data: expect.objectContaining({
            prescriptionId: testPrescription.id,
            pharmacyName: expect.any(String)
          })
        })
      )
    })
  })

  describe('Paso 6: Seguimiento y Refills', () => {
    beforeEach(async () => {
      // Setup prescripción completada
      const prescriptionResponse = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'atorvastatin',
            dosage: '20mg',
            duration: '30_days',
            refills: 2
          }]
        },
        doctorId: testDoctor.id
      })
      testPrescription = prescriptionResponse.data.prescription

      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })

      // Marcar como dispensado
      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/mark-dispensed`, {
        body: { dispensedBy: 'pharmacy_123' },
        headers: { 'X-Pharmacy-API-Key': 'test_pharmacy_key' }
      })
    })

    it('debe programar recordatorios de renovación', async () => {
      // Verificar que se programaron recordatorios
      const reminders = await apiRequest('GET', `/api/v1/reminders/patient/${testPatient.id}`)
      
      expect(reminders.data.reminders).toContainEqual(
        expect.objectContaining({
          type: 'prescription_refill_reminder',
          patientId: testPatient.id,
          prescriptionId: testPrescription.id,
          scheduledFor: expect.any(String) // Debe estar programado para ~7 días antes de que se acabe
        })
      )
    })

    it('debe procesar solicitud de refill del paciente', async () => {
      const refillRequest = {
        prescriptionId: testPrescription.id,
        requestedBy: testPatient.id,
        pharmacyId: 'pharmacy_123',
        notes: 'Patient requesting refill'
      }

      const response = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/request-refill`, {
        body: refillRequest,
        patientId: testPatient.id
      })

      expect(response.status).toBe(200)
      expect(response.data.refillRequest).toMatchObject({
        prescriptionId: testPrescription.id,
        status: 'approved', // Auto-approved si quedan refills
        refillNumber: 1
      })

      // Verificar que se decrementó el contador de refills
      const updatedPrescription = await apiRequest('GET', `/api/v1/prescriptions/${testPrescription.id}`)
      expect(updatedPrescription.data.prescription.refillsRemaining).toBe(1)
    })

    it('debe requerir aprobación del doctor cuando no quedan refills', async () => {
      // Agotar refills
      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/request-refill`, {
        body: { requestedBy: testPatient.id },
        patientId: testPatient.id
      })
      await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/request-refill`, {
        body: { requestedBy: testPatient.id },
        patientId: testPatient.id
      })

      // Intentar un refill adicional
      const finalRefillRequest = await apiRequest('POST', `/api/v1/prescriptions/${testPrescription.id}/request-refill`, {
        body: { requestedBy: testPatient.id },
        patientId: testPatient.id
      })

      expect(finalRefillRequest.status).toBe(200)
      expect(finalRefillRequest.data.refillRequest.status).toBe('pending_doctor_approval')

      // Verificar notificación al doctor
      const doctorNotifications = await apiRequest('GET', `/api/v1/notifications/doctor/${testDoctor.id}`)
      expect(doctorNotifications.data.notifications).toContainEqual(
        expect.objectContaining({
          type: 'prescription_refill_approval_needed',
          doctorId: testDoctor.id
        })
      )
    })
  })

  describe('Validaciones de Compliance y Auditoría', () => {
    it('debe mantener audit trail completo de prescripción', async () => {
      // Ejecutar flujo completo
      const prescription = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{ name: 'atorvastatin', dosage: '20mg' }]
        },
        doctorId: testDoctor.id
      })

      await apiRequest('POST', `/api/v1/prescriptions/${prescription.data.prescription.id}/approve`, {
        body: { digitalSignature: 'signature' },
        doctorId: testDoctor.id
      })

      await apiRequest('POST', `/api/v1/prescriptions/${prescription.data.prescription.id}/mark-dispensed`, {
        body: { dispensedBy: 'pharmacy_123' },
        headers: { 'X-Pharmacy-API-Key': 'test_pharmacy_key' }
      })

      // Verificar audit trail completo
      const auditTrail = await apiRequest('GET', `/api/v1/audit/prescription-full/${prescription.data.prescription.id}`)
      
      const expectedActions = [
        'prescription_created',
        'drug_interaction_checked',
        'prescription_approved',
        'prescription_sent_to_pharmacy',
        'prescription_dispensed'
      ]

      expectedActions.forEach(action => {
        expect(auditTrail.data.trail).toContainEqual(
          expect.objectContaining({ action })
        )
      })
    })

    it('debe cumplir con todos los requisitos HIPAA para prescripciones', async () => {
      const prescriptionData = {
        prescription: testPrescription,
        patient: testPatient,
        doctor: testDoctor,
        medications: ['atorvastatin']
      }

      const complianceResult = validateHIPAACompliance(prescriptionData)
      
      expect(complianceResult.isCompliant).toBe(true)
      expect(complianceResult.violations).toHaveLength(0)
      
      // Verificar encriptación de datos sensibles
      expect(complianceResult.encryptionStatus.prescriptionData).toBe('encrypted')
      expect(complianceResult.encryptionStatus.patientMedicalData).toBe('encrypted')
    })

    it('debe generar reportes de uso de medicamentos para DEA', async () => {
      // Crear prescripción de sustancia controlada
      const controlledPrescription = await apiRequest('POST', '/api/v1/prescriptions', {
        body: {
          consultationId: testConsultation.id,
          patientId: testPatient.id,
          medications: [{
            name: 'oxycodone',
            schedule: 'II',
            quantity: 30
          }]
        },
        doctorId: testDoctor.id
      })

      // Generar reporte DEA
      const deaReport = await apiRequest('GET', `/api/v1/reports/dea/controlled-substances/${testDoctor.id}`, {
        query: { startDate: '2025-08-01', endDate: '2025-08-31' },
        doctorId: testDoctor.id
      })

      expect(deaReport.status).toBe(200)
      expect(deaReport.data.report.controlledSubstances).toContainEqual(
        expect.objectContaining({
          prescriptionId: controlledPrescription.data.prescription.id,
          medication: 'oxycodone',
          schedule: 'II',
          quantity: 30
        })
      )
    })
  })
})