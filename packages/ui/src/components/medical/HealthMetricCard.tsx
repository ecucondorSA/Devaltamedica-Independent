// 🏥 HEALTH METRIC CARD - COMPONENTE MÉDICO ESPECIALIZADO
// Tarjeta avanzada para métricas de salud con estados clínicos y tendencias
// MÉDICO-ESPECÍFICO: Diseñado para mostrar vitales, análisis y métricas médicas
// MIGRADO DESDE: apps/patients/src/components/ui/HealthMetricCard.tsx

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CardCorporate, CardContentCorporate } from '../corporate/CardCorporate';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// 📊 TIPOS MÉDICOS ESPECÍFICOS
export type HealthStatus = 'normal' | 'warning' | 'critical' | 'excellent';
export type HealthTrend = 'up' | 'down' | 'stable';

export interface HealthMetricCardProps {
  /** Título de la métrica médica */
  title: string;
  /** Valor de la métrica (numérico o texto) */
  value: string | number;
  /** Unidad de medida (mg/dL, mmHg, °C, etc.) */
  unit?: string;
  /** Estado clínico de la métrica */
  status: HealthStatus;
  /** Tendencia de la métrica en el tiempo */
  trend?: HealthTrend;
  /** Icono representativo de la métrica */
  icon: React.ReactNode;
  /** Descripción médica adicional */
  description?: string;
  /** Fecha/hora de última actualización */
  lastUpdated?: string;
  /** Callback cuando se hace click en la tarjeta */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Modo médico emergencia (animaciones especiales) */
  emergency?: boolean;
  /** Mostrar rango normal de referencia */
  normalRange?: string;
  /** Prioridad médica para ordenamiento */
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// 🎨 CONFIGURACIÓN DE ESTADOS CLÍNICOS
const HEALTH_STATUS_CONFIG = {
  normal: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
    pulse: '',
    label: 'Normal'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200', 
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
    pulse: 'animate-pulse',
    label: 'Atención'
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
    pulse: 'animate-pulse',
    label: 'Crítico'
  },
  excellent: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    pulse: '',
    label: 'Excelente'
  }
};

// 📈 ICONOS DE TENDENCIAS MÉDICAS
const TREND_ICONS = {
  up: <TrendingUp className="w-4 h-4 text-green-600" />,
  down: <TrendingDown className="w-4 h-4 text-red-600" />,
  stable: <Minus className="w-4 h-4 text-gray-600" />
};

// 🚨 CONFIGURACIÓN DE PRIORIDADES MÉDICAS
const PRIORITY_CONFIG = {
  low: { ring: '', shadow: '' },
  medium: { ring: 'ring-2 ring-yellow-200', shadow: 'shadow-yellow-100' },
  high: { ring: 'ring-2 ring-orange-200', shadow: 'shadow-orange-100' },
  critical: { ring: 'ring-2 ring-red-200', shadow: 'shadow-red-100' }
};

// 🏥 COMPONENTE PRINCIPAL HEALTH METRIC CARD
export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  status,
  trend,
  icon,
  description,
  lastUpdated,
  onClick,
  className = '',
  emergency = false,
  normalRange,
  priority = 'medium'
}) => {
  // 🛡️ VALIDACIONES MÉDICAS ROBUSTAS
  if (!title || (value !== 0 && !value)) {
    logger.warn('HealthMetricCard: title y value son requeridos');
    return null;
  }

  const statusConfig = HEALTH_STATUS_CONFIG[status];
  const priorityConfig = PRIORITY_CONFIG[priority];
  
  // 🚨 ANIMACIONES DE EMERGENCIA MÉDICA
  const emergencyClasses = emergency 
    ? 'animate-pulse border-red-500' 
    : '';

  // 🎯 CLASES DINÁMICAS SEGÚN ESTADO MÉDICO
  const cardClasses = `
    transition-all duration-300 hover:shadow-lg cursor-pointer
    ${statusConfig.bg} 
    ${statusConfig.border}
    ${priorityConfig.ring}
    ${emergencyClasses}
    ${status === 'critical' ? statusConfig.pulse : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <CardCorporate
      variant={emergency ? "emergency" : "medical"}
      size="md"
      className={cardClasses}
      onClick={onClick}
      medical={true}
    >
      <CardContentCorporate className="p-6">
        {/* 🔝 HEADER CON ICONO Y ESTADO */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${statusConfig.icon} bg-white bg-opacity-50 relative`}>
            <div className="w-6 h-6">
              {icon}
            </div>
            {emergency && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
          
          {/* 📊 TENDENCIA Y BADGE DE ESTADO */}
          <div className="flex items-center space-x-2">
            {trend && TREND_ICONS[trend]}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.badge}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* 📋 INFORMACIÓN PRINCIPAL */}
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </h3>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-bold ${statusConfig.text}`}>
              {value}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 font-medium">
                {unit}
              </span>
            )}
          </div>
        </div>

        {/* 📊 RANGO NORMAL DE REFERENCIA */}
        {normalRange && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-600">
              Rango normal: <span className="font-medium">{normalRange}</span>
            </span>
          </div>
        )}

        {/* 📝 DESCRIPCIÓN MÉDICA */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* 🚨 INDICADOR DE EMERGENCIA */}
        {emergency && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-700 font-medium">
              REQUIERE ATENCIÓN MÉDICA INMEDIATA
            </span>
          </div>
        )}

        {/* 🕒 FOOTER CON TIMESTAMP Y ACCIÓN */}
        {lastUpdated && (
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3">
            <span>
              Actualizado: <span className="font-medium">{lastUpdated}</span>
            </span>
            <span className="text-primary-altamedica hover:text-secondary-altamedica cursor-pointer transition-colors">
              Ver detalles →
            </span>
          </div>
        )}

        {/* 🔍 INDICADOR DE PRIORIDAD MÉDICA */}
        {priority === 'critical' && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </CardContentCorporate>
    </CardCorporate>
  );
};

// 🎯 EXPORT DEFAULT
export default HealthMetricCard;