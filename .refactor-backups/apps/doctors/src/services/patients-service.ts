/**
 * 🏥 PATIENTS SERVICE - DOCTORS APP
 * Servicio de pacientes para la aplicación de doctores usando el paquete centralizado
 */

import { createPatientsService } from '@altamedica/patient-services';
import { apiClient  } from '@altamedica/api-client';;

// Crear instancia del servicio de pacientes usando el adaptador de axios
export const patientsService = createPatientsService(apiClient);

// Exportar también para mantener compatibilidad
export default patientsService;

// Re-exportar tipos útiles del paquete compartido
export type {
  Patient,
  PatientProfile,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientsResponse,
  ApiResponse
} from '@altamedica/patient-services';

// Re-exportar utilidades útiles
export {
  formatPatientName,
  calculateAge,
  validateEmail,
  validatePhone,
  formatPhone,
  getPatientInitials,
  getPatientStatusInfo,
  hasCompleteProfile,
  getTimeSinceLastVisit,
  filterPatients,
  groupPatientsByLastName
} from '@altamedica/patient-services';
