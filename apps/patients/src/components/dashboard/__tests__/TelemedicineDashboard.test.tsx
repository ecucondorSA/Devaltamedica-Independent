import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import TelemedicineDashboard from '../TelemedicineDashboard';

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

describe('TelemedicineDashboard Component', () => {
  const mockStats = {
    activeSessions: 5,
    totalSessions: 25,
    averageDuration: 45,
    participantsOnline: 12,
    connectionQuality: {
      excellent: 75,
      good: 20,
      poor: 5,
    },
    sessionsByType: {
      consultation: 15,
      follow_up: 8,
      emergency: 2,
    },
    systemHealth: {
      status: 'healthy',
      cpu: 35,
      memory: 45,
      network: 15,
    },
  };

  const mockSessions = [
    {
      id: '1',
      roomId: 'room-1',
      patientName: 'John Doe',
      doctorName: 'Dr. Smith',
      startTime: new Date('2024-01-15T10:00:00Z'),
      duration: 30,
      status: 'active',
      participants: 2,
      connectionQuality: 'excellent',
    },
    {
      id: '2',
      roomId: 'room-2',
      patientName: 'Jane Smith',
      doctorName: 'Dr. Johnson',
      startTime: new Date('2024-01-15T11:00:00Z'),
      duration: 45,
      status: 'active',
      participants: 2,
      connectionQuality: 'good',
    },
  ];

  const mockNotifications = [
    {
      id: '1',
      type: 'info',
      title: 'Sistema actualizado',
      message: 'El sistema ha sido actualizado exitosamente',
      timestamp: new Date('2024-01-15T09:00:00Z'),
      read: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Alta latencia detectada',
      message: 'Se detectó alta latencia en algunas sesiones',
      timestamp: new Date('2024-01-15T08:30:00Z'),
      read: true,
    },
  ];

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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<TelemedicineDashboard />);
      
      expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();
    });

    it('should render dashboard with data after loading', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard de Telemedicina')).toBeInTheDocument();
      });

      expect(screen.getByText('5')).toBeInTheDocument(); // Active sessions
      expect(screen.getByText('12')).toBeInTheDocument(); // Participants online
      expect(screen.getByText('45m')).toBeInTheDocument(); // Average duration
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar las estadísticas del dashboard',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Key Metrics Display', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display active sessions count', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('25 totales hoy')).toBeInTheDocument();
      });
    });

    it('should display participants online', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('En sesiones activas')).toBeInTheDocument();
      });
    });

    it('should display average duration', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('45m')).toBeInTheDocument();
        expect(screen.getByText('Por sesión')).toBeInTheDocument();
      });
    });

    it('should display connection quality', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('Excelente')).toBeInTheDocument();
      });
    });
  });

  describe('System Health', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display system health metrics', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('35%')).toBeInTheDocument(); // CPU
        expect(screen.getByText('45%')).toBeInTheDocument(); // Memory
        expect(screen.getByText('15%')).toBeInTheDocument(); // Network
      });
    });

    it('should display correct system status', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('healthy')).toBeInTheDocument();
      });
    });

    it('should display degraded status when metrics are high', async () => {
      const degradedStats = {
        ...mockStats,
        systemHealth: {
          status: 'degraded',
          cpu: 75,
          memory: 80,
          network: 60,
        },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => degradedStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('degraded')).toBeInTheDocument();
      });
    });
  });

  describe('Active Sessions', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display active sessions list', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe - Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith - Dr. Johnson')).toBeInTheDocument();
      });
    });

    it('should display session details correctly', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('2 participantes')).toBeInTheDocument();
        expect(screen.getByText('excellent')).toBeInTheDocument();
        expect(screen.getByText('good')).toBeInTheDocument();
      });
    });

    it('should show empty state when no active sessions', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No hay sesiones activas')).toBeInTheDocument();
      });
    });
  });

  describe('Charts and Analytics', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display sessions by type', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Consultations
        expect(screen.getByText('8')).toBeInTheDocument(); // Follow ups
        expect(screen.getByText('2')).toBeInTheDocument(); // Emergencies
      });
    });

    it('should display connection quality distribution', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument(); // Excellent
        expect(screen.getByText('20%')).toBeInTheDocument(); // Good
        expect(screen.getByText('5%')).toBeInTheDocument(); // Poor
      });
    });
  });

  describe('Recent Notifications', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display notifications list', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sistema actualizado')).toBeInTheDocument();
        expect(screen.getByText('Alta latencia detectada')).toBeInTheDocument();
      });
    });

    it('should show notification details', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('El sistema ha sido actualizado exitosamente')).toBeInTheDocument();
        expect(screen.getByText('Se detectó alta latencia en algunas sesiones')).toBeInTheDocument();
      });
    });

    it('should show empty state when no notifications', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: [] }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No hay notificaciones recientes')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    it('should auto-refresh data every 30 seconds', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockStats, activeSessions: 6 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Initial value
      });

      // Avanzar 30 segundos
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument(); // Updated value
      });

      expect(global.fetch).toHaveBeenCalledTimes(6); // 3 initial + 3 refresh
    });
  });

  describe('Manual Refresh', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard de Telemedicina')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /actualizar/i });
      fireEvent.click(refreshButton);

      expect(global.fetch).toHaveBeenCalledTimes(6); // 3 initial + 3 manual refresh
    });
  });

  describe('Last Updated Display', () => {
    beforeEach(async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });
    });

    it('should display last updated time', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockDate);

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Última actualización:/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Error States', () => {
    it('should handle stats fetch error', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Stats fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar las estadísticas del dashboard',
          variant: 'destructive',
        });
      });
    });

    it('should handle sessions fetch error', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockRejectedValueOnce(new Error('Sessions fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar las estadísticas del dashboard',
          variant: 'destructive',
        });
      });
    });

    it('should handle notifications fetch error', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockRejectedValueOnce(new Error('Notifications fetch failed'));

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar las estadísticas del dashboard',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Utility Functions', () => {
    it('should format duration correctly', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('45m')).toBeInTheDocument(); // 45 minutes
      });
    });

    it('should format duration with hours correctly', async () => {
      const statsWithHours = {
        ...mockStats,
        averageDuration: 125, // 2 hours 5 minutes
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => statsWithHours,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('2h 5m')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup interval on unmount', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ notifications: mockNotifications }),
        });

      const { unmount } = render(<TelemedicineDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard de Telemedicina')).toBeInTheDocument();
      });

      unmount();

      // Verificar que no hay más llamadas después del unmount
      const initialCallCount = (global.fetch as any).mock.calls.length;
      
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect((global.fetch as any).mock.calls.length).toBe(initialCallCount);
    });
  });
}); 