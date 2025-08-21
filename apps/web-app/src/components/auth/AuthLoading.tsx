'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface AuthLoadingProps {
  message?: string;
}

export const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = 'Verificando autenticación...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-ping opacity-20"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ALTAMEDICA</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;