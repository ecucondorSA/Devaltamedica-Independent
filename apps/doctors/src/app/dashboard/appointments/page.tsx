'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Badge, Button } from '@altamedica/ui';
import {
  Calendar,
  Clock,
  FileText,
  Filter,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  User,
  Video,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { logger } from '@altamedica/shared';
// Componentes simples
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

// Componente de tarjeta de cita
const AppointmentCard = ({ appointment, onViewDetails, onCancel, onReschedule }: {
  appointment: any;
  onViewDetails: (appointmentId: string) => void;
  onCancel: (appointmentId: string) => void;
  onReschedule: (appointmentId: string) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const isTelemedicine = appointment.type.includes('telemedicine');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusText(appointment.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.date} • {appointment.time}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTelemedicine ? (
              <Video className="w-5 h-5 text-blue-600" />
            ) : (
              <MapPin className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Motivo de consulta:</p>
            <p className="text-sm text-gray-600">{appointment.reason}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{appointment.duration} min</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{appointment.patientPhone}</span>
            </div>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700">Notas:</p>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(appointment.id)}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver detalles
            </Button>
            {appointment.status === 'confirmed' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onReschedule(appointment.id)}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reagendar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onCancel(appointment.id)}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { appointments } = useDashboardData();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const handleViewAppointmentDetails = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  const handleCreateAppointment = () => {
    router.push('/appointments/new');
  };

  const handleCancelAppointment = (appointmentId: string) => {
    logger.info('Cancelar cita:', appointmentId);
    // Implementar lógica de cancelación
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}/reschedule`);
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus !== 'all' && appointment.status !== filterStatus) return false;
    if (filterType !== 'all') {
      if (filterType === 'telemedicine' && !appointment.type.includes('telemedicine')) return false;
      if (filterType === 'in-person' && appointment.type.includes('telemedicine')) return false;
    }
    return true;
  });

  const upcomingAppointments = filteredAppointments.filter((a: any) => a.status === 'confirmed');
  const pendingAppointments = filteredAppointments.filter((a: any) => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Citas</h2>
          <p className="text-gray-600">Gestiona tu agenda de citas médicas</p>
        </div>
        <Button onClick={handleCreateAppointment} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((a: any) => a.date === new Date().toLocaleDateString()).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telemedicina</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.type.includes('telemedicine')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Citas</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="telemedicine">Telemedicina</option>
                  <option value="in-person">Presencial</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
              <p className="text-gray-600 mb-4">
                No se encontraron citas con los filtros seleccionados
              </p>
              <Button onClick={handleCreateAppointment}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Nueva Cita
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onViewDetails={handleViewAppointmentDetails}
                  onCancel={handleCancelAppointment}
                  onReschedule={handleRescheduleAppointment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}