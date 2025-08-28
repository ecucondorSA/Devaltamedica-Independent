import { QueryProvider, apiClient } from '@altamedica/api-client';
import { services } from '@altamedica/api-client';

/**
 * useDashboardData.tsx - Hook Especializado para Dashboard con APIs Reales
 * Proyecto: Altamedica Pacientes
 * Diseño: Gestión robusta de estado híbrido (API real + fallback)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services';
import { logger } from '@altamedica/shared';
import type {
  PatientDashboardDTO,
  UserProfileDTO,
  DashboardHookState,
  DashboardHookActions,
  DashboardLoadingState,
  DashboardErrorState,
  DashboardApiResponse,
  DashboardApiError,
  UserPreferences
} from '../types/dashboard-types';

// 🎯 Estado inicial optimizado
const initialLoadingState: DashboardLoadingState = {
  overall: true,
  appointments: false,
  medicalRecords: false,
  prescriptions: false,
  healthMetrics: false,
  notifications: false,
  userProfile: false
};

const initialErrorState: DashboardErrorState = {};

/**
 * useDashboardData - Hook para gestión completa de datos de dashboard
 * Características: Estado híbrido, refresh granular, manejo robusto de errores
 */
export const useDashboardData = () => {
  // 📊 Estados principales
  const [dashboardData, setDashboardData] = useState<PatientDashboardDTO | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDTO | null>(null);
  const [loadingStates, setLoadingStates] = useState<DashboardLoadingState>(initialLoadingState);
  const [errorStates, setErrorStates] = useState<DashboardErrorState>(initialErrorState);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔧 Referencias para cleanup y control
  const mountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // 📡 Función principal de carga de dashboard
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      // Actualizar estado de loading
      setLoadingStates(prev => ({ 
        ...prev, 
        overall: !isRefresh 
      }));
      
      if (isRefresh) {
        setIsRefreshing(true);
      }

      // Limpiar errores previos
      setErrorStates({});

      logger.info(`🔄 ${isRefresh ? 'Refrescando' : 'Cargando'} datos del dashboard...`);

      // Llamada al servicio híbrido
      const response = await dashboardService.getPatientDashboard();

      // Verificar si el componente sigue montado
      if (!mountedRef.current) return;

      if (response.success) {
        const apiResponse = response as DashboardApiResponse<PatientDashboardDTO>;
        setDashboardData(apiResponse.data);
        setLastUpdated(apiResponse.timestamp);
        retryCountRef.current = 0;

        logger.info('✅ Dashboard cargado exitosamente:', {
          source: apiResponse.metadata?.version?.includes('mock') ? 'Mock' : 'API Real',
          timestamp: apiResponse.timestamp,
          appointmentsCount: apiResponse.data.upcomingAppointments.length,
          recordsCount: apiResponse.data.recentMedicalRecords.length
        });
      } else {
        const errorResponse = response as DashboardApiError;
        throw new Error(errorResponse.error.message || 'Error al cargar dashboard');
      }

    } catch (error) {
      logger.error('❌ Error cargando dashboard:', error);

      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setErrorStates(prev => ({
        ...prev,
        general: errorMessage
      }));

      // Implementar retry automático con backoff
      retryCountRef.current += 1;
      if (retryCountRef.current < 3) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
        logger.info(`🔄 Reintentando en ${retryDelay}ms (intento ${retryCountRef.current}/3)...`);
        
        refreshTimeoutRef.current = setTimeout(() => {
          loadDashboardData(isRefresh);
        }, retryDelay);
      }

    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ 
          ...prev, 
          overall: false 
        }));
        setIsRefreshing(false);
      }
    }
  }, []);

  // 👤 Función de carga de perfil de usuario
  const loadUserProfile = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, userProfile: true }));
      
      const response = await dashboardService.getUserProfile();

      if (!mountedRef.current) return;

      if (response.success) {
        const apiResponse = response as DashboardApiResponse<UserProfileDTO>;
        setUserProfile(apiResponse.data);
        
        logger.info('✅ Perfil de usuario cargado:', {
          userId: apiResponse.data.user.id,
          preferences: apiResponse.data.preferences
        });
      } else {
        const errorResponse = response as DashboardApiError;
        throw new Error(errorResponse.error.message || 'Error al cargar perfil');
      }

    } catch (error) {
      logger.error('❌ Error cargando perfil:', error);
      
      if (mountedRef.current) {
        setErrorStates(prev => ({
          ...prev,
          userProfile: error instanceof Error ? error.message : 'Error al cargar perfil'
        }));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, userProfile: false }));
      }
    }
  }, []);

  // 🔄 Función de refresh manual
  const refresh = useCallback(async () => {
    await loadDashboardData(true);
  }, [loadDashboardData]);

  // 🎯 Función de refresh por sección específica
  const refreshSection = useCallback(async (section: keyof DashboardLoadingState) => {
    if (section === 'overall' || section === 'userProfile') return;

    try {
      setLoadingStates(prev => ({ ...prev, [section]: true }));
      setErrorStates(prev => {
        const newErrors = { ...prev };
        delete newErrors[section as keyof DashboardErrorState];
        return newErrors;
      });

      logger.info(`🔄 Refrescando sección: ${section}`);

      const sectionMap = {
        appointments: 'appointments',
        medicalRecords: 'records',
        prescriptions: 'prescriptions',
        healthMetrics: 'health',
        notifications: 'notifications'
      };

      const apiSection = sectionMap[section as keyof typeof sectionMap];
      if (apiSection) {
        const response = await dashboardService.refreshDashboardSection(apiSection as any);
        
        if (!mountedRef.current) return;

        if (response.success && dashboardData) {
          // Actualizar solo la sección específica
          setDashboardData(prev => {
            if (!prev) return prev;
            
            const updated = { ...prev };
            switch (section) {
              case 'appointments':
                updated.upcomingAppointments = response.data || prev.upcomingAppointments;
                break;
              case 'medicalRecords':
                updated.recentMedicalRecords = response.data || prev.recentMedicalRecords;
                break;
              case 'prescriptions':
                updated.activePrescriptions = response.data || prev.activePrescriptions;
                break;
              case 'healthMetrics':
                updated.healthMetrics = response.data || prev.healthMetrics;
                break;
              case 'notifications':
                updated.notifications = response.data || prev.notifications;
                break;
            }
            updated.lastUpdated = new Date().toISOString();
            return updated;
          });
          
          logger.info(`✅ Sección ${section} actualizada exitosamente`);
        }
      }
    } catch (error) {
      logger.error(`❌ Error refrescando sección ${section}:`, error);
      
      if (mountedRef.current) {
        setErrorStates(prev => ({
          ...prev,
          [section]: error instanceof Error ? error.message : `Error en ${section}`
        }));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, [section]: false }));
      }
    }
  }, [dashboardData]);

  // 🧹 Función para limpiar errores
  const clearErrors = useCallback(() => {
    setErrorStates({});
  }, []);

  // 🎯 Función para limpiar error específico
  const clearError = useCallback((section: keyof DashboardErrorState) => {
    setErrorStates(prev => {
      const newErrors = { ...prev };
      delete newErrors[section];
      return newErrors;
    });
  }, []);

  // ⚙️ Función para actualizar preferencias
  const updateUserPreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    try {
      logger.info('🔄 Actualizando preferencias de usuario...');
      
      const response = await dashboardService.updateUserPreferences(preferences);
      
      if (!mountedRef.current) return;

      if (response.success) {
        const apiResponse = response as DashboardApiResponse<UserPreferences>;
        
        // Actualizar perfil local
        setUserProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              ...apiResponse.data
            }
          };
        });
        
        logger.info('✅ Preferencias actualizadas exitosamente');
      } else {
        const errorResponse = response as DashboardApiError;
        throw new Error(errorResponse.error.message || 'Error actualizando preferencias');
      }
    } catch (error) {
      logger.error('❌ Error actualizando preferencias:', error);
      throw error; // Re-lanzar para manejo en componente
    }
  }, []);

  // 🔧 Función para cambiar modo online/offline
  const setOnlineMode = useCallback((online: boolean) => {
    dashboardService.setOnlineMode(online);
    logger.info(`🔄 Modo cambiado a: ${online ? 'Online' : 'Offline'}`);
  }, []);

  // 📊 Función para obtener estadísticas del hook
  const getHookStats = useCallback(() => {
    return {
      hasData: !!dashboardData,
      hasProfile: !!userProfile,
      isLoading: loadingStates.overall,
      hasErrors: Object.keys(errorStates).length > 0,
      lastUpdated,
      isOnlineMode: dashboardService.isOnline(),
      retryCount: retryCountRef.current
    };
  }, [dashboardData, userProfile, loadingStates.overall, errorStates, lastUpdated]);

  // 🔄 Efecto de inicialización
  useEffect(() => {
    mountedRef.current = true;
    
    // Cargar datos iniciales
    loadDashboardData();
    loadUserProfile();

    // Cleanup al desmontar
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [loadDashboardData, loadUserProfile]);

  // 📱 Auto-refresh cada 5 minutos si está en primer plano
  useEffect(() => {
    if (!dashboardData) return;

    const autoRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loadingStates.overall) {
        logger.info('🔄 Auto-refresh programado ejecutándose...');
        refresh();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(autoRefreshInterval);
  }, [dashboardData, loadingStates.overall, refresh]);

  // 🎯 Estado consolidado del hook
  const hookState: DashboardHookState = {
    data: dashboardData,
    loading: loadingStates,
    errors: errorStates,
    lastUpdated,
    isRefreshing
  };

  // 🔧 Acciones disponibles
  const hookActions: DashboardHookActions = {
    refresh,
    refreshSection,
    clearErrors,
    clearError,
    updateUserPreferences
  };

  // 📊 Datos adicionales útiles
  const additionalData = {
    userProfile,
    isOnlineMode: dashboardService.isOnline(),
    setOnlineMode,
    getHookStats,
    
    // Funciones de utilidad
    hasData: !!dashboardData,
    hasErrors: Object.keys(errorStates).length > 0,
    isInitialLoading: loadingStates.overall && !dashboardData,
    
    // Estadísticas útiles
    stats: {
      appointmentsCount: dashboardData?.upcomingAppointments.length || 0,
      recordsCount: dashboardData?.recentMedicalRecords.length || 0,
      prescriptionsCount: dashboardData?.activePrescriptions.length || 0,
      notificationsCount: dashboardData?.notifications.length || 0,
      unreadNotifications: dashboardData?.notifications.filter(n => !n.isRead).length || 0
    }
  };

  return {
    // Estado principal
    ...hookState,
    
    // Acciones
    ...hookActions,
    
    // Datos adicionales
    ...additionalData
  };
};

/**
 * useDashboardSection - Hook simplificado para secciones específicas
 */
export const useDashboardSection = (section: keyof DashboardLoadingState) => {
  const dashboard = useDashboardData();
  
  return {
    data: dashboard.data,
    loading: dashboard.loading[section],
    error: dashboard.errors[section as keyof DashboardErrorState],
    refresh: () => dashboard.refreshSection(section),
    clearError: () => dashboard.clearError(section as keyof DashboardErrorState)
  };
};

/**
 * useDashboardStats - Hook para estadísticas rápidas
 */
export const useDashboardStats = () => {
  const { stats, lastUpdated, isOnlineMode } = useDashboardData();
  
  return {
    ...stats,
    lastUpdated,
    isOnlineMode,
    totalItems: stats.appointmentsCount + stats.recordsCount + stats.prescriptionsCount
  };
};

export default useDashboardData;