'use client';

import React, { useMemo, useState } from 'react';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string | Date;
  time: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  location?: string;
  roomNumber?: string;
  isVirtual?: boolean;
  reason?: string;
  preparationInstructions?: string;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  compact?: boolean;
  showCalendar?: boolean;
  allowScheduling?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onReschedule?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  compact = false,
  showCalendar = false,
  allowScheduling = false,
  onAppointmentClick,
  onReschedule,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  // Clasificar citas
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.date) >= now && apt.status !== 'cancelled',
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.date) < now || apt.status === 'completed',
  );
  const todayAppointments = upcomingAppointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === now.toDateString();
  });

  // Obtener especialidades únicas
  const specialties = useMemo(() => {
    const uniqueSpecialties = new Set(appointments.map((apt) => apt.specialty));
    return Array.from(uniqueSpecialties);
  }, [appointments]);

  // Filtrar citas por especialidad
  const filteredAppointments =
    filterSpecialty === 'all'
      ? upcomingAppointments
      : upcomingAppointments.filter((apt) => apt.specialty === filterSpecialty);

  // Obtener próxima cita
  const nextAppointment = upcomingAppointments[0];

  // Estilos para tipos de cita
  const getAppointmentTypeStyle = (type: Appointment['type']) => {
    const styles: Record<Appointment['type'], { bg: string; text: string; icon: string }> = {
      consultation: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👨‍⚕️' },
      'follow-up': { bg: 'bg-green-100', text: 'text-green-800', icon: '🔄' },
      procedure: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🏥' },
      emergency: { bg: 'bg-red-100', text: 'text-red-800', icon: '🚨' },
      telemedicine: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '💻' },
    };
    return styles[type] || styles.consultation;
  };

  // Vista compacta
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Próximas Citas</h3>
          {upcomingAppointments.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {upcomingAppointments.length} programadas
            </span>
          )}
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">📅</span>
            <p className="text-gray-500">No hay citas programadas</p>
            {allowScheduling && (
              <button className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm">
                Agendar cita
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 3).map((apt) => {
              const daysUntil = Math.ceil(
                (new Date(apt.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              const typeStyle = getAppointmentTypeStyle(apt.type);

              return (
                <button
                  key={apt.id}
                  onClick={() => onAppointmentClick?.(apt)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{typeStyle.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{apt.doctorName}</p>
                        <p className="text-sm text-gray-600">{apt.specialty}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(apt.date).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}{' '}
                          -{' '}
                          {new Date(apt.date).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {daysUntil === 0 && (
                        <span className="text-xs font-medium text-red-600">Hoy</span>
                      )}
                      {daysUntil === 1 && (
                        <span className="text-xs font-medium text-orange-600">Mañana</span>
                      )}
                      {daysUntil > 1 && daysUntil <= 7 && (
                        <span className="text-xs font-medium text-blue-600">
                          En {daysUntil} días
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {upcomingAppointments.length > 3 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver {upcomingAppointments.length - 3} citas más...
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestión de Citas Médicas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {todayAppointments.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {todayAppointments.length} cita{todayAppointments.length > 1 ? 's' : ''} hoy
                  •{' '}
                </span>
              )}
              {upcomingAppointments.length} cita{upcomingAppointments.length !== 1 ? 's' : ''}{' '}
              próxima{upcomingAppointments.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {showCalendar && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendario
                </button>
              </div>
            )}

            {allowScheduling && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                <span className="mr-2">➕</span>
                Nueva Cita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Próxima cita destacada */}
      {nextAppointment && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">⏰</div>
              <div>
                <p className="text-sm font-medium text-blue-800">Próxima cita</p>
                <p className="font-semibold text-gray-900">
                  {nextAppointment.doctorName} - {nextAppointment.specialty}
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(nextAppointment.date).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  a las{' '}
                  {new Date(nextAppointment.date).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {nextAppointment.isVirtual && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Unirse a videollamada
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowPastAppointments(!showPastAppointments)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPastAppointments
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Mostrar pasadas ({pastAppointments.length})
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAppointments.length} resultado{filteredAppointments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {filteredAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onReschedule={() => onReschedule?.(apt.id)}
                onCancel={() => onCancel?.(apt.id)}
                onClick={() => onAppointmentClick?.(apt)}
              />
            ))}

            {showPastAppointments && pastAppointments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Citas Pasadas
                </h3>
                <div className="space-y-3 opacity-60">
                  {pastAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      isPast={true}
                      onClick={() => onAppointmentClick?.(apt)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Vista de calendario próximamente</p>
          </div>
        )}
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-gray-600">Este mes:</span>
              <span className="ml-1 font-medium text-gray-900">
                {
                  appointments.filter((apt) => {
                    const aptDate = new Date(apt.date);
                    return (
                      aptDate.getMonth() === now.getMonth() &&
                      aptDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }{' '}
                citas
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Asistencia:</span>
              <span className="ml-1 font-medium text-green-600">
                {Math.round(
                  (appointments.filter((apt) => apt.status === 'completed').length /
                    appointments.length) *
                    100,
                )}
                %
              </span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Ver historial completo
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta de cita
const AppointmentCard: React.FC<{
  appointment: Appointment;
  isPast?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  onClick?: () => void;
}> = ({ appointment, isPast = false, onReschedule, onCancel, onClick }) => {
  const typeStyle = {
    consultation: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👨‍⚕️' },
    'follow-up': { bg: 'bg-green-100', text: 'text-green-800', icon: '🔄' },
    procedure: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🏥' },
    emergency: { bg: 'bg-red-100', text: 'text-red-800', icon: '🚨' },
    telemedicine: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '💻' },
  }[appointment.type] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📅' };

  const statusStyle = {
    scheduled: { text: 'text-blue-600', label: 'Programada' },
    confirmed: { text: 'text-green-600', label: 'Confirmada' },
    'in-progress': { text: 'text-yellow-600', label: 'En progreso' },
    completed: { text: 'text-gray-600', label: 'Completada' },
    cancelled: { text: 'text-red-600', label: 'Cancelada' },
    'no-show': { text: 'text-orange-600', label: 'No asistió' },
  }[appointment.status];

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
        isPast ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${typeStyle.bg}`}>
            <span className="text-2xl">{typeStyle.icon}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">{appointment.doctorName}</h4>
              <span className={`text-xs font-medium ${statusStyle.text}`}>
                • {statusStyle.label}
              </span>
              {appointment.isVirtual && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  Virtual
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-1">{appointment.specialty}</p>

            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {new Date(appointment.date).toLocaleDateString('es-MX', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(appointment.date).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {appointment.location && (
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {appointment.location}
                </span>
              )}
            </div>

            {appointment.reason && (
              <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                Motivo: {appointment.reason}
              </p>
            )}

            {appointment.preparationInstructions && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                <p className="text-xs font-medium text-yellow-800">Preparación requerida:</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {appointment.preparationInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {!isPast && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <div className="flex items-center space-x-2">
            {onReschedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule();
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reprogramar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
            {onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancelar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
