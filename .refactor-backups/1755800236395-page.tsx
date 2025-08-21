"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Video,
  Phone,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  languages: string[];
  isAvailable: boolean;
  consultationFee: number;
  telemedicineAvailable: boolean;
  avatar?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  isTelemedicine: boolean;
}

interface AppointmentForm {
  doctorId: string;
  date: string;
  time: string;
  type: "consultation" | "follow_up" | "emergency" | "routine_checkup";
  reason: string;
  symptoms: string[];
  isTelemedicine: boolean;
  urgency: "normal" | "urgent" | "emergency";
  notes: string;
}

const BOOKING_STEPS = [
  { id: 1, title: "Seleccionar Especialidad", icon: Stethoscope },
  { id: 2, title: "Elegir Médico", icon: User },
  { id: 3, title: "Seleccionar Fecha y Hora", icon: Calendar },
  { id: 4, title: "Información de la Cita", icon: AlertCircle },
  { id: 5, title: "Confirmación", icon: CheckCircle },
];

const SPECIALTIES = [
  { id: "general", name: "Medicina General", icon: "🏥" },
  { id: "cardiology", name: "Cardiología", icon: "❤️" },
  { id: "dermatology", name: "Dermatología", icon: "🩺" },
  { id: "pediatrics", name: "Pediatría", icon: "👶" },
  { id: "orthopedics", name: "Ortopedia", icon: "🦴" },
  { id: "neurology", name: "Neurología", icon: "🧠" },
  { id: "psychiatry", name: "Psiquiatría", icon: "🧠" },
  { id: "gynecology", name: "Ginecología", icon: "👩‍⚕️" },
  { id: "ophthalmology", name: "Oftalmología", icon: "👁️" },
  { id: "dentistry", name: "Odontología", icon: "🦷" },
];

