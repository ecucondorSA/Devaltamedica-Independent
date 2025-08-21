/**
 * 💼 JOB APPLICATIONS PAGE - DOCTORS APP
 * Página para que los doctores gestionen sus aplicaciones de trabajo B2C
 */

'use client';

import { useAuth } from '@altamedica/auth/client';
import { useState } from 'react';
import MyJobApplications from '../../components/b2c/MyJobApplications';

// Context for the useAuth import
// This import is used to access user authentication details.

export default function JobApplicationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-applications' | 'job-search' | 'notifications'>(
    'my-applications',
  );

  // Mock doctor ID - en producción vendría del contexto de auth
  const doctorId = user?.doctorId || user?.id || 'mock-doctor-id';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">💼 Aplicaciones de Trabajo</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona tus aplicaciones y comunícate con empresas contratantes
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
                  <span className="text-blue-800 text-sm font-medium">
                    👨‍⚕️ Doctor ID: {doctorId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Mis Aplicaciones
            </button>
            <button
              onClick={() => setActiveTab('job-search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'job-search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Buscar Empleos
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔔 Notificaciones
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'my-applications' && <MyJobApplications doctorId={doctorId} />}

        {activeTab === 'job-search' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Búsqueda de Empleos Médicos</h3>
            <p className="text-gray-600">
              Explora oportunidades laborales en hospitales, clínicas y centros médicos. Esta
              funcionalidad estará disponible próximamente.
            </p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Centro de Notificaciones</h3>
            <p className="text-gray-600">
              Recibe actualizaciones sobre el estado de tus aplicaciones, entrevistas programadas y
              mensajes de empresas.
            </p>
          </div>
        )}
      </div>

      {/* Demo Banner */}
      <div className="fixed bottom-4 left-4 bg-green-600 text-white rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h4 className="font-medium">Sistema B2C Activo</h4>
            <p className="text-sm text-green-100 mt-1">
              La comunicación en tiempo real con empresas está habilitada. Los cambios se
              sincronizarán automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
