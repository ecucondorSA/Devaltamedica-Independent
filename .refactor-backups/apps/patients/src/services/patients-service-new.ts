/**
 * 🏥 PATIENTS SERVICE - USING CENTRALIZED PACKAGE
 * Instancia del servicio de pacientes usando el paquete compartido @altamedica/patient-services
 */

import { createPatientsService } from '@altamedica/patient-services';
import { apiClient  } from '@altamedica/api-client';;

// Crear instancia del servicio de pacientes usando el cliente API local
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
