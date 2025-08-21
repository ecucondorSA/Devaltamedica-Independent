'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface LogFilter {
  level: string[];
  source: string[];
  timeRange: string;
  search: string;
}

export default function RealTimeLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilter>({
    level: [],
    source: [],
    timeRange: '1h',
    search: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular logs reales basados en datos de monitoreo
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
          // Generar logs simulados basados en datos de monitoreo
          const currentTime = new Date();
          const newLogs: LogEntry[] = [
            {
              id: '1',
              timestamp: new Date(currentTime.getTime() - 1000).toISOString(),
              level: 'info',
              message: `API request processed - ${data.data.application.api.totalRequests} total requests`,
              source: 'api-gateway',
              userId: 'system',
              ipAddress: '127.0.0.1',
              userAgent: 'Next.js/15.3.4'
            },
            {
              id: '2',
              timestamp: new Date(currentTime.getTime() - 2000).toISOString(),
              level: data.data.application.api.serverErrors > 0 ? 'error' : 'info',
              message: `Database connection - ${data.data.database.connections.active} active connections`,
              source: 'database',
              userId: 'system',
              ipAddress: '127.0.0.1'
            },
            {
              id: '3',
              timestamp: new Date(currentTime.getTime() - 3000).toISOString(),
              level: parseFloat(data.data.system.memory.usagePercentage) > 80 ? 'warning' : 'info',
              message: `Memory usage: ${data.data.system.memory.usagePercentage}%`,
              source: 'system-monitor',
              userId: 'system'
            },
            {
              id: '4',
              timestamp: new Date(currentTime.getTime() - 4000).toISOString(),
              level: 'info',
              message: `Cache hit ratio: ${data.data.database.performance.cacheHitRatio}%`,
              source: 'cache-service',
              userId: 'system'
            },
            {
              id: '5',
              timestamp: new Date(currentTime.getTime() - 5000).toISOString(),
              level: data.data.application.api.avgResponseTime > 500 ? 'warning' : 'info',
              message: `Average response time: ${data.data.application.api.avgResponseTime}ms`,
              source: 'api-gateway',
              userId: 'system'
            }
          ];

          setLogs(newLogs);
        } else {
          throw new Error(data.error || 'Error al cargar logs');
        }
      } catch (err) {
        logger.error('Error fetching logs:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Auto-refresh cada 10 segundos si está habilitado
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    // Aplicar filtros
    let filtered = [...logs];

    // Filtro por nivel
    if (filters.level.length > 0) {
      filtered = filtered.filter(log => filters.level.includes(log.level));
    }

    // Filtro por fuente
    if (filters.source.length > 0) {
      filtered = filtered.filter(log => filters.source.includes(log.source));
    }

    // Filtro por búsqueda
    if (filters.search) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.source.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtro por rango de tiempo
    const now = new Date();
    const timeRanges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };

    if (filters.timeRange !== 'all') {
      const timeRange = timeRanges[filters.timeRange as keyof typeof timeRanges];
      filtered = filtered.filter(log => 
        now.getTime() - new Date(log.timestamp).getTime() < timeRange
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      case 'debug': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES');
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Source,Message,User ID,IP Address',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.userId || ''}","${log.ipAddress || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && logs.length === 0) {
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
          <h3 className="text-red-800 font-medium">Error al cargar logs</h3>
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
          <h2 className="text-2xl font-bold text-gray-900">Logs en Tiempo Real</h2>
          <p className="text-gray-600">Monitoreo de actividad del sistema y aplicaciones</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filters.level.join(',')}
            onChange={(e) => setFilters({ 
              ...filters, 
              level: e.target.value ? e.target.value.split(',') : [] 
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los niveles</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          {/* Source Filter */}
          <select
            value={filters.source.join(',')}
            onChange={(e) => setFilters({ 
              ...filters, 
              source: e.target.value ? e.target.value.split(',') : [] 
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las fuentes</option>
            <option value="api-gateway">API Gateway</option>
            <option value="database">Database</option>
            <option value="system-monitor">System Monitor</option>
            <option value="cache-service">Cache Service</option>
          </select>

          {/* Time Range */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="15m">Últimos 15 minutos</option>
            <option value="1h">Última hora</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Logs ({filteredLogs.length})
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              Última actualización: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay logs que coincidan con los filtros aplicados
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded ${getLevelColor(log.level)}`}>
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{log.message}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {log.source}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-x-4">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          {log.userId && <span>User: {log.userId}</span>}
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Info</p>
              <p className="text-lg font-bold text-green-600">
                {filteredLogs.filter(log => log.level === 'info').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Warnings</p>
              <p className="text-lg font-bold text-yellow-600">
                {filteredLogs.filter(log => log.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Errors</p>
              <p className="text-lg font-bold text-red-600">
                {filteredLogs.filter(log => log.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-bold text-blue-600">{filteredLogs.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 