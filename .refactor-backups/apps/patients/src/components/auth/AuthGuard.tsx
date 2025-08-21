'use client';

// 🚀 MIGRATED: Este archivo ahora usa el AuthGuard unificado de @altamedica/auth
// Mantiene la funcionalidad específica de patients app

import { Button, Card, Input } from '@altamedica/ui';
import { AuthGuard as UnifiedAuthGuard, UserRole } from '@altamedica/auth';
import Image from 'next/image';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Componente de loading personalizado para patients
const PatientsLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-6">
      <Image 
        src="/images/AltaMedica-logo.svg" 
        alt="AltaMedica" 
        width={200} 
        height={60}
        priority
      />
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-700 font-medium">Verificando sesión...</p>
      </div>
    </div>
  </div>
);

// Rutas públicas específicas de patients app
const publicPaths = [
  '/debug', // Ruta de debug
  '/auth',  // Rutas de autenticación
  '/public' // Rutas públicas
];

export default function AuthGuard({ children }: AuthGuardProps) {
  return (
    <UnifiedAuthGuard
      requireAuth={true}
      requireRole={UserRole.PATIENT} // Solo pacientes permitidos
      fallbackRedirect="http://localhost:3000/auth/login?redirect=patients&role=patient"
      loadingComponent={<PatientsLoadingComponent />}
      publicPaths={publicPaths}
      checkSSO={true} // Verificación SSO habilitada
      debugMode={process.env.NODE_ENV === 'development'}
    >
      {children}
    </UnifiedAuthGuard>
  );
}