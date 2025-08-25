/**
 * @fileoverview Banner de alerta de emergencia médica
 * @module @altamedica/ui/emergency
 * @description Banner prominente para situaciones de emergencia médica
 */

import { AlertTriangle, Phone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

export interface EmergencyBannerProps {
  type: 'critical' | 'urgent' | 'warning';
  title: string;
  message: string;
  emergencyNumber?: string;
  onDismiss?: () => void;
  onEmergencyCall?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
  sound?: boolean;
}

const typeStyles = {
  critical: 'bg-red-600 text-white border-red-700',
  urgent: 'bg-orange-500 text-white border-orange-600',
  warning: 'bg-yellow-500 text-black border-yellow-600',
};

const typeIcons = {
  critical: '🚨',
  urgent: '⚠️',
  warning: '⚡',
};

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  type = 'urgent',
  title,
  message,
  emergencyNumber = '107', // SAME Argentina
  onDismiss,
  onEmergencyCall,
  autoHide = false,
  autoHideDelay = 10000,
  className,
  sound = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Reproducir sonido de alerta si está habilitado
    if (sound && type === 'critical') {
      const audio = new Audio('/sounds/emergency-alert.mp3');
      audio.play().catch(console.error);
    }

    // Auto-ocultar después del delay
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [sound, type, autoHide, autoHideDelay]);

  // Animación de pulso para emergencias críticas
  useEffect(() => {
    if (type === 'critical') {
      const interval = setInterval(() => {
        setIsAnimating((prev) => !prev);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [type]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleEmergencyCall = () => {
    if (onEmergencyCall) {
      onEmergencyCall();
    } else {
      // Intentar llamar directamente si es móvil
      window.location.href = `tel:${emergencyNumber}`;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      data-testid="emergency-alert"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        'shadow-lg border-b-2',
        typeStyles[type],
        isAnimating && type === 'critical' && 'animate-pulse',
        !isVisible && 'opacity-0 -translate-y-full',
        className,
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Icono de emergencia */}
            <span className="text-2xl animate-bounce">{typeIcons[type]}</span>

            {/* Contenido del mensaje */}
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {title}
              </h3>
              <p className="text-sm opacity-90 mt-1">{message}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2">
            {type === 'critical' && (
              <Button
                data-testid="emergency-call-button"
                onClick={handleEmergencyCall}
                variant="secondary"
                size="sm"
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <Phone className="w-4 h-4 mr-1" />
                Llamar {emergencyNumber}
              </Button>
            )}

            {onDismiss && (
              <Button
                data-testid="emergency-dismiss"
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-current hover:opacity-70"
                aria-label="Cerrar alerta"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Barra de progreso para auto-hide */}
        {autoHide && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-white/50 transition-all"
              style={{
                animation: `progress ${autoHideDelay}ms linear`,
                width: '0%',
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmergencyBanner;
