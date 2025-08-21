/**
 * @fileoverview Hook para actualizaciones en tiempo real
 * @module @altamedica/hooks/realtime/useRealTimeUpdates
 * @description Hook que maneja actualizaciones en tiempo real usando WebSocket y Firebase
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { 
  RealTimeConfig, 
  RealTimeState, 
  MessageEvent, 
  ConnectionState,
  FirebaseConfig 
} from './types';
import { useWebSocket } from './useWebSocket';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  CONNECTION_STATES, 
  REALTIME_EVENTS, 
  MEDICAL_CONFIG,
  isCriticalMedicalEvent 
} from './constants';

// ==========================================
// TIPOS ESPECÍFICOS DEL HOOK
// ==========================================

interface UseRealTimeUpdatesOptions extends Partial<RealTimeConfig> {
  /** Canales iniciales a suscribir */
  initialChannels?: string[];
  /** Callback para eventos recibidos */
  onEvent?: (event: MessageEvent) => void;
  /** Callback para errores */
  onError?: (error: Error) => void;
  /** Si debe mantener historial de eventos */
  keepHistory?: boolean;
  /** Límite de eventos en historial */
  historyLimit?: number;
  /** Si debe procesar eventos en batch */
  batchEvents?: boolean;
  /** Tiempo de espera para batch (ms) */
  batchTimeout?: number;
}

interface UseRealTimeUpdatesReturn {
  // Estados
  state: RealTimeState;
  isConnected: boolean;
  error: Error | null;
  
  // Suscripciones
  subscribe: (channel: string, callback?: (event: MessageEvent) => void) => () => void;
  unsubscribe: (channel: string) => void;
  unsubscribeAll: () => void;
  
  // Publicación
  publish: (channel: string, data: any, metadata?: any) => Promise<void>;
  broadcast: (data: any, channels?: string[]) => Promise<void>;
  
  // Gestión de eventos
  getHistory: (channel?: string) => MessageEvent[];
  clearHistory: (channel?: string) => void;
  getChannelStats: (channel: string) => ChannelStats | null;
  
  // Utilidades
  reconnect: () => Promise<void>;
  getConnectionInfo: () => any;
}

