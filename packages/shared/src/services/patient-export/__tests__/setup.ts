/**
 * Test Setup for Patient Export Services
 * Configures test environment and mocks
 */

import { vi, beforeEach } from 'vitest';

// Global test environment setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Setup default environment variables for testing
  process.env.PATIENT_EXPORT_ENABLED = 'true';
  process.env.PATIENT_EXPORT_USE_MOCKS = 'true';
  process.env.NODE_ENV = 'test';
  process.env.EXPORT_INCLUDE_TECHNICAL_DATA = 'false';
  process.env.EXPORT_INCLUDE_FINANCIAL_DATA = 'true';
});

// Mock console to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock Date for consistent testing
export const MOCK_DATE = new Date('2023-06-15T10:00:00Z');

export const mockCurrentDate = () => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_DATE);
};

export const restoreDate = () => {
  vi.useRealTimers();
};

// Common test data
export const MOCK_PATIENT_ID = 'test-patient-123';
export const MOCK_PROVIDER_ID = 'test-provider-456';
export const MOCK_FACILITY_ID = 'test-facility-789';

// Firebase mock helpers
export const createMockFirestoreDoc = (data: any) => ({
  id: 'mock-doc-id',
  data: () => data,
  exists: () => true,
});

export const createMockFirestoreSnapshot = (docs: any[]) => ({
  docs,
  forEach: (callback: (doc: any) => void) => docs.forEach(callback),
  size: docs.length,
  empty: docs.length === 0,
});

// Mock Firestore timestamp
export const createMockTimestamp = (date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
});

// Test utilities
export const createMockPatientData = (overrides: Partial<any> = {}) => ({
  id: MOCK_PATIENT_ID,
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  ...overrides,
});

export const createDateRange = (daysBack: number = 30) => ({
  from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
  to: new Date(),
});

// Performance test helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    executionTime: end - start,
  };
};

// Memory usage test helpers
export const getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  return null;
};