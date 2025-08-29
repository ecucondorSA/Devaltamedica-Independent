/**
 * 🧪 TESTS - APPOINTMENT HOOKS
 * Tests para hooks de gestión de citas
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useAppointments,
  useCreateAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
  useAvailableSlots,
} from '../useAppointments';
import { createApiClient } from '../../client';

// Mock del cliente API
vi.mock('../../client', () => ({
  getApiClient: vi.fn(() => ({
    get: vi.fn(),
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

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAppointments', () => {
  const mockAppointments = [
    {
      id: '1',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      date: '2024-01-15',
      time: '10:00',
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
      reason: 'Checkup',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      patientId: 'patient-123',
      doctorId: 'doctor-789',
      date: '2024-01-20',
      time: '14:00',
      duration: 45,
      type: 'follow-up',
      status: 'confirmed',
      reason: 'Follow-up visit',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe obtener lista de citas', async () => {
    const mockResponse = {
      data: mockAppointments,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    const mockApiClient = {
      get: vi.fn().mockResolvedValue(mockResponse),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(
      () => useAppointments({ status: 'scheduled' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/appointments',
      { params: { status: 'scheduled' } }
    );

    expect(result.current.data).toEqual(mockResponse);
  });

  it('debe manejar filtros correctamente', async () => {
    const mockApiClient = {
      get: vi.fn().mockResolvedValue({ data: [], pagination: {} }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const filters = {
      status: 'completed' as const,
      doctorId: 'doctor-123',
      date: '2024-01-15',
    };

    const { result } = renderHook(
      () => useAppointments(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/appointments',
      { params: filters }
    );
  });
});

describe('useCreateAppointment', () => {
  it('debe crear una nueva cita', async () => {
    const newAppointment = {
      id: '3',
      patientId: 'patient-123',
      doctorId: 'doctor-999',
      date: '2024-02-01',
      time: '09:00',
      duration: 30,
      type: 'consultation' as const,
      status: 'scheduled' as const,
      reason: 'New consultation',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };

    const mockApiClient = {
      post: vi.fn().mockResolvedValue(newAppointment),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateAppointment(), { wrapper });

    const appointmentData = {
      patientId: 'patient-123',
      doctorId: 'doctor-999',
      date: '2024-02-01',
      time: '09:00',
      duration: 30,
      type: 'consultation' as const,
      reason: 'New consultation',
    };

    await act(async () => {
      await result.current.mutateAsync(appointmentData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments',
      appointmentData
    );

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(newAppointment);
    
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['appointments'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['doctors'],
    });
  });

  it('debe manejar errores de validación', async () => {
    const validationError = {
      statusCode: 422,
      message: 'Validation failed',
      errors: [
        { field: 'date', message: 'Date is required' },
        { field: 'time', message: 'Invalid time format' },
      ],
    };

    const mockApiClient = {
      post: vi.fn().mockRejectedValue(validationError),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          patientId: 'patient-123',
          doctorId: 'doctor-999',
          date: '',
          time: 'invalid',
          type: 'consultation',
          reason: 'Test',
        });
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(validationError);
  });
});

describe('useCancelAppointment', () => {
  it('debe cancelar una cita', async () => {
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'appointment-123',
        reason: 'Personal reasons',
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments/appointment-123/cancel',
      { reason: 'Personal reasons' }
    );

    expect(result.current.isSuccess).toBe(true);
    
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['appointments'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['appointments', 'appointment-123'],
    });
  });
});

describe('useRescheduleAppointment', () => {
  it('debe reprogramar una cita', async () => {
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({
        id: 'appointment-123',
        date: '2024-02-15',
        time: '11:00',
        status: 'rescheduled',
      }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useRescheduleAppointment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'appointment-123',
        date: '2024-02-15',
        time: '11:00',
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/appointments/appointment-123/reschedule',
      { date: '2024-02-15', time: '11:00' }
    );

    expect(result.current.isSuccess).toBe(true);
  });
});

describe('useAvailableSlots', () => {
  it('debe obtener slots disponibles', async () => {
    const mockSlots = {
      slots: [
        { time: '09:00', available: true },
        { time: '09:30', available: true },
        { time: '10:00', available: false },
        { time: '10:30', available: true },
        { time: '11:00', available: true },
      ],
    };

    const mockApiClient = {
      get: vi.fn().mockResolvedValue(mockSlots),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(
      () => useAvailableSlots({
        doctorId: 'doctor-123',
        date: '2024-01-20',
        duration: 30,
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/appointments/slots',
      {
        params: {
          doctorId: 'doctor-123',
          date: '2024-01-20',
          duration: 30,
        },
      }
    );

    expect(result.current.data).toEqual(mockSlots);
  });

  it('debe ser deshabilitado sin parámetros', () => {
    const mockApiClient = {
      get: vi.fn(),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(
      () => useAvailableSlots({ doctorId: '', date: '' }),
      { wrapper: createWrapper() }
    );

    // No debe hacer la llamada si falta doctorId o date
    expect(mockApiClient.get).not.toHaveBeenCalled();
    expect(result.current.isIdle).toBe(true);
  });
});

describe('Integration: Appointment Flow', () => {
  it('debe completar flujo de creación y cancelación', async () => {
    const mockApiClient = {
      post: vi.fn(),
      get: vi.fn(),
    };

    // Mock create response
    mockApiClient.post.mockResolvedValueOnce({
      id: 'new-appointment',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      date: '2024-03-01',
      time: '15:00',
      type: 'consultation',
      status: 'scheduled',
      reason: 'Integration test',
    });

    // Mock cancel response
    mockApiClient.post.mockResolvedValueOnce({ success: true });

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const wrapper = createWrapper();

    // Step 1: Create appointment
    const { result: createResult } = renderHook(
      () => useCreateAppointment(),
      { wrapper }
    );

    await act(async () => {
      await createResult.current.mutateAsync({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        date: '2024-03-01',
        time: '15:00',
        type: 'consultation',
        reason: 'Integration test',
      });
    });

    expect(createResult.current.isSuccess).toBe(true);
    const appointmentId = createResult.current.data?.id;

    // Step 2: Cancel appointment
    const { result: cancelResult } = renderHook(
      () => useCancelAppointment(),
      { wrapper }
    );

    await act(async () => {
      await cancelResult.current.mutateAsync({
        id: appointmentId!,
        reason: 'Test cancellation',
      });
    });

    expect(cancelResult.current.isSuccess).toBe(true);
    
    // Verify both calls were made
    expect(mockApiClient.post).toHaveBeenCalledTimes(2);
  });
});