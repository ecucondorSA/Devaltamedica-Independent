/**
 * @fileoverview Hooks de API centralizados
 * @module @altamedica/hooks/api
 * @description Hooks para interacciones con APIs, React Query y gestión de datos
 */

// Hooks principales de API que existen
export { useAltamedicaAPI, useAPIRequest, useConnectionTest } from './useAltamedicaAPI';
export { useAPI } from './useAPI';
export { useQuery } from './useQuery';
export { usePagination } from './usePagination';
export { useOptimistic } from './useOptimistic';

// Company hooks migrados
export * from './useCompanies';

// B2C Communication hooks
export * from './useB2CCommunication';

// Re-exportar TanStack Query para estandarización
// Permite que todas las apps usen la misma versión de React Query
export {
  useQuery as useTanstackQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
  useMutationState,
  useIsMutating,
  useIsFetching
} from '@tanstack/react-query';

// Tipos principales
export type {
  APIResponse,
  PaginatedResponse,
  APIError,
  APIClientConfig
} from './useAltamedicaAPI';

export type {
  APIResponse as APIResponseType,
  PaginatedResponse as PaginatedResponseType,
  APIError as APIErrorType,
  QueryStatus,
  UseAPIState
} from './types';

// Constantes y utilidades que existen
export { API_DEFAULTS, HTTP_STATUS, QUERY_KEYS } from './constants';
export { DEFAULT_API_CONFIG, createAPIConfig } from './config';