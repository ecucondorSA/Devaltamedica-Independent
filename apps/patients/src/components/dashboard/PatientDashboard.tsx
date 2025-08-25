'use client';

import React from 'react';
// import ClinicalTimeline from './timeline/ClinicalTimeline';
// import DocumentsManager from './documents/DocumentsManager';
// import TeamCommunication from './communication/TeamCommunication';
// import DiagnosisAssistantCard from './cards/DiagnosisAssistantCard';

interface PatientDashboardProps {
  patientId: string;
  viewMode?: 'complete' | 'summary' | 'emergency';
  locale?: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientId,
  viewMode = 'complete',
  locale = 'es-MX',
}) => {
  return (
    <div className="dashboard-container px-4 py-6 max-w-6xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard del Paciente</h1>
        <p className="text-gray-600 mb-6">Funcionalidad temporalmente deshabilitada</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">Esta funcionalidad estará disponible próximamente</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
