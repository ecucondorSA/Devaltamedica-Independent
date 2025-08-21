"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@altamedica/hooks';
// Mock telemedicine hooks since api-client has build issues
const useJoinTelemedicineSession = () => ({
  mutateAsync: async (params: { sessionId: string; role: string }) => {
    logger.info('Mock join session:', params);
    return Promise.resolve({ success: true });
  }
});

const useEndTelemedicineSession = () => ({
  mutate: (params: { sessionId: string; notes?: string }) => {
    logger.info('Mock end session:', params);
  }
});

const useTelemedicineSession = (sessionId: string) => ({
  data: null,
  error: null
});
import TelemedicineMVP from '../../../../components/telemedicine/TelemedicineMVP';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Clock,
  User,
  FileText,
  AlertCircle,
  Video,
  Shield,
  Heart,
  Activity,
  ArrowLeft,
  CheckCircle,
  Phone,
  XCircle,
  Mic,
  Wifi
} from 'lucide-react';

// Mock data para demostración
const mockPatientSessions = {
  'session-001': {
    id: 'session-001',
    doctorName: 'Dr. García Martínez',
    doctorEmail: 'dr.garcia@altamedica.com',
    specialty: 'Cardiología',
    appointmentType: 'Consulta de Seguimiento',
    scheduledTime: '2025-02-05 10:30',
    duration: 30,
    status: 'scheduled',
    roomId: 'room_session_001',
    notes: 'Control de presión arterial y medicación',
    patientInstructions: [
      'Tenga a mano su medidor de presión arterial',
      'Liste los medicamentos que está tomando actualmente',
      'Prepare cualquier pregunta sobre sus síntomas'
    ]
  },
  'session-002': {
    id: 'session-002',
    doctorName: 'Dra. López Hernández',
    doctorEmail: 'dra.lopez@altamedica.com',
    specialty: 'Neurología',
    appointmentType: 'Consulta de Emergencia',
    scheduledTime: '2025-02-05 14:00',
    duration: 45,
    status: 'active',
    roomId: 'room_session_002',
    notes: 'Evaluación de síntomas neurológicos urgentes',
    patientInstructions: [
      'Manténgase en un lugar tranquilo y bien iluminado',
      'Tenga a alguien cerca en caso de necesitar asistencia',
      'Describa detalladamente sus síntomas'
    ]
  }
};

