import React from 'react';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  message?: string;
  redirectTo?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  message = 'No tienes permisos para acceder a esta página',
  redirectTo = '/'
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        <button
          onClick={() => router.push(redirectTo)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;