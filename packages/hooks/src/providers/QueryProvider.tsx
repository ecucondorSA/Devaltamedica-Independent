'use client';

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientConfig,
    QueryClientProvider,
} from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { logger } from '@altamedica/shared';
// TODO: Re-enable when dependency is properly installed
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Unificar logging usando shared logger (Edge-safe)
// 🔧 UNIFIED QUERY PROVIDER - Configuración centralizada para TanStack Query
// Combina las mejores prácticas de todas las implementaciones

export interface QueryProviderProps {
  children: ReactNode;

  // Configuración personalizable
  config?: Partial<QueryClientConfig>;

  // Configuración de caché
  staleTime?: number;
  gcTime?: number;

  // Comportamiento
  enableDevTools?: boolean;
  enableErrorHandling?: boolean;
  enableRateLimitHandling?: boolean;

  // Callbacks
  onRateLimitError?: (retryAfter: number) => void;
  // Global error callbacks
  onError?: (error: unknown, query?: any) => void;
  onMutationError?: (error: unknown) => void;
}

// Configuraciones predefinidas por tipo de aplicación
export const QUERY_CONFIGS = {
  // Configuración para aplicaciones médicas críticas (tiempos más cortos)
  medical: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Solo 1 reintento
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Configuración estándar (balanceada)
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 3, // 3 reintentos
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Configuración para datos estables (tiempos más largos)
  stable: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2, // 2 reintentos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
};

// Función helper para crear retry personalizado
const createRetryFunction = (
  enableRateLimitHandling: boolean,
  onRateLimitError?: (retryAfter: number) => void,
) => {
  return (failureCount: number, error: unknown) => {
    const err: any = error as any;

    // No reintentar en errores de autenticación/autorización
    if (err?.status === 401 || err?.status === 403) {
      return false;
    }

    // Manejo especial para rate limiting
    if (enableRateLimitHandling && err?.status === 429) {
      const retryAfter = err?.retryAfter || 60;
      onRateLimitError?.(retryAfter);
      return false;
    }

    // Reintentar hasta el límite configurado
    return failureCount < 3;
  };
};

// Función helper para calcular delay de reintento (exponencial backoff)
const createRetryDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

export function QueryProvider({
  children,
  config,
  staleTime,
  gcTime,
  enableDevTools = process.env.NODE_ENV === 'development',
  enableErrorHandling = true,
  enableRateLimitHandling = true,
  onError,
  onMutationError,
  onRateLimitError,
}: QueryProviderProps) {
  // Crear QueryClient con configuración unificada
  const [queryClient] = useState(() => {
    // Usar configuración standard como base
    const baseConfig = QUERY_CONFIGS.standard;

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: staleTime ?? baseConfig.staleTime,
          gcTime: gcTime ?? baseConfig.gcTime,
          retry:
            config?.defaultOptions?.queries?.retry ??
            createRetryFunction(enableRateLimitHandling, onRateLimitError),
          retryDelay: createRetryDelay,
          refetchOnMount:
            config?.defaultOptions?.queries?.refetchOnMount ?? baseConfig.refetchOnMount,
          refetchOnWindowFocus:
            config?.defaultOptions?.queries?.refetchOnWindowFocus ??
            baseConfig.refetchOnWindowFocus,
          refetchOnReconnect:
            config?.defaultOptions?.queries?.refetchOnReconnect ?? baseConfig.refetchOnReconnect,
          ...config?.defaultOptions?.queries,
        },
        mutations: {
          retry: config?.defaultOptions?.mutations?.retry ?? 0,
          ...config?.defaultOptions?.mutations,
        },
      },

      // Query Cache con manejo de errores global
      queryCache: new QueryCache({
        onError: enableErrorHandling
          ? (error, query) => {
              logger.error('[QueryCache] Error en query:', {
                queryKey: query.queryKey,
                error,
              });
              onError?.(error);
            }
          : undefined,
      }),

      // Mutation Cache con manejo de errores global
      mutationCache: new MutationCache({
        onError: enableErrorHandling
          ? (error, _variables, _context, mutation) => {
              logger.error('[MutationCache] Error en mutation:', {
                mutationKey: mutation.options.mutationKey,
                error,
              });
              onMutationError?.(error);
            }
          : undefined,
      }),

      ...config,
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
  {/* DevTools disabled in this build to avoid adding optional dependency during packaging */}
    </QueryClientProvider>
  );
}

// 🏥 MedicalQueryProvider - Preset para aplicaciones médicas
export function MedicalQueryProvider({ children, ...props }: Omit<QueryProviderProps, 'config'>) {
  return (
    <QueryProvider
      config={{ defaultOptions: { queries: QUERY_CONFIGS.medical } }}
      enableErrorHandling
      enableRateLimitHandling
      {...props}
    >
      {children}
    </QueryProvider>
  );
}

// 🏢 StandardQueryProvider - Preset para aplicaciones estándar
export function StandardQueryProvider({ children, ...props }: Omit<QueryProviderProps, 'config'>) {
  return (
    <QueryProvider config={{ defaultOptions: { queries: QUERY_CONFIGS.standard } }} {...props}>
      {children}
    </QueryProvider>
  );
}

// 🗄️ StableQueryProvider - Preset para datos estables
export function StableQueryProvider({ children, ...props }: Omit<QueryProviderProps, 'config'>) {
  return (
    <QueryProvider config={{ defaultOptions: { queries: QUERY_CONFIGS.stable } }} {...props}>
      {children}
    </QueryProvider>
  );
}
