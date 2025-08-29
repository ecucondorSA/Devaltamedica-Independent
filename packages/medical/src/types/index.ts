/**
 * Medical types barrel export
 * @module @altamedica/medical/types
 */

// Re-export types from the unified @altamedica/types package
export type {
  Patient,
  PatientProfile,
  Doctor,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  MedicalRecord
} from '@altamedica/types';

// You might need to define Create/Update types if they are not in @altamedica/types
import { Patient, Doctor, Appointment } from '@altamedica/types';
export type CreatePatient = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatient = Partial<CreatePatient>;
export type CreateDoctor = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDoctor = Partial<CreateDoctor>;
export type CreateAppointment = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointment = Partial<CreateAppointment>;
