/**
 * Hook para actualizaciones en tiempo real
 * Integración con WebSocket para admin dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
export interface RealTimeUpdateConfig {
  onUpdate: (update: any) => void;
  endpoint: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface ConnectionQuality {
  latency: number;
  status: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export const useRealTimeUpdates = ({
  onUpdate,
  endpoint,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: RealTimeUpdateConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality['status']>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latencyTestRef = useRef<{ start: number; timeout: NodeJS.Timeout } | null>(null);

  const measureLatency = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const start = Date.now();
    latencyTestRef.current = {
      start,
      timeout: setTimeout(() => {
        // Si no hay respuesta en 5 segundos, consideramos conexión pobre
        setConnectionQuality('poor');
      }, 5000)
    };

    wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: start }));
  }, []);

  const calculateQuality = useCallback((latency: number): ConnectionQuality['status'] => {
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    if (latency < 1000) return 'poor';
    return 'disconnected';
  }, []);

  const connect = useCallback(() => {
    try {
      // Construir WebSocket URL basado en el endpoint
      const wsUrl = endpoint.startsWith('/') 
        ? `ws://localhost:3001${endpoint}` 
        : endpoint;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        logger.info('Admin WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Medir latencia inicial
        setTimeout(measureLatency, 1000);
        
        // Medir latencia cada 30 segundos
        const latencyInterval = setInterval(measureLatency, 30000);
        
        wsRef.current!.onclose = () => {
          clearInterval(latencyInterval);
        };
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ping response for latency measurement
          if (data.type === 'pong' && latencyTestRef.current) {
            const latency = Date.now() - latencyTestRef.current.start;
            clearTimeout(latencyTestRef.current.timeout);
            latencyTestRef.current = null;
            
            const quality = calculateQuality(latency);
            setConnectionQuality(quality);
            logger.info(`Admin WebSocket latency: ${latency}ms (${quality})`);
          } else {
            // Handle regular updates
            onUpdate(data);
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        logger.info('Admin WebSocket disconnected');
        setIsConnected(false);
        setConnectionQuality('disconnected');
        
        // Attempt reconnection if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.info(`Attempting reconnection ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        logger.error('Admin WebSocket error:', error);
        setConnectionQuality('disconnected');
      };

    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      setConnectionQuality('disconnected');
    }
  }, [endpoint, onUpdate, reconnectAttempts, maxReconnectAttempts, reconnectInterval, measureLatency, calculateQuality]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (latencyTestRef.current) {
      clearTimeout(latencyTestRef.current.timeout);
      latencyTestRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionQuality('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionQuality,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect,
  };
};