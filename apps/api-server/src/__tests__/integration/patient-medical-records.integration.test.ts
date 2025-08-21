// 🧪 TESTS INTEGRACIÓN: Patient Medical Records - Flujo Completo
// Tests críticos para manejo de registros médicos con compliance HIPAA

import request from 'supertest';
import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { Server } from 'http';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock de dependencias externas
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn()
    }
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
      data: () => ({ id: 'test-123' })
    }),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  })
}));

// Configuración del test
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30 segundos para tests de integración

// Headers de autenticación para tests
const authHeaders = {
  'Authorization': 'Bearer mock-jwt-token-doctor',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-user'
};

const patientAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-patient',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-patient'
};

// 📊 DATOS DE PRUEBA MÉDICOS
const testPatientData = {
  personalInfo: {
    firstName: 'Juan Carlos',
    lastName: 'Rodríguez',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    dni: '12345678',
    email: 'juan.test@example.com',
    phone: '+54 11 1234-5678'
  },
  medicalInfo: {
    bloodType: 'O+',
    allergies: ['Penicilina', 'Maní'],
    currentMedications: [
      {
        name: 'Losartán',
        dose: '50mg',
        frequency: '1 vez al día',
        prescribedBy: 'Dr. Smith',
        startDate: '2024-01-01'
      }
    ],
    chronicConditions: ['Hipertensión'],
    emergencyContact: {
      name: 'María Rodríguez',
      relationship: 'Esposa',
      phone: '+54 11 9876-5432'
    }
  }
};

