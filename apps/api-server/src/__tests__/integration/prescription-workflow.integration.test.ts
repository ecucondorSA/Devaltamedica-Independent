// 🧪 TESTS INTEGRACIÓN: Prescription Workflow - Flujo Completo de Prescripciones
// Tests críticos para recetas médicas digitales con validación farmacológica y compliance

import request from 'supertest';
import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock de dependencias
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() }
  },
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'doctor'
    })
  }),
  firestore: () => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ id: 'test-123', allergies: ['Penicilina'] })
    }),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis()
  })
}));

// Mock del sistema de validación farmacológica
vi.mock('../../../services/drug-interaction-service', () => ({
  checkDrugInteractions: vi.fn().mockImplementation((drugs) => {
    if (drugs.some(d => d.name === 'Warfarina') && drugs.some(d => d.name === 'Aspirina')) {
      return [{
        severity: 'high',
        type: 'bleeding_risk',
        description: 'Increased risk of bleeding when combining anticoagulants',
        recommendation: 'Monitor INR closely, consider dose adjustment'
      }];
    }
    return [];
  }),
  validateDosage: vi.fn().mockReturnValue({ valid: true }),
  checkAllergies: vi.fn().mockImplementation((medications, allergies) => {
    return medications.filter(med => allergies.includes(med.name));
  })
}));

// Configuración del test
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Headers de autenticación
const doctorAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-doctor',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-doctor'
};

const pharmacistAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-pharmacist',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-pharmacist'
};

const patientAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-patient',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-patient'
};

// 📊 DATOS DE PRUEBA
const testDoctor = {
  id: 'doctor-prescription-test',
  firstName: 'Dr. Luis',
  lastName: 'Fernández',
  email: 'luis.fernandez@altamedica.com',
  specialization: 'Medicina Interna',
  licenseNumber: 'MED456789',
  prescriptionAuthority: true,
  controlledSubstancesLicense: 'CS123456'
};

const testPatient = {
  id: 'patient-prescription-test',
  firstName: 'Ana',
  lastName: 'López',
  email: 'ana.lopez@email.com',
  dateOfBirth: '1980-05-20',
  weight: 68,
  height: 165,
  allergies: ['Penicilina', 'Sulfonamidas'],
  chronicConditions: ['Hipertensión', 'Diabetes Tipo 2'],
  currentMedications: [
    {
      name: 'Metformina',
      dose: '500mg',
      frequency: '2 veces al día',
      startDate: '2024-01-01'
    }
  ]
};

const testAppointment = {
  id: 'appointment-prescription-test',
  patientId: 'patient-prescription-test',
  doctorId: 'doctor-prescription-test',
  date: new Date().toISOString(),
  diagnosis: 'Infección del tracto respiratorio superior',
  status: 'completed'
};

const simplePrescription = {
  patientId: 'patient-prescription-test',
  doctorId: 'doctor-prescription-test',
  appointmentId: 'appointment-prescription-test',
  diagnosis: 'Infección respiratoria',
  medications: [
    {
      name: 'Amoxicilina',
      genericName: 'Amoxicillin',
      dose: '500mg',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      quantity: 21,
      instructions: 'Tomar con alimentos para evitar malestar estomacal',
      allowSubstitution: true
    }
  ],
  notes: 'Completar curso completo de antibióticos aunque mejoren los síntomas',
  followUpInstructions: 'Regresar si no mejora en 3-4 días'
};

const complexPrescription = {
  patientId: 'patient-prescription-test',
  doctorId: 'doctor-prescription-test',
  appointmentId: 'appointment-prescription-test',
  diagnosis: 'Fibrilación auricular con riesgo trombótico',
  medications: [
    {
      name: 'Warfarina',
      genericName: 'Warfarin',
      dose: '5mg',
      frequency: '1 vez al día',
      duration: '90 días',
      quantity: 90,
      instructions: 'Tomar siempre a la misma hora. Evitar cambios súbitos en la dieta',
      monitoring: {
        required: true,
        test: 'INR',
        frequency: 'semanal por 4 semanas, luego mensual',
        targetRange: '2.0-3.0'
      },
      allowSubstitution: false,
      controlledSubstance: false
    },
    {
      name: 'Aspirina',
      genericName: 'Acetylsalicylic acid',
      dose: '75mg',
      frequency: '1 vez al día',
      duration: '90 días',
      quantity: 90,
      instructions: 'Tomar con alimentos',
      allowSubstitution: true
    }
  ],
  contraindications: ['Embarazo', 'Sangrado activo'],
  warnings: ['Riesgo aumentado de sangrado'],
  followUpInstructions: 'Control de INR en 1 semana'
};

