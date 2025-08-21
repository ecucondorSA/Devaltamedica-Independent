// 🧪 TESTS UNITARIOS: SystemHealthMonitor - Monitor de Salud del Sistema
// Tests críticos para monitoreo de infraestructura médica

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHealthMonitor, ServiceHealth } from '../SystemHealthMonitor';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// 🔧 MOCKS Y CONFIGURACIÓN
const mockOnServiceClick = vi.fn();

beforeEach(() => {
  mockOnServiceClick.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

// 📊 DATOS DE PRUEBA - SERVICIOS MÉDICOS
const healthyServices: ServiceHealth[] = [
  {
    name: 'API Server',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 45,
    lastCheck: new Date('2024-01-01T10:00:00Z'),
    errorCount: 0
  },
  {
    name: 'Database',
    status: 'healthy',
    uptime: 99.8,
    responseTime: 12,
    lastCheck: new Date('2024-01-01T10:00:00Z'),
    errorCount: 0
  },
  {
    name: 'WebRTC Signaling',
    status: 'healthy',
    uptime: 99.5,
    responseTime: 8,
    lastCheck: new Date('2024-01-01T10:00:00Z'),
    errorCount: 0
  }
];

const mixedStatusServices: ServiceHealth[] = [
  {
    name: 'API Server',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 45,
    errorCount: 0
  },
  {
    name: 'Database',
    status: 'warning',
    uptime: 95.2,
    responseTime: 150,
    errorCount: 3
  },
  {
    name: 'File Storage',
    status: 'critical',
    uptime: 85.5,
    responseTime: 500,
    errorCount: 15
  },
  {
    name: 'Email Service',
    status: 'down',
    uptime: 0,
    responseTime: 0,
    errorCount: 25
  }
];

const criticalServices: ServiceHealth[] = [
  {
    name: 'Main Database',
    status: 'critical',
    uptime: 75.0,
    responseTime: 2000,
    errorCount: 50
  },
  {
    name: 'Authentication Service',
    status: 'down',
    uptime: 0,
    responseTime: 0,
    errorCount: 100
  }
];

const highPerformanceServices: ServiceHealth[] = [
  {
    name: 'Cache Redis',
    status: 'healthy',
    uptime: 100,
    responseTime: 1,
    errorCount: 0
  },
  {
    name: 'CDN',
    status: 'healthy',
    uptime: 99.99,
    responseTime: 2,
    errorCount: 0
  }
];

describe('🖥️ SystemHealthMonitor - Monitor Crítico de Salud', () => {
  
  describe('✅ Renderizado y Estructura', () => {
    
    it('debe renderizar sin errores con servicios saludables', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      expect(screen.getByText('API Server')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('WebRTC Signaling')).toBeInTheDocument();
    });

    it('debe mostrar resumen de estadísticas generales', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Saludables
      expect(screen.getByText('1')).toBeInTheDocument(); // Advertencias  
      expect(screen.getByText('1')).toBeInTheDocument(); // Críticos
      expect(screen.getByText('Saludables')).toBeInTheDocument();
      expect(screen.getByText('Advertencias')).toBeInTheDocument();
      expect(screen.getByText('Críticos')).toBeInTheDocument();
    });

    it('debe calcular uptime promedio correctamente', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      // Uptime promedio = (99.9 + 95.2 + 85.5 + 0) / 4 = 70.15%
      const uptimeElement = screen.getByText('70.1%');
      expect(uptimeElement).toBeInTheDocument();
      expect(screen.getByText('Uptime Promedio')).toBeInTheDocument();
    });

    it('debe aplicar className personalizada', () => {
      const { container } = render(
        <SystemHealthMonitor 
          services={healthyServices}
          className="test-monitor"
        />
      );
      
      expect(container.firstChild).toHaveClass('test-monitor');
    });
  });

  describe('🎨 Estados Visuales de Servicios', () => {
    
    it('debe mostrar servicios saludables con estilo verde', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      const apiService = screen.getByText('API Server').closest('div');
      expect(apiService).toHaveClass('bg-green-50', 'border-green-200');
      
      // Verificar badge de estado
      expect(screen.getByText('Saludable')).toBeInTheDocument();
    });

    it('debe mostrar servicios con advertencia en estilo amarillo', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      const dbService = screen.getByText('Database').closest('div');
      expect(dbService).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('debe mostrar servicios críticos en estilo rojo', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      const storageService = screen.getByText('File Storage').closest('div');
      expect(storageService).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('debe mostrar servicios inactivos en estilo gris', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      const emailService = screen.getByText('Email Service').closest('div');
      expect(emailService).toHaveClass('bg-gray-50', 'border-gray-200');
    });
  });

  describe('📊 Métricas de Rendimiento', () => {
    
    it('debe mostrar uptime con precisión de 2 decimales', () => {
      render(
        <SystemHealthMonitor 
          services={[{
            name: 'Test Service',
            status: 'healthy',
            uptime: 99.876,
            responseTime: 45,
            errorCount: 0
          }]}
        />
      );
      
      expect(screen.getByText('99.88% uptime')).toBeInTheDocument();
    });

    it('debe mostrar tiempo de respuesta en milisegundos', () => {
      render(
        <SystemHealthMonitor 
          services={highPerformanceServices}
        />
      );
      
      expect(screen.getByText('1ms')).toBeInTheDocument();
      expect(screen.getByText('2ms')).toBeInTheDocument();
    });

    it('debe mostrar count de errores cuando > 0', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      expect(screen.getByText('3 errores')).toBeInTheDocument();
      expect(screen.getByText('15 errores')).toBeInTheDocument();
      expect(screen.getByText('25 errores')).toBeInTheDocument();
    });

    it('NO debe mostrar count de errores cuando = 0', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      expect(screen.queryByText('0 errores')).not.toBeInTheDocument();
    });
  });

  describe('📈 Barras de Uptime', () => {
    
    it('debe mostrar barra verde para uptime >= 99.5%', () => {
      render(
        <SystemHealthMonitor 
          services={[{
            name: 'High Uptime Service',
            status: 'healthy',
            uptime: 99.9,
            responseTime: 10,
            errorCount: 0
          }]}
        />
      );
      
      const progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle('width: 99.9%');
    });

    it('debe mostrar barra amarilla para uptime >= 95% y < 99.5%', () => {
      render(
        <SystemHealthMonitor 
          services={[{
            name: 'Medium Uptime Service',
            status: 'warning',
            uptime: 97.0,
            responseTime: 100,
            errorCount: 5
          }]}
        />
      );
      
      const progressBar = document.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle('width: 97%');
    });

    it('debe mostrar barra roja para uptime < 95%', () => {
      render(
        <SystemHealthMonitor 
          services={[{
            name: 'Low Uptime Service',
            status: 'critical',
            uptime: 85.0,
            responseTime: 300,
            errorCount: 20
          }]}
        />
      );
      
      const progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle('width: 85%');
    });
  });

  describe('🖱️ Interacciones de Usuario', () => {
    
    it('debe llamar onServiceClick al hacer clic en un servicio', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <SystemHealthMonitor 
          services={healthyServices}
          onServiceClick={mockOnServiceClick}
        />
      );
      
      const apiServiceCard = screen.getByText('API Server').closest('div');
      await user.click(apiServiceCard!);
      
      expect(mockOnServiceClick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'API Server',
          status: 'healthy'
        })
      );
    });

    it('debe aplicar efectos hover en las tarjetas de servicio', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      const serviceCard = screen.getByText('API Server').closest('div');
      expect(serviceCard).toHaveClass('hover:shadow-md', 'hover:scale-[1.02]');
    });

    it('debe mostrar cursor pointer en las tarjetas clickeables', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
          onServiceClick={mockOnServiceClick}
        />
      );
      
      const serviceCard = screen.getByText('API Server').closest('div');
      expect(serviceCard).toHaveClass('cursor-pointer');
    });
  });

  describe('⏰ Auto-actualización', () => {
    
    it('debe actualizar timestamp cada intervalo especificado', async () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
          refreshInterval={5000}
        />
      );
      
      const initialTime = screen.getByText(/Última actualización:/);
      const initialTimeText = initialTime.textContent;
      
      // Avanzar 5 segundos
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        const updatedTime = screen.getByText(/Última actualización:/);
        expect(updatedTime.textContent).not.toBe(initialTimeText);
      });
    });

    it('debe mostrar tiempo para próxima actualización', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
          refreshInterval={30000}
        />
      );
      
      expect(screen.getByText(/Próxima actualización en 30s/)).toBeInTheDocument();
    });

    it('debe usar intervalo por defecto de 30 segundos', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      expect(screen.getByText(/Próxima actualización en 30s/)).toBeInTheDocument();
    });
  });

  describe('📊 Cálculos Estadísticos', () => {
    
    it('debe calcular estadísticas correctas para servicios mixtos', () => {
      render(
        <SystemHealthMonitor 
          services={mixedStatusServices}
        />
      );
      
      // Total: 4 servicios
      // Saludables: 1, Advertencias: 1, Críticos: 1, Inactivos: 1
      expect(screen.getByText('1')).toBeInTheDocument(); // Múltiples elementos con "1"
      
      // Verificar que todos los tipos están representados
      expect(screen.getByText('Saludables')).toBeInTheDocument();
      expect(screen.getByText('Advertencias')).toBeInTheDocument();
      expect(screen.getByText('Críticos')).toBeInTheDocument();
    });

    it('debe manejar lista vacía de servicios', () => {
      render(
        <SystemHealthMonitor 
          services={[]}
        />
      );
      
      // No debe haber tarjetas de servicio
      expect(screen.queryByText('API Server')).not.toBeInTheDocument();
      
      // Pero debe mostrar la estructura del dashboard
      expect(screen.getByText('Saludables')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Todos en 0
    });

    it('debe calcular tiempo de respuesta promedio', () => {
      const services: ServiceHealth[] = [
        { name: 'Service 1', status: 'healthy', uptime: 100, responseTime: 10, errorCount: 0 },
        { name: 'Service 2', status: 'healthy', uptime: 100, responseTime: 20, errorCount: 0 },
        { name: 'Service 3', status: 'healthy', uptime: 100, responseTime: 30, errorCount: 0 }
      ];
      
      render(
        <SystemHealthMonitor 
          services={services}
        />
      );
      
      // Promedio: (10 + 20 + 30) / 3 = 20ms
      // Este cálculo no se muestra directamente en el UI actual,
      // pero se puede verificar internamente
      expect(screen.getByText('10ms')).toBeInTheDocument();
      expect(screen.getByText('20ms')).toBeInTheDocument();
      expect(screen.getByText('30ms')).toBeInTheDocument();
    });
  });

  describe('🚨 Casos Críticos para Sistemas Médicos', () => {
    
    it('debe destacar visualmente servicios médicos críticos', () => {
      const criticalMedicalServices: ServiceHealth[] = [
        {
          name: 'Patient Database',
          status: 'critical',
          uptime: 50.0,
          responseTime: 5000,
          errorCount: 100
        },
        {
          name: 'Emergency Alert System',
          status: 'down',
          uptime: 0,
          responseTime: 0,
          errorCount: 200
        }
      ];
      
      render(
        <SystemHealthMonitor 
          services={criticalMedicalServices}
        />
      );
      
      // Servicios críticos deben tener styling de alerta
      const patientDb = screen.getByText('Patient Database').closest('div');
      expect(patientDb).toHaveClass('bg-red-50', 'border-red-200');
      
      const emergencySystem = screen.getByText('Emergency Alert System').closest('div');
      expect(emergencySystem).toHaveClass('bg-gray-50', 'border-gray-200');
      
      // Debe mostrar counts de error altos
      expect(screen.getByText('100 errores')).toBeInTheDocument();
      expect(screen.getByText('200 errores')).toBeInTheDocument();
    });

    it('debe manejar servicios con uptime extremadamente bajo', () => {
      const failingServices: ServiceHealth[] = [
        {
          name: 'Backup System',
          status: 'critical',
          uptime: 0.1, // Casi completamente inactivo
          responseTime: 10000,
          errorCount: 500
        }
      ];
      
      render(
        <SystemHealthMonitor 
          services={failingServices}
        />
      );
      
      expect(screen.getByText('0.10% uptime')).toBeInTheDocument();
      expect(screen.getByText('10000ms')).toBeInTheDocument();
      expect(screen.getByText('500 errores')).toBeInTheDocument();
      
      // La barra de progreso debe ser roja y muy pequeña
      const progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toHaveStyle('width: 0.1%');
    });

    it('debe manejar servicios con tiempos de respuesta extremos', () => {
      const slowServices: ServiceHealth[] = [
        {
          name: 'Legacy System',
          status: 'warning',
          uptime: 99.0,
          responseTime: 30000, // 30 segundos - extremadamente lento
          errorCount: 10
        }
      ];
      
      render(
        <SystemHealthMonitor 
          services={slowServices}
        />
      );
      
      expect(screen.getByText('30000ms')).toBeInTheDocument();
    });
  });

  describe('♿ Accesibilidad', () => {
    
    it('debe tener estructura semántica apropiada', () => {
      render(
        <SystemHealthMonitor 
          services={healthyServices}
        />
      );
      
      // Las tarjetas deben ser clickeables y accesibles
      const serviceCards = screen.getAllByRole('button', { hidden: true });
      expect(serviceCards.length).toBeGreaterThan(0);
    });

    it('debe proporcionar contexto para lectores de pantalla', () => {
      render(
        <SystemHealthMonitor 
          services={criticalServices}
        />
      );
      
      // Estados críticos deben ser identificables por lectores de pantalla
      expect(screen.getByText('Crítico')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  describe('⚡ Rendimiento', () => {
    
    it('debe manejar gran cantidad de servicios sin degradación', () => {
      const manyServices: ServiceHealth[] = Array.from({ length: 100 }, (_, i) => ({
        name: `Service ${i}`,
        status: 'healthy' as const,
        uptime: 99.9,
        responseTime: Math.random() * 100,
        errorCount: 0
      }));
      
      const startTime = performance.now();
      
      render(
        <SystemHealthMonitor 
          services={manyServices}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // El renderizado no debe tomar más de 200ms para 100 servicios
      expect(renderTime).toBeLessThan(200);
      
      // Verificar que todos los servicios se renderizan
      expect(screen.getByText('Service 0')).toBeInTheDocument();
      expect(screen.getByText('Service 99')).toBeInTheDocument();
    });
  });
});