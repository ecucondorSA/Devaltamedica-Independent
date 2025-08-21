'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Database, 
  Activity, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Zap,
  HardDrive,
  Server,
  Users
} from 'lucide-react';

interface DatabaseMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'optimal' | 'warning' | 'critical';
  threshold: number;
}

interface DatabaseConnection {
  id: string;
  userId: string;
  database: string;
  status: 'active' | 'idle' | 'waiting';
  duration: number;
  query?: string;
  startTime: string;
}

interface DatabaseQuery {
  id: string;
  sql: string;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  user?: string;
  database: string;
}

interface DatabaseInfo {
  name: string;
  size: string;
  tables: number;
  connections: number;
  maxConnections: number;
  uptime: number;
  version: string;
  status: 'online' | 'offline' | 'maintenance';
}

export default function DatabaseMonitoring() {
  const [metrics, setMetrics] = useState<DatabaseMetric[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [queries, setQueries] = useState<DatabaseQuery[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular métricas de base de datos
        const mockMetrics: DatabaseMetric[] = [
          {
            name: 'Conexiones Activas',
            value: 45,
            unit: '',
            trend: 'up',
            change: 5,
            status: 'optimal',
            threshold: 100
          },
          {
            name: 'Tiempo de Respuesta Promedio',
            value: 125,
            unit: 'ms',
            trend: 'down',
            change: -15,
            status: 'optimal',
            threshold: 500
          },
          {
            name: 'Queries por Segundo',
            value: 850,
            unit: 'qps',
            trend: 'up',
            change: 12,
            status: 'optimal',
            threshold: 1000
          },
          {
            name: 'Uso de CPU',
            value: 35,
            unit: '%',
            trend: 'stable',
            change: 0,
            status: 'optimal',
            threshold: 80
          },
          {
            name: 'Uso de Memoria',
            value: 68,
            unit: '%',
            trend: 'up',
            change: 3,
            status: 'warning',
            threshold: 85
          },
          {
            name: 'Tasa de Cache Hit',
            value: 92,
            unit: '%',
            trend: 'up',
            change: 2,
            status: 'optimal',
            threshold: 80
          },
          {
            name: 'Tamaño de Base de Datos',
            value: 15.2,
            unit: 'GB',
            trend: 'up',
            change: 0.3,
            status: 'optimal',
            threshold: 50
          },
          {
            name: 'Tasa de Error',
            value: 0.2,
            unit: '%',
            trend: 'down',
            change: -0.1,
            status: 'optimal',
            threshold: 1
          }
        ];

        const mockConnections: DatabaseConnection[] = [
          {
            id: 'conn-001',
            userId: 'user-001',
            database: 'altamedica_main',
            status: 'active',
            duration: 1250,
            query: 'SELECT * FROM patients WHERE id = ?',
            startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString()
          },
          {
            id: 'conn-002',
            userId: 'user-002',
            database: 'altamedica_main',
            status: 'idle',
            duration: 300,
            startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            id: 'conn-003',
            userId: 'user-003',
            database: 'altamedica_main',
            status: 'waiting',
            duration: 45,
            query: 'UPDATE appointments SET status = ? WHERE id = ?',
            startTime: new Date(Date.now() - 1 * 60 * 1000).toISOString()
          }
        ];

        const mockQueries: DatabaseQuery[] = [
          {
            id: 'query-001',
            sql: 'SELECT p.*, a.appointment_date FROM patients p JOIN appointments a ON p.id = a.patient_id WHERE a.status = "confirmed"',
            duration: 245,
            status: 'completed',
            timestamp: new Date().toISOString(),
            user: 'doctor-001',
            database: 'altamedica_main'
          },
          {
            id: 'query-002',
            sql: 'UPDATE medical_records SET last_updated = NOW() WHERE patient_id = ?',
            duration: 12,
            status: 'completed',
            timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
            user: 'nurse-001',
            database: 'altamedica_main'
          },
          {
            id: 'query-003',
            sql: 'SELECT COUNT(*) FROM patients WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)',
            duration: 89,
            status: 'running',
            timestamp: new Date(Date.now() - 10 * 1000).toISOString(),
            user: 'admin-001',
            database: 'altamedica_main'
          }
        ];

        const mockDatabaseInfo: DatabaseInfo = {
          name: 'altamedica_main',
          size: '15.2 GB',
          tables: 24,
          connections: 45,
          maxConnections: 100,
          uptime: 99.8,
          version: 'PostgreSQL 14.5',
          status: 'online'
        };

        setMetrics(mockMetrics);
        setConnections(mockConnections);
        setQueries(mockQueries);
        setDatabaseInfo(mockDatabaseInfo);
      } catch (err) {
        logger.error('Error fetching database data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchDatabaseData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'waiting': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQueryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos de base de datos</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Información de la Base de Datos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Monitoreo de Base de Datos</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </button>
          </div>
        </div>

        {databaseInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Estado de la DB</p>
                  <p className="text-2xl font-bold">{databaseInfo.status.toUpperCase()}</p>
                </div>
                <Database className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Conexiones</p>
                  <p className="text-2xl font-bold text-blue-700">{databaseInfo.connections}/{databaseInfo.maxConnections}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Uptime</p>
                  <p className="text-2xl font-bold text-purple-700">{databaseInfo.uptime}%</p>
                </div>
                <Server className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Tamaño</p>
                  <p className="text-2xl font-bold text-orange-700">{databaseInfo.size}</p>
                </div>
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Información Adicional */}
        {databaseInfo && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Base de Datos:</p>
              <p className="font-medium text-gray-900">{databaseInfo.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Versión:</p>
              <p className="font-medium text-gray-900">{databaseInfo.version}</p>
            </div>
            <div>
              <p className="text-gray-500">Tablas:</p>
              <p className="font-medium text-gray-900">{databaseInfo.tables}</p>
            </div>
          </div>
        )}
      </div>

      {/* Métricas de Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Métricas de Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {metrics.map((metric) => (
            <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                {getTrendIcon(metric.trend)}
              </div>
              
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value}{metric.unit}
                </span>
                <span className={`text-sm font-medium ${
                  metric.change > 0 ? 'text-green-600' : 
                  metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Umbral: {metric.threshold}{metric.unit}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status === 'optimal' ? 'Óptimo' :
                     metric.status === 'warning' ? 'Advertencia' : 'Crítico'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conexiones Activas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Conexiones Activas ({connections.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {connections.map((connection) => (
            <div key={connection.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-900">Conexión {connection.id}</h4>
                    <span className={`text-sm font-medium ${getConnectionStatusColor(connection.status)}`}>
                      {connection.status === 'active' ? 'Activa' :
                       connection.status === 'idle' ? 'Inactiva' : 'Esperando'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Usuario:</p>
                      <p className="text-gray-600">{connection.userId}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Base de Datos:</p>
                      <p className="text-gray-600">{connection.database}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Duración:</p>
                      <p className="text-gray-600">{connection.duration} segundos</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Inicio:</p>
                      <p className="text-gray-600">
                        {new Date(connection.startTime).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  {connection.query && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-900">Query Actual:</p>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                        {connection.query}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="ml-6">
                  <button className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                    Terminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queries Recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Queries Recientes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {queries.map((query) => (
            <div key={query.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-900">Query {query.id}</h4>
                    <span className={`text-sm font-medium ${getQueryStatusColor(query.status)}`}>
                      {query.status === 'completed' ? 'Completada' :
                       query.status === 'running' ? 'Ejecutándose' : 'Fallida'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Duración:</p>
                      <p className="text-gray-600">{query.duration} ms</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Usuario:</p>
                      <p className="text-gray-600">{query.user || 'Sistema'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Base de Datos:</p>
                      <p className="text-gray-600">{query.database}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">SQL:</p>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded mt-1">
                      {query.sql}
                    </p>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(query.timestamp).toLocaleString('es-ES')}
                  </div>
                </div>
                
                <div className="ml-6">
                  {query.status === 'running' && (
                    <button className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 