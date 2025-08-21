'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Eye,
  Lock,
  Activity,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Database,
  Globe,
  Server
} from 'lucide-react';

interface SecurityThreat {
  id: string;
  type: 'intrusion' | 'malware' | 'ddos' | 'data_breach' | 'unauthorized_access';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'investigating';
  timestamp: string;
  source: string;
  target: string;
  description: string;
  impact: string;
  mitigation: string;
}

interface SecurityMetrics {
  totalThreats: number;
  activeThreats: number;
  resolvedThreats: number;
  criticalThreats: number;
  securityScore: number;
  lastScan: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface SecurityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network';
  message: string;
  source: string;
  user?: string;
  ip?: string;
  action?: string;
}

export default function SecurityMonitoring() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular datos de seguridad
        const mockThreats: SecurityThreat[] = [
          {
            id: 'threat-001',
            type: 'unauthorized_access',
            severity: 'high',
            status: 'active',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            source: '192.168.1.100',
            target: '/api/patients',
            description: 'Intento de acceso no autorizado a datos de pacientes',
            impact: 'Posible exposición de datos médicos sensibles',
            mitigation: 'Bloqueo de IP y notificación a administrador'
          },
          {
            id: 'threat-002',
            type: 'ddos',
            severity: 'medium',
            status: 'resolved',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            source: 'Multiple IPs',
            target: '/api/health',
            description: 'Ataque DDoS detectado en endpoint de health check',
            impact: 'Degradación temporal del servicio',
            mitigation: 'Activación de protección DDoS automática'
          },
          {
            id: 'threat-003',
            type: 'data_breach',
            severity: 'critical',
            status: 'investigating',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            source: 'Internal',
            target: 'Database',
            description: 'Posible filtración de datos médicos',
            impact: 'Exposición de información de pacientes',
            mitigation: 'Auditoría completa y notificación a autoridades'
          }
        ];

        const mockMetrics: SecurityMetrics = {
          totalThreats: 15,
          activeThreats: 2,
          resolvedThreats: 13,
          criticalThreats: 1,
          securityScore: 87,
          lastScan: new Date().toISOString(),
          vulnerabilities: {
            critical: 1,
            high: 3,
            medium: 7,
            low: 12
          }
        };

        const mockLogs: SecurityLog[] = [
          {
            id: 'log-001',
            timestamp: new Date().toISOString(),
            level: 'warning',
            category: 'authentication',
            message: 'Múltiples intentos de login fallidos',
            source: '192.168.1.100',
            user: 'admin',
            ip: '192.168.1.100',
            action: 'LOGIN_ATTEMPT'
          },
          {
            id: 'log-002',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            level: 'error',
            category: 'authorization',
            message: 'Acceso denegado a recurso médico',
            source: 'API Gateway',
            user: 'doctor_123',
            ip: '10.0.0.50',
            action: 'ACCESS_DENIED'
          },
          {
            id: 'log-003',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            level: 'info',
            category: 'data_access',
            message: 'Acceso autorizado a historial médico',
            source: 'Medical API',
            user: 'doctor_456',
            ip: '10.0.0.51',
            action: 'DATA_ACCESS'
          }
        ];

        setThreats(mockThreats);
        setMetrics(mockMetrics);
        setSecurityLogs(mockLogs);
      } catch (err) {
        logger.error('Error fetching security data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSecurityData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'resolved': return 'text-green-600';
      case 'investigating': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'intrusion': return <Shield className="w-4 h-4" />;
      case 'malware': return <Zap className="w-4 h-4" />;
      case 'ddos': return <Globe className="w-4 h-4" />;
      case 'data_breach': return <Database className="w-4 h-4" />;
      case 'unauthorized_access': return <Lock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredThreats = selectedFilter === 'all' 
    ? threats 
    : threats.filter(threat => threat.status === selectedFilter);

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
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos de seguridad</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Métricas de Seguridad */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Monitoreo de Seguridad</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </button>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Score de Seguridad</p>
                  <p className="text-2xl font-bold">{metrics.securityScore}%</p>
                </div>
                <Shield className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Amenazas Activas</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.activeThreats}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Críticas</p>
                  <p className="text-2xl font-bold text-orange-700">{metrics.criticalThreats}</p>
                </div>
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Resueltas</p>
                  <p className="text-2xl font-bold text-blue-700">{metrics.resolvedThreats}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Vulnerabilidades */}
        {metrics && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Vulnerabilidades Detectadas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.vulnerabilities.critical}</div>
                <div className="text-sm text-gray-500">Críticas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.vulnerabilities.high}</div>
                <div className="text-sm text-gray-500">Altas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{metrics.vulnerabilities.medium}</div>
                <div className="text-sm text-gray-500">Medias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.vulnerabilities.low}</div>
                <div className="text-sm text-gray-500">Bajas</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros de Amenazas */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'resolved', 'investigating'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedFilter === filter
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'Todas' : 
               filter === 'active' ? 'Activas' :
               filter === 'resolved' ? 'Resueltas' : 'Investigando'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Amenazas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Amenazas de Seguridad</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredThreats.map((threat) => (
            <div key={threat.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getThreatIcon(threat.type)}
                    <h4 className="text-lg font-medium text-gray-900">
                      {threat.type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(threat.status)}`}>
                      {threat.status === 'active' ? 'Activa' :
                       threat.status === 'resolved' ? 'Resuelta' : 'Investigando'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{threat.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Origen:</p>
                      <p className="text-gray-600">{threat.source}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Objetivo:</p>
                      <p className="text-gray-600">{threat.target}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Impacto:</p>
                      <p className="text-gray-600">{threat.impact}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mitigación:</p>
                      <p className="text-gray-600">{threat.mitigation}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(threat.timestamp).toLocaleString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs de Seguridad */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Logs de Seguridad en Tiempo Real</h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {securityLogs.map((log) => (
            <div key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{log.category}</span>
                    {log.user && (
                      <span className="text-sm text-gray-600">Usuario: {log.user}</span>
                    )}
                    {log.ip && (
                      <span className="text-sm text-gray-600">IP: {log.ip}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Fuente: {log.source}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 