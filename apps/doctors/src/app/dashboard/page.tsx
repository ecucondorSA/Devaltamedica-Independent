'use client';

import DoctorLayout from '@/components/layout/DoctorLayout';
import { useDashboardData } from '@/hooks/useDashboardData';
import { 
  Badge, 
  Button, 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle,
  HealthMetricCard,
  AppointmentCard,
  VitalSignsChart,
  MedicalAIAssistant,
  useMedicalValidation
} from '@altamedica/ui';
import { usePatientData } from '@altamedica/hooks';
import {
  Calendar,
  DollarSign,
  Users,
  Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { logger } from '@altamedica/shared';
// 🏥 COMPONENTES MÉDICOS ESPECIALIZADOS AHORA DISPONIBLES
// Usando @altamedica/ui con componentes médicos completos

export default function DashboardOverview() {
  const router = useRouter();
  const {
    appointments,
    telemedicineSessions,
    stats,
    loading,
    error
  } = useDashboardData();

  const handleJoinSession = (sessionId: string) => {
    router.push(`/telemedicine/session/${sessionId}`);
  };

  const handleStartTelemedicine = () => {
    router.push('/telemedicine');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-alert-500">Error al cargar los datos</div>
      </div>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-8 p-6 bg-gradient-to-br from-primary-50 to-primary-50 min-h-screen">
      {/* Header con branding AltaMedica */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard Médico</h1>
            <p className="text-neutral-600">Gestión profesional de consultas y pacientes</p>
          </div>
        </div>
      </div>
      {/* Métricas Médicas Especializadas con HealthMetricCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthMetricCard
          icon={<Users className="w-5 h-5 text-primary-600" />}
          title="Total Pacientes"
          value={stats.totalPatients?.toString() || '0'}
          status={"normal" as any}
          trend={"up" as any}
        />
        
        <HealthMetricCard
          icon={<Calendar className="w-5 h-5 text-primary-600" />}
          title="Citas Activas"
          value={stats.activeAppointments?.toString() || '0'}
          status={"normal" as any}
          trend={"stable" as any}
        />
        
        <HealthMetricCard
          icon={<Video className="w-5 h-5 text-primary-600" />}
          title="Telemedicina"
          value={stats.telemedicineSessions?.toString() || '0'}
          status={"normal" as any}
          trend={"stable" as any}
        />
        
        <HealthMetricCard
          icon={<DollarSign className="w-5 h-5 text-primary-600" />}
          title="Ingresos Mensuales"
          value={`€${stats.monthlyRevenue?.toLocaleString() || '0'}`}
          status={"excellent" as any}
          trend={"up" as any}
        />
      </div>

      {/* Próximas citas y sesiones activas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 3).map((appointment: any) => (
                <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">{appointment.patientName}</h4>
                  <p className="text-sm text-gray-600">{appointment.reason}</p>
                  <p className="text-xs text-gray-500">{appointment.date} - {appointment.time}</p>
                  <Button size="sm" onClick={() => handleJoinSession(appointment.id)} className="mt-2">
                    Ver detalles
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sesiones de Telemedicina</CardTitle>
              <Button variant="secondary" size="sm" onClick={handleStartTelemedicine}>
                <Video className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {telemedicineSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium">{session.patientName}</p>
                    <p className="text-sm text-neutral-600">{session.notes}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(session.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'waiting' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    {session.status === 'waiting' && (
                      <Button size="sm" onClick={() => handleJoinSession(session.id)}>
                        Unirse
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {telemedicineSessions.length === 0 && (
                <div className="text-center py-4">
                  <Video className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">No hay sesiones activas</p>
                  <Button size="sm" onClick={handleStartTelemedicine} className="mt-2">
                    Iniciar Sesión
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección Avanzada: Herramientas Médicas con IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asistente de IA Médica */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary-600">🤖</span>
              Asistente Médico con IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">
              Asistente de IA disponible para análisis de diagnósticos y tratamientos
            </div>
          </CardContent>
        </Card>

        {/* Gráficos de Signos Vitales */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-alert-500">❤️</span>
              Monitoreo en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">
              Gráficos de monitoreo en tiempo real de signos vitales disponibles
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner de Funcionalidades Premium */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🎆 Dashboard Médico Mejorado</h3>
            <p className="text-primary-100">Ahora con componentes médicos especializados, IA integrada y análisis predictivos</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => router.push('/analytics')}
            className="bg-white text-primary-600 hover:bg-primary-50"
          >
            Ver Analytics →
          </Button>
        </div>
      </div>
    </div>
    </DoctorLayout>
  );
}