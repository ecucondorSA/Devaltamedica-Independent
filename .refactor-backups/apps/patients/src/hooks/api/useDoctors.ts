// 🚀 MIGRATED: Este archivo ahora usa hooks centralizados de @altamedica/api-client
// Mantenido para compatibilidad - Por favor usa directamente @altamedica/api-client/hooks

export { 
  useDoctors,
  useDoctor,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useDoctorAvailability,
  useDoctorAppointments,
  useDoctorSchedule
} from '@altamedica/api-client/hooks';

// Re-export types
export type { Doctor } from '@altamedica/types';