// 👥 Re-export del hook centralizado usePatients
// MIGRADO: Usando implementación robusta desde @altamedica/hooks
export {
  usePatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientPrescriptions,
  usePatientDocuments,
  useUploadPatientDocument
} from '@altamedica/hooks';