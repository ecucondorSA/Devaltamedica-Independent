// @ts-ignore
// @ts-ignore
// @ts-ignore
import { jest } from '@jest/globals';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock Firebase Admin
const mockAdminAuth = {
  verifyIdToken: async (token: string) => ({
    uid: 'demo-user',
    email: 'demo@altamedica.com',
    role: 'doctor'
  }),
  createCustomToken: async (uid: string) => 'mock-token'
};

const mockAdminDb = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: () => Promise.resolve({
        exists: true,
        data: () => ({ id })
      }),
      set: (data: any) => Promise.resolve({ id }),
      update: (data: any) => Promise.resolve({ id }),
      delete: () => Promise.resolve({ id })
    }),
    add: (data: any) => Promise.resolve({ id: 'generated-id' }),
    where: () => ({
      get: () => Promise.resolve({
        docs: [
          {
            id: 'test-doc',
            data: () => ({ id: 'test-doc' })
          }
        ]
      })
    }),
    limit: () => ({
      get: () => Promise.resolve({
        docs: []
      })
    })
  }),
  doc: (path: string) => ({
    get: () => Promise.resolve({
      exists: true,
      data: () => ({ id: path })
    }),
    set: (data: any) => Promise.resolve({ id: path }),
    update: (data: any) => Promise.resolve({ id: path }),
    delete: () => Promise.resolve({ id: path })
  })
};

const mockFirebaseAdmin = {
  auth: () => mockAdminAuth,
  firestore: () => mockAdminDb
};

// Set globals
(global as any).mockAdminAuth = mockAdminAuth;
(global as any).mockAdminDb = mockAdminDb;
(global as any).mockFirebaseAdmin = mockFirebaseAdmin;

// Mock firebase-admin module
jest.unstable_mockModule('firebase-admin', () => ({
  default: mockFirebaseAdmin,
  apps: [],
  initializeApp: jest.fn(() => mockFirebaseAdmin),
  credential: {
    cert: jest.fn()
  }
}));

// Test helpers
(global as any).testHelpers = {
  makeRequest: async (endpoint: string, options: any = {}) => {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
        ...options.headers
      },
      ...options
    });
    return response.json();
  },

  createTestPatient: () => ({
    id: 'test-patient-id',
    firstName: 'Test',
    lastName: 'Patient',
    email: 'patient@test.com',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    bloodType: 'O+',
    avatar: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  createTestDoctor: () => ({
    id: 'test-doctor-id',
    firstName: 'Test',
    lastName: 'Doctor',
    email: 'doctor@test.com',
    phone: '+1234567890',
    specialties: ['cardiologia'],
    consultationFee: 100,
    avatar: null,
    isVerified: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  cleanup: async () => {
    // Cleanup test data
    logger.info('Cleaning up test data...');
  }
};

// Jest configuration
jest.setTimeout(30000);

export {};