/**
 * 🔗 B2C COMMUNICATION PAGE - COMPANIES APP
 * Página principal para comunicación con doctores
 */

'use client';

import { useAuth } from '@altamedica/auth/client';
import { useState } from 'react';
import JobApplicationsManager from '../../components/b2c/JobApplicationsManager';

export default function B2CCommunicationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'interviews' | 'notifications'>(
    'applications',
  );

  // Mock company ID - en producción vendría del contexto de auth
  const companyId = user?.companyId || 'mock-company-id';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🔗 Comunicación B2C</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona la comunicación con doctores candidatos
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
                  <span className="text-blue-800 text-sm font-medium">
                    🏢 Empresa ID: {companyId}
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
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Aplicaciones
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 Entrevistas
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
        {activeTab === 'applications' && <JobApplicationsManager companyId={companyId} />}

        {activeTab === 'interviews' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Entrevistas</h3>
            <p className="text-gray-600">
              La funcionalidad de gestión de entrevistas estará disponible próximamente. Por ahora
              puedes programar entrevistas desde la sección de aplicaciones.
            </p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Centro de Notificaciones</h3>
            <p className="text-gray-600">
              Aquí podrás ver todas las notificaciones relacionadas con aplicaciones, entrevistas y
              mensajes de doctores candidatos.
            </p>
          </div>
        )}
      </div>

      {/* Demo Banner */}
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h4 className="font-medium">Sistema B2C Activo</h4>
            <p className="text-sm text-blue-100 mt-1">
              La comunicación en tiempo real con la app de Doctors está habilitada. Los cambios se
              sincronizarán automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
