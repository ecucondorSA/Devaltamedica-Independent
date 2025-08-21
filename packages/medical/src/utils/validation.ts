/**
 * Medical data validation utilities
 * @module @altamedica/medical/utils/validation
 */

import { Patient, Doctor, Appointment, MedicalRecord } from '../types';

/**
 * Validate patient data
 */
export const validatePatientData = (data: Partial<Patient>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Patient name must be at least 2 characters');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (data.birthDate && !isValidDate(data.birthDate)) {
    errors.push('Invalid birth date');
  }
  
  if (data.phoneNumber && !isValidPhoneNumber(data.phoneNumber)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate doctor data
 */
export const validateDoctorData = (data: Partial<Doctor>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Doctor name must be at least 2 characters');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.licenseNumber || data.licenseNumber.trim().length < 5) {
    errors.push('Valid license number is required');
  }
  
  if (!data.specialization || data.specialization.trim().length < 3) {
    errors.push('Specialization is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate appointment data
 */
export const validateAppointmentData = (data: Partial<Appointment>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!data.patientId) {
    errors.push('Patient ID is required');
  }
  
  if (!data.doctorId) {
    errors.push('Doctor ID is required');
  }
  
  if (!data.date || !isValidDate(data.date)) {
    errors.push('Valid appointment date is required');
  }
  
  if (data.date && new Date(data.date) < new Date()) {
    errors.push('Appointment date cannot be in the past');
  }
  
  if (!data.type) {
    errors.push('Appointment type is required');
  }
  
  if (!data.duration || data.duration < 15 || data.duration > 240) {
    errors.push('Duration must be between 15 and 240 minutes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate medical record data
 */
export const validateMedicalRecordData = (data: Partial<MedicalRecord>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!data.patientId) {
    errors.push('Patient ID is required');
  }
  
  if (!data.doctorId) {
    errors.push('Doctor ID is required');
  }
  
  if (!data.diagnosis || data.diagnosis.trim().length < 3) {
    errors.push('Diagnosis is required');
  }
  
  if (!data.treatment || data.treatment.trim().length < 3) {
    errors.push('Treatment plan is required');
  }
  
  if (data.vitals) {
    if (data.vitals.heartRate && (data.vitals.heartRate < 40 || data.vitals.heartRate > 200)) {
      errors.push('Heart rate must be between 40 and 200 bpm');
    }
    
    if (data.vitals.temperature && (data.vitals.temperature < 35 || data.vitals.temperature > 42)) {
      errors.push('Temperature must be between 35°C and 42°C');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const isValidDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};