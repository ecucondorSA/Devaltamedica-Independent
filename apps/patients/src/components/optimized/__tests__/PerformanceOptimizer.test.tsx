import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import PerformanceOptimizer from '../PerformanceOptimizer';

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
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock de performance API
Object.defineProperty(window, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
    },
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Mock de navigator.getBattery
Object.defineProperty(navigator, 'getBattery', {
  value: jest.fn(() =>
    Promise.resolve({
      level: 0.75,
      charging: false,
      addEventListener: jest.fn(),
    })
  ),
  writable: true,
});

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

describe('PerformanceOptimizer Component', () => {
  const mockMetrics = {
    fps: 60,
    memory: {
      used: 50,
      total: 100,
      percentage: 50,
    },
    network: {
      latency: 100,
      bandwidth: 1000,
      quality: 'excellent',
    },
    cpu: {
      usage: 35,
      temperature: 45,
    },
    battery: {
      level: 75,
      charging: false,
    },
    telemedicine: {
      videoQuality: 'medium',
      audioQuality: 'medium',
      connectionStability: 95,
      packetLoss: 0.5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render performance optimizer interface', () => {
      render(<PerformanceOptimizer />);

      expect(screen.getByText('Optimizador de Rendimiento')).toBeInTheDocument();
      expect(screen.getByText('Monitoreo en tiempo real')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /optimizar ahora/i })).toBeInTheDocument();
    });

    it('should display monitoring toggle switch', () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      expect(monitoringSwitch).toBeInTheDocument();
      expect(monitoringSwitch).not.toBeChecked();
    });
  });

  describe('Performance Monitoring', () => {
    it('should start monitoring when toggle is enabled', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      expect(monitoringSwitch).toBeChecked();

      // Verificar que se inició el monitoreo
      await waitFor(() => {
        expect(requestAnimationFrame).toHaveBeenCalled();
      });
    });

    it('should stop monitoring when toggle is disabled', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      
      // Habilitar monitoreo
      fireEvent.click(monitoringSwitch);
      expect(monitoringSwitch).toBeChecked();

      // Deshabilitar monitoreo
      fireEvent.click(monitoringSwitch);
      expect(monitoringSwitch).not.toBeChecked();
    });

    it('should display FPS metrics when monitoring is active', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      // Simular frame rendering
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('60')).toBeInTheDocument(); // FPS
      });
    });

    it('should display memory usage metrics', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument(); // Memory percentage
        expect(screen.getByText('50MB / 100MB')).toBeInTheDocument();
      });
    });

    it('should display network latency metrics', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        expect(screen.getByText('100ms')).toBeInTheDocument(); // Latency
        expect(screen.getByText('excellent')).toBeInTheDocument(); // Quality
      });
    });

    it('should display CPU usage metrics', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        expect(screen.getByText('35%')).toBeInTheDocument(); // CPU usage
        expect(screen.getByText('45°C')).toBeInTheDocument(); // Temperature
      });
    });
  });

  describe('Optimization Settings', () => {
    it('should display optimization settings', () => {
      render(<PerformanceOptimizer />);

      expect(screen.getByText('Optimizaciones Automáticas')).toBeInTheDocument();
      expect(screen.getByText('Carga diferida')).toBeInTheDocument();
      expect(screen.getByText('Virtualización')).toBeInTheDocument();
      expect(screen.getByText('Memoización')).toBeInTheDocument();
    });

    it('should toggle optimization settings', () => {
      render(<PerformanceOptimizer />);

      const lazyLoadingSwitch = screen.getByRole('checkbox', { name: /carga diferida/i });
      expect(lazyLoadingSwitch).toBeChecked(); // Default enabled

      fireEvent.click(lazyLoadingSwitch);
      expect(lazyLoadingSwitch).not.toBeChecked();
    });

    it('should display telemedicine settings', () => {
      render(<PerformanceOptimizer />);

      expect(screen.getByText('Configuración de Telemedicina')).toBeInTheDocument();
      expect(screen.getByText('Calidad de video')).toBeInTheDocument();
      expect(screen.getByText('Calidad de audio')).toBeInTheDocument();
    });

    it('should change video quality setting', () => {
      render(<PerformanceOptimizer />);

      const videoQualitySelect = screen.getByDisplayValue('Media (720p)');
      fireEvent.change(videoQualitySelect, { target: { value: 'high' } });

      expect(videoQualitySelect).toHaveValue('high');
    });

    it('should change audio quality setting', () => {
      render(<PerformanceOptimizer />);

      const audioQualitySelect = screen.getByDisplayValue('Media (44.1kHz)');
      fireEvent.change(audioQualitySelect, { target: { value: 'high' } });

      expect(audioQualitySelect).toHaveValue('high');
    });
  });

  describe('Manual Optimization', () => {
    it('should perform manual optimization when button is clicked', async () => {
      // Mock caches API
      Object.defineProperty(window, 'caches', {
        value: {
          keys: jest.fn(() => Promise.resolve(['cache-1', 'cache-2'])),
          delete: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
      });

      // Mock gc function
      (global as any).gc = jest.fn();

      render(<PerformanceOptimizer />);

      const optimizeButton = screen.getByRole('button', { name: /optimizar ahora/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Optimización manual completada',
          description: expect.stringContaining('optimizaciones'),
        });
      });
    });

    it('should handle optimization errors gracefully', async () => {
      // Mock error in caches API
      Object.defineProperty(window, 'caches', {
        value: {
          keys: jest.fn(() => Promise.reject(new Error('Cache error'))),
        },
        writable: true,
      });

      render(<PerformanceOptimizer />);

      const optimizeButton = screen.getByRole('button', { name: /optimizar ahora/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Optimización manual completada',
          description: expect.stringContaining('optimizaciones'),
        });
      });
    });
  });

  describe('Telemedicine Optimization', () => {
    it('should optimize telemedicine settings based on metrics', async () => {
      render(<PerformanceOptimizer />);

      const optimizeTelemedicineButton = screen.getByRole('button', { name: /optimizar telemedicina/i });
      fireEvent.click(optimizeTelemedicineButton);

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Configuración optimizada',
          description: 'Ajustes de telemedicina optimizados automáticamente',
        });
      });
    });

    it('should adjust video quality based on FPS', async () => {
      render(<PerformanceOptimizer />);

      // Simular FPS bajo
      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      // Simular FPS de 20 (bajo)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const optimizeTelemedicineButton = screen.getByRole('button', { name: /optimizar telemedicina/i });
      fireEvent.click(optimizeTelemedicineButton);

      const videoQualitySelect = screen.getByDisplayValue('Media (720p)');
      expect(videoQualitySelect).toHaveValue('low'); // Should be set to low for low FPS
    });

    it('should adjust audio quality based on latency', async () => {
      render(<PerformanceOptimizer />);

      const optimizeTelemedicineButton = screen.getByRole('button', { name: /optimizar telemedicina/i });
      fireEvent.click(optimizeTelemedicineButton);

      const audioQualitySelect = screen.getByDisplayValue('Media (44.1kHz)');
      expect(audioQualitySelect).toHaveValue('medium'); // Should be medium for current latency
    });
  });

  describe('Auto-optimization', () => {
    it('should auto-optimize when enabled', async () => {
      render(<PerformanceOptimizer />);

      // Habilitar auto-optimización
      const autoOptimizeSwitch = screen.getByRole('checkbox', { name: /optimización automática/i });
      fireEvent.click(autoOptimizeSwitch);

      // Simular métricas que requieren optimización
      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      // Avanzar 30 segundos para trigger auto-optimization
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).toHaveBeenCalledWith({
          title: 'Optimización automática',
          description: expect.stringContaining('optimizaciones'),
        });
      });
    });

    it('should not auto-optimize when disabled', async () => {
      render(<PerformanceOptimizer />);

      // Deshabilitar auto-optimización
      const autoOptimizeSwitch = screen.getByRole('checkbox', { name: /optimización automática/i });
      expect(autoOptimizeSwitch).toBeChecked(); // Default enabled
      fireEvent.click(autoOptimizeSwitch);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      // Avanzar 30 segundos
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        const { useToast } = require('../../../hooks/useToast');
        const { toast } = useToast();
        expect(toast).not.toHaveBeenCalledWith({
          title: 'Optimización automática',
          description: expect.any(String),
        });
      });
    });
  });

  describe('Optimization History', () => {
    it('should display optimization history', async () => {
      render(<PerformanceOptimizer />);

      // Realizar una optimización manual
      const optimizeButton = screen.getByRole('button', { name: /optimizar ahora/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText('Historial de Optimizaciones')).toBeInTheDocument();
      });
    });

    it('should show empty state when no optimizations', () => {
      render(<PerformanceOptimizer />);

      expect(screen.getByText('No hay optimizaciones recientes')).toBeInTheDocument();
    });

    it('should display optimization details', async () => {
      render(<PerformanceOptimizer />);

      // Realizar optimización
      const optimizeButton = screen.getByRole('button', { name: /optimizar ahora/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText(/Cache limpiado/)).toBeInTheDocument();
        expect(screen.getByText(/Garbage collection forzado/)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Configuration', () => {
    it('should show/hide advanced configuration', () => {
      render(<PerformanceOptimizer />);

      const advancedButton = screen.getByRole('button', { name: /mostrar configuración avanzada/i });
      fireEvent.click(advancedButton);

      expect(screen.getByText('Componentes Optimizados')).toBeInTheDocument();

      const hideButton = screen.getByRole('button', { name: /ocultar configuración avanzada/i });
      fireEvent.click(hideButton);

      expect(screen.queryByText('Componentes Optimizados')).not.toBeInTheDocument();
    });

    it('should display optimized components when advanced config is shown', () => {
      render(<PerformanceOptimizer />);

      const advancedButton = screen.getByRole('button', { name: /mostrar configuración avanzada/i });
      fireEvent.click(advancedButton);

      expect(screen.getByText('Telemedicina (Lazy Loaded)')).toBeInTheDocument();
      expect(screen.getByText('Dashboard (Memoized)')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should display correct status colors for healthy metrics', async () => {
      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        const statusElement = screen.getByText('healthy');
        expect(statusElement).toHaveClass('text-green-600');
      });
    });

    it('should display correct status colors for degraded metrics', async () => {
      // Mock degraded metrics
      Object.defineProperty(window, 'performance', {
        value: {
          memory: {
            usedJSHeapSize: 90000000, // 90% usage
            totalJSHeapSize: 100000000,
          },
          now: jest.fn(() => Date.now()),
        },
        writable: true,
      });

      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        const statusElement = screen.getByText('degraded');
        expect(statusElement).toHaveClass('text-yellow-600');
      });
    });

    it('should display correct status colors for unhealthy metrics', async () => {
      // Mock unhealthy metrics
      Object.defineProperty(window, 'performance', {
        value: {
          memory: {
            usedJSHeapSize: 95000000, // 95% usage
            totalJSHeapSize: 100000000,
          },
          now: jest.fn(() => Date.now()),
        },
        writable: true,
      });

      render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        const statusElement = screen.getByText('unhealthy');
        expect(statusElement).toHaveClass('text-red-600');
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup monitoring on unmount', async () => {
      const { unmount } = render(<PerformanceOptimizer />);

      const monitoringSwitch = screen.getByRole('checkbox');
      fireEvent.click(monitoringSwitch);

      await waitFor(() => {
        expect(monitoringSwitch).toBeChecked();
      });

      unmount();

      // Verificar que no hay más llamadas a requestAnimationFrame
      const initialCallCount = requestAnimationFrame.mock.calls.length;
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(requestAnimationFrame.mock.calls.length).toBe(initialCallCount);
    });
  });
}); 