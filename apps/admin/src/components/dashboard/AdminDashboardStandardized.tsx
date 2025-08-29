/**
 * @fileoverview Dashboard Administrativo - Arquitectura 3 Capas
 * @description Dashboard principal usando tipos simples + adaptadores
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

import { AdapterUtils, StatsAdapter, systemAdapter } from '../../adapters/admin-adapters';
import { AdminStats, LoadingState, SystemHealth } from '../../types';

// ==================== INTERFACE PROPS ====================

interface AdminDashboardProps {
  className?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

const AdminDashboardStandardized: React.FC<AdminDashboardProps> = ({ className = '' }) => {
  // Estados usando tipos simples
  const [stats, setStats] = useState<AdminStats>(StatsAdapter.createDefaultStats());
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    loading: true,
    error: undefined,
    lastUpdated: undefined,
  });

  // ==================== EFECTOS ====================

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingState((prev) => ({ ...prev, loading: true, error: undefined }));

      try {
        // Simular llamadas a la API (en real vendría de packages complejos)
        const [statsData, healthData] = await Promise.all([
          fetchStatsData(),
          fetchSystemHealthData(),
        ]);

        // Usar adaptadores para convertir datos complejos a simples
        setStats(StatsAdapter.fromAnalyticsData(statsData));
        setSystemHealth(systemAdapter.toSimple(healthData));

        setLoadingState({
          loading: false,
          error: undefined,
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        setLoadingState({
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
          lastUpdated: undefined,
        });
      }
    };

    void loadDashboardData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ==================== FUNCIONES ====================

  const loadDashboardData = async () => {
    setLoadingState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Simular llamadas a la API (en real vendría de packages complejos)
      const [statsData, healthData] = await Promise.all([
        fetchStatsData(),
        fetchSystemHealthData(),
      ]);

      // Usar adaptadores para convertir datos complejos a simples
      setStats(StatsAdapter.fromAnalyticsData(statsData));
      setSystemHealth(systemAdapter.toSimple(healthData));

      setLoadingState({
        loading: false,
        error: undefined,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      setLoadingState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        lastUpdated: undefined,
      });
    }
  };

  // Simular fetch de datos (en real vendría de @altamedica/api-client)
  const fetchStatsData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      users: { total: 1247, active: 892, new24h: 23 },
      appointments: { total: 3456, active: 87, completed: 3201 },
      system: {
        health: 'up' as const,
        errorRate: 1.2,
        responseTime: 245,
      },
    };
  };

  const fetchSystemHealthData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      services: [
        {
          name: 'API Server',
          health: {
            status: 'up' as const,
            responseTime: 120,
            uptime: 99.8,
            lastCheck: new Date().toISOString(),
          },
          port: 3001,
        },
        {
          name: 'Database',
          health: {
            status: 'up' as const,
            responseTime: 45,
            uptime: 100,
            lastCheck: new Date().toISOString(),
          },
        },
        {
          name: 'Redis Cache',
          health: {
            status: 'degraded' as const,
            responseTime: 850,
            uptime: 98.5,
            lastCheck: new Date().toISOString(),
          },
        },
      ],
      metrics: {
        system: {
          cpu: { usage: 23.5 },
          memory: { usage: 67.2 },
          disk: { usage: 45.8 },
          network: { latency: 12.3 },
        },
        connections: { active: 143 },
      },
      alerts: [
        {
          id: '1',
          level: 'medium' as const,
          message: 'Redis cache response time elevated',
          timestamp: new Date().toISOString(),
          resolved: false,
          source: 'Redis Cache',
        },
      ],
    };
  };

  const handleRefresh = () => {
    void loadDashboardData();
  };

  // ==================== RENDER HELPERS ====================

  const renderStatsCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    trend?: string,
    color: string = 'text-blue-600',
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );

  const renderSystemStatus = () => {
    if (!systemHealth) return null;

    const statusColor = {
      up: 'text-green-600',
      degraded: 'text-yellow-600',
      down: 'text-red-600',
    };

    const statusIcon = {
      up: <CheckCircle className="h-4 w-4" />,
      degraded: <AlertTriangle className="h-4 w-4" />,
      down: <AlertTriangle className="h-4 w-4" />,
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Estado del Sistema
            <span className={`ml-auto ${statusColor[systemHealth.status]}`}>
              {statusIcon[systemHealth.status]}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemHealth.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <span className="text-sm">{service.name}</span>
                <div className="flex items-center gap-2">
                  {service.responseTime && (
                    <span className="text-xs text-gray-500">{service.responseTime}ms</span>
                  )}
                  <span className={`text-xs ${statusColor[service.status]}`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSystemMetrics = () => {
    if (!systemHealth) return null;

    const { metrics } = systemHealth;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">CPU</span>
              <span className="text-sm font-medium">{metrics.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Memoria</span>
              <span className="text-sm font-medium">{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Disco</span>
              <span className="text-sm font-medium">{metrics.diskUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${metrics.diskUsage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAlerts = () => {
    if (!systemHealth?.alerts.length) return null;

    const severityColor = {
      low: 'border-l-blue-500 bg-blue-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      high: 'border-l-orange-500 bg-orange-50',
      critical: 'border-l-red-500 bg-red-50',
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemHealth.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border-l-4 rounded ${severityColor[alert.severity]}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.service && (
                      <p className="text-xs text-gray-600 mt-1">{alert.service}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {AdapterUtils.formatDate(alert.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==================== RENDER PRINCIPAL ====================

  if (loadingState.loading && !stats.totalUsers) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Error al cargar dashboard
              </h2>
              <p className="text-gray-600 mb-4">{loadingState.error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Panel de control del sistema AltaMedica</p>
            {loadingState.lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Última actualización: {AdapterUtils.formatDate(loadingState.lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loadingState.loading}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loadingState.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderStatsCard(
            'Total Usuarios',
            stats.totalUsers,
            <Users className="h-4 w-4" />,
            `${stats.activeUsers} activos`,
            'text-blue-600',
          )}
          {renderStatsCard(
            'Nuevos Usuarios (24h)',
            stats.newUsers24h,
            <TrendingUp className="h-4 w-4" />,
            'Últimas 24 horas',
            'text-green-600',
          )}
          {renderStatsCard(
            'Citas Totales',
            stats.totalAppointments,
            <Clock className="h-4 w-4" />,
            `${stats.activeAppointments} activas`,
            'text-purple-600',
          )}
          {renderStatsCard(
            'Tiempo de Respuesta',
            Math.round(stats.averageResponseTime),
            <Activity className="h-4 w-4" />,
            'Promedio en ms',
            stats.averageResponseTime > 500 ? 'text-red-600' : 'text-green-600',
          )}
        </div>

        {/* Sistema y Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {renderSystemStatus()}
          {renderSystemMetrics()}
          {renderAlerts()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardStandardized;