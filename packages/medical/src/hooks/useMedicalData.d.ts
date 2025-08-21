/**
 * Medical data fetching hook
 * @module @altamedica/medical/hooks/useMedicalData
 */
import type { Appointment, Doctor, MedicalRecord, Patient } from '../types';
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
export declare const useMedicalData: (apiBaseUrl?: string) => MedicalDataHook;
//# sourceMappingURL=useMedicalData.d.ts.map