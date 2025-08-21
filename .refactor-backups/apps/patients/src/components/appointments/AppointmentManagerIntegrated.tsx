/**
 * Gestor de Citas Integrado - Usa los nuevos hooks del backend dockerizado
 * Permite crear, actualizar, cancelar y gestionar citas médicas
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  useUpcomingAppointments,
  useAppointmentHistory,
  useDoctors,
  useDoctorAvailability,
  useCreateAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
  useAppointmentsManager,
  type CreateAppointmentRequest,
  type Doctor
} from '../../hooks/useIntegratedServices';

interface AppointmentManagerIntegratedProps {
  patientId: string;
}

const AppointmentManagerIntegrated: React.FC<AppointmentManagerIntegratedProps> = ({
  patientId
}) => {
  // Estados locales
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'book'>('upcoming');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentReason, setAppointmentReason] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'follow_up' | 'telemedicine'>('consultation');

  // Hooks para datos
  const { data: upcomingAppointments, isLoading: loadingUpcoming } = useUpcomingAppointments(patientId);
  const { data: appointmentHistory, isLoading: loadingHistory } = useAppointmentHistory(patientId);
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors();
  
  // Hook para disponibilidad del doctor seleccionado
  const { data: availability, isLoading: loadingAvailability } = useDoctorAvailability(
    selectedDoctor?.id,
    selectedDate,
    selectedDate // mismo día para start y end
  );

  // Hooks para acciones
  const {
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    isCreating,
    isCanceling,
    isRescheduling,
    createError,
    cancelError,
    rescheduleError
  } = useAppointmentsManager();

  // Manejar creación de cita
  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert('Por favor, selecciona doctor, fecha y hora');
      return;
    }

    const appointmentData: CreateAppointmentRequest = {
      patientId,
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time: selectedTime,
      type: appointmentType,
      reason: appointmentReason || 'Consulta general',
      duration: appointmentType === 'consultation' ? 30 : 20
    };

    try {
      await createAppointment.mutateAsync(appointmentData);
      
      // Limpiar formulario
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setAppointmentReason('');
      
      // Cambiar a tab de próximas citas
      setActiveTab('upcoming');
      
      alert('¡Cita creada exitosamente!');
    } catch (error) {
      logger.error('Error creating appointment:', error);
      alert('Error al crear la cita. Por favor, intenta de nuevo.');
    }
  };

  // Manejar cancelación de cita
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return;
    }

    try {
      await cancelAppointment.mutateAsync({
        appointmentId,
        cancelData: {
          reason: 'Cancelado por el paciente',
          cancelledBy: 'patient'
        }
      });
      
      alert('Cita cancelada exitosamente');
    } catch (error) {
      logger.error('Error canceling appointment:', error);
      alert('Error al cancelar la cita. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Citas</h1>
        <p className="text-gray-600">Programa, modifica y consulta tus citas médicas</p>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Próximas Citas ({upcomingAppointments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'book'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Agendar Nueva Cita
          </button>
        </nav>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Próximas Citas</h2>
          
          {loadingUpcoming ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando citas...</span>
            </div>
          ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          Dr. {appointment.doctorName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmada' : 
                           appointment.status === 'scheduled' ? 'Programada' : appointment.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Fecha:</span>
                          <div>{new Date(appointment.date).toLocaleDateString('es-MX')}</div>
                        </div>
                        <div>
                          <span className="font-medium">Hora:</span>
                          <div>{appointment.time}</div>
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span>
                          <div className="capitalize">
                            {appointment.type === 'consultation' ? 'Consulta' :
                             appointment.type === 'follow_up' ? 'Seguimiento' :
                             appointment.type === 'telemedicine' ? 'Telemedicina' : appointment.type}
                          </div>
                        </div>
                      </div>
                      
                      {appointment.reason && (
                        <div className="mt-2">
                          <span className="font-medium text-sm">Motivo:</span>
                          <p className="text-gray-600">{appointment.reason}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {appointment.type === 'telemedicine' && (
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Unirse
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={isCanceling}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isCanceling ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes citas próximas</h3>
              <p className="text-gray-600 mb-4">¿Necesitas agendar una consulta médica?</p>
              <button
                onClick={() => setActiveTab('book')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agendar Cita
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Historial de Citas</h2>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando historial...</span>
            </div>
          ) : appointmentHistory && appointmentHistory.length > 0 ? (
            <div className="space-y-4">
              {appointmentHistory.map((appointment) => (
                <div key={appointment.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Dr. {appointment.doctorName}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{new Date(appointment.date).toLocaleDateString('es-MX')} - {appointment.time}</div>
                        <div className="capitalize">{appointment.type}</div>
                        {appointment.reason && <div className="mt-1">{appointment.reason}</div>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status === 'completed' ? 'Completada' : 
                       appointment.status === 'cancelled' ? 'Cancelada' : appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay historial de citas disponible</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'book' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Agendar Nueva Cita</h2>
          
          <div className="bg-white border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selección de doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Doctor
                </label>
                
                {loadingDoctors ? (
                  <div className="border rounded-lg p-4">
                    <div className="animate-pulse">Cargando doctores...</div>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {doctorsData?.doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedDoctor?.id === doctor.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-sm text-gray-600">{doctor.specialty}</div>
                        {doctor.rating && (
                          <div className="text-sm text-yellow-600">
                            ⭐ {doctor.rating}/5
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Formulario de cita */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cita
                  </label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="consultation">Consulta General</option>
                    <option value="follow_up">Seguimiento</option>
                    <option value="telemedicine">Telemedicina</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                {selectedDoctor && selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horarios Disponibles
                    </label>
                    
                    {loadingAvailability ? (
                      <div className="border rounded-lg p-4">
                        <div className="animate-pulse">Cargando horarios...</div>
                      </div>
                    ) : availability?.slots && availability.slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availability.slots
                          .filter(slot => slot.available)
                          .map((slot) => (
                          <button
                            key={`${slot.date}-${slot.time}`}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-2 text-sm border rounded ${
                              selectedTime === slot.time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay horarios disponibles para esta fecha</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Consulta (Opcional)
                  </label>
                  <textarea
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Describe brevemente el motivo de tu consulta..."
                  />
                </div>
                
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      Error: {createError.message}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleCreateAppointment}
                  disabled={!selectedDoctor || !selectedDate || !selectedTime || isCreating}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagerIntegrated;