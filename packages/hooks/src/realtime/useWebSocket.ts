/**
 * @fileoverview Hook unificado para WebSocket
 * @module @altamedica/hooks/realtime/useWebSocket
 * @description Hook centralizado que consolida toda la funcionalidad WebSocket de la plataforma
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import type { 
  WebSocketConfig, 
  WebSocketState, 
  MessageEvent, 
  ConnectionState,
  ReconnectionConfig 
} from './types';
import { 
  CONNECTION_STATES, 
  REALTIME_EVENTS, 
  DEFAULT_RECONNECTION_CONFIG, 
  DEFAULT_HEARTBEAT_CONFIG,
  REALTIME_ERROR_CODES,
  DEFAULT_TIMEOUTS,
  MEDICAL_CONFIG,
  calculateReconnectDelay,
  isCriticalMedicalEvent
} from './constants';

// ==========================================
// TIPOS ESPECÍFICOS DEL HOOK
// ==========================================

interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  /** Si debe conectar automáticamente al montar */
  autoConnect?: boolean;
  /** Filtros de mensajes */
  messageFilters?: string[];
  /** Callback para mensajes */
  onMessage?: (message: MessageEvent) => void;
  /** Callback para cambios de estado */
  onStateChange?: (state: ConnectionState) => void;
  /** Callback para errores */
  onError?: (error: Error) => void;
  /** Si debe mantener logs de debug */
  debug?: boolean;
}

interface UseWebSocketReturn {
  // Estados principales
  state: WebSocketState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: Error | null;
  
  // Métricas
  metrics: WebSocketState['metrics'];
  latency: number | undefined;
  
  // Métodos de conexión
  connect: () => void;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Métodos de comunicación
  send: (data: any, options?: SendOptions) => Promise<boolean>;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  unsubscribe: (channel: string) => void;
  
  // Utilidades
  getConnectionInfo: () => ConnectionInfo;
  clearHistory: () => void;
  exportLogs: () => WebSocketLog[];
}

interface SendOptions {
  /** Prioridad del mensaje */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Si requiere confirmación */
  requiresAck?: boolean;
  /** Timeout para el mensaje */
  timeout?: number;
  /** Reintentos en caso de fallo */
  retries?: number;
}

interface ConnectionInfo {
  url: string;
  state: ConnectionState;
  uptime: number;
  reconnections: number;
  lastPing: number;
  serverInfo?: any;
}

