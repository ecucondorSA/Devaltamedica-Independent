'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect, useCallback } from 'react';
import { usePatientData } from '@altamedica/hooks/medical';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import HealthSummaryCard from './cards/HealthSummaryCard';
import VitalSignsMonitor from './monitors/VitalSignsMonitor';
import MedicationTracker from './trackers/MedicationTracker';
import UpcomingAppointments from './appointments/UpcomingAppointments';
import LabResultsTrends from './lab/LabResultsTrends';
import EmergencyPanel from './emergency/EmergencyPanel';
import MedicalAlerts from './alerts/MedicalAlerts';
import QuickActions from './actions/QuickActions';
import PatientProfile from './profile/PatientProfile';
import ClinicalTimeline from './timeline/ClinicalTimeline';
import DocumentsManager from './documents/DocumentsManager';
import TeamCommunication from './communication/TeamCommunication';
import DiagnosisAssistantCard from './cards/DiagnosisAssistantCard';

import { logger } from '@altamedica/shared/services/logger.service';
interface PatientDashboardProps {
  patientId: string;
  viewMode?: 'complete' | 'summary' | 'emergency';
  locale?: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientId,
  viewMode = 'complete',
  locale = 'es-MX'
}) => {
  // Estados principales
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Hook personalizado para datos del paciente
  const {
    patientData,
    vitalSigns,
    medications,
    appointments,
    labResults,
    medicalHistory,
    emergencyContacts,
    isLoading,
    error,
    refreshData
  } = usePatientData(patientId);

  // Actualizaciones en tiempo real
  const { subscribe, unsubscribe } = useRealTimeUpdates(patientId);

  // Nueva navegación agrupada y jerárquica
  const navigationSections = [
    { id: 'dashboard', label: 'Inicio', icon: '🏠', priority: 1 },
    { id: 'expediente', label: 'Expediente', icon: '📋', priority: 2 },
    { id: 'medicacion', label: 'Medicación', icon: '💊', priority: 3 },
    { id: 'laboratorio', label: 'Laboratorio', icon: '🔬', priority: 4 },
    { id: 'citas', label: 'Citas', icon: '📅', priority: 5 },
    { id: 'telemedicina', label: 'Telemedicina', icon: '�', priority: 6 },
    { id: 'sos', label: 'SOS 24/7', icon: '�', priority: 7, urgent: true }
  ];

  // Menú secundario (perfil, preferencias, seguridad)
  const secondaryMenu = [
    { id: 'perfil', label: 'Mi Perfil', icon: '�' },
    { id: 'preferencias', label: 'Preferencias', icon: '⚙️' },
    { id: 'seguridad', label: 'Seguridad', icon: '🔒' }
  ];

  // Efectos
  useEffect(() => {
    // Suscribirse a actualizaciones en tiempo real
    const subscriptionId = subscribe({
      onVitalSignsUpdate: (data) => {
        logger.info('Actualización de signos vitales:', data);
      },
      onAlertReceived: (alert) => {
        if (alert.severity === 'critical') {
          setIsEmergencyMode(true);
        }
      }
    });
  }, [subscribe]);

  // Layout reorganizado para reducir fatiga visual y priorizar datos personales
  return (
    <div className="dashboard-container px-4 py-6 max-w-6xl mx-auto">
      {/* Barra superior con icono de notificaciones discreto */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold text-primary-800">Bienvenido, {patientData?.firstName || 'Paciente'}</span>
          <button className="ml-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition" title="Ver notificaciones">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z" fill="currentColor"/></svg>
            <span className="sr-only">Notificaciones</span>
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition" title="Mi Perfil">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" fill="currentColor"/></svg>
          Mi Perfil
        </button>
      </div>

      {/* Datos personales y protección de datos */}
      <div className="mb-8 p-6 rounded-xl bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-lg text-neutral-700 mb-1">Datos de salud</div>
          <div className="text-sm text-neutral-500">Tu información médica está protegida</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Cumplimos con estándares HIPAA y protección de datos médicos</span>
          <span className="inline-block text-neutral-400"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 17a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v2a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-8-2a4 4 0 1 1 8 0v2H6V9z" fill="currentColor"/></svg></span>
        </div>
      </div>

      {/* Fila principal: acciones personales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickActions patientId={patientId} />
        <ClinicalTimeline medicalHistory={medicalHistory} />
        <MedicationTracker medications={medications} />
      </div>

      {/* Próxima cita y resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <UpcomingAppointments appointments={appointments} />
        <LabResultsTrends labResults={labResults} />
      </div>

      {/* Telemedicina y asistente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TeamCommunication patientId={patientId} />
        <DiagnosisAssistantCard
          age={patientData?.age || 35}
          gender={patientData?.gender || 'Masculino'}
          onStart={() => setActiveSection('diagnosis')}
        />
      </div>

      {/* Emergencia y alertas */}
      <EmergencyPanel emergencyContacts={emergencyContacts} />
      <MedicalAlerts alerts={patientData?.alerts} />
    </div>
  );

    return () => unsubscribe(subscriptionId);
  }, [subscribe, unsubscribe]);

  // Callbacks optimizados
  const handleEmergencyActivation = useCallback(() => {
    setIsEmergencyMode(true);
    setActiveSection('emergency');
    // Notificar al equipo médico
    notifyEmergencyTeam();
  }, []);

  const notifyEmergencyTeam = async () => {
    try {
      await fetch('/api/emergency/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          timestamp: new Date().toISOString(),
          type: 'dashboard_emergency_activation'
        })
      });
    } catch (error) {
      logger.error('Error notificando emergencia:', error);
    }
  };

  // Renderizado condicional por estado
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error al cargar el dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={refreshData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isEmergencyMode ? 'bg-red-50' : 'bg-gray-50'
    }`}>
      {/* Header del Dashboard */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isEmergencyMode 
          ? 'bg-red-600 shadow-2xl' 
          : 'bg-white shadow-sm border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Información del Paciente */}
            <div className="flex items-center space-x-4">
              <PatientProfile 
                patient={patientData} 
                compact={true}
                emergencyMode={isEmergencyMode}
              />
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center space-x-3">
              {!isEmergencyMode && (
                <>
                  <QuickActions 
                    patientId={patientId}
                    onEmergency={handleEmergencyActivation}
                  />
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Ayuda"
                  >
                    <span className="text-xl">❓</span>
                  </button>
                </>
              )}
              
              {isEmergencyMode && (
                <button
                  onClick={() => setIsEmergencyMode(false)}
                  className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Salir de Emergencia
                </button>
              )}
            </div>
          </div>

          {/* Navegación de Secciones */}
          {!isEmergencyMode && (
            <nav className="flex space-x-1 overflow-x-auto pb-2 -mb-px">
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    relative flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-all
                    ${activeSection === section.id
                      ? 'bg-gray-100 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                    ${section.urgent ? 'text-red-600 hover:text-red-700' : ''}
                  `}
                >
                  <span className="mr-2 text-lg">{section.icon}</span>
                  <span>{section.label}</span>
                  {section.badge && (
                    <span className={`
                      ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${section.badge === 'alert' 
                        ? 'bg-red-100 text-red-800 animate-pulse' 
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {typeof section.badge === 'number' ? section.badge : '!'}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modo Emergencia */}
        {isEmergencyMode && (
          <EmergencyPanel
            patient={patientData}
            vitalSigns={vitalSigns}
            emergencyContacts={emergencyContacts}
            onDeactivate={() => setIsEmergencyMode(false)}
          />
        )}

        {/* Secciones del Dashboard */}
        {!isEmergencyMode && (
          <>
            {/* Resumen General */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Alertas Médicas */}
                <MedicalAlerts 
                  patientId={patientId}
                  onEmergencyTrigger={handleEmergencyActivation}
                />

                {/* Grid de Tarjetas Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <HealthSummaryCard 
                      patient={patientData}
                      vitalSigns={vitalSigns}
                      medications={medications}
                    />
                  </div>
                  <div>
                    <VitalSignsMonitor 
                      vitalSigns={vitalSigns}
                      compact={true}
                      realTime={true}
                    />
                  </div>
                </div>

                {/* Sección Secundaria */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MedicationTracker 
                    medications={medications}
                    compact={true}
                  />
                  <UpcomingAppointments 
                    appointments={appointments}
                    compact={true}
                  />
                  <LabResultsTrends 
                    results={labResults}
                    compact={true}
                  />
                </div>

                {/* Timeline Clínico */}
                <ClinicalTimeline 
                  patientId={patientId}
                  limit={5}
                />
              </div>
            )}

            {/* Signos Vitales */}
            {activeSection === 'vitals' && (
              <VitalSignsMonitor 
                vitalSigns={vitalSigns}
                compact={false}
                realTime={true}
                showHistory={true}
                showTrends={true}
              />
            )}

            {/* Medicamentos */}
            {activeSection === 'medications' && (
              <MedicationTracker 
                medications={medications}
                compact={false}
                showSchedule={true}
                showInteractions={true}
              />
            )}

            {/* Citas Médicas */}
            {activeSection === 'appointments' && (
              <UpcomingAppointments 
                appointments={appointments}
                compact={false}
                showCalendar={true}
                allowScheduling={true}
              />
            )}

            {/* Resultados de Laboratorio */}
            {activeSection === 'lab' && (
              <LabResultsTrends 
                results={labResults}
                compact={false}
                showComparisons={true}
                showReports={true}
              />
            )}

            {/* Historial Clínico */}
            {activeSection === 'history' && (
              <ClinicalTimeline 
                patientId={patientId}
                showFilters={true}
                groupByType={true}
              />
            )}

            {/* Documentos */}
            {activeSection === 'documents' && (
              <DocumentsManager 
                patientId={patientId}
                allowUpload={true}
                showCategories={true}
              />
            )}

            {/* Panel de Emergencia */}
            {activeSection === 'emergency' && (
              <EmergencyPanel
                patient={patientData}
                vitalSigns={vitalSigns}
                emergencyContacts={emergencyContacts}
                previewMode={true}
              />
            )}
          </>
        )}

        {/* Comunicación con el Equipo */}
        {!isEmergencyMode && viewMode === 'complete' && (
          <div className="fixed bottom-4 right-4 z-40">
            <TeamCommunication 
              patientId={patientId}
              minimized={true}
            />
          </div>
        )}
      </main>

      {/* Tutorial Interactivo */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Guía del Dashboard de Pacientes
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>Bienvenido al Dashboard Profesional de Pacientes de Altamedica.</p>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Secciones Principales:</h3>
                <ul className="space-y-1 ml-4">
                  {navigationSections.map(section => (
                    <li key={section.id} className="flex items-center">
                      <span className="mr-2">{section.icon}</span>
                      <span>{section.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard; 