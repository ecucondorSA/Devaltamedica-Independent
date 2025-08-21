/**
 * @fileoverview Indicador de calidad de red para WebRTC
 * @module @altamedica/ui/webrtc
 * @description Visualización de métricas de calidad de red en tiempo real
 */

import React from 'react';
import { Signal, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../tooltip';

export interface NetworkQualityProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  latency?: number;
  packetLoss?: number;
  jitter?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const qualityConfig = {
  excellent: {
    bars: 4,
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    label: 'Excelente',
    description: 'Calidad óptima para videollamada'
  },
  good: {
    bars: 3,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Buena',
    description: 'Calidad adecuada'
  },
  fair: {
    bars: 2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Regular',
    description: 'Posibles interrupciones'
  },
  poor: {
    bars: 1,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    label: 'Deficiente',
    description: 'Calidad limitada'
  },
  critical: {
    bars: 0,
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    label: 'Crítica',
    description: 'Conexión muy inestable'
  }
};

const sizeConfig = {
  sm: { barWidth: 'w-1', barHeight: 'h-3', gap: 'gap-0.5', iconSize: 'w-3 h-3' },
  md: { barWidth: 'w-1.5', barHeight: 'h-4', gap: 'gap-1', iconSize: 'w-4 h-4' },
  lg: { barWidth: 'w-2', barHeight: 'h-5', gap: 'gap-1', iconSize: 'w-5 h-5' }
};

export const NetworkQualityIndicator: React.FC<NetworkQualityProps> = ({
  quality,
  latency,
  packetLoss,
  jitter,
  showLabel = false,
  size = 'md',
  className
}) => {
  const config = qualityConfig[quality];
  const sizes = sizeConfig[size];
  const totalBars = 4;

  const renderBars = () => (
    <div className={cn('flex items-end', sizes.gap)}>
      {Array.from({ length: totalBars }).map((_, index) => {
        const barHeight = `${(index + 1) * 25}%`;
        const isActive = index < config.bars;
        
        return (
          <div
            key={index}
            className={cn(
              sizes.barWidth,
              'transition-all duration-300 rounded-sm',
              isActive ? config.bgColor : 'bg-gray-300'
            )}
            style={{ height: barHeight, minHeight: '0.5rem' }}
          />
        );
      })}
    </div>
  );

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold">{config.label}</div>
      <div className="text-xs text-gray-300">{config.description}</div>
      {(latency !== undefined || packetLoss !== undefined || jitter !== undefined) && (
        <div className="space-y-1 pt-2 border-t border-gray-700">
          {latency !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Latencia:</span>
              <span className="font-mono">{latency}ms</span>
            </div>
          )}
          {packetLoss !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Pérdida de paquetes:</span>
              <span className="font-mono">{packetLoss.toFixed(1)}%</span>
            </div>
          )}
          {jitter !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Jitter:</span>
              <span className="font-mono">{jitter}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const indicator = (
    <div 
      className={cn('flex items-center', sizes.gap, className)}
      data-testid="network-quality-indicator"
    >
      {quality === 'critical' ? (
        <AlertTriangle className={cn(sizes.iconSize, 'text-red-600 animate-pulse')} />
      ) : (
        renderBars()
      )}
      
      {showLabel && (
        <span className={cn('text-sm font-medium ml-1', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NetworkQualityIndicator;