interface WebSocketLog {
  timestamp: Date;
  type: 'sent' | 'received' | 'error' | 'state_change';
  data: any;
  size?: number;
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook unificado para WebSocket que consolida toda la funcionalidad de tiempo real
 * de la plataforma AltaMedica
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    autoConnect = true,
    protocols,
    headers,
    reconnection = {},
    heartbeat = {},
    token,
    medical,
    messageFilters = [],
    onMessage,
    onStateChange,
    onError,
    debug = false
  } = options;

  // ==========================================
  // ESTADO DEL HOOK
  // ==========================================

  const [state, setState] = useState<WebSocketState>(() => ({
    connectionState: CONNECTION_STATES.DISCONNECTED,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
    reconnectAttempts: 0,
    metrics: {
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      reconnections: 0,
      uptime: 0
    }
  }));

  // ==========================================
  // REFS Y CONFIGURACIÓN
  // ==========================================

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<string, Set<Function>>>(new Map());
  const pendingMessagesRef = useRef<Array<{ data: any; options?: SendOptions; resolve: Function; reject: Function }>>([]); 
  const connectTimeRef = useRef<number>(0);
  const logsRef = useRef<WebSocketLog[]>([]);
  const messageQueueRef = useRef<any[]>([]);

  // Configuración combinada
  const reconnectConfig: ReconnectionConfig = useMemo(() => ({
    ...DEFAULT_RECONNECTION_CONFIG,
    ...reconnection
  }), [reconnection]);

  const heartbeatConfig = useMemo(() => ({
    ...DEFAULT_HEARTBEAT_CONFIG,
    ...heartbeat
  }), [heartbeat]);

  // ==========================================
  // UTILIDADES INTERNAS
  // ==========================================

  const addLog = useCallback((type: WebSocketLog['type'], data: any, size?: number) => {
    if (!debug) return;
    
    const log: WebSocketLog = {
      timestamp: new Date(),
      type,
      data: typeof data === 'object' ? { ...data } : data,
      size
    };
    
    logsRef.current.push(log);
    
    // Mantener solo los últimos 1000 logs
    if (logsRef.current.length > 1000) {
      logsRef.current = logsRef.current.slice(-1000);
    }
  }, [debug]);

  const updateState = useCallback((update: Partial<WebSocketState>) => {
    setState(prev => {
      const newState = { ...prev, ...update };
      
      // Callback de cambio de estado
      if (update.connectionState && update.connectionState !== prev.connectionState) {
        onStateChange?.(update.connectionState);
        addLog('state_change', { 
          from: prev.connectionState, 
          to: update.connectionState 
        });
      }
      
      return newState;
    });
  }, [onStateChange, addLog]);

  const updateMetrics = useCallback((update: Partial<WebSocketState['metrics']>) => {
    setState(prev => ({
      ...prev,
      metrics: { ...prev.metrics, ...update }
    }));
  }, []);

  // ==========================================
  // LÓGICA DE CONEXIÓN
  // ==========================================

  const startHeartbeat = useCallback(() => {
    if (!heartbeatConfig.enabled || heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        const message = {
          type: REALTIME_EVENTS.WEBSOCKET.PING,
          timestamp: new Date().toISOString(),
          pingTime
        };

        ws.send(JSON.stringify(message));
        addLog('sent', message, JSON.stringify(message).length);
      }
    }, heartbeatConfig.interval);
  }, [heartbeatConfig, addLog]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const processPendingMessages = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const pending = [...pendingMessagesRef.current];
    pendingMessagesRef.current = [];

    pending.forEach(({ data, options, resolve, reject }) => {
      try {
        const message = {
          ...data,
          timestamp: new Date().toISOString(),
          priority: options?.priority || 'medium',
          requiresAck: options?.requiresAck || false
        };

        ws.send(JSON.stringify(message));
        
        const messageSize = JSON.stringify(message).length;
        updateMetrics({ 
          messagesSent: state.metrics.messagesSent + 1,
          bytesSent: state.metrics.bytesSent + messageSize
        });
        
        addLog('sent', message, messageSize);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }, [state.metrics, updateMetrics, addLog]);

  const handleMessage = useCallback((event: globalThis.MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const messageSize = event.data.length;
      
      updateMetrics({ 
        messagesReceived: state.metrics.messagesReceived + 1,
        bytesReceived: state.metrics.bytesReceived + messageSize
      });
      
      addLog('received', data, messageSize);

      // Procesar mensajes especiales del sistema
      switch (data.type) {
        case REALTIME_EVENTS.WEBSOCKET.PONG:
          if (data.pingTime) {
            const latency = Date.now() - data.pingTime;
            updateState({ latency });
          }
          return;

        case REALTIME_EVENTS.CONNECTION.CONNECTED:
          updateState({ 
            connectionState: CONNECTION_STATES.CONNECTED,
            isConnected: true,
            isConnecting: false,
            isReconnecting: false,
            error: null
          });
          processPendingMessages();
          return;

        case REALTIME_EVENTS.CONNECTION.ERROR:
          const error = new Error(data.error || 'WebSocket error');
          updateState({ error });
          onError?.(error);
          return;
      }

      // Filtrar mensajes si es necesario
      if (messageFilters.length > 0 && !messageFilters.includes(data.type)) {
        return;
      }

      // Procesar suscripciones por canal
      if (data.channel) {
        const channelSubscriptions = subscriptionsRef.current.get(data.channel);
        if (channelSubscriptions) {
          channelSubscriptions.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              logger.error('Error in subscription callback:', error);
            }
          });
        }
      }

      // Callback global de mensaje
      const messageEvent: MessageEvent = {
        id: data.id || `msg_${Date.now()}`,
        type: data.type,
        channel: data.channel || 'default',
        data: data.data || data,
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: data.metadata
      };

      onMessage?.(messageEvent);

      // Manejo especial para eventos médicos críticos
      if (medical?.hipaaCompliant && isCriticalMedicalEvent(data.type)) {
        logger.warn('Critical medical event received:', data.type);
        // Aquí se podría implementar lógica especial para eventos críticos
      }

    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
      addLog('error', { error: (error as Error).message || 'Unknown error', rawData: event.data });
    }
  }, [state.metrics, messageFilters, onMessage, onError, medical, updateState, updateMetrics, addLog, processPendingMessages]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateState({
      connectionState: CONNECTION_STATES.CONNECTING,
      isConnecting: true,
      error: null
    });

    try {
      connectTimeRef.current = Date.now();
      
      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      // Configurar headers si es posible (limitado en WebSocket API)
      if (token) {
        ws.addEventListener('open', () => {
          // Enviar token de autenticación después de abrir
          ws.send(JSON.stringify({
            type: 'AUTHENTICATE',
            token,
            messageId: Date.now()
          }));
        });
      }

      ws.onopen = () => {
        updateState({
          connectionState: CONNECTION_STATES.CONNECTED,
          isConnected: true,
          isConnecting: false,
          isReconnecting: false,
          reconnectAttempts: 0,
          lastConnected: new Date()
        });

        startHeartbeat();
        processPendingMessages();
        
        addLog('state_change', { state: 'connected', url });
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        updateState({
          connectionState: CONNECTION_STATES.DISCONNECTED,
          isConnected: false,
          isConnecting: false,
          lastDisconnected: new Date()
        });

        stopHeartbeat();
        
        const uptime = Date.now() - connectTimeRef.current;
        updateMetrics({ uptime: state.metrics.uptime + uptime });

        addLog('state_change', { 
          state: 'disconnected', 
          code: event.code, 
          reason: event.reason 
        });

        // Auto-reconexión si está habilitada
        if (reconnectConfig.enabled && state.reconnectAttempts < reconnectConfig.maxAttempts) {
          const delay = calculateReconnectDelay(state.reconnectAttempts, reconnectConfig);
          
          updateState({
            connectionState: CONNECTION_STATES.RECONNECTING,
            isReconnecting: true,
            reconnectAttempts: state.reconnectAttempts + 1
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            updateMetrics({ reconnections: state.metrics.reconnections + 1 });
            connect();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        const error = new Error('WebSocket connection error');
        updateState({ error });
        onError?.(error);
        addLog('error', { error: error.message, event });
      };

    } catch (error) {
      const err = error as Error;
      updateState({ 
        error: err,
        connectionState: CONNECTION_STATES.ERROR,
        isConnecting: false
      });
      onError?.(err);
      addLog('error', { error: err.message });
    }
  }, [url, protocols, token, handleMessage, reconnectConfig, state.reconnectAttempts, state.metrics, updateState, updateMetrics, onError, addLog, startHeartbeat, stopHeartbeat, processPendingMessages]);

  const disconnect = useCallback(() => {
    // Limpiar timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Disconnected by user');
      wsRef.current = null;
    }

    // Actualizar estado
    updateState({
      connectionState: CONNECTION_STATES.CLOSED,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempts: 0
    });

    // Limpiar suscripciones
    subscriptionsRef.current.clear();
    
    addLog('state_change', { state: 'closed', reason: 'user_disconnect' });
  }, [stopHeartbeat, updateState, addLog]);

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Reconnection timeout'));
      }, DEFAULT_TIMEOUTS.CONNECTION);

      const handleStateChange = (newState: ConnectionState) => {
        if (newState === CONNECTION_STATES.CONNECTED) {
          clearTimeout(timeoutId);
          resolve();
        } else if (newState === CONNECTION_STATES.ERROR) {
          clearTimeout(timeoutId);
          reject(new Error('Reconnection failed'));
        }
      };

      // Escuchar cambios de estado temporalmente
      const originalOnStateChange = onStateChange;
      options.onStateChange = handleStateChange;

      connect();

      // Restaurar callback original después de un breve delay
      setTimeout(() => {
        options.onStateChange = originalOnStateChange;
      }, 100);
    });
  }, [disconnect, connect, onStateChange]);

  // ==========================================
  // MÉTODOS DE COMUNICACIÓN
  // ==========================================

  const send = useCallback(async (
    data: any, 
    sendOptions: SendOptions = {}
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      
      if (!ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      if (ws.readyState !== WebSocket.OPEN) {
        // Agregar a cola de mensajes pendientes
        pendingMessagesRef.current.push({
          data,
          options: sendOptions,
          resolve,
          reject
        });
        return;
      }

      try {
        const message = {
          ...data,
          timestamp: new Date().toISOString(),
          priority: sendOptions.priority || 'medium',
          requiresAck: sendOptions.requiresAck || false,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        ws.send(JSON.stringify(message));
        
        const messageSize = JSON.stringify(message).length;
        updateMetrics({ 
          messagesSent: state.metrics.messagesSent + 1,
          bytesSent: state.metrics.bytesSent + messageSize
        });
        
        addLog('sent', message, messageSize);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }, [state.metrics, updateMetrics, addLog]);

  const subscribe = useCallback((
    channel: string, 
    callback: (data: any) => void
  ): (() => void) => {
    if (!subscriptionsRef.current.has(channel)) {
      subscriptionsRef.current.set(channel, new Set());
    }
    
    const channelSubscriptions = subscriptionsRef.current.get(channel)!;
    channelSubscriptions.add(callback);

    // Enviar suscripción al servidor
    send({
      type: 'SUBSCRIBE',
      channel,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: medical?.patientId || medical?.doctorId
      }
    });

    // Retornar función de cleanup
    return () => {
      channelSubscriptions.delete(callback);
      if (channelSubscriptions.size === 0) {
        subscriptionsRef.current.delete(channel);
        
        // Enviar desuscripción al servidor
        send({
          type: 'UNSUBSCRIBE',
          channel
        });
      }
    };
  }, [send, medical]);

  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);
    
    send({
      type: 'UNSUBSCRIBE',
      channel
    });
  }, [send]);

  // ==========================================
  // UTILIDADES
  // ==========================================

  const getConnectionInfo = useCallback((): ConnectionInfo => {
    const uptime = state.isConnected ? Date.now() - connectTimeRef.current : 0;
    
    return {
      url,
      state: state.connectionState,
      uptime,
      reconnections: state.metrics.reconnections,
      lastPing: state.latency || 0,
      serverInfo: {
        protocols: wsRef.current?.protocol,
        extensions: wsRef.current?.extensions,
        binaryType: wsRef.current?.binaryType
      }
    };
  }, [url, state, connectTimeRef.current]);

  const clearHistory = useCallback(() => {
    logsRef.current = [];
    messageQueueRef.current = [];
  }, []);

  const exportLogs = useCallback((): WebSocketLog[] => {
    return [...logsRef.current];
  }, []);

  // ==========================================
  // EFECTOS
  // ==========================================

  // Auto-conectar si está habilitado
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Solo re-ejecutar si cambia autoConnect

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // ==========================================
  // VALORES DERIVADOS
  // ==========================================

  const derivedValues = useMemo(() => ({
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    isReconnecting: state.isReconnecting,
    error: state.error,
    metrics: state.metrics,
    latency: state.latency
  }), [state]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estados
    state,
    ...derivedValues,
    
    // Métodos de conexión
    connect,
    disconnect,
    reconnect,
    
    // Métodos de comunicación
    send,
    subscribe,
    unsubscribe,
    
    // Utilidades
    getConnectionInfo,
    clearHistory,
    exportLogs
  };
}

// ==========================================
// HOOK DE ESTADO SIMPLIFICADO
// ==========================================

/**
 * Hook simplificado que solo retorna el estado del WebSocket
 */
export function useWebSocketState(url: string, options?: UseWebSocketOptions) {
  const { state, isConnected, isConnecting, isReconnecting, error } = useWebSocket(url, {
    ...options,
    autoConnect: false // No conectar automáticamente para solo estado
  });

  return {
    state: state.connectionState,
    isConnected,
    isConnecting, 
    isReconnecting,
    error,
    metrics: state.metrics
  };
}