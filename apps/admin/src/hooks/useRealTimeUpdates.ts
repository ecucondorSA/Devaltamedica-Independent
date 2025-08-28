/**
 * Real-Time Updates Hook
 * Proporciona actualizaciones en tiempo real para el dashboard admin
 * Incluye conexión WebSocket, calidad de conexión y manejo de actualizaciones
 */

import { useState, useEffect, useCallback } from 'react';

export interface RealTimeUpdate {
  type: 'emergency_alert' | 'metric_update' | 'system_status' | 'compliance_update';
  data: unknown;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealTimeUpdatesConfig {
  onUpdate: (update: RealTimeUpdate) => void;
  endpoint: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface RealTimeUpdatesState {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdate: Date | null;
  error: string | null;
  reconnectAttempts: number;
}

export const useRealTimeUpdates = (config: RealTimeUpdatesConfig) => {
  const [state, setState] = useState<RealTimeUpdatesState>({
    isConnected: false,
    connectionQuality: 'good',
    lastUpdate: null,
    error: null,
    reconnectAttempts: 0,
  });

  const [ws, setWs] = useState<WebSocket | null>(null);

  // Función para establecer conexión WebSocket
  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(config.endpoint);

      socket.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectAttempts: 0,
        }));
      };

      socket.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data as string) as RealTimeUpdate;
          config.onUpdate(update);

          setState((prev) => ({
            ...prev,
            lastUpdate: new Date(),
          }));
        } catch {
          // Error parsing real-time update - silently handled
        }
      };

      socket.onclose = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));

        // Intentar reconectar
        if (state.reconnectAttempts < (config.maxReconnectAttempts || 5)) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            }));
            connect();
          }, config.reconnectInterval || 5000);
        }
      };

      socket.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: 'WebSocket connection error',
          connectionQuality: 'poor',
        }));
      };

      setWs(socket);
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
      }));
    }
  }, [config, state.reconnectAttempts]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    }
  }, [ws]);

  // Función para enviar mensaje
  const sendMessage = useCallback(
    (message: unknown) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },
    [ws],
  );

  // Función para verificar calidad de conexión
  const checkConnectionQuality = useCallback(() => {
    if (!ws) return;

    const now = Date.now();
    const lastUpdate = state.lastUpdate?.getTime() || 0;
    const timeSinceLastUpdate = now - lastUpdate;

    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    if (timeSinceLastUpdate < 1000) {
      quality = 'excellent';
    } else if (timeSinceLastUpdate < 5000) {
      quality = 'good';
    } else if (timeSinceLastUpdate < 15000) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    setState((prev) => ({
      ...prev,
      connectionQuality: quality,
    }));
  }, [ws, state.lastUpdate]);

  // Efecto para establecer conexión
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Efecto para verificar calidad de conexión
  useEffect(() => {
    const interval = setInterval(checkConnectionQuality, 10000);
    return () => clearInterval(interval);
  }, [checkConnectionQuality]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  };
};
