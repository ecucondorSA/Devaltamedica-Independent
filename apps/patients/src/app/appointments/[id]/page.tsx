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
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Importación desde @altamedica/ui centralizado
import {
  ButtonCorporate,
  CardContentCorporate,
  CardCorporate,
  CardHeaderCorporate,
  LoadingSpinner
} from "@altamedica/ui";
import { useAuth } from "@altamedica/auth";
import { logger } from '@altamedica/shared/services/logger.service';
// import { useMarketplaceJobs, useJobApplications } from '@altamedica/marketplace-hooks';
// import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

// Interfaces TypeScript
interface AppointmentDetail {
  id: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
  date: string;
  time: string;
  type: "consultation" | "follow_up" | "emergency" | "telemedicine";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  location?: string;
  notes?: string;
  duration: number; // en minutos
  doctorInfo: {
    photo?: string;
    qualifications: string[];
    experience: string;
    rating: number;
    reviewsCount: number;
  };
  patientNotes?: string;
  attachments?: string[];
  telemedicineInfo?: {
    roomId: string;
    joinUrl: string;
    accessCode: string;
  };
  cancellationReason?: string;
  rescheduleHistory?: Array<{
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reason: string;
    timestamp: string;
  }>;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authState } = useAuth();
  const appointmentId = params.id as string;
  
  // Marketplace hooks para comunicación mejorada
  const { jobs, searchJobs } = useMarketplaceJobs();
  const { applications, submitApplication } = useJobApplications(authState?.user?.id);
  
  // Hook unificado de telemedicina + marketplace
  const telemedicineUnified = useTelemedicineUnified({
    appointmentId,
    userType: 'patient',
    userId: authState?.user?.id || ''
  });

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoinEnabled, setIsJoinEnabled] = useState(false);

  // Cargar datos de la cita
  useEffect(() => {
    loadAppointmentDetail();
  }, [appointmentId]);

  // Verificar si se puede unir a telemedicina
  useEffect(() => {
    if (appointment && appointment.type === "telemedicine") {
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const now = new Date();
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Habilitar 15 minutos antes y hasta 5 minutos después
      setIsJoinEnabled(minutesDiff <= 15 && minutesDiff >= -5);
    }
  }, [appointment]);

  const loadAppointmentDetail = async () => {
    if (!authState?.token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/appointments/${appointmentId}`, {
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

  const handleJoinTelemedicine = async () => {
    try {
      // Inicializar sesión usando el hook unificado
      await telemedicineUnified.initializeSession();
      
      if (appointment?.telemedicineInfo?.joinUrl) {
        window.open(appointment.telemedicineInfo.joinUrl, '_blank');
      } else {
        // Usar appointmentId como sessionId para mejor tracking
        const sessionId = appointment?.telemedicineInfo?.roomId || appointmentId;
        router.push(`/telemedicine/room/${sessionId}`);
      }
    } catch (error) {
      logger.error('Error joining telemedicine session:', error);
      alert('Error al unirse a la videollamada. Por favor intenta nuevamente.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
    
    try {
      const response = await fetch(`/api/v1/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellationReason: 'Cancelada por el paciente'
        }),
      });

      if (response.ok) {
        setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
        alert('Cita cancelada exitosamente');
      } else {
        throw new Error('Error al cancelar la cita');
      }
    } catch (error) {
      alert('Error al cancelar la cita. Intenta nuevamente.');
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
    return icons[type as keyof typeof icons] || <Calendar className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <LoadingSpinner size="lg" />
          <p className="font-medium text-gray-600">Cargando detalle de la cita...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 mx-auto max-w-4xl">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="mt-2 text-red-700">{error || 'Cita no encontrada'}</p>
            <Link href="/appointments">
              <ButtonCorporate variant="ghost" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Citas
              </ButtonCorporate>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/appointments">
                <ButtonCorporate variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </ButtonCorporate>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Detalle de Cita
                </h1>
                <p className="text-gray-600">ID: {appointment.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}
              >
                {getStatusText(appointment.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-8 mx-auto max-w-4xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información de la Cita */}
            <CardCorporate variant="default" size="lg">
              <CardHeaderCorporate title="Información de la Cita" className="px-6 py-4 border-b">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(appointment.type)}
                  <h2 className="text-lg font-medium text-gray-900">
                    Información de la Cita
                  </h2>
                </div>
              </CardHeaderCorporate>
              <CardContentCorporate className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fecha</p>
                        <p className="text-lg font-semibold text-gray-900">{appointment.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Hora</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {appointment.time} ({appointment.duration} min)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tipo de Consulta</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {appointment.type === 'telemedicine' ? 'Telemedicina' : 
                           appointment.type === 'consultation' ? 'Consulta' :
                           appointment.type === 'follow_up' ? 'Seguimiento' : 'Emergencia'}
                        </p>
                      </div>
                    </div>

                    {appointment.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ubicación</p>
                          <p className="text-lg font-semibold text-gray-900">{appointment.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Notas de la Cita</h3>
                    <p className="text-blue-800">{appointment.notes}</p>
                  </div>
                )}
              </CardContentCorporate>
            </CardCorporate>

            {/* Información del Doctor */}
            <CardCorporate variant="default" size="lg">
              <CardHeaderCorporate title="Información del Doctor" className="px-6 py-4 border-b" />
              <CardContentCorporate className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {appointment.doctorInfo.photo ? (
                      <img
                        src={appointment.doctorInfo.photo}
                        alt={appointment.doctorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{appointment.doctorName}</h3>
                    <p className="text-blue-600 font-medium">{appointment.specialty}</p>
                    <p className="text-gray-600 mt-1">{appointment.doctorInfo.experience}</p>
                    
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 font-medium">{appointment.doctorInfo.rating}</span>
                        <span className="ml-1 text-gray-500">({appointment.doctorInfo.reviewsCount} reseñas)</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-600 mb-1">Certificaciones:</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.doctorInfo.qualifications.map((qual, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContentCorporate>
            </CardCorporate>

            {/* Archivos Adjuntos */}
            {appointment.attachments && appointment.attachments.length > 0 && (
              <CardCorporate variant="default" size="lg">
                <CardHeaderCorporate title="Archivos Adjuntos" className="px-6 py-4 border-b" />
                <CardContentCorporate className="p-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {appointment.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{attachment}</p>
                        </div>
                        <ButtonCorporate variant="ghost" size="sm">
                          Descargar
                        </ButtonCorporate>
                      </div>
                    ))}
                  </div>
                </CardContentCorporate>
              </CardCorporate>
            )}
          </div>

          {/* Sidebar de Acciones */}
          <div className="space-y-6">
            {/* Acciones Principales */}
            <CardCorporate variant="default" size="md">
              <CardHeaderCorporate title="Acciones" className="px-6 py-4 border-b" />
              <CardContentCorporate className="p-6">
                <div className="space-y-3">
                  {appointment.status === 'confirmed' && appointment.type === 'telemedicine' && (
                    <ButtonCorporate
                      variant="primary"
                      className="w-full flex items-center justify-center space-x-2"
                      onClick={handleJoinTelemedicine}
                      disabled={!isJoinEnabled}
                    >
                      <Video className="w-4 h-4" />
                      <span>{isJoinEnabled ? 'Unirse a Videollamada' : 'Disponible 15 min antes'}</span>
                    </ButtonCorporate>
                  )}

                  {appointment.status === 'confirmed' && appointment.type !== 'telemedicine' && (
                    <ButtonCorporate
                      variant="secondary"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Ver Direcciones</span>
                    </ButtonCorporate>
                  )}

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <>
                      <ButtonCorporate
                        variant="ghost"
                        className="w-full flex items-center justify-center space-x-2"
                        onClick={() => router.push(`/appointments/${appointmentId}/reschedule`)}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Reagendar</span>
                      </ButtonCorporate>

                      <ButtonCorporate
                        variant="ghost"
                        className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                        onClick={handleCancelAppointment}
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar Cita</span>
                      </ButtonCorporate>
                    </>
                  )}

                  <ButtonCorporate
                    variant="ghost"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => router.push(`/messages?doctorId=${appointment.doctorId}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contactar Doctor</span>
                  </ButtonCorporate>
                </div>
              </CardContentCorporate>
            </CardCorporate>

            {/* Información de Telemedicina */}
            {appointment.type === 'telemedicine' && appointment.telemedicineInfo && (
              <CardCorporate variant="default" size="md">
                <CardHeaderCorporate title="Información de Videollamada" className="px-6 py-4 border-b" />
                <CardContentCorporate className="p-6">
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
                        <strong>Nota:</strong> Puedes unirse a la videollamada 15 minutos antes de la hora programada.
                      </p>
                    </div>
                  </div>
                </CardContentCorporate>
              </CardCorporate>
            )}

            {/* Historial de Reagendamientos */}
            {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 && (
              <CardCorporate variant="default" size="md">
                <CardHeaderCorporate title="Historial de Cambios" className="px-6 py-4 border-b" />
                <CardContentCorporate className="p-6">
                  <div className="space-y-3">
                    {appointment.rescheduleHistory.map((change, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-3">
                        <p className="text-xs text-gray-500">{change.timestamp}</p>
                        <p className="text-sm text-gray-700">
                          De: {change.oldDate} {change.oldTime}
                        </p>
                        <p className="text-sm text-gray-700">
                          A: {change.newDate} {change.newTime}
                        </p>
                        {change.reason && (
                          <p className="text-xs text-gray-600 italic">Razón: {change.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContentCorporate>
              </CardCorporate>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}