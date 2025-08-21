/**
 * Proveedor de React Query para manejo de estado del servidor
 * Configura QueryClient con settings optimizados para aplicación médica
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

// Configuración del QueryClient optimizada para aplicación médica
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configuración por defecto para queries
        staleTime: 5 * 60 * 1000, // 5 minutos - datos médicos cambian moderadamente
        gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache más tiempo
        retry: (failureCount, error: any) => {
          // No reintentar en errores de autenticación
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          // Reintentar hasta 3 veces para otros errores
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // No refrescar automáticamente al cambiar ventana
        refetchOnReconnect: true, // Sí refrescar al reconectar internet
        refetchOnMount: true, // Refrescar al montar componente
      },
      mutations: {
        // Configuración por defecto para mutaciones
        retry: (failureCount, error: any) => {
          // No reintentar mutaciones por defecto (son acciones del usuario)
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          // Solo reintentar una vez para errores de red
          return failureCount < 1;
        },
        retryDelay: 1000,
      },
    },
  });
};

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Proveedor principal de React Query
 * Debe envolver la aplicación completa o las rutas que usen hooks de datos
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Crear QueryClient solo una vez por sesión
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Herramientas de desarrollo solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook para acceder al QueryClient desde componentes
 * Útil para invalidaciones manuales o configuraciones avanzadas
 */
export { useQueryClient } from '@tanstack/react-query';

/**
 * Configuración de keys de queries para toda la aplicación
 * Centraliza las claves para mejor organización y tipado
 */
export const queryKeys = {
  // Claves base para diferentes entidades
  patients: ['patients'] as const,
  appointments: ['appointments'] as const,
  medicalRecords: ['medical-records'] as const,
  prescriptions: ['prescriptions'] as const,
  telemedicine: ['telemedicine'] as const,
  doctors: ['doctors'] as const,
  notifications: ['notifications'] as const,
  
  // Health checks y conectividad
  backend: ['backend'] as const,
  health: () => [...queryKeys.backend, 'health'] as const,
  status: () => [...queryKeys.backend, 'status'] as const,
  
  // Queries agregadas para dashboard
  dashboard: ['dashboard'] as const,
  dashboardPatient: (patientId: string) => [...queryKeys.dashboard, 'patient', patientId] as const,
} as const;

/**
 * Utilidades para manejo de cache
 */
export const cacheUtils = {
  /**
   * Invalidar todas las queries relacionadas con un paciente
   */
  invalidatePatientData: (queryClient: QueryClient, patientId: string) => {
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return (
          key.includes('patients') ||
          key.includes('appointments') ||
          key.includes('medical-records') ||
          key.includes('prescriptions')
        ) && key.includes(patientId);
      }
    });
  },
  
  /**
   * Limpiar cache de datos sensibles al cerrar sesión
   */
  clearSensitiveData: (queryClient: QueryClient) => {
    queryClient.clear();
  },
  
  /**
   * Prefetch datos críticos para mejor UX
   */
  prefetchCriticalData: async (queryClient: QueryClient, patientId: string) => {
    // Implementar prefetch de datos críticos si es necesario
    // queryClient.prefetchQuery({ queryKey: [...], queryFn: ... });
  },
};

export default QueryProvider;