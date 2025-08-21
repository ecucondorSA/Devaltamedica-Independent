'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Users, 
  User, 
  Activity, 
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'doctor' | 'patient' | 'nurse';
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActivity: string;
  status: 'active' | 'idle' | 'offline';
  actions: number;
  pages: string[];
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  averageSessionTime: number;
  topPages: { page: string; visits: number }[];
  deviceUsage: { device: string; percentage: number }[];
  userRoles: { role: string; count: number }[];
}

export default function UserActivity() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular datos de usuarios
        const mockSessions: UserSession[] = [
          {
            id: 'session-001',
            userId: 'user-001',
            userName: 'Dr. María González',
            userRole: 'doctor',
            device: 'desktop',
            browser: 'Chrome',
            ip: '192.168.1.100',
            location: 'Madrid, España',
            loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date().toISOString(),
            status: 'active',
            actions: 45,
            pages: ['/dashboard', '/patients', '/appointments']
          },
          {
            id: 'session-002',
            userId: 'user-002',
            userName: 'Juan Pérez',
            userRole: 'patient',
            device: 'mobile',
            browser: 'Safari',
            ip: '10.0.0.50',
            location: 'Barcelona, España',
            loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            status: 'idle',
            actions: 12,
            pages: ['/profile', '/appointments']
          },
          {
            id: 'session-003',
            userId: 'user-003',
            userName: 'Admin Sistema',
            userRole: 'admin',
            device: 'desktop',
            browser: 'Firefox',
            ip: '192.168.1.101',
            location: 'Madrid, España',
            loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'offline',
            actions: 89,
            pages: ['/admin', '/dashboard', '/logs', '/settings']
          },
          {
            id: 'session-004',
            userId: 'user-004',
            userName: 'Enfermera Ana López',
            userRole: 'nurse',
            device: 'tablet',
            browser: 'Chrome',
            ip: '10.0.0.51',
            location: 'Valencia, España',
            loginTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            lastActivity: new Date().toISOString(),
            status: 'active',
            actions: 23,
            pages: ['/patients', '/vitals', '/medications']
          }
        ];

        const mockMetrics: UserMetrics = {
          totalUsers: 1250,
          activeUsers: 89,
          newUsers: 12,
          averageSessionTime: 45,
          topPages: [
            { page: '/dashboard', visits: 234 },
            { page: '/patients', visits: 189 },
            { page: '/appointments', visits: 156 },
            { page: '/profile', visits: 98 }
          ],
          deviceUsage: [
            { device: 'Desktop', percentage: 65 },
            { device: 'Mobile', percentage: 25 },
            { device: 'Tablet', percentage: 10 }
          ],
          userRoles: [
            { role: 'Doctors', count: 45 },
            { role: 'Patients', count: 1200 },
            { role: 'Nurses', count: 23 },
            { role: 'Admins', count: 5 }
          ]
        };

        setSessions(mockSessions);
        setMetrics(mockMetrics);
      } catch (err) {
        logger.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUserData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'idle': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'offline': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-50';
      case 'doctor': return 'text-blue-600 bg-blue-50';
      case 'nurse': return 'text-green-600 bg-green-50';
      case 'patient': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Activity className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const roleMatch = selectedRole === 'all' || session.userRole === selectedRole;
    const statusMatch = selectedStatus === 'all' || session.status === selectedStatus;
    const searchMatch = session.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return roleMatch && statusMatch && searchMatch;
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
            <h3 className="text-sm font-medium text-red-800">Error al cargar actividad de usuarios</h3>
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
          <h2 className="text-xl font-semibold text-gray-900">Actividad de Usuarios</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <Activity className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <TrendingUp className="w-4 h-4 mr-2" />
              Reporte
            </button>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Usuarios Totales</p>
                  <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-green-700">{metrics.activeUsers}</p>
                </div>
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Nuevos Hoy</p>
                  <p className="text-2xl font-bold text-purple-700">{metrics.newUsers}</p>
                </div>
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Sesión Promedio</p>
                  <p className="text-2xl font-bold text-orange-700">{metrics.averageSessionTime}m</p>
                </div>
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Distribución por Roles */}
        {metrics && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Distribución por Roles</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.userRoles.map((role) => (
                <div key={role.role} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{role.count}</div>
                  <div className="text-sm text-gray-500">{role.role}</div>
                </div>
              ))}
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
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los Roles</option>
              <option value="admin">Administradores</option>
              <option value="doctor">Doctores</option>
              <option value="nurse">Enfermeras</option>
              <option value="patient">Pacientes</option>
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="idle">Inactivos</option>
              <option value="offline">Desconectados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sesiones Activas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sesiones Activas ({filteredSessions.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredSessions.map((session) => (
            <div key={session.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-900">{session.userName}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(session.userRole)}`}>
                      {session.userRole === 'admin' ? 'Administrador' :
                       session.userRole === 'doctor' ? 'Doctor' :
                       session.userRole === 'nurse' ? 'Enfermera' : 'Paciente'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1">
                        {session.status === 'active' ? 'Activo' :
                         session.status === 'idle' ? 'Inactivo' : 'Desconectado'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(session.device)}
                      <span className="text-gray-600">{session.browser}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{session.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{session.ip}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Acciones:</span> {session.actions} • 
                      <span className="font-medium ml-2">Login:</span> {new Date(session.loginTime).toLocaleTimeString('es-ES')} • 
                      <span className="font-medium ml-2">Última actividad:</span> {new Date(session.lastActivity).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Páginas visitadas:</span> {session.pages.join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="ml-6">
                  <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Páginas Más Visitadas */}
      {metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Páginas Más Visitadas</h3>
          <div className="space-y-3">
            {metrics.topPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{page.page}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(page.visits / metrics.topPages[0].visits) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{page.visits} visitas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uso por Dispositivo */}
      {metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uso por Dispositivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.deviceUsage.map((device) => (
              <div key={device.device} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{device.percentage}%</div>
                <div className="text-sm text-gray-500">{device.device}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 