interface ChannelStats {
  messageCount: number;
  subscriberCount: number;
  lastMessage?: MessageEvent;
  averageProcessingTime: number;
  errorCount: number;
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook para manejar actualizaciones en tiempo real de forma unificada
 */
export function useRealTimeUpdates(
  config: RealTimeConfig,
  options: UseRealTimeUpdatesOptions = {}
): UseRealTimeUpdatesReturn {
  const {
    initialChannels = [],
    onEvent,
    onError,
    keepHistory = true,
    historyLimit = 1000,
    batchEvents = false,
    batchTimeout = 100
  } = options;

  // ==========================================
  // ESTADO DEL HOOK
  // ==========================================

  const [state, setState] = useState<RealTimeState>(() => ({
    connectionState: CONNECTION_STATES.DISCONNECTED,
    subscribedChannels: new Set(),
    messageQueue: [],
    eventHistory: [],
    stats: {
      messagesReceived: 0,
      eventsProcessed: 0,
      channelsActive: 0,
      averageProcessingTime: 0
    }
  }));

  const [error, setError] = useState<Error | null>(null);

  // ==========================================
  // REFS Y CONFIGURACIÓN
  // ==========================================

  const subscriptionsRef = useRef<Map<string, Set<Function>>>(new Map());
  const channelStatsRef = useRef<Map<string, ChannelStats>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const batchQueueRef = useRef<MessageEvent[]>([]);
  const processingTimesRef = useRef<number[]>([]);

  // ==========================================
  // WEBSOCKET INTEGRATION
  // ==========================================

  const wsUrl = useMemo(() => {
    if (config.transport === 'websocket' && config.transportConfig) {
      return (config.transportConfig as any).url;
    }
    return 'ws://localhost:8888';
  }, [config]);

  const websocket = useWebSocket(wsUrl, {
    autoConnect: true,
    reconnection: {
      enabled: true,
      maxAttempts: 10,
      initialDelay: 1000,
      backoffFactor: 2
    },
    medical: {
      hipaaCompliant: true,
      priority: 'high'
    },
    onMessage: handleWebSocketMessage,
    onStateChange: handleConnectionStateChange,
    onError: handleWebSocketError
  });

  // ==========================================
  // MANEJADORES DE EVENTOS
  // ==========================================

  function handleWebSocketMessage(message: MessageEvent) {
    const startTime = performance.now();
    
    try {
      // Actualizar estadísticas
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesReceived: prev.stats.messagesReceived + 1
        }
      }));

      // Filtrar por canales suscritos
      if (!state.subscribedChannels.has(message.channel)) {
        return;
      }

      // Procesar mensaje
      if (batchEvents) {
        batchQueueRef.current.push(message);
        scheduleBatchProcessing();
      } else {
        processMessage(message);
      }

      // Actualizar estadísticas de canal
      updateChannelStats(message.channel, message);

      // Mantener historial si está habilitado
      if (keepHistory) {
        setState(prev => {
          const newHistory = [...prev.eventHistory, message];
          if (newHistory.length > historyLimit) {
            newHistory.splice(0, newHistory.length - historyLimit);
          }
          return {
            ...prev,
            eventHistory: newHistory
          };
        });
      }

      // Callback global
      onEvent?.(message);

    } catch (error) {
      logger.error('Error processing real-time message:', error);
      onError?.(error as Error);
    } finally {
      const processingTime = performance.now() - startTime;
      updateProcessingTime(processingTime);
    }
  }

  function handleConnectionStateChange(connectionState: ConnectionState) {
    setState(prev => ({
      ...prev,
      connectionState
    }));
  }

  function handleWebSocketError(error: Error) {
    setError(error);
    onError?.(error);
  }

  // ==========================================
  // PROCESAMIENTO DE MENSAJES
  // ==========================================

  const processMessage = useCallback((message: MessageEvent) => {
    // Ejecutar callbacks de suscripción del canal
    const channelSubscriptions = subscriptionsRef.current.get(message.channel);
    if (channelSubscriptions) {
      channelSubscriptions.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          logger.error(`Error in subscription callback for channel ${message.channel}:`, error);
        }
      });
    }

    // Manejo especial para eventos médicos críticos
    if (isCriticalMedicalEvent(message.type)) {
      logger.warn(`Critical medical event: ${message.type}`, message);
      
      // Notificar inmediatamente sin batch
      if (message.metadata?.medicalContext) {
        // Procesar evento crítico con prioridad alta
        handleCriticalMedicalEvent(message);
      }
    }

    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        eventsProcessed: prev.stats.eventsProcessed + 1
      }
    }));
  }, []);

  const scheduleBatchProcessing = useCallback(() => {
    if (batchTimeoutRef.current) return;

    batchTimeoutRef.current = setTimeout(() => {
      const batch = [...batchQueueRef.current];
      batchQueueRef.current = [];
      batchTimeoutRef.current = null;

      // Procesar batch de mensajes
      batch.forEach(processMessage);
    }, batchTimeout);
  }, [batchTimeout, processMessage]);

  const handleCriticalMedicalEvent = useCallback((event: MessageEvent) => {
    // Logging especial para eventos críticos
    logger.error('CRITICAL MEDICAL EVENT:', {
      type: event.type,
      patientId: event.metadata?.medicalContext?.patientId,
      timestamp: event.timestamp,
      data: event.data
    });

    // Aquí se podrían agregar alertas especiales, notificaciones push, etc.
  }, []);

  // ==========================================
  // GESTIÓN DE ESTADÍSTICAS
  // ==========================================

  const updateChannelStats = useCallback((channel: string, message: MessageEvent) => {
    const stats = channelStatsRef.current.get(channel) || {
      messageCount: 0,
      subscriberCount: subscriptionsRef.current.get(channel)?.size || 0,
      averageProcessingTime: 0,
      errorCount: 0
    };

    stats.messageCount++;
    stats.lastMessage = message;
    stats.subscriberCount = subscriptionsRef.current.get(channel)?.size || 0;

    channelStatsRef.current.set(channel, stats);
  }, []);

  const updateProcessingTime = useCallback((time: number) => {
    processingTimesRef.current.push(time);
    
    // Mantener solo las últimas 100 mediciones
    if (processingTimesRef.current.length > 100) {
      processingTimesRef.current = processingTimesRef.current.slice(-100);
    }

    // Actualizar promedio
    const average = processingTimesRef.current.reduce((a, b) => a + b, 0) / processingTimesRef.current.length;
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        averageProcessingTime: average
      }
    }));
  }, []);

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  const subscribe = useCallback((
    channel: string, 
    callback?: (event: MessageEvent) => void
  ): (() => void) => {
    // Agregar canal a estado
    setState(prev => ({
      ...prev,
      subscribedChannels: new Set([...prev.subscribedChannels, channel]),
      stats: {
        ...prev.stats,
        channelsActive: prev.subscribedChannels.size + 1
      }
    }));

    // Agregar callback si se proporciona
    if (callback) {
      if (!subscriptionsRef.current.has(channel)) {
        subscriptionsRef.current.set(channel, new Set());
      }
      subscriptionsRef.current.get(channel)!.add(callback);
    }

    // Suscribir a WebSocket
    const unsubscribeWs = websocket.subscribe(channel, (data) => {
      const event: MessageEvent = {
        id: data.id || `evt_${Date.now()}`,
        type: data.type,
        channel,
        data: data.data || data,
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: data.metadata
      };
      
      handleWebSocketMessage(event);
    });

    // Función de cleanup
    return () => {
      // Remover callback
      if (callback && subscriptionsRef.current.has(channel)) {
        subscriptionsRef.current.get(channel)!.delete(callback);
      }
      
      // Si no hay más callbacks, desuscribir completamente
      if (!subscriptionsRef.current.get(channel)?.size) {
        setState(prev => {
          const newChannels = new Set(prev.subscribedChannels);
          newChannels.delete(channel);
          return {
            ...prev,
            subscribedChannels: newChannels,
            stats: {
              ...prev.stats,
              channelsActive: newChannels.size
            }
          };
        });

        subscriptionsRef.current.delete(channel);
        channelStatsRef.current.delete(channel);
        unsubscribeWs();
      }
    };
  }, [websocket]);

  const unsubscribe = useCallback((channel: string) => {
    setState(prev => {
      const newChannels = new Set(prev.subscribedChannels);
      newChannels.delete(channel);
      return {
        ...prev,
        subscribedChannels: newChannels,
        stats: {
          ...prev.stats,
          channelsActive: newChannels.size
        }
      };
    });

    subscriptionsRef.current.delete(channel);
    channelStatsRef.current.delete(channel);
    websocket.unsubscribe(channel);
  }, [websocket]);

  const unsubscribeAll = useCallback(() => {
    state.subscribedChannels.forEach(channel => {
      websocket.unsubscribe(channel);
    });

    setState(prev => ({
      ...prev,
      subscribedChannels: new Set(),
      stats: {
        ...prev.stats,
        channelsActive: 0
      }
    }));

    subscriptionsRef.current.clear();
    channelStatsRef.current.clear();
  }, [state.subscribedChannels, websocket]);

  const publish = useCallback(async (
    channel: string, 
    data: any, 
    metadata?: any
  ): Promise<void> => {
    const message = {
      type: 'PUBLISH',
      channel,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        publisherId: metadata?.userId || 'anonymous'
      }
    };

    await websocket.send(message);
  }, [websocket]);

  const broadcast = useCallback(async (
    data: any, 
    channels: string[] = []
  ): Promise<void> => {
    const targetChannels = channels.length > 0 ? channels : Array.from(state.subscribedChannels);
    
    const promises = targetChannels.map(channel => 
      publish(channel, data, { broadcast: true })
    );

    await Promise.all(promises);
  }, [state.subscribedChannels, publish]);

  const getHistory = useCallback((channel?: string): MessageEvent[] => {
    if (!channel) {
      return state.eventHistory;
    }
    
    return state.eventHistory.filter(event => event.channel === channel);
  }, [state.eventHistory]);

  const clearHistory = useCallback((channel?: string) => {
    if (!channel) {
      setState(prev => ({
        ...prev,
        eventHistory: []
      }));
    } else {
      setState(prev => ({
        ...prev,
        eventHistory: prev.eventHistory.filter(event => event.channel !== channel)
      }));
    }
  }, []);

  const getChannelStats = useCallback((channel: string): ChannelStats | null => {
    return channelStatsRef.current.get(channel) || null;
  }, []);

  const reconnect = useCallback(async (): Promise<void> => {
    return websocket.reconnect();
  }, [websocket]);

  const getConnectionInfo = useCallback(() => {
    return websocket.getConnectionInfo();
  }, [websocket]);

  // ==========================================
  // EFECTOS
  // ==========================================

  // Suscribir a canales iniciales
  useEffect(() => {
    if (initialChannels.length > 0) {
      initialChannels.forEach(channel => {
        subscribe(channel);
      });
    }

    return () => {
      // Cleanup batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [initialChannels, subscribe]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estados
    state,
    isConnected: websocket.isConnected,
    error: error || websocket.error,
    
    // Suscripciones
    subscribe,
    unsubscribe,
    unsubscribeAll,
    
    // Publicación
    publish,
    broadcast,
    
    // Gestión de eventos
    getHistory,
    clearHistory,
    getChannelStats,
    
    // Utilidades
    reconnect,
    getConnectionInfo
  };
}

// ==========================================
// HOOK SIMPLIFICADO DE SUSCRIPCIÓN
// ==========================================

/**
 * Hook simplificado para suscribirse a un solo canal
 */
export function useRealTimeSubscription(
  channel: string,
  callback: (event: MessageEvent) => void,
  config?: Partial<RealTimeConfig>
) {
  const defaultConfig: RealTimeConfig = {
    transport: 'websocket',
    channels: [channel],
    keepHistory: false,
    batch: {
      enabled: false,
      size: 10,
      timeout: 100
    }
  };

  const realtime = useRealTimeUpdates({ ...defaultConfig, ...config });

  useEffect(() => {
    const unsubscribe = realtime.subscribe(channel, callback);
    return unsubscribe;
  }, [channel, callback, realtime]);

  return {
    isConnected: realtime.isConnected,
    error: realtime.error,
    publish: (data: any, metadata?: any) => realtime.publish(channel, data, metadata),
    stats: realtime.getChannelStats(channel)
  };
}