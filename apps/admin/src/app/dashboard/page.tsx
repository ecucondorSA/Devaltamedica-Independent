'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Cpu,
  Database,
  DollarSign,
  FileText,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@altamedica/auth';
import { logger } from '@altamedica/shared';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HealthMetricCard,
  SystemHealthMonitor,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VitalSignsChart,
} from '@altamedica/ui';
import Analytics from '../../components/dashboard/Analytics';

interface AdminMetrics {
  totalUsers: number;
  activeSessions: number;
  reportsGenerated: number;
  monthlyRevenue: number;
  systemHealth: 'excellent' | 'normal' | 'warning' | 'critical';
  securityAlerts: number;
  dataIntegrity: number;
  serverUptime: number;
  responseTime: number;
  errorRate: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics] = useState<AdminMetrics>({
    totalUsers: 12345,
    activeSessions: 456,
    reportsGenerated: 789,
    monthlyRevenue: 45678,
    systemHealth: 'excellent',
    securityAlerts: 3,
    dataIntegrity: 99.8,
    serverUptime: 99.95,
    responseTime: 250,
    errorRate: 0.02,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Tabs
      defaultValue="overview"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50"
    >
      {/* Tab Navigation */}
      <div className="border-b bg-white px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-orange-600">
              <span className="text-xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestión integral de la plataforma AltaMedica</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {user?.displayName || user?.email || 'Administrador'} | Super Admin
          </p>
        </div>
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Completo
          </TabsTrigger>
        </TabsList>
      </div>
      {/* Overview Tab - Original Dashboard */}
      <TabsContent value="overview" className="space-y-8 p-6">
        {/* Métricas Principales con HealthMetricCard */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <HealthMetricCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            title="Usuarios Totales"
            value={metrics.totalUsers.toLocaleString()}
            status="excellent"
            trend="up"
            description="Pacientes, doctores y administradores"
          />

          <HealthMetricCard
            icon={<Activity className="h-5 w-5 text-green-600" />}
            title="Sesiones Activas"
            value={metrics.activeSessions.toString()}
            status="normal"
            trend="stable"
            description="Usuarios conectados actualmente"
          />

          <HealthMetricCard
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            title="Ingresos Mensuales"
            value={formatCurrency(metrics.monthlyRevenue)}
            status="excellent"
            trend="up"
            description="Facturación total del mes"
          />

          <HealthMetricCard
            icon={<FileText className="h-5 w-5 text-purple-600" />}
            title="Reportes Generados"
            value={metrics.reportsGenerated.toString()}
            status="normal"
            trend="up"
            description="Reportes médicos y administrativos"
          />
        </div>

        {/* Métricas de Sistema y Seguridad */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">Estado del Sistema</h3>
                <Cpu className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{metrics.serverUptime}%</span>
                <span className="mb-1 text-sm text-gray-500">uptime</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Sistema Estable</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">Alertas de Seguridad</h3>
                <AlertTriangle
                  className={`h-5 w-5 ${
                    metrics.securityAlerts > 0 ? 'text-orange-500' : 'text-green-500'
                  }`}
                />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{metrics.securityAlerts}</span>
                <span className="mb-1 text-sm text-gray-500">pendientes</span>
              </div>
              <Badge
                className={
                  metrics.securityAlerts > 0
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {metrics.securityAlerts > 0 ? 'Requiere Atención' : 'Seguro'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">Integridad de Datos</h3>
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{metrics.dataIntegrity}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${metrics.dataIntegrity}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección Avanzada: Monitoreo del Sistema */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Monitor de Salud del Sistema */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-500">🖥️</span>
                Monitoreo del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SystemHealthMonitor
                services={[
                  {
                    name: 'API Server',
                    status: 'healthy',
                    uptime: 99.95,
                    responseTime: 120,
                  },
                  {
                    name: 'Database',
                    status: 'healthy',
                    uptime: 99.99,
                    responseTime: 45,
                  },
                  {
                    name: 'Storage',
                    status: 'healthy',
                    uptime: 99.98,
                    responseTime: 80,
                  },
                  {
                    name: 'Auth Service',
                    status: 'warning',
                    uptime: 99.85,
                    responseTime: 200,
                  },
                  {
                    name: 'Analytics',
                    status: 'healthy',
                    uptime: 99.92,
                    responseTime: 150,
                  },
                ]}
                onServiceClick={(service) =>
                  logger.info('Service details:', JSON.stringify(service))
                }
              />
            </CardContent>
          </Card>

          {/* Gráfico de Performance */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                Performance del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VitalSignsChart
                data={[
                  {
                    timestamp: new Date(Date.now() - 45 * 60 * 1000),
                    heartRate: metrics.responseTime,
                    bloodPressure: {
                      systolic: metrics.serverUptime,
                      diastolic: metrics.dataIntegrity,
                    },
                    temperature: 98 - metrics.errorRate * 100,
                  },
                  {
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    heartRate: metrics.responseTime + 10,
                    bloodPressure: {
                      systolic: metrics.serverUptime,
                      diastolic: metrics.dataIntegrity,
                    },
                    temperature: 98 - metrics.errorRate * 100 + 0.5,
                  },
                  {
                    timestamp: new Date(Date.now() - 15 * 60 * 1000),
                    heartRate: metrics.responseTime - 5,
                    bloodPressure: {
                      systolic: metrics.serverUptime,
                      diastolic: metrics.dataIntegrity,
                    },
                    temperature: 98 - metrics.errorRate * 100 - 0.2,
                  },
                  {
                    timestamp: new Date(),
                    heartRate: metrics.responseTime,
                    bloodPressure: {
                      systolic: metrics.serverUptime,
                      diastolic: metrics.dataIntegrity,
                    },
                    temperature: 98 - metrics.errorRate * 100,
                  },
                ]}
                metrics={['heartRate']}
                timeRange="1h"
              />
            </CardContent>
          </Card>
        </div>

        {/* Actividad Reciente y Acciones Rápidas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Actividad Reciente del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Backup automático completado
                    </p>
                    <p className="text-xs text-gray-500">
                      Base de datos respaldada exitosamente - hace 2 horas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <Users className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Nuevos usuarios registrados
                    </p>
                    <p className="text-xs text-gray-500">
                      23 pacientes y 2 doctores se registraron hoy
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-orange-50 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Alerta de rendimiento</p>
                    <p className="text-xs text-gray-500">
                      Tiempo de respuesta elevado en el servidor API - hace 1 hora
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/users/new" passHref>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-sky-200 px-4 py-3 text-left text-sm hover:border-sky-300 hover:bg-sky-50 transition-colors"
                  >
                    👤 Crear Nuevo Usuario
                  </button>
                </Link>
                <Link href="/reports/new" passHref>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-green-200 px-4 py-3 text-left text-sm hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    📊 Generar Reporte Médico
                  </button>
                </Link>
                <Link href="/settings" passHref>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-orange-200 px-4 py-3 text-left text-sm hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    ⚙️ Configuración del Sistema
                  </button>
                </Link>
                <Link href="/security" passHref>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-red-200 px-4 py-3 text-left text-sm hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    🔒 Centro de Seguridad
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banner de Admin Premium */}
        <div className="rounded-xl bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-xl font-bold">⚡ Panel de Super Administración</h3>
              <p className="text-red-100">
                Control total sobre la plataforma AltaMedica con herramientas avanzadas de
                monitoreo
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg bg-white px-4 py-2 font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Auditoría HIPAA →
              </button>
            </div>
          </div>
        </div>
      </TabsContent>
      {/* Analytics Tab - New Component */}
      <TabsContent value="analytics" className="p-6">
        <Analytics />
      </TabsContent>
    </Tabs>
  );
}
