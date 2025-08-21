/**
 * @fileoverview Componente de recuperación de conexión WebRTC
 * @module @altamedica/ui/webrtc
 * @description UI para manejo de reconexión automática y recuperación de errores
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../../card';
import { Button } from '../../button';
import { Progress } from '../../progress';
import { Alert, AlertDescription, AlertTitle } from '../../alert';

export interface RecoveryStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
}

export interface ConnectionRecoveryProps {
  isRecovering: boolean;
  recoveryAttempt: number;
  maxAttempts?: number;
  onManualReconnect?: () => void;
  onCancelRecovery?: () => void;
  className?: string;
}

const RECOVERY_STEPS: RecoveryStep[] = [
  { id: 'check-network', label: 'Verificando conexión de red' },
  { id: 'check-signaling', label: 'Conectando con servidor de señalización' },
  { id: 'check-ice', label: 'Estableciendo candidatos ICE' },
  { id: 'establish-connection', label: 'Restableciendo conexión peer-to-peer' },
  { id: 'verify-media', label: 'Verificando streams de audio/video' }
];

export const ConnectionRecovery: React.FC<ConnectionRecoveryProps> = ({
  isRecovering,
  recoveryAttempt,
  maxAttempts = 3,
  onManualReconnect,
  onCancelRecovery,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<RecoveryStep[]>(
    RECOVERY_STEPS.map(step => ({ ...step, status: 'pending' }))
  );
  const [recoveryProgress, setRecoveryProgress] = useState(0);

  useEffect(() => {
    if (!isRecovering) {
      // Reset cuando no está recuperando
      setCurrentStep(0);
      setRecoveryProgress(0);
      setSteps(RECOVERY_STEPS.map(step => ({ ...step, status: 'pending' })));
      return;
    }

    // Simular proceso de recuperación
    const stepDuration = 2000; // 2s por paso
    const totalSteps = RECOVERY_STEPS.length;

    const processStep = (stepIndex: number) => {
      if (stepIndex >= totalSteps) {
        // Recuperación completa
        return;
      }

      // Marcar paso actual como en ejecución
      setSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === stepIndex ? 'running' : 
                idx < stepIndex ? 'success' : 'pending'
      })));

      setCurrentStep(stepIndex);
      setRecoveryProgress((stepIndex / totalSteps) * 100);

      // Simular éxito/fallo del paso (90% éxito)
      setTimeout(() => {
        const success = Math.random() > 0.1;
        
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === stepIndex ? (success ? 'success' : 'failed') : step.status
        })));

        if (success) {
          // Continuar con el siguiente paso
          setTimeout(() => processStep(stepIndex + 1), 500);
        } else {
          // Fallo en este paso - detener recuperación
          setRecoveryProgress(0);
        }
      }, stepDuration);
    };

    // Iniciar proceso de recuperación
    processStep(0);

  }, [isRecovering, recoveryAttempt]);

  const hasFailedSteps = steps.some(step => step.status === 'failed');
  const allStepsComplete = steps.every(step => step.status === 'success');

  if (!isRecovering && !hasFailedSteps && !allStepsComplete) {
    return null;
  }

  return (
    <Card 
      data-testid="connection-recovery"
      className={cn('p-4 max-w-md', className)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecovering ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            ) : hasFailedSteps ? (
              <WifiOff className="w-5 h-5 text-red-600" />
            ) : (
              <Wifi className="w-5 h-5 text-green-600" />
            )}
            <h3 className="font-semibold">
              {isRecovering ? 'Recuperando conexión' : 
               hasFailedSteps ? 'Recuperación fallida' : 
               'Conexión recuperada'}
            </h3>
          </div>
          
          {isRecovering && (
            <span className="text-sm text-gray-600">
              Intento {recoveryAttempt}/{maxAttempts}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {isRecovering && (
          <Progress 
            value={recoveryProgress} 
            className="h-2"
            data-testid="recovery-progress"
          />
        )}

        {/* Recovery steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                step.status === 'running' && 'bg-blue-50',
                step.status === 'success' && 'bg-green-50',
                step.status === 'failed' && 'bg-red-50'
              )}
            >
              {/* Step icon */}
              <div className="flex-shrink-0">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                {step.status === 'running' && (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                )}
                {step.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              {/* Step label */}
              <span className={cn(
                'text-sm',
                step.status === 'pending' && 'text-gray-500',
                step.status === 'running' && 'text-blue-700 font-medium',
                step.status === 'success' && 'text-green-700',
                step.status === 'failed' && 'text-red-700'
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {(hasFailedSteps || recoveryAttempt >= maxAttempts) && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo recuperar la conexión</AlertTitle>
            <AlertDescription>
              {recoveryAttempt >= maxAttempts 
                ? 'Se alcanzó el número máximo de intentos de reconexión.'
                : 'Hubo un error durante el proceso de recuperación.'}
            </AlertDescription>
          </Alert>
        )}

        {allStepsComplete && (
          <Alert 
            variant="default" 
            className="border-green-200 bg-green-50"
            data-testid="connection-restored"
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertTitle>Conexión restablecida</AlertTitle>
            <AlertDescription>
              La videollamada se ha recuperado exitosamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {(hasFailedSteps || !isRecovering) && onManualReconnect && (
            <Button
              onClick={onManualReconnect}
              variant="default"
              size="sm"
              className="flex-1"
              data-testid="manual-reconnect"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar manualmente
            </Button>
          )}
          
          {isRecovering && onCancelRecovery && (
            <Button
              onClick={onCancelRecovery}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConnectionRecovery;