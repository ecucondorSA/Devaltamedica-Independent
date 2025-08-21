/**
 * 🎯 CACHE STRATEGIES - ALTAMEDICA
 * Estrategias de cache optimizadas para datos médicos
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Estrategias de cache predefinidas para diferentes tipos de datos
 */
export const cacheStrategies = {
  /**
   * Datos estáticos (raramente cambian)
   * Ej: Especialidades, tipos de cita, configuraciones
   */
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 días
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /**
   * Datos semi-estáticos (cambian ocasionalmente)
   * Ej: Lista de doctores, información del hospital
   */
  semiStatic: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /**
   * Datos dinámicos (cambian frecuentemente)
   * Ej: Citas, disponibilidad, mensajes
   */
  dynamic: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * Datos en tiempo real (requieren actualización constante)
   * Ej: Estado de telemedicina, notificaciones
   */
  realtime: {
    staleTime: 0, // Siempre stale
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Cada 30 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * Datos críticos (no deben estar desactualizados)
   * Ej: Información médica del paciente, alergias
   */
  critical: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 5, // Más reintentos
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },

  /**
   * Datos sensibles (requieren invalidación inmediata)
   * Ej: Resultados de laboratorio, diagnósticos
   */
  sensitive: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
};

/**
 * Prefetch strategies para mejorar UX
 */
export const prefetchStrategies = {
  /**
   * Prefetch de datos relacionados cuando se visita una página
   */
  async prefetchRelatedData(queryClient: QueryClient, context: {
    page: string;
    userId?: string;
    patientId?: string;
  }) {
    switch (context.page) {
      case 'dashboard':
        // Prefetch datos del dashboard
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['appointments', { patientId: context.patientId, status: 'scheduled' }],
            queryFn: () => {}, // Función real del hook
            ...cacheStrategies.dynamic,
          }),
          queryClient.prefetchQuery({
            queryKey: ['prescriptions', { patientId: context.patientId, active: true }],
            queryFn: () => {},
            ...cacheStrategies.dynamic,
          }),
          queryClient.prefetchQuery({
            queryKey: ['notifications', { unread: true }],
            queryFn: () => {},
            ...cacheStrategies.realtime,
          }),
        ]);
        break;

      case 'appointments':
        // Prefetch doctores y especialidades
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['doctors'],
            queryFn: () => {},
            ...cacheStrategies.semiStatic,
          }),
          queryClient.prefetchQuery({
            queryKey: ['specialties'],
            queryFn: () => {},
            ...cacheStrategies.static,
          }),
        ]);
        break;

      case 'telemedicine':
        // Prefetch configuración de video
        await queryClient.prefetchQuery({
          queryKey: ['telemedicine', 'ice-servers'],
          queryFn: () => {},
          ...cacheStrategies.dynamic,
        });
        break;
    }
  },

  /**
   * Prefetch de siguiente página probable
   */
  async prefetchNextPage(queryClient: QueryClient, currentPath: string) {
    const navigationPatterns: Record<string, string[]> = {
      '/dashboard': ['/appointments', '/medical-records'],
      '/appointments': ['/appointments/new', '/doctors'],
      '/doctors': ['/doctors/[id]', '/appointments/new'],
    };

    const nextPaths = navigationPatterns[currentPath] || [];
    
    // Prefetch datos de las páginas más probables
    for (const path of nextPaths) {
      if (path.includes('appointments')) {
        await queryClient.prefetchQuery({
          queryKey: ['appointments'],
          queryFn: () => {},
          ...cacheStrategies.dynamic,
        });
      }
    }
  },
};

/**
 * Invalidation strategies para mantener datos actualizados
 */
export const invalidationStrategies = {
  /**
   * Invalidar datos relacionados después de una mutación
   */
  invalidateRelated(queryClient: QueryClient, mutation: {
    type: string;
    entityId?: string;
    entityType?: string;
  }) {
    switch (mutation.type) {
      case 'CREATE_APPOINTMENT':
        // Invalidar listas de citas y disponibilidad
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        break;

      case 'CANCEL_APPOINTMENT':
        // Invalidar cita específica y listas
        queryClient.invalidateQueries({ 
          queryKey: ['appointments', mutation.entityId] 
        });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        break;

      case 'UPDATE_PATIENT':
        // Invalidar todos los datos del paciente
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && 
              (key.includes('patients') || key.includes(mutation.entityId));
          },
        });
        break;

      case 'CREATE_PRESCRIPTION':
        // Invalidar prescripciones y cita relacionada
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        break;
    }
  },

  /**
   * Invalidación en cascada para entidades relacionadas
   */
  invalidateCascade(queryClient: QueryClient, entity: {
    type: 'patient' | 'doctor' | 'appointment';
    id: string;
  }) {
    const cascadeMap = {
      patient: [
        ['patients', entity.id],
        ['appointments', { patientId: entity.id }],
        ['prescriptions', { patientId: entity.id }],
        ['medical-records', { patientId: entity.id }],
        ['dashboard', { patientId: entity.id }],
      ],
      doctor: [
        ['doctors', entity.id],
        ['appointments', { doctorId: entity.id }],
        ['availability', { doctorId: entity.id }],
        ['reviews', { doctorId: entity.id }],
      ],
      appointment: [
        ['appointments', entity.id],
        ['prescriptions', { appointmentId: entity.id }],
        ['telemedicine', { appointmentId: entity.id }],
        ['notifications', { appointmentId: entity.id }],
      ],
    };

    const keysToInvalidate = cascadeMap[entity.type] || [];
    
    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  },
};

/**
 * Garbage collection strategies
 */
export const gcStrategies = {
  /**
   * Limpiar datos antiguos periódicamente
   */
  cleanupOldData(queryClient: QueryClient) {
    // Remover queries no usadas en los últimos 30 minutos
    queryClient.removeQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt;
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        return lastUpdated < thirtyMinutesAgo && query.getObserversCount() === 0;
      },
    });
  },

  /**
   * Limpiar datos sensibles al cerrar sesión
   */
  clearSensitiveData(queryClient: QueryClient) {
    const sensitiveKeys = [
      'patients',
      'medical-records',
      'prescriptions',
      'lab-results',
      'diagnoses',
    ];

    sensitiveKeys.forEach(key => {
      queryClient.removeQueries({ queryKey: [key] });
    });

    // También limpiar todo el cache por seguridad
    queryClient.clear();
  },
};

/**
 * Hook para usar estrategias de cache
 */
export function useCacheStrategy(strategy: keyof typeof cacheStrategies) {
  return cacheStrategies[strategy];
}