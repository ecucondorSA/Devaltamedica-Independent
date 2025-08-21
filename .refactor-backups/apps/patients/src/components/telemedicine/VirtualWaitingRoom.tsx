'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Camera, 
  Mic, 
  Monitor, 
  Wifi, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Phone,
  Activity,
  FileText,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { logger } from '@altamedica/shared/services/logger.service';
interface VirtualWaitingRoomProps {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  specialty: string;
  onJoinCall: () => void;
  onCancel: () => void;
}

interface SystemCheck {
  camera: 'checking' | 'success' | 'error';
  microphone: 'checking' | 'success' | 'error';
  speakers: 'checking' | 'success' | 'error';
  connection: 'checking' | 'success' | 'error';
}

interface PreConsultationForm {
  currentSymptoms: string;
  medicationsTaken: string;
  vitalSigns: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
  };
  additionalNotes: string;
}

export default function VirtualWaitingRoom({
  appointmentId,
  patientName,
  doctorName,
  appointmentTime,
  specialty,
  onJoinCall,
  onCancel
}: VirtualWaitingRoomProps) {
  // Estados
  const [systemCheck, setSystemCheck] = useState<SystemCheck>({
    camera: 'checking',
    microphone: 'checking',
    speakers: 'checking',
    connection: 'checking'
  });
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(1);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(5);
  const [showPreConsultationForm, setShowPreConsultationForm] = useState(false);
  const [preConsultationData, setPreConsultationData] = useState<PreConsultationForm>({
    currentSymptoms: '',
    medicationsTaken: '',
    vitalSigns: {},
    additionalNotes: ''
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioTestRef = useRef<HTMLAudioElement>(null);

  // Verificación del sistema
  useEffect(() => {
    checkSystem();
    
    // Actualizar tiempo de espera cada minuto
    const interval = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 60000);

    return () => {
      clearInterval(interval);
      // Limpiar stream al desmontar
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkSystem = async () => {
    // Verificar cámara
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSystemCheck(prev => ({ ...prev, camera: 'success' }));
    } catch (error) {
      setSystemCheck(prev => ({ ...prev, camera: 'error' }));
    }

    // Verificar micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setSystemCheck(prev => ({ ...prev, microphone: 'success' }));
    } catch (error) {
      setSystemCheck(prev => ({ ...prev, microphone: 'error' }));
    }

    // Verificar altavoces (simulado)
    setTimeout(() => {
      setSystemCheck(prev => ({ ...prev, speakers: 'success' }));
    }, 1000);

    // Verificar conexión a internet
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (response.ok) {
        setSystemCheck(prev => ({ ...prev, connection: 'success' }));
      } else {
        setSystemCheck(prev => ({ ...prev, connection: 'error' }));
      }
    } catch (error) {
      setSystemCheck(prev => ({ ...prev, connection: 'error' }));
    }

    // Verificar si el sistema está listo
    setTimeout(() => {
      const allChecks = Object.values(systemCheck);
      setIsSystemReady(allChecks.every(check => check === 'success'));
    }, 2000);
  };

  const getCheckIcon = (status: 'checking' | 'success' | 'error') => {
    switch (status) {
      case 'checking':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
    }
  };

  const handleTestSpeakers = () => {
    if (audioTestRef.current) {
      audioTestRef.current.play();
    }
  };

  const handlePreConsultationSubmit = () => {
    // Aquí se enviarían los datos al servidor
    logger.info('Datos pre-consulta:', preConsultationData);
    setShowPreConsultationForm(false);
  };

  const canJoinCall = isSystemReady && consentGiven;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sala de Espera Virtual</h1>
              <p className="text-gray-600 mt-1">Cita médica con {doctorName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Hora de la cita</p>
              <p className="text-lg font-semibold">
                {format(appointmentTime, 'HH:mm', { locale: es })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel izquierdo - Información y verificación */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información de la cita */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Información de la Cita</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Paciente</p>
                  <p className="font-medium flex items-center gap-2">
                    <User size={16} />
                    {patientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Especialidad</p>
                  <p className="font-medium flex items-center gap-2">
                    <Activity size={16} />
                    {specialty}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posición en cola</p>
                  <p className="font-medium">#{queuePosition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tiempo estimado</p>
                  <p className="font-medium">{estimatedWaitTime} minutos</p>
                </div>
              </div>
            </div>

            {/* Verificación del sistema */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Verificación del Sistema</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Camera className="text-gray-400" size={20} />
                    <span>Cámara</span>
                  </div>
                  {getCheckIcon(systemCheck.camera)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="text-gray-400" size={20} />
                    <span>Micrófono</span>
                  </div>
                  {getCheckIcon(systemCheck.microphone)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="text-gray-400" size={20} />
                    <span>Altavoces</span>
                    {systemCheck.speakers === 'success' && (
                      <button
                        onClick={handleTestSpeakers}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Probar
                      </button>
                    )}
                  </div>
                  {getCheckIcon(systemCheck.speakers)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className="text-gray-400" size={20} />
                    <span>Conexión a Internet</span>
                  </div>
                  {getCheckIcon(systemCheck.connection)}
                </div>
              </div>

              {!isSystemReady && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-yellow-600" size={20} />
                    <p className="text-sm text-yellow-800">
                      Por favor, resuelva los problemas detectados antes de unirse a la consulta.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vista previa de video */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {systemCheck.camera === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <Camera size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No se pudo acceder a la cámara</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Acciones y formularios */}
          <div className="space-y-6">
            {/* Consentimiento */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Consentimiento Informado</h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Al continuar, usted acepta:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Realizar la consulta médica por videollamada</li>
                  <li>Que la sesión puede ser grabada con fines médicos</li>
                  <li>Compartir información médica de forma segura</li>
                </ul>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    He leído y acepto los términos de la consulta médica virtual
                  </span>
                </label>
              </div>
            </div>

            {/* Formulario pre-consulta */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Preparación para la Consulta</h2>
              <button
                onClick={() => setShowPreConsultationForm(!showPreConsultationForm)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText size={20} />
                {showPreConsultationForm ? 'Ocultar' : 'Completar'} formulario pre-consulta
              </button>

              {showPreConsultationForm && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Síntomas actuales
                    </label>
                    <textarea
                      value={preConsultationData.currentSymptoms}
                      onChange={(e) => setPreConsultationData({
                        ...preConsultationData,
                        currentSymptoms: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Describa sus síntomas..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicamentos tomados
                    </label>
                    <input
                      type="text"
                      value={preConsultationData.medicationsTaken}
                      onChange={(e) => setPreConsultationData({
                        ...preConsultationData,
                        medicationsTaken: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Lista de medicamentos..."
                    />
                  </div>
                  <button
                    onClick={handlePreConsultationSubmit}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar información
                  </button>
                </div>
              )}
            </div>

            {/* Instrucciones */}
            {showInstructions && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instrucciones</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Busque un lugar tranquilo y bien iluminado</li>
                  <li>Use auriculares para mejor calidad de audio</li>
                  <li>Mantenga su cámara a la altura de los ojos</li>
                  <li>Tenga a mano su historia médica si es necesaria</li>
                </ul>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={onJoinCall}
                disabled={!canJoinCall}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  canJoinCall
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Phone size={20} />
                {canJoinCall ? 'Unirse a la Consulta' : 'Complete los requisitos'}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Contador de tiempo */}
            <div className="text-center text-sm text-gray-500">
              <Clock className="inline-block mr-1" size={16} />
              Esperando hace {waitingTime} minutos
            </div>
          </div>
        </div>
      </div>

      {/* Audio de prueba (oculto) */}
      <audio ref={audioTestRef} src="/test-sound.mp3" />
    </div>
  );
}