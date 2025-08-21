import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../app/api/v1/doctors/route';
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

describe('Doctors API', () => {
  const mockDoctorData = {
    firstName: 'Dr. María',
    lastName: 'García',
    email: 'maria.garcia@example.com',
    specialties: ['Cardiología', 'Medicina Interna'],
    license: 'MD123456',
    bio: 'Especialista en cardiología con más de 10 años de experiencia',
    experience: 10,
    education: [
      {
        degree: 'Médico Cirujano',
        institution: 'Universidad de Madrid',
        year: 2010,
      },
    ],
    certifications: [
      {
        name: 'Cardiología Intervencionista',
        institution: 'Sociedad Española de Cardiología',
        year: 2015,
      },
    ],
    languages: ['Español', 'Inglés'],
    availability: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
    },
    consultationFee: 150,
    companyId: 'company-123',
    isVerified: true,
  };

  const mockUserData = {
    firstName: 'Dr. María',
    lastName: 'García',
    email: 'maria.garcia@example.com',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    isActive: true,
    role: 'doctor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/doctors', () => {
    it('should return doctors list with pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?page=1&limit=10',
      });

      const mockDocs = [
        {
          id: 'doctor-1',
          data: () => ({
            ...mockDoctorData,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'doctor-2',
          data: () => ({
            ...mockDoctorData,
            firstName: 'Dr. Carlos',
            lastName: 'López',
            specialties: ['Neurología'],
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
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
            exists: true,
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

    it('should filter doctors by specialty', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?specialty=Cardiología',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'doctor-1',
          data: () => ({
            ...mockDoctorData,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
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
            exists: true,
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].specialties).toContain('Cardiología');
    });

    it('should filter doctors by company', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?companyId=company-123',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'doctor-1',
          data: () => ({
            ...mockDoctorData,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
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
            exists: true,
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].companyId).toBe('company-123');
    });

    it('should filter doctors by verification status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?isVerified=true',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'doctor-1',
          data: () => ({
            ...mockDoctorData,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
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
            exists: true,
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].isVerified).toBe(true);
    });

    it('should search doctors by text', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?search=María',
      });

      const mockSnapshot = {
        size: 1,
        docs: [{
          id: 'doctor-1',
          data: () => ({
            ...mockDoctorData,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
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
            exists: true,
            data: () => mockUserData,
          }),
        })),
      } as any);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(1);
      expect(data.data[0].firstName).toBe('Dr. María');
    });

    it('should return 400 for invalid query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/doctors?specialty=invalid',
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
        url: 'http://localhost:3000/api/v1/doctors',
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
      expect(data.error.code).toBe('FETCH_DOCTORS_FAILED');
    });
  });

  describe('POST /api/v1/doctors', () => {
    it('should create new doctor profile', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'doctor-uid-123',
          ...mockDoctorData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingDoctor = {
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
            docId === 'doctor-uid-123' ? mockUserDoc : mockExistingDoctor
          ),
          set: jest.fn().mockResolvedValue(undefined),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('doctor-uid-123');
      expect(data.data.firstName).toBe('Dr. María');
      expect(data.data.lastName).toBe('García');
      expect(data.data.specialties).toContain('Cardiología');
    });

    it('should return 401 for missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          uid: 'doctor-uid-123',
          ...mockDoctorData,
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
          ...mockDoctorData,
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
          uid: 'patient-uid-123',
          ...mockDoctorData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => ({ ...mockUserData, role: 'patient' }),
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

    it('should return 409 for existing doctor profile', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'existing-doctor-uid',
          ...mockDoctorData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingDoctor = {
        exists: true,
        data: () => mockDoctorData,
      };

      jest.mocked(adminDb.collection).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
        doc: jest.fn((docId: string) => ({
          get: jest.fn().mockResolvedValue(
            docId === 'existing-doctor-uid' ? mockUserDoc : mockExistingDoctor
          ),
          set: jest.fn(),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DOCTOR_PROFILE_EXISTS');
    });

    it('should return 400 for invalid doctor data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-token',
        },
        body: {
          uid: 'doctor-uid-123',
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
          uid: 'doctor-uid-123',
          ...mockDoctorData,
        },
      });

      const mockUserDoc = {
        exists: true,
        data: () => mockUserData,
      };

      const mockExistingDoctor = {
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
            docId === 'doctor-uid-123' ? mockUserDoc : mockExistingDoctor
          ),
          set: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      } as any);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CREATE_DOCTOR_FAILED');
    });
  });
}); 