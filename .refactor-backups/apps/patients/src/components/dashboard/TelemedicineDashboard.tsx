"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Heart,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Progress } from '@altamedica/ui';
import { useAuth  } from '@altamedica/auth';;
import { useToast } from '../../hooks/useToast';

import { logger } from '@altamedica/shared/services/logger.service';
interface TelemedicineStats {
  activeSessions: number;
  totalSessions: number;
  averageDuration: number;
  participantsOnline: number;
  connectionQuality: {
    excellent: number;
    good: number;
    poor: number;
  };
  sessionsByType: {
    consultation: number;
    follow_up: number;
    emergency: number;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    cpu: number;
    memory: number;
    network: number;
  };
}

interface Session {
  id: string;
  roomId: string;
  patientName: string;
  doctorName: string;
  startTime: Date;
  duration: number;
  status: 'active' | 'waiting' | 'ended';
  participants: number;
  connectionQuality: 'excellent' | 'good' | 'poor';
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function TelemedicineDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<TelemedicineStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/telemedicine/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch active sessions
      const sessionsResponse = await fetch('/api/telemedicine?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setActiveSessions(sessionsData.sessions);
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/notifications?type=telemedicine', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications);
      }

      setLastUpdated(new Date());
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error al cargar datos',
        description: 'No se pudieron cargar las estadísticas del dashboard',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get connection quality color
  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get system health icon
  const getSystemHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Telemedicina</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo en tiempo real de sesiones y métricas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalSessions || 0} totales hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.participantsOnline || 0}</div>
            <p className="text-xs text-muted-foreground">
              En sesiones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.averageDuration || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por sesión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calidad de Conexión</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.connectionQuality?.excellent || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Excelente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health and Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getSystemHealthIcon(stats?.systemHealth?.status || 'unknown')}
              <span>Estado del Sistema</span>
            </CardTitle>
            <CardDescription>
              Monitoreo de recursos y rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU</span>
                <span>{stats?.systemHealth?.cpu || 0}%</span>
              </div>
              <Progress value={stats?.systemHealth?.cpu || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memoria</span>
                <span>{stats?.systemHealth?.memory || 0}%</span>
              </div>
              <Progress value={stats?.systemHealth?.memory || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Red</span>
                <span>{stats?.systemHealth?.network || 0}%</span>
              </div>
              <Progress value={stats?.systemHealth?.network || 0} className="h-2" />
            </div>

            <Badge className={getStatusColor(stats?.systemHealth?.status || 'unknown')}>
              {stats?.systemHealth?.status || 'unknown'}
            </Badge>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sesiones Activas</CardTitle>
            <CardDescription>
              Sesiones de telemedicina en curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay sesiones activas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">
                          {session.patientName} - {session.doctorName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Iniciada: {session.startTime.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">
                        {session.participants} participantes
                      </Badge>
                      
                      <div className={`flex items-center space-x-1 ${getConnectionColor(session.connectionQuality)}`}>
                        {session.connectionQuality === 'excellent' ? (
                          <Wifi className="w-4 h-4" />
                        ) : (
                          <WifiOff className="w-4 h-4" />
                        )}
                        <span className="text-sm capitalize">{session.connectionQuality}</span>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Sesiones por Tipo</span>
            </CardTitle>
            <CardDescription>
              Distribución de tipos de consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Consultas</span>
                </div>
                <span className="font-medium">{stats?.sessionsByType?.consultation || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Seguimiento</span>
                </div>
                <span className="font-medium">{stats?.sessionsByType?.follow_up || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Emergencias</span>
                </div>
                <span className="font-medium">{stats?.sessionsByType?.emergency || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Calidad de Conexión</span>
            </CardTitle>
            <CardDescription>
              Distribución de calidad de conexión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Excelente</span>
                </div>
                <span className="font-medium">{stats?.connectionQuality?.excellent || 0}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Buena</span>
                </div>
                <span className="font-medium">{stats?.connectionQuality?.good || 0}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Pobre</span>
                </div>
                <span className="font-medium">{stats?.connectionQuality?.poor || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Recientes</CardTitle>
          <CardDescription>
            Alertas y eventos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay notificaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                    {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                    {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleString()}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      Nuevo
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 