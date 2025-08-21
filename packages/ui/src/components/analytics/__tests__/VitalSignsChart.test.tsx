// 🧪 TESTS UNITARIOS: VitalSignsChart - Componente Médico Crítico
// Tests para asegurar seguridad del paciente y precisión médica

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VitalSignsChart, VitalSignDataPoint, VitalSignMetric } from '../VitalSignsChart';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// 🔧 MOCKS
const mockOnAlertTriggered = vi.fn();
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    roundRect: vi.fn()
  })),
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 400,
    left: 0,
    top: 0
  }))
};

// Mock HTMLCanvasElement
beforeEach(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockCanvas.getContext,
    writable: true
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    value: mockCanvas.getBoundingClientRect,
    writable: true
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    writable: true
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// 📊 DATOS DE PRUEBA MÉDICOS
const normalVitalSigns: VitalSignDataPoint[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.5,
    oxygenSaturation: 98,
    respiratoryRate: 16
  },
  {
    timestamp: new Date('2024-01-01T10:05:00Z'),
    heartRate: 75,
    bloodPressure: { systolic: 118, diastolic: 82 },
    temperature: 36.6,
    oxygenSaturation: 97,
    respiratoryRate: 15
  }
];

const criticalVitalSigns: VitalSignDataPoint[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    heartRate: 180, // Crítico: >150
    bloodPressure: { systolic: 200, diastolic: 110 }, // Crítico: >180
    temperature: 40.5, // Crítico: >40
    oxygenSaturation: 82, // Crítico: <85
    respiratoryRate: 35 // Crítico: >30
  }
];

const pediatricVitalSigns: VitalSignDataPoint[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    heartRate: 95, // Normal para niños
    bloodPressure: { systolic: 95, diastolic: 60 },
    temperature: 36.8,
    oxygenSaturation: 99,
    respiratoryRate: 22 // Normal para niños
  }
];

