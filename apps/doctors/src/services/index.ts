/**
 * 🏥 CONFIGURACIÓN DE SERVICIOS DE PACIENTES - DOCTORS APP
 * Re-exporta todas las funcionalidades necesarias
 */

// Re-export del servicio principal
export { usePatients } from './hooks/usePatients';
export { createPatientsService } from './services/patients-service';
export { AxiosApiClientAdapter } from './services/api-client-adapter';

// Re-export de utilidades desde el paquete centralizado
export {
  formatPatientName,
  formatPhone,
  calculateAge,
  validateEmail,
  validatePhone,
  getPatientStatusInfo,
  getTimeSinceLastVisit,
  sortPatientsByLastName,
  filterPatientsByStatus,
  searchPatientsBy
} from '@altamedica/patient-services';

// Re-export de tipos
export type {
  Patient,
  PatientStatus,
  EmergencyContact,
  PatientsService,
  ApiClient,
  ApiResponse
} from '@altamedica/patient-services';

// Configuración por defecto para la app de doctores
export const DOCTORS_APP_CONFIG = {
  defaultPageSize: 20,
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  maxSearchResults: 100,
  allowedStatuses: ['active', 'inactive', 'pending'] as const,
  requiredFields: ['email', 'firstName', 'lastName', 'phone'] as const
};
