'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  maxValue: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpu: number;
  memory: number;
  status: 'running' | 'stopped' | 'error';
}

interface MonitoringData {
  system: {
    cpu: {
      loadAverage: {
        '1min': number;
        '5min': number;
        '15min': number;
      };
      cores: number;
      model: string;
    };
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercentage: string;
    };
    system: {
      platform: string;
      arch: string;
      hostname: string;
      uptime: number;
      release: string;
      type: string;
    };
    network: {
      interfaces: number;
      hostname: string;
    };
    process: {
      pid: number;
      uptime: number;
      memoryUsage: any;
      cpuUsage: any;
    };
  };
  database: {
    connections: {
      active: number;
      idle: number;
      idleInTransaction: number;
      total: number;
    };
    transactions: {
      total: number;
      committed: number;
      rolledBack: number;
      successRate: string;
    };
    performance: {
      blocksRead: number;
      blocksHit: number;
      cacheHitRatio: string;
    };
    storage: {
      databaseSize: string;
      databaseSizeBytes: number;
      totalTables: number;
      userTables: number;
    };
  };
  application: {
    api: {
      totalRequests: number;
      successfulRequests: number;
      clientErrors: number;
      serverErrors: number;
      avgResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
    };
    auth: {
      totalLogins: number;
      successfulLogins: number;
      failedLogins: number;
    };
  };
}

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/monitoring', {
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
          setMonitoringData(data.data);
          
          // Convertir datos de monitoreo a métricas del sistema
          const systemMetrics: SystemMetric[] = [
            {
              name: 'CPU Usage',
              value: parseFloat(data.data.system.cpu.loadAverage['1min'].toFixed(2)),
              unit: '%',
              maxValue: 100,
              status: data.data.system.cpu.loadAverage['1min'] > 80 ? 'critical' : 
                     data.data.system.cpu.loadAverage['1min'] > 60 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            },
            {
              name: 'Memory Usage',
              value: parseFloat(data.data.system.memory.usagePercentage),
              unit: '%',
              maxValue: 100,
              status: parseFloat(data.data.system.memory.usagePercentage) > 90 ? 'critical' : 
                     parseFloat(data.data.system.memory.usagePercentage) > 80 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            },
            {
              name: 'Database Connections',
              value: data.data.database.connections.active,
              unit: '',
              maxValue: 100,
              status: data.data.database.connections.active > 80 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            },
            {
              name: 'API Response Time',
              value: data.data.application.api.avgResponseTime,
              unit: 'ms',
              maxValue: 1000,
              status: data.data.application.api.avgResponseTime > 500 ? 'critical' : 
                     data.data.application.api.avgResponseTime > 200 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            },
            {
              name: 'Success Rate',
              value: parseFloat(data.data.database.transactions.successRate),
              unit: '%',
              maxValue: 100,
              status: parseFloat(data.data.database.transactions.successRate) < 95 ? 'critical' : 
                     parseFloat(data.data.database.transactions.successRate) < 98 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            },
            {
              name: 'Cache Hit Ratio',
              value: parseFloat(data.data.database.performance.cacheHitRatio),
              unit: '%',
              maxValue: 100,
              status: parseFloat(data.data.database.performance.cacheHitRatio) < 80 ? 'warning' : 'normal',
              trend: 'stable',
              change: 0
            }
          ];

          setMetrics(systemMetrics);

          // Simular procesos del sistema
          const processNames = [
            'node', 'nginx', 'postgres', 'redis', 'pm2', 'cron', 'logrotate'
          ];
          
          const newProcesses: ProcessInfo[] = processNames.map((name, index) => ({
            name,
            pid: 1000 + index,
            cpu: Math.floor(Math.random() * 15) + 1,
            memory: Math.floor(Math.random() * 200) + 50,
            status: 'running' as const
          }));

          setProcesses(newProcesses);
        } else {
          throw new Error(data.error || 'Error al cargar datos de monitoreo');
        }
      } catch (err) {
        logger.error('Error fetching monitoring data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonitoringData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchMonitoringData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'cpu usage': return <Cpu className="w-6 h-6" />;
      case 'memory usage': return <MemoryStick className="w-6 h-6" />;
      case 'disk usage': return <HardDrive className="w-6 h-6" />;
      case 'network i/o': return <Network className="w-6 h-6" />;
      case 'active connections': return <Activity className="w-6 h-6" />;
      case 'response time': return <Clock className="w-6 h-6" />;
      case 'database connections': return <Activity className="w-6 h-6" />;
      case 'api response time': return <Clock className="w-6 h-6" />;
      case 'success rate': return <CheckCircle className="w-6 h-6" />;
      case 'cache hit ratio': return <Activity className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h3 className="text-red-800 font-medium">Error al cargar métricas</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Métricas del Sistema</h2>
        <p className="text-gray-600">Monitoreo en tiempo real del rendimiento del servidor</p>
      </div>

      {/* System Info */}
      {monitoringData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Hostname</p>
              <p className="text-lg font-bold text-gray-900">{monitoringData.system.system.hostname}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Plataforma</p>
              <p className="text-lg font-bold text-gray-900">{monitoringData.system.system.platform}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">CPU Cores</p>
              <p className="text-lg font-bold text-gray-900">{monitoringData.system.cpu.cores}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Memoria Total</p>
              <p className="text-lg font-bold text-gray-900">{formatBytes(monitoringData.system.memory.total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getMetricIcon(metric.name)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}{metric.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(metric.trend)}
                <span className={`text-sm ${
                  metric.change > 0 ? 'text-green-600' : 
                  metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className={`h-2 rounded-full ${
                    metric.status === 'critical' ? 'bg-red-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
                ></div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Database Metrics */}
      {monitoringData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Base de Datos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Conexiones Activas</p>
              <p className="text-2xl font-bold text-blue-900">{monitoringData.database.connections.active}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-green-900">{monitoringData.database.transactions.successRate}%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-600">Cache Hit Ratio</p>
              <p className="text-2xl font-bold text-purple-900">{monitoringData.database.performance.cacheHitRatio}%</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-600">Tamaño BD</p>
              <p className="text-2xl font-bold text-orange-900">{monitoringData.database.storage.databaseSize}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Metrics */}
      {monitoringData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de API</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-600">Requests Totales</p>
              <p className="text-2xl font-bold text-indigo-900">{monitoringData.application.api.totalRequests}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Requests Exitosos</p>
              <p className="text-2xl font-bold text-green-900">{monitoringData.application.api.successfulRequests}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-600">Errores</p>
              <p className="text-2xl font-bold text-red-900">
                {monitoringData.application.api.clientErrors + monitoringData.application.api.serverErrors}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-yellow-900">
                {monitoringData.application.api.avgResponseTime?.toFixed(2) || '0'}ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 