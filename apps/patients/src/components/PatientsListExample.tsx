/**
 * 📋 PATIENTS LIST EXAMPLE - USANDO SERVICIO CENTRALIZADO
 * Ejemplo de componente que usa el nuevo paquete @altamedica/patient-services
 */

import React, { useState } from 'react';
import { usePatientsNew } from '../hooks/usePatientsNew';
import { 
  formatPatientName, 
  getPatientStatusInfo, 
  getTimeSinceLastVisit,
  filterPatients 
} from '../services/patients-service-new';
import type { Patient } from '../services/patients-service-new';

export function PatientsListExample() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    patients,
    loading,
    error,
    totalPatients,
    fetchPatients,
    searchPatients,
    clearError
  } = usePatientsNew({
    page: 1,
    limit: 20,
    autoFetch: true
  });

  // Filtrar pacientes localmente para búsqueda rápida
  const filteredPatients = searchTerm 
    ? filterPatients(patients, searchTerm)
    : patients;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await searchPatients(searchTerm);
    } else {
      await fetchPatients();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Pacientes
        </h1>
        <p className="text-gray-600">
          Total: {totalPatients} pacientes
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email..."
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
                fetchPatients();
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

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron pacientes.' : 'No hay pacientes registrados.'}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de paciente usando utilidades
function PatientCard({ patient }: { patient: Patient }) {
  const statusInfo = getPatientStatusInfo(patient.status);
  const timeSinceLastVisit = getTimeSinceLastVisit(patient.lastVisit);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {formatPatientName(patient).split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          
          {/* Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatPatientName(patient)}
            </h3>
            <p className="text-gray-600">{patient.email}</p>
            <p className="text-sm text-gray-500">
              {patient.age} años • {patient.phone || 'Sin teléfono'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {/* Status */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
            {statusInfo.label}
          </span>
          
          {/* Last Visit */}
          <p className="text-sm text-gray-500 mt-2">
            Última visita: {timeSinceLastVisit}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      {(patient.allergies && patient.allergies.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Alergias:</span> {patient.allergies.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
