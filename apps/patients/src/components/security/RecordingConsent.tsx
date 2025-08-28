/**
 * 📹 RECORDING CONSENT COMPONENT - ALTAMEDICA
 * Componente unificado para manejo de consentimientos de grabación y indicadores
 * 
 * Funcionalidades:
 * - Consentimiento informado para grabación de sesiones médicas
 * - Indicador visual de estado de grabación
 * - Cumplimiento HIPAA para grabaciones médicas
 * - Gestión de permisos y revocación de consentimiento
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth  } from '@altamedica/auth';;
import { Button } from '@altamedica/ui';
import { logger } from '@altamedica/shared';
import { 
  VideoCameraIcon,
  MicrophoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Interfaces para Recording Consent
interface RecordingSettings {
  video: boolean;
  audio: boolean;
  screen: boolean;
  duration?: number; // en minutos
  purpose: 'medical_documentation' | 'quality_assurance' | 'training' | 'legal_evidence';
  retention: {
    period: number; // en años
    autoDelete: boolean;
    accessRestrictions: string[];
  };
}

interface ConsentData {
  sessionId: string;
  patientId: string;
  doctorId?: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  recordingSettings: RecordingSettings;
  revokedAt?: Date;
  witnessId?: string;
  consentDocument?: string;
}

interface RecordingConsentProps {
  sessionId: string;
  doctorId?: string;
  defaultSettings?: Partial<RecordingSettings>;
  required?: boolean;
  onConsentChange: (consent: ConsentData | null) => void;
  className?: string;
}

interface RecordingIndicatorProps {
  isRecording: boolean;
  recordingType: 'video' | 'audio' | 'both';
  duration?: number;
  onStop?: () => void;
  className?: string;
}

// Componente principal de Recording Consent
export function RecordingConsent({
  sessionId,
  doctorId,
  defaultSettings,
  required = false,
  onConsentChange,
  className = '',
}: RecordingConsentProps) {
  const { user, getToken } = useAuth();
  
  // Estados del componente
  const [consentGiven, setConsentGiven] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de configuración de grabación
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings>({
    video: true,
    audio: true,
    screen: false,
    purpose: 'medical_documentation',
    retention: {
      period: 7, // 7 años por defecto (HIPAA)
      autoDelete: true,
      accessRestrictions: ['doctor', 'patient', 'authorized_medical_staff'],
    },
    ...defaultSettings,
  });

  const [consentData, setConsentData] = useState<ConsentData | null>(null);

  // Función para manejar cambio de consentimiento
  const handleConsentChange = useCallback(async (granted: boolean) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (granted) {
        // Crear consentimiento
        const newConsentData: ConsentData = {
          sessionId,
          patientId: user.uid,
          doctorId,
          consentGiven: true,
          consentTimestamp: new Date(),
          recordingSettings,
        };

        // Enviar al servidor para registro HIPAA
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/recording/consent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(newConsentData),
        });

        if (!response.ok) {
          throw new Error('Error al registrar consentimiento');
        }

        const result = await response.json();
        
        setConsentData(result.data);
        setConsentGiven(true);
        onConsentChange(result.data);

      } else {
        // Revocar consentimiento
        if (consentData) {
          const revokedData = {
            ...consentData,
            consentGiven: false,
            revokedAt: new Date(),
          };

          const token = await getToken();
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/recording/consent/${consentData.sessionId}/revoke`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ revokedAt: new Date() }),
          });
        }

        setConsentData(null);
        setConsentGiven(false);
        onConsentChange(null);
      }

    } catch (error) {
      logger.error('Error handling consent:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar consentimiento');
    } finally {
      setLoading(false);
    }
  }, [user, getToken, sessionId, doctorId, recordingSettings, consentData, onConsentChange]);

  // Función para actualizar configuración de grabación
  const updateRecordingSettings = useCallback((newSettings: Partial<RecordingSettings>) => {
    setRecordingSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Función para obtener texto de propósito
  const getPurposeText = useCallback((purpose: RecordingSettings['purpose']) => {
    switch (purpose) {
      case 'medical_documentation':
        return 'Documentación médica y historial clínico';
      case 'quality_assurance':
        return 'Aseguramiento de calidad y mejora de servicios';
      case 'training':
        return 'Entrenamiento y educación médica';
      case 'legal_evidence':
        return 'Evidencia legal y protección contra litigios';
      default:
        return 'Propósito no especificado';
    }
  }, []);

  // Render del componente
  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <VideoCameraIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Consentimiento de Grabación
            </h3>
            {required && (
              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded">
                Requerido
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar' : 'Ver'} Detalles
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main consent section */}
        <div className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {consentGiven ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <InformationCircleIcon className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {consentGiven ? (
                  <span className="text-green-700 font-medium">
                    ✓ Ha consentido la grabación de esta sesión médica
                  </span>
                ) : (
                  <>
                    Doy mi consentimiento informado para que esta consulta médica sea <strong>grabada en video y audio</strong> para 
                    fines de <strong>{getPurposeText(recordingSettings.purpose)}</strong>.
                  </>
                )}
              </p>
              
              {consentGiven && consentData && (
                <p className="text-xs text-gray-500 mt-1">
                  Consentimiento otorgado el {consentData.consentTimestamp.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recording settings (when showing details) */}
        {showDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Configuración de Grabación</h4>
            
            <div className="space-y-3">
              {/* Tipo de grabación */}
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de grabación:</label>
                <div className="mt-1 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={recordingSettings.video}
                      onChange={(e) => updateRecordingSettings({ video: e.target.checked })}
                      disabled={consentGiven}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <VideoCameraIcon className="ml-2 h-4 w-4 text-gray-500" />
                    <span className="ml-1 text-sm text-gray-700">Video</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={recordingSettings.audio}
                      onChange={(e) => updateRecordingSettings({ audio: e.target.checked })}
                      disabled={consentGiven}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <MicrophoneIcon className="ml-2 h-4 w-4 text-gray-500" />
                    <span className="ml-1 text-sm text-gray-700">Audio</span>
                  </label>
                </div>
              </div>

              {/* Propósito */}
              <div>
                <label className="text-sm font-medium text-gray-700">Propósito:</label>
                <select
                  value={recordingSettings.purpose}
                  onChange={(e) => updateRecordingSettings({ purpose: e.target.value as RecordingSettings['purpose'] })}
                  disabled={consentGiven}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="medical_documentation">Documentación médica</option>
                  <option value="quality_assurance">Aseguramiento de calidad</option>
                  <option value="training">Entrenamiento médico</option>
                  <option value="legal_evidence">Evidencia legal</option>
                </select>
              </div>

              {/* Retención */}
              <div>
                <label className="text-sm font-medium text-gray-700">Retención de datos:</label>
                <div className="mt-1 text-sm text-gray-600">
                  <p>• Período: {recordingSettings.retention.period} años</p>
                  <p>• Eliminación automática: {recordingSettings.retention.autoDelete ? 'Sí' : 'No'}</p>
                  <p>• Acceso limitado a: {recordingSettings.retention.accessRestrictions.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HIPAA Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Aviso HIPAA</h4>
              <p className="text-sm text-blue-700 mt-1">
                Esta grabación está protegida bajo las regulaciones HIPAA. Solo personal médico autorizado 
                tendrá acceso a la grabación. Puede revocar este consentimiento en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div>
            {consentGiven ? (
              <Button
                variant="outline"
                onClick={() => handleConsentChange(false)}
                disabled={loading}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Revocar Consentimiento
              </Button>
            ) : (
              <Button
                onClick={() => handleConsentChange(true)}
                disabled={loading || (!recordingSettings.video && !recordingSettings.audio)}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Procesando...' : 'Dar Consentimiento'}
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            <a href="#" className="hover:text-gray-700">
              Ver política de privacidad completa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente indicador de grabación
export function RecordingIndicator({
  isRecording,
  recordingType,
  duration = 0,
  onStop,
  className = '',
}: RecordingIndicatorProps) {
  const [currentDuration, setCurrentDuration] = useState(duration);

  // Función para formatear duración
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Efecto para actualizar duración
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setCurrentDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div className={`
      flex items-center space-x-2 px-3 py-2 bg-red-100 border border-red-200 rounded-md
      ${className}
    `}>
      {/* Recording indicator */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-red-700">GRABANDO</span>
      </div>

      {/* Recording type icons */}
      <div className="flex items-center space-x-1">
        {(recordingType === 'video' || recordingType === 'both') && (
          <VideoCameraIcon className="h-4 w-4 text-red-600" />
        )}
        {(recordingType === 'audio' || recordingType === 'both') && (
          <MicrophoneIcon className="h-4 w-4 text-red-600" />
        )}
      </div>

      {/* Duration */}
      <span className="text-sm font-mono text-red-700">
        {formatDuration(currentDuration)}
      </span>

      {/* Stop button */}
      {onStop && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          className="p-1 h-6 w-6 text-red-600 hover:bg-red-200"
        >
          <StopIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Hook para gestión de estado de grabación
export function useRecordingConsent(sessionId: string) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleConsentChange = useCallback((consent: ConsentData | null) => {
    setConsentGiven(!!consent);
    setConsentData(consent);
  }, []);

  const startRecording = useCallback(() => {
    if (consentGiven) {
      setIsRecording(true);
    }
  }, [consentGiven]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  return {
    consentGiven,
    consentData,
    isRecording,
    handleConsentChange,
    startRecording,
    stopRecording,
  };
}