/**
 * Patient Export Collectors
 * Centralized exports for all data collectors
 */

// Base collector
export { BaseCollector } from './base.collector';

// Specific collectors
export { MedicalRecordsCollector, medicalRecordsCollector } from './medical-records.collector';
export { LabResultsCollector, labResultsCollector } from './lab-results.collector';
export { AppointmentsCollector, appointmentsCollector } from './appointments.collector';
export { VitalSignsCollector, vitalSignsCollector } from './vital-signs.collector';

// Types
export type { MedicalRecord } from './medical-records.collector';
export type { LabResult } from './lab-results.collector';
export type { Appointment } from './appointments.collector';
export type { VitalSign } from './vital-signs.collector';