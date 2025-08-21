/**
 * Medical data fetching hook
 * @module @altamedica/medical/hooks/useMedicalData
 */

import { useCallback, useState } from 'react';
import type { Appointment, Doctor, MedicalRecord, Patient } from '../types';

// TODO: Re-enable when shared package is built
// // Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
export interface MedicalDataHook {
  loading: boolean;
  error: string | null;
  fetchPatients: (filters?: PatientFilters) => Promise<Patient[]>;
  fetchDoctors: (filters?: DoctorFilters) => Promise<Doctor[]>;
  fetchAppointments: (filters?: AppointmentFilters) => Promise<Appointment[]>;
  fetchMedicalRecords: (patientId: string) => Promise<MedicalRecord[]>;
}

export interface PatientFilters {
  search?: string;
  status?: 'active' | 'inactive';
  hasConditions?: boolean;
}

export interface DoctorFilters {
  specialization?: string;
  available?: boolean;
  search?: string;
}

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useMedicalData = (apiBaseUrl: string = '/api/v1'): MedicalDataHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleError = (err: any) => {
    const message = err.message || 'An error occurred';
    setError(message);
    // logger.error('Medical data error:', err); // This line was commented out
    return [];
  };
  
  const fetchPatients = useCallback(async (filters?: PatientFilters): Promise<Patient[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.hasConditions !== undefined) {
        queryParams.append('hasConditions', filters.hasConditions.toString());
      }
      
      const response = await fetch(`${apiBaseUrl}/patients?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch patients');
      
      const data = await response.json() as { patients?: Patient[] };
      return data.patients || [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);
  
  const fetchDoctors = useCallback(async (filters?: DoctorFilters): Promise<Doctor[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.specialization) queryParams.append('specialization', filters.specialization);
      if (filters?.available !== undefined) {
        queryParams.append('available', filters.available.toString());
      }
      
      const response = await fetch(`${apiBaseUrl}/doctors?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch doctors');
      
      const data = await response.json() as { doctors?: Doctor[] };
      return data.doctors || [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);
  
  const fetchAppointments = useCallback(async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters?.patientId) queryParams.append('patientId', filters.patientId);
      if (filters?.doctorId) queryParams.append('doctorId', filters.doctorId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString());
      
      const response = await fetch(`${apiBaseUrl}/appointments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json() as { appointments?: Appointment[] };
      return data.appointments || [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);
  
  const fetchMedicalRecords = useCallback(async (patientId: string): Promise<MedicalRecord[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/patients/${patientId}/medical-records`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch medical records');
      
      const data = await response.json() as { records?: MedicalRecord[] };
      return data.records || [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);
  
  return {
    loading,
    error,
    fetchPatients,
    fetchDoctors,
    fetchAppointments,
    fetchMedicalRecords
  };
};