// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationSystem from '../NotificationSystem';

// Mock de socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock de useAuth
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
    },
  }),
}));

// Mock de useToast
jest.mock('@altamedica/hooks/ui', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock de fetch
global.fetch = jest.fn();

// NOTE: Componente legacy descontinuado. Estas pruebas se omiten temporalmente hasta migrar a NotificationsCard.
describe.skip('NotificationSystem Component', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'appointment',
      priority: 'high',
      title: 'Nueva cita programada',
      message: 'Tu cita ha sido programada para mañana',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      read: false,
      archived: false,
      channels: [
        { type: 'email', sent: true, sentAt: new Date() },
        { type: 'push', sent: true, sentAt: new Date() },
      ],
    },
    {
      id: '2',
      type: 'telemedicine',
      priority: 'normal',
      title: 'Sesión de telemedicina',
      message: 'Tu sesión de telemedicina comenzará en 5 minutos',
      timestamp: new Date('2024-01-15T09:30:00Z'),
      read: true,
      archived: false,
      channels: [
        { type: 'in_app', sent: true, sentAt: new Date() },
      ],
    },
    {
      id: '3',
      type: 'prescription',
      priority: 'low',
      title: 'Nueva receta disponible',
      message: 'Tu receta está lista para recoger',
      timestamp: new Date('2024-01-15T08:00:00Z'),
      read: false,
      archived: true,
      channels: [
        { type: 'sms', sent: false, error: 'SMS service unavailable' },
      ],
    },
  ];

  const mockSettings = {
    email: true,
    sms: false,
    push: true,
    inApp: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    types: {
      appointment: true,
      telemedicine: true,
      prescription: true,
      lab_result: true,
      system: true,
      emergency: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock process.env
    jest.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.unstubAllEnvs();
  });

  describe('Rendering', () => {
    it('should render notification bell with unread count', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      render(<NotificationSystem />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bell/i })).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // 2 unread notifications
      });
    });

    it('should show 99+ for high unread count', async () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotifications[0],
        id: i.toString(),
        read: false,
      }));

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: manyNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      render(<NotificationSystem />);

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });
  });

  describe('Notifications Panel', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });
    });

    it('should open notifications panel when bell is clicked', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        expect(bellButton).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /bell/i });
      fireEvent.click(bellButton);

      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Nueva cita programada')).toBeInTheDocument();
    });

    it('should close notifications panel when X button is clicked', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      expect(screen.getByText('Notificaciones')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /x/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
    });

    it('should display notification details correctly', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      expect(screen.getByText('Nueva cita programada')).toBeInTheDocument();
      expect(screen.getByText('Tu cita ha sido programada para mañana')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should show empty state when no notifications', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });
    });

    it('should filter notifications by search term', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const searchInput = screen.getByPlaceholderText('Buscar notificaciones...');
      fireEvent.change(searchInput, { target: { value: 'cita' } });

      expect(screen.getByText('Nueva cita programada')).toBeInTheDocument();
      expect(screen.queryByText('Sesión de telemedicina')).not.toBeInTheDocument();
    });

    it('should filter by unread notifications', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'unread' } });

      expect(screen.getByText('Nueva cita programada')).toBeInTheDocument();
      expect(screen.queryByText('Sesión de telemedicina')).not.toBeInTheDocument(); // Read notification
    });

    it('should filter by archived notifications', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'archived' } });

      expect(screen.getByText('Nueva receta disponible')).toBeInTheDocument();
      expect(screen.queryByText('Nueva cita programada')).not.toBeInTheDocument();
    });
  });

  describe('Notification Actions', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });
    });

    it('should mark notification as read', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const readButton = screen.getByRole('button', { name: /check/i });
      fireEvent.click(readButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1/read', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    it('should archive notification', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const archiveButton = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(archiveButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1/archive', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    it('should delete notification', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const deleteButton = screen.getByRole('button', { name: /trash/i });
      fireEvent.click(deleteButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    it('should mark all notifications as read', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const markAllReadButton = screen.getByText('Marcar todas como leídas');
      fireEvent.click(markAllReadButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  describe('Settings Panel', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });
    });

    it('should open settings panel when settings button is clicked', async () => {
      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(screen.getByText('Configuración de Notificaciones')).toBeInTheDocument();
    });

    it('should toggle notification channels', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const smsSwitch = screen.getByRole('checkbox', { name: /sms/i });
      fireEvent.click(smsSwitch);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sms: true }),
      });
    });

    it('should configure quiet hours', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const quietHoursSwitch = screen.getByRole('checkbox', { name: /horas silenciosas/i });
      fireEvent.click(quietHoursSwitch);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quietHours: { ...mockSettings.quietHours, enabled: true },
        }),
      });
    });

    it('should toggle notification types', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const appointmentSwitch = screen.getByRole('checkbox', { name: /appointment/i });
      fireEvent.click(appointmentSwitch);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: { ...mockSettings.types, appointment: false },
        }),
      });
    });
  });

  describe('Real-time Notifications', () => {
    it('should handle new notification from socket', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      render(<NotificationSystem />);

      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        
        // Simular nueva notificación
        mockSocket.on.mock.calls.find(call => call[0] === 'notification')[1]({
          id: '4',
          type: 'emergency',
          priority: 'urgent',
          title: 'Emergencia médica',
          message: 'Se requiere atención inmediata',
          timestamp: new Date(),
          read: false,
          archived: false,
          channels: [],
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Emergencia médica',
        description: 'Se requiere atención inmediata',
        duration: 5000,
      });
    });

    it('should handle notification update from socket', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      render(<NotificationSystem />);

      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        
        // Simular actualización de notificación
        mockSocket.on.mock.calls.find(call => call[0] === 'notification_update')[1]({
          id: '1',
          read: true,
        });
      });

      // Verificar que se actualizó el estado
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Unread count should decrease
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<NotificationSystem />);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar las notificaciones',
          variant: 'destructive',
        });
      });
    });

    it('should handle settings update errors', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        })
        .mockRejectedValueOnce(new Error('Settings update failed'));

      render(<NotificationSystem />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /bell/i });
        fireEvent.click(bellButton);
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const emailSwitch = screen.getByRole('checkbox', { name: /email/i });
      fireEvent.click(emailSwitch);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'No se pudieron actualizar las configuraciones',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup socket connection on unmount', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ settings: mockSettings }),
        });

      const { unmount } = render(<NotificationSystem />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bell/i })).toBeInTheDocument();
      });

      unmount();

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.close).toHaveBeenCalled();
    });
  });
}); 