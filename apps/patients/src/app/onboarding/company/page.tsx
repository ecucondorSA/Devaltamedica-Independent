'use client';
import { useRouter } from 'next/navigation';

export default function CompanyOnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Configuración Empresarial</h1>
          <p className="text-purple-100">Configura tu institución médica</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Página de onboarding temporalmente deshabilitada por problemas de sintaxis
            </p>
            <p className="text-sm text-gray-400">
              Se mostrará cuando se resuelvan los problemas de sintaxis
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
