'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { logger } from '@altamedica/shared/services/logger.service';
// CONFIGURACION OPTIMIZADA DE REACT QUERY PARA ALTAMEDICA

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por defecto
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
        
        // Configuracion de reintento
        retry: (failureCount, error: any) => {
          // No reintentar si es rate limiting
          if (error?.message?.includes('Rate limit')) {
            return false
          }
          // No reintentar errores de autenticacion
          if (error?.message?.includes('401') || error?.message?.includes('403')) {
            return false
          }
          // Reintentar hasta 3 veces para otros errores
          return failureCount < 3
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Configuracion de refetch
        refetchOnWindowFocus: false, // Evitar refetch constante en desarrollo
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Configuracion de mutaciones
        retry: (failureCount, error: any) => {
          // No reintentar rate limiting
          if (error?.message?.includes('Rate limit')) {
            return false
          }
          // No reintentar errores de validacion
          if (error?.message?.includes('400') || error?.message?.includes('422')) {
            return false
          }
          return failureCount < 2
        },
        
        retryDelay: 1000,
      },
    },
  })
}

interface APIProviderProps {
  children: React.ReactNode
}

export function APIProvider({ children }: APIProviderProps) {
  // Crear QueryClient en estado para evitar recreaciones
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// HOOK PARA ACCEDER AL QUERY CLIENT
export { useQueryClient } from '@tanstack/react-query'

// HOOK PARA MANEJAR ERRORES GLOBALES
export function useGlobalErrorHandler() {
  return {
    onError: (error: any) => {
      logger.error('API Error:', error)
      
      // Manejar rate limiting
      if (error?.message?.includes('Rate limit')) {
        // Mostrar notificacion de rate limit
        logger.warn('Rate limit detectado:', error.message)
        return
      }
      
      // Manejar errores de autenticacion
      if (error?.message?.includes('401')) {
        logger.warn('Error de autenticacion - redirigiendo a login')
        // Aqui podrias redirigir al login
        return
      }
      
      // Manejar errores de servidor
      if (error?.message?.includes('500')) {
        logger.error('Error del servidor:', error.message)
        // Mostrar notificacion de error del servidor
        return
      }
      
      // Error generico
      logger.error('Error desconocido:', error.message)
    }
  }
}

// HOOK PARA ESTADO DE CONEXION
export function useConnectionStatus() {
  return useQuery({
    queryKey: ['connectionStatus'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3001/api/v1/health')
        return {
          connected: response.ok,
          status: response.status,
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        return {
          connected: false,
          status: 0,
          timestamp: new Date().toISOString(),
          error: (error as Error).message
        }
      }
    },
    refetchInterval: 30000, // Verificar cada 30 segundos
    retry: false,
    staleTime: 0,
  })
}
