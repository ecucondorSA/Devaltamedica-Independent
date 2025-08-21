// 🧪 TESTS SEGURIDAD HIPAA: Compliance y Protección de PHI
// Tests críticos para cumplimiento HIPAA y seguridad de datos médicos

import request from 'supertest';
import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import crypto from 'crypto';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock de dependencias de encriptación
vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto');
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from('test-salt-12345678901234567890')),
    scryptSync: vi.fn(() => Buffer.from('derived-key-32-bytes-for-testing')),
    createCipher: vi.fn(() => ({
      update: vi.fn(() => 'encrypted-data'),
      final: vi.fn(() => '-final')
    })),
    createDecipher: vi.fn(() => ({
      update: vi.fn(() => 'decrypted-data'),
      final: vi.fn(() => '')
    }))
  };
});

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() }
  },
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'hipaa-test-user',
      email: 'hipaa.test@altamedica.com',
      role: 'doctor'
    })
  }),
  firestore: () => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ 
        id: 'test-123',
        encryptedPHI: 'encrypted-data-final',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyId: 'key-123'
        }
      })
    }),
    set: vi.fn().mockResolvedValue({}),
    add: vi.fn().mockResolvedValue({ id: 'audit-log-123' })
  })
}));

// Configuración del test
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Headers de autenticación para diferentes roles
const doctorAuthHeaders = {
  'Authorization': 'Bearer mock-hipaa-doctor-token',
  'Content-Type': 'application/json',
  'X-Test-User': 'hipaa-doctor-test',
  'X-Client-IP': '192.168.1.100',
  'User-Agent': 'AltaMedica-Test/1.0'
};

const patientAuthHeaders = {
  'Authorization': 'Bearer mock-hipaa-patient-token',
  'Content-Type': 'application/json',
  'X-Test-User': 'hipaa-patient-test'
};

const unauthorizedHeaders = {
  'Content-Type': 'application/json',
  'X-Test-User': 'unauthorized-test'
};

// Datos de prueba con PHI (Protected Health Information)
const testPHIData = {
  // Datos que constituyen PHI según HIPAA
  patientId: 'patient-hipaa-test-123',
  ssn: '123-45-6789',
  medicalRecordNumber: 'MRN-456789',
  firstName: 'Juan',
  lastName: 'Pérez',
  dateOfBirth: '1985-03-15',
  phoneNumber: '+54-11-1234-5678',
  email: 'juan.perez.hipaa@test.com',
  address: {
    street: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    zipCode: '1043',
    country: 'Argentina'
  },
  medicalData: {
    diagnosis: 'Hipertensión arterial',
    medications: ['Losartán 50mg', 'Hidroclorotiazida 25mg'],
    allergies: ['Penicilina'],
    labResults: [
      {
        test: 'Glucosa',
        value: 126,
        unit: 'mg/dL',
        date: '2024-01-15',
        abnormal: true
      }
    ],
    vitalSigns: {
      bloodPressure: '140/90',
      heartRate: 78,
      temperature: 36.5
    }
  },
  insuranceInfo: {
    provider: 'OSDE',
    memberId: 'MEM123456789',
    groupNumber: 'GRP001'
  }
};

const nonPHIData = {
  // Datos que NO constituyen PHI
  hospitalName: 'Hospital General',
  department: 'Cardiología',
  generalStatistics: {
    totalPatients: 1500,
    averageWaitTime: 15
  },
  publicHealthInfo: {
    seasonalTrends: 'Increase in respiratory infections',
    recommendations: 'Get flu vaccination'
  }
};

