'use client';

import { logger } from '@altamedica/shared/services/logger.service';

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
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Importación desde @altamedica/ui centralizado
import { useAuth } from '@altamedica/auth';
import { Button, Card, CardContent, CardHeader, LoadingSpinner } from '@altamedica/ui';

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
  type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const appointmentId = params.id as string;

  // Estado para telemedicina
  const [telemedicineSession, setTelemedicineSession] = useState<any>(null);

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
    if (appointment && appointment.type === 'telemedicine') {
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const now = new Date();
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      // Habilitar 15 minutos antes y hasta 5 minutos después
      setIsJoinEnabled(minutesDiff <= 15 && minutesDiff >= -5);
    }
  }, [appointment]);

  const loadAppointmentDetail = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${user?.id || ''}` },
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
      if (appointment?.telemedicineInfo?.joinUrl) {
        window.open(appointment.telemedicineInfo.joinUrl, '_blank');
      } else {
        // Usar appointmentId como sessionId para mejor tracking
        const sessionId = appointment?.telemedicineInfo?.roomId || appointmentId;
        router.push(`/telemedicine/room/${sessionId}`);
      }
    } catch (error) {
      logger.error('Error joining telemedicine session:', String(error));
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
          Authorization: `Bearer ${user?.id || ''}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: 'Cancelada por el paciente',
        }),
      });

      if (response.ok) {
        setAppointment((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
        alert('Cita cancelada exitosamente');
      } else {
        throw new Error('Error al cancelar la cita');
      }
    } catch (error) {
      alert('Error al cancelar la cita. Intenta nuevamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <LoadingSpinner />
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
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Citas
              </Button>
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
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalle de Cita</h1>
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
            <Card className="w-full">
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(appointment.type)}
                  <h2 className="text-lg font-medium text-gray-900">Información de la Cita</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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
                          {appointment.type === 'telemedicine'
                            ? 'Telemedicina'
                            : appointment.type === 'consultation'
                              ? 'Consulta'
                              : appointment.type === 'follow_up'
                                ? 'Seguimiento'
                                : 'Emergencia'}
                        </p>
                      </div>
                    </div>

                    {appointment.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ubicación</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {appointment.location}
                          </p>
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
              </CardContent>
            </Card>

            {/* Información del Doctor */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-medium text-gray-900">Información del Doctor</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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
                    <h3 className="text-xl font-semibold text-gray-900">
                      {appointment.doctorName}
                    </h3>
                    <p className="text-blue-600 font-medium">{appointment.specialty}</p>
                    <p className="text-gray-600 mt-1">{appointment.doctorInfo.experience}</p>

                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 font-medium">{appointment.doctorInfo.rating}</span>
                        <span className="ml-1 text-gray-500">
                          ({appointment.doctorInfo.reviewsCount} reseñas)
                        </span>
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
              </CardContent>
            </Card>

            {/* Archivos Adjuntos */}
            {appointment.attachments && appointment.attachments.length > 0 && (
              <Card>
                <CardHeader className="px-6 py-4 border-b">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-medium text-gray-900">Archivos Adjuntos</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
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
                        <Button variant="ghost" size="sm">
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar de Acciones */}
          <div className="space-y-6">
            {/* Acciones Principales */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {appointment.status === 'confirmed' && appointment.type === 'telemedicine' && (
                    <Button
                      variant="default"
                      className="w-full flex items-center justify-center space-x-2"
                      onClick={handleJoinTelemedicine}
                      disabled={!isJoinEnabled}
                    >
                      <Video className="w-4 h-4" />
                      <span>
                        {isJoinEnabled ? 'Unirse a Videollamada' : 'Disponible 15 min antes'}
                      </span>
                    </Button>
                  )}

                  {appointment.status === 'confirmed' && appointment.type !== 'telemedicine' && (
                    <Button
                      variant="secondary"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Ver Direcciones</span>
                    </Button>
                  )}

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-center space-x-2"
                        onClick={() => router.push(`/appointments/${appointmentId}/reschedule`)}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Reagendar</span>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                        onClick={handleCancelAppointment}
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar Cita</span>
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => router.push(`/messages?doctorId=${appointment.doctorId}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contactar Doctor</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información de Telemedicina */}
            {appointment.type === 'telemedicine' && appointment.telemedicineInfo && (
              <Card className="w-full">
                <CardHeader className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Información de Videollamada</h3>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">ID de Sala</p>
                      <p className="text-gray-900 font-mono text-sm">
                        {appointment.telemedicineInfo.roomId}
                      </p>
                    </div>

                    {appointment.telemedicineInfo.accessCode && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Código de Acceso</p>
                        <p className="text-gray-900 font-mono text-lg font-bold">
                          {appointment.telemedicineInfo.accessCode}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Puedes unirse a la videollamada 15 minutos antes de
                        la hora programada.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historial de Reagendamientos */}
            {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 && (
              <Card className="w-full">
                <CardHeader className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Cambios</h3>
                </CardHeader>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Funciones auxiliares
function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'scheduled':
      return 'Programada';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'telemedicine':
      return <Video className="w-5 h-5 text-blue-600" />;
    case 'consultation':
      return <User className="w-5 h-5 text-green-600" />;
    case 'follow_up':
      return <FileText className="w-5 h-5 text-purple-600" />;
    case 'emergency':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <User className="w-5 h-5 text-gray-600" />;
  }
}
