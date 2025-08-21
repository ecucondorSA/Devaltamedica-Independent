/**
 * Medical types barrel export
 * @module @altamedica/medical/types
 */

// TODO: Enable when @altamedica/types package is built
/*
// Re-export Patient types from the unified source
export type {
  Patient,
  CreatePatient,
  UpdatePatient,
  PatientFilters,
  EmergencyContact,
  Insurance,
  VitalSigns,
  Allergy,
  ChronicCondition,
  Medication,
  MedicalHistory,
  GenderType,
  BloodTypeType,
  PatientStatusType,
  MaritalStatusType
} from '@altamedica/types';

// Re-export Appointment types from the unified source
export type {
  Appointment,
  CreateAppointment,
  UpdateAppointment,
  AppointmentFilters,
  AppointmentStats,
  RecurringPattern,
  StatusChange,
  NotificationLog,
  Prescription,
  Procedure,
  TestResult,
  LabValue,
  ReferenceRange,
  InsuranceCoverage,
  AppointmentOutcome,
  AppointmentType,
  AppointmentStatus,
  UrgencyLevel,
  NotificationChannel
} from '@altamedica/types';
*/

// Temporary basic types for building
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  conditions?: string[];
  [key: string]: any;
}

export interface CreatePatient extends Omit<Patient, 'id'> {}
export interface UpdatePatient extends Partial<CreatePatient> {}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: string;
  status: string;
  duration?: number;
  [key: string]: any;
}

export interface CreateAppointment extends Omit<Appointment, 'id'> {}
export interface UpdateAppointment extends Partial<CreateAppointment> {}

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: string;
  data: any;
  createdAt: string;
  [key: string]: any;
}

export type AppointmentType = 'consultation' | 'telemedicine' | 'emergency' | 'follow-up' | 'routine-checkup';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

// Export local types
export * from './doctor';
export * from './medical-record';