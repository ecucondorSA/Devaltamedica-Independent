import { useAuth  } from '@altamedica/auth';;
import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface MarketplaceNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
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
  };
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

interface UseMarketplaceNotificationsReturn {
  notifications: MarketplaceNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendNotification: (notification: Partial<MarketplaceNotification>) => Promise<void>;
}

export function useMarketplaceNotifications(): UseMarketplaceNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Conectar al WebSocket
  const connect = useCallback(() => {
    if (!user?.token) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}/api/v1/notifications/websocket`);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('WebSocket connected for doctor');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Autenticar
        ws.send(
          JSON.stringify({
            type: 'AUTHENTICATE',
            token: user.token,
            messageId: Date.now(),
          }),
        );

        // Suscribirse a notificaciones del marketplace
        ws.send(
          JSON.stringify({
            type: 'SUBSCRIBE',
            channel: 'marketplace',
            messageId: Date.now(),
          }),
        );

        // Suscribirse a notificaciones específicas de doctores
        ws.send(
          JSON.stringify({
            type: 'SUBSCRIBE',
            channel: 'doctor_jobs',
            messageId: Date.now(),
          }),
        );

        // Iniciar heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'HEARTBEAT',
                timestamp: new Date().toISOString(),
              }),
            );
          }
        }, 30000); // Cada 30 segundos
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        logger.info('WebSocket disconnected');
        setIsConnected(false);

        // Limpiar heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Intentar reconectar
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            logger.info(
              `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`,
            );
            connect();
          }, delay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        setError('Connection error occurred');
      };
    } catch (error) {
      logger.error('Error connecting to WebSocket:', error);
      setError('Failed to connect to notification service');
    }
  }, [user?.token]);

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'AUTHENTICATED':
        logger.info('WebSocket authenticated for doctor');
        refreshNotifications();
        break;

      case 'NEW_NOTIFICATION':
        if (data.notification && data.notification.data?.marketplace) {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Mostrar notificación específica para médicos
          showDoctorNotification(data.notification);
        }
        break;

      case 'INITIAL_NOTIFICATIONS':
        if (data.notifications) {
          const marketplaceNotifications = data.notifications.filter(
            (n: any) => n.data?.marketplace,
          );
          setNotifications(marketplaceNotifications);
          setUnreadCount(data.unreadCount || 0);
        }
        break;

      case 'NOTIFICATIONS_LIST':
        if (data.notifications) {
          const marketplaceNotifications = data.notifications.filter(
            (n: any) => n.data?.marketplace,
          );
          setNotifications(marketplaceNotifications);
          setUnreadCount(data.unreadCount || 0);
        }
        break;

      case 'SUBSCRIBED':
        logger.info(`Subscribed to channel: ${data.channel}`);
        break;

      case 'HEARTBEAT_ACK':
        // Heartbeat acknowledged
        break;

      case 'ERROR':
      case 'AUTH_ERROR':
        logger.error('WebSocket error:', data.error);
        setError(data.error);
        break;

      default:
        logger.info('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Mostrar notificación específica para médicos
  const showDoctorNotification = useCallback((notification: MarketplaceNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      let title = notification.title;
      let body = notification.message;
      let icon = '/icons/doctor-notification.png';

      // Personalizar según el tipo de notificación
      switch (notification.type) {
        case 'new_job_posted':
          icon = '/icons/job-notification.png';
          break;
        case 'application_status_changed':
          icon = '/icons/status-notification.png';
          if (notification.data?.status === 'hired') {
            icon = '/icons/success-notification.png';
          }
          break;
        case 'interview_scheduled':
          icon = '/icons/interview-notification.png';
          break;
        case 'job_offer_extended':
          icon = '/icons/offer-notification.png';
          break;
      }

      const browserNotification = new Notification(title, {
        body,
        icon,
        badge: '/icons/badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        actions: notification.data?.actionUrl
          ? [
              {
                action: 'view',
                title: 'Ver detalles',
              },
            ]
          : undefined,
      });

      browserNotification.onclick = () => {
        if (notification.data?.actionUrl) {
          window.open(notification.data.actionUrl, '_blank');
        }
        browserNotification.close();
      };
    }
  }, []);

  // Obtener notificaciones del marketplace para doctores
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/marketplace/notifications?userId=${user.id}&limit=50`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data.notifications || []);
          setUnreadCount(result.data.unreadCount || 0);
        }
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      logger.error('Error fetching marketplace notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.token]);

  // Marcar notificaciones como leídas
  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!user?.token) return;

      try {
        const response = await fetch('/api/v1/marketplace/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ notificationIds }),
        });

        if (response.ok) {
          // Actualizar estado local
          setNotifications((prev) =>
            prev.map((notification) =>
              notificationIds.includes(notification.id)
                ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                : notification,
            ),
          );

          // Actualizar contador de no leídas
          const markedCount = notifications.filter(
            (n) => notificationIds.includes(n.id) && !n.isRead,
          ).length;
          setUnreadCount((prev) => Math.max(0, prev - markedCount));
        }
      } catch (error) {
        logger.error('Error marking notifications as read:', error);
      }
    },
    [user?.token, notifications],
  );

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || !user?.token) return;

    try {
      const response = await fetch('/api/v1/marketplace/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          markAllAsRead: true,
        }),
      });

      if (response.ok) {
        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, user?.token]);

  // Enviar notificación del marketplace
  const sendNotification = useCallback(
    async (notification: Partial<MarketplaceNotification>) => {
      if (!user?.token) return;

      try {
        const response = await fetch('/api/v1/marketplace/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            ...notification,
            senderId: user.id,
            channels: ['websocket', 'email'],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send notification');
        }
      } catch (error) {
        logger.error('Error sending marketplace notification:', error);
        throw error;
      }
    },
    [user?.id, user?.token],
  );

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Conectar cuando el usuario esté autenticado
  useEffect(() => {
    if (user?.token) {
      connect();
    }

    return () => {
      // Limpiar al desmontar
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [user?.token, connect]);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (user?.id) {
      refreshNotifications();
    }
  }, [user?.id, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    sendNotification,
  };
}
