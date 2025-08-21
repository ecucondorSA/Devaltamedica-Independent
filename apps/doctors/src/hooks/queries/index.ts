// Export all query hooks
export * from './usePatients'
export * from './useAppointments'

// Para prescriptions omitimos usePatientPrescriptions si ya proviene de patients.
export {
  usePrescriptions,
  usePrescription,
  useActivePrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
  useCancelPrescription,
  useRefillPrescription,
  // usePatientPrescriptions  // <- ya exportado por usePatients
  prescriptionKeys
} from './usePrescriptions'