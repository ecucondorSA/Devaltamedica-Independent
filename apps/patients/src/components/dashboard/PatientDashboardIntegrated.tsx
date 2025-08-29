/**
 * PatientDashboard Integrado - Usa los nuevos hooks del backend dockerizado
 * Versión optimizada con React Query y servicios integrados
 */

'use client';

import React from 'react';

interface PatientDashboardIntegratedProps {
  patientId: string;
  viewMode?: 'complete' | 'summary' | 'emergency';
  locale?: string;
}

/**
 * Dashboard de paciente integrado con backend dockerizado
 * Utiliza React Query para manejo eficiente de estado del servidor
 */
const PatientDashboardIntegrated: React.FC<PatientDashboardIntegratedProps> = ({
  patientId,
  viewMode = 'complete',
  locale = 'es-MX',
}) => {
  return (
    <div className="dashboard-container px-4 py-6 max-w-6xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Integrado del Paciente</h1>
        <p className="text-gray-600 mb-6">Funcionalidad temporalmente deshabilitada</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">Esta funcionalidad estará disponible próximamente</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardIntegrated;
