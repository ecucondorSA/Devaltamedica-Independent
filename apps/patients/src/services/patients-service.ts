/**
 * Servicio de Gestión de Pacientes (consolidado)
 * Adaptador hacia el paquete canónico @altamedica/patient-services
 */

import { apiClient } from '@altamedica/api-client';
import {
  createPatientsService,
  type PatientsResponse as PatientsResponseApi,
  type PatientProfile as PatientProfileApi,
  type CreatePatientRequest as CreatePatientRequestApi,
  type UpdatePatientRequest as UpdatePatientRequestApi,
  type ApiResponse as ApiResponseApi,
} from '@altamedica/patient-services';

// Mantener compatibilidad de tipos exportados previamente
export { Patient } from '@altamedica/types';
export type PatientsResponse = PatientsResponseApi;
export type PatientProfile = PatientProfileApi;
export type CreatePatientRequest = CreatePatientRequestApi;
export type UpdatePatientRequest = UpdatePatientRequestApi;
export type ApiResponse<T = any> = ApiResponseApi<T>;

// Instancia única del servicio basada en el apiClient centralizado
export const patientsService = createPatientsService({
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  patch: apiClient.patch,
  delete: apiClient.delete,
});

export default patientsService;
