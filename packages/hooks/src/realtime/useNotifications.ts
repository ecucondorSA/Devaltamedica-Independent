/**
 * @fileoverview Hook unificado para notificaciones
 * @module @altamedica/hooks/realtime/useNotifications
 * @description Consolida toda la lógica de notificaciones del marketplace, médicas y sistema
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { logger } from '@altamedica/shared/services/logger.service';
import type { 
  NotificationData, 
  MessageEvent, 
  RealTimeConfig 
} from './types';
import { 
  REALTIME_EVENTS, 
  MEDICAL_CONFIG,
  isCriticalMedicalEvent 
} from './constants';

// ==========================================
// TIPOS ESPECÍFICOS DEL HOOK
// ==========================================

interface MarketplaceNotification extends NotificationData {
  data?: {
    jobId?: string;
    applicationId?: string;
    companyId?: string;
    doctorId?: string;
    interviewDate?: string;
    jobTitle?: string;
    companyName?: string;
    doctorName?: string;
    specialty?: string;
    compatibilityScore?: number;
    salary?: {
      min: number;
      max: number;
      currency: string;
    };
    location?: {
      city: string;
      country: string;
    };
    actionUrl?: string;
    marketplace?: boolean;
  };
}

interface MedicalNotification extends NotificationData {
  medicalContext: {
    patientId?: string;
    appointmentId?: string;
    vitalSignsAlert?: boolean;
    emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    sessionId?: string;
    eventType?: 'vital_signs' | 'alert' | 'notification' | 'status_change';
  };
}

interface UseNotificationsOptions {
  /** Configuración de tiempo real */
  realTimeConfig?: Partial<RealTimeConfig>;
  /** Tipos de notificaciones a escuchar */
  notificationTypes?: string[];
  /** Usuario actual para filtrar notificaciones */
  userId?: string;
  /** Token de autenticación */
  token?: string;
  /** Si debe solicitar permisos del navegador */
  requestPermissions?: boolean;
  /** Configuración específica del usuario */
  userConfig?: {
    userType?: 'doctor' | 'patient' | 'company' | 'admin';
    preferences?: {
      enableSound?: boolean;
      enableDesktop?: boolean;
      enablePush?: boolean;
      quietHours?: {
        start: string;
        end: string;
      };
    };
  };
  /** Callbacks específicos */
  onNotification?: (notification: NotificationData) => void;
  onError?: (error: Error) => void;
}

interface UseNotificationsReturn {
  // Estado de notificaciones
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Gestión de notificaciones
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Envío de notificaciones
  sendNotification: (notification: Partial<NotificationData>) => Promise<void>;
  sendMarketplaceNotification: (notification: Partial<MarketplaceNotification>) => Promise<void>;
  sendMedicalAlert: (alert: Partial<MedicalNotification>) => Promise<void>;
  
  // Gestión de permisos
  requestBrowserPermission: () => Promise<NotificationPermission>;
  
