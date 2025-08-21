'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Heart, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  RefreshCw,
  Database,
  Server,
  Globe,
  Shield
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  lastChecked: string;
  description: string;
  category: 'database' | 'api' | 'external' | 'system';
  details?: string;
}

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  uptime: number;
  responseTime: number;
  issues: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    timestamp: string;
    resolved: boolean;
  }>;
  lastCheck: string;
  metrics: {
    totalUsers: number;
    totalAppointments: number;
    pendingAlerts: number;
    databaseConnections: number;
    activeSessions: number;
  };
}

export default function HealthStatus() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/system/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setSystemHealth(data);
        
        // Convertir datos del sistema a health checks
        const checks: HealthCheck[] = [
          {
            name: 'Database Connection',
            status: data.status === 'HEALTHY' ? 'healthy' : 
                   data.status === 'WARNING' ? 'warning' : 'critical',
            responseTime: data.responseTime,
            lastChecked: data.lastCheck,
            description: 'Conexión a base de datos',
            category: 'database',
            details: `Conexiones activas: ${data.metrics.databaseConnections}`
          },
          {
            name: 'API Response Time',
            status: data.responseTime < 200 ? 'healthy' : 
                   data.responseTime < 500 ? 'warning' : 'critical',
            responseTime: data.responseTime,
            lastChecked: data.lastCheck,
            description: 'Tiempo de respuesta de la API',
            category: 'api',
            details: `Tiempo promedio: ${data.responseTime}ms`
          },
          {
            name: 'System Uptime',
            status: data.uptime > 99 ? 'healthy' : 
                   data.uptime > 95 ? 'warning' : 'critical',
            responseTime: 0,
            lastChecked: data.lastCheck,
            description: 'Disponibilidad del sistema',
            category: 'system',
            details: `Uptime: ${data.uptime}%`
          },
          {
            name: 'Active Sessions',
            status: data.metrics.activeSessions < 1000 ? 'healthy' : 
                   data.metrics.activeSessions < 2000 ? 'warning' : 'critical',
            responseTime: 0,
            lastChecked: data.lastCheck,
            description: 'Sesiones activas',
            category: 'system',
            details: `Sesiones: ${data.metrics.activeSessions}`
          },
          {
            name: 'Pending Alerts',
            status: data.metrics.pendingAlerts < 5 ? 'healthy' : 
                   data.metrics.pendingAlerts < 10 ? 'warning' : 'critical',
            responseTime: 0,
            lastChecked: data.lastCheck,
            description: 'Alertas pendientes',
            category: 'system',
            details: `Alertas: ${data.metrics.pendingAlerts}`
          },
          {
            name: 'User Load',
            status: data.metrics.totalUsers < 10000 ? 'healthy' : 
                   data.metrics.totalUsers < 50000 ? 'warning' : 'critical',
            responseTime: 0,
            lastChecked: data.lastCheck,
            description: 'Carga de usuarios',
            category: 'system',
            details: `Usuarios: ${data.metrics.totalUsers}`
          }
        ];

        // Agregar issues como health checks adicionales
        data.issues.forEach((issue: any, index: number) => {
          checks.push({
            name: `Issue: ${issue.id}`,
            status: issue.severity === 'CRITICAL' ? 'critical' : 
                   issue.severity === 'HIGH' ? 'warning' : 'healthy',
            responseTime: 0,
            lastChecked: issue.timestamp,
            description: issue.message,
            category: 'system',
            details: `Tipo: ${issue.type}, Resuelto: ${issue.resolved ? 'Sí' : 'No'}`
          });
        });

        setHealthChecks(checks);
        setLastUpdate(new Date());
      } catch (err) {
        logger.error('Error fetching health data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchHealthData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'unknown': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'unknown': return <Activity className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'api': return <Server className="w-4 h-4" />;
      case 'external': return <Globe className="w-4 h-4" />;
      case 'system': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const overallStatus = healthChecks.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : healthChecks.some(check => check.status === 'critical') 
    ? 'critical' 
    : 'warning';

  const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
  const warningCount = healthChecks.filter(check => check.status === 'warning').length;
  const criticalCount = healthChecks.filter(check => check.status === 'critical').length;

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
          <h3 className="text-red-800 font-medium">Error al cargar estado de salud</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estado de Salud del Sistema</h2>
          <p className="text-gray-600">Monitoreo de todos los servicios y componentes</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${getStatusColor(overallStatus)}`}>
                <Heart className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Estado General del Sistema</h3>
                <p className="text-sm text-gray-600">
                  {systemHealth.status === 'HEALTHY' ? 'Todos los sistemas operativos' :
                   systemHealth.status === 'WARNING' ? 'Algunos problemas detectados' :
                   'Sistema crítico - atención requerida'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{systemHealth.uptime}%</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
          </div>
          
          {/* System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              <p className="text-sm text-gray-600">Saludables</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              <p className="text-sm text-gray-600">Advertencias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-sm text-gray-600">Críticos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{systemHealth.responseTime}ms</p>
              <p className="text-sm text-gray-600">Tiempo Respuesta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{systemHealth.metrics.activeSessions}</p>
              <p className="text-sm text-gray-600">Sesiones Activas</p>
            </div>
          </div>
        </div>
      )}

      {/* Health Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verificaciones de Salud</h3>
        <div className="space-y-3">
          {healthChecks.map((check, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(check.status)}`}>
              <div className="flex items-center">
                {getStatusIcon(check.status)}
                <div className="ml-3">
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-gray-600">{check.description}</p>
                  {check.details && (
                    <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">
                  {check.responseTime > 0 ? `${check.responseTime}ms` : 'N/A'}
                </p>
                <p className="text-xs font-medium capitalize">{check.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {systemHealth && systemHealth.issues.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas Detectados</h3>
          <div className="space-y-3">
            {systemHealth.issues.map((issue, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                issue.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' :
                issue.severity === 'HIGH' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{issue.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Tipo: {issue.type} | Severidad: {issue.severity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {new Date(issue.timestamp).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      issue.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {issue.resolved ? 'Resuelto' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 