'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Cargando...', 
  fullScreen = true 
}) => {
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="relative inline-flex">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 animate-ping">
            <Loader2 className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
        <p className="mt-2 text-sm text-gray-500">Por favor espera un momento...</p>
      </div>
    </div>
  );
}; 