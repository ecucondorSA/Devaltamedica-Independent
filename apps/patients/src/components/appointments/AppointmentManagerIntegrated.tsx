/**
 * Gestor de Citas Integrado - Usa los nuevos hooks del backend dockerizado
 * Permite crear, actualizar, cancelar y gestionar citas médicas
 */

'use client';

import React from 'react';

interface AppointmentManagerIntegratedProps {
  patientId: string;
}

const AppointmentManagerIntegrated: React.FC<AppointmentManagerIntegratedProps> = ({
  patientId,
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestor de Citas Integrado</h1>
        <p className="text-gray-600 mb-6">Funcionalidad temporalmente deshabilitada</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">Esta funcionalidad estará disponible próximamente</p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagerIntegrated;
