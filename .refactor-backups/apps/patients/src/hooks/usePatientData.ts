import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/ApiService';
import { 
  Patient, 
  VitalSigns, 
  HealthMetrics, 
  Medication,
  Appointment,
  LabResult
} from '@altamedica/types';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface PatientData {
  patient: Patient;
  vitalSigns: VitalSigns | null; // Permite nulo mientras se conecta
  medications: Medication[];
  appointments: Appointment[];
  labResults: LabResult[];
  medicalHistory: any[];
  emergencyContacts: EmergencyContact[];
}

export const usePatientData = (patientId: string) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatientData = useCallback(async () => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // Conexión al API real para obtener los detalles del paciente
      const patientDetails = await apiService.get<Patient>(`/patients/${patientId}`);
      
      // Estructura de datos para el dashboard, con valores por defecto mientras
      // se conectan los demás endpoints o hooks especializados.
      setPatientData({
        patient: patientDetails,
        vitalSigns: null, // TODO: Conectar a endpoint de signos vitales
        medications: [],   // TODO: Conectar a endpoint de medicamentos
        appointments: [],  // TODO: Usar 'useAppointments' hook que se conectará al API
        labResults: [],    // TODO: Conectar a endpoint de resultados de laboratorio
        medicalHistory: [],// TODO: Conectar a endpoint de historial médico
        emergencyContacts: patientDetails.emergencyContacts || [],
      });

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar los datos del paciente.'));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // La función de refresco ahora vuelve a llamar al API
  const refreshData = useCallback(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  return {
    patientData: patientData?.patient || null,
    vitalSigns: patientData?.vitalSigns || null,
    medications: patientData?.medications || [],
    appointments: patientData?.appointments || [],
    labResults: patientData?.labResults || [],
    medicalHistory: patientData?.medicalHistory || [],
    emergencyContacts: patientData?.emergencyContacts || [],
    isLoading,
    error,
    refreshData
  };
};
 