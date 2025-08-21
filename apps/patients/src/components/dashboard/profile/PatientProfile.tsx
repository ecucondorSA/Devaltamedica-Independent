import React from 'react';
import { Patient } from '@altamedica/types';

interface PatientProfileProps {
  patient: Patient | null;
  compact?: boolean;
  emergencyMode?: boolean;
}

const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  compact = false,
  emergencyMode = false
}) => {
  if (!patient) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          emergencyMode ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {patient.name.charAt(0)}
        </div>
        <div>
          <h2 className={`font-semibold ${
            emergencyMode ? 'text-white' : 'text-gray-900'
          }`}>
            {patient.name}
          </h2>
          <p className={`text-sm ${
            emergencyMode ? 'text-red-100' : 'text-gray-600'
          }`}>
            {patient.age} años • {patient.gender} • {patient.bloodType}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {patient.name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {patient.name}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Edad:</span>
              <span className="ml-2 font-medium">{patient.age} años</span>
            </div>
            <div>
              <span className="text-gray-600">Género:</span>
              <span className="ml-2 font-medium">{patient.gender}</span>
            </div>
            <div>
              <span className="text-gray-600">Tipo de Sangre:</span>
              <span className="ml-2 font-medium">{patient.bloodType}</span>
            </div>
            <div>
              <span className="text-gray-600">Última Visita:</span>
              <span className="ml-2 font-medium">
                {new Date(patient.lastVisit).toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>

          {patient.allergies.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-sm">Alergias:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {patient.nextAppointment && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-800 text-sm font-medium">
                Próxima Cita: {new Date(patient.nextAppointment).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile; 