describe('🔒 HIPAA Compliance y Seguridad PHI', () => {
  
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.HIPAA_ENCRYPTION_ENABLED = 'true';
    logger.info('🚀 Iniciando tests de compliance HIPAA...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    logger.info('✅ Tests HIPAA completados');
  });

  describe('🔐 Encriptación de PHI', () => {
    
    test('Debe encriptar datos PHI antes del almacenamiento', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/patients/hipaa-compliant')
        .set(doctorAuthHeaders)
        .send(testPHIData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.encryptionMetadata).toBeDefined();
      expect(response.body.data.encryptionMetadata.algorithm).toBe('AES-256-GCM');
      expect(response.body.data.encryptionMetadata.encryptedFields).toBeDefined();
      
      // Verificar que campos sensibles están encriptados
      const encryptedFields = response.body.data.encryptionMetadata.encryptedFields;
      expect(encryptedFields).toContain('ssn');
      expect(encryptedFields).toContain('phoneNumber');
      expect(encryptedFields).toContain('address');
      expect(encryptedFields).toContain('medicalData');
      expect(encryptedFields).toContain('insuranceInfo');
      
      // Verificar que datos en respuesta NO contienen PHI en texto plano
      expect(response.body.data.ssn).not.toBe('123-45-6789');
      expect(response.body.data.phoneNumber).not.toBe('+54-11-1234-5678');
      
      // Verificar timestamp de encriptación
      expect(response.body.data.encryptedAt).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe usar diferentes claves de encriptación por tipo de datos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/patients/hipaa-compliant')
        .set(doctorAuthHeaders)
        .send(testPHIData)
        .expect(201);

      const encryptionMeta = response.body.data.encryptionMetadata;
      
      // Verificar que diferentes tipos de PHI usan diferentes claves
      expect(encryptionMeta.keyIds).toBeDefined();
      expect(encryptionMeta.keyIds.identifiers).toBeDefined(); // Para SSN, nombres
      expect(encryptionMeta.keyIds.medical).toBeDefined(); // Para datos médicos
      expect(encryptionMeta.keyIds.financial).toBeDefined(); // Para información de seguros
      
      // Verificar rotación de claves
      expect(encryptionMeta.keyVersion).toBeDefined();
      expect(encryptionMeta.keyExpiryDate).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe manejar encriptación de campos anidados complejos', async () => {
      const complexPHI = {
        ...testPHIData,
        medicalHistory: {
          conditions: [
            {
              diagnosis: 'Diabetes Tipo 2',
              diagnosedDate: '2020-05-10',
              icd10Code: 'E11.9',
              treatingPhysician: 'Dr. María García'
            }
          ],
          procedures: [
            {
              name: 'Angioplastía coronaria',
              date: '2023-08-15',
              hospital: 'Hospital Italiano',
              surgeon: 'Dr. Carlos López'
            }
          ]
        }
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/patients/hipaa-compliant')
        .set(doctorAuthHeaders)
        .send(complexPHI)
        .expect(201);

      const encryptionMeta = response.body.data.encryptionMetadata;
      expect(encryptionMeta.encryptedFields).toContain('medicalHistory');
      expect(encryptionMeta.nestedEncryption).toBeDefined();
      expect(encryptionMeta.nestedEncryption['medicalHistory.conditions']).toBe(true);
      expect(encryptionMeta.nestedEncryption['medicalHistory.procedures']).toBe(true);
    }, TEST_TIMEOUT);

    test('NO debe encriptar datos que no son PHI', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/hospital-info')
        .set(doctorAuthHeaders)
        .send(nonPHIData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.encryptionMetadata).toBeUndefined();
      
      // Datos no-PHI deben estar en texto plano
      expect(response.body.data.hospitalName).toBe('Hospital General');
      expect(response.body.data.department).toBe('Cardiología');
      expect(response.body.data.generalStatistics.totalPatients).toBe(1500);
    }, TEST_TIMEOUT);

    test('Debe fallar si la encriptación falla', async () => {
      // Mock fallo de encriptación
      vi.mocked(crypto.createCipher).mockImplementationOnce(() => {
        throw new Error('Encryption service unavailable');
      });

      const response = await request(API_BASE_URL)
        .post('/api/v1/patients/hipaa-compliant')
        .set(doctorAuthHeaders)
        .send(testPHIData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('encryption_failed');
      expect(response.body.message).toContain('PHI encryption is required');
      
      // Verificar que NO se almacenaron datos sin encriptar
      expect(response.body.data).toBeUndefined();
    }, TEST_TIMEOUT);
  });

  describe('🛡️ Control de Acceso', () => {
    
    test('Debe denegar acceso a PHI sin autenticación', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(unauthorizedHeaders)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('authentication_required');
      expect(response.body.message).toContain('access to PHI requires authentication');
    }, TEST_TIMEOUT);

    test('Debe validar permisos específicos para acceso a PHI', async () => {
      // Crear usuario con permisos limitados
      const limitedUserHeaders = {
        'Authorization': 'Bearer mock-limited-user-token',
        'Content-Type': 'application/json',
        'X-Test-User': 'limited-access-user',
        'X-User-Role': 'nurse'
      };

      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/full-medical-record')
        .set(limitedUserHeaders)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('insufficient_permissions');
      expect(response.body.requiredPermissions).toContain('PHI_FULL_ACCESS');
      expect(response.body.userPermissions).not.toContain('PHI_FULL_ACCESS');
    }, TEST_TIMEOUT);

    test('Debe permitir acceso a PHI con permisos adecuados', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // Verificar que datos sensibles están presentes pero controlados
      expect(response.body.data.patientId).toBe('patient-hipaa-test-123');
      expect(response.body.data.accessLevel).toBe('full');
      expect(response.body.data.accessReason).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe implementar principio de mínimo privilegio', async () => {
      // Enfermera accediendo a datos básicos (permitido)
      const nurseHeaders = {
        ...doctorAuthHeaders,
        'X-User-Role': 'nurse',
        'Authorization': 'Bearer mock-nurse-token'
      };

      const nurseResponse = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/basic-info')
        .set(nurseHeaders)
        .expect(200);

      expect(nurseResponse.body.data.name).toBeDefined();
      expect(nurseResponse.body.data.dateOfBirth).toBeDefined();
      
      // Pero no debe tener acceso a información financiera
      expect(nurseResponse.body.data.ssn).toBeUndefined();
      expect(nurseResponse.body.data.insuranceInfo).toBeUndefined();

      // Administrador accediendo a datos financieros (permitido)
      const adminHeaders = {
        ...doctorAuthHeaders,
        'X-User-Role': 'admin',
        'Authorization': 'Bearer mock-admin-token'
      };

      const adminResponse = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/billing-info')
        .set(adminHeaders)
        .expect(200);

      expect(adminResponse.body.data.insuranceInfo).toBeDefined();
      expect(adminResponse.body.data.billingAddress).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe validar propósito del acceso a PHI', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set({
          ...doctorAuthHeaders,
          'X-Access-Purpose': 'treatment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessJustification.purpose).toBe('treatment');
      
      // Acceso sin propósito válido debe fallar
      const invalidResponse = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set({
          ...doctorAuthHeaders,
          'X-Access-Purpose': 'curiosity'
        })
        .expect(403);

      expect(invalidResponse.body.error).toBe('invalid_access_purpose');
      expect(invalidResponse.body.validPurposes).toContain('treatment');
      expect(invalidResponse.body.validPurposes).toContain('payment');
      expect(invalidResponse.body.validPurposes).toContain('healthcare_operations');
    }, TEST_TIMEOUT);

    test('Debe implementar time-based access control', async () => {
      // Acceso fuera de horario laboral debe requerir justificación adicional
      const afterHoursHeaders = {
        ...doctorAuthHeaders,
        'X-Access-Time': new Date().setHours(2, 0, 0, 0).toString(), // 2:00 AM
        'X-Emergency-Justification': 'Patient presenting with acute chest pain'
      };

      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/emergency-phi')
        .set(afterHoursHeaders)
        .expect(200);

      expect(response.body.data.afterHoursAccess).toBe(true);
      expect(response.body.data.emergencyJustification).toBeDefined();
      
      // Acceso nocturno sin justificación debe fallar
      const noJustificationHeaders = {
        ...doctorAuthHeaders,
        'X-Access-Time': new Date().setHours(2, 0, 0, 0).toString()
      };

      const deniedResponse = await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(noJustificationHeaders)
        .expect(403);

      expect(deniedResponse.body.error).toBe('after_hours_access_denied');
    }, TEST_TIMEOUT);
  });

  describe('📝 Audit Logging', () => {
    
    test('Debe registrar todos los accesos a PHI', async () => {
      // Realizar acceso a PHI
      await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(doctorAuthHeaders)
        .expect(200);

      // Verificar que se creó audit log
      const auditResponse = await request(API_BASE_URL)
        .get('/api/v1/audit-logs/patient-hipaa-test-123')
        .set(doctorAuthHeaders)
        .expect(200);

      expect(auditResponse.body.success).toBe(true);
      expect(auditResponse.body.data.auditLogs).toBeDefined();
      expect(auditResponse.body.data.auditLogs.length).toBeGreaterThan(0);
      
      const latestLog = auditResponse.body.data.auditLogs[0];
      expect(latestLog.action).toBe('PHI_ACCESS');
      expect(latestLog.userId).toBe('hipaa-test-user');
      expect(latestLog.timestamp).toBeDefined();
      expect(latestLog.ipAddress).toBe('192.168.1.100');
      expect(latestLog.userAgent).toBe('AltaMedica-Test/1.0');
      expect(latestLog.resourceId).toBe('patient-hipaa-test-123');
      expect(latestLog.resourceType).toBe('patient_phi');
    }, TEST_TIMEOUT);

    test('Debe registrar modificaciones de PHI con detalles', async () => {
      const modificationData = {
        medicalData: {
          ...testPHIData.medicalData,
          diagnosis: 'Hipertensión arterial controlada' // Modificación
        }
      };

      await request(API_BASE_URL)
        .patch('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(doctorAuthHeaders)
        .send(modificationData)
        .expect(200);

      // Verificar audit log de modificación
      const auditResponse = await request(API_BASE_URL)
        .get('/api/v1/audit-logs/patient-hipaa-test-123')
        .set(doctorAuthHeaders)
        .expect(200);

      const modificationLog = auditResponse.body.data.auditLogs.find(log => log.action === 'PHI_MODIFY');
      expect(modificationLog).toBeDefined();
      expect(modificationLog.changedFields).toContain('medicalData.diagnosis');
      expect(modificationLog.oldValue).toBe('Hipertensión arterial');
      expect(modificationLog.newValue).toBe('Hipertensión arterial controlada');
      expect(modificationLog.changeReason).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe registrar intentos de acceso denegados', async () => {
      // Intento de acceso sin autorización
      await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(unauthorizedHeaders)
        .expect(401);

      // Verificar que se registró el intento fallido
      const auditResponse = await request(API_BASE_URL)
        .get('/api/v1/audit-logs/security-events')
        .set(doctorAuthHeaders)
        .expect(200);

      const securityEvents = auditResponse.body.data.securityEvents;
      const deniedAccess = securityEvents.find(event => 
        event.type === 'UNAUTHORIZED_PHI_ACCESS_ATTEMPT'
      );
      
      expect(deniedAccess).toBeDefined();
      expect(deniedAccess.resourceId).toBe('patient-hipaa-test-123');
      expect(deniedAccess.outcome).toBe('DENIED');
      expect(deniedAccess.riskLevel).toBe('HIGH');
    }, TEST_TIMEOUT);

    test('Debe generar alertas por patrones de acceso sospechosos', async () => {
      // Simular múltiples accesos rápidos (patrón sospechoso)
      const rapidAccessPromises = Array(10).fill(null).map(() =>
        request(API_BASE_URL)
          .get('/api/v1/patients/patient-hipaa-test-123/phi')
          .set(doctorAuthHeaders)
      );

      await Promise.all(rapidAccessPromises);

      // Verificar alerta de seguridad
      const alertResponse = await request(API_BASE_URL)
        .get('/api/v1/security-alerts/recent')
        .set(doctorAuthHeaders)
        .expect(200);

      const suspiciousAccess = alertResponse.body.data.alerts.find(alert =>
        alert.type === 'RAPID_PHI_ACCESS_PATTERN'
      );

      expect(suspiciousAccess).toBeDefined();
      expect(suspiciousAccess.userId).toBe('hipaa-test-user');
      expect(suspiciousAccess.accessCount).toBe(10);
      expect(suspiciousAccess.timeWindow).toBeLessThan(60); // Segundos
      expect(suspiciousAccess.riskScore).toBeGreaterThan(70);
    }, TEST_TIMEOUT);

    test('Debe mantener integridad de logs de auditoría', async () => {
      // Realizar acceso
      await request(API_BASE_URL)
        .get('/api/v1/patients/patient-hipaa-test-123/phi')
        .set(doctorAuthHeaders)
        .expect(200);

      // Verificar integridad de los logs
      const integrityResponse = await request(API_BASE_URL)
        .get('/api/v1/audit-logs/integrity-check')
        .set(doctorAuthHeaders)
        .expect(200);

      expect(integrityResponse.body.data.integrityStatus).toBe('VALID');
      expect(integrityResponse.body.data.checksumValid).toBe(true);
      expect(integrityResponse.body.data.sequenceValid).toBe(true);
      expect(integrityResponse.body.data.tamperEvidence).toBe(false);
      
      // Verificar que los logs tienen firmas digitales
      const auditResponse = await request(API_BASE_URL)
        .get('/api/v1/audit-logs/patient-hipaa-test-123')
        .set(doctorAuthHeaders)
        .expect(200);

      const latestLog = auditResponse.body.data.auditLogs[0];
      expect(latestLog.digitalSignature).toBeDefined();
      expect(latestLog.checksum).toBeDefined();
      expect(latestLog.sequenceNumber).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('🚨 Detección de Violaciones', () => {
    
    test('Debe detectar intentos de data mining no autorizados', async () => {
      // Simular acceso masivo a múltiples pacientes
      const patientIds = Array(20).fill(null).map((_, i) => `patient-${i}`);
      
      const massAccessPromises = patientIds.map(patientId =>
        request(API_BASE_URL)
          .get(`/api/v1/patients/${patientId}/phi`)
          .set(doctorAuthHeaders)
          .catch(() => {}) // Ignorar errores individuales
      );

      await Promise.all(massAccessPromises);

      // Verificar detección de data mining
      const violationResponse = await request(API_BASE_URL)
        .get('/api/v1/security-violations/recent')
        .set(doctorAuthHeaders)
        .expect(200);

      const dataMiningViolation = violationResponse.body.data.violations.find(v =>
        v.type === 'POTENTIAL_DATA_MINING'
      );

      expect(dataMiningViolation).toBeDefined();
      expect(dataMiningViolation.userId).toBe('hipaa-test-user');
      expect(dataMiningViolation.affectedPatients).toBeGreaterThan(10);
      expect(dataMiningViolation.severity).toBe('HIGH');
      expect(dataMiningViolation.autoBlocked).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe detectar accesos fuera de relación médica', async () => {
      // Doctor accediendo a paciente no asignado
      const response = await request(API_BASE_URL)
        .get('/api/v1/patients/unrelated-patient-456/phi')
        .set(doctorAuthHeaders)
        .expect(403);

      expect(response.body.error).toBe('no_treatment_relationship');
      expect(response.body.violation).toBeDefined();
      expect(response.body.violation.type).toBe('UNAUTHORIZED_PATIENT_ACCESS');
      expect(response.body.violation.reported).toBe(true);
      
      // Verificar que se registró la violación
      const violationResponse = await request(API_BASE_URL)
        .get('/api/v1/security-violations/recent')
        .set(doctorAuthHeaders)
        .expect(200);

      const unauthorizedAccess = violationResponse.body.data.violations.find(v =>
        v.patientId === 'unrelated-patient-456'
      );

      expect(unauthorizedAccess).toBeDefined();
      expect(unauthorizedAccess.type).toBe('UNAUTHORIZED_PATIENT_ACCESS');
    }, TEST_TIMEOUT);

    test('Debe generar reportes automáticos de violaciones', async () => {
      const reportResponse = await request(API_BASE_URL)
        .get('/api/v1/hipaa-compliance/violation-report')
        .set(doctorAuthHeaders)
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(reportResponse.body.success).toBe(true);
      expect(reportResponse.body.data.reportPeriod).toBeDefined();
      expect(reportResponse.body.data.totalViolations).toBeGreaterThanOrEqual(0);
      expect(reportResponse.body.data.violationsByType).toBeDefined();
      expect(reportResponse.body.data.violationsByUser).toBeDefined();
      expect(reportResponse.body.data.riskAssessment).toBeDefined();
      expect(reportResponse.body.data.recommendedActions).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('📊 Compliance Reporting', () => {
    
    test('Debe generar reporte de compliance HIPAA completo', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/hipaa-compliance/report')
        .set(doctorAuthHeaders)
        .query({
          period: 'last_30_days',
          includeMetrics: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.complianceScore).toBeLessThanOrEqual(100);
      
      // Métricas de encriptación
      expect(response.body.data.encryption.phiEncryptionRate).toBe(100);
      expect(response.body.data.encryption.algorithm).toBe('AES-256-GCM');
      
      // Métricas de control de acceso
      expect(response.body.data.accessControl.successfulAuthentications).toBeGreaterThan(0);
      expect(response.body.data.accessControl.deniedAccesses).toBeGreaterThanOrEqual(0);
      expect(response.body.data.accessControl.averageSessionDuration).toBeGreaterThan(0);
      
      // Métricas de auditoría
      expect(response.body.data.auditing.totalAuditEvents).toBeGreaterThan(0);
      expect(response.body.data.auditing.auditLogIntegrity).toBe(100);
      
      // Evaluaciones de riesgo
      expect(response.body.data.riskAssessment.overallRiskLevel).toMatch(/LOW|MEDIUM|HIGH/);
    }, TEST_TIMEOUT);

    test('Debe generar métricas de rendimiento de seguridad', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/hipaa-compliance/security-metrics')
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.data.encryptionPerformance).toBeDefined();
      expect(response.body.data.encryptionPerformance.averageEncryptionTime).toBeLessThan(100); // ms
      expect(response.body.data.encryptionPerformance.averageDecryptionTime).toBeLessThan(50); // ms
      
      expect(response.body.data.auditingPerformance).toBeDefined();
      expect(response.body.data.auditingPerformance.logWriteLatency).toBeLessThan(10); // ms
      
      expect(response.body.data.accessControlPerformance).toBeDefined();
      expect(response.body.data.accessControlPerformance.authenticationTime).toBeLessThan(200); // ms
    }, TEST_TIMEOUT);

    test('Debe identificar áreas de mejora en compliance', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/hipaa-compliance/improvement-recommendations')
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.data.recommendations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      
      response.body.data.recommendations.forEach(rec => {
        expect(rec.area).toMatch(/ENCRYPTION|ACCESS_CONTROL|AUDITING|TRAINING|POLICIES/);
        expect(rec.priority).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
        expect(rec.description).toBeDefined();
        expect(rec.actionItems).toBeDefined();
        expect(rec.estimatedImpact).toBeDefined();
      });
    }, TEST_TIMEOUT);
  });

  describe('🔄 Breach Response', () => {
    
    test('Debe detectar y responder a breach de datos simulado', async () => {
      // Simular breach detection
      const response = await request(API_BASE_URL)
        .post('/api/v1/security-incidents/breach-simulation')
        .set(doctorAuthHeaders)
        .send({
          type: 'unauthorized_access',
          affectedRecords: 150,
          dataTypes: ['PHI', 'medical_records'],
          detectionMethod: 'automated_monitoring'
        })
        .expect(201);

      expect(response.body.data.incidentId).toBeDefined();
      expect(response.body.data.status).toBe('DETECTED');
      expect(response.body.data.severity).toBe('HIGH');
      expect(response.body.data.autoResponse.triggered).toBe(true);
      expect(response.body.data.autoResponse.actions).toContain('ISOLATE_AFFECTED_SYSTEMS');
      expect(response.body.data.autoResponse.actions).toContain('NOTIFY_SECURITY_TEAM');
      expect(response.body.data.notifications.sent).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe generar timeline de breach para investigación', async () => {
      const incidentId = 'INC-123456789';
      
      const response = await request(API_BASE_URL)
        .get(`/api/v1/security-incidents/${incidentId}/timeline`)
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.data.timeline).toBeDefined();
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
      
      const timeline = response.body.data.timeline;
      timeline.forEach(event => {
        expect(event.timestamp).toBeDefined();
        expect(event.event).toBeDefined();
        expect(event.source).toBeDefined();
        expect(event.details).toBeDefined();
      });
      
      // Verificar eventos críticos
      const detectionEvent = timeline.find(e => e.event === 'BREACH_DETECTED');
      expect(detectionEvent).toBeDefined();
      
      const responseEvent = timeline.find(e => e.event === 'RESPONSE_INITIATED');
      expect(responseEvent).toBeDefined();
    }, TEST_TIMEOUT);
  });
});

/**
 * Helper functions para tests HIPAA
 */

function generateTestPHI(overrides = {}) {
  return {
    ...testPHIData,
    ...overrides,
    patientId: `phi-test-${Date.now()}`,
    ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`
  };
}

function createAuditLog(action: string, userId: string, resourceId: string) {
  return {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    userId,
    resourceId,
    resourceType: 'patient_phi',
    ipAddress: '192.168.1.100',
    userAgent: 'AltaMedica-Test/1.0',
    outcome: 'SUCCESS'
  };
}

export {
  generateTestPHI,
  createAuditLog
};