/**
 * Tests para componente HiringDashboard
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HiringDashboard } from '../../components/HiringDashboard';

// Mock de fetch global
global.fetch = jest.fn();

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock de recharts para evitar errores de rendering
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

const mockMetrics = {
  companyId: 'test-company-123',
  period: 'last_30_days',
  activeJobOffers: 8,
  totalApplications: 127,
  newApplications: 23,
  applicationsInReview: 45,
  applicationsInInterview: 12,
  totalHires: 18,
  averageTimeToHire: 21,
  averageApplicationsPerJob: 8.5,
  conversionRate: 14.2,
  averageApplicantRating: 4.3,
  applicationsGrowth: 15.8,
  hiresGrowth: 22.5,
  topSpecialties: [
    { specialty: 'Cardiología', applications: 34, hires: 6 },
    { specialty: 'Neurología', applications: 28, hires: 4 },
  ],
  applicationsTimeline: [
    { date: '2025-01-01', applications: 5, hires: 1 },
    { date: '2025-01-02', applications: 3, hires: 0 },
  ],
  specialtyDistribution: [
    { specialty: 'Cardiología', percentage: 26.8, count: 34 },
    { specialty: 'Neurología', percentage: 22.0, count: 28 },
  ],
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('HiringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockMetrics }),
    });
  });

  it('debería renderizar el dashboard correctamente', async () => {
    renderWithQueryClient(<HiringDashboard />);

    expect(screen.getByText('Dashboard de Contratación')).toBeInTheDocument();
    expect(screen.getByText('Métricas y análisis de reclutamiento')).toBeInTheDocument();
  });

  it('debería mostrar loading state inicialmente', () => {
    renderWithQueryClient(<HiringDashboard />);
    
    // Verificar skeletons de loading
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('debería cargar y mostrar métricas principales', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // Ofertas activas
      expect(screen.getByText('127')).toBeInTheDocument(); // Total aplicaciones
      expect(screen.getByText('18')).toBeInTheDocument(); // Total contrataciones
      expect(screen.getByText('21d')).toBeInTheDocument(); // Tiempo promedio
    });
  });

  it('debería mostrar pipeline de aplicaciones', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Aplicaciones')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument(); // Nuevas
      expect(screen.getByText('45')).toBeInTheDocument(); // En revisión
      expect(screen.getByText('12')).toBeInTheDocument(); // Entrevistas
    });
  });

  it('debería mostrar crecimiento con íconos correctos', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      // Verificar porcentajes de crecimiento
      expect(screen.getByText('15.8%')).toBeInTheDocument(); // Aplicaciones
      expect(screen.getByText('22.5%')).toBeInTheDocument(); // Contrataciones
    });
  });

  it('debería permitir cambiar período de tiempo', async () => {
    renderWithQueryClient(<HiringDashboard />);

    const periodSelect = screen.getByDisplayValue('Últimos 30 días');
    fireEvent.change(periodSelect, { target: { value: 'last_7_days' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/hiring-dashboard?period=last_7_days',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('debería manejar exportación de reportes', async () => {
    (fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              reportId: 'test-report-123',
              downloadUrl: '/api/reports/test-report-123',
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: mockMetrics }),
      });
    });

    // Mock window.open
    window.open = jest.fn();

    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/hiring-dashboard',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({ 
            format: 'pdf', 
            period: 'last_30_days' 
          }),
        })
      );
    });
  });

  it('debería mostrar tabla de especialidades top', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Especialidades con Más Demanda')).toBeInTheDocument();
      expect(screen.getByText('Cardiología')).toBeInTheDocument();
      expect(screen.getByText('Neurología')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument(); // Aplicaciones cardiología
      expect(screen.getByText('6')).toBeInTheDocument(); // Contrataciones cardiología
    });
  });

  it('debería calcular tasa de conversión correctamente', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      // Cardiología: 6 hires / 34 applications = 17.6%
      expect(screen.getByText('17.6%')).toBeInTheDocument();
      // Neurología: 4 hires / 28 applications = 14.3%
      expect(screen.getByText('14.3%')).toBeInTheDocument();
    });
  });

  it('debería manejar errores gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar dashboard')).toBeInTheDocument();
      expect(screen.getByText('No se pudieron cargar las métricas de contratación')).toBeInTheDocument();
    });
  });

  it('debería renderizar gráficos', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByText('Tendencia de Aplicaciones')).toBeInTheDocument();
      expect(screen.getByText('Distribución por Especialidad')).toBeInTheDocument();
    });
  });

  it('debería ser accesible', async () => {
    renderWithQueryClient(<HiringDashboard />);

    await waitFor(() => {
      // Verificar que hay headings apropiados
      expect(screen.getByRole('heading', { name: /dashboard de contratación/i })).toBeInTheDocument();
      
      // Verificar que los botones tienen labels apropiados
      const exportButton = screen.getByRole('button', { name: /exportar/i });
      expect(exportButton).toBeInTheDocument();
    });
  });
});