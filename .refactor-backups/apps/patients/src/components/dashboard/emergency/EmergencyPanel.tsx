'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect, useCallback } from 'react';
import { Patient, VitalSigns, EmergencyContact } from '../../../types/medical-types';

import { logger } from '@altamedica/shared/services/logger.service';
interface EmergencyPanelProps {
  patient: Patient;
  vitalSigns: VitalSigns;
  emergencyContacts: EmergencyContact[];
  previewMode?: boolean;
  onDeactivate?: () => void;
}

const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
  patient,
  vitalSigns,
  emergencyContacts,
  previewMode = false,
  onDeactivate
}) => {
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notificationsSent, setNotificationsSent] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(!previewMode);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencyActions, setEmergencyActions] = useState<any[]>([]);

  // Información crítica del paciente
  const criticalInfo = {
    bloodType: patient.bloodType,
    allergies: patient.allergies.filter(a => a.severity === 'life-threatening'),
    conditions: patient.conditions.filter(c => c.severity === 'severe'),
    medications: patient.conditions.map(c => c.medications).flat()
  };

  // Protocolos de emergencia
  const emergencyProtocols = [
    {
      id: 'vital-signs',
      name: 'Signos Vitales Críticos',
      status: vitalSigns.hasAnomalies ? 'alert' : 'normal',
      actions: ['Monitoreo continuo', 'Notificar equipo médico', 'Preparar equipo de reanimación']
    },
    {
      id: 'medication',
      name: 'Medicación de Emergencia',
      status: 'ready',
      actions: ['Verificar alergias', 'Preparar medicamentos de emergencia', 'Registrar administración']
    },
    {
      id: 'team',
      name: 'Equipo de Respuesta',
      status: 'activated',
      actions: ['Llamar código azul', 'Notificar médico de guardia', 'Preparar sala de emergencias']
    }
  ];

  // Actualizar tiempo transcurrido
  useEffect(() => {
    if (!previewMode && isRecording) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - emergencyStartTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [previewMode, isRecording, emergencyStartTime]);

  // Función para notificar contactos
  const notifyContact = useCallback(async (contact: EmergencyContact) => {
    try {
      const response = await fetch('/api/emergency/notify-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          contactId: contact.id,
          type: 'emergency',
          message: `Emergencia médica: ${patient.fullName}`
        })
      });

      if (response.ok) {
        setNotificationsSent(prev => [...prev, contact.id]);
        logEmergencyAction(`Contacto notificado: ${contact.name} (${contact.relationship})`);
      }
    } catch (error) {
      logger.error('Error notificando contacto:', error);
    }
  }, [patient]);

  // Función para registrar acciones
  const logEmergencyAction = useCallback((action: string) => {
    const newAction = {
      timestamp: new Date(),
      action,
      performedBy: 'Sistema'
    };
    setEmergencyActions(prev => [...prev, newAction]);
  }, []);

  // Función para llamar emergencias
  const callEmergencyServices = useCallback(async () => {
    logEmergencyAction('Servicios de emergencia llamados - 911');
    // Aquí iría la integración real con servicios de emergencia
  }, [logEmergencyAction]);

  // Formatear tiempo
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-4 ${
      previewMode ? 'border-gray-300' : 'border-red-500 animate-pulse'
    }`}>
      {/* Header de Emergencia */}
      <div className={`p-6 ${
        previewMode ? 'bg-gray-100' : 'bg-red-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`text-4xl ${previewMode ? '' : 'animate-bounce'}`}>
              🚨
            </span>
            <div>
              <h1 className={`text-2xl font-bold ${
                previewMode ? 'text-gray-900' : 'text-white'
              }`}>
                {previewMode ? 'Panel de Emergencia (Vista Previa)' : 'EMERGENCIA MÉDICA ACTIVA'}
              </h1>
              {!previewMode && (
                <p className="text-red-100 text-sm mt-1">
                  Tiempo transcurrido: {formatElapsedTime(elapsedTime)}
                </p>
              )}
            </div>
          </div>
          
          {onDeactivate && (
            <button
              onClick={onDeactivate}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                previewMode 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-white text-red-600 hover:bg-red-50'
              }`}
            >
              {previewMode ? 'Cerrar Vista Previa' : 'Finalizar Emergencia'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Información Crítica del Paciente */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-red-900 mb-3">
            Información Crítica del Paciente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-bold text-gray-900">{patient.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Edad</p>
              <p className="font-bold text-gray-900">{patient.age} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Sangre</p>
              <p className="font-bold text-red-600 text-xl">{patient.bloodType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ID Nacional</p>
              <p className="font-bold text-gray-900">{patient.nationalId}</p>
            </div>
          </div>

          {/* Alergias Críticas */}
          {criticalInfo.allergies.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-2">
                ⚠️ ALERGIAS SEVERAS
              </h3>
              <div className="flex flex-wrap gap-2">
                {criticalInfo.allergies.map((allergy, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium"
                  >
                    {allergy.allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signos Vitales Actuales */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Signos Vitales Actuales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalSignCard 
              label="Frecuencia Cardíaca"
              value={`${vitalSigns.heartRate.value} lpm`}
              status={vitalSigns.heartRate.status}
              icon="❤️"
            />
            <VitalSignCard 
              label="Presión Arterial"
              value={`${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic}`}
              status={vitalSigns.bloodPressure.status}
              icon="🩺"
            />
            <VitalSignCard 
              label="Saturación O₂"
              value={`${vitalSigns.oxygenSaturation?.value || '--'}%`}
              status={vitalSigns.oxygenSaturation?.status || 'normal'}
              icon="💨"
            />
            <VitalSignCard 
              label="Temperatura"
              value={`${vitalSigns.temperature.value}°C`}
              status={vitalSigns.temperature.status}
              icon="🌡️"
            />
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={callEmergencyServices}
            disabled={previewMode}
            className={`p-4 rounded-lg text-white font-bold transition-all ${
              previewMode 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-2xl block mb-2">📞</span>
            Llamar 911
          </button>

          <button
            onClick={() => emergencyContacts.forEach(contact => {
              if (contact.isPrimary) notifyContact(contact);
            })}
            disabled={previewMode}
            className={`p-4 rounded-lg text-white font-bold transition-all ${
              previewMode 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-2xl block mb-2">👥</span>
            Notificar Contactos
          </button>

          <button
            disabled={previewMode}
            className={`p-4 rounded-lg text-white font-bold transition-all ${
              previewMode 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-2xl block mb-2">🏥</span>
            Preparar Traslado
          </button>
        </div>

        {/* Contactos de Emergencia */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Contactos de Emergencia
          </h2>
          <div className="space-y-2">
            {emergencyContacts.map((contact) => (
              <div 
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {contact.name}
                    {contact.isPrimary && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Principal
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {contact.relationship} - {contact.phone}
                  </p>
                </div>
                <button
                  onClick={() => notifyContact(contact)}
                  disabled={previewMode || notificationsSent.includes(contact.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    notificationsSent.includes(contact.id)
                      ? 'bg-green-100 text-green-800'
                      : previewMode
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {notificationsSent.includes(contact.id) ? '✓ Notificado' : 'Notificar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Protocolos de Emergencia */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Protocolos de Emergencia
          </h2>
          <div className="space-y-3">
            {emergencyProtocols.map((protocol) => (
              <div key={protocol.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{protocol.name}</h3>
                  <ProtocolStatus status={protocol.status} />
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {protocol.actions.map((action, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Notas de Emergencia */}
        {!previewMode && (
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Notas de Emergencia
            </h2>
            <textarea
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              placeholder="Registrar observaciones y acciones tomadas..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
        )}

        {/* Registro de Acciones */}
        {!previewMode && emergencyActions.length > 0 && (
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Registro de Acciones
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emergencyActions.map((action, index) => (
                <div key={index} className="flex items-start text-sm">
                  <span className="text-gray-500 mr-3">
                    {action.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-gray-700">{action.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente auxiliar para tarjeta de signo vital
const VitalSignCard: React.FC<{
  label: string;
  value: string;
  status: string;
  icon: string;
}> = ({ label, value, status, icon }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-900';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default: return 'bg-green-100 border-green-300 text-green-900';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{icon}</span>
        {status === 'critical' && (
          <span className="text-red-600 animate-pulse">⚠️</span>
        )}
      </div>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

// Componente auxiliar para estado de protocolo
const ProtocolStatus: React.FC<{ status: string }> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'alert': return 'bg-red-100 text-red-800';
      case 'activated': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'alert': return 'Alerta';
      case 'activated': return 'Activado';
      case 'ready': return 'Listo';
      default: return 'Normal';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {getStatusText()}
    </span>
  );
};

export default EmergencyPanel; 