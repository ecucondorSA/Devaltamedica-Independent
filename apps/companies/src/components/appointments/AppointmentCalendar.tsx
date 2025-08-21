'use client';

import { Appointment, AppointmentStatus, Priority } from '@altamedica/types';
import { Badge } from '@altamedica/ui/badge';
import { Button } from '@altamedica/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@altamedica/ui/dialog';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, Mail, MapPin, Phone, Stethoscope, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuración del localizador para español
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Mensajes en español para el calendario
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  noEventsInRange: 'No hay citas en este rango de fechas.',
  showMore: (total: number) => `+ Ver más (${total})`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectAppointment?: (appointment: Appointment) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  view?: View;
  onViewChange?: (view: View) => void;
  date?: Date;
  onNavigate?: (date: Date) => void;
  loading?: boolean;
}

export default function AppointmentCalendar({
  appointments,
  onSelectAppointment,
  onSelectSlot,
  view = 'week',
  onViewChange,
  date = new Date(),
  onNavigate,
  loading = false
}: AppointmentCalendarProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Convertir citas a eventos del calendario
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.title} - ${appointment.patient?.name || appointment.patientName || 'Sin paciente'}`,
      start: new Date(appointment.start),
      end: new Date(appointment.end),
      resource: appointment,
    }));
  }, [appointments]);

  // Obtener color según estado de la cita
  const getEventStyle = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3b82f6'; // azul por defecto
    let borderColor = '#2563eb';

    switch (appointment.status) {
      case AppointmentStatus.SCHEDULED:
        backgroundColor = '#3b82f6'; // azul
        borderColor = '#2563eb';
        break;
      case AppointmentStatus.IN_PROGRESS:
        backgroundColor = '#f59e0b'; // amarillo
        borderColor = '#d97706';
        break;
      case AppointmentStatus.COMPLETED:
        backgroundColor = '#10b981'; // verde
        borderColor = '#059669';
        break;
      case AppointmentStatus.CANCELLED:
        backgroundColor = '#ef4444'; // rojo
        borderColor = '#dc2626';
        break;
      case AppointmentStatus.NO_SHOW:
        backgroundColor = '#9ca3af'; // gris
        borderColor = '#6b7280';
        break;
      case AppointmentStatus.RESCHEDULED:
        backgroundColor = '#8b5cf6'; // púrpura
        borderColor = '#7c3aed';
        break;
      default:
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
    }

    // Intensidad según prioridad
    if (appointment.priority === Priority.URGENT || appointment.priority === Priority.CRITICAL) {
      backgroundColor = '#dc2626'; // rojo para urgente/crítico
      borderColor = '#b91c1c';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px',
        boxShadow: appointment.priority === Priority.URGENT ? '0 4px 12px rgba(220, 38, 38, 0.4)' : undefined,
      }
    };
  };

  // Manejar selección de evento
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setShowDetailModal(true);
    onSelectAppointment?.(event.resource);
  };

  // Manejar selección de slot vacío
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    onSelectSlot?.(slotInfo);
  };

  // Formatear duración
  const formatDuration = (start: Date, end: Date) => {
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Obtener badge del estado
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      [AppointmentStatus.SCHEDULED]: { variant: 'default' as const, label: 'Programada' },
      [AppointmentStatus.IN_PROGRESS]: { variant: 'warning' as const, label: 'En Progreso' },
      [AppointmentStatus.COMPLETED]: { variant: 'success' as const, label: 'Completada' },
      [AppointmentStatus.CANCELLED]: { variant: 'destructive' as const, label: 'Cancelada' },
      [AppointmentStatus.NO_SHOW]: { variant: 'secondary' as const, label: 'No Show' },
      [AppointmentStatus.RESCHEDULED]: { variant: 'outline' as const, label: 'Reprogramada' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[AppointmentStatus.SCHEDULED];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Obtener badge de prioridad
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      [Priority.LOW]: { variant: 'secondary' as const, label: 'Baja' },
      [Priority.NORMAL]: { variant: 'default' as const, label: 'Normal' },
      [Priority.HIGH]: { variant: 'warning' as const, label: 'Alta' },
      [Priority.URGENT]: { variant: 'destructive' as const, label: 'Urgente' },
      [Priority.CRITICAL]: { variant: 'destructive' as const, label: 'Crítica' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[Priority.NORMAL];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-700">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles del calendario */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Calendario de Citas</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Total: {appointments.length} citas</span>
        </div>
      </div>

      {/* Calendario principal */}
      <Card className="p-0 overflow-hidden">
        <CardContent className="p-4">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              messages={messages}
              culture="es"
              view={view}
              onView={onViewChange}
              date={date}
              onNavigate={onNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={getEventStyle}
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 7, 0, 0)} // 7:00 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // 10:00 PM
              dayLayoutAlgorithm="no-overlap"
              popup
              popupOffset={{ x: 30, y: 20 }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                agendaTimeFormat: 'HH:mm',
                agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles de la cita */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  {selectedAppointment.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Estado y prioridad */}
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedAppointment.status)}
                  {getPriorityBadge(selectedAppointment.priority)}
                  {selectedAppointment.isVirtual && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Virtual
                    </Badge>
                  )}
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Horario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Fecha:</strong> {format(new Date(selectedAppointment.start), 'PPP', { locale: es })}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Hora:</strong> {format(new Date(selectedAppointment.start), 'HH:mm')} - {format(new Date(selectedAppointment.end), 'HH:mm')}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Duración:</strong> {formatDuration(new Date(selectedAppointment.start), new Date(selectedAppointment.end))}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedAppointment.isVirtual ? (
                        <>
                          <p className="text-sm text-gray-600">Consulta Virtual</p>
                          {selectedAppointment.meetingUrl && (
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => window.open(selectedAppointment.meetingUrl, '_blank')}
                            >
                              Unirse a la reunión
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedAppointment.location || 'Por definir'}
                          </p>
                          {selectedAppointment.room && (
                            <p className="text-sm text-gray-600">
                              <strong>Sala:</strong> {selectedAppointment.room}
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Información del doctor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Doctor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{selectedAppointment.doctor.name}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.doctor.specialty}</p>
                      {selectedAppointment.doctor.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedAppointment.doctor.phone}
                        </p>
                      )}
                      {selectedAppointment.doctor.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedAppointment.doctor.email}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Información del paciente */}
                {(selectedAppointment.patient || selectedAppointment.patientName) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {selectedAppointment.patient?.name || selectedAppointment.patientName}
                        </p>
                        {selectedAppointment.patient?.age && (
                          <p className="text-sm text-gray-600">
                            <strong>Edad:</strong> {selectedAppointment.patient.age} años
                          </p>
                        )}
                        {selectedAppointment.patient?.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedAppointment.patient.phone}
                          </p>
                        )}
                        {selectedAppointment.patient?.email && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedAppointment.patient.email}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descripción y notas */}
                {(selectedAppointment.description || selectedAppointment.doctorNotes) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Notas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAppointment.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Descripción:</p>
                          <p className="text-sm text-gray-600">{selectedAppointment.description}</p>
                        </div>
                      )}
                      {selectedAppointment.doctorNotes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Notas del doctor:</p>
                          <p className="text-sm text-gray-600">{selectedAppointment.doctorNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </Button>
                  <Button variant="outline">
                    Editar
                  </Button>
                  {selectedAppointment.status === AppointmentStatus.SCHEDULED && (
                    <Button>
                      Iniciar Consulta
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
