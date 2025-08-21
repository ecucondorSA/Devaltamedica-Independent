/**
 * Componente AnamnesisStats - Altamedica
 * Muestra estadísticas y métricas de anamnesis
 */

"use client";

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
} from 'lucide-react';
import { CardCorporate } from '@altamedica/ui';
import { CardContentCorporate } from './CardCorporate';

interface AnamnesisStatsProps {
  completitud: number;
  calidad: number;
  urgencia: string;
  alertas: string[];
  recomendaciones: string[];
  fechaCompletada?: string;
  className?: string;
}

export function AnamnesisStats({
  completitud,
  calidad,
  urgencia,
  alertas,
  recomendaciones,
  fechaCompletada,
  className = ''
}: AnamnesisStatsProps) {
  
  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'crítica': return 'text-red-600 bg-red-50 border-red-200';
      case 'alta': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baja': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case 'crítica': return <AlertTriangle className="w-4 h-4" />;
      case 'alta': return <Activity className="w-4 h-4" />;
      case 'media': return <Clock className="w-4 h-4" />;
      case 'baja': return <CheckCircle className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getQualityColor = (calidad: number) => {
    if (calidad >= 90) return 'text-green-600';
    if (calidad >= 70) return 'text-blue-600';
    if (calidad >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletitudColor = (completitud: number) => {
    if (completitud >= 90) return 'text-green-600';
    if (completitud >= 70) return 'text-blue-600';
    if (completitud >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (calidad: number) => {
    if (calidad >= 90) return <TrendingUp className="w-4 h-4" />;
    if (calidad >= 70) return <Target className="w-4 h-4" />;
    if (calidad >= 50) return <Activity className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <CardCorporate variant="default" size="md" className={className}>
      <CardContentCorporate className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Estadísticas de Anamnesis
        </h3>
        
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Completitud */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Completitud</span>
              <div className={`flex items-center space-x-1 ${getCompletitudColor(completitud)}`}>
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">{completitud}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completitud >= 90 ? 'bg-green-500' :
                  completitud >= 70 ? 'bg-blue-500' :
                  completitud >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${completitud}%` }}
              />
            </div>
          </div>

          {/* Calidad */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Calidad</span>
              <div className={`flex items-center space-x-1 ${getQualityColor(calidad)}`}>
                {getQualityIcon(calidad)}
                <span className="text-sm font-medium">{calidad}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  calidad >= 90 ? 'bg-green-500' :
                  calidad >= 70 ? 'bg-blue-500' :
                  calidad >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${calidad}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nivel de urgencia */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-900">Nivel de Urgencia</h4>
          <div className={`flex items-center space-x-3 p-3 rounded-lg border ${getUrgenciaColor(urgencia)}`}>
            {getUrgenciaIcon(urgencia)}
            <span className="font-medium capitalize">
              {urgencia === 'crítica' ? 'Crítica' : 
               urgencia === 'alta' ? 'Alta' : 
               urgencia === 'media' ? 'Media' : 'Baja'}
            </span>
          </div>
        </div>

        {/* Alertas y recomendaciones */}
        <div className="space-y-4">
          {/* Alertas */}
          {alertas.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Alertas Clínicas ({alertas.length})
              </h4>
              <div className="space-y-2">
                {alertas.map((alerta, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{alerta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {recomendaciones.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Recomendaciones ({recomendaciones.length})
              </h4>
              <div className="space-y-2">
                {recomendaciones.map((recomendacion, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-700">{recomendacion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fecha de completado */}
        {fechaCompletada && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Completada el {new Date(fechaCompletada).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}
      </CardContentCorporate>
    </CardCorporate>
  );
} 