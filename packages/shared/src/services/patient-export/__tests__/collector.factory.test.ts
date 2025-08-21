import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectorFactory } from '../factories/collector.factory';
import { MedicalRecordsCollector, LabResultsCollector, AppointmentsCollector, VitalSignsCollector } from '../collectors';
import type { DataCategory } from '../types';

// Mock Firebase
vi.mock('../../adapters/firebase', () => ({
  getFirebaseFirestore: vi.fn(() => ({
    collection: vi.fn(),
  })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
  where: vi.fn(),
}));

describe('CollectorFactory', () => {
  const mockPatientId = 'test-patient-123';

  beforeEach(() => {
    CollectorFactory.clearCache();
    vi.clearAllMocks();
    
    // Mock environment variables for testing
    process.env.PATIENT_EXPORT_ENABLED = 'true';
    process.env.PATIENT_EXPORT_USE_MOCKS = 'true';
    process.env.NODE_ENV = 'test';
  });

  describe('getCollector()', () => {
    it('should create and return MedicalRecordsCollector', () => {
      const collector = CollectorFactory.getCollector('medical_records');
      expect(collector).toBeInstanceOf(MedicalRecordsCollector);
    });

    it('should create and return LabResultsCollector', () => {
      const collector = CollectorFactory.getCollector('lab_results');
      expect(collector).toBeInstanceOf(LabResultsCollector);
    });

    it('should create and return AppointmentsCollector', () => {
      const collector = CollectorFactory.getCollector('appointments');
      expect(collector).toBeInstanceOf(AppointmentsCollector);
    });

    it('should create and return VitalSignsCollector', () => {
      const collector = CollectorFactory.getCollector('vital_signs');
      expect(collector).toBeInstanceOf(VitalSignsCollector);
    });

    it('should return cached instance on subsequent calls', () => {
      const collector1 = CollectorFactory.getCollector('medical_records');
      const collector2 = CollectorFactory.getCollector('medical_records');
      
      expect(collector1).toBe(collector2); // Same instance
    });

    it('should throw error for unimplemented collectors', () => {
      expect(() => {
        CollectorFactory.getCollector('prescriptions');
      }).toThrow('PrescriptionsCollector not yet implemented');
    });

    it('should throw error for unknown categories', () => {
      expect(() => {
        CollectorFactory.getCollector('unknown_category' as DataCategory);
      }).toThrow('Unknown data category: unknown_category');
    });
  });

  describe('getAvailableCategories()', () => {
    it('should return all implemented categories', () => {
      const categories = CollectorFactory.getAvailableCategories();
      
      expect(categories).toContain('medical_records');
      expect(categories).toContain('lab_results');
      expect(categories).toContain('appointments');
      expect(categories).toContain('vital_signs');
      expect(categories.length).toBe(4);
    });
  });

  describe('getImplementedCategories()', () => {
    it('should return only implemented categories', () => {
      const implemented = CollectorFactory.getImplementedCategories();
      const available = CollectorFactory.getAvailableCategories();
      
      expect(implemented).toEqual(available);
    });
  });

  describe('getPendingCategories()', () => {
    it('should return categories not yet implemented', () => {
      const pending = CollectorFactory.getPendingCategories();
      
      expect(pending).toContain('prescriptions');
      expect(pending).toContain('immunizations');
      expect(pending).toContain('allergies');
      expect(pending).toContain('procedures');
      expect(pending).toContain('diagnoses');
      expect(pending).toContain('clinical_notes');
      expect(pending).toContain('imaging');
      expect(pending).toContain('documents');
      expect(pending).toContain('billing');
      expect(pending).toContain('consents');
      expect(pending).toContain('audit_logs');
    });
  });

  describe('isImplemented()', () => {
    it('should return true for implemented categories', () => {
      expect(CollectorFactory.isImplemented('medical_records')).toBe(true);
      expect(CollectorFactory.isImplemented('lab_results')).toBe(true);
      expect(CollectorFactory.isImplemented('appointments')).toBe(true);
      expect(CollectorFactory.isImplemented('vital_signs')).toBe(true);
    });

    it('should return false for unimplemented categories', () => {
      expect(CollectorFactory.isImplemented('prescriptions')).toBe(false);
      expect(CollectorFactory.isImplemented('immunizations')).toBe(false);
      expect(CollectorFactory.isImplemented('allergies')).toBe(false);
    });
  });

  describe('collectMultiple()', () => {
    it('should collect data for multiple categories', async () => {
      const categories: DataCategory[] = ['medical_records', 'lab_results', 'appointments'];
      
      const results = await CollectorFactory.collectMultiple(categories, mockPatientId);
      
      expect(results).toHaveProperty('medical_records');
      expect(results).toHaveProperty('lab_results');
      expect(results).toHaveProperty('appointments');
      
      expect(Array.isArray(results.medical_records)).toBe(true);
      expect(Array.isArray(results.lab_results)).toBe(true);
      expect(Array.isArray(results.appointments)).toBe(true);
    });

    it('should handle date range for multiple categories', async () => {
      const categories: DataCategory[] = ['medical_records', 'vital_signs'];
      const dateRange = {
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31'),
      };
      
      const results = await CollectorFactory.collectMultiple(categories, mockPatientId, dateRange);
      
      expect(results).toHaveProperty('medical_records');
      expect(results).toHaveProperty('vital_signs');
    });

    it('should filter out unimplemented categories', async () => {
      const categories: DataCategory[] = ['medical_records', 'prescriptions', 'lab_results'];
      
      const results = await CollectorFactory.collectMultiple(categories, mockPatientId);
      
      expect(results).toHaveProperty('medical_records');
      expect(results).toHaveProperty('lab_results');
      expect(results).not.toHaveProperty('prescriptions');
    });

    it('should handle collector errors gracefully', async () => {
      const categories: DataCategory[] = ['medical_records'];
      
      // Mock collector to throw error
      const mockCollector = {
        collect: vi.fn().mockRejectedValue(new Error('Collection failed')),
      };
      CollectorFactory['instances'].set('medical_records', mockCollector as any);
      
      const results = await CollectorFactory.collectMultiple(categories, mockPatientId);
      
      expect(results.medical_records).toEqual([]);
    });
  });

  describe('validateCollectedData()', () => {
    it('should validate correct collected data', () => {
      const collectedData = {
        medical_records: [
          {
            id: 'record-1',
            patientId: mockPatientId,
            date: new Date(),
            type: 'consultation',
            description: 'Test consultation',
            providerId: 'doctor-1',
            providerName: 'Dr. Test',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const result = CollectorFactory.validateCollectedData(collectedData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const collectedData = {
        medical_records: [
          {
            id: 'record-1',
            // Missing required fields
            patientId: '',
            date: null,
            type: '',
            description: '',
            providerId: '',
            status: 'invalid-status',
          },
        ],
      };

      const result = CollectorFactory.validateCollectedData(collectedData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('medical_records');
    });

    it('should skip unimplemented categories', () => {
      const collectedData = {
        prescriptions: [{ id: 'test' }],
      };

      const result = CollectorFactory.validateCollectedData(collectedData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation errors gracefully', () => {
      const collectedData = {
        medical_records: [{}],
      };

      // Mock collector to throw error
      const mockCollector = {
        validate: vi.fn().mockImplementation(() => {
          throw new Error('Validation error');
        }),
      };
      CollectorFactory['instances'].set('medical_records', mockCollector as any);

      const result = CollectorFactory.validateCollectedData(collectedData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Validation error');
    });
  });

  describe('Cache Management', () => {
    it('should cache collector instances', () => {
      expect(CollectorFactory.getInstanceCount()).toBe(0);
      
      CollectorFactory.getCollector('medical_records');
      expect(CollectorFactory.getInstanceCount()).toBe(1);
      
      CollectorFactory.getCollector('lab_results');
      expect(CollectorFactory.getInstanceCount()).toBe(2);
    });

    it('should clear cache when requested', () => {
      CollectorFactory.getCollector('medical_records');
      CollectorFactory.getCollector('lab_results');
      
      expect(CollectorFactory.getInstanceCount()).toBe(2);
      
      CollectorFactory.clearCache();
      expect(CollectorFactory.getInstanceCount()).toBe(0);
    });

    it('should return cached categories', () => {
      CollectorFactory.getCollector('medical_records');
      CollectorFactory.getCollector('vital_signs');
      
      const cachedCategories = CollectorFactory.getCachedCategories();
      expect(cachedCategories).toContain('medical_records');
      expect(cachedCategories).toContain('vital_signs');
      expect(cachedCategories).toHaveLength(2);
    });
  });
});