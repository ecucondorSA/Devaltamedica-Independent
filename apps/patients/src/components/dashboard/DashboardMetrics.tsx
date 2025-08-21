"use client";

import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

import { logger } from '@altamedica/shared/services/logger.service';
interface DashboardMetricsProps {
  patientId?: string;
  compact?: boolean;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  description?: string;
}

export default function DashboardMetrics({ patientId, compact = false }: DashboardMetricsProps) {
  const { preferences } = useUserPreferences();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar métricas del paciente
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        
        // Simular carga de métricas (en producción esto vendría de la API)
        const mockMetrics: MetricCard[] = [
          {
            id: 'appointments',
            title: 'Citas Programadas',
            value: 3,
            change: 12,
            changeType: 'increase',
            icon: '📅',
            color: 'bg-blue-500',
            description: 'Próximas 30 días'
          },
          {
            id: 'prescriptions',
            title: 'Recetas Activas',
            value: 2,
            change: -5,
            changeType: 'decrease',
            icon: '💊',
            color: 'bg-green-500',
            description: 'Vigentes'
          },
          {
            id: 'lab-results',
            title: 'Resultados Pendientes',
            value: 1,
            change: 0,
            changeType: 'neutral',
            icon: '🔬',
            color: 'bg-yellow-500',
            description: 'Por revisar'
          },
          {
            id: 'health-score',
            title: 'Puntuación de Salud',
            value: '85%',
            change: 3,
            changeType: 'increase',
            icon: '❤️',
            color: 'bg-red-500',
            description: 'Basado en métricas'
          }
        ];

        // Filtrar métricas según preferencias del usuario
        const filteredMetrics = preferences.dashboard.showMetrics 
          ? mockMetrics 
          : mockMetrics.slice(0, 2);

        setMetrics(filteredMetrics);
        setError(null);
      } catch (err) {
        setError('Error al cargar métricas');
        logger.error('Error loading metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [patientId, preferences.dashboard.showMetrics]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!preferences.dashboard.autoRefresh) return;

    const interval = setInterval(() => {
      // Recargar métricas
      const loadMetrics = async () => {
        try {
          // Aquí iría la lógica de recarga real
          logger.info('Auto-refreshing metrics...');
        } catch (error) {
          logger.error('Error auto-refreshing metrics:', error);
        }
      };
      loadMetrics();
    }, preferences.dashboard.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [preferences.dashboard.autoRefresh, preferences.dashboard.refreshInterval]);

  if (loading) {
    return (
      <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return '↗️';
      case 'decrease':
        return '↘️';
      default:
        return '→';
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} text-gray-900 dark:text-white`}>
          Métricas de Salud
        </h3>
        {preferences.dashboard.autoRefresh && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="animate-pulse mr-1">🔄</span>
            Auto-refresh cada {preferences.dashboard.refreshInterval}s
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
              compact ? 'p-3' : 'p-4'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl ${compact ? 'text-xl' : 'text-2xl'}`}>
                {metric.icon}
              </span>
              {metric.change !== undefined && (
                <div className={`flex items-center text-xs ${getChangeColor(metric.changeType)}`}>
                  <span className="mr-1">{getChangeIcon(metric.changeType)}</span>
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>

            <div className="mb-1">
              <div className={`font-bold text-gray-900 dark:text-white ${
                compact ? 'text-sm' : 'text-lg'
              }`}>
                {metric.value}
              </div>
              <div className={`text-gray-600 dark:text-gray-400 ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                {metric.title}
              </div>
            </div>

            {metric.description && !compact && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metric.description}
              </div>
            )}

            {/* Barra de progreso visual */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${metric.color.replace('bg-', 'bg-')}`}
                  style={{
                    width: typeof metric.value === 'number' 
                      ? `${Math.min(metric.value * 10, 100)}%` 
                      : '60%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métricas adicionales en modo detallado */}
      {!compact && preferences.dashboard.layout === 'detailed' && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Métricas Detalladas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Última Visita</div>
              <div className="font-medium text-gray-900 dark:text-white">Hace 2 semanas</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Próxima Cita</div>
              <div className="font-medium text-gray-900 dark:text-white">En 3 días</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Estado General</div>
              <div className="font-medium text-green-600 dark:text-green-400">Excelente</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 