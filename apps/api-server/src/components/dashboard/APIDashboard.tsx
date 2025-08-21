'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    byRole: Array<{
      role: string;
      total: number;
      active: number;
    }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    newThisMonth: number;
    upcomingWeek: number;
  };
  revenue: {
    totalRevenue: number;
    totalTransactions: number;
  };
  alerts: {
    totalAlerts: number;
    criticalAlerts: number;
    unacknowledgedAlerts: number;
  };
  systemHealth: {
    totalRequests: number;
    successfulRequests: number;
    avgResponseTime: number;
  };
}

interface SystemAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  acknowledged: boolean;
}

interface RecentActivity {
  type: string;
  description: string;
  user_name: string;
  timestamp: string;
}

export default function APIDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setStats(data.data.stats);
          setAlerts(data.data.alerts || []);
          setRecentActivity(data.data.recentActivity || []);
        } else {
          throw new Error(data.error || 'Error al cargar datos del dashboard');
        }
      } catch (err) {
        logger.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-red-800 font-medium">Error al cargar datos</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Administración</h2>
        <p className="text-gray-600">Vista general del sistema y métricas clave</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuarios */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
              <p className="text-sm text-green-600">
                +{stats.users.newThisMonth} este mes
              </p>
            </div>
          </div>
        </div>

        {/* Citas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Citas Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.appointments.total}</p>
              <p className="text-sm text-blue-600">
                {stats.appointments.upcomingWeek} esta semana
              </p>
            </div>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.revenue.totalRevenue)}
              </p>
              <p className="text-sm text-green-600">
                {stats.revenue.totalTransactions} transacciones
              </p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertas Críticas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alerts.criticalAlerts}</p>
              <p className="text-sm text-red-600">
                {stats.alerts.unacknowledgedAlerts} sin resolver
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salud del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Requests Totales</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.systemHealth.totalRequests}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Requests Exitosos</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.systemHealth.successfulRequests}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Tiempo Promedio</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {stats.systemHealth.avgResponseTime?.toFixed(2) || '0'}ms
            </span>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Recientes</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(alert.priority)}`}>
                <div className="flex items-center">
                  {getStatusIcon(alert.priority)}
                  <div className="ml-3">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{formatDate(alert.created_at)}</p>
                  <p className="text-xs font-medium capitalize">{alert.priority}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-600">{activity.user_name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 