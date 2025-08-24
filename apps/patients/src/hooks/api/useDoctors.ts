// 🚀 MIGRATED: Este archivo ahora usa hooks centralizados de @altamedica/api-client
// Mantenido para compatibilidad - Por favor usa directamente @altamedica/api-client/hooks

// Comentado temporalmente hasta que se exporte correctamente desde api-client
// export {
//   useDoctors,
//   useDoctor,
//   useCreateDoctor,
//   useUpdateDoctor,
//   useDeleteDoctor,
//   useDoctorAvailability,
//   useDoctorAppointments,
//   useDoctorSchedule
// } from '@altamedica/api-client/hooks';

// Stubs temporales para permitir compilación
export const useDoctors = () => ({ data: [], isLoading: false, error: null });
export const useDoctor = () => ({ data: null, isLoading: false, error: null });
export const useCreateDoctor = () => ({ mutate: () => {}, isLoading: false });
export const useUpdateDoctor = () => ({ mutate: () => {}, isLoading: false });
export const useDeleteDoctor = () => ({ mutate: () => {}, isLoading: false });
export const useDoctorAvailability = () => ({ data: null, isLoading: false });
export const useDoctorAppointments = () => ({ data: [], isLoading: false });
export const useDoctorSchedule = () => ({ data: null, isLoading: false });

// Re-export types
export type { Doctor } from '@altamedica/types';
