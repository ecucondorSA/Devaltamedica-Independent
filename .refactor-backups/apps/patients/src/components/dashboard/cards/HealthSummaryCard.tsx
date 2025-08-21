import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';

import { Patient } from '@altamedica/types';

interface VitalSigns {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  hasAnomalies: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  pendingRefills: number;
}

interface HealthSummaryCardProps {
  patient: Patient | null;
  vitalSigns: VitalSigns | null;
  medications: Medication[];
}

const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  patient,
  vitalSigns,
  medications
}) => {
  const getHealthStatus = () => {
    if (!vitalSigns) return 'unknown';
    
    if (vitalSigns.hasAnomalies) return 'warning';
    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60) return 'warning';
    if (vitalSigns.bloodPressure.systolic > 140 || vitalSigns.bloodPressure.diastolic > 90) return 'warning';
    
    return 'good';
  };

  const healthStatus = getHealthStatus();
  const activeMedications = medications.filter(med => med.status === 'active');
  const pendingRefills = medications.reduce((total, med) => total + med.pendingRefills, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Resumen de Salud
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          healthStatus === 'good' 
            ? 'bg-green-100 text-green-800'
            : healthStatus === 'warning'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {healthStatus === 'good' ? 'Estable' : healthStatus === 'warning' ? 'Atención' : 'Sin datos'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signos Vitales */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Signos Vitales</h4>
          {vitalSigns ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Frecuencia Cardíaca:</span>
                <span className={`font-medium ${
                  vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {vitalSigns.heartRate} bpm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Presión Arterial:</span>
                <span className={`font-medium ${
                  vitalSigns.bloodPressure.systolic > 140 || vitalSigns.bloodPressure.diastolic > 90 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic} mmHg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temperatura:</span>
                <span className="font-medium text-gray-900">
                  {vitalSigns.temperature}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturación O₂:</span>
                <span className="font-medium text-gray-900">
                  {vitalSigns.oxygenSaturation}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sin datos disponibles</p>
          )}
        </div>

        {/* Medicamentos */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Medicamentos Activos</h4>
          {activeMedications.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Activos:</span>
                <span className="font-medium text-gray-900">
                  {activeMedications.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Refills Pendientes:</span>
                <span className={`font-medium ${
                  pendingRefills > 0 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {pendingRefills}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Últimos medicamentos:</span>
                <div className="mt-1 space-y-1">
                  {activeMedications.slice(0, 3).map((med) => (
                    <div key={med.id} className="text-sm">
                      <span className="font-medium text-gray-900">{med.name}</span>
                      <span className="text-gray-600 ml-2">({med.dosage})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sin medicamentos activos</p>
          )}
        </div>
      </div>

      {/* Alertas */}
      {healthStatus === 'warning' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="text-yellow-800 text-sm font-medium">
              Se detectaron valores fuera del rango normal. Consulte con el médico.
            </span>
          </div>
        </div>
      )}

      {pendingRefills > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">💊</span>
            <span className="text-orange-800 text-sm font-medium">
              {pendingRefills} medicamento{pendingRefills > 1 ? 's' : ''} requiere{pendingRefills > 1 ? 'n' : ''} refill{pendingRefills > 1 ? 's' : ''}.
            </span>
          </div>
        </div>
      )}

      {/* Última actualización */}
      {vitalSigns && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Última actualización: {new Date(vitalSigns.timestamp).toLocaleString('es-MX')}
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthSummaryCard;