export default function PatientTelemedicineSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<typeof mockPatientSessions[keyof typeof mockPatientSessions] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreCallInfo, setShowPreCallInfo] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState({
    camera: false,
    microphone: false,
    connection: false
  });

  const sessionId = params.sessionId as string;

  // Usar los hooks de telemedicina
  const joinSessionMutation = useJoinTelemedicineSession();
  const endSessionMutation = useEndTelemedicineSession();
  const { data: sessionData, error: telemedicineError } = useTelemedicineSession(sessionId);

  useEffect(() => {
    const loadSession = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sessionData = mockPatientSessions[sessionId as keyof typeof mockPatientSessions];
        
        if (!sessionData) {
          setError('Sesión no encontrada');
          return;
        }

        if (!user?.email) {
          setError('Paciente no autenticado');
          return;
        }

        setSession(sessionData);
        
        // Realizar check de dispositivos automáticamente
        await performDeviceCheck();
        
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

  const performDeviceCheck = async () => {
    try {
      // Check de cámara y micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setDeviceCheck(prev => ({
        ...prev,
        camera: true,
        microphone: true,
        connection: true
      }));
      
      // Cerrar el stream después del check
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      logger.error('Device check failed:', error);
      setDeviceCheck(prev => ({
        ...prev,
        camera: false,
        microphone: false
      }));
    }
  };

  const handleJoinSession = async () => {
    if (!session || !user) return;
    
    try {
      await joinSessionMutation.mutateAsync({
        sessionId: session.id,
        role: 'patient'
      });
      
      setShowPreCallInfo(false);
    } catch (error) {
      logger.error('Error joining session:', error);
      setError('Error al unirse a la sesión');
    }
  };

  const handleEndCall = () => {
    endSessionMutation.mutate({
      sessionId: sessionId,
      notes: 'Session ended by patient'
    });
    router.push('/telemedicine?sessionCompleted=true');
  };

  const handleGoBack = () => {
    router.push('/telemedicine');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="session-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparando consulta...</h2>
          <p className="text-gray-600">Conectando con el sistema médico</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="session-error">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'Sesión no encontrada'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Paciente no autenticado' 
              ? 'Por favor, inicie sesión para acceder a su consulta médica.'
              : 'No pudimos encontrar la sesión solicitada. Verifique el enlace e intente nuevamente.'
            }
          </p>
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Telemedicina</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Información pre-consulta
  if (showPreCallInfo) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="pre-call-info">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Telemedicina
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Preparación para la Consulta</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información de la consulta */}
            <div className="lg:col-span-2 space-y-6">
              {/* Doctor Info */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="doctor-info">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900" data-testid="doctor-name">
                      {session.doctorName}
                    </h2>
                    <p className="text-gray-600" data-testid="doctor-specialty">
                      {session.specialty}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Consulta
                    </label>
                    <p className="text-gray-900" data-testid="appointment-type">
                      {session.appointmentType}
                    </p>
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
              </div>

              {/* Preparación */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="preparation-info">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Preparación para la Consulta
                </h3>
                <div className="space-y-3">
                  {session.patientInstructions?.map((instruction, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verificación de Dispositivos */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="device-check">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Verificación de Dispositivos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Video className="w-5 h-5 mr-2 text-gray-600" />
                      <span>Cámara</span>
                    </div>
                    {deviceCheck.camera ? (
                      <CheckCircle className="w-5 h-5 text-green-600" data-testid="camera-check" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mic className="w-5 h-5 mr-2 text-gray-600" />
                      <span>Micrófono</span>
                    </div>
                    {deviceCheck.microphone ? (
                      <CheckCircle className="w-5 h-5 text-green-600" data-testid="microphone-check" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wifi className="w-5 h-5 mr-2 text-gray-600" />
                      <span>Conexión a Internet</span>
                    </div>
                    {deviceCheck.connection ? (
                      <CheckCircle className="w-5 h-5 text-green-600" data-testid="connection-check" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de acciones */}
            <div className="space-y-6">
              {/* Consentimiento */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="consent-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Consentimiento
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      id="consent"
                      type="checkbox"
                      className="mt-1 mr-3"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      data-testid="consent-checkbox"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                      Acepto que esta consulta médica sea grabada para fines de 
                      documentación médica y cumplimiento de HIPAA.
                    </label>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white rounded-lg shadow p-6" data-testid="actions-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleJoinSession}
                    disabled={!consentGiven || !deviceCheck.camera || !deviceCheck.microphone}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    data-testid="join-session-button"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Unirse a la Consulta</span>
                  </button>
                  
                  <button
                    onClick={() => performDeviceCheck()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    data-testid="retry-device-check"
                  >
                    Verificar Dispositivos Nuevamente
                  </button>
                  
                  <button
                    onClick={handleGoBack}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    data-testid="postpone-session"
                  >
                    Posponer Consulta
                  </button>
                </div>
              </div>

              {/* Info médica */}
              <div className="bg-blue-50 rounded-lg p-6" data-testid="medical-info">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Información Médica
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Consulta médica certificada</p>
                  <p>• Cumplimiento estricto de HIPAA</p>
                  <p>• Grabación segura y encriptada</p>
                  <p>• Historiales médicos protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interfaz de videollamada
  return (
    <div className="min-h-screen" data-testid="video-call-interface">
      <TelemedicineMVP
        roomId={session.roomId}
        doctorId={session.doctorEmail}
        doctorName={session.doctorName}
        onEndCall={handleEndCall}
      />
    </div>
  );
}