const SYMPTOMS_OPTIONS = [
  "Dolor de cabeza", "Fiebre", "Tos", "Dolor de garganta",
  "Dolor abdominal", "Náuseas", "Vómitos", "Diarrea",
  "Fatiga", "Insomnio", "Ansiedad", "Depresión",
  "Dolor en las articulaciones", "Dolor de espalda", "Mareos",
  "Pérdida de apetito", "Pérdida de peso", "Hinchazón",
  "Erupciones cutáneas", "Problemas de visión", "Otros"
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AppointmentForm>({
    doctorId: "",
    date: "",
    time: "",
    type: "consultation",
    reason: "",
    symptoms: [],
    isTelemedicine: false,
    urgency: "normal",
    notes: "",
  });

  // Cargar médicos por especialidad
  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  // Cargar horarios disponibles
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async (specialty: string) => {
    setIsLoading(true);
    try {
      // Simulación de API - en producción sería una llamada real
      const mockDoctors: Doctor[] = [
        {
          id: "doc-1",
          name: "Dr. María García",
          specialty: "Medicina General",
          rating: 4.8,
          experience: 15,
          languages: ["Español", "Inglés"],
          isAvailable: true,
          consultationFee: 5000,
          telemedicineAvailable: true,
          avatar: "/avatars/doctor-1.jpg",
        },
        {
          id: "doc-2",
          name: "Dr. Carlos Rodríguez",
          specialty: "Cardiología",
          rating: 4.9,
          experience: 20,
          languages: ["Español"],
          isAvailable: true,
          consultationFee: 8000,
          telemedicineAvailable: true,
          avatar: "/avatars/doctor-2.jpg",
        },
        {
          id: "doc-3",
          name: "Dra. Ana López",
          specialty: "Dermatología",
          rating: 4.7,
          experience: 12,
          languages: ["Español", "Portugués"],
          isAvailable: true,
          consultationFee: 6000,
          telemedicineAvailable: false,
          avatar: "/avatars/doctor-3.jpg",
        },
      ];

      setDoctors(mockDoctors.filter(doc => doc.specialty.toLowerCase().includes(specialty.toLowerCase())));
    } catch (error) {
      logger.error("Error cargando médicos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    setIsLoading(true);
    try {
      // Simulación de API - en producción sería una llamada real
      const mockSlots: TimeSlot[] = [
        { time: "09:00", available: true, isTelemedicine: true },
        { time: "10:00", available: true, isTelemedicine: true },
        { time: "11:00", available: false, isTelemedicine: false },
        { time: "14:00", available: true, isTelemedicine: true },
        { time: "15:00", available: true, isTelemedicine: true },
        { time: "16:00", available: true, isTelemedicine: false },
        { time: "17:00", available: true, isTelemedicine: true },
      ];

      setAvailableSlots(mockSlots);
    } catch (error) {
      logger.error("Error cargando horarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < BOOKING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSpecialtySelect = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setFormData(prev => ({ ...prev, doctorId: "", date: "", time: "" }));
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ ...prev, doctorId: doctor.id }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setFormData(prev => ({ ...prev, date, time: "" }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    const slot = availableSlots.find(s => s.time === time);
    setFormData(prev => ({ 
      ...prev, 
      time,
      isTelemedicine: slot?.isTelemedicine || false 
    }));
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // En producción, aquí se enviaría a la API
      logger.info("Datos de la cita:", formData);
      
      // Simular envío exitoso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirigir a confirmación
      router.push("/appointments?success=true");
    } catch (error) {
      logger.error("Error programando cita:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedSpecialty !== "";
      case 2: return selectedDoctor !== null;
      case 3: return selectedDate !== "" && selectedTime !== "";
      case 4: return formData.reason.trim() !== "";
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Selecciona una especialidad</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SPECIALTIES.map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => handleSpecialtySelect(specialty.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedSpecialty === specialty.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{specialty.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Elige un médico</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Cargando médicos...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedDoctor?.id === doctor.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {doctor.avatar ? (
                          <img src={doctor.avatar} alt={doctor.name} className="w-full h-full rounded-full" />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center text-sm text-gray-500">
                            ⭐ {doctor.rating} ({doctor.experience} años)
                          </span>
                          <span className="text-sm text-gray-500">
                            ${doctor.consultationFee.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {doctor.telemedicineAvailable && (
                          <span className="flex items-center text-xs text-green-600">
                            <Video className="w-3 h-3 mr-1" />
                            Telemedicina
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {doctor.languages.join(", ")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Selecciona fecha y hora</h2>
            
            {/* Calendario */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Fecha</h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDateSelect(dateStr)}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        selectedDate === dateStr
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xs text-gray-500">{dayName}</div>
                      <div className="text-lg font-semibold">{dayNumber}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horarios */}
            {selectedDate && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Horario</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Cargando horarios...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          !slot.available
                            ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                            : selectedTime === slot.time
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{slot.time}</span>
                        </div>
                        {slot.isTelemedicine && (
                          <div className="flex items-center justify-center mt-1">
                            <Video className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Información de la cita</h2>
            
            <div className="space-y-4">
              {/* Tipo de cita */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de consulta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="consultation">Consulta general</option>
                  <option value="follow_up">Seguimiento</option>
                  <option value="emergency">Urgencia</option>
                  <option value="routine_checkup">Control rutinario</option>
                </select>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la consulta *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe brevemente el motivo de tu consulta..."
                />
              </div>

              {/* Síntomas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Síntomas (opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SYMPTOMS_OPTIONS.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`p-2 text-sm rounded border transition-all duration-200 ${
                        formData.symptoms.includes(symptom)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de urgencia
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                  <option value="emergency">Emergencia</option>
                </select>
              </div>

              {/* Notas adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Información adicional que consideres importante..."
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Confirma tu cita</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              {/* Resumen de la cita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Médico</h3>
                  <p className="text-gray-600">{selectedDoctor?.name}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor?.specialty}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Fecha y hora</h3>
                  <p className="text-gray-600">
                    {new Date(selectedDate).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-gray-600">{selectedTime}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tipo de consulta</h3>
                  <p className="text-gray-600 capitalize">{formData.type.replace('_', ' ')}</p>
                  {formData.isTelemedicine && (
                    <span className="inline-flex items-center text-sm text-green-600">
                      <Video className="w-4 h-4 mr-1" />
                      Telemedicina
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Costo</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${selectedDoctor?.consultationFee.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Motivo y síntomas */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Motivo</h3>
                <p className="text-gray-600">{formData.reason}</p>
              </div>

              {formData.symptoms.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Síntomas</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.symptoms.map((symptom) => (
                      <span key={symptom} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notas adicionales</h3>
                  <p className="text-gray-600">{formData.notes}</p>
                </div>
              )}
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Información importante</h4>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• Llega 10 minutos antes de tu cita</li>
                    <li>• Lleva tu documento de identidad</li>
                    <li>• Si es telemedicina, asegúrate de tener buena conexión</li>
                    <li>• Puedes cancelar hasta 24 horas antes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Programar Cita</h1>
          <p className="text-gray-600 mt-2">Sigue los pasos para agendar tu consulta médica</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {BOOKING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isActive
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center ${
                        isActive ? "text-blue-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < BOOKING_STEPS.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          {currentStep === BOOKING_STEPS.length ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Programando...
                </>
              ) : (
                <>
                  Confirmar Cita
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 