/**
 * @fileoverview Hooks médicos especializados
 * @module @altamedica/hooks/medical
 * @description Hooks para manejo de datos médicos: pacientes, citas, prescripciones, etc.
 */

// ✅ Hooks principales de pacientes - TEMPORALMENTE COMENTADO PARA BUILD
// TODO: Restaurar cuando api-client build esté funcionando
// export {
//     useCreatePatient, useDeletePatient, usePatient, usePatientAppointments, usePatientDocuments, usePatientMedicalHistory,
//     usePatientPrescriptions, usePatients, useUpdatePatient, useUploadPatientDocument
// } from '@altamedica/api-client/hooks';

// // ✅ Re-exportar useAppointments robusto desde api-client
// export {
//     useAppointment, useAppointments, useAvailableSlots, useCancelAppointment, useCompleteAppointment, useConfirmAppointment, useCreateAppointment, useRescheduleAppointment, useUpdateAppointment
// } from '@altamedica/api-client/hooks';
// Diagnostic Engine Hook y tipos
export { useDiagnosticEngine } from './useDiagnosticEngine';
export type { DiagnosticSession, UseDiagnosticEngineOptions } from './useDiagnosticEngine';

// Tipos locales de diagnóstico (evita dependencia circular)
export type {
  Answer,
  DiagnosticEngineFactory,
  Hypothesis,
  IDiagnosticEngine,
  Question,
  Report,
  SessionState,
} from './types/diagnostic.types';

// Adaptadores para inyección de dependencias
export {
  createDiagnosticEngineFactory,
  createMockDiagnosticEngineFactory,
} from './adapters/diagnostic-engine.adapter';
export { useMedicalAI } from './useMedicalAI';
export { useMedicalRecord, useMedicalRecords } from './useMedicalRecords';
export { usePrescription, usePrescriptions } from './usePrescriptions';
export { useVitalSigns, useVitalSignsMonitoring } from './useVitalSigns';

// Hooks de telemedicina
export { useTelemedicine, useVideoCall, useWebRTC } from './useTelemedicine';

// Hooks especializados por rol
export { useDoctorSchedule, useDoctorWorkflow } from './useDoctorWorkflow';
export { usePatientDashboard, usePatientPortal } from './usePatientPortal';
export { usePatientPredictor } from './usePatientPredictor';

// ✅ Hook de datos unificado del paciente - RESTAURADO
export { usePatientData, usePatientVitalsRealTime, useUpdatePatientData } from './usePatientData';
export type { PatientDataResult, UsePatientDataOptions } from './usePatientData';

// Hooks mejorados con conexión API real - TEMPORALMENTE COMENTADO PARA BUILD
// TODO: Restaurar cuando api-client build esté funcionando
// export {
//   useLabResults,
//   useLabResult,
//   useCreateLabResult,
//   useUpdateLabResult,
//   useMarkLabResultAsReviewed,
//   useDownloadLabResultPDF
// } from './useLabResults';
// export type { UseLabResultsOptions, LabResultsResponse } from './useLabResults';

// export {
//   useAppointmentsEnhanced,
//   useCreateAppointmentEnhanced,
//   useCancelAppointmentEnhanced,
//   useRescheduleAppointmentEnhanced,
//   useAvailableSlotsEnhanced
// } from './useAppointmentsEnhanced';
// export type { UseAppointmentsOptions, AppointmentsResponse } from './useAppointmentsEnhanced';

// Tipos principales
export type {
  Appointment,
  MedicalDataState,
  MedicalQueryKey,
  MedicalRecord,
  Patient,
  PatientProfile,
  PatientsFilters,
  PatientsSearchParams,
  Prescription,
  UsePatientsOptions,
  UsePatientsReturn,
  VitalSigns,
} from './types';

// Constantes y utilidades
export { MEDICAL_CACHE_CONFIG } from './config';
export { MEDICAL_QUERY_KEYS, createMedicalQueryKey } from './queryKeys';
