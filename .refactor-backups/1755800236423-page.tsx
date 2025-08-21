'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Plus,
  MapPin,
  Video,
  Phone,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Edit,
  Trash2
} from 'lucide-react';

// Tipos TypeScript
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  location: string;
  avatar: string;
  consultationFee: number;
  availableSlots: string[];
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  location?: string;
  isTelemedicine: boolean;
  estimatedDuration: number;
}

export default function AppointmentsPage() {
  // Estados
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(1);

  // Estados del formulario de cita
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation' as const,
    reason: '',
    symptoms: '',
    isTelemedicine: false,
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          doctorId: 'doc1',
          doctorName: 'Dr. García López',
          specialty: 'Cardiología',
          date: '2025-06-27',
          time: '10:00',
          type: 'consultation',
          status: 'confirmed',
          reason: 'Chequeo cardiológico de rutina',
          isTelemedicine: false,
          estimatedDuration: 30
        },
        {
          id: '2',
          doctorId: 'doc2',
          doctorName: 'Dra. María Ruiz',
          specialty: 'Medicina General',
          date: '2025-07-02',
          time: '14:30',
          type: 'follow_up',
          status: 'scheduled',
          reason: 'Seguimiento de resultados de laboratorio',
          isTelemedicine: true,
          estimatedDuration: 20
        }
      ];

      const mockDoctors: Doctor[] = [
        {
          id: 'doc1',
          name: 'Dr. García López',
          specialty: 'Cardiología',
          rating: 4.8,
          experience: 15,
          location: 'Centro Médico AltaMedica',
          avatar: '/api/placeholder/64/64',
          consultationFee: 800,
          availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
        },
        {
          id: 'doc2',
          name: 'Dra. María Ruiz',
          specialty: 'Medicina General',
          rating: 4.9,
          experience: 12,
          location: 'Clínica Norte',
          avatar: '/api/placeholder/64/64',
          consultationFee: 600,
          availableSlots: ['08:00', '09:00', '10:00', '16:00', '17:00']
        },
        {
          id: 'doc3',
          name: 'Dr. Roberto Silva',
          specialty: 'Dermatología',
          rating: 4.7,
          experience: 10,
          location: 'Centro Dermatológico',
          avatar: '/api/placeholder/64/64',
          consultationFee: 750,
          availableSlots: ['11:00', '12:00', '15:00', '16:00']
        }
      ];

      setAppointments(mockAppointments);
      setDoctors(mockDoctors);
      setLoading(false);
    } catch {
      // logger.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'routine_checkup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookAppointment = async () => {
    try {
      // Aquí llamarías a tu API POST /api/v1/appointments
      const newAppointment = {
        ...bookingForm,
        doctorName: selectedDoctor?.name || '',
        specialty: selectedDoctor?.specialty || '',
        status: 'scheduled' as const,
        id: Date.now().toString(),
        estimatedDuration: 30
      };

      setAppointments([...appointments, newAppointment]);
      setShowBookingModal(false);
      setBookingStep(1);
      setBookingForm({
        doctorId: '',
        date: '',
        time: '',
        type: 'consultation',
        reason: '',
        symptoms: '',
        isTelemedicine: false,
        urgency: 'normal'
      });
      setSelectedDoctor(null);

      // Mostrar mensaje de éxito
      alert('¡Cita agendada exitosamente!');
    } catch (error) {
      logger.error('Error booking appointment:', error);
      alert('Error al agendar la cita. Inténtalo de nuevo.');
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      try {
        // Aquí llamarías a tu API DELETE /api/v1/appointments/[id]
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        ));
        alert('Cita cancelada exitosamente');
      } catch (error) {
        logger.error('Error cancelling appointment:', error);
        alert('Error al cancelar la cita');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Citas Médicas</h1>
              <p className="text-gray-600">Gestiona tus citas y agenda nuevas consultas</p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agendar Cita
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por doctor o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las citas</option>
                  <option value="scheduled">Programadas</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
                <ChevronDown className="w-5 h-5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Lista de Citas */}
        <div className="space-y-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                          {appointment.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{appointment.specialty}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {appointment.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.time} ({appointment.estimatedDuration} min)
                        </div>
                        <div className="flex items-center">
                          {appointment.isTelemedicine ? (
                            <>
                              <Video className="w-4 h-4 mr-1" />
                              Teleconsulta
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 mr-1" />
                              Presencial
                            </>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm">
                        <strong>Motivo:</strong> {appointment.reason}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      {appointment.status === 'confirmed' && appointment.isTelemedicine && (
                        <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          <Video className="w-4 h-4 mr-1" />
                          Unirse
                        </button>
                      )}
                      
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <>
                          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                          <button 
                            onClick={() => cancelAppointment(appointment.id)}
                            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron citas</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Intenta cambiar los filtros de búsqueda' 
                  : 'Agenda tu primera cita médica'}
              </p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agendar Primera Cita
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Reserva */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Agendar Nueva Cita - Paso {bookingStep} de 3
              </h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingStep(1);
                  setSelectedDoctor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Paso 1: Seleccionar Doctor */}
              {bookingStep === 1 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Selecciona un Doctor</h3>
                  <div className="space-y-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setBookingForm({ ...bookingForm, doctorId: doctor.id });
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDoctor?.id === doctor.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm text-gray-600">{doctor.rating}</span>
                              </div>
                              <span className="text-sm text-gray-600">{doctor.experience} años exp.</span>
                              <span className="text-sm text-gray-600">${doctor.consultationFee}</span>
                            </div>
                          </div>
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 2: Fecha y Hora */}
              {bookingStep === 2 && selectedDoctor && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Selecciona Fecha y Hora</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora Disponible
                      </label>
                      <select
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar hora</option>
                        {selectedDoctor.availableSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Consulta
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, isTelemedicine: false })}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          !bookingForm.isTelemedicine
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MapPin className="w-5 h-5 mb-2" />
                        <div className="font-medium">Presencial</div>
                        <div className="text-sm text-gray-600">En consultorio</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, isTelemedicine: true })}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          bookingForm.isTelemedicine
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Video className="w-5 h-5 mb-2" />
                        <div className="font-medium">Teleconsulta</div>
                        <div className="text-sm text-gray-600">Video llamada</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Detalles */}
              {bookingStep === 3 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Detalles de la Consulta</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Consulta
                      </label>
                      <select
                        value={bookingForm.type}
                        onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value as any })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="consultation">Consulta General</option>
                        <option value="follow_up">Seguimiento</option>
                        <option value="routine_checkup">Chequeo de Rutina</option>
                        <option value="emergency">Emergencia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de la Consulta
                      </label>
                      <textarea
                        value={bookingForm.reason}
                        onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                        rows={3}
                        placeholder="Describe el motivo de tu consulta..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Síntomas (Opcional)
                      </label>
                      <textarea
                        value={bookingForm.symptoms}
                        onChange={(e) => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                        rows={2}
                        placeholder="Describe tus síntomas..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgencia
                      </label>
                      <select
                        value={bookingForm.urgency}
                        onChange={(e) => setBookingForm({ ...bookingForm, urgency: e.target.value as any })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Baja</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Navegación */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    if (bookingStep > 1) {
                      setBookingStep(bookingStep - 1);
                    } else {
                      setShowBookingModal(false);
                      setBookingStep(1);
                      setSelectedDoctor(null);
                    }
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {bookingStep > 1 ? 'Anterior' : 'Cancelar'}
                </button>

                <button
                  onClick={() => {
                    if (bookingStep < 3) {
                      if (bookingStep === 1 && !selectedDoctor) {
                        alert('Por favor selecciona un doctor');
                        return;
                      }
                      if (bookingStep === 2 && (!bookingForm.date || !bookingForm.time)) {
                        alert('Por favor selecciona fecha y hora');
                        return;
                      }
                      setBookingStep(bookingStep + 1);
                    } else {
                      if (!bookingForm.reason.trim()) {
                        alert('Por favor ingresa el motivo de la consulta');
                        return;
                      }
                      handleBookAppointment();
                    }
                  }}
                  disabled={bookingStep === 1 && !selectedDoctor}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {bookingStep < 3 ? 'Siguiente' : 'Agendar Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
