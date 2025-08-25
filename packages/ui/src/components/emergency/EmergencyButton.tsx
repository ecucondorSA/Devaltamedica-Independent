/**
 * @fileoverview Botón de emergencia médica prominente
 * @module @altamedica/ui/emergency
 * @description Botón de pánico para activar protocolos de emergencia
 */

import { AlertTriangle, Heart, Loader2, Phone } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../dialog';
import { cn } from '../../lib/utils';
import { Textarea } from '../../textarea';
import { Button } from '../Button';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  },
};
export interface EmergencyType {
  code: string;
  label: string;
  icon: React.ReactNode;
  severity: 'critical' | 'urgent' | 'moderate';
  description: string;
}

export interface EmergencyButtonProps {
  onEmergencyActivate: (type: EmergencyType, notes?: string) => Promise<void>;
  onEmergencyCancel?: () => void;
  location?: { lat: number; lng: number };
  patientId?: string;
  sessionId?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating';
  showPulse?: boolean;
  className?: string;
}

const EMERGENCY_TYPES: EmergencyType[] = [
  {
    code: 'CODE_BLUE',
    label: 'Paro Cardíaco',
    icon: <Heart className="w-5 h-5" />,
    severity: 'critical',
    description: 'Paciente sin pulso o respiración',
  },
  {
    code: 'CODE_STEMI',
    label: 'Infarto Agudo',
    icon: <Heart className="w-5 h-5" />,
    severity: 'critical',
    description: 'Dolor torácico con cambios ECG',
  },
  {
    code: 'CODE_STROKE',
    label: 'ACV/Stroke',
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: 'critical',
    description: 'Déficit neurológico agudo',
  },
  {
    code: 'CODE_RESPIRATORY',
    label: 'Insuf. Respiratoria',
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: 'urgent',
    description: 'Dificultad respiratoria severa',
  },
  {
    code: 'CODE_ANAPHYLAXIS',
    label: 'Anafilaxia',
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: 'urgent',
    description: 'Reacción alérgica grave',
  },
  {
    code: 'GENERAL_EMERGENCY',
    label: 'Otra Emergencia',
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: 'moderate',
    description: 'Situación médica urgente',
  },
];

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onEmergencyActivate,
  onEmergencyCancel,
  location,
  patientId,
  sessionId,
  disabled = false,
  size = 'md',
  variant = 'default',
  showPulse = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Countdown para confirmación
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleConfirmedActivation();
    }
  }, [countdown]);

  const handleEmergencyClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleTypeSelect = (typeCode: string) => {
    setSelectedType(typeCode);
    const emergencyType = EMERGENCY_TYPES.find((t) => t.code === typeCode);

    // Para emergencias críticas, iniciar countdown
    if (emergencyType?.severity === 'critical') {
      setIsConfirming(true);
      setCountdown(3); // 3 segundos para cancelar
    }
  };

  const handleConfirmedActivation = async () => {
    const emergencyType = EMERGENCY_TYPES.find((t) => t.code === selectedType);
    if (!emergencyType) return;

    setIsActivating(true);

    try {
      await onEmergencyActivate(emergencyType, notes);
      setIsOpen(false);
      resetState();
    } catch (error) {
      logger.error('Error activando emergencia:', error);
      // El componente padre debe manejar el error
    } finally {
      setIsActivating(false);
    }
  };

  const handleCancel = () => {
    if (onEmergencyCancel) {
      onEmergencyCancel();
    }
    resetState();
    setIsOpen(false);
  };

  const resetState = () => {
    setSelectedType('');
    setNotes('');
    setCountdown(null);
    setIsConfirming(false);
  };

  const buttonContent = (
    <>
      {variant === 'floating' ? (
        <div className="relative">
          <Phone className="w-6 h-6" />
          {showPulse && !disabled && (
            <span className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
      ) : (
        <>
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Emergencia</span>
        </>
      )}
    </>
  );

  return (
    <>
      {variant === 'floating' ? (
        <button
          data-testid="emergency-consultations"
          onClick={handleEmergencyClick}
          disabled={disabled}
          className={cn(
            'fixed bottom-6 right-6 z-40',
            'bg-red-600 hover:bg-red-700 text-white',
            'rounded-full shadow-lg hover:shadow-xl',
            'transition-all duration-200 hover:scale-110',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'w-16 h-16 flex items-center justify-center',
            showPulse && !disabled && 'animate-pulse',
            className,
          )}
          aria-label="Activar emergencia médica"
        >
          {buttonContent}
        </button>
      ) : (
        <Button
          data-testid="emergency-consultations"
          onClick={handleEmergencyClick}
          disabled={disabled}
          variant="destructive"
          className={cn(sizeClasses[size], showPulse && !disabled && 'animate-pulse', className)}
        >
          {buttonContent}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Activar Protocolo de Emergencia
            </DialogTitle>
            <DialogDescription>
              Seleccione el tipo de emergencia médica. Esta acción notificará inmediatamente al
              equipo médico y servicios de emergencia.
            </DialogDescription>
          </DialogHeader>

          {!isConfirming ? (
            <div className="space-y-4">
              <div role="radiogroup" aria-label="Tipos de emergencia" className="space-y-2">
                {EMERGENCY_TYPES.map((type) => (
                  <div
                    key={type.code}
                    className={cn(
                      'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedType === type.code
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                    onClick={() => handleTypeSelect(type.code)}
                  >
                    <input
                      type="radio"
                      id={type.code}
                      name="emergency-type"
                      className="mt-1"
                      checked={selectedType === type.code}
                      onChange={() => handleTypeSelect(type.code)}
                    />
                    <label htmlFor={type.code} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-semibold">
                        {type.icon}
                        {type.label}
                        {type.severity === 'critical' && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                            CRÍTICO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </label>
                  </div>
                ))}
              </div>

              {selectedType && (
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notas adicionales (opcional)
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describa brevemente la situación..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-red-600 mb-4">{countdown}</div>
              <p className="text-lg font-semibold mb-2">
                Activando {EMERGENCY_TYPES.find((t) => t.code === selectedType)?.label}
              </p>
              <p className="text-sm text-gray-600">La emergencia se activará automáticamente</p>
            </div>
          )}

          <DialogFooter>
            {!isConfirming ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isActivating}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedType) {
                      const type = EMERGENCY_TYPES.find((t) => t.code === selectedType);
                      if (type?.severity === 'critical') {
                        handleTypeSelect(selectedType);
                      } else {
                        handleConfirmedActivation();
                      }
                    }
                  }}
                  disabled={!selectedType || isActivating}
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activando...
                    </>
                  ) : (
                    'Activar Emergencia'
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setCountdown(null);
                  setIsConfirming(false);
                }}
                className="w-full"
              >
                Cancelar Activación
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmergencyButton;
