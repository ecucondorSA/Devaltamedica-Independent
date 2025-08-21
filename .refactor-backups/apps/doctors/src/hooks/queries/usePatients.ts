/**
 * 👥 MIGRADO A CENTRALIZED: usePatients Queries
 * 
 * Esta implementación local (206 líneas) ha sido reemplazada por la versión
 * centralizada y robusta de @altamedica/hooks que incluye:
 * - Schemas Zod completos optimizados
 * - TanStack Query integrado
 * - 10 hooks especializados médicos
 * - Manejo de errores profesional
 * - Compatibilidad total con la API
 * - HIPAA compliance integrado
 * 
 * @deprecated Usar @altamedica/hooks en su lugar
 */

// Re-export de todos los hooks de patients desde la versión centralizada
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

// Para compatibilidad, mantener los query keys similares
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: string) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (query: string) => [...patientKeys.all, 'search', query] as const,
};