describe('🏥 VitalSignsChart - Componente Médico Crítico', () => {
  
  describe('✅ Renderizado y Props Básicos', () => {
    
    it('debe renderizar sin errores con datos válidos', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
          onAlertTriggered={mockOnAlertTriggered}
        />
      );
      
      expect(screen.getByText('Monitoreo de Signos Vitales')).toBeInTheDocument();
      expect(screen.getByText('Últimas 24h - 2 mediciones')).toBeInTheDocument();
    });

    it('debe mostrar todas las métricas por defecto', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
        />
      );
      
      expect(screen.getByText('Frecuencia Cardíaca')).toBeInTheDocument();
      expect(screen.getByText('Presión Arterial')).toBeInTheDocument();
      expect(screen.getByText('Temperatura')).toBeInTheDocument();
      expect(screen.getByText('Saturación O₂')).toBeInTheDocument();
    });

    it('debe aplicar className personalizada', () => {
      const { container } = render(
        <VitalSignsChart 
          data={normalVitalSigns}
          className="test-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('🚨 Sistema de Alertas Médicas (Crítico)', () => {
    
    it('debe detectar y disparar alertas para valores críticos', async () => {
      render(
        <VitalSignsChart 
          data={criticalVitalSigns}
          onAlertTriggered={mockOnAlertTriggered}
          showAlerts={true}
        />
      );
      
      await waitFor(() => {
        // Verificar que se llamó la función de alerta para cada valor crítico
        expect(mockOnAlertTriggered).toHaveBeenCalledWith('heartRate', 180);
        expect(mockOnAlertTriggered).toHaveBeenCalledWith('bloodPressure', 200);
        expect(mockOnAlertTriggered).toHaveBeenCalledWith('temperature', 40.5);
        expect(mockOnAlertTriggered).toHaveBeenCalledWith('oxygenSaturation', 82);
        expect(mockOnAlertTriggered).toHaveBeenCalledWith('respiratoryRate', 35);
      });
    });

    it('debe mostrar alertas visuales para valores fuera de rango', () => {
      render(
        <VitalSignsChart 
          data={criticalVitalSigns}
          showAlerts={true}
        />
      );
      
      expect(screen.getByText('Alertas Activas')).toBeInTheDocument();
      expect(screen.getByText(/Frecuencia Cardíaca fuera del rango normal/)).toBeInTheDocument();
      expect(screen.getByText(/Presión Arterial fuera del rango normal/)).toBeInTheDocument();
    });

    it('debe aplicar estilos de alerta (animación pulse) a tarjetas críticas', () => {
      render(
        <VitalSignsChart 
          data={criticalVitalSigns}
          showAlerts={true}
        />
      );
      
      // Buscar elementos con clase de alerta
      const alertElements = screen.getAllByText(/^\d+/);
      const criticalElement = alertElements.find(el => 
        el.closest('.animate-pulse') !== null
      );
      expect(criticalElement).toBeTruthy();
    });

    it('NO debe disparar alertas cuando showAlerts=false', () => {
      render(
        <VitalSignsChart 
          data={criticalVitalSigns}
          onAlertTriggered={mockOnAlertTriggered}
          showAlerts={false}
        />
      );
      
      expect(mockOnAlertTriggered).not.toHaveBeenCalled();
    });
  });

  describe('📈 Cálculo de Tendencias', () => {
    
    it('debe calcular tendencia ascendente correctamente', () => {
      const trendingUpData: VitalSignDataPoint[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z'), heartRate: 60 },
        { timestamp: new Date('2024-01-01T10:05:00Z'), heartRate: 70 },
        { timestamp: new Date('2024-01-01T10:10:00Z'), heartRate: 80 },
        { timestamp: new Date('2024-01-01T10:15:00Z'), heartRate: 90 }
      ];

      render(
        <VitalSignsChart 
          data={trendingUpData}
          showTrends={true}
        />
      );

      // Buscar iconos de tendencia ascendente
      const trendUpIcons = screen.getAllByTestId ? 
        screen.queryAllByTestId('trending-up-icon') : 
        document.querySelectorAll('[data-lucide="trending-up"]');
      
      expect(trendUpIcons.length).toBeGreaterThan(0);
    });

    it('debe mostrar tendencia estable para cambios menores al 5%', () => {
      const stableTrendData: VitalSignDataPoint[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z'), heartRate: 72 },
        { timestamp: new Date('2024-01-01T10:05:00Z'), heartRate: 73 },
        { timestamp: new Date('2024-01-01T10:10:00Z'), heartRate: 74 },
        { timestamp: new Date('2024-01-01T10:15:00Z'), heartRate: 75 }
      ];

      render(
        <VitalSignsChart 
          data={stableTrendData}
          showTrends={true}
        />
      );

      // Para tendencia estable, debe mostrar círculo gris
      const stableElements = document.querySelectorAll('.bg-gray-400.rounded-full');
      expect(stableElements.length).toBeGreaterThan(0);
    });
  });

  describe('⏰ Rangos de Tiempo', () => {
    
    it('debe filtrar datos correctamente por rango de tiempo', () => {
      const oldData = new Date('2024-01-01T00:00:00Z');
      const recentData = new Date();
      
      const mixedTimeData: VitalSignDataPoint[] = [
        { timestamp: oldData, heartRate: 70 },
        { timestamp: recentData, heartRate: 75 }
      ];

      render(
        <VitalSignsChart 
          data={mixedTimeData}
          timeRange="1h"
        />
      );

      // Solo debe mostrar datos recientes (1 medición)
      expect(screen.getByText(/1 mediciones/)).toBeInTheDocument();
    });

    it('debe actualizar datos cuando cambia el rango de tiempo', () => {
      const { rerender } = render(
        <VitalSignsChart 
          data={normalVitalSigns}
          timeRange="1h"
        />
      );

      expect(screen.getByText('Últimas 1h')).toBeInTheDocument();

      rerender(
        <VitalSignsChart 
          data={normalVitalSigns}
          timeRange="7d"
        />
      );

      expect(screen.getByText('Últimas 7d')).toBeInTheDocument();
    });
  });

  describe('📊 Validación de Datos Médicos', () => {
    
    it('debe manejar datos faltantes sin errores', () => {
      const incompleteData: VitalSignDataPoint[] = [
        {
          timestamp: new Date(),
          heartRate: 75,
          // Faltan otros campos
        }
      ];

      expect(() => {
        render(
          <VitalSignsChart 
            data={incompleteData}
          />
        );
      }).not.toThrow();
    });

    it('debe validar rangos normales para adultos', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
          showNormalRanges={true}
        />
      );

      // Los datos normales no deben generar alertas
      expect(screen.queryByText('Alertas Activas')).not.toBeInTheDocument();
    });

    it('debe adaptarse a valores pediátricos cuando se especifica edad', () => {
      render(
        <VitalSignsChart 
          data={pediatricVitalSigns}
          patientAge={8}
          showAlerts={true}
        />
      );

      // Valores que serían anormales en adultos pero normales en niños
      expect(screen.queryByText('Alertas Activas')).not.toBeInTheDocument();
    });
  });

  describe('🎮 Interacciones de Usuario', () => {
    
    it('debe permitir zoom in/out', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
          enableZoom={true}
        />
      );

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();

      fireEvent.click(zoomInButton);
      expect(screen.getByText(/125%/)).toBeInTheDocument();
    });

    it('debe exportar datos a CSV', () => {
      // Mock createElement para el enlace de descarga
      const mockCreateElement = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      mockCreateElement.mockReturnValue(mockLink);
      global.document.createElement = mockCreateElement;

      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();

      render(
        <VitalSignsChart 
          data={normalVitalSigns}
          enableExport={true}
        />
      );

      const exportButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(exportButton);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('vital-signs-');
    });

    it('debe alternar modo pantalla completa', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
        />
      );

      const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
      fireEvent.click(fullscreenButton);

      // Verificar que se aplica clase de pantalla completa
      const cardElement = fullscreenButton.closest('[class*="fixed"]');
      expect(cardElement).toBeTruthy();
    });
  });

  describe('⚡ Rendimiento y Tiempo Real', () => {
    
    it('debe actualizar en tiempo real cuando realTime=true', async () => {
      vi.useFakeTimers();
      
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
          realTime={true}
          updateInterval={1000}
        />
      );

      expect(screen.getByText('En vivo')).toBeInTheDocument();

      // Avanzar el timer
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        // Verificar que el canvas se redibuja
        expect(mockCanvas.getContext).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it('debe manejar grandes volúmenes de datos sin degradar rendimiento', () => {
      const largeDataset: VitalSignDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000),
        heartRate: 70 + Math.random() * 20,
        bloodPressure: { systolic: 120 + Math.random() * 10, diastolic: 80 + Math.random() * 10 },
        temperature: 36.5 + Math.random(),
        oxygenSaturation: 95 + Math.random() * 5,
        respiratoryRate: 15 + Math.random() * 5
      }));

      const startTime = performance.now();
      
      render(
        <VitalSignsChart 
          data={largeDataset}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // El renderizado no debe tomar más de 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('♿ Accesibilidad Médica', () => {
    
    it('debe tener estructura semántica correcta', () => {
      render(
        <VitalSignsChart 
          data={normalVitalSigns}
        />
      );

      // Verificar estructura ARIA
      const chart = screen.getByRole('region', { name: /monitoreo/i });
      expect(chart).toBeInTheDocument();
    });

    it('debe proporcionar información textual de alertas para lectores de pantalla', () => {
      render(
        <VitalSignsChart 
          data={criticalVitalSigns}
          showAlerts={true}
        />
      );

      const alertText = screen.getByText(/Alertas Activas/);
      expect(alertText).toHaveAttribute('role', 'alert');
    });
  });

  describe('🏥 Casos Edge Médicos', () => {
    
    it('debe manejar presión arterial sistólica sin diastólica', () => {
      const incompleteBloodPressure: VitalSignDataPoint[] = [
        {
          timestamp: new Date(),
          bloodPressure: { systolic: 120, diastolic: 0 } // Sin diastólica
        }
      ];

      expect(() => {
        render(
          <VitalSignsChart 
            data={incompleteBloodPressure}
          />
        );
      }).not.toThrow();
    });

    it('debe validar valores imposibles médicamente', () => {
      const impossibleValues: VitalSignDataPoint[] = [
        {
          timestamp: new Date(),
          heartRate: 300, // Imposible
          temperature: 50, // Incompatible con vida
          oxygenSaturation: 120 // Imposible (>100%)
        }
      ];

      render(
        <VitalSignsChart 
          data={impossibleValues}
          onAlertTriggered={mockOnAlertTriggered}
        />
      );

      // Debe generar alertas para valores imposibles
      expect(mockOnAlertTriggered).toHaveBeenCalledWith('heartRate', 300);
      expect(mockOnAlertTriggered).toHaveBeenCalledWith('temperature', 50);
    });
  });
});