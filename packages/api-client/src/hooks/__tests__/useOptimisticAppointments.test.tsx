/**
 * 🧪 TESTS - OPTIMISTIC APPOINTMENT HOOKS
 * Tests para actualizaciones optimistas
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useOptimisticCreateAppointment,
  useOptimisticCancelAppointment,
  useOptimisticRescheduleAppointment,
} from '../optimistic/useOptimisticAppointments';
import { createApiClient } from '../../client';

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../client', () => ({
  getApiClient: vi.fn(() => ({
    post: vi.fn(),
    put: vi.fn(),
  })),
  createApiClient: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Pre-populate cache with appointments
  queryClient.setQueryData(['appointments'], {
    data: [
      {
        id: '1',
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        date: '2024-01-15',
        time: '10:00',
        status: 'scheduled',
        reason: 'Checkup',
      },
    ],
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useOptimisticCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear cita optimistamente y luego sincronizar', async () => {
    const realAppointment = {
      id: 'real-123',
      patientId: 'patient-123',
      doctorId: 'doctor-789',
      date: '2024-02-01',
      time: '14:00',
      status: 'scheduled',
      reason: 'New appointment',
    };

    const mockApiClient = {
      post: vi.fn().mockResolvedValue(realAppointment),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Initial state
    queryClient.setQueryData(['appointments'], {
      data: [
        {
          id: '1',
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled',
        },
      ],
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticCreateAppointment(),
      { wrapper }
    );

    const newAppointmentData = {
      patientId: 'patient-123',
      doctorId: 'doctor-789',
      date: '2024-02-01',
      time: '14:00',
      type: 'consultation' as const,
      reason: 'New appointment',
    };

    // Act
    await act(async () => {
      await result.current.mutateAsync(newAppointmentData);
    });

    // Verify optimistic update happened
    const cacheData = queryClient.getQueryData(['appointments']) as any;
    expect(cacheData.data).toHaveLength(2);
    
    // The real appointment should replace the optimistic one
    expect(cacheData.data.find((apt: any) => apt.id === 'real-123')).toBeTruthy();
    expect(cacheData.data.find((apt: any) => apt.id.startsWith('temp-'))).toBeFalsy();

    // Verify API was called
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments',
      newAppointmentData
    );
  });

  it('debe hacer rollback si la creación falla', async () => {
    const mockError = new Error('Server error');
    const mockApiClient = {
      post: vi.fn().mockRejectedValue(mockError),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const initialData = {
      data: [
        {
          id: '1',
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled',
        },
      ],
    };

    queryClient.setQueryData(['appointments'], initialData);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticCreateAppointment(),
      { wrapper }
    );

    // Act
    await act(async () => {
      try {
        await result.current.mutateAsync({
          patientId: 'patient-123',
          doctorId: 'doctor-789',
          date: '2024-02-01',
          time: '14:00',
          type: 'consultation',
          reason: 'Will fail',
        });
      } catch (error) {
        // Expected error
      }
    });

    // Verify rollback - should have original data only
    const cacheData = queryClient.getQueryData(['appointments']) as any;
    expect(cacheData).toEqual(initialData);
    expect(cacheData.data).toHaveLength(1);
  });
});

describe('useOptimisticCancelAppointment', () => {
  it('debe cancelar optimistamente y sincronizar', async () => {
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    
    queryClient.setQueryData(['appointments'], {
      data: [
        {
          id: 'apt-123',
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled',
          reason: 'Checkup',
        },
      ],
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticCancelAppointment(),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: 'apt-123',
        reason: 'Cannot attend',
      });
    });

    // Verify optimistic update
    const cacheData = queryClient.getQueryData(['appointments']) as any;
    expect(cacheData.data[0].status).toBe('cancelled');
    expect(cacheData.data[0].cancelReason).toBe('Cannot attend');

    // Verify API call
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments/apt-123/cancel',
      { reason: 'Cannot attend' }
    );
  });

  it('debe hacer rollback si la cancelación falla', async () => {
    const mockApiClient = {
      post: vi.fn().mockRejectedValue(new Error('Cannot cancel')),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    
    const originalData = {
      data: [
        {
          id: 'apt-123',
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled',
          reason: 'Checkup',
        },
      ],
    };

    queryClient.setQueryData(['appointments'], originalData);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticCancelAppointment(),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'apt-123',
          reason: 'Will fail',
        });
      } catch (error) {
        // Expected error
      }
    });

    // Verify rollback
    const cacheData = queryClient.getQueryData(['appointments']) as any;
    expect(cacheData.data[0].status).toBe('scheduled'); // Original status
    expect(cacheData.data[0].cancelReason).toBeUndefined();
  });
});

describe('useOptimisticRescheduleAppointment', () => {
  it('debe reprogramar optimistamente', async () => {
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({
        id: 'apt-123',
        date: '2024-02-15',
        time: '16:00',
        status: 'rescheduled',
      }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    
    queryClient.setQueryData(['appointments'], {
      data: [
        {
          id: 'apt-123',
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled',
        },
      ],
    });

    queryClient.setQueryData(['appointments', 'apt-123'], {
      id: 'apt-123',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      date: '2024-01-15',
      time: '10:00',
      status: 'scheduled',
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticRescheduleAppointment(),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: 'apt-123',
        newDate: '2024-02-15',
        newTime: '16:00',
      });
    });

    // Verify optimistic updates in both caches
    const listCache = queryClient.getQueryData(['appointments']) as any;
    expect(listCache.data[0].date).toBe('2024-02-15');
    expect(listCache.data[0].time).toBe('16:00');
    expect(listCache.data[0].rescheduled).toBe(true);

    const detailCache = queryClient.getQueryData(['appointments', 'apt-123']) as any;
    expect(detailCache.date).toBe('2024-02-15');
    expect(detailCache.time).toBe('16:00');

    // Verify API call
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments/apt-123/reschedule',
      { date: '2024-02-15', time: '16:00' }
    );
  });
});