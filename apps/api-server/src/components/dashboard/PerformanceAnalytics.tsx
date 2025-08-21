'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  Zap,
  Database,
  Server,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'optimal' | 'warning' | 'critical';
  threshold: number;
  description: string;
}

interface Bottleneck {
  id: string;
  type: 'database' | 'api' | 'network' | 'memory' | 'cpu';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
  estimatedFix: string;
  priority: number;
}

interface PerformanceReport {
  overallScore: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  bottlenecks: number;
  optimizations: number;
}

export default function PerformanceAnalytics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular métricas de performance
        const mockMetrics: PerformanceMetric[] = [
          {
            name: 'Tiempo de Respuesta Promedio',
            value: 245,
            unit: 'ms',
            trend: 'down',
            change: -12,
            status: 'optimal',
            threshold: 500,
            description: 'Tiempo promedio de respuesta de todas las APIs'
          },
          {
            name: 'Throughput',
            value: 1250,
            unit: 'req/s',
            trend: 'up',
            change: 8,
            status: 'optimal',
            threshold: 1000,
            description: 'Requests procesados por segundo'
          },
          {
            name: 'Tasa de Error',
            value: 0.8,
            unit: '%',
            trend: 'down',
            change: -0.3,
            status: 'optimal',
            threshold: 2,
            description: 'Porcentaje de requests con error'
          },
          {
            name: 'Uso de CPU',
            value: 65,
            unit: '%',
            trend: 'up',
            change: 5,
            status: 'warning',
            threshold: 80,
            description: 'Uso actual del procesador'
          },
          {
            name: 'Uso de Memoria',
            value: 78,
            unit: '%',
            trend: 'up',
            change: 3,
            status: 'warning',
            threshold: 85,
            description: 'Uso actual de memoria RAM'
          },
          {
            name: 'Conexiones de DB',
            value: 45,
            unit: '',
            trend: 'stable',
            change: 0,
            status: 'optimal',
            threshold: 100,
            description: 'Conexiones activas a la base de datos'
          },
          {
            name: 'Latencia de Red',
            value: 15,
            unit: 'ms',
            trend: 'down',
            change: -2,
            status: 'optimal',
            threshold: 50,
            description: 'Latencia promedio de red'
          },
          {
            name: 'Cache Hit Ratio',
            value: 92,
            unit: '%',
            trend: 'up',
            change: 1,
            status: 'optimal',
            threshold: 80,
            description: 'Porcentaje de hits en caché'
          }
        ];

        const mockBottlenecks: Bottleneck[] = [
          {
            id: 'bottleneck-001',
            type: 'database',
            severity: 'high',
            description: 'Query lenta en tabla de pacientes',
            impact: 'Aumenta tiempo de respuesta en 200ms',
            recommendation: 'Agregar índice en campo fecha_nacimiento',
            estimatedFix: '30 minutos',
            priority: 1
          },
          {
            id: 'bottleneck-002',
            type: 'api',
            severity: 'medium',
            description: 'Endpoint de citas sin paginación',
            impact: 'Carga completa de datos en cada request',
            recommendation: 'Implementar paginación con límite de 50 registros',
            estimatedFix: '2 horas',
            priority: 2
          },
          {
            id: 'bottleneck-003',
            type: 'memory',
            severity: 'low',
            description: 'Memory leak en procesamiento de imágenes',
            impact: 'Uso gradual de memoria sin liberación',
            recommendation: 'Revisar garbage collection y liberar recursos',
            estimatedFix: '4 horas',
            priority: 3
          }
        ];

        const mockReport: PerformanceReport = {
          overallScore: 87,
          responseTime: 245,
          throughput: 1250,
          errorRate: 0.8,
          uptime: 99.9,
          bottlenecks: 3,
          optimizations: 5
        };

        setMetrics(mockMetrics);
        setBottlenecks(mockBottlenecks);
        setReport(mockReport);
      } catch (err) {
        logger.error('Error fetching performance data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchPerformanceData, 30000);

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'api': return <Server className="w-4 h-4" />;
      case 'network': return <Globe className="w-4 h-4" />;
      case 'memory': return <Activity className="w-4 h-4" />;
      case 'cpu': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
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
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos de performance</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Score de Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Análisis de Performance</h2>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
            </select>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Score de Performance</p>
                  <p className="text-2xl font-bold">{report.overallScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Response Time</p>
                  <p className="text-2xl font-bold text-green-700">{report.responseTime}ms</p>
                </div>
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Throughput</p>
                  <p className="text-2xl font-bold text-blue-700">{report.throughput} req/s</p>
                </div>
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Error Rate</p>
                  <p className="text-2xl font-bold text-purple-700">{report.errorRate}%</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Optimizaciones */}
        {report && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{report.bottlenecks}</div>
              <div className="text-sm text-gray-500">Bottlenecks Detectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{report.optimizations}</div>
              <div className="text-sm text-gray-500">Optimizaciones Aplicadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.uptime}%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>
        )}
      </div>

      {/* Métricas Detalladas */}
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
              
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              
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

      {/* Bottlenecks Detectados */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Bottlenecks Detectados</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {bottlenecks.map((bottleneck) => (
            <div key={bottleneck.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(bottleneck.type)}
                    <h4 className="text-lg font-medium text-gray-900">
                      {bottleneck.type.toUpperCase()}
                    </h4>
                    <span className={`text-sm font-medium ${getSeverityColor(bottleneck.severity)}`}>
                      {bottleneck.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Prioridad: {bottleneck.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{bottleneck.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Impacto:</p>
                      <p className="text-gray-600">{bottleneck.impact}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tiempo Estimado:</p>
                      <p className="text-gray-600">{bottleneck.estimatedFix}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-medium text-gray-900">Recomendación:</p>
                    <p className="text-gray-600 text-sm">{bottleneck.recommendation}</p>
                  </div>
                </div>
                
                <div className="ml-6">
                  <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                    Aplicar Fix
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos de Performance (Placeholder) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias de Performance</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Gráficos de performance en tiempo real</p>
            <p className="text-sm text-gray-400">Response time, throughput, error rate</p>
          </div>
        </div>
      </div>
    </div>
  );
} 