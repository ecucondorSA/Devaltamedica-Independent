/**
 * PatientDashboard Integrado - Usa los nuevos hooks del backend dockerizado
 * Versión optimizada con React Query y servicios integrados
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import { 
  useIntegratedDashboard,
  usePatient,
  useUpcomingAppointments,
  useActivePrescriptions,
  useMedicalSummary,
  useBackendConnectivity 
} from '../../hooks/useIntegratedServices';

// Importar componentes existentes
import HealthSummaryCard from './cards/HealthSummaryCard';
import VitalSignsMonitor from './monitors/VitalSignsMonitor';
import MedicationTracker from './trackers/MedicationTracker';
import UpcomingAppointments from './appointments/UpcomingAppointments';
import LabResultsTrends from './lab/LabResultsTrends';
import EmergencyPanel from './emergency/EmergencyPanel';
import MedicalAlerts from './alerts/MedicalAlerts';
import QuickActions from './actions/QuickActions';

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
  locale = 'es-MX'
}) => {
  // Estados locales
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Hook maestro que obtiene todos los datos necesarios
  const {
    patient,
    patientProfile,
    upcomingAppointments,
    appointmentHistory,
    medicalRecords,
    activePrescriptions,
    medicalSummary,
    sessionHistory,
    isLoading,
    hasError,
    error,
    refetchAll,
    queries
  } = useIntegratedDashboard(patientId);

  // Conectividad del backend
  const { isHealthy, healthError } = useBackendConnectivity();

  // Si hay problemas de conectividad
  if (!isHealthy) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Conexión al Servidor
          </h3>
          <p className="text-gray-600 mb-4">
            No se puede conectar con el servidor médico. Por favor, verifica que el backend esté ejecutándose.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cargando Dashboard</h3>
              <p className="text-gray-600">Obteniendo datos del paciente...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError && !patient) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al Cargar Datos</h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'No se pudieron cargar los datos del paciente'}
          </p>
          <button 
            onClick={refetchAll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Modo emergencia
  if (isEmergencyMode || viewMode === 'emergency') {
    return (
      <div className="min-h-screen bg-red-50">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            <h1 className="text-2xl font-bold">🚨 MODO EMERGENCIA ACTIVADO</h1>
            <p>Paciente: {patient?.name}</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmergencyPanel 
              patientId={patientId}
              patientData={patient}
              emergencyContacts={patientProfile?.medicalInfo?.emergencyContact}
            />
            
            <VitalSignsMonitor 
              patientId={patientId}
              realTime={true}
              alertMode={true}
            />
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsEmergencyMode(false)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Salir del Modo Emergencia
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {patient?.name || 'Paciente'}
              </h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Indicador de conectividad */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isHealthy ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              {/* Botón de actualizar */}
              <button
                onClick={refetchAll}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
              
              {/* Botón de emergencia */}
              <button
                onClick={() => setIsEmergencyMode(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🚨 Emergencia
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de secciones */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'appointments', label: 'Citas', icon: '📅' },
              { id: 'medical', label: 'Historial', icon: '📋' },
              { id: 'medications', label: 'Medicamentos', icon: '💊' },
              { id: 'lab', label: 'Laboratorio', icon: '🧪' },
              { id: 'telemedicine', label: 'Telemedicina', icon: '💻' }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        {/* Alertas médicas importantes */}
        {medicalSummary?.allergies && medicalSummary.allergies.length > 0 && (
          <MedicalAlerts 
            patientId={patientId}
            allergies={medicalSummary.allergies}
            currentMedications={medicalSummary.currentMedications}
          />
        )}

        {/* Contenido según sección activa */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="lg:col-span-2 space-y-6">
              <HealthSummaryCard 
                patientData={patient}
                medicalSummary={medicalSummary}
                isLoading={queries.medicalSummary.isLoading}
              />
              
              <UpcomingAppointments 
                appointments={upcomingAppointments}
                isLoading={queries.upcomingAppointments.isLoading}
                onRefresh={() => queries.upcomingAppointments.refetch()}
              />
              
              {activePrescriptions && activePrescriptions.length > 0 && (
                <MedicationTracker 
                  medications={activePrescriptions}
                  isLoading={queries.activePrescriptions?.isLoading}
                />
              )}
            </div>
            
            {/* Columna derecha */}
            <div className="space-y-6">
              <QuickActions 
                patientId={patientId}
                hasUpcomingAppointments={upcomingAppointments && upcomingAppointments.length > 0}
                hasActivePrescriptions={activePrescriptions && activePrescriptions.length > 0}
              />
              
              <VitalSignsMonitor 
                patientId={patientId}
                latestVitals={medicalSummary?.vitalSigns}
              />
            </div>
          </div>
        )}

        {activeSection === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Próximas Citas</h2>
              <UpcomingAppointments 
                appointments={upcomingAppointments}
                isLoading={queries.upcomingAppointments.isLoading}
                onRefresh={() => queries.upcomingAppointments.refetch()}
                detailed={true}
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Historial de Citas</h2>
              <div className="bg-white rounded-lg shadow p-6">
                {appointmentHistory && appointmentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {appointmentHistory.map((appointment) => (
                      <div key={appointment.id} className="border-l-4 border-gray-200 pl-4">
                        <div className="font-medium">{appointment.date}</div>
                        <div className="text-gray-600">Dr. {appointment.doctorName}</div>
                        <div className="text-sm text-gray-500">{appointment.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay historial de citas disponible</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'medical' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Historial Médico</h2>
            <div className="bg-white rounded-lg shadow p-6">
              {medicalRecords && medicalRecords.length > 0 ? (
                <div className="space-y-6">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{record.title}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{record.description}</p>
                      {record.diagnosis && (
                        <div className="text-sm">
                          <span className="font-medium">Diagnóstico:</span> {record.diagnosis}
                        </div>
                      )}
                      {record.doctorName && (
                        <div className="text-sm text-gray-500">
                          Por: Dr. {record.doctorName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay registros médicos disponibles</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'medications' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Medicamentos Activos</h2>
            {activePrescriptions && activePrescriptions.length > 0 ? (
              <MedicationTracker 
                medications={activePrescriptions}
                isLoading={queries.activePrescriptions?.isLoading}
                detailed={true}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No hay medicamentos activos</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'telemedicine' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Historial de Telemedicina</h2>
            <div className="bg-white rounded-lg shadow p-6">
              {sessionHistory && sessionHistory.length > 0 ? (
                <div className="space-y-4">
                  {sessionHistory.map((session) => (
                    <div key={session.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="font-medium">
                        Sesión {session.status === 'completed' ? 'completada' : session.status}
                      </div>
                      <div className="text-gray-600">
                        {session.startedAt && new Date(session.startedAt).toLocaleString('es-MX')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Duración: {session.duration || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay historial de sesiones de telemedicina</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardIntegrated;