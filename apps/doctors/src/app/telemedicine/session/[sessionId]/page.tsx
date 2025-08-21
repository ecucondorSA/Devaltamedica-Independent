"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IntegratedDoctorVideoCall from '../../../../components/telemedicine/IntegratedDoctorVideoCall';
import { useAuth } from '@altamedica/hooks';
import { AlertCircle, ArrowLeft, User, FileText, Clock } from 'lucide-react';
import { EmergencyButton, EmergencyType } from '@altamedica/ui';
import { toast } from '@altamedica/ui';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock data para propósitos de demostración
// En producción, estos datos vendrían de la API
const mockSessions: { [key: string]: {
  id: string;
  patientName: string;
  patientEmail: string;
  appointmentType: string;
  scheduledTime: string;
  doctorName: string;
  doctorEmail: string;
  status: 'scheduled' | 'active' | 'completed';
  medicalHistory: string[];
  notes?: string;
}} = {
  'session-001': {
    id: 'session-001',
    patientName: 'María González',
    patientEmail: 'maria.gonzalez@email.com',
    appointmentType: 'Consulta de Seguimiento - Cardiología',
    scheduledTime: '2025-02-05 10:30',
    doctorName: 'Dr. García Martínez',
    doctorEmail: 'dr.garcia@altamedica.com',
    status: 'active',
    medicalHistory: [
      'Hipertensión arterial diagnosticada en 2022',
      'Alergia a la penicilina',
      'Cirugía de vesícula biliar (2021)',
      'Medicación actual: Losartán 50mg'
    ],
    notes: 'Control de presión arterial y ajuste de medicación'
  },
  'session-002': {
    id: 'session-002',
    patientName: 'Carlos Rodríguez',
    patientEmail: 'carlos.rodriguez@email.com',
    appointmentType: 'Consulta de Emergencia - Neurología',
    scheduledTime: '2025-02-12 15:00',
    doctorName: 'Dra. López Hernández',
    doctorEmail: 'dra.lopez@altamedica.com',
    status: 'scheduled',
    medicalHistory: [
      'Migrañas recurrentes desde 2020',
      'Sin alergias conocidas',
      'Tratamiento previo con sumatriptán'
    ],
    notes: 'Seguimiento de migrañas y evaluación de nuevos síntomas'
  }
};

export default function DoctorTelemedicineSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<typeof mockSessions[string] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreCallInfo, setShowPreCallInfo] = useState(true);

  const sessionId = params.sessionId as string;

  useEffect(() => {
    // Simular carga de datos de la sesión
    const loadSession = async () => {
      try {
        // En producción, hacer una llamada a la API para obtener los datos de la sesión
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de API
        
        const sessionData = mockSessions[sessionId];
        
        if (!sessionData) {
          setError('Sesión no encontrada');
          return;
        }

        // Verificar que el doctor tenga acceso a esta sesión
        if (!user?.email) {
          setError('Doctor no autenticado');
          return;
        }

        // En producción, verificar que el doctor tenga permiso para acceder a esta sesión
        setSession(sessionData);
      } catch (error) {
        logger.error('Error loading session:', error);
        setError('Error al cargar la sesión');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, user?.email]);

  const handleCallEnd = () => {
    // Redirigir al dashboard de telemedicina con mensaje de éxito
    router.push('/telemedicine?sessionCompleted=true');
  };

  const handleGoBack = () => {
    router.push('/telemedicine');
  };

  const handleStartSession = () => {
    if (session) {
      setSession(prev => prev ? {...prev, status: 'active'} : null);
      setShowPreCallInfo(false);
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="doctor-session-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando sesión médica...</h2>
          <p className="text-gray-600">Preparando consulta</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="doctor-session-error">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4" data-testid="error-title">
            {error || 'Sesión no encontrada'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Doctor no autenticado' 
              ? 'Por favor, inicie sesión para acceder a la consulta.'
              : 'No pudimos encontrar la sesión solicitada. Verifique el enlace e intente nuevamente.'
            }
          </p>
          <div className="space-y-3">
            {error === 'Doctor no autenticado' ? (
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Telemedicina</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar información pre-consulta para sesiones programadas
  if (showPreCallInfo && session.status === 'scheduled') {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="doctor-pre-call-info">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Telemedicina
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Información de la Consulta</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información del paciente */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900" data-testid="patient-name">{session.patientName}</h2>
                    <p className="text-gray-600" data-testid="patient-email">{session.patientEmail}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Consulta
                    </label>
                    <p className="text-gray-900" data-testid="appointment-type">{session.appointmentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Programada
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Clock className="w-4 h-4 mr-2" />
                      <span data-testid="scheduled-time">{session.scheduledTime}</span>
                    </div>
                  </div>
                </div>

                {session.notes && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas de la Cita
                    </label>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-700">{session.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Historial médico */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Historial Médico Relevante
                </h3>
                <div className="space-y-3">
                  {session.medicalHistory.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de acciones */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleStartSession}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    data-testid="start-consultation-button"
                  >
                    <User className="w-5 h-5" />
                    <span>Iniciar Consulta</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/patients/${session.patientEmail}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver Expediente Completo
                  </button>
                  
                  <button
                    onClick={handleGoBack}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Posponer Consulta
                  </button>
                </div>
              </div>

              {/* Información del sistema */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Información del Sistema</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Sistema de videollamadas activo</p>
                  <p>• Grabación automática habilitada</p>
                  <p>• Notas médicas sincronizadas</p>
                  <p>• Cumplimiento HIPAA verificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manejador de emergencias
  const handleEmergencyActivate = async (type: EmergencyType, notes?: string) => {
    try {
      // En producción, esto llamaría a la API de emergencias
      logger.info('🚨 Emergencia activada:', {
        type,
        notes,
        sessionId: session.id,
        patientName: session.patientName,
        timestamp: new Date().toISOString()
      });

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Notificar éxito
      toast.success(`Protocolo ${type.code} activado - Servicios de emergencia notificados`);

      // En producción, esto podría redirigir a una vista de emergencia específica
      // o mantener la sesión pero con indicadores de emergencia activa
    } catch (error) {
      logger.error('Error activando emergencia:', error);
      toast.error('Error al activar protocolo de emergencia');
      throw error;
    }
  };

  // Página principal de videollamada
  return (
    <div className="min-h-screen relative" data-testid="doctor-video-call">
      <IntegratedDoctorVideoCall
        sessionId={session.id}
        patientEmail={session.patientEmail}
        patientName={session.patientName}
        appointmentType={session.appointmentType}
        medicalHistory={session.medicalHistory}
        onCallEnd={handleCallEnd}
      />
      
      {/* Botón de emergencia flotante */}
      <EmergencyButton
        onEmergencyActivate={handleEmergencyActivate}
        variant="floating"
        sessionId={session.id}
        patientId={session.patientEmail}
        showPulse={true}
        data-testid="emergency-button"
      />
    </div>
  );
}