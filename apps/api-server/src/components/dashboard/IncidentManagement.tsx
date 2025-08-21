'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Clock,
  User,
  MessageSquare,
  Bell,
  RefreshCw,
  Plus,
  Filter,
  Search
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  category: 'system' | 'security' | 'performance' | 'medical' | 'network';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  priority: number;
  impact: string;
  resolution?: string;
  tags: string[];
}

interface IncidentMetrics {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  high: number;
  averageResolutionTime: number;
}

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<IncidentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchIncidentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular datos de incidentes
        const mockIncidents: Incident[] = [
          {
            id: 'INC-001',
            title: 'API de Pacientes No Responde',
            description: 'El endpoint /api/patients está devolviendo errores 500 desde las 14:30',
            severity: 'critical',
            status: 'investigating',
            category: 'medical',
            assignedTo: 'admin@altamedica.com',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            priority: 1,
            impact: 'Pacientes no pueden acceder a sus datos médicos',
            tags: ['api', 'patients', 'critical']
          },
          {
            id: 'INC-002',
            title: 'Alto Uso de CPU en Servidor',
            description: 'El servidor principal muestra uso de CPU del 95%',
            severity: 'high',
            status: 'open',
            category: 'performance',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            priority: 2,
            impact: 'Degradación del rendimiento general',
            tags: ['performance', 'cpu', 'server']
          },
          {
            id: 'INC-003',
            title: 'Intento de Acceso No Autorizado',
            description: 'Múltiples intentos de login desde IP sospechosa',
            severity: 'high',
            status: 'resolved',
            category: 'security',
            assignedTo: 'security@altamedica.com',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            priority: 1,
            impact: 'Posible compromiso de seguridad',
            resolution: 'IP bloqueada y notificación enviada',
            tags: ['security', 'unauthorized', 'blocked']
          },
          {
            id: 'INC-004',
            title: 'Base de Datos Lenta',
            description: 'Queries de citas médicas tardan más de 5 segundos',
            severity: 'medium',
            status: 'open',
            category: 'performance',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            priority: 3,
            impact: 'Experiencia de usuario degradada',
            tags: ['database', 'performance', 'appointments']
          }
        ];

        const mockMetrics: IncidentMetrics = {
          total: 4,
          open: 2,
          investigating: 1,
          resolved: 1,
          critical: 1,
          high: 2,
          averageResolutionTime: 2.5 // horas
        };

        setIncidents(mockIncidents);
        setMetrics(mockMetrics);
      } catch (err) {
        logger.error('Error fetching incident data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidentData();

    // Actualizar cada 60 segundos
    const interval = setInterval(fetchIncidentData, 60000);

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
      case 'open': return 'text-red-600';
      case 'investigating': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4" />;
      case 'investigating': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Bell className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'performance': return <Clock className="w-4 h-4" />;
      case 'medical': return <User className="w-4 h-4" />;
      case 'network': return <MessageSquare className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const statusMatch = selectedStatus === 'all' || incident.status === selectedStatus;
    const severityMatch = selectedSeverity === 'all' || incident.severity === selectedSeverity;
    const searchMatch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && severityMatch && searchMatch;
  });

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
            <h3 className="text-sm font-medium text-red-800">Error al cargar incidentes</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Métricas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Incidentes</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Incidente
            </button>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Incidentes</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </div>
                <AlertTriangle className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Abiertos</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.open}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Investigando</p>
                  <p className="text-2xl font-bold text-yellow-700">{metrics.investigating}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Resueltos</p>
                  <p className="text-2xl font-bold text-green-700">{metrics.resolved}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Métricas Adicionales */}
        {metrics && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.critical}</div>
              <div className="text-sm text-gray-500">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.high}</div>
              <div className="text-sm text-gray-500">Altos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.averageResolutionTime}h</div>
              <div className="text-sm text-gray-500">Tiempo Promedio Resolución</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar incidentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="open">Abiertos</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resueltos</option>
              <option value="closed">Cerrados</option>
            </select>
            
            <select 
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todas las Severidades</option>
              <option value="critical">Críticos</option>
              <option value="high">Altos</option>
              <option value="medium">Medios</option>
              <option value="low">Bajos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Incidentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Incidentes ({filteredIncidents.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getCategoryIcon(incident.category)}
                    <h4 className="text-lg font-medium text-gray-900">{incident.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'open' ? 'text-red-600 bg-red-50' :
                      incident.status === 'investigating' ? 'text-yellow-600 bg-yellow-50' :
                      incident.status === 'resolved' ? 'text-green-600 bg-green-50' :
                      'text-gray-600 bg-gray-50'
                    }`}>
                      {getStatusIcon(incident.status)}
                      <span className="ml-1">
                        {incident.status === 'open' ? 'Abierto' :
                         incident.status === 'investigating' ? 'Investigando' :
                         incident.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                      </span>
                    </span>
                    <span className="text-sm text-gray-500">#{incident.id}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{incident.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Impacto:</p>
                      <p className="text-gray-600">{incident.impact}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Prioridad:</p>
                      <p className="text-gray-600">{incident.priority}</p>
                    </div>
                    {incident.assignedTo && (
                      <div>
                        <p className="font-medium text-gray-900">Asignado a:</p>
                        <p className="text-gray-600">{incident.assignedTo}</p>
                      </div>
                    )}
                    {incident.resolution && (
                      <div>
                        <p className="font-medium text-gray-900">Resolución:</p>
                        <p className="text-gray-600">{incident.resolution}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {incident.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-sm text-gray-500">
                    Creado: {new Date(incident.createdAt).toLocaleString('es-ES')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Actualizado: {new Date(incident.updatedAt).toLocaleString('es-ES')}
                  </div>
                  {incident.resolvedAt && (
                    <div className="text-sm text-green-600 mt-1">
                      Resuelto: {new Date(incident.resolvedAt).toLocaleString('es-ES')}
                    </div>
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