const controlledSubstancePrescription = {
  patientId: 'patient-prescription-test',
  doctorId: 'doctor-prescription-test',
  appointmentId: 'appointment-prescription-test',
  diagnosis: 'Dolor crónico severo post-cirugía',
  medications: [
    {
      name: 'Tramadol',
      genericName: 'Tramadol',
      dose: '50mg',
      frequency: 'Cada 6-8 horas según necesidad',
      duration: '14 días',
      quantity: 28,
      instructions: 'No exceder 400mg por día. No conducir ni operar maquinaria',
      controlledSubstance: true,
      scheduleClass: 'IV',
      allowSubstitution: false,
      refillsAllowed: 0
    }
  ],
  justification: 'Dolor post-operatorio refractario a analgésicos no opioides',
  patientConsent: true
};

describe('💊 Prescription Workflow - Sistema Completo de Prescripciones', () => {
  let testPrescriptionId: string;
  let testDoctorId: string;
  let testPatientId: string;
  let testAppointmentId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    logger.info('🚀 Iniciando tests de integración de prescripciones médicas...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    logger.info('✅ Tests de prescripciones médicas completados');
  });

  beforeEach(async () => {
    testPrescriptionId = `prescription-test-${Date.now()}`;
    testDoctorId = `doctor-test-${Date.now()}`;
    testPatientId = `patient-test-${Date.now()}`;
    testAppointmentId = `appointment-test-${Date.now()}`;

    // Crear entidades de prueba
    await request(API_BASE_URL)
      .post('/api/v1/doctors')
      .set(doctorAuthHeaders)
      .send({ ...testDoctor, id: testDoctorId });

    await request(API_BASE_URL)
      .post('/api/v1/patients')
      .set(doctorAuthHeaders)
      .send({ ...testPatient, id: testPatientId });

    await request(API_BASE_URL)
      .post('/api/v1/appointments')
      .set(doctorAuthHeaders)
      .send({
        ...testAppointment,
        id: testAppointmentId,
        patientId: testPatientId,
        doctorId: testDoctorId
      });
  });

  afterEach(async () => {
    // Cleanup
    const cleanupPromises = [
      request(API_BASE_URL).delete(`/api/v1/prescriptions/${testPrescriptionId}`).set(doctorAuthHeaders),
      request(API_BASE_URL).delete(`/api/v1/appointments/${testAppointmentId}`).set(doctorAuthHeaders),
      request(API_BASE_URL).delete(`/api/v1/patients/${testPatientId}`).set(doctorAuthHeaders),
      request(API_BASE_URL).delete(`/api/v1/doctors/${testDoctorId}`).set(doctorAuthHeaders)
    ];

    await Promise.allSettled(cleanupPromises);
  });

  describe('📝 Creación de Prescripciones', () => {
    
    test('Debe crear prescripción simple exitosamente', async () => {
      const prescriptionData = {
        ...simplePrescription,
        id: testPrescriptionId,
        patientId: testPatientId,
        doctorId: testDoctorId,
        appointmentId: testAppointmentId
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send(prescriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPrescriptionId);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.medications).toHaveLength(1);
      expect(response.body.data.digitalSignature).toBeDefined();
      expect(response.body.data.verificationCode).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();

      // Verificar datos de auditoría HIPAA
      expect(response.body.data.auditLog).toBeDefined();
      expect(response.body.data.prescribedAt).toBeDefined();
      expect(response.body.data.prescribedBy).toBe(testDoctorId);
    }, TEST_TIMEOUT);

    test('Debe validar autoridad del doctor para prescribir', async () => {
      // Doctor sin autoridad de prescripción
      const unauthorizedDoctor = {
        ...testDoctor,
        id: `unauthorized-doctor-${Date.now()}`,
        prescriptionAuthority: false
      };

      await request(API_BASE_URL)
        .post('/api/v1/doctors')
        .set(doctorAuthHeaders)
        .send(unauthorizedDoctor);

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          doctorId: unauthorizedDoctor.id
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('prescription_authority_required');
      expect(response.body.message).toContain('no tiene autoridad para prescribir');
    }, TEST_TIMEOUT);

    test('Debe detectar alergias del paciente', async () => {
      const allergyPrescription = {
        ...simplePrescription,
        patientId: testPatientId,
        doctorId: testDoctorId,
        medications: [
          {
            name: 'Penicilina', // Paciente es alérgico
            dose: '500mg',
            frequency: 'Cada 6 horas',
            duration: '7 días'
          }
        ]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send(allergyPrescription)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('allergy_conflict');
      expect(response.body.allergicMedications).toContain('Penicilina');
      expect(response.body.patientAllergies).toContain('Penicilina');
    }, TEST_TIMEOUT);

    test('Debe detectar interacciones medicamentosas', async () => {
      const interactionPrescription = {
        ...complexPrescription,
        id: testPrescriptionId,
        patientId: testPatientId,
        doctorId: testDoctorId,
        appointmentId: testAppointmentId
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send(interactionPrescription)
        .expect(200); // 200 con warnings, no 201

      expect(response.body.success).toBe(true);
      expect(response.body.warnings).toBeDefined();
      expect(response.body.warnings.drugInteractions).toBeDefined();
      expect(response.body.warnings.drugInteractions[0].severity).toBe('high');
      expect(response.body.warnings.drugInteractions[0].type).toBe('bleeding_risk');
      
      // La prescripción se crea pero con advertencias
      expect(response.body.data.status).toBe('active_with_warnings');
    }, TEST_TIMEOUT);

    test('Debe validar dosis según peso y edad del paciente', async () => {
      const pediatricDose = {
        ...simplePrescription,
        patientId: testPatientId,
        doctorId: testDoctorId,
        medications: [
          {
            name: 'Paracetamol',
            dose: '1000mg', // Dosis muy alta para el peso del paciente
            frequency: 'Cada 4 horas',
            duration: '3 días'
          }
        ]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send(pediatricDose)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('dosage_validation_failed');
      expect(response.body.dosageErrors).toContain('Dose exceeds recommended maximum for patient weight');
    }, TEST_TIMEOUT);

    test('Debe manejar sustancias controladas con validaciones especiales', async () => {
      const controlledData = {
        ...controlledSubstancePrescription,
        id: testPrescriptionId,
        patientId: testPatientId,
        doctorId: testDoctorId,
        appointmentId: testAppointmentId
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions/controlled-substance')
        .set(doctorAuthHeaders)
        .send(controlledData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.controlledSubstanceInfo).toBeDefined();
      expect(response.body.data.controlledSubstanceInfo.scheduleClass).toBe('IV');
      expect(response.body.data.controlledSubstanceInfo.deaReported).toBe(true);
      expect(response.body.data.controlledSubstanceInfo.patientConsent).toBe(true);
      
      // Verificar auditoría especial para sustancias controladas
      expect(response.body.data.auditLog.controlledSubstanceAudit).toBeDefined();
      expect(response.body.data.digitalSignature.enhanced).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('🔍 Validación y Verificación', () => {
    
    beforeEach(async () => {
      // Crear prescripción base para tests de validación
      await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          id: testPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId
        })
        .expect(201);
    });

    test('Debe validar prescripción con código QR', async () => {
      // Primero obtener el código QR
      const prescriptionResponse = await request(API_BASE_URL)
        .get(`/api/v1/prescriptions/${testPrescriptionId}`)
        .set(pharmacistAuthHeaders)
        .expect(200);

      const qrCode = prescriptionResponse.body.data.qrCode;

      // Validar con código QR
      const validationResponse = await request(API_BASE_URL)
        .post('/api/v1/prescriptions/validate')
        .set(pharmacistAuthHeaders)
        .send({ qrCode })
        .expect(200);

      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.data.valid).toBe(true);
      expect(validationResponse.body.data.prescription.id).toBe(testPrescriptionId);
      expect(validationResponse.body.data.prescription.status).toBe('active');
    }, TEST_TIMEOUT);

    test('Debe rechazar códigos QR inválidos o expirados', async () => {
      const invalidQR = 'invalid-qr-code-12345';

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions/validate')
        .set(pharmacistAuthHeaders)
        .send({ qrCode: invalidQR })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('invalid_prescription_code');
    }, TEST_TIMEOUT);

    test('Debe verificar identidad del paciente para prescripciones controladas', async () => {
      // Crear prescripción de sustancia controlada
      const controlledPrescriptionId = `controlled-${testPrescriptionId}`;
      await request(API_BASE_URL)
        .post('/api/v1/prescriptions/controlled-substance')
        .set(doctorAuthHeaders)
        .send({
          ...controlledSubstancePrescription,
          id: controlledPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId
        })
        .expect(201);

      // Intentar dispensar sin verificación de identidad
      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${controlledPrescriptionId}/dispense`)
        .set(pharmacistAuthHeaders)
        .send({
          quantity: 14,
          pharmacyId: 'pharmacy-123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('patient_identity_verification_required');
      expect(response.body.requiredDocuments).toContain('government_id');
    }, TEST_TIMEOUT);

    test('Debe validar firma digital del médico', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/v1/prescriptions/${testPrescriptionId}/verify-signature`)
        .set(pharmacistAuthHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.signatureValid).toBe(true);
      expect(response.body.data.doctorVerified).toBe(true);
      expect(response.body.data.documentIntegrity).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('💊 Dispensación en Farmacia', () => {
    
    beforeEach(async () => {
      // Crear prescripción para tests de dispensación
      await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          id: testPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId
        })
        .expect(201);
    });

    test('Debe dispensar medicamento completo exitosamente', async () => {
      const dispensingData = {
        pharmacyId: 'pharmacy-test-123',
        pharmacistId: 'pharmacist-test-456',
        medicationsDispensed: [
          {
            medicationName: 'Amoxicilina',
            quantityDispensed: 21,
            lot: 'LOT123456',
            expiryDate: '2025-12-31',
            manufacturer: 'Laboratorios XYZ',
            substituted: false
          }
        ],
        patientPickup: {
          patientId: testPatientId,
          identityVerified: true,
          signature: 'digital_signature_hash',
          counselingProvided: true
        },
        insuranceClaim: {
          submitted: true,
          copay: 500,
          covered: 4500
        }
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/dispense`)
        .set(pharmacistAuthHeaders)
        .send(dispensingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('dispensed');
      expect(response.body.data.dispensedAt).toBeDefined();
      expect(response.body.data.remainingRefills).toBe(0);
      
      // Verificar registro de dispensación
      expect(response.body.data.dispensingRecord).toBeDefined();
      expect(response.body.data.dispensingRecord.pharmacy).toBeDefined();
      expect(response.body.data.dispensingRecord.lot).toBe('LOT123456');
    }, TEST_TIMEOUT);

    test('Debe manejar dispensación parcial con justificación', async () => {
      const partialDispensingData = {
        pharmacyId: 'pharmacy-test-123',
        pharmacistId: 'pharmacist-test-456',
        medicationsDispensed: [
          {
            medicationName: 'Amoxicilina',
            quantityDispensed: 14, // Solo 14 de 21 tabletas
            quantityRemaining: 7,
            reason: 'insufficient_stock',
            lot: 'LOT123456',
            expiryDate: '2025-12-31'
          }
        ],
        partialFulfillment: {
          reason: 'insufficient_stock',
          expectedRestockDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          patientNotified: true
        }
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/dispense-partial`)
        .set(pharmacistAuthHeaders)
        .send(partialDispensingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('partially_dispensed');
      expect(response.body.data.remainingQuantity).toBe(7);
      expect(response.body.data.nextFulfillmentDate).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe registrar sustitución de medicamento genérico', async () => {
      const substitutionData = {
        pharmacyId: 'pharmacy-test-123',
        pharmacistId: 'pharmacist-test-456',
        medicationsDispensed: [
          {
            originalMedication: 'Amoxicilina',
            dispensedMedication: 'Amoxicilina Genérica',
            genericSubstitution: true,
            substitutionReason: 'cost_savings',
            quantityDispensed: 21,
            lot: 'GEN789012',
            manufacturer: 'Genéricos SA'
          }
        ],
        patientConsent: {
          substitutionAccepted: true,
          consentMethod: 'verbal',
          witnessedBy: 'pharmacist-test-456'
        }
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/dispense`)
        .set(pharmacistAuthHeaders)
        .send(substitutionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.substitutionMade).toBe(true);
      expect(response.body.data.dispensingRecord.originalMedication).toBe('Amoxicilina');
      expect(response.body.data.dispensingRecord.dispensedMedication).toBe('Amoxicilina Genérica');
    }, TEST_TIMEOUT);

    test('Debe rechazar dispensación si prescripción está vencida', async () => {
      // Crear prescripción vencida
      const expiredPrescriptionId = `expired-${testPrescriptionId}`;
      const expiredDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 año atrás

      await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          id: expiredPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId,
          expiryDate: expiredDate.toISOString()
        })
        .expect(201);

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${expiredPrescriptionId}/dispense`)
        .set(pharmacistAuthHeaders)
        .send({
          pharmacyId: 'pharmacy-test-123',
          medicationsDispensed: [{ medicationName: 'Amoxicilina', quantityDispensed: 21 }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('prescription_expired');
      expect(response.body.expiryDate).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('📊 Seguimiento y Adherencia', () => {
    
    beforeEach(async () => {
      // Crear y dispensar prescripción para tests de seguimiento
      await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          id: testPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId
        })
        .expect(201);

      await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/dispense`)
        .set(pharmacistAuthHeaders)
        .send({
          pharmacyId: 'pharmacy-test-123',
          medicationsDispensed: [{
            medicationName: 'Amoxicilina',
            quantityDispensed: 21
          }],
          patientPickup: { patientId: testPatientId }
        })
        .expect(200);
    });

    test('Debe registrar adherencia del paciente al tratamiento', async () => {
      const adherenceData = {
        medicationName: 'Amoxicilina',
        dosesTaken: 15,
        dosesSkipped: 2,
        sideEffects: ['mild_nausea'],
        effectiveness: 4, // Escala 1-5
        notes: 'Mejoría notable después del 3er día'
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/adherence`)
        .set(patientAuthHeaders)
        .send(adherenceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adherenceRate).toBe(88.24); // 15/17 * 100
      expect(response.body.data.sideEffectsReported).toBe(true);
      expect(response.body.data.notificationsSent.doctor).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe generar alertas por baja adherencia', async () => {
      const poorAdherenceData = {
        medicationName: 'Amoxicilina',
        dosesTaken: 5,
        dosesSkipped: 12,
        reasonsForSkipping: ['forgot', 'side_effects'],
        sideEffects: ['severe_nausea', 'diarrhea']
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/adherence`)
        .set(patientAuthHeaders)
        .send(poorAdherenceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adherenceRate).toBe(29.41); // 5/17 * 100
      expect(response.body.data.alertLevel).toBe('high');
      expect(response.body.data.interventionTriggered).toBe(true);
      
      // Debe generar notificación al doctor
      expect(response.body.data.notificationsSent.doctor).toBe(true);
      expect(response.body.data.recommendedActions).toContain('doctor_consultation');
    }, TEST_TIMEOUT);

    test('Debe programar recordatorios automáticos', async () => {
      const reminderSettings = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '09:00',
        method: ['push_notification', 'sms'],
        customMessage: 'Recuerda tomar tu Amoxicilina con alimentos'
      };

      const response = await request(API_BASE_URL)
        .post(`/api/v1/prescriptions/${testPrescriptionId}/reminders`)
        .set(patientAuthHeaders)
        .send(reminderSettings)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.remindersScheduled).toBe(true);
      expect(response.body.data.nextReminderAt).toBeDefined();
      expect(response.body.data.totalReminders).toBe(7); // 7 días de tratamiento
    }, TEST_TIMEOUT);

    test('Debe generar reportes de efectividad del tratamiento', async () => {
      // Simular múltiples reportes de adherencia
      const adherenceReports = [
        { day: 1, taken: true, effectiveness: 2 },
        { day: 2, taken: true, effectiveness: 3 },
        { day: 3, taken: true, effectiveness: 4 },
        { day: 4, taken: false, effectiveness: 3 },
        { day: 5, taken: true, effectiveness: 4 }
      ];

      for (const report of adherenceReports) {
        await request(API_BASE_URL)
          .post(`/api/v1/prescriptions/${testPrescriptionId}/daily-report`)
          .set(patientAuthHeaders)
          .send(report);
      }

      const response = await request(API_BASE_URL)
        .get(`/api/v1/prescriptions/${testPrescriptionId}/treatment-summary`)
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallAdherence).toBe(80); // 4/5 días
      expect(response.body.data.averageEffectiveness).toBe(3.2);
      expect(response.body.data.trendAnalysis).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('📋 Reportes y Compliance', () => {
    
    test('Debe generar reporte de prescripciones por médico', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/prescription-report`)
        .set(doctorAuthHeaders)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.totalPrescriptions).toBeGreaterThanOrEqual(0);
      expect(response.body.data.prescriptionsByType).toBeDefined();
      expect(response.body.data.mostPrescribedMedications).toBeDefined();
      expect(response.body.data.complianceScore).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe generar reporte de sustancias controladas para DEA', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/prescriptions/controlled-substances-report')
        .set(doctorAuthHeaders)
        .query({
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          doctorId: testDoctorId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportType).toBe('controlled_substances');
      expect(response.body.data.prescriptions).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.deaCompliance).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe generar análisis de interacciones medicamentosas', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/prescriptions/interaction-analysis')
        .set(doctorAuthHeaders)
        .query({
          period: 'last_month',
          severity: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInteractions).toBeGreaterThanOrEqual(0);
      expect(response.body.data.interactionsByMedication).toBeDefined();
      expect(response.body.data.recommendedInterventions).toBeDefined();
      expect(response.body.data.preventedAdverseEvents).toBeGreaterThanOrEqual(0);
    }, TEST_TIMEOUT);
  });

  describe('⚡ Rendimiento del Sistema', () => {
    
    test('Debe procesar múltiples prescripciones simultáneamente', async () => {
      const concurrentPrescriptions = Array(5).fill(null).map((_, i) => 
        request(API_BASE_URL)
          .post('/api/v1/prescriptions')
          .set(doctorAuthHeaders)
          .send({
            ...simplePrescription,
            id: `concurrent-prescription-${i}-${Date.now()}`,
            patientId: testPatientId,
            doctorId: testDoctorId,
            appointmentId: testAppointmentId
          })
      );

      const responses = await Promise.all(concurrentPrescriptions);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(`concurrent-prescription-${index}-${responses[0].body.data.id.split('-').pop()}`);
      });

      logger.info(`✅ ${responses.length} prescripciones procesadas concurrentemente`);
    }, TEST_TIMEOUT);

    test('Debe validar prescripciones rápidamente', async () => {
      // Crear prescripción
      await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(doctorAuthHeaders)
        .send({
          ...simplePrescription,
          id: testPrescriptionId,
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentId: testAppointmentId
        })
        .expect(201);

      // Obtener QR code
      const prescriptionResponse = await request(API_BASE_URL)
        .get(`/api/v1/prescriptions/${testPrescriptionId}`)
        .set(pharmacistAuthHeaders)
        .expect(200);

      const startTime = Date.now();
      
      // Validar prescripción
      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions/validate')
        .set(pharmacistAuthHeaders)
        .send({ qrCode: prescriptionResponse.body.data.qrCode })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(500); // Menos de 500ms
      
      logger.info(`⚡ Validación de prescripción: ${responseTime}ms`);
    }, TEST_TIMEOUT);
  });
});