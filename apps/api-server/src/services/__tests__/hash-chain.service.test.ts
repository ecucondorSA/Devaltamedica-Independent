import { describe, it, expect, beforeEach } from 'vitest';
import { HashChainService } from '../hash-chain.service';
import type { AuditLog } from '@altamedica/types';

describe('HashChainService', () => {
  let service: HashChainService;

  beforeEach(() => {
    service = HashChainService.getInstance();
    service.resetChain(); // Reset for testing
  });

  describe('calculateHash', () => {
    it('should generate consistent SHA-256 hash for same input', () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const hash1 = service.calculateHash(entry);
      const hash2 = service.calculateHash(entry);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different inputs', () => {
      const entry1 = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const entry2 = {
        ...entry1,
        actorId: 'user-456'
      };

      const hash1 = service.calculateHash(entry1);
      const hash2 = service.calculateHash(entry2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateChainedHash', () => {
    it('should include previous hash in calculation', () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const hash1 = service.calculateChainedHash(entry, null, 1);
      const hash2 = service.calculateChainedHash(entry, 'previous-hash', 1);

      expect(hash1).not.toBe(hash2);
    });

    it('should use GENESIS for first entry', () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const hash = service.calculateChainedHash(entry, null, 1);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('addHashChain', () => {
    it('should add hash fields to audit entry', async () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const result = await service.addHashChain(entry);

      expect(result.hash).toBeDefined();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.prevHash).toBeNull();
      expect(result.sequenceNumber).toBe(1);
    });

    it('should link entries in chain', async () => {
      const entry1 = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const entry2 = {
        ...entry1,
        id: 'test-id-456',
        timestamp: new Date('2025-01-01T00:01:00Z')
      };

      const result1 = await service.addHashChain(entry1);
      const result2 = await service.addHashChain(entry2);

      expect(result2.prevHash).toBe(result1.hash);
      expect(result2.sequenceNumber).toBe(2);
    });
  });

  describe('verifyEntry', () => {
    it('should verify valid entry', async () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const hashedEntry = await service.addHashChain(entry);
      const isValid = service.verifyEntry(hashedEntry);

      expect(isValid).toBe(true);
    });

    it('should reject tampered entry', async () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      const hashedEntry = await service.addHashChain(entry);
      
      // Tamper with entry
      const tamperedEntry = {
        ...hashedEntry,
        actorId: 'user-456' // Changed after hashing
      };

      const isValid = service.verifyEntry(tamperedEntry as AuditLog);
      expect(isValid).toBe(false);
    });

    it('should handle legacy entries without hash', () => {
      const legacyEntry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      } as AuditLog;

      const isValid = service.verifyEntry(legacyEntry);
      expect(isValid).toBe(false);
    });
  });

  describe('verifyChain', () => {
    it('should verify valid chain', async () => {
      const entries = [];
      
      for (let i = 0; i < 5; i++) {
        const entry = {
          id: `test-id-${i}`,
          timestamp: new Date(`2025-01-01T00:0${i}:00Z`),
          actorId: 'user-123',
          actorType: 'doctor' as const,
          action: 'read' as const,
          resource: 'medical_record' as const,
          success: true
        };
        
        const hashedEntry = await service.addHashChain(entry);
        entries.push(hashedEntry);
      }

      const result = await service.verifyChain(entries);
      expect(result.isValid).toBe(true);
      expect(result.brokenAt).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should detect broken chain', async () => {
      const entries = [];
      
      for (let i = 0; i < 3; i++) {
        const entry = {
          id: `test-id-${i}`,
          timestamp: new Date(`2025-01-01T00:0${i}:00Z`),
          actorId: 'user-123',
          actorType: 'doctor' as const,
          action: 'read' as const,
          resource: 'medical_record' as const,
          success: true
        };
        
        const hashedEntry = await service.addHashChain(entry);
        entries.push(hashedEntry);
      }

      // Break the chain
      entries[1].hash = 'tampered-hash';

      const result = await service.verifyChain(entries);
      expect(result.isValid).toBe(false);
      expect(result.brokenAt).toBe(2);
      expect(result.error).toContain('Hash mismatch');
    });

    it('should handle mixed legacy and hashed entries', async () => {
      const legacyEntry = {
        id: 'legacy-id',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      } as AuditLog;

      const hashedEntry = await service.addHashChain({
        id: 'hashed-id',
        timestamp: new Date('2025-01-01T00:01:00Z'),
        actorId: 'user-456',
        actorType: 'patient' as const,
        action: 'create' as const,
        resource: 'appointment' as const,
        success: true
      });

      const result = await service.verifyChain([legacyEntry, hashedEntry]);
      expect(result.isValid).toBe(true); // Should skip legacy entries
    });
  });

  describe('calculateMerkleRoot', () => {
    it('should calculate Merkle root for multiple entries', async () => {
      const entries = [];
      
      for (let i = 0; i < 4; i++) {
        const entry = {
          id: `test-id-${i}`,
          timestamp: new Date(`2025-01-01T00:0${i}:00Z`),
          actorId: 'user-123',
          actorType: 'doctor' as const,
          action: 'read' as const,
          resource: 'medical_record' as const,
          success: true
        };
        
        const hashedEntry = await service.addHashChain(entry);
        entries.push(hashedEntry);
      }

      const merkleRoot = service.calculateMerkleRoot(entries);
      expect(merkleRoot).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle empty array', () => {
      const merkleRoot = service.calculateMerkleRoot([]);
      expect(merkleRoot).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle odd number of entries', async () => {
      const entries = [];
      
      for (let i = 0; i < 3; i++) {
        const entry = {
          id: `test-id-${i}`,
          timestamp: new Date(`2025-01-01T00:0${i}:00Z`),
          actorId: 'user-123',
          actorType: 'doctor' as const,
          action: 'read' as const,
          resource: 'medical_record' as const,
          success: true
        };
        
        const hashedEntry = await service.addHashChain(entry);
        entries.push(hashedEntry);
      }

      const merkleRoot = service.calculateMerkleRoot(entries);
      expect(merkleRoot).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getChainMetadata', () => {
    it('should return chain metadata', async () => {
      const entry = {
        id: 'test-id-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actorId: 'user-123',
        actorType: 'doctor' as const,
        action: 'read' as const,
        resource: 'medical_record' as const,
        success: true
      };

      await service.addHashChain(entry);
      const metadata = service.getChainMetadata();

      expect(metadata.lastHash).toMatch(/^[a-f0-9]{64}$/);
      expect(metadata.lastSequenceNumber).toBe(1);
      expect(metadata.algorithm).toBe('SHA-256');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.timestamp).toBeInstanceOf(Date);
    });
  });
});