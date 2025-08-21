/**
 * Medical data validation utilities
 * @module @altamedica/medical/utils/validation
 */
import { Patient, Doctor, Appointment, MedicalRecord } from '../types';
/**
 * Validate patient data
 */
export declare const validatePatientData: (data: Partial<Patient>) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate doctor data
 */
export declare const validateDoctorData: (data: Partial<Doctor>) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate appointment data
 */
export declare const validateAppointmentData: (data: Partial<Appointment>) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate medical record data
 */
export declare const validateMedicalRecordData: (data: Partial<MedicalRecord>) => {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=validation.d.ts.map