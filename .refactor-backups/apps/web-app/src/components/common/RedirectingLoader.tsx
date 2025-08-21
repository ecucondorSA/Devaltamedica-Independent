'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useEffect, useState } from 'react';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

interface RedirectingLoaderProps {
  targetApp?: string;
  message?: string;
  showProgress?: boolean;
}

const RedirectingLoader: React.FC<RedirectingLoaderProps> = ({
  targetApp,
  message,
  showProgress = true
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    { text: 'Verificando credenciales', icon: Shield },
    { text: 'Preparando tu sesión', icon: CheckCircle },
    { text: targetApp ? `Redirigiendo a ${targetApp}` : 'Cargando dashboard', icon: Loader2 },
  ];

  useEffect(() => {
    // Simular progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 10;
      });
    }, 200);

    // Cambiar pasos
    const stepInterval = setInterval(() => {
      setStep(prev => {
        if (prev >= steps.length - 1) return steps.length - 1;
        return prev + 1;
      });
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [steps.length]);

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Icono animado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center animate-pulse">
              <CurrentIcon className="h-10 w-10 text-white animate-spin" />
            </div>
            {/* Círculos decorativos */}
            <div className="absolute inset-0 -z-10">
              <div className="w-20 h-20 bg-blue-400 rounded-full animate-ping opacity-20" />
            </div>
          </div>
        </div>

        {/* Texto del paso actual */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[step].text}
          </h2>
          {message && (
            <p className="text-gray-600 text-sm">{message}</p>
          )}
        </div>

        {/* Barra de progreso */}
        {showProgress && (
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              {progress}% completado
            </p>
          </div>
        )}

        {/* Indicadores de pasos */}
        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index <= step 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Información adicional */}
        {targetApp && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <span className="font-medium">Nota:</span> Serás redirigido a tu portal especializado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectingLoader;