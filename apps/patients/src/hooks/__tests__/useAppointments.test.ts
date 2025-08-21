import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { useAppointments } from '../useAppointments';

// Mock de fetch
global.fetch = jest.fn();

// Mock de useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'patient',
    },
    token: 'mock-token',
  }),
}));

describe('useAppointments Hook', () => {
  const mockAppointments = [
    {
      id: '1',
      doctorName: 'Dr. Smith',
      specialty: 'Cardiología',
      date: '2024-01-15',
      time: '10:00',
      status: 'confirmed',
      type: 'in-person',
      symptoms: 'Dolor en el pecho',
    },
    {
      id: '2',
      doctorName: 'Dr. Johnson',
      specialty: 'Dermatología',
      date: '2024-01-20',
      time: '14:30',
      status: 'pending',
      type: 'telemedicine',
      symptoms: 'Control rutinario',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.cancelAppointment).toBe('function');
      expect(typeof result.current.rescheduleAppointment).toBe('function');
    });
  });

  describe('Fetch Appointments', () => {
    it('should fetch appointments successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ appointments: mockAppointments }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith('/api/appointments', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle fetch error', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
      expect(result.current.error).toBe('Error al cargar las citas');
    });

    it('should handle API error response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
      expect(result.current.error).toBe('Error al cargar las citas');
    });

    it('should handle empty appointments response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ appointments: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Refetch Appointments', () => {
    it('should refetch appointments when called', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: [mockAppointments[0]] }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual(mockAppointments);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.appointments).toEqual([mockAppointments[0]]);
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch error', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar las citas');
      });
    });
  });

  describe('Cancel Appointment', () => {
    it('should cancel appointment successfully', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelAppointment('1');
      });

      expect(fetch).toHaveBeenCalledWith('/api/appointments/1/cancel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      });

      // Should refetch appointments after cancellation
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle cancel appointment error', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelAppointment('1');
      });

      expect(result.current.error).toBe('Error al cancelar la cita');
    });

    it('should handle cancel appointment API error', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Appointment cannot be cancelled' }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelAppointment('1');
      });

      expect(result.current.error).toBe('Error al cancelar la cita');
    });
  });

  describe('Reschedule Appointment', () => {
    it('should reschedule appointment successfully', async () => {
      const newDate = '2024-01-25';
      const newTime = '15:00';

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rescheduleAppointment('1', newDate, newTime);
      });

      expect(fetch).toHaveBeenCalledWith('/api/appointments/1/reschedule', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newDate,
          newTime,
        }),
      });

      // Should refetch appointments after rescheduling
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle reschedule appointment error', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rescheduleAppointment('1', '2024-01-25', '15:00');
      });

      expect(result.current.error).toBe('Error al reprogramar la cita');
    });

    it('should validate date and time parameters', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ appointments: mockAppointments }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rescheduleAppointment('1', '', '15:00');
      });

      expect(result.current.error).toBe('Fecha y hora son requeridas');
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  describe('Appointment Filtering', () => {
    it('should filter appointments by status', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ appointments: mockAppointments }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const confirmedAppointments = result.current.appointments.filter(
        apt => apt.status === 'confirmed'
      );
      expect(confirmedAppointments).toHaveLength(1);
      expect(confirmedAppointments[0].doctorName).toBe('Dr. Smith');

      const pendingAppointments = result.current.appointments.filter(
        apt => apt.status === 'pending'
      );
      expect(pendingAppointments).toHaveLength(1);
      expect(pendingAppointments[0].doctorName).toBe('Dr. Johnson');
    });

    it('should filter appointments by type', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ appointments: mockAppointments }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const inPersonAppointments = result.current.appointments.filter(
        apt => apt.type === 'in-person'
      );
      expect(inPersonAppointments).toHaveLength(1);

      const telemedicineAppointments = result.current.appointments.filter(
        apt => apt.type === 'telemedicine'
      );
      expect(telemedicineAppointments).toHaveLength(1);
    });
  });

  describe('Loading States', () => {
    it('should show loading during initial fetch', () => {
      (fetch as any).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAppointments());

      expect(result.current.loading).toBe(true);
      expect(result.current.appointments).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should show loading during refetch', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should clear error on successful refetch', async () => {
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar las citas');
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.appointments).toEqual(mockAppointments);
      });
    });
  });
}); 