'use client';

import { useAuth  } from '@altamedica/auth';;
import { ConnectionMetrics, ConnectionStatus } from '@altamedica/ui';
import {
  AlertCircle,
  Clock,
  FileText,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Stethoscope,
  User,
  Video,
  VideoOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CallStatus, useVideoCall } from '../../lib/videoCall';

import { logger } from '@altamedica/shared/services/logger.service';
interface IntegratedDoctorVideoCallProps {
  sessionId: string;
  patientEmail: string;
  patientName: string;
  appointmentType?: string;
  medicalHistory?: string[];
  onCallEnd?: () => void;
}

interface CallState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  roomId: string | null;
  callUrls: {
    doctor_url?: string;
    patient_url?: string;
  } | null;
  status: CallStatus | null;
}

interface MedicalNotes {
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  followUp: string;
}

export default function IntegratedDoctorVideoCall({
  sessionId,
  patientEmail,
  patientName,
  appointmentType,
  medicalHistory = [],
  onCallEnd,
}: IntegratedDoctorVideoCallProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createCall, getStatus, client } = useVideoCall();

  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isLoading: true,
    error: null,
    roomId: null,
    callUrls: null,
    status: null,
  });

  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    packetLoss: 0,
    jitter: 0,
    bandwidth: { upload: 0, download: 0 },
  });

  const [localControls, setLocalControls] = useState({
    videoEnabled: true,
    audioEnabled: true,
    isFullscreen: false,
    showMedicalPanel: false,
    showChat: false,
  });

  const [medicalNotes, setMedicalNotes] = useState<MedicalNotes>({
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    followUp: '',
  });

  const videoIframeRef = useRef<HTMLIFrameElement>(null);
  const statusInterval = useRef<NodeJS.Timeout | null>(null);

  // Inicializar videollamada
  useEffect(() => {
    const initializeCall = async () => {
      if (!user?.email) {
        setCallState((prev) => ({
          ...prev,
          error: 'Doctor no autenticado',
          isLoading: false,
        }));
        return;
      }

      try {
        // Verificar conectividad del servidor
        const isHealthy = await client.checkServerHealth();
        if (!isHealthy) {
          throw new Error('Servidor de videollamadas no disponible');
        }

        // Crear la videollamada (doctor inicia la llamada)
        const result = await createCall(user.email, patientEmail, sessionId, {
          specialty: user.specialty || 'Medicina General',
          duration: 45, // Los doctores suelen tener sesiones más largas
          scheduledTime: new Date().toISOString(),
        });

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.room_id) {
          setCallState((prev) => ({
            ...prev,
            isConnected: true,
            isLoading: false,
            roomId: result.room_id!,
            callUrls: {
              doctor_url: result.doctor_url,
              patient_url: result.patient_url,
            },
            error: null,
          }));

          // Iniciar monitoreo de estado
          startStatusMonitoring(result.room_id);
        } else {
          throw new Error('No se pudo crear la videollamada');
        }
      } catch (error) {
        logger.error('Error initializing video call:', error);
        setCallState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Error desconocido',
          isLoading: false,
        }));
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
    };
  }, [sessionId, patientEmail, user?.email]);

  // Monitorear estado de la llamada
  const startStatusMonitoring = (roomId: string) => {
    statusInterval.current = setInterval(async () => {
      try {
        const status = await getStatus(roomId);
        if (!status || 'error' in status) {
          logger.error('Error getting call status:', status);
          return;
        }

        setCallState((prev) => ({ ...prev, status }));

        // Actualizar métricas de conexión simuladas
        setConnectionMetrics({
          latency: Math.floor(Math.random() * 50) + 20,
          packetLoss: Math.random() * 2,
          jitter: Math.floor(Math.random() * 10) + 5,
          bandwidth: {
            upload: Math.floor(Math.random() * 500) + 1500,
            download: Math.floor(Math.random() * 800) + 2200,
          },
        });

        // Si la llamada ha terminado
        if (status.call_ended_at) {
          if (statusInterval.current) {
            clearInterval(statusInterval.current);
          }
          if (onCallEnd) {
            onCallEnd();
          }
        }
      } catch (error) {
        logger.error('Error monitoring call status:', error);
      }
    }, 5000);
  };

  const handleEndCall = async () => {
    // Guardar notas médicas antes de terminar
    if (Object.values(medicalNotes).some((note) => note.trim())) {
      try {
        // TODO: Enviar notas médicas a la API
        logger.info('Saving medical notes:', medicalNotes);
      } catch (error) {
        logger.error('Error saving medical notes:', error);
      }
    }

    if (statusInterval.current) {
      clearInterval(statusInterval.current);
    }
    if (onCallEnd) {
      onCallEnd();
    } else {
      router.push('/dashboard');
    }
  };

  const toggleVideo = () => {
    setLocalControls((prev) => ({ ...prev, videoEnabled: !prev.videoEnabled }));
  };

  const toggleAudio = () => {
    setLocalControls((prev) => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  };

  const toggleFullscreen = () => {
    if (videoIframeRef.current) {
      if (!document.fullscreenElement) {
        videoIframeRef.current.requestFullscreen();
        setLocalControls((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        document.exitFullscreen();
        setLocalControls((prev) => ({ ...prev, isFullscreen: false }));
      }
    }
  };

  const updateMedicalNote = (field: keyof MedicalNotes, value: string) => {
    setMedicalNotes((prev) => ({ ...prev, [field]: value }));
  };

  // Estados de carga y error
  if (callState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Iniciando consulta médica...</h2>
          <p className="text-gray-300">Preparando videollamada con {patientName}</p>
        </div>
      </div>
    );
  }

  if (callState.error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Error en la videollamada</h2>
          <p className="text-gray-300 mb-6">{callState.error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative flex">
      {/* Video principal */}
      <div className={`${localControls.showMedicalPanel ? 'flex-1' : 'w-full'} relative`}>
        {/* Header de información del paciente */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-full">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">{patientName}</h2>
                <p className="text-sm text-gray-300">{appointmentType || 'Consulta General'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Estado de conexión con ConnectionStatus */}
              <ConnectionStatus
                status={callState.isConnected ? 'connected' : 'connecting'}
                metrics={connectionMetrics}
                onRetry={() => window.location.reload()}
                showMetrics={true}
              />

              {/* Duración */}
              {callState.status?.call_started_at && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">00:00</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="w-full h-screen">
          {callState.callUrls?.doctor_url ? (
            <iframe
              ref={videoIframeRef}
              src={`${callState.callUrls.doctor_url}&embed=true`}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen"
              title="Consulta médica"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">Preparando video...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controles principales */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Control de audio */}
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                localControls.audioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {localControls.audioEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Control de video */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                localControls.videoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {localControls.videoEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </button>

            {/* Panel médico */}
            <button
              onClick={() =>
                setLocalControls((prev) => ({ ...prev, showMedicalPanel: !prev.showMedicalPanel }))
              }
              className={`p-3 rounded-full transition-colors ${
                localControls.showMedicalPanel
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title="Notas médicas"
            >
              <FileText className="w-5 h-5" />
            </button>

            {/* Colgar llamada */}
            <button
              onClick={handleEndCall}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            {/* Pantalla completa */}
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Panel médico lateral */}
      {localControls.showMedicalPanel && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <span>Notas Médicas</span>
              </h3>
              <button
                onClick={() => setLocalControls((prev) => ({ ...prev, showMedicalPanel: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Paciente: {patientName}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Historial médico */}
            {medicalHistory.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Historial Médico</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {medicalHistory.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Síntomas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Síntomas Reportados
              </label>
              <textarea
                value={medicalNotes.symptoms}
                onChange={(e) => updateMedicalNote('symptoms', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Anotar síntomas del paciente..."
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico Preliminar
              </label>
              <textarea
                value={medicalNotes.diagnosis}
                onChange={(e) => updateMedicalNote('diagnosis', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Diagnóstico o impresión clínica..."
              />
            </div>

            {/* Tratamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan de Tratamiento
              </label>
              <textarea
                value={medicalNotes.treatment}
                onChange={(e) => updateMedicalNote('treatment', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Recomendaciones de tratamiento..."
              />
            </div>

            {/* Prescripciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prescripciones</label>
              <textarea
                value={medicalNotes.prescriptions}
                onChange={(e) => updateMedicalNote('prescriptions', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
                placeholder="Medicamentos recetados..."
              />
            </div>

            {/* Seguimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seguimiento</label>
              <textarea
                value={medicalNotes.followUp}
                onChange={(e) => updateMedicalNote('followUp', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
                placeholder="Próximas citas o indicaciones..."
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Guardar Notas
            </button>
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm">
              Generar Receta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
