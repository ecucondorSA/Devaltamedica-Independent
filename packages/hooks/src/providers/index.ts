/**
 * @fileoverview Exports para el módulo de providers
 * @module @altamedica/hooks/providers
 * @description Providers y utilidades para gestión de estado y queries
 */

// Exportar QueryProvider y sus variantes
export {
  QueryProvider,
  MedicalQueryProvider,
  StandardQueryProvider,
  StableQueryProvider,
  QUERY_CONFIGS,
  type QueryProviderProps,
} from './QueryProvider';

// Exportar utilidades de query
export {
  QUERY_KEYS,
  MUTATION_KEYS,
  cacheUtils,
  createQueryKey,
} from './query-utils';