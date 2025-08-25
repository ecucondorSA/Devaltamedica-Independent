/**
 * 📊 ANALYTICS HOOKS - ALTAMEDICA
 * Hooks para gestión de análisis y métricas
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

// Schema de dashboard analytics
const DashboardAnalyticsSchema = z.object({
  overview: z.object({
    totalPatients: z.number(),
    totalDoctors: z.number(),
    totalAppointments: z.number(),
    totalRevenue: z.number(),
    growthRate: z.object({
      patients: z.number(),
      appointments: z.number(),
      revenue: z.number(),
    }),
  }),
  appointments: z.object({
    today: z.number(),
    thisWeek: z.number(),
    thisMonth: z.number(),
    byStatus: z.record(z.number()),
    byType: z.record(z.number()),
    cancellationRate: z.number(),
    noShowRate: z.number(),
  }),
  revenue: z.object({
    today: z.number(),
    thisWeek: z.number(),
    thisMonth: z.number(),
    byService: z.record(z.number()),
    byPaymentMethod: z.record(z.number()),
    outstandingPayments: z.number(),
  }),
  performance: z.object({
    averageWaitTime: z.number(), // minutos
    averageConsultationTime: z.number(), // minutos
    patientSatisfactionScore: z.number(), // 0-5
    doctorUtilizationRate: z.number(), // porcentaje
  }),
});

// Schema de métricas
const MetricsSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  trend: z.enum(['up', 'down', 'stable']),
  changePercent: z.number(),
  period: z.string(),
  data: z.array(z.object({
    date: z.string(),
    value: z.number(),
  })),
});

type DashboardAnalytics = z.infer<typeof DashboardAnalyticsSchema>;
type Metrics = z.infer<typeof MetricsSchema>;

// Hook para dashboard analytics
export function useDashboardAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  role?: 'admin' | 'doctor' | 'company';
  entityId?: string;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: async () => {
      return apiClient.get<DashboardAnalytics>(
        API_ENDPOINTS.analytics.dashboard,
        { 
          params,
          validate: DashboardAnalyticsSchema 
        }
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para métricas específicas
export function useMetrics(metrics: string[], params?: {
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  entityId?: string;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['analytics', 'metrics', metrics, params],
    queryFn: async () => {
      return apiClient.get<Metrics[]>(
        API_ENDPOINTS.analytics.metrics,
        { 
          params: { 
            ...params, 
            metrics: metrics.join(',') 
          } 
        }
      );
    },
    enabled: metrics.length > 0,
  });
}

// Hook para generar reporte
export function useGenerateReport() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (reportData: {
      type: 'appointments' | 'revenue' | 'patients' | 'performance' | 'custom';
      format: 'pdf' | 'excel' | 'csv';
      startDate: string;
      endDate: string;
      filters?: Record<string, any>;
      customMetrics?: string[];
    }) => {
      return apiClient.post<{
        reportId: string;
        status: 'processing' | 'completed' | 'failed';
        downloadUrl?: string;
        estimatedTime?: number; // segundos
      }>(
        API_ENDPOINTS.analytics.reports,
        reportData
      );
    },
  });
}

// Hook para exportar datos
export function useExportData() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (exportData: {
      entity: 'patients' | 'appointments' | 'prescriptions' | 'invoices';
      format: 'csv' | 'excel' | 'json';
      filters?: Record<string, any>;
      fields?: string[];
    }) => {
      const response = await apiClient.post<Blob>(
        API_ENDPOINTS.analytics.export,
        exportData,
        {
          headers: {
            'Accept': exportData.format === 'excel' 
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : exportData.format === 'csv' 
              ? 'text/csv' 
              : 'application/json',
          },
        }
      );
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${exportData.entity}-${new Date().toISOString()}.${exportData.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
}

// Hook para analytics en tiempo real
export function useRealtimeAnalytics() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: async () => {
      return apiClient.get<{
        activeUsers: number;
        activeSessions: number;
        ongoingAppointments: number;
        waitingPatients: number;
        recentEvents: Array<{
          type: string;
          timestamp: string;
          user: string;
          details: any;
        }>;
      }>(
        '/api/v1/analytics/realtime'
      );
    },
    refetchInterval: 10 * 1000, // 10 segundos
  });
}

// Hook para tendencias
export function useTrends(metric: string, params?: {
  period: 'day' | 'week' | 'month' | 'year';
  compare?: boolean;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['analytics', 'trends', metric, params],
    queryFn: async () => {
      return apiClient.get<{
        current: {
          period: string;
          data: Array<{ date: string; value: number }>;
          total: number;
          average: number;
        };
        previous?: {
          period: string;
          data: Array<{ date: string; value: number }>;
          total: number;
          average: number;
        };
        change?: {
          absolute: number;
          percentage: number;
          trend: 'up' | 'down' | 'stable';
        };
      }>(
        `/api/v1/analytics/trends/${metric}`,
        { params }
      );
    },
  });
}

// Hook para KPIs personalizados
export function useCustomKPIs(kpis: Array<{
  name: string;
  formula: string;
  filters?: Record<string, any>;
}>) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['analytics', 'custom-kpis', kpis],
    queryFn: async () => {
      return apiClient.post<Array<{
        name: string;
        value: number;
        formatted: string;
        trend: 'up' | 'down' | 'stable';
        changePercent: number;
      }>>(
        '/api/v1/analytics/custom-kpis',
        { kpis }
      );
    },
    enabled: kpis.length > 0,
  });
}