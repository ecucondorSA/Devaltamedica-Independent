/**
 * 🔐 MFA CHALLENGE COMPONENT - ALTAMEDICA
 * Componente para autenticación multifactor en sesiones médicas críticas
 * 
 * Funcionalidades:
 * - Múltiples métodos de MFA (SMS, Email, TOTP, Biométrico)
 * - Validación de códigos de verificación
 * - Estados de progreso y error
 * - Integración con sesiones médicas seguras
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth  } from '@altamedica/auth';;
import { Button } from '@altamedica/ui';
import { logger } from '@altamedica/shared';
import { 
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  FingerprintIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Interfaces para MFA
interface MFAMethod {
  type: 'sms' | 'email' | 'totp' | 'biometric' | 'backup_codes';
  enabled: boolean;
  primary: boolean;
  identifier?: string; // Número de teléfono parcial, email parcial, etc.
  lastUsed?: Date;
}

interface MFAChallengeState {
  step: 'select_method' | 'verify_code' | 'completed' | 'failed';
  selectedMethod: MFAMethod['type'] | null;
  loading: boolean;
  error: string | null;
  attemptsRemaining: number;
  timeRemaining: number; // Para códigos con expiración
  verified: boolean;
}

interface MFAChallengeProps {
  sessionId: string;
  requiredLevel: 'standard' | 'high' | 'critical';
  onSuccess: (mfaToken: string) => void;
  onCancel: () => void;
  className?: string;
}

interface MFAStatusProps {
  isRequired: boolean;
  currentLevel: MFAChallengeProps['requiredLevel'];
  isVerified: boolean;
  onTriggerMFA: () => void;
  className?: string;
}

// Componente principal de MFA Challenge
export function MFAChallenge({
  sessionId,
  requiredLevel,
  onSuccess,
  onCancel,
  className = '',
}: MFAChallengeProps) {
  const { user, getToken } = useAuth();
  
  // Estados del componente
  const [state, setState] = useState<MFAChallengeState>({
    step: 'select_method',
    selectedMethod: null,
    loading: false,
    error: null,
    attemptsRemaining: 3,
    timeRemaining: 0,
    verified: false,
  });

  const [availableMethods, setAvailableMethods] = useState<MFAMethod[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Refs para manejo de timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Función para obtener métodos MFA disponibles
  const getAvailableMFAMethods = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/mfa/methods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al obtener métodos MFA');
      }

      const result = await response.json();
      setAvailableMethods(result.data || []);

      // Auto-seleccionar método primario si solo hay uno disponible
      const enabledMethods = result.data?.filter((method: MFAMethod) => method.enabled) || [];
      if (enabledMethods.length === 1) {
        setState(prev => ({ ...prev, selectedMethod: enabledMethods[0].type }));
      }

    } catch (error) {
      logger.error('Error getting MFA methods:', error);
      setState(prev => ({ ...prev, error: 'Error al cargar métodos de autenticación' }));
    }
  }, [user, getToken]);

  // Función para enviar código MFA
  const sendMFACode = useCallback(async (method: MFAMethod['type']) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/mfa/send-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          method,
          requiredLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar código de verificación');
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        step: 'verify_code',
        selectedMethod: method,
        loading: false,
        timeRemaining: result.expiresIn || 300, // 5 minutos por defecto
      }));

      // Iniciar timer para expiración
      startExpirationTimer(result.expiresIn || 300);

      // Focus en input de código
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);

    } catch (error) {
      logger.error('Error sending MFA code:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al enviar código',
      }));
    }
  }, [user, getToken, sessionId, requiredLevel]);

  // Función para verificar código MFA
  const verifyMFACode = useCallback(async (code: string) => {
    if (!user || !state.selectedMethod) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/mfa/verify-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          method: state.selectedMethod,
          code,
          requiredLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Código de verificación incorrecto');
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        step: 'completed',
        loading: false,
        verified: true,
      }));

      stopExpirationTimer();
      onSuccess(result.mfaToken);

    } catch (error) {
      logger.error('Error verifying MFA code:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al verificar código',
        attemptsRemaining: Math.max(prev.attemptsRemaining - 1, 0),
      }));

      // Si no quedan intentos, fallar la verificación
      if (state.attemptsRemaining <= 1) {
        setState(prev => ({ ...prev, step: 'failed' }));
        stopExpirationTimer();
      }
    }
  }, [user, getToken, sessionId, state.selectedMethod, state.attemptsRemaining, requiredLevel, onSuccess]);

  // Función para iniciar biometric authentication
  const verifyBiometric = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar soporte de WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error('Autenticación biométrica no soportada en este navegador');
      }

      const token = await getToken();
      
      // Obtener challenge del servidor
      const challengeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/mfa/biometric/challenge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId, requiredLevel }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Error al obtener challenge biométrico');
      }

      const challengeData = await challengeResponse.json();
      
      // Realizar autenticación biométrica
      const credential = await navigator.credentials.get({
        publicKey: challengeData.publicKeyOptions,
      });

      if (!credential) {
        throw new Error('Autenticación biométrica cancelada');
      }

      // Verificar credential en el servidor
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/mfa/biometric/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array((credential as any).rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array((credential as any).response.authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array((credential as any).response.clientDataJSON)),
              signature: Array.from(new Uint8Array((credential as any).response.signature)),
              userHandle: (credential as any).response.userHandle ? Array.from(new Uint8Array((credential as any).response.userHandle)) : null,
            },
            type: credential.type,
          },
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Error al verificar autenticación biométrica');
      }

      const result = await verifyResponse.json();
      
      setState(prev => ({
        ...prev,
        step: 'completed',
        loading: false,
        verified: true,
      }));

      onSuccess(result.mfaToken);

    } catch (error) {
      logger.error('Error with biometric authentication:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error en autenticación biométrica',
      }));
    }
  }, [getToken, sessionId, requiredLevel, onSuccess]);

  // Función para iniciar timer de expiración
  const startExpirationTimer = useCallback((seconds: number) => {
    stopExpirationTimer();
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          return { ...prev, timeRemaining: 0, error: 'Código expirado' };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
  }, []);

  // Función para detener timer de expiración
  const stopExpirationTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Función para formatear tiempo restante
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Función para obtener icono del método MFA
  const getMethodIcon = useCallback((method: MFAMethod['type']) => {
    switch (method) {
      case 'sms':
        return <DevicePhoneMobileIcon className="h-6 w-6" />;
      case 'email':
        return <EnvelopeIcon className="h-6 w-6" />;
      case 'totp':
        return <KeyIcon className="h-6 w-6" />;
      case 'biometric':
        return <FingerprintIcon className="h-6 w-6" />;
      default:
        return <ShieldCheckIcon className="h-6 w-6" />;
    }
  }, []);

  // Función para obtener nombre del método MFA
  const getMethodName = useCallback((method: MFAMethod) => {
    switch (method.type) {
      case 'sms':
        return `SMS a ${method.identifier || '***-***-****'}`;
      case 'email':
        return `Email a ${method.identifier || '***@***.com'}`;
      case 'totp':
        return 'Aplicación de autenticación';
      case 'biometric':
        return 'Huella digital / Face ID';
      case 'backup_codes':
        return 'Códigos de respaldo';
      default:
        return 'Método desconocido';
    }
  }, []);

  // Efecto para cargar métodos MFA al montar
  useEffect(() => {
    getAvailableMFAMethods();
  }, [getAvailableMFAMethods]);

  // Efecto para cleanup del timer
  useEffect(() => {
    return () => {
      stopExpirationTimer();
    };
  }, [stopExpirationTimer]);

  // Render del componente
  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">
          Verificación Adicional Requerida
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Esta sesión médica requiere autenticación de {requiredLevel === 'critical' ? 'nivel crítico' : requiredLevel === 'high' ? 'alto nivel' : 'nivel estándar'}
        </p>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      {state.step === 'select_method' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Seleccione un método de verificación:
          </h3>
          <div className="space-y-3">
            {availableMethods.filter(method => method.enabled).map((method, index) => (
              <button
                key={index}
                onClick={() => {
                  if (method.type === 'biometric') {
                    verifyBiometric();
                  } else {
                    sendMFACode(method.type);
                  }
                }}
                disabled={state.loading}
                className="w-full flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <div className="text-blue-600">
                  {getMethodIcon(method.type)}
                </div>
                <div className="ml-3 text-left">
                  <p className="font-medium text-gray-900">
                    {getMethodName(method)}
                  </p>
                  {method.primary && (
                    <p className="text-xs text-blue-600">Método principal</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {state.step === 'verify_code' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ingrese el código de verificación
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enviamos un código a {getMethodName(availableMethods.find(m => m.type === state.selectedMethod)!)}
          </p>
          
          {/* Timer */}
          {state.timeRemaining > 0 && (
            <div className="flex items-center justify-center mb-4 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              Expira en {formatTime(state.timeRemaining)}
            </div>
          )}

          <div className="mb-4">
            <input
              ref={codeInputRef}
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
            />
          </div>

          <Button
            onClick={() => verifyMFACode(verificationCode)}
            disabled={verificationCode.length < 4 || state.loading || state.timeRemaining <= 0}
            className="w-full mb-3"
          >
            {state.loading ? 'Verificando...' : 'Verificar Código'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => setState(prev => ({ ...prev, step: 'select_method' }))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Usar otro método
            </button>
          </div>

          {state.attemptsRemaining < 3 && (
            <p className="text-sm text-yellow-600 text-center mt-2">
              Intentos restantes: {state.attemptsRemaining}
            </p>
          )}
        </div>
      )}

      {state.step === 'completed' && (
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Verificación Completada
          </h3>
          <p className="text-gray-600">
            Su identidad ha sido verificada exitosamente. Procediendo con la sesión médica...
          </p>
        </div>
      )}

      {state.step === 'failed' && (
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Verificación Fallida
          </h3>
          <p className="text-gray-600 mb-4">
            Se agotaron los intentos de verificación. Por favor, contacte al soporte técnico.
          </p>
          <Button variant="outline" onClick={onCancel}>
            Volver
          </Button>
        </div>
      )}

      {/* Cancel button (except when completed) */}
      {state.step !== 'completed' && state.step !== 'failed' && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// Componente de estado MFA
export function MFAStatus({
  isRequired,
  currentLevel,
  isVerified,
  onTriggerMFA,
  className = '',
}: MFAStatusProps) {
  if (!isRequired) {
    return null;
  }

  const getStatusColor = () => {
    if (isVerified) return 'text-green-600 bg-green-50 border-green-200';
    if (currentLevel === 'critical') return 'text-red-600 bg-red-50 border-red-200';
    if (currentLevel === 'high') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusIcon = () => {
    if (isVerified) return <CheckCircleIcon className="h-5 w-5" />;
    return <ShieldCheckIcon className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (isVerified) return 'MFA Verificado';
    return `MFA Requerido (${currentLevel})`;
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-md ${getStatusColor()} ${className}`}>
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="font-medium">
          {getStatusText()}
        </span>
      </div>
      {!isVerified && (
        <Button
          size="sm"
          onClick={onTriggerMFA}
          className="ml-3"
        >
          Verificar
        </Button>
      )}
    </div>
  );
}