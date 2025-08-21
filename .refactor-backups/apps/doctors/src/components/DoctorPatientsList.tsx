/**
 * 👥 DOCTOR PATIENTS LIST - USANDO SERVICIO CENTRALIZADO
 * Componente para que los doctores vean y gestionen sus pacientes
 */

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import { usePatients } from '../hooks/usePatients';
import { usePatientData } from '@altamedica/hooks';
import { 
  formatPatientName, 
  getPatientStatusInfo, 
  getTimeSinceLastVisit,
  formatPhone,
  calculateAge
} from '../services/patients-service';
import type { Patient } from '../services/patients-service';

import { logger } from '@altamedica/shared/services/logger.service';
interface DoctorPatientsListProps {
  doctorId: string;
}

export function DoctorPatientsList({ doctorId }: DoctorPatientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const {
    patients,
    loading,
    error,
    totalPatients,
    fetchMyPatients,
    searchPatients,
    updatePatient,
    clearError
  } = usePatients({
    doctorId,
    autoFetch: true
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await searchPatients(searchTerm);
    } else {
      await fetchMyPatients(doctorId);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleUpdatePatient = async (patientId: string, updates: any) => {
    const success = await updatePatient(patientId, updates);
    if (success) {
      // Mostrar notificación de éxito
      logger.info('Paciente actualizado exitosamente');
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando mis pacientes...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Mis Pacientes
        </h1>
        <p className="text-gray-600">
          Total: {totalPatients} pacientes asignados
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente por nombre o email..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchMyPatients(doctorId);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista de Pacientes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Lista de Pacientes</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron pacientes.' : 'No tienes pacientes asignados.'}
              </div>
            ) : (
              patients.map((patient) => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  isSelected={selectedPatient?.id === patient.id}
                  onClick={() => handlePatientSelect(patient)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detalles del Paciente Seleccionado */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Detalles del Paciente</h2>
          {selectedPatient ? (
            <PatientDetails 
              patient={selectedPatient} 
              onUpdate={(updates) => handleUpdatePatient(selectedPatient.id, updates)}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              Selecciona un paciente para ver sus detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de paciente
function PatientCard({ 
  patient, 
  isSelected, 
  onClick 
}: { 
  patient: Patient; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusInfo = getPatientStatusInfo(patient.status);
  const timeSinceLastVisit = getTimeSinceLastVisit(patient.lastVisit);

  return (
    <div 
      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {formatPatientName(patient)}
          </h3>
          <p className="text-sm text-gray-600">{patient.email}</p>
          <p className="text-xs text-gray-500">
            {patient.age} años • {formatPhone(patient.phone || '')}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
            {statusInfo.label}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {timeSinceLastVisit}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente de detalles del paciente
function PatientDetails({ 
  patient, 
  onUpdate 
}: { 
  patient: Patient;
  onUpdate: (updates: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{formatPatientName(patient)}</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Email:</label>
          <p className="text-gray-900">{patient.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Teléfono:</label>
          <p className="text-gray-900">{formatPhone(patient.phone || 'No registrado')}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Edad:</label>
          <p className="text-gray-900">{patient.age} años</p>
        </div>
        
        {patient.bloodType && (
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo de Sangre:</label>
            <p className="text-gray-900">{patient.bloodType}</p>
          </div>
        )}
        
        {patient.allergies && patient.allergies.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700">Alergias:</label>
            <p className="text-gray-900">{patient.allergies.join(', ')}</p>
          </div>
        )}
        
        {patient.emergencyContact && (
          <div>
            <label className="text-sm font-medium text-gray-700">Contacto de Emergencia:</label>
            <p className="text-gray-900">
              {patient.emergencyContact.name} - {formatPhone(patient.emergencyContact.phone)}
              <span className="text-sm text-gray-500 ml-2">({patient.emergencyContact.relationship})</span>
            </p>
          </div>
        )}

        {isEditing && (
          <div className="mt-4 pt-4 border-t">
            <label className="text-sm font-medium text-gray-700">Notas del Doctor:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Agregar notas sobre el paciente..."
            />
            <button
              onClick={() => {
                onUpdate({ doctorNotes: notes });
                setIsEditing(false);
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Guardar Notas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
