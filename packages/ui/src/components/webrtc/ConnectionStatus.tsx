/**
 * @fileoverview Componente de estado de conexión WebRTC
 * @module @altamedica/ui/webrtc
 * @description Indicador visual del estado de conexión para videollamadas médicas
 */

import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../badge';
import { Card } from '../../card';
import { Progress } from '../../progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../tooltip';

export interface ConnectionMetrics {
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  bandwidth: {
    upload: number; // kbps
    download: number; // kbps
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  metrics?: ConnectionMetrics;
  showDetails?: boolean;
  variant?: 'inline' | 'card' | 'minimal';
  onReconnect?: () => void;
  onDiagnose?: () => void;
  className?: string;
}

const statusConfig = {
  connecting: {
    icon: Loader2,
    label: 'Conectando',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    animate: 'animate-spin'
  },
  connected: {
    icon: Wifi,
    label: 'Conectado',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    animate: ''
  },
  disconnected: {
    icon: WifiOff,
    label: 'Desconectado',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    animate: ''
  },
  reconnecting: {
    icon: Loader2,
    label: 'Reconectando',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    animate: 'animate-spin'
  },
  failed: {
    icon: AlertCircle,
    label: 'Error de conexión',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    animate: ''
  }
};

const qualityConfig = {
  excellent: {
    label: 'Excelente',
    color: 'green',
    bars: 4,
    description: 'Calidad óptima para consulta médica'
  },
  good: {
    label: 'Buena',
    color: 'green',
    bars: 3,
    description: 'Calidad adecuada para videollamada'
  },
  fair: {
    label: 'Regular',
    color: 'yellow',
    bars: 2,
    description: 'Posibles interrupciones menores'
  },
  poor: {
    label: 'Deficiente',
    color: 'orange',
    bars: 1,
    description: 'Calidad limitada, considere audio solo'
  },
  critical: {
    label: 'Crítica',
    color: 'red',
    bars: 0,
    description: 'Conexión inestable'
  }
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  metrics,
  showDetails = false,
  variant = 'inline',
  onReconnect,
  onDiagnose,
  className
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;

  // Efecto de parpadeo para estados problemáticos
  useEffect(() => {
    if (status === 'disconnected' || status === 'failed') {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const renderQualityBars = (quality: ConnectionMetrics['quality']) => {
    const qualityInfo = qualityConfig[quality];
    const totalBars = 4;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalBars }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-1 h-3 rounded-sm transition-all',
              index < qualityInfo.bars
                ? `bg-${qualityInfo.color}-500`
                : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Latencia:</span>
            <span className={cn(
              'font-mono font-semibold',
              metrics.latency < 150 ? 'text-green-600' : 
              metrics.latency < 300 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {metrics.latency}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Pérdida:</span>
            <span className={cn(
              'font-mono font-semibold',
              metrics.packetLoss < 1 ? 'text-green-600' : 
              metrics.packetLoss < 5 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {metrics.packetLoss.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Subida:</span>
            <span className="font-mono">{metrics.bandwidth.upload} kbps</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Bajada:</span>
            <span className="font-mono">{metrics.bandwidth.download} kbps</span>
          </div>
        </div>

        {metrics.quality && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-gray-600">Calidad:</span>
            <div className="flex items-center gap-2">
              {renderQualityBars(metrics.quality)}
              <span className={cn(
                'text-xs font-semibold',
                `text-${qualityConfig[metrics.quality].color}-600`
              )}>
                {qualityConfig[metrics.quality].label}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Variante minimal - solo icono con tooltip
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-testid="connection-status"
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full',
                config.bgColor,
                className
              )}
            >
              <Icon className={cn(
                'w-4 h-4',
                config.textColor,
                config.animate,
                isBlinking && 'opacity-50'
              )} />
              {metrics?.quality && renderQualityBars(metrics.quality)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{config.label}</p>
              {metrics && (
                <p className="text-xs">
                  Latencia: {metrics.latency}ms | Pérdida: {metrics.packetLoss}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variante inline - estado con métricas básicas
  if (variant === 'inline') {
    return (
      <div
        data-testid="connection-status"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          config.bgColor,
          className
        )}
      >
        <Icon className={cn(
          'w-5 h-5',
          config.textColor,
          config.animate,
          isBlinking && 'opacity-50'
        )} />
        
        <div className="flex-1">
          <p className={cn('font-semibold text-sm', config.textColor)}>
            {config.label}
          </p>
          {metrics && status === 'connected' && (
            <p className="text-xs text-gray-600">
              {metrics.latency}ms • {qualityConfig[metrics.quality].label}
            </p>
          )}
        </div>

        {metrics?.quality && status === 'connected' && (
          <div className="flex items-center gap-2">
            {renderQualityBars(metrics.quality)}
          </div>
        )}

        {(status === 'disconnected' || status === 'failed') && onReconnect && (
          <button
            onClick={onReconnect}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            data-testid="connection-lost"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  // Variante card - información completa
  return (
    <Card className={cn('p-4', className)} data-testid="connection-status">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              config.bgColor
            )}>
              <Icon className={cn(
                'w-6 h-6',
                config.textColor,
                config.animate,
                isBlinking && 'opacity-50'
              )} />
            </div>
            
            <div>
              <h4 className="font-semibold">{config.label}</h4>
              {metrics?.quality && (
                <p className="text-sm text-gray-600">
                  {qualityConfig[metrics.quality].description}
                </p>
              )}
            </div>
          </div>

          <Badge 
            variant={status === 'connected' ? 'success' : 'destructive'}
            className="text-xs"
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        {/* Metrics */}
        {showDetails && status === 'connected' && renderMetrics()}

        {/* Actions */}
        {(status === 'disconnected' || status === 'failed') && (
          <div className="flex gap-2 pt-2 border-t">
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                data-testid="connection-lost"
              >
                Reconectar
              </button>
            )}
            {onDiagnose && (
              <button
                onClick={onDiagnose}
                className="flex-1 px-3 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Diagnosticar
              </button>
            )}
          </div>
        )}

        {/* Recovery indicator */}
        {status === 'reconnecting' && (
          <div data-testid="connection-restored" className="space-y-2">
            <Progress value={65} className="h-2" />
            <p className="text-xs text-center text-gray-600">
              Restableciendo conexión segura...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ConnectionStatus;