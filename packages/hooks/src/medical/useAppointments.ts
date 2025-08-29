/**
 * Shim module: re-export appointment-related hooks from centralized API hooks
 * This file exists so imports like '@altamedica/hooks/medical/useAppointments'
 * resolve correctly across the monorepo while avoiding circular builds.
 */

// Re-export the specific appointment hooks implemented in ../useAltamedicaAPI
export {
  useAppointments,
  usePatientAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from '../useAltamedicaAPI';

// Provide a default export to match consumers that import the default
export { useAppointments as default } from '../useAltamedicaAPI';
