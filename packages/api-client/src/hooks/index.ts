/**
 * 🪝 REACT QUERY HOOKS - ALTAMEDICA
 * Hooks personalizados para gestión de datos con caché y optimizaciones
 */

export * from './useAnalytics';
export * from './useAppointments';
export * from './useAuth';
export * from './useCompanies';
export * from './useDoctors';
export * from './useMarketplace';
export * from './useNotifications';
export * from './usePatients';
export * from './usePrescriptions';
export * from './useTelemedicine';

// Re-export common query utilities from centralized hooks
// Evitar dependencia cíclica con @altamedica/hooks
export { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
