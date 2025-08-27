/**
 * @altamedica/services
 * Centralized business logic services
 */

export * from './patient';
export * from './doctor';
export * from './appointment';

// Re-export services for convenience
export { PatientService } from './patient';
export { DoctorService } from './doctor';
export { AppointmentService } from './appointment';