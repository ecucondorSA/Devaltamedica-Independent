/**
 * @altamedica/medical - Medical domain package
 *
 * This package provides types, utilities, components, and hooks
 * for medical-related functionality in the AltaMedica platform.
 *
 * @packageDocumentation
 */
export * from './types';
export type { Patient, CreatePatient, UpdatePatient, Doctor, Appointment, AppointmentType, AppointmentStatus, CreateAppointment, UpdateAppointment, MedicalRecord } from './types';
export * from './utils';
export { formatMedicalDate, formatShortDate, calculateAge, isPastAppointment, getTimeUntilAppointment, calculateBMI, calculateIdealWeight, calculateHeartRateZones, classifyBloodPressure, validatePatientData, validateDoctorData, validateAppointmentData, validateMedicalRecordData, medicalCache } from './utils';
export * from './components';
export { PatientCard, type PatientCardProps, DoctorCard, type DoctorCardProps, AppointmentCard, type AppointmentCardProps } from './components';
export * from './hooks';
export { useMedicalData, type MedicalDataHook, type PatientFilters, type DoctorFilters, type AppointmentFilters, useHealthMetrics, type HealthMetrics, type HealthMetricsAnalysis } from './hooks';
export * from './config';
export { medicalFirebaseConfig, getFirestorePath, MEDICAL_SPECIALIZATIONS, COMMON_CONDITIONS, APPOINTMENT_DURATIONS, VITAL_RANGES, LAB_TEST_TYPES, PRESCRIPTION_FREQUENCIES, EMERGENCY_LEVELS } from './config';
export declare const PACKAGE_NAME = "@altamedica/medical";
export declare const PACKAGE_VERSION = "2.0.0";
//# sourceMappingURL=index.d.ts.map