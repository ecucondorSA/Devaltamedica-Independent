// 🚀 MIGRATED: Este archivo ahora usa hooks centralizados de @altamedica/api-client
// Mantenido para compatibilidad - Por favor usa directamente @altamedica/api-client/hooks

export {
  useDoctors,
  useDoctor,
  useCreateDoctor,
  useUpdateDoctor,
  // Hooks disponibles según api-client
  useDoctorAvailability,
  useDoctorSchedule,
  // NOTA: useDeleteDoctor y useDoctorAppointments no existen en api-client y se han removido.
} from '@altamedica/api-client/hooks';

// Re-export types
export type { Doctor } from '@altamedica/types';