  // Utilidades
  getNotificationsByType: (type: string) => NotificationData[];
  getNotificationsByChannel: (channel: string) => NotificationData[];
  exportNotifications: () => NotificationData[];
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook unificado para manejar todas las notificaciones del sistema
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    realTimeConfig = {},
    notificationTypes = [],
    userId,
    token,
    requestPermissions = true,
    userConfig,
    onNotification,
    onError
  } = options;

  // ==========================================
  // ESTADO DEL HOOK
  // ==========================================

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ==========================================
  // REFS Y CONFIGURACIÓN
  // ==========================================

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationCacheRef = useRef<Map<string, NotificationData>>(new Map());

  // Configuración de tiempo real
  const rtConfig: RealTimeConfig = useMemo(() => ({
    transport: 'websocket',
    channels: [
      'notifications',
      'marketplace',
      'medical_alerts',
      'system',
      ...(userConfig?.userType === 'doctor' ? ['doctor_jobs'] : []),
      ...(userConfig?.userType === 'company' ? ['company_marketplace'] : [])
    ],
    keepHistory: true,
    historyLimit: 500,
    batch: {
      enabled: true,
      size: 10,
      timeout: 200
    },
    ...realTimeConfig
  }), [realTimeConfig, userConfig]);

  // ==========================================
  // INTEGRACIÓN TIEMPO REAL
  // ==========================================

  const realtime = useRealTimeUpdates(rtConfig, {
    onEvent: handleRealtimeEvent,
    onError: handleRealtimeError
  });

  function handleRealtimeEvent(event: MessageEvent) {
    try {
      switch (event.type) {
        case 'NEW_NOTIFICATION':
          handleNewNotification(event.data);
          break;
          
        case 'NOTIFICATION_UPDATE':
          handleNotificationUpdate(event.data);
          break;
          
        case 'NOTIFICATIONS_LIST':
          handleNotificationsList(event.data);
          break;
          
        case 'MARKETPLACE_NOTIFICATION':
          handleMarketplaceNotification(event.data);
          break;
          
        case 'MEDICAL_ALERT':
          handleMedicalAlert(event.data);
          break;
      }
    } catch (error) {
      logger.error('Error handling realtime notification event:', error);
      handleRealtimeError(error as Error);
    }
  }

  function handleRealtimeError(error: Error) {
    setError(error);
    onError?.(error);
  }

  // ==========================================
  // MANEJADORES DE NOTIFICACIONES
  // ==========================================

  const handleNewNotification = useCallback((notificationData: any) => {
    const notification: NotificationData = {
      id: notificationData.id || `notif_${Date.now()}`,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      priority: notificationData.priority || 'medium',
      read: false,
      timestamp: new Date(notificationData.timestamp || Date.now()),
      actions: notificationData.actions,
      medicalContext: notificationData.medicalContext
    };

    // Filtrar por tipo de usuario y notificación
    if (notificationTypes.length > 0 && !notificationTypes.includes(notification.type)) {
      return;
    }

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Cache para acceso rápido
    notificationCacheRef.current.set(notification.id, notification);

    // Mostrar notificación
    showNotification(notification);
    
    // Callback global
    onNotification?.(notification);
  }, [notificationTypes, onNotification]);

  const handleNotificationUpdate = useCallback((update: any) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === update.id 
          ? { ...notification, ...update }
          : notification
      )
    );
    
    // Actualizar cache
    if (notificationCacheRef.current.has(update.id)) {
      const cached = notificationCacheRef.current.get(update.id)!;
      notificationCacheRef.current.set(update.id, { ...cached, ...update });
    }
  }, []);

  const handleNotificationsList = useCallback((data: any) => {
    if (data.notifications) {
      // Filtrar notificaciones relevantes
      const relevantNotifications = data.notifications.filter((n: any) => {
        if (notificationTypes.length > 0) {
          return notificationTypes.includes(n.type);
        }
        return true;
      });

      setNotifications(relevantNotifications);
      setUnreadCount(data.unreadCount || 0);
      
      // Actualizar cache
      relevantNotifications.forEach((n: NotificationData) => {
        notificationCacheRef.current.set(n.id, n);
      });
    }
  }, [notificationTypes]);

  const handleMarketplaceNotification = useCallback((data: any) => {
    // Procesar notificación específica del marketplace
    if (data.notification?.data?.marketplace) {
      handleNewNotification(data.notification);
    }
  }, [handleNewNotification]);

  const handleMedicalAlert = useCallback((data: any) => {
    // Procesar alerta médica con prioridad alta
    const alert: MedicalNotification = {
      ...data,
      type: 'medical_alert',
      priority: 'critical'
    };
    
    handleNewNotification(alert);
  }, [handleNewNotification]);

  // ==========================================
  // MOSTRAR NOTIFICACIONES
  // ==========================================

  const showNotification = useCallback((notification: NotificationData) => {
    // Verificar horas silenciosas
    if (userConfig?.preferences?.quietHours) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const start = parseTimeString(userConfig.preferences.quietHours.start);
      const end = parseTimeString(userConfig.preferences.quietHours.end);
      
      if (currentTime >= start && currentTime <= end) {
        return; // No mostrar durante horas silenciosas
      }
    }

    // Sonido de notificación
    if (userConfig?.preferences?.enableSound !== false) {
      playNotificationSound(notification);
    }

    // Notificación del navegador
    if (userConfig?.preferences?.enableDesktop !== false) {
      showBrowserNotification(notification);
    }
  }, [userConfig]);

  const playNotificationSound = useCallback((notification: NotificationData) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      // Sonido diferente según prioridad
      const soundFile = notification.priority === 'critical' 
        ? '/sounds/critical-alert.mp3'
        : notification.type === 'medical_alert'
        ? '/sounds/medical-alert.mp3'
        : '/sounds/notification.mp3';

      audioRef.current.src = soundFile;
      audioRef.current.play().catch(console.warn);
    } catch (error) {
      logger.warn('Could not play notification sound:', error);
    }
  }, []);

  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: getNotificationIcon(notification),
        badge: '/icons/badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        // actions: notification.actions?.map(action => ({
        //   action: action.id,
        //   title: action.label
        // }))
      });

      browserNotification.onclick = () => {
        // Manejar clic en notificación
        if (notification.actions?.[0]) {
          handleNotificationAction(notification.id, notification.actions[0].action);
        }
        browserNotification.close();
      };

      // Auto-cerrar después de un tiempo (excepto críticas)
      if (notification.priority !== 'critical') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }, []);

  const getNotificationIcon = useCallback((notification: NotificationData): string => {
    if (notification.type === 'medical_alert') {
      return '/icons/medical-alert.png';
    }
    
    if (notification.medicalContext) {
      return '/icons/medical-notification.png';
    }
    
    const marketplaceData = (notification as MarketplaceNotification).data;
    if (marketplaceData?.marketplace) {
      switch (marketplaceData.jobTitle?.toLowerCase()) {
        case 'doctor':
        case 'physician':
          return '/icons/doctor-notification.png';
        case 'nurse':
          return '/icons/nurse-notification.png';
        default:
          return '/icons/job-notification.png';
      }
    }
    
    return '/icons/notification.png';
  }, []);

  // ==========================================
  // GESTIÓN DE NOTIFICACIONES
  // ==========================================

  const markAsRead = useCallback(async (notificationIds: string[]): Promise<void> => {
    if (!token) return;

    try {
      const response = await fetch('/api/v1/notifications/mark-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );
        
        const markedCount = notifications.filter(n => 
          notificationIds.includes(n.id) && !n.read
        ).length;
        setUnreadCount(prev => Math.max(0, prev - markedCount));
      }
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      throw error;
    }
  }, [token, notifications]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!userId || !token) return;

    try {
      const response = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [userId, token]);

  const dismissNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      if (token) {
        await fetch(`/api/v1/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationCacheRef.current.delete(notificationId);
    } catch (error) {
      logger.error('Error dismissing notification:', error);
      throw error;
    }
  }, [token]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!userId || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/notifications?userId=${userId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          handleNotificationsList(result.data);
        }
      }
    } catch (error) {
      logger.error('Error refreshing notifications:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token, handleNotificationsList]);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    setNotifications([]);
    setUnreadCount(0);
    notificationCacheRef.current.clear();
  }, []);

  // ==========================================
  // ENVÍO DE NOTIFICACIONES
  // ==========================================

  const sendNotification = useCallback(async (
    notification: Partial<NotificationData>
  ): Promise<void> => {
    if (!token) return;

    const fullNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      senderId: userId
    };

    await realtime.publish('notifications', {
      type: 'SEND_NOTIFICATION',
      notification: fullNotification
    });
  }, [token, userId, realtime]);

  const sendMarketplaceNotification = useCallback(async (
    notification: Partial<MarketplaceNotification>
  ): Promise<void> => {
    const marketplaceNotif = {
      ...notification,
      data: {
        ...notification.data,
        marketplace: true
      }
    };

    await sendNotification(marketplaceNotif);
  }, [sendNotification]);

  const sendMedicalAlert = useCallback(async (
    alert: Partial<MedicalNotification>
  ): Promise<void> => {
    const medicalAlert = {
      ...alert,
      type: 'medical_alert',
      priority: 'critical' as const
    };

    await realtime.publish('medical_alerts', {
      type: 'MEDICAL_ALERT',
      alert: medicalAlert
    });
  }, [realtime]);

  // ==========================================
  // GESTIÓN DE PERMISOS
  // ==========================================

  const requestBrowserPermission = useCallback(async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }, []);

  // ==========================================
  // UTILIDADES
  // ==========================================

  const getNotificationsByType = useCallback((type: string): NotificationData[] => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getNotificationsByChannel = useCallback((channel: string): NotificationData[] => {
    // Para obtener por canal, necesitaríamos almacenar el canal en el metadata
    return notifications.filter(n => (n.medicalContext as any)?.eventType === channel);
  }, [notifications]);

  const exportNotifications = useCallback((): NotificationData[] => {
    return [...notifications];
  }, [notifications]);

  const handleNotificationAction = useCallback((notificationId: string, actionId: string) => {
    const notification = notificationCacheRef.current.get(notificationId);
    if (notification) {
      const action = notification.actions?.find(a => a.id === actionId);
      if (action?.action) {
        // Ejecutar acción específica
        logger.info('Executing notification action:', action.action);
      }
    }
  }, []);

  // ==========================================
  // UTILIDADES HELPER
  // ==========================================

  function parseTimeString(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ==========================================
  // EFECTOS
  // ==========================================

  // Solicitar permisos del navegador
  useEffect(() => {
    if (requestPermissions) {
      requestBrowserPermission();
    }
  }, [requestPermissions, requestBrowserPermission]);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (userId && token) {
      refreshNotifications();
    }
  }, [userId, token, refreshNotifications]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estado
    notifications,
    unreadCount,
    isConnected: realtime.isConnected,
    isLoading,
    error: error || realtime.error,
    
    // Gestión
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications,
    clearAllNotifications,
    
    // Envío
    sendNotification,
    sendMarketplaceNotification,
    sendMedicalAlert,
    
    // Permisos
    requestBrowserPermission,
    
    // Utilidades
    getNotificationsByType,
    getNotificationsByChannel,
    exportNotifications
  };
}

// ==========================================
// HOOK PARA MANAGER DE NOTIFICACIONES
// ==========================================

/**
 * Hook más avanzado que actúa como manager central de notificaciones
 */
export function useNotificationManager(options: UseNotificationsOptions = {}) {
  const notifications = useNotifications(options);
  
  // Estado adicional del manager
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'type'>('timestamp');

  // Notificaciones filtradas y ordenadas
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.notifications;
    
    // Aplicar filtro
    if (currentFilter !== 'all') {
      filtered = filtered.filter(n => n.type === currentFilter);
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'type':
          return a.type.localeCompare(b.type);
        case 'timestamp':
        default:
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });
    
    return filtered;
  }, [notifications.notifications, currentFilter, sortBy]);

  return {
    ...notifications,
    
    // Manager específico
    filteredNotifications,
    isMinimized,
    currentFilter,
    sortBy,
    
    // Manager methods
    setIsMinimized,
    setCurrentFilter,
    setSortBy,
    
    // Estadísticas del manager
    stats: {
      total: notifications.notifications.length,
      unread: notifications.unreadCount,
      byType: notifications.notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: notifications.notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
}