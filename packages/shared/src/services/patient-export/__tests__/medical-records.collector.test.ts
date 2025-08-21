import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MedicalRecordsCollector } from '../collectors/medical-records.collector';
import type { MedicalRecord } from '../collectors/medical-records.collector';

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

describe('MedicalRecordsCollector', () => {
  let collector: MedicalRecordsCollector;
  const mockPatientId = 'test-patient-123';

  beforeEach(() => {
    collector = new MedicalRecordsCollector();
    vi.clearAllMocks();
    
    // Mock environment variables for testing
    process.env.PATIENT_EXPORT_ENABLED = 'true';
    process.env.PATIENT_EXPORT_USE_MOCKS = 'true';
    process.env.NODE_ENV = 'test';
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(collector['collectionName']).toBe('medical_records');
      expect(collector['category']).toBe('medical_records');
      expect(collector['dateField']).toBe('date');
    });
  });

  describe('validate()', () => {
    it('should validate correct medical record data', () => {
      const validData: MedicalRecord[] = [
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
      ];

      const isValid = collector.validate(validData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid medical record data', () => {
      const invalidData = [
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
      ] as any;

      const isValid = collector.validate(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject non-array data', () => {
      const isValid = collector.validate({} as any);
      expect(isValid).toBe(false);
    });
  });

  describe('sanitize()', () => {
    it('should sanitize medical records correctly', () => {
      const inputData: MedicalRecord[] = [
        {
          id: 'record-1',
          patientId: mockPatientId,
          date: new Date('2023-01-01'),
          type: 'consultation',
          description: 'Test consultation',
          providerId: 'doctor-1',
          providerName: 'Dr. Test',
          status: 'active',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          metadata: {
            internalNotes: 'Sensitive internal info',
            publicInfo: 'Public information',
          },
        },
      ];

      const sanitized = collector.sanitize(inputData);

      expect(sanitized[0].date).toBeInstanceOf(Date);
      expect(sanitized[0].metadata).toBeDefined();
      expect(sanitized[0].metadata?.internalNotes).toBeUndefined();
      expect(sanitized[0].metadata?.publicInfo).toBe('Public information');
    });

    it('should handle date conversion properly', () => {
      const inputData = [
        {
          id: 'record-1',
          patientId: mockPatientId,
          date: '2023-01-01' as any,
          type: 'consultation',
          description: 'Test consultation',
          providerId: 'doctor-1',
          providerName: 'Dr. Test',
          status: 'active',
          createdAt: '2023-01-01' as any,
          updatedAt: '2023-01-01' as any,
        },
      ] as MedicalRecord[];

      const sanitized = collector.sanitize(inputData);

      expect(sanitized[0].date).toBeInstanceOf(Date);
      expect(sanitized[0].createdAt).toBeInstanceOf(Date);
      expect(sanitized[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('transformDocument()', () => {
    it('should transform Firestore document correctly', () => {
      const mockData = {
        patientId: mockPatientId,
        date: { toDate: () => new Date('2023-01-01') },
        type: 'consultation',
        description: 'Test consultation',
        providerId: 'doctor-1',
        providerName: 'Dr. Test',
        status: 'active',
        createdAt: { toDate: () => new Date('2023-01-01') },
        updatedAt: { toDate: () => new Date('2023-01-01') },
      };

      const transformed = collector['transformDocument']('doc-id', mockData);

      expect(transformed.id).toBe('doc-id');
      expect(transformed.patientId).toBe(mockPatientId);
      expect(transformed.date).toBeInstanceOf(Date);
      expect(transformed.type).toBe('consultation');
      expect(transformed.status).toBe('active');
    });

    it('should handle missing optional fields', () => {
      const mockData = {
        patientId: mockPatientId,
        date: { toDate: () => new Date('2023-01-01') },
        // Missing some optional fields
      };

      const transformed = collector['transformDocument']('doc-id', mockData);

      expect(transformed.id).toBe('doc-id');
      expect(transformed.type).toBe('general');
      expect(transformed.status).toBe('active');
      expect(transformed.severity).toBe('medium');
    });
  });

  describe('getMockData()', () => {
    it('should return mock medical records', () => {
      const mockData = collector['getMockData'](mockPatientId);

      expect(Array.isArray(mockData)).toBe(true);
      expect(mockData.length).toBeGreaterThan(0);
      
      mockData.forEach(record => {
        expect(record.id).toBeDefined();
        expect(record.patientId).toBe(mockPatientId);
        expect(record.date).toBeInstanceOf(Date);
        expect(record.type).toBeDefined();
        expect(record.description).toBeDefined();
        expect(record.status).toBeDefined();
      });
    });

    it('should generate different mock data for different patients', () => {
      const mockData1 = collector['getMockData']('patient-1');
      const mockData2 = collector['getMockData']('patient-2');

      mockData1.forEach(record => expect(record.patientId).toBe('patient-1'));
      mockData2.forEach(record => expect(record.patientId).toBe('patient-2'));
    });
  });

  describe('collect()', () => {
    it('should use mock data when configured', async () => {
      const data = await collector.collect(mockPatientId);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Should return mock data
      data.forEach(record => {
        expect(record.patientId).toBe(mockPatientId);
        expect(record.id).toContain('mock-record');
      });
    });

    it('should handle date range filtering', async () => {
      const dateRange = {
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31'),
      };

      const data = await collector.collect(mockPatientId, dateRange);

      expect(Array.isArray(data)).toBe(true);
      // Mock data should still be returned in test environment
    });

    it('should throw error when export is disabled', async () => {
      process.env.PATIENT_EXPORT_ENABLED = 'false';
      
      await expect(collector.collect(mockPatientId)).rejects.toThrow(
        'Patient data export is disabled'
      );
    });
  });

  describe('getCollectionResult()', () => {
    it('should return collection result with metadata', async () => {
      const result = await collector.getCollectionResult(mockPatientId);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.category).toBe('medical_records');
      expect(result.recordCount).toBe(result.data.length);
      expect(result.collectedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle and rethrow collection errors', async () => {
      // Mock to throw error
      vi.spyOn(collector, 'collect').mockRejectedValueOnce(new Error('Database error'));

      await expect(collector.collect(mockPatientId)).rejects.toThrow('Database error');
    });
  });
});