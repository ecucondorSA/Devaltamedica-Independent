'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { getAppointmentService, type CreateAppointmentRequest } from '@altamedica/database/services';
import { authService } from '../../services/auth-service';

import { logger } from '@altamedica/shared/services/logger.service';
import { Doctor } from '@altamedica/types';

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function AppointmentBooking() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'follow_up' | 'emergency' | 'telemedicine'>('consultation');
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  
  // Available data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Load initial data
  useEffect(() => {
    loadSpecialties();
    loadDoctors();
  }, []);

  // Load doctors when specialty changes
  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctorsBySpecialty(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  // Load available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    try {
      // Mock specialties for now - in real implementation this would come from API
      setSpecialties([
        'Cardiología',
        'Dermatología',
        'Endocrinología',
        'Gastroenterología',
        'Ginecología',
        'Neurología',
        'Oftalmología',
        'Ortopedia',
        'Pediatría',
        'Psiquiatría',
        'Radiología',
        'Urología'
      ]);
    } catch (error) {
      logger.error('Error cargando especialidades:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      // Mock doctors for now - in real implementation this would come from API
      const mockDoctors: Doctor[] = [
        {
          id: '1',
          first_name: 'Dr. María',
          last_name: 'González',
          specialty: 'Cardiología',
          medical_license: 'MED-001'
        },
        {
          id: '2',
          first_name: 'Dr. Carlos',
          last_name: 'Rodríguez',
          specialty: 'Dermatología',
          medical_license: 'MED-002'
        },
        {
          id: '3',
          first_name: 'Dra. Ana',
          last_name: 'Martínez',
          specialty: 'Pediatría',
          medical_license: 'MED-003'
        }
      ];
      setDoctors(mockDoctors);
    } catch (error) {
      logger.error('Error cargando doctores:', error);
    }
  };

  const loadDoctorsBySpecialty = async (specialty: string) => {
    try {
      // Filter doctors by specialty
      const filteredDoctors = doctors.filter(doctor => 
        doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
      setDoctors(filteredDoctors);
    } catch (error) {
      logger.error('Error cargando doctores por especialidad:', error);
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    try {
      // Mock available slots - in real implementation this would come from API
      const slots: TimeSlot[] = [
        { time: '09:00', available: true },
        { time: '09:30', available: true },
        { time: '10:00', available: false },
        { time: '10:30', available: true },
        { time: '11:00', available: true },
        { time: '11:30', available: false },
        { time: '14:00', available: true },
        { time: '14:30', available: true },
        { time: '15:00', available: true },
        { time: '15:30', available: false },
        { time: '16:00', available: true },
        { time: '16:30', available: true }
      ];
      setAvailableSlots(slots);
    } catch (error) {
      logger.error('Error cargando horarios disponibles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate form
      if (!selectedDoctor || !selectedDate || !selectedTime || !reason) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Create appointment data
      const appointmentData: CreateAppointmentRequest = {
        doctor_id: selectedDoctor,
        appointment_type: appointmentType,
        scheduled_at: `${selectedDate}T${selectedTime}:00.000Z`,
        duration_minutes: 30,
        reason,
        symptoms: symptoms || undefined
      };

      // Create appointment
      const appointment = await getAppointmentService().createAppointment(appointmentData);
      
      setSuccess(true);
      
      // Redirect to appointments page after 2 seconds
      setTimeout(() => {
        router.push('/appointments');
      }, 2000);

    } catch (error) {
      logger.error('Error creando cita:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months from now
    return maxDate.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Cita Programada!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cita ha sido programada exitosamente. Recibirás una confirmación por email.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              Serás redirigido a tu panel de citas en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Programar Cita Médica
            </h1>
            <p className="text-gray-600">
              Selecciona tu médico, fecha y hora para programar tu consulta
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Cita */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'consultation', label: 'Consulta General', icon: Stethoscope },
                  { value: 'follow_up', label: 'Seguimiento', icon: User },
                  { value: 'emergency', label: 'Urgencia', icon: AlertCircle },
                  { value: 'telemedicine', label: 'Telemedicina', icon: Clock }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setAppointmentType(type.value as any)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      appointmentType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Especialidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una especialidad</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médico
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona un médico</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Hora */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedTime === slot.time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : slot.available
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Consulta *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe brevemente el motivo de tu consulta..."
                required
              />
            </div>

            {/* Síntomas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Síntomas (opcional)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tus síntomas si los tienes..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Programando cita...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Programar Cita
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 