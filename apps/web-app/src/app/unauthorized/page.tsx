'use client';

import { Button } from '@altamedica/ui';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-neutral-50 to-orange-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso No Autorizado</h1>

          <p className="text-gray-600 mb-8">
            No tienes permisos para acceder a esta página. Por favor, verifica que estás usando la
            cuenta correcta.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Ir a mi Dashboard
            </Button>

            <button
              onClick={() => router.back()}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver atrás
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Si crees que esto es un error, contacta a soporte en{' '}
            <a href="mailto:support@altamedica.com" className="text-blue-600 hover:underline">
              support@altamedica.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
