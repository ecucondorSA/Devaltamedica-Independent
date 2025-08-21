'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
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
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Stethoscope,
  FileText,
  Shield,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

import { logger } from '@altamedica/shared/services/logger.service';
// Tipos TypeScript
import { Doctor } from '@altamedica/types';

interface AppointmentForm {
  doctorId: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  symptoms: string;
  isTelemedicine: boolean;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  insurance: string;
  notes: string;
}

interface Specialty {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  commonReasons: string[];
}

export default function NewAppointmentPage() {
  // Estados principales
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<AppointmentForm>({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    reason: '',
    symptoms: '',
    isTelemedicine: false,
    urgency: 'normal',
    insurance: '',
    notes: ''
  });

  // Especialidades médicas
  const specialties: Specialty[] = [
    {
      id: 'cardiology',
      name: 'Cardiología',
      icon: <Heart className="w-8 h-8" />,
      description: 'Especialidad médica que se encarga del diagnóstico y tratamiento de las enfermedades del corazón y del sistema circulatorio.',
      commonReasons: ['Dolor en el pecho', 'Palpitaciones', 'Hipertensión', 'Chequeo cardiológico']
    },
    {
      id: 'dermatology',
      name: 'Dermatología',
      icon: <Shield className="w-8 h-8" />,
      description: 'Especialidad médica que se encarga del diagnóstico y tratamiento de las enfermedades de la piel.',
      commonReasons: ['Erupciones cutáneas', 'Acné', 'Manchas en la piel', 'Alergias cutáneas']
    },
    {
      id: 'general',
      name: 'Medicina General',
      icon: <Stethoscope className="w-8 h-8" />,
      description: 'Atención médica integral para adultos, incluyendo prevención, diagnóstico y tratamiento.',
      commonReasons: ['Chequeo general', 'Gripe y resfriados', 'Dolor de cabeza', 'Fatiga']
    },
    {
      id: 'orthopedics',
      name: 'Ortopedia',
      icon: <User className="w-8 h-8" />,
      description: 'Especialidad médica que se encarga del diagnóstico y tratamiento de lesiones y enfermedades del sistema musculoesquelético.',
      commonReasons: ['Dolor de espalda', 'Lesiones deportivas', 'Artritis', 'Fracturas']
    },
    {
      id: 'pediatrics',
      name: 'Pediatría',
      icon: <Heart className="w-8 h-8" />,
      description: 'Especialidad médica que se encarga del cuidado de la salud de los niños y adolescentes.',
      commonReasons: ['Control pediátrico', 'Vacunas', 'Fiebre', 'Problemas de crecimiento']
    },
    {
      id: 'psychology',
      name: 'Psicología',
      icon: <User className="w-8 h-8" />,
      description: 'Especialidad que se encarga del estudio y tratamiento de los procesos mentales y el comportamiento humano.',
      commonReasons: ['Ansiedad', 'Depresión', 'Estrés', 'Problemas de relación']
    }
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      const filtered = doctors.filter(doctor => 
        doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) &&
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [selectedSpecialty, searchTerm, doctors]);

  const loadDoctors = async () => {
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockDoctors: Doctor[] = [
        {
          id: 'doc1',
          name: 'Dr. Carlos García López',
          specialty: 'Cardiología',
          rating: 4.8,
          experience: 15,
          location: 'Centro Médico AltaMedica',
          avatar: '/api/placeholder/64/64',
          consultationFee: 800,
          availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
          description: 'Cardiólogo con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.',
          languages: ['Español', 'Inglés'],
          education: ['Universidad de Buenos Aires', 'Especialización en Cardiología'],
          certifications: ['Sociedad Argentina de Cardiología', 'American College of Cardiology'],
          isTelemedicine: true
        },
        {
          id: 'doc2',
          name: 'Dra. María Ruiz Fernández',
          specialty: 'Medicina General',
          rating: 4.9,
          experience: 12,
          location: 'Clínica Norte',
          avatar: '/api/placeholder/64/64',
          consultationFee: 600,
          availableSlots: ['08:00', '09:00', '10:00', '16:00', '17:00'],
          description: 'Médica general con amplia experiencia en atención primaria y medicina preventiva.',
          languages: ['Español', 'Portugués'],
          education: ['Universidad Nacional de Córdoba', 'Medicina General'],
          certifications: ['Colegio Médico de Córdoba'],
          isTelemedicine: true
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
          availableSlots: ['11:00', '12:00', '15:00', '16:00'],
          description: 'Dermatólogo especializado en el diagnóstico y tratamiento de enfermedades de la piel.',
          languages: ['Español', 'Inglés'],
          education: ['Universidad de La Plata', 'Especialización en Dermatología'],
          certifications: ['Sociedad Argentina de Dermatología'],
          isTelemedicine: false
        },
        {
          id: 'doc4',
          name: 'Dra. Ana Martínez',
          specialty: 'Psicología',
          rating: 4.6,
          experience: 8,
          location: 'Centro de Salud Mental',
          avatar: '/api/placeholder/64/64',
          consultationFee: 500,
          availableSlots: ['13:00', '14:00', '15:00', '16:00', '17:00'],
          description: 'Psicóloga clínica especializada en terapia cognitivo-conductual y manejo del estrés.',
          languages: ['Español'],
          education: ['Universidad de Buenos Aires', 'Psicología Clínica'],
          certifications: ['Colegio de Psicólogos de Buenos Aires'],
          isTelemedicine: true
        }
      ];

      setDoctors(mockDoctors);
    } catch (error) {
      logger.error('Error loading doctors:', error);
    }
  };

  const handleSpecialtySelect = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
    setCurrentStep(2);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctorId: doctor.id,
      isTelemedicine: doctor.isTelemedicine
    }));
    setCurrentStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, date }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, time }));
  };

  const handleFormChange = (field: keyof AppointmentForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulación de envío - en producción llamarías a tu API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowConfirmation(true);
      setCurrentStep(5);
    } catch (error) {
      logger.error('Error booking appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link href="/appointments" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a citas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Cita Médica</h1>
        <p className="text-gray-600">Selecciona la especialidad médica que necesitas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.map((specialty) => (
          <button
            key={specialty.id}
            onClick={() => handleSpecialtySelect(specialty.id)}
            className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                {specialty.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{specialty.name}</h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{specialty.description}</p>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Motivos comunes:</p>
              <ul className="text-xs text-gray-600">
                {specialty.commonReasons.slice(0, 3).map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button 
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cambiar especialidad
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona un médico - {specialties.find(s => s.id === selectedSpecialty)?.name}
        </h2>
        <p className="text-gray-600">Encuentra el profesional que mejor se adapte a tus necesidades</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar médico por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => handleDoctorSelect(doctor)}
            className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{doctor.specialty}</p>
                <p className="text-sm text-gray-500 mb-3">{doctor.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {doctor.location}
                    </span>
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {doctor.experience} años
                    </span>
                    {doctor.isTelemedicine && (
                      <span className="flex items-center text-blue-600">
                        <Video className="w-4 h-4 mr-1" />
                        Telemedicina
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">${doctor.consultationFee}</p>
                    <p className="text-sm text-gray-500">por consulta</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button 
          onClick={() => setCurrentStep(2)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cambiar médico
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona fecha y hora</h2>
        <p className="text-gray-600">Elige el momento que mejor te convenga</p>
      </div>

      {selectedDoctor && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={selectedDoctor.avatar}
              alt={selectedDoctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
              <p className="text-gray-600">{selectedDoctor.specialty}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selección de fecha */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Fecha de la cita</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
              const dayNumber = date.getDate();
              
              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateSelect(dateStr)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedDate === dateStr
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xs font-medium">{dayName}</div>
                  <div className="text-lg font-semibold">{dayNumber}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selección de hora */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Hora de la cita</h3>
          <div className="grid grid-cols-3 gap-2">
            {selectedDoctor?.availableSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedTime === time
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(selectedDate && selectedTime) && (
        <div className="mt-8">
          <button
            onClick={() => setCurrentStep(4)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuar con los detalles
          </button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <button 
          onClick={() => setCurrentStep(3)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cambiar fecha/hora
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detalles de la cita</h2>
        <p className="text-gray-600">Proporciona información adicional para tu consulta</p>
      </div>

      <div className="space-y-6">
        {/* Tipo de cita */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de cita
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleFormChange('type', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="consultation">Consulta general</option>
            <option value="follow_up">Seguimiento</option>
            <option value="emergency">Urgencia</option>
            <option value="routine_checkup">Chequeo de rutina</option>
          </select>
        </div>

        {/* Motivo de la consulta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de la consulta
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleFormChange('reason', e.target.value)}
            placeholder="Describe brevemente el motivo de tu consulta..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Síntomas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Síntomas (opcional)
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => handleFormChange('symptoms', e.target.value)}
            placeholder="Describe los síntomas que estás experimentando..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Urgencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de urgencia
          </label>
          <select
            value={formData.urgency}
            onChange={(e) => handleFormChange('urgency', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        {/* Notas adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            placeholder="Cualquier información adicional que consideres importante..."
            rows={2}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Resumen de la cita */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Resumen de la cita</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Médico:</span>
              <span className="font-medium">{selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Especialidad:</span>
              <span className="font-medium">{selectedDoctor?.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modalidad:</span>
              <span className="font-medium">
                {selectedDoctor?.isTelemedicine ? 'Telemedicina' : 'Presencial'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo:</span>
              <span className="font-medium">${selectedDoctor?.consultationFee}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !formData.reason}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Confirmando cita...' : 'Confirmar cita'}
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-green-50 p-8 rounded-lg">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita confirmada!</h2>
        <p className="text-gray-600 mb-6">
          Tu cita ha sido programada exitosamente. Recibirás una confirmación por email y SMS.
        </p>
        
        <div className="bg-white p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Detalles de la cita</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Médico:</span>
              <span className="font-medium">{selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modalidad:</span>
              <span className="font-medium">
                {selectedDoctor?.isTelemedicine ? 'Telemedicina' : 'Presencial'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/appointments"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver mis citas
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Paso {currentStep} de 4
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
    </div>
  );
} 