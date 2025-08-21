/**
 * @fileoverview Re-export de hooks de API centralizados (MIGRADO)
 * @description Este archivo mantiene compatibilidad durante la migración desde packages/hooks
 * @deprecated Importar directamente desde '@altamedica/hooks/api' en lugar de este archivo
 */

// Re-exportar desde el package centralizado
export {
  useAltamedicaAPI,
  useAPIRequest, 
  useConnectionTest,
  usePatients,
  useAppointments,
  useDashboardStats
} from '@altamedica/hooks';

// Re-exportar tipos
export type {
  APIResponse,
  PaginatedResponse, 
  APIError,
  APIClientConfig
} from '@altamedica/hooks';

// Exportar también como default para compatibilidad
export { useAltamedicaAPI as default } from '@altamedica/hooks';