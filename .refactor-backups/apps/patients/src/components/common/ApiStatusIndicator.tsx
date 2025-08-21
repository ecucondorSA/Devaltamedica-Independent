import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ApiStatus {
  isOnline: boolean;
  lastCheck: Date;
  error?: string;
  responseTime?: number;
}

interface ApiStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onStatusChange?: (status: ApiStatus) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
  onStatusChange
}) => {
  const [status, setStatus] = useState<ApiStatus>({
    isOnline: false,
    lastCheck: new Date()
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkApiStatus = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const newStatus: ApiStatus = {
          isOnline: true,
          lastCheck: new Date(),
          responseTime
        };
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const newStatus: ApiStatus = {
        isOnline: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-500';
    return status.isOnline ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return status.isOnline ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <AlertCircle className="w-4 h-4" />
    );
  };

  const getStatusText = () => {
    if (isChecking) return 'Verificando...';
    return status.isOnline ? 'API Conectada' : 'API Desconectada';
  };

  const formatLastCheck = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500">
          <span>Última verificación: {formatLastCheck(status.lastCheck)}</span>
          {status.responseTime && (
            <span className="ml-2">({status.responseTime}ms)</span>
          )}
        </div>
      )}

      {!status.isOnline && !isChecking && (
        <button
          onClick={checkApiStatus}
          className="text-xs text-blue-500 hover:text-blue-700 underline"
          title="Reintentar conexión"
        >
          Reintentar
        </button>
      )}

      {!status.isOnline && status.error && showDetails && (
        <div className="text-xs text-red-500 ml-2">
          Error: {status.error}
        </div>
      )}
    </div>
  );
};

// Componente de banner para mostrar cuando la API está desconectada
export const ApiOfflineBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<ApiStatus>({
    isOnline: false,
    lastCheck: new Date()
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const isOnline = response.ok;
        setStatus({ isOnline, lastCheck: new Date() });
        setIsVisible(!isOnline);
      } catch (error) {
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : 'Error de conexión'
        });
        setIsVisible(true);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-center">
        <WifiOff className="w-5 h-5 text-yellow-400 mr-2" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            API no disponible
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            La aplicación está funcionando en modo offline con datos de ejemplo.
            Algunas funciones pueden no estar disponibles.
          </p>
          {status.error && (
            <p className="text-xs text-yellow-600 mt-1">
              Error: {status.error}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-400 hover:text-yellow-600"
        >
          <span className="sr-only">Cerrar</span>
          ×
        </button>
      </div>
    </div>
  );
};

// Hook para usar el estado de la API en otros componentes
export const useApiStatus = () => {
  const [status, setStatus] = useState<ApiStatus>({
    isOnline: false,
    lastCheck: new Date()
  });

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setStatus({
        isOnline: response.ok,
        lastCheck: new Date()
      });
    } catch (error) {
      setStatus({
        isOnline: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Error de conexión'
      });
    }
  };

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, checkApiStatus };
}; 