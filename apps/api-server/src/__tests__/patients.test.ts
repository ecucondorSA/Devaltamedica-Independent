import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../app/api/v1/patients/route';
import { adminDb } from '@/lib/firebase-admin';

// Mock de Firebase
jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
      })),
    })),
  },
}));

describe('Patients API', () => {
  const mockPatientData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    bloodType: 'O+',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'Madrid',
      country: 'España',
    },
    emergencyContact: {
      name: 'María Pérez',
      phone: '+1234567891',
      relationship: 'Esposa',
    },
  };

  const mockUserData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    isActive: true,
    role: 'patient',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/patients', () => {
    it('should return patients list with pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients?page=1&limit=10',
      });

      const mockDocs = [
        {
          id: 'patient-1',
          data: () => ({
            ...mockPatientData,
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
        {
          id: 'patient-2',
          data: () => ({
            ...mockPatientData,
            firstName: 'María',
            lastName: 'García',
            createdAt: { toDate: () => new Date('2024-01-02') },
            updatedAt: { toDate: () => new Date('2024-01-02') },
          }),
        },
      ];

      const mockSnapshot = {
        size: 2,
        docs: mockDocs,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.meta.page).toBe(1);
      expect(data.meta.limit).toBe(10);
      expect(data.meta.total).toBe(2);
    });

    it('should filter patients by gender', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients?gender=male',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'patient-1',
          data: () => ({
            ...mockPatientData,
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        }],
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].gender).toBe('male');
    });

    it('should filter patients by blood type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients?bloodType=O+',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'patient-1',
          data: () => ({
            ...mockPatientData,
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        }],
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].bloodType).toBe('O+');
    });

    it('should search patients by text', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients?search=Juan',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'patient-1',
          data: () => ({
            ...mockPatientData,
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        }],
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].firstName).toBe('Juan');
    });

    it('should return 400 for invalid query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients?gender=invalid',
      });

      await GET(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database error', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/patients',
      });

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Database error')),
        doc: jest.fn(),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FETCH_PATIENTS_FAILED');
    });
  });

  describe('POST /api/v1/patients', () => {
    it('should create new patient profile', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'patient-uid-123',
          ...mockPatientData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingPatient = {
        exists: false,
        data: () => null,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn((docId: string) => ({
          get: jest.fn().mockResolvedValue(
            docId === 'patient-uid-123' ? mockUserDoc : mockExistingPatient
          ),
          set: jest.fn().mockResolvedValue(undefined),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('patient-uid-123');
      expect(data.data.firstName).toBe('Juan');
      expect(data.data.lastName).toBe('Pérez');
    });

    it('should return 401 for missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          uid: 'patient-uid-123',
          ...mockPatientData,
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'non-existent-uid',
          ...mockPatientData,
        },
      });

      const mockUserDoc = {
        exists: false,
        data: () => null,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockUserDoc),
          set: jest.fn(),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 for invalid user role', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'doctor-uid-123',
          ...mockPatientData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => ({ ...mockUserData, role: 'doctor' }),
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockUserDoc),
          set: jest.fn(),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ROLE');
    });

    it('should return 409 for existing patient profile', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'existing-patient-uid',
          ...mockPatientData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingPatient = {
        exists: true,
        data: () => mockPatientData,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn((docId: string) => ({
          get: jest.fn().mockResolvedValue(
            docId === 'existing-patient-uid' ? mockUserDoc : mockExistingPatient
          ),
          set: jest.fn(),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PATIENT_PROFILE_EXISTS');
    });

    it('should return 400 for invalid patient data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'patient-uid-123',
          // Missing required fields
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database error', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'patient-uid-123',
          ...mockPatientData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingPatient = {
        exists: false,
        data: () => null,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn((docId: string) => ({
          get: jest.fn().mockResolvedValue(
            docId === 'patient-uid-123' ? mockUserDoc : mockExistingPatient
          ),
          set: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CREATE_PATIENT_FAILED');
    });
  });
}); 