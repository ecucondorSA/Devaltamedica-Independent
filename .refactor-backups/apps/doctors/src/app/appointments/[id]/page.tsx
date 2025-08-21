"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  FileText,
  MapPin,
  MessageCircle,
  User,
  Video,
  X,
  Phone,
  Star,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@altamedica/ui";
import { useAuth  } from '@altamedica/auth';;
import { useMarketplaceJobs, useJobApplications, useDoctorProfile } from '@altamedica/marketplace-hooks';
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

import { logger } from '@altamedica/shared/services/logger.service';
interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  avatar?: string;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface AppointmentDetail {
  id: string;
  patientId: string;
  patient: PatientInfo;
  date: string;
  time: string;
  type: "consultation" | "follow_up" | "emergency" | "telemedicine";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason: string;
  notes?: string;
  duration: number; // en minutos
  location?: string;
  telemedicineInfo?: {
    roomId: string;
    joinUrl: string;
    accessCode: string;
  };
  symptoms: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

export default function DoctorAppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authState } = useAuth();
  const appointmentId = params.id as string;
  
  // Marketplace hooks para comunicación mejorada
  const { profile: doctorProfile } = useDoctorProfile(authState?.user?.id);
  const { jobs, searchJobs } = useMarketplaceJobs();
  const { applications } = useJobApplications(authState?.user?.id);
  
  // Hook unificado de telemedicina + marketplace
  const telemedicineUnified = useTelemedicineUnified({
    appointmentId,
    userType: 'doctor',
    userId: authState?.user?.id || ''
  });

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canStartConsultation, setCanStartConsultation] = useState(false);

  // Cargar datos de la cita
  useEffect(() => {
    if (appointmentId && authState?.token) {
      loadAppointmentDetail();
    }
  }, [appointmentId, authState?.token]);

  // Verificar si se puede iniciar la consulta
  useEffect(() => {
    if (appointment) {
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const now = new Date();
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Permitir iniciar 30 minutos antes y hasta 15 minutos después
      setCanStartConsultation(minutesDiff <= 30 && minutesDiff >= -15);
    }
  }, [appointment]);

  const loadAppointmentDetail = async () => {
    if (!authState?.token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/doctors/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });

      const responseJson = await response.json();
      
      if (!response.ok) {
        throw new Error(responseJson?.error || 'Error al cargar detalle de la cita');
      }

      setAppointment(responseJson.data);
    } catch (error: any) {
      setError(error.message || 'Error al cargar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTelemedicine = async () => {
    try {
      // Inicializar sesión usando el hook unificado
      await telemedicineUnified.initializeSession();
      
      if (appointment?.telemedicineInfo?.joinUrl) {
        window.open(appointment.telemedicineInfo.joinUrl, '_blank');
      } else {
        // Usar appointmentId como sessionId para mejor tracking
        const sessionId = appointment?.telemedicineInfo?.roomId || appointmentId;
        router.push(`/telemedicine/session/${sessionId}`);
      }
    } catch (error) {
      logger.error('Error starting telemedicine session:', error);
      alert('Error al iniciar la videollamada. Por favor intenta nuevamente.');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!confirm('¿Marcar esta cita como completada?')) return;
    
    try {
      const response = await fetch(`/api/v1/doctors/appointments/${appointmentId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ 
          status: 'completed',
          completedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setAppointment(prev => prev ? { ...prev, status: 'completed' } : null);
        alert('Cita marcada como completada');
      } else {
        throw new Error('Error al completar la cita');
      }
    } catch (error) {
      alert('Error al completar la cita. Intenta nuevamente.');
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors = {
      confirmed: "text-green-700 bg-green-100 border-green-200",
      scheduled: "text-blue-700 bg-blue-100 border-blue-200",
      completed: "text-gray-700 bg-gray-100 border-gray-200",
      cancelled: "text-red-700 bg-red-100 border-red-200",
    };
    return statusColors[status as keyof typeof statusColors] || "text-gray-700 bg-gray-100";
  };

  const getStatusText = (status: string): string => {
    const statusTexts = {
      confirmed: "Confirmada",
      scheduled: "Programada",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      consultation: <User className="w-5 h-5" />,
      follow_up: <Clock className="w-5 h-5" />,
      emergency: <AlertCircle className="w-5 h-5" />,
      telemedicine: <Video className="w-5 h-5" />,
    };
    return icons[type as keyof typeof icons] || <User className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalle de la cita...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar la cita</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cita no encontrada</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar la información de esta cita</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalle de Cita</h1>
                <p className="text-sm text-gray-600">
                  Cita con {appointment.patient.name}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la Cita */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                {getTypeIcon(appointment.type)}
                <h2 className="text-xl font-semibold text-gray-900">Información de la Cita</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha y Hora</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{appointment.date}</span>
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-gray-900">{appointment.time}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Motivo de Consulta</p>
                    <p className="text-gray-900 mt-1">{appointment.reason}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duración Estimada</p>
                    <p className="text-gray-900 mt-1">{appointment.duration} minutos</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipo de Consulta</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTypeIcon(appointment.type)}
                      <span className="text-gray-900 capitalize">{appointment.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {appointment.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ubicación</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{appointment.location}</span>
                      </div>
                    </div>
                  )}

                  {appointment.symptoms.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Síntomas Reportados</p>
                      <div className="mt-1">
                        {appointment.symptoms.map((symptom, index) => (
                          <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Notas Adicionales</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Información del Paciente */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-gray-900">Información del Paciente</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Datos Personales</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-900 font-medium">{appointment.patient.name}</p>
                      <p className="text-gray-600">{appointment.patient.age} años • {appointment.patient.gender}</p>
                      {appointment.patient.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{appointment.patient.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.patient.allergies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Alergias</p>
                      <div className="mt-1">
                        {appointment.patient.allergies.map((allergy, index) => (
                          <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {appointment.patient.currentMedications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Medicación Actual</p>
                      <ul className="mt-2 space-y-1">
                        {appointment.patient.currentMedications.map((medication, index) => (
                          <li key={index} className="text-gray-900 text-sm">• {medication}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600">Contacto de Emergencia</p>
                    <div className="mt-2">
                      <p className="text-gray-900 font-medium">{appointment.patient.emergencyContact.name}</p>
                      <p className="text-gray-600 text-sm">{appointment.patient.emergencyContact.relationship}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{appointment.patient.emergencyContact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Acciones */}
          <div className="space-y-6">
            {/* Acciones Principales */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                {appointment.status === 'confirmed' && appointment.type === 'telemedicine' && (
                  <Button
                    className="w-full"
                    onClick={handleStartTelemedicine}
                    disabled={!canStartConsultation}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {canStartConsultation ? 'Iniciar Videollamada' : 'Disponible 30 min antes'}
                  </Button>
                )}

                {appointment.status === 'confirmed' && appointment.type !== 'telemedicine' && (
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Ver Ubicación
                  </Button>
                )}

                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                  <Button
                    onClick={handleCompleteAppointment}
                    className="w-full"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Completar Cita
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/messages?patientId=${appointment.patientId}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar Paciente
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/appointments/${appointmentId}/edit`)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Cita
                </Button>
              </div>
            </div>

            {/* Información de Telemedicina */}
            {appointment.type === 'telemedicine' && appointment.telemedicineInfo && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Videollamada</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ID de Sala</p>
                    <p className="text-gray-900 font-mono text-sm">{appointment.telemedicineInfo.roomId}</p>
                  </div>
                  
                  {appointment.telemedicineInfo.accessCode && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Código de Acceso</p>
                      <p className="text-gray-900 font-mono text-lg font-bold">{appointment.telemedicineInfo.accessCode}</p>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Recordatorio:</strong> Asegúrate de tener una conexión estable a internet y permisos para cámara y micrófono.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signos Vitales */}
            {appointment.vitalSigns && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signos Vitales</h3>
                <div className="space-y-3">
                  {appointment.vitalSigns.bloodPressure && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Presión Arterial</span>
                      <span className="font-medium">{appointment.vitalSigns.bloodPressure}</span>
                    </div>
                  )}
                  {appointment.vitalSigns.heartRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frecuencia Cardíaca</span>
                      <span className="font-medium">{appointment.vitalSigns.heartRate} bpm</span>
                    </div>
                  )}
                  {appointment.vitalSigns.temperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperatura</span>
                      <span className="font-medium">{appointment.vitalSigns.temperature}°C</span>
                    </div>
                  )}
                  {appointment.vitalSigns.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso</span>
                      <span className="font-medium">{appointment.vitalSigns.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
