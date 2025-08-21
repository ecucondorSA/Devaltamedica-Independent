/**
 * Componente de métricas de rendimiento para el dashboard de Companies
 * Utiliza las nuevas características de Chrome DevTools
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useEffect, useState } from 'react';
import { collectPerformanceMetrics, usePerformanceMode } from '../utils/performance';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  connectionType: string;
  saveDataMode: boolean;
  resources: number;
  timestamp: number;
}

export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const { saveDataMode, config } = usePerformanceMode();

  useEffect(() => {
    // Recopilar métricas iniciales
    const initialMetrics = collectPerformanceMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
    }

    // Actualizar métricas cada 30 segundos
    const interval = setInterval(() => {
      const newMetrics = collectPerformanceMetrics();
      if (newMetrics) {
        setMetrics(newMetrics);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Métricas de Rendimiento</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getConnectionStatus = () => {
    if (saveDataMode) return { color: 'text-yellow-600', text: 'Modo datos reducidos' };
    if (metrics.connectionType === '4g') return { color: 'text-green-600', text: 'Conexión rápida' };
    if (metrics.connectionType === '3g') return { color: 'text-yellow-600', text: 'Conexión moderada' };
    return { color: 'text-red-600', text: 'Conexión lenta' };
  };

  const getPerformanceScore = () => {
    const fcpScore = metrics.firstContentfulPaint < 1500 ? 100 : 
                    metrics.firstContentfulPaint < 2500 ? 80 : 60;
    const loadScore = metrics.loadTime < 2000 ? 100 : 
                     metrics.loadTime < 4000 ? 80 : 60;
    return Math.round((fcpScore + loadScore) / 2);
  };

  const connectionStatus = getConnectionStatus();
  const performanceScore = getPerformanceScore();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            performanceScore >= 90 ? 'bg-green-500' :
            performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium">{performanceScore}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core Web Vitals */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Core Web Vitals</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">First Paint:</span>
              <span className="font-medium">{Math.round(metrics.firstPaint)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">FCP:</span>
              <span className="font-medium">{Math.round(metrics.firstContentfulPaint)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Load Time:</span>
              <span className="font-medium">{Math.round(metrics.loadTime)}ms</span>
            </div>
          </div>
        </div>

        {/* Información de Red */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Conexión de Red</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium uppercase">{metrics.connectionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className={`font-medium ${connectionStatus.color}`}>
                {connectionStatus.text}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recursos:</span>
              <span className="font-medium">{metrics.resources}</span>
            </div>
          </div>
        </div>

        {/* Optimizaciones Activas */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Optimizaciones</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Compresión:</span>
              <span className="text-green-600 font-medium">✓ Activa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Lazy Loading:</span>
              <span className="text-green-600 font-medium">✓ Activa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Save-Data:</span>
              <span className={`font-medium ${saveDataMode ? 'text-yellow-600' : 'text-gray-500'}`}>
                {saveDataMode ? '✓ Detectado' : '○ Normal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración actual */}
      {saveDataMode && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Modo de Datos Reducidos Activo</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Calidad de imagen reducida a {config.images.quality}%</p>
            <p>• Formato de imagen optimizado: {config.images.format}</p>
            <p>• JavaScript chunking: {config.javascript.chunking}</p>
            <p>• CSS crítico inlineado: {config.css.inlineCritical ? 'Sí' : 'No'}</p>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-2">Recomendaciones</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {metrics.firstContentfulPaint > 2500 && (
            <p>• Considera optimizar el CSS crítico para mejorar el First Contentful Paint</p>
          )}
          {metrics.loadTime > 4000 && (
            <p>• El tiempo de carga es alto, revisa la optimización de recursos</p>
          )}
          {metrics.resources > 100 && (
            <p>• Alto número de recursos, considera bundling adicional</p>
          )}
          {!saveDataMode && metrics.connectionType !== '4g' && (
            <p>• Considera activar optimizaciones para conexiones lentas</p>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Última actualización: {new Date(metrics.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};
