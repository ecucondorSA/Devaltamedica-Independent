import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditCollection } from '../firestore/audit-collection';
import { AuditLogSchema } from '../schemas/audit.schema';
import type { AuditLog } from '../schemas/audit.schema';

describe('Audit Log Implementation', () => {
  let auditRepo: AuditLogRepository;

  beforeEach(() => {
    auditRepo = new AuditLogRepository();
  });

  describe('AuditLogSchema Validation', () => {
    it('should validate a complete audit log entry', () => {
      const validAuditLog: AuditLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        actorType: 'doctor',
        resource: 'patient',
        action: 'read',
        timestamp: new Date('2025-08-13T15:30:00.000Z'),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        metadata: {
          patientId: '456',
          section: 'medical_history',
          duration: 120
        }
      };

      const result = AuditLogSchema.safeParse(validAuditLog);
      expect(result.success).toBe(true);
    });

    it('should reject invalid audit log entries', () => {
      const invalidAuditLog = {
        id: 'invalid-uuid',
        actorId: '',
        actorType: 'invalid_role',
        resource: '',
        action: 'invalid_action',
        timestamp: 'invalid-date',
        ipAddress: 'invalid-ip'
      };

      const result = AuditLogSchema.safeParse(invalidAuditLog);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toBeDefined();
    });

    it('should validate required fields', () => {
      const minimalAuditLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        actorType: 'doctor',
        resource: 'patient',
        action: 'read',
        timestamp: new Date(),
        ipAddress: '192.168.1.100'
      };

      const result = AuditLogSchema.safeParse(minimalAuditLog);
      expect(result.success).toBe(true);
    });

    it('should validate IP address formats', () => {
      const testCases = [
        { ip: '192.168.1.100', valid: true },
        { ip: '10.0.0.1', valid: true },
        { ip: '172.16.0.1', valid: true },
        { ip: '256.256.256.256', valid: false },
        { ip: 'invalid-ip', valid: false },
        { ip: '192.168.1', valid: false }
      ];

      testCases.forEach(({ ip, valid }) => {
        const auditLog = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          actorId: '123e4567-e89b-12d3-a456-426614174000',
          actorType: 'doctor',
          resource: 'patient/456',
          action: 'view',
          timestamp: new Date(),
          ipAddress: ip
        };

        const result = AuditLogSchema.safeParse(auditLog);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('AuditCollection Firestore Integration', () => {
    it('should get collection reference', () => {
      const collection = AuditCollection.getCollection();
      expect(collection).toBeDefined();
    });

    it('should return correct collection name', () => {
      const collectionName = AuditCollection.getCollectionName();
      expect(collectionName).toBe('audit_logs');
    });

    it('should initialize collection without errors', async () => {
      await expect(AuditCollection.initializeCollection()).resolves.not.toThrow();
    });
  });

  describe('AuditLogRepository Operations', () => {
    it('should create repository instance', () => {
      expect(auditRepo).toBeInstanceOf(AuditLogRepository);
    });

    it('should have correct collection name', () => {
      expect(auditRepo.collectionName).toBe('audit_logs');
    });

    // Note: These tests would require Firebase emulator or mock setup
    it.skip('should create audit log entry', async () => {
      const auditLog: Omit<AuditLog, 'id'> = {
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        actorType: 'doctor',
        resource: 'patient',
        action: 'read',
        timestamp: new Date(),
        ip: '192.168.1.100',
        success: true,
        metadata: {
          patientId: '456',
          section: 'medical_history'
        }
      };

      const result = await auditRepo.create(auditLog as any);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it.skip('should query audit logs by actor', async () => {
      const actorId = '123e4567-e89b-12d3-a456-426614174000';
      const result = await auditRepo.findByField('actorId', actorId);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('HIPAA Compliance Validation', () => {
    it('should track all required audit fields', () => {
      const requiredFields = [
        'id',
        'actorId', 
        'actorType',
        'resource',
        'action',
        'timestamp',
        'ip'
      ];

      const schema = AuditLogSchema.shape;
      
      requiredFields.forEach(field => {
        expect(schema[field as keyof typeof schema]).toBeDefined();
      });
    });

    it('should support medical-specific actor types', () => {
      const medicalActorTypes = ['doctor', 'patient', 'admin', 'nurse', 'technician'];
      
      medicalActorTypes.forEach(actorType => {
        const auditLog = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          actorId: '123e4567-e89b-12d3-a456-426614174000',
          actorType,
          resource: 'patient/456',
          action: 'view',
          timestamp: new Date(),
          ipAddress: '192.168.1.100'
        };

        const result = AuditLogSchema.safeParse(auditLog);
        expect(result.success).toBe(true);
      });
    });

    it('should support medical-specific actions', () => {
      const medicalActions = [
        'view', 'create', 'update', 'delete',
        'download', 'print', 'share', 'access_denied',
        'login', 'logout', 'password_change'
      ];
      
      medicalActions.forEach(action => {
        const auditLog = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          actorId: '123e4567-e89b-12d3-a456-426614174000',
          actorType: 'doctor',
          resource: 'patient/456',
          action,
          timestamp: new Date(),
          ipAddress: '192.168.1.100'
        };

        const result = AuditLogSchema.safeParse(auditLog);
        expect(result.success).toBe(true);
      });
    });
  });
});