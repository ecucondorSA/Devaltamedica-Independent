/**
 * 🧪 AUDIT LOG REPOSITORY TESTS
 * Verificación del cumplimiento Ley 26.529 Argentina
 * Tests críticos para sistema de auditoría médica
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuditLogRepository } from './AuditLogRepository';
import { CreateAuditLog, AuditLog, AUDIT_ACTIONS, AUDIT_RESOURCES } from '@altamedica/types';

// Mock Firestore para testing
const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(() => ({
        exists: true,
        data: () => mockAuditData,
        id: 'test-audit-id'
      }))
    })),
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => ({
            docs: [
              {
                id: 'test-audit-id',
                data: () => mockAuditData
              }
            ]
          }))
        }))
      }))
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(() => ({
        docs: []
      }))
    }))
  })),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date }))
  }
};

const mockDbConnection = {
  getFirestore: vi.fn(() => Promise.resolve(mockFirestore)),
  recordQuery: vi.fn()
};

// Mock data conforme Ley 26.529
const mockAuditData = {
  id: 'test-audit-id',
  timestamp: { toDate: () => new Date('2025-08-13T10:00:00Z') },
  actorId: 'doctor_12345',
  actorType: 'doctor',
  action: 'read',
  resource: 'medical_record',
  resourceId: 'record_67890',
  patientId: 'patient_54321',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0 AltaMedica/2.0',
  sessionId: 'session_abcdef',
  success: true,
  metadata: {
    module: 'doctors_app',
    feature: 'patient_history'
  }
};

const sampleCreateAuditLog: CreateAuditLog = {
  actorId: 'doctor_12345',
  actorType: 'doctor',
  action: AUDIT_ACTIONS.READ,
  resource: AUDIT_RESOURCES.MEDICAL_RECORD,
  resourceId: 'record_67890',
  patientId: 'patient_54321',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0 AltaMedica/2.0',
  sessionId: 'session_abcdef',
  success: true,
  metadata: {
    module: 'doctors_app',
    feature: 'patient_history'
  }
};

// Mock dependencias
vi.mock('../core/DatabaseConnection', () => ({
  dbConnection: mockDbConnection
}));

describe('AuditLogRepository - Compliance Ley 26.529', () => {
  let repository: AuditLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AuditLogRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create() - Artículo 15 Compliance', () => {
    it('debe crear audit log con todos los campos obligatorios según Ley 26.529', async () => {
      // Act
      const result = await repository.create(sampleCreateAuditLog);

      // Assert - Verificar campos obligatorios Art. 15
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.actorId).toBe('doctor_12345'); // "clave de identificación"
      expect(result.action).toBe('read'); // "registro de modificaciones"
      expect(result.resource).toBe('medical_record');

      // Verificar que se llamó a Firestore
      expect(mockFirestore.collection).toHaveBeenCalledWith('audit_logs');
    });

    it('debe generar ID único y timestamp automáticamente', async () => {
      // Act
      const result = await repository.create(sampleCreateAuditLog);

      // Assert
      expect(result.id).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('debe validar que logs médicos tengan patientId (compliance médico)', async () => {
      // Arrange - Log médico sin patientId
      const invalidMedicalLog: CreateAuditLog = {
        ...sampleCreateAuditLog,
        resource: AUDIT_RESOURCES.MEDICAL_RECORD,
        patientId: undefined // Violación: log médico sin patientId
      };

      // Act & Assert
      await expect(repository.create(invalidMedicalLog)).rejects.toThrow();
    });

    it('debe requerir actorId obligatorio según Art. 15', async () => {
      // Arrange
      const invalidLog: any = {
        ...sampleCreateAuditLog,
        actorId: undefined // Violación Art. 15
      };

      // Act & Assert
      await expect(repository.create(invalidLog)).rejects.toThrow();
    });

    it('debe persistir en Firestore sin fallar (crítico para compliance)', async () => {
      // Arrange
      const firestoreSetMock = vi.fn();
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          set: firestoreSetMock
        }))
      }));

      // Act
      await repository.create(sampleCreateAuditLog);

      // Assert
      expect(firestoreSetMock).toHaveBeenCalledTimes(1);
      const setCallArgs = firestoreSetMock.mock.calls[0][0];
      expect(setCallArgs).toHaveProperty('actorId', 'doctor_12345');
      expect(setCallArgs).toHaveProperty('timestamp');
    });
  });

  describe('findMany() - Consultas de Auditoría', () => {
    it('debe permitir filtrar por paciente específico (Habeas Data)', async () => {
      // Arrange
      const patientFilter = {
        patientId: 'patient_54321',
        limit: 50,
        offset: 0
      };

      // Act
      const results = await repository.findMany(patientFilter);

      // Assert
      expect(Array.isArray(results)).toBe(true);
      expect(mockFirestore.collection).toHaveBeenCalledWith('audit_logs');
    });

    it('debe permitir filtrar por actor (médico)', async () => {
      // Arrange
      const actorFilter = {
        actorId: 'doctor_12345',
        limit: 50,
        offset: 0
      };

      // Act
      const results = await repository.findMany(actorFilter);

      // Assert
      expect(Array.isArray(results)).toBe(true);
    });

    it('debe respetar límites de paginación (max 100)', async () => {
      // Arrange
      const largeFilter = {
        limit: 150, // Intentar más del máximo
        offset: 0
      };

      // Act
      const results = await repository.findMany(largeFilter);

      // Assert - Se debe limitar a 100 o al límite implementado
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('exportPatientAuditHistory() - Ley 25.326 Habeas Data', () => {
    it('debe exportar historial completo de un paciente', async () => {
      // Act
      const history = await repository.exportPatientAuditHistory('patient_54321');

      // Assert
      expect(Array.isArray(history)).toBe(true);
      expect(mockFirestore.collection).toHaveBeenCalledWith('audit_logs');
    });

    it('debe ordenar por timestamp descendente', async () => {
      // Arrange
      const orderByMock = vi.fn(() => ({
        get: vi.fn(() => ({ docs: [] }))
      }));
      mockFirestore.collection = vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: orderByMock
        }))
      }));

      // Act
      await repository.exportPatientAuditHistory('patient_54321');

      // Assert
      expect(orderByMock).toHaveBeenCalledWith('timestamp', 'desc');
    });
  });

  describe('getStats() - Estadísticas de Compliance', () => {
    it('debe generar estadísticas para período específico', async () => {
      // Arrange
      const timeRange = {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-31')
      };

      // Act
      const stats = await repository.getStats(timeRange);

      // Assert
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('entriesByAction');
      expect(stats).toHaveProperty('entriesByResource');
      expect(stats).toHaveProperty('failedActions');
      expect(stats).toHaveProperty('uniqueActors');
      expect(stats).toHaveProperty('dateRange');
    });
  });

  describe('verifyIntegrity() - Detección de Manipulación', () => {
    it('debe verificar integridad de logs en período', async () => {
      // Arrange
      const timeRange = {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-31')
      };

      // Act
      const isIntegral = await repository.verifyIntegrity(timeRange);

      // Assert
      expect(typeof isIntegral).toBe('boolean');
    });
  });

  describe('Emergency Logging - Failover Critical', () => {
    it('debe crear log de emergencia si falla el sistema principal', async () => {
      // Arrange - Simular fallo en Firestore principal
      const errorFirestore = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            set: vi.fn(() => {
              throw new Error('Firestore connection failed');
            })
          }))
        }))
      };

      mockDbConnection.getFirestore = vi.fn(() => Promise.resolve(errorFirestore));

      // Act & Assert
      await expect(repository.create(sampleCreateAuditLog)).rejects.toThrow();
      
      // Verificar que se intentó crear log de emergencia
      expect(errorFirestore.collection).toHaveBeenCalled();
    });
  });
});

describe('Schema Validation - Ley 26.529 Data Requirements', () => {
  it('debe validar todos los tipos de acciones auditables', () => {
    const requiredActions = ['read', 'create', 'update', 'delete', 'export', 'access_denied', 'login', 'logout'];
    
    Object.values(AUDIT_ACTIONS).forEach(action => {
      expect(requiredActions).toContain(action);
    });
  });

  it('debe validar todos los recursos médicos auditables', () => {
    const medicalResources = ['patient', 'appointment', 'medical_record', 'prescription', 'lab_result', 'telemedicine_session'];
    
    medicalResources.forEach(resource => {
      expect(Object.values(AUDIT_RESOURCES)).toContain(resource);
    });
  });

  it('debe requerir campos obligatorios según legislación argentina', () => {
    // Campos requeridos por Ley 26.529 Art. 15
    const requiredFields = ['actorId', 'timestamp', 'action', 'resource'];
    
    const testLog: AuditLog = {
      id: 'test',
      timestamp: new Date(),
      actorId: 'test_actor',
      actorType: 'doctor',
      action: 'read',
      resource: 'medical_record',
      success: true
    };

    requiredFields.forEach(field => {
      expect(testLog).toHaveProperty(field);
      expect(testLog[field as keyof AuditLog]).toBeDefined();
    });
  });
});

describe('Performance & Reliability', () => {
  it('debe completar creación de audit log en menos de 1 segundo', async () => {
    // Arrange
    const startTime = Date.now();

    // Act
    await repository.create(sampleCreateAuditLog);

    // Assert
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // 1 segundo máximo
  });

  it('debe registrar métricas de performance', async () => {
    // Act
    await repository.create(sampleCreateAuditLog);

    // Assert
    expect(mockDbConnection.recordQuery).toHaveBeenCalledWith(
      'audit_log_create',
      expect.any(Number),
      true
    );
  });
});