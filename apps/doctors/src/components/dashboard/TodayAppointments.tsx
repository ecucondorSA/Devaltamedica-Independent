/**
 * Componente de Citas del Día
 * Vista interactiva de agenda médica con gestión de estados
 */

'use client';

import React, { useState } from 'react';
import { TodayAppointment } from '@/hooks/useDashboard';

import { logger } from '@altamedica/shared/services/logger.service';
interface TodayAppointmentsProps {
  appointments: TodayAppointment[];
  isLoading: boolean;
  onMarkComplete: (appointmentId: string) => Promise<void>;
  onReschedule?: (appointmentId: string) => void;
  onViewPatient?: (patientId: string) => void;
  compactMode?: boolean;
}

interface AppointmentCardProps {
  appointment: TodayAppointment;
  onMarkComplete: (appointmentId: string) => Promise<void>;
  onReschedule?: (appointmentId: string) => void;
  onViewPatient?: (patientId: string) => void;
  compactMode?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onMarkComplete,
  onReschedule,
  onViewPatient,
  compactMode = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusColors = {
    SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusLabels = {
    SCHEDULED: 'Programada',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada'
  };

  const handleMarkComplete = async () => {
    setIsUpdating(true);
    try {
      await onMarkComplete(appointment.id);
    } catch (error) {
      logger.error('Error completando cita:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getTimeStatus = () => {
    const now = new Date();
    const appointmentTime = new Date();
    const [hours, minutes] = appointment.time.split(':').map(Number);
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes < -appointment.duration) return 'overdue';
    if (diffMinutes < 0) return 'current';
    if (diffMinutes < 15) return 'upcoming';
    return 'scheduled';
  };

  const timeStatus = getTimeStatus();
  const timeStatusClasses = {
    overdue: 'border-l-red-500',
    current: 'border-l-yellow-500',
    upcoming: 'border-l-orange-500',
    scheduled: 'border-l-blue-500'
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200
      border-l-4 ${timeStatusClasses[timeStatus]}
      ${appointment.isUrgent ? 'ring-2 ring-red-300' : ''}
      ${compactMode ? 'p-4' : 'p-6'}
    `}>
      {/* Header de la cita */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`font-semibold ${compactMode ? 'text-sm' : 'text-lg'} text-gray-900`}>
              {appointment.patientName}
            </h3>
            {appointment.isUrgent && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Urgente
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{appointment.time}</span>
              <span className="ml-1">({appointment.duration}min)</span>
            </div>
            
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{appointment.type}</span>
            </div>
          </div>
        </div>

        {/* Estado de la cita */}
        <span className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
          ${statusColors[appointment.status]}
        `}>
          {statusLabels[appointment.status]}
        </span>
      </div>

      {/* Notas de la cita */}
      {appointment.notes && !compactMode && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Notas:</span> {appointment.notes}
          </p>
        </div>
      )}

      {/* Indicadores de tiempo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-xs">
          {timeStatus === 'overdue' && (
            <span className="flex items-center text-red-600">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Atrasada
            </span>
          )}
          
          {timeStatus === 'current' && (
            <span className="flex items-center text-yellow-600">
              <svg className="h-3 w-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              En horario
            </span>
          )}
          
          {timeStatus === 'upcoming' && (
            <span className="flex items-center text-orange-600">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Próxima
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            {/* Botón Ver Paciente */}
            {onViewPatient && (
              <button
                onClick={() => onViewPatient('patient-id')} // En producción, usar el ID real
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver Paciente
              </button>
            )}

            {/* Botón Reprogramar */}
            {onReschedule && appointment.status === 'SCHEDULED' && (
              <button
                onClick={() => onReschedule(appointment.id)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reprogramar
              </button>
            )}
          </div>

          {/* Botón Completar */}
          {appointment.status === 'IN_PROGRESS' && (
            <button
              onClick={handleMarkComplete}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Completar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TodayAppointments: React.FC<TodayAppointmentsProps> = ({
  appointments,
  isLoading,
  onMarkComplete,
  onReschedule,
  onViewPatient,
  compactMode = false
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent'>('all');

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'pending') {
      return appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
    }
    if (filter === 'urgent') {
      return appointment.isUrgent;
    }
    return true;
  });

  const upcomingCount = appointments.filter(a => 
    a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
  ).length;

  const urgentCount = appointments.filter(a => a.isUrgent).length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Citas de Hoy</h2>
          <p className="text-sm text-gray-600">
            {appointments.length} cita{appointments.length !== 1 ? 's' : ''} programada{appointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todas ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pendientes ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'urgent' 
                ? 'bg-red-100 text-red-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Urgentes ({urgentCount})
          </button>
        </div>
      </div>

      {/* Lista de citas */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'No tienes citas programadas para hoy.'
              : `No hay citas ${filter === 'pending' ? 'pendientes' : 'urgentes'} para hoy.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onMarkComplete={onMarkComplete}
              onReschedule={onReschedule}
              onViewPatient={onViewPatient}
              compactMode={compactMode}
            />
          ))}
        </div>
      )}

      {/* Resumen en la parte inferior */}
      {appointments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Próxima cita: {appointments.find(a => a.status === 'SCHEDULED')?.time || 'No programada'}
            </span>
            <span>
              Tiempo total estimado: {appointments.reduce((sum, apt) => sum + apt.duration, 0)}min
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayAppointments;