const testMedicalRecord = {
  patientId: 'patient-123',
  doctorId: 'doctor-456',
  appointmentId: 'appointment-789',
  date: new Date().toISOString(),
  type: 'consultation',
  chiefComplaint: 'Dolor en el pecho y dificultad para respirar',
  historyOfPresentIllness: 'Paciente refiere dolor torácico opresivo de 2 días de evolución...',
  vitalSigns: {
    bloodPressure: { systolic: 140, diastolic: 90 },
    heartRate: 85,
    temperature: 36.5,
    respiratoryRate: 18,
    oxygenSaturation: 97
  },
  physicalExam: {
    general: 'Paciente consciente, orientado, hidratado',
    cardiovascular: 'Ruidos cardíacos rítmicos, no soplos',
    respiratory: 'Murmullo vesicular conservado bilateral'
  },
  assessment: 'Probable angina de pecho estable',
  plan: 'ECG, troponinas, derivación a cardiología',
  prescriptions: [
    {
      medication: 'Aspirina',
      dose: '100mg',
      frequency: '1 vez al día',
      duration: '30 días',
      instructions: 'Tomar con alimentos'
    }
  ],
  followUpInstructions: 'Control en 1 semana o antes si empeoran síntomas',
  nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

const testLabResult = {
  patientId: 'patient-123',
  orderId: 'lab-order-456',
  collectionDate: new Date().toISOString(),
  resultDate: new Date().toISOString(),
  tests: [
    {
      name: 'Hemoglobina',
      value: 14.2,
      unit: 'g/dL',
      referenceRange: '12.0-16.0',
      status: 'normal'
    },
    {
      name: 'Glucosa',
      value: 125,
      unit: 'mg/dL',
      referenceRange: '70-100',
      status: 'high',
      flag: 'H'
    }
  ],
  interpretation: 'Glucosa elevada, considerar diabetes',
  reviewedBy: 'Dr. Laboratory',
  status: 'final'
};

describe('🏥 Patient Medical Records - Integración Completa', () => {
  let server: Server;
  let testPatientId: string;
  let testRecordId: string;

  beforeAll(async () => {
    // Configurar entorno de test
    process.env.NODE_ENV = 'test';
    logger.info('🚀 Iniciando tests de integración de registros médicos...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    logger.info('✅ Tests de registros médicos completados');
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Limpiar datos de test antes de cada test
    testPatientId = `test-patient-${Date.now()}`;
    testRecordId = `test-record-${Date.now()}`;
  });

  afterEach(async () => {
    // Limpiar datos después de cada test
    try {
      await request(API_BASE_URL)
        .delete(`/api/v1/patients/${testPatientId}`)
        .set(authHeaders);
    } catch (error) {
      // Ignorar errores de cleanup
    }
  });

  describe('👥 Gestión de Pacientes', () => {
    
    test('Debe crear un nuevo paciente con información médica completa', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPatientId);
      expect(response.body.data.personalInfo.firstName).toBe('Juan Carlos');
      expect(response.body.data.medicalInfo.allergies).toContain('Penicilina');
      
      // Verificar timestamp de auditoría HIPAA
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.createdBy).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe validar datos médicos obligatorios al crear paciente', async () => {
      const incompleteData = {
        personalInfo: {
          firstName: 'Test',
          // Faltan campos obligatorios
        }
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('lastName is required');
      expect(response.body.errors).toContain('dateOfBirth is required');
    }, TEST_TIMEOUT);

    test('Debe recuperar información del paciente con autorización correcta', async () => {
      // Primero crear el paciente
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      // Luego recuperarlo
      const response = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.personalInfo.firstName).toBe('Juan Carlos');
      expect(response.body.data.medicalInfo.bloodType).toBe('O+');
      
      // Verificar que datos sensibles están protegidos según nivel de acceso
      expect(response.body.data.personalInfo.dni).toBeDefined(); // Doctor puede ver DNI
    }, TEST_TIMEOUT);

    test('Debe denegar acceso a información del paciente sin autorización', async () => {
      await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}`)
        .expect(401); // Sin token

      await request(API_BASE_URL)
        .get(`/api/v1/patients/other-patient-123`)
        .set(patientAuthHeaders) // Paciente tratando de acceder a otro paciente
        .expect(403);
    }, TEST_TIMEOUT);

    test('Debe actualizar información médica del paciente manteniendo historial', async () => {
      // Crear paciente inicial
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      // Actualizar información médica
      const updateData = {
        medicalInfo: {
          ...testPatientData.medicalInfo,
          currentMedications: [
            ...testPatientData.medicalInfo.currentMedications,
            {
              name: 'Metformina',
              dose: '500mg',
              frequency: '2 veces al día',
              prescribedBy: 'Dr. Johnson',
              startDate: new Date().toISOString()
            }
          ]
        }
      };

      const response = await request(API_BASE_URL)
        .patch(`/api/v1/patients/${testPatientId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalInfo.currentMedications).toHaveLength(2);
      
      // Verificar que se mantuvo historial de cambios
      expect(response.body.data.lastModified).toBeDefined();
      expect(response.body.data.modifiedBy).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('📋 Registros Médicos', () => {
    
    beforeEach(async () => {
      // Crear paciente para los tests de registros médicos
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);
    });

    test('Debe crear un nuevo registro médico completo', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send({
          ...testMedicalRecord,
          id: testRecordId,
          patientId: testPatientId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testRecordId);
      expect(response.body.data.patientId).toBe(testPatientId);
      expect(response.body.data.vitalSigns.bloodPressure.systolic).toBe(140);
      expect(response.body.data.prescriptions).toHaveLength(1);
      
      // Verificar compliance HIPAA
      expect(response.body.data.auditLog).toBeDefined();
      expect(response.body.data.createdBy).toBeDefined();
      expect(response.body.data.encryptedFields).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe validar signos vitales dentro de rangos médicos válidos', async () => {
      const invalidVitalSigns = {
        ...testMedicalRecord,
        vitalSigns: {
          bloodPressure: { systolic: 300, diastolic: 200 }, // Imposible
          heartRate: 500, // Imposible
          temperature: 50, // Incompatible con vida
          oxygenSaturation: 120 // >100% imposible
        }
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send(invalidVitalSigns)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid vital signs: systolic pressure exceeds maximum');
      expect(response.body.errors).toContain('Invalid vital signs: heart rate exceeds maximum');
    }, TEST_TIMEOUT);

    test('Debe recuperar historial médico completo del paciente', async () => {
      // Crear múltiples registros médicos
      const record1 = await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send({
          ...testMedicalRecord,
          id: `${testRecordId}-1`,
          patientId: testPatientId,
          date: new Date('2024-01-01').toISOString()
        })
        .expect(201);

      const record2 = await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send({
          ...testMedicalRecord,
          id: `${testRecordId}-2`,
          patientId: testPatientId,
          date: new Date('2024-02-01').toISOString(),
          chiefComplaint: 'Control de hipertensión'
        })
        .expect(201);

      // Recuperar historial completo
      const response = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/medical-records`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Verificar ordenamiento cronológico (más reciente primero)
      expect(new Date(response.body.data[0].date).getTime())
        .toBeGreaterThan(new Date(response.body.data[1].date).getTime());
    }, TEST_TIMEOUT);

    test('Debe filtrar registros médicos por fecha y tipo', async () => {
      // Crear registros de diferentes tipos
      await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send({
          ...testMedicalRecord,
          id: `${testRecordId}-consultation`,
          patientId: testPatientId,
          type: 'consultation',
          date: new Date('2024-01-15').toISOString()
        })
        .expect(201);

      await request(API_BASE_URL)
        .post('/api/v1/medical-records')
        .set(authHeaders)
        .send({
          ...testMedicalRecord,
          id: `${testRecordId}-emergency`,
          patientId: testPatientId,
          type: 'emergency',
          date: new Date('2024-02-15').toISOString()
        })
        .expect(201);

      // Filtrar por tipo
      const consultationResponse = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/medical-records?type=consultation`)
        .set(authHeaders)
        .expect(200);

      expect(consultationResponse.body.data).toHaveLength(1);
      expect(consultationResponse.body.data[0].type).toBe('consultation');

      // Filtrar por rango de fechas
      const dateRangeResponse = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/medical-records?startDate=2024-02-01&endDate=2024-02-28`)
        .set(authHeaders)
        .expect(200);

      expect(dateRangeResponse.body.data).toHaveLength(1);
      expect(dateRangeResponse.body.data[0].type).toBe('emergency');
    }, TEST_TIMEOUT);
  });

  describe('🧪 Resultados de Laboratorio', () => {
    
    beforeEach(async () => {
      // Crear paciente para los tests de laboratorio
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);
    });

    test('Debe registrar resultados de laboratorio con valores de referencia', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/lab-results')
        .set(authHeaders)
        .send({
          ...testLabResult,
          id: `lab-${testRecordId}`,
          patientId: testPatientId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tests).toHaveLength(2);
      expect(response.body.data.tests[0].status).toBe('normal');
      expect(response.body.data.tests[1].status).toBe('high');
      expect(response.body.data.tests[1].flag).toBe('H');
    }, TEST_TIMEOUT);

    test('Debe validar valores de laboratorio críticos', async () => {
      const criticalValues = {
        ...testLabResult,
        tests: [
          {
            name: 'Potasio',
            value: 2.0, // Críticamente bajo
            unit: 'mEq/L',
            referenceRange: '3.5-5.0',
            status: 'critical_low',
            flag: 'LL'
          },
          {
            name: 'Troponina I',
            value: 50.0, // Altamente elevado - posible infarto
            unit: 'ng/mL',
            referenceRange: '0.0-0.04',
            status: 'critical_high',
            flag: 'HH'
          }
        ]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/lab-results')
        .set(authHeaders)
        .send(criticalValues)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.criticalAlerts).toBeDefined();
      expect(response.body.data.criticalAlerts).toHaveLength(2);
      
      // Verificar que se genere notificación automática para valores críticos
      expect(response.body.data.notificationsTriggered).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe generar tendencias y gráficos de valores de laboratorio', async () => {
      // Crear múltiples resultados en el tiempo
      const dates = ['2024-01-01', '2024-02-01', '2024-03-01'];
      const glucoseValues = [120, 115, 108]; // Mejorando

      for (let i = 0; i < dates.length; i++) {
        await request(API_BASE_URL)
          .post('/api/v1/lab-results')
          .set(authHeaders)
          .send({
            ...testLabResult,
            id: `lab-${testRecordId}-${i}`,
            patientId: testPatientId,
            collectionDate: new Date(dates[i]).toISOString(),
            tests: [
              {
                name: 'Glucosa',
                value: glucoseValues[i],
                unit: 'mg/dL',
                referenceRange: '70-100',
                status: glucoseValues[i] > 100 ? 'high' : 'normal'
              }
            ]
          })
          .expect(201);
      }

      // Obtener tendencias
      const response = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/lab-trends?test=Glucosa&period=3months`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.trends.trend).toBe('improving'); // Valores bajando
      expect(response.body.data.chartData).toHaveLength(3);
    }, TEST_TIMEOUT);
  });

  describe('💊 Gestión de Prescripciones', () => {
    
    beforeEach(async () => {
      // Crear paciente para los tests de prescripciones
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);
    });

    test('Debe crear prescripción médica con validación de interacciones', async () => {
      const prescription = {
        patientId: testPatientId,
        doctorId: 'doctor-456',
        medications: [
          {
            name: 'Warfarina',
            dose: '5mg',
            frequency: '1 vez al día',
            duration: '30 días',
            instructions: 'Tomar siempre a la misma hora'
          },
          {
            name: 'Aspirina',
            dose: '100mg', 
            frequency: '1 vez al día',
            duration: '30 días',
            instructions: 'Tomar con alimentos'
          }
        ],
        diagnosis: 'Fibrilación auricular',
        notes: 'Control de INR en 1 semana'
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(authHeaders)
        .send(prescription)
        .expect(200); // 200 con advertencias, no 201

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      
      // Debe detectar interacción entre Warfarina y Aspirina
      expect(response.body.warnings).toBeDefined();
      expect(response.body.warnings).toContain('drug_interaction');
      expect(response.body.warnings[0].severity).toBe('high');
      expect(response.body.warnings[0].message).toContain('riesgo de sangrado');
    }, TEST_TIMEOUT);

    test('Debe validar alergias del paciente antes de prescribir', async () => {
      const prescription = {
        patientId: testPatientId,
        doctorId: 'doctor-456',
        medications: [
          {
            name: 'Penicilina', // Paciente es alérgico
            dose: '500mg',
            frequency: '3 veces al día',
            duration: '7 días'
          }
        ],
        diagnosis: 'Infección respiratoria'
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(authHeaders)
        .send(prescription)
        .expect(400); // Debe rechazar por alergia

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Patient is allergic to Penicilina');
      expect(response.body.allergies).toContain('Penicilina');
    }, TEST_TIMEOUT);

    test('Debe generar receta digital con código QR y verificación', async () => {
      const prescription = {
        patientId: testPatientId,
        doctorId: 'doctor-456',
        medications: [
          {
            name: 'Amoxicilina',
            dose: '500mg',
            frequency: '3 veces al día',
            duration: '7 días'
          }
        ],
        diagnosis: 'Infección respiratoria'
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/prescriptions')
        .set(authHeaders)
        .send(prescription)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.digitalPrescription).toBeDefined();
      expect(response.body.data.digitalPrescription.qrCode).toBeDefined();
      expect(response.body.data.digitalPrescription.verificationCode).toBeDefined();
      expect(response.body.data.digitalPrescription.expiryDate).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('🔒 Compliance HIPAA y Auditoría', () => {
    
    test('Debe registrar todos los accesos a datos médicos', async () => {
      // Crear y acceder a un paciente
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}`)
        .set(authHeaders)
        .expect(200);

      // Verificar que se registraron los accesos en audit log
      const auditResponse = await request(API_BASE_URL)
        .get(`/api/v1/audit/patient-access/${testPatientId}`)
        .set(authHeaders)
        .expect(200);

      expect(auditResponse.body.success).toBe(true);
      expect(auditResponse.body.data.accessLogs).toBeDefined();
      expect(auditResponse.body.data.accessLogs.length).toBeGreaterThanOrEqual(2); // Create + Read
      
      auditResponse.body.data.accessLogs.forEach(log => {
        expect(log.userId).toBeDefined();
        expect(log.action).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.ipAddress).toBeDefined();
        expect(log.userAgent).toBeDefined();
      });
    }, TEST_TIMEOUT);

    test('Debe encriptar datos PHI en base de datos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      // Verificar que los datos sensibles están encriptados
      expect(response.body.data.encryptionMetadata).toBeDefined();
      expect(response.body.data.encryptionMetadata.encryptedFields).toContain('dni');
      expect(response.body.data.encryptionMetadata.encryptedFields).toContain('phone');
      expect(response.body.data.encryptionMetadata.algorithm).toBe('AES-256-GCM');
    }, TEST_TIMEOUT);

    test('Debe generar reportes de compliance HIPAA', async () => {
      // Generar actividad de prueba
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      // Solicitar reporte de compliance
      const response = await request(API_BASE_URL)
        .get('/api/v1/compliance/hipaa-report')
        .set(authHeaders)
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toBeDefined();
      expect(response.body.data.report.totalAccesses).toBeGreaterThan(0);
      expect(response.body.data.report.encryptionCompliance).toBe(100);
      expect(response.body.data.report.auditLogCompleteness).toBe(100);
      expect(response.body.data.report.unauthorizedAttempts).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('⚡ Performance y Escalabilidad', () => {
    
    test('Debe manejar múltiples requests concurrentes', async () => {
      const concurrentRequests = 10;
      const patientCreationPromises = Array(concurrentRequests).fill(null).map((_, index) => 
        request(API_BASE_URL)
          .post('/api/v1/patients')
          .set(authHeaders)
          .send({
            ...testPatientData,
            id: `concurrent-patient-${index}-${Date.now()}`,
            personalInfo: {
              ...testPatientData.personalInfo,
              email: `concurrent.test.${index}@example.com`
            }
          })
      );

      const responses = await Promise.all(patientCreationPromises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(`concurrent-patient-${index}-${responses[0].body.data.id.split('-').pop()}`);
      });

      logger.info(`✅ ${concurrentRequests} pacientes creados concurrentemente`);
    }, TEST_TIMEOUT);

    test('Debe responder rápidamente en búsquedas de historial médico', async () => {
      // Crear paciente con múltiples registros médicos
      await request(API_BASE_URL)
        .post('/api/v1/patients')
        .set(authHeaders)
        .send({
          ...testPatientData,
          id: testPatientId
        })
        .expect(201);

      // Crear 20 registros médicos
      const recordCreationPromises = Array(20).fill(null).map((_, index) =>
        request(API_BASE_URL)
          .post('/api/v1/medical-records')
          .set(authHeaders)
          .send({
            ...testMedicalRecord,
            id: `performance-record-${index}`,
            patientId: testPatientId,
            date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
          })
      );

      await Promise.all(recordCreationPromises);

      // Medir tiempo de búsqueda
      const startTime = Date.now();
      
      const response = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/medical-records`)
        .set(authHeaders)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(20);
      expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos
      
      logger.info(`⚡ Búsqueda de 20 registros médicos: ${responseTime}ms`);
    }, TEST_TIMEOUT);
  });
});