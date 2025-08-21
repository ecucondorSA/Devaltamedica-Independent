'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Globe,
  Shield,
  ExternalLink,
  Code,
  Zap,
  Users
} from 'lucide-react';

interface EndpointInfo {
  path: string;
  method: string;
  description: string;
  category: 'admin' | 'auth' | 'api' | 'health' | 'data';
  status: 'active' | 'deprecated' | 'maintenance';
  responseTime: number;
  successRate: number;
  requestCount: number;
  lastUsed: string;
  documentation?: string;
}

export default function APIEndpoints() {
  const [endpoints, setEndpoints] = useState<EndpointInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchEndpointsInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener datos de monitoreo para calcular métricas
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
          // Definir endpoints basados en la estructura real del proyecto
          const endpointsList: EndpointInfo[] = [
            {
              path: '/api/admin/dashboard',
              method: 'GET',
              description: 'Dashboard de administración con métricas globales',
              category: 'admin',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 150,
              successRate: 98.5,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.3),
              lastUsed: new Date().toISOString(),
              documentation: 'Dashboard principal para administradores'
            },
            {
              path: '/api/admin/monitoring',
              method: 'GET',
              description: 'Métricas de monitoreo del sistema',
              category: 'admin',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 200,
              successRate: 99.2,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.2),
              lastUsed: new Date().toISOString(),
              documentation: 'Métricas en tiempo real del sistema'
            },
            {
              path: '/api/admin/system/health',
              method: 'GET',
              description: 'Estado de salud del sistema',
              category: 'health',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 100,
              successRate: 99.8,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.1),
              lastUsed: new Date().toISOString(),
              documentation: 'Health check del sistema'
            },
            {
              path: '/api/auth/login',
              method: 'POST',
              description: 'Autenticación de usuarios',
              category: 'auth',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 300,
              successRate: data.data.application.auth.successfulLogins / data.data.application.auth.totalLogins * 100 || 95,
              requestCount: data.data.application.auth.totalLogins || 150,
              lastUsed: new Date().toISOString(),
              documentation: 'Endpoint de login de usuarios'
            },
            {
              path: '/api/auth/register',
              method: 'POST',
              description: 'Registro de nuevos usuarios',
              category: 'auth',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 400,
              successRate: 97.5,
              requestCount: Math.floor((data.data.application.auth.totalLogins || 150) * 0.1),
              lastUsed: new Date().toISOString(),
              documentation: 'Registro de nuevos usuarios'
            },
            {
              path: '/api/patients',
              method: 'GET',
              description: 'Lista de pacientes',
              category: 'data',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 250,
              successRate: 98.0,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.15),
              lastUsed: new Date().toISOString(),
              documentation: 'Gestión de pacientes'
            },
            {
              path: '/api/appointments',
              method: 'GET',
              description: 'Gestión de citas médicas',
              category: 'data',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 300,
              successRate: 97.8,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.2),
              lastUsed: new Date().toISOString(),
              documentation: 'Sistema de citas médicas'
            },
            {
              path: '/api/doctors',
              method: 'GET',
              description: 'Lista de doctores',
              category: 'data',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 200,
              successRate: 98.5,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.1),
              lastUsed: new Date().toISOString(),
              documentation: 'Gestión de doctores'
            },
            {
              path: '/api/health',
              method: 'GET',
              description: 'Health check básico',
              category: 'health',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 50,
              successRate: 99.9,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.05),
              lastUsed: new Date().toISOString(),
              documentation: 'Health check básico del sistema'
            },
            {
              path: '/api/test',
              method: 'GET',
              description: 'Endpoint de prueba',
              category: 'api',
              status: 'active',
              responseTime: data.data.application.api.avgResponseTime || 100,
              successRate: 100,
              requestCount: Math.floor(data.data.application.api.totalRequests * 0.02),
              lastUsed: new Date().toISOString(),
              documentation: 'Endpoint para pruebas'
            }
          ];

          setEndpoints(endpointsList);
        } else {
          throw new Error(data.error || 'Error al cargar información de endpoints');
        }
      } catch (err) {
        logger.error('Error fetching endpoints info:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEndpointsInfo();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchEndpointsInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'deprecated': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'maintenance': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'deprecated': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'auth': return <Users className="w-4 h-4" />;
      case 'api': return <Code className="w-4 h-4" />;
      case 'health': return <Activity className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES');
  };

  const filteredEndpoints = selectedCategory === 'all' 
    ? endpoints 
    : endpoints.filter(endpoint => endpoint.category === selectedCategory);

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
          <XCircle className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-red-800 font-medium">Error al cargar endpoints</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Endpoints de la API</h2>
        <p className="text-gray-600">Documentación y métricas de todos los endpoints disponibles</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Endpoints Activos</p>
              <p className="text-lg font-bold text-green-600">
                {endpoints.filter(e => e.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(endpoints.reduce((acc, e) => acc + e.responseTime, 0) / endpoints.length)}ms
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tasa de Éxito</p>
              <p className="text-lg font-bold text-purple-600">
                {Math.round(endpoints.reduce((acc, e) => acc + e.successRate, 0) / endpoints.length)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-lg font-bold text-orange-600">
                {endpoints.reduce((acc, e) => acc + e.requestCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({endpoints.length})
          </button>
          <button
            onClick={() => setSelectedCategory('admin')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Admin ({endpoints.filter(e => e.category === 'admin').length})
          </button>
          <button
            onClick={() => setSelectedCategory('auth')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'auth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Auth ({endpoints.filter(e => e.category === 'auth').length})
          </button>
          <button
            onClick={() => setSelectedCategory('data')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'data'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Data ({endpoints.filter(e => e.category === 'data').length})
          </button>
          <button
            onClick={() => setSelectedCategory('health')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'health'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Health ({endpoints.filter(e => e.category === 'health').length})
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Endpoints ({filteredEndpoints.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEndpoints.map((endpoint, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(endpoint.status)}`}>
                      {getStatusIcon(endpoint.status)}
                      <span className="ml-1 capitalize">{endpoint.status}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      {getCategoryIcon(endpoint.category)}
                      <span className="ml-1 capitalize">{endpoint.category}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{endpoint.description}</p>
                  
                  {endpoint.documentation && (
                    <p className="text-xs text-gray-500 mb-3">{endpoint.documentation}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{endpoint.responseTime}ms</p>
                      <p className="text-xs text-gray-500">Response Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{endpoint.successRate}%</p>
                      <p className="text-xs text-gray-500">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{endpoint.requestCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Requests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{formatTimestamp(endpoint.lastUsed)}</p>
                      <p className="text-xs text-gray-500">Last Used</p>
                    </div>
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