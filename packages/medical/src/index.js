/**
 * @altamedica/medical - Medical domain package
 *
 * This package provides types, utilities, components, and hooks
 * for medical-related functionality in the AltaMedica platform.
 *
 * @packageDocumentation
 */
// Types - Core medical data structures
export * from './types';
// Utilities - Helper functions for medical data
export * from './utils';
export { 
// Date utilities
formatMedicalDate, formatShortDate, calculateAge, isPastAppointment, getTimeUntilAppointment, 
// Health calculations
calculateBMI, calculateIdealWeight, calculateHeartRateZones, classifyBloodPressure, 
// Validation
validatePatientData, validateDoctorData, validateAppointmentData, validateMedicalRecordData, 
// Cache utilities
medicalCache } from './utils';
// Components - React components for medical UI
export * from './components';
export { PatientCard, DoctorCard, AppointmentCard } from './components';
// Hooks - React hooks for medical functionality
export * from './hooks';
export { useMedicalData, useHealthMetrics } from './hooks';
// Configuration - Constants and Firebase config
export * from './config';
export { medicalFirebaseConfig, getFirestorePath, MEDICAL_SPECIALIZATIONS, COMMON_CONDITIONS, APPOINTMENT_DURATIONS, VITAL_RANGES, LAB_TEST_TYPES, PRESCRIPTION_FREQUENCIES, EMERGENCY_LEVELS } from './config';
// Package metadata
export const PACKAGE_NAME = '@altamedica/medical';
export const PACKAGE_VERSION = '2.0.0';
//# sourceMappingURL=index.js.map