/**
 * 🔒 SECURE SESSION LAUNCHER - ALTAMEDICA
 * Componente para iniciar sesiones médicas seguras con validaciones completas
 * 
 * Funcionalidades:
 * - Validación de identidad del paciente
 * - Verificación de dispositivos y conexión
 * - Gestión de consentimientos HIPAA
 * - Launcher seguro para nuevas sesiones (new-secure-session)
 * - Launcher para unirse a sesiones existentes (join-secure-*)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth  } from '@altamedica/auth';;
import { Button } from '@altamedica/ui';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  ShieldCheckIcon, 
  CameraIcon, 
  MicrophoneIcon, 
  WifiIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

// Interfaces para el launcher seguro
interface SecureSessionConfig {
  sessionType: 'new-secure-session' | 'join-secure-consultation' | 'join-secure-followup' | 'join-secure-emergency';
  doctorId?: string;
  appointmentId?: string;
  emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA?: boolean;
  requiresIdentityVerification?: boolean;
  allowedDevices?: ('camera' | 'microphone' | 'speaker')[];
  consentRequirements?: ConsentRequirement[];
}

interface ConsentRequirement {
  type: 'video_recording' | 'data_sharing' | 'treatment_consent' | 'emergency_contact' | 'billing_consent';
  required: boolean;
  title: string;
  description: string;
}

interface SystemCheck {
  device: 'camera' | 'microphone' | 'speaker' | 'connection';
  status: 'checking' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface SecurityValidation {
  identity: boolean;
  device: boolean;
  connection: boolean;
  consents: boolean;
  mfa?: boolean;
}

interface SecureSessionLauncherProps {
  config: SecureSessionConfig;
  onSessionLaunched: (sessionData: any) => void;
  onCancel: () => void;
  className?: string;
}

export function SecureSessionLauncher({
  config,
  onSessionLaunched,
  onCancel,
  className = '',
}: SecureSessionLauncherProps) {
  const { user, getToken } = useAuth();
  
  // Estados del componente
  const [currentStep, setCurrentStep] = useState<'identity' | 'system' | 'consents' | 'launch'>('identity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de validación
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [validation, setValidation] = useState<SecurityValidation>({
    identity: false,
    device: false,
    connection: false,
    consents: false,
    mfa: false,
  });

  // Estados de dispositivos
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({
    cameras: [],
    microphones: [],
    speakers: [],
  });

  const [selectedDevices, setSelectedDevices] = useState<{
    camera?: string;
    microphone?: string;
    speaker?: string;
  }>({});

  // Función para validar identidad del usuario
  const validateIdentity = useCallback(async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    try {
      const token = await getToken();
      if (!token) {
        setError('Token de autenticación no válido');
        return false;
      }

      // Verificar datos del paciente
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/patients/${user.uid}/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionType: config.sessionType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Verificación de identidad fallida');
      }

      const result = await response.json();
      
      setValidation(prev => ({ ...prev, identity: true }));
      return true;

    } catch (error) {
      logger.error('Identity validation error:', error);
      setError('Error en la verificación de identidad');
      return false;
    }
  }, [user, getToken, config.sessionType]);

  // Función para verificar sistema y dispositivos
  const runSystemChecks = useCallback(async () => {
    const checks: SystemCheck[] = [];
    
    // Verificar cámara
    if (config.allowedDevices?.includes('camera')) {
      checks.push({ device: 'camera', status: 'checking', message: 'Verificando cámara...' });
      setSystemChecks([...checks]);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        checks[checks.length - 1] = {
          device: 'camera',
          status: 'success',
          message: 'Cámara funcionando correctamente',
        };
      } catch (error) {
        checks[checks.length - 1] = {
          device: 'camera',
          status: 'error',
          message: 'Error al acceder a la cámara',
          details: 'Verifique permisos del navegador',
        };
      }
    }

    // Verificar micrófono
    if (config.allowedDevices?.includes('microphone')) {
      checks.push({ device: 'microphone', status: 'checking', message: 'Verificando micrófono...' });
      setSystemChecks([...checks]);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        checks[checks.length - 1] = {
          device: 'microphone',
          status: 'success',
          message: 'Micrófono funcionando correctamente',
        };
      } catch (error) {
        checks[checks.length - 1] = {
          device: 'microphone',
          status: 'error',
          message: 'Error al acceder al micrófono',
          details: 'Verifique permisos del navegador',
        };
      }
    }

    // Verificar altavoces
    if (config.allowedDevices?.includes('speaker')) {
      checks.push({ device: 'speaker', status: 'checking', message: 'Verificando altavoces...' });
      setSystemChecks([...checks]);
      
      try {
        // Test de audio básico
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        
        checks[checks.length - 1] = {
          device: 'speaker',
          status: 'success',
          message: 'Altavoces funcionando correctamente',
        };
      } catch (error) {
        checks[checks.length - 1] = {
          device: 'speaker',
          status: 'warning',
          message: 'No se pudo verificar altavoces',
          details: 'Verifique volumen del sistema',
        };
      }
    }

    // Verificar conexión a internet
    checks.push({ device: 'connection', status: 'checking', message: 'Verificando conexión...' });
    setSystemChecks([...checks]);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health`, {
        method: 'GET',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok && latency < 1000) {
        checks[checks.length - 1] = {
          device: 'connection',
          status: 'success',
          message: `Conexión estable (${latency}ms)`,
        };
      } else {
        checks[checks.length - 1] = {
          device: 'connection',
          status: 'warning',
          message: `Conexión lenta (${latency}ms)`,
          details: 'La videollamada puede experimentar retrasos',
        };
      }
    } catch (error) {
      checks[checks.length - 1] = {
        device: 'connection',
        status: 'error',
        message: 'Error de conexión',
        details: 'Verifique su conexión a internet',
      };
    }

    setSystemChecks(checks);
    
    // Validar si el sistema está listo
    const hasErrors = checks.some(check => check.status === 'error');
    setValidation(prev => ({ ...prev, device: !hasErrors, connection: !hasErrors }));

    return !hasErrors;
  }, [config.allowedDevices]);

  // Función para obtener dispositivos disponibles
  const getAvailableDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const microphones = deviceList.filter(device => device.kind === 'audioinput');
      const speakers = deviceList.filter(device => device.kind === 'audiooutput');

      setDevices({ cameras, microphones, speakers });

      // Seleccionar dispositivos por defecto
      setSelectedDevices({
        camera: cameras[0]?.deviceId,
        microphone: microphones[0]?.deviceId,
        speaker: speakers[0]?.deviceId,
      });

    } catch (error) {
      logger.error('Error getting devices:', error);
    }
  }, []);

  // Función para manejar consentimientos
  const handleConsentChange = useCallback((consentType: string, granted: boolean) => {
    setConsents(prev => {
      const newConsents = { ...prev, [consentType]: granted };
      
      // Verificar si todos los consentimientos requeridos están dados
      const allRequired = config.consentRequirements?.filter(req => req.required) || [];
      const allGranted = allRequired.every(req => newConsents[req.type] === true);
      
      setValidation(prev => ({ ...prev, consents: allGranted }));
      
      return newConsents;
    });
  }, [config.consentRequirements]);

  // Función para lanzar sesión segura
  const launchSecureSession = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      
      const sessionData = {
        sessionType: config.sessionType,
        patientId: user.uid,
        doctorId: config.doctorId,
        appointmentId: config.appointmentId,
        emergencyLevel: config.emergencyLevel,
        selectedDevices,
        consents,
        systemValidation: validation,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/telemedicine/secure-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Error al crear sesión segura');
      }

      const result = await response.json();
      onSessionLaunched(result.data);

    } catch (error) {
      logger.error('Error launching secure session:', error);
      setError(error instanceof Error ? error.message : 'Error al lanzar sesión');
    } finally {
      setLoading(false);
    }
  }, [user, getToken, config, selectedDevices, consents, validation, onSessionLaunched]);

  // Efectos para manejo de pasos
  useEffect(() => {
    if (currentStep === 'identity') {
      validateIdentity();
    }
  }, [currentStep, validateIdentity]);

  useEffect(() => {
    if (currentStep === 'system') {
      getAvailableDevices();
      runSystemChecks();
    }
  }, [currentStep, getAvailableDevices, runSystemChecks]);

  // Función para determinar si puede continuar al siguiente paso
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'identity':
        return validation.identity;
      case 'system':
        return validation.device && validation.connection;
      case 'consents':
        return validation.consents;
      case 'launch':
        return Object.values(validation).every(Boolean);
      default:
        return false;
    }
  }, [currentStep, validation]);

  // Función para ir al siguiente paso
  const nextStep = useCallback(() => {
    const steps: Array<typeof currentStep> = ['identity', 'system', 'consents', 'launch'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  // Render del componente
  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <LockClosedIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Lanzador de Sesión Segura
          </h2>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Identidad', 'Sistema', 'Consentimientos', 'Lanzar'].map((step, index) => {
            const steps = ['identity', 'system', 'consents', 'launch'];
            const isActive = steps[index] === currentStep;
            const isCompleted = steps.indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < 3 && <div className="mx-4 h-0.5 w-8 bg-gray-200" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="mb-8">
        {currentStep === 'identity' && (
          <div className="text-center">
            <ShieldCheckIcon className="mx-auto h-16 w-16 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verificando Identidad
            </h3>
            <p className="text-gray-600">
              Validando su identidad y permisos para acceder a la sesión médica...
            </p>
            {validation.identity && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">✓ Identidad verificada correctamente</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'system' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Verificación del Sistema
            </h3>
            <div className="space-y-4">
              {systemChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {check.device === 'camera' && <CameraIcon className="h-5 w-5" />}
                    {check.device === 'microphone' && <MicrophoneIcon className="h-5 w-5" />}
                    {check.device === 'speaker' && <span>🔊</span>}
                    {check.device === 'connection' && <WifiIcon className="h-5 w-5" />}
                    <div>
                      <p className="font-medium">{check.message}</p>
                      {check.details && (
                        <p className="text-sm text-gray-500">{check.details}</p>
                      )}
                    </div>
                  </div>
                  <div className={`
                    w-3 h-3 rounded-full
                    ${check.status === 'success' ? 'bg-green-500' :
                      check.status === 'warning' ? 'bg-yellow-500' :
                      check.status === 'error' ? 'bg-red-500' : 'bg-gray-300 animate-pulse'}
                  `} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'consents' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Consentimientos Médicos
            </h3>
            <div className="space-y-4">
              {config.consentRequirements?.map((consent, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={consents[consent.type] || false}
                      onChange={(e) => handleConsentChange(consent.type, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {consent.title}
                        {consent.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {consent.description}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'launch' && (
          <div className="text-center">
            <PlayIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Listo para Iniciar
            </h3>
            <p className="text-gray-600 mb-6">
              Todos los sistemas están verificados. Puede iniciar la sesión médica segura.
            </p>
            <div className="bg-gray-50 p-4 rounded-md text-left">
              <h4 className="font-medium text-gray-900 mb-2">Resumen de la sesión:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tipo: {config.sessionType}</li>
                {config.doctorId && <li>• Doctor ID: {config.doctorId}</li>}
                {config.emergencyLevel && <li>• Nivel de emergencia: {config.emergencyLevel}</li>}
                <li>• Dispositivos verificados: {systemChecks.filter(c => c.status === 'success').length}/{systemChecks.length}</li>
                <li>• Consentimientos: {Object.values(consents).filter(Boolean).length}/{config.consentRequirements?.length || 0}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const steps: Array<typeof currentStep> = ['identity', 'system', 'consents', 'launch'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentStep === 'identity'}
        >
          Anterior
        </Button>

        {currentStep === 'launch' ? (
          <Button
            onClick={launchSecureSession}
            disabled={!canProceed() || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión Segura'}
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}

// Configuraciones predefinidas para diferentes tipos de sesión
export const SECURE_SESSION_CONFIGS = {
  'new-secure-session': {
    sessionType: 'new-secure-session' as const,
    requiresMFA: false,
    requiresIdentityVerification: true,
    allowedDevices: ['camera', 'microphone', 'speaker'] as const,
    consentRequirements: [
      {
        type: 'video_recording' as const,
        required: true,
        title: 'Grabación de Video',
        description: 'Consiento que esta consulta médica sea grabada para fines de documentación y calidad.',
      },
      {
        type: 'treatment_consent' as const,
        required: true,
        title: 'Consentimiento de Tratamiento',
        description: 'Consiento recibir consulta médica a través de telemedicina.',
      },
      {
        type: 'data_sharing' as const,
        required: false,
        title: 'Compartir Datos (Opcional)',
        description: 'Permito compartir datos médicos con otros profesionales si es necesario.',
      },
    ],
  },
  'join-secure-emergency': {
    sessionType: 'join-secure-emergency' as const,
    requiresMFA: false,
    requiresIdentityVerification: true,
    allowedDevices: ['camera', 'microphone', 'speaker'] as const,
    emergencyLevel: 'high' as const,
    consentRequirements: [
      {
        type: 'emergency_contact' as const,
        required: true,
        title: 'Contacto de Emergencia',
        description: 'Autorizo contactar a mi contacto de emergencia si es necesario.',
      },
      {
        type: 'treatment_consent' as const,
        required: true,
        title: 'Consentimiento de Emergencia',
        description: 'Consiento recibir atención médica de emergencia vía telemedicina.',
      },
    ],
  },
} as const;