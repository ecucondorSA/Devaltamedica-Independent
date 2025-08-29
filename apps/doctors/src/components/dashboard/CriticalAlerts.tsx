/**
 * Componente de Alertas Críticas
 * Sistema de notificaciones médicas urgentes con priorización
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { CriticalAlert } from '@/hooks/useDashboard';

import { logger } from '@altamedica/shared';
interface CriticalAlertsProps {
  alerts: CriticalAlert[];
  isLoading: boolean;
  onAcknowledge: (alertId: string) => Promise<void>;
  onViewPatient?: (patientId: string) => void;
  maxVisible?: number;
  showAll?: boolean;
}

interface AlertCardProps {
  alert: CriticalAlert;
  onAcknowledge: (alertId: string) => Promise<void>;
  onViewPatient?: (patientId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onViewPatient
}) => {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  // Actualizar tiempo transcurrido
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const alertTime = new Date(alert.timestamp);
      const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) {
        setTimeAgo('Hace menos de 1 minuto');
      } else if (diffMinutes < 60) {
        setTimeAgo(`Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`);
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        setTimeAgo(`Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [alert.timestamp]);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await onAcknowledge(alert.id);
    } catch (error) {
      logger.error('Error reconociendo alerta:', String(error));
    } finally {
      setIsAcknowledging(false);
    }
  };

  const alertTypeConfig = {
    EMERGENCY: {
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Emergencia',
      bgColor: 'bg-red-600',
      textColor: 'text-red-600',
      borderColor: 'border-red-300'
    },
    CRITICAL_VALUES: {
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Valores Críticos',
      bgColor: 'bg-orange-600',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-300'
    },
    MEDICATION_ALERT: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Medicación',
      bgColor: 'bg-purple-600',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-300'
    },
    SYSTEM: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Sistema',
      bgColor: 'bg-gray-600',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-300'
    },
    APPOINTMENT: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Cita',
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-300'
    }
  };

  const config = alertTypeConfig[alert.type];
  const priorityClasses = alert.priority === 'CRITICAL' 
    ? 'animate-pulse border-2' 
    : 'border';

  return (
    <div className={`
      bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200
      ${priorityClasses} ${config.borderColor}
      ${alert.acknowledged ? 'opacity-60' : ''}
      p-4
    `}>
      {/* Header de la alerta */}
      <div className="flex items-start space-x-3">
        {/* Icono */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${config.bgColor} text-white
          ${alert.priority === 'CRITICAL' && !alert.acknowledged ? 'animate-bounce' : ''}
        `}>
          {config.icon}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Tipo y prioridad */}
              <div className="flex items-center space-x-2 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.textColor} bg-opacity-10`}>
                  {config.label}
                </span>
                {alert.priority === 'CRITICAL' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Crítico
                  </span>
                )}
                {alert.actionRequired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Acción Requerida
                  </span>
                )}
              </div>

              {/* Paciente */}
              {alert.patientName && (
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Paciente: {alert.patientName}
                </p>
              )}

              {/* Mensaje */}
              <p className="text-sm text-gray-700 mb-2">
                {alert.message}
              </p>

              {/* Timestamp */}
              <p className="text-xs text-gray-500">
                {timeAgo}
              </p>
            </div>

            {/* Estado de reconocimiento */}
            {alert.acknowledged && (
              <div className="flex-shrink-0 ml-2">
                <div className="flex items-center text-green-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      {!alert.acknowledged && (
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            {/* Botón Ver Paciente */}
            {alert.patientId && onViewPatient && (
              <button
                onClick={() => onViewPatient(alert.patientId!)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver Paciente
              </button>
            )}
          </div>

          {/* Botón Reconocer */}
          <button
            onClick={handleAcknowledge}
            disabled={isAcknowledging}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAcknowledging ? (
              <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Reconocer
          </button>
        </div>
      )}
    </div>
  );
};

const CriticalAlerts: React.FC<CriticalAlertsProps> = ({
  alerts,
  isLoading,
  onAcknowledge,
  onViewPatient,
  maxVisible = 5,
  showAll = false
}) => {
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');
  const [showAllAlerts, setShowAllAlerts] = useState(showAll);

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged') {
      return !alert.acknowledged;
    }
    if (filter === 'critical') {
      return alert.priority === 'CRITICAL';
    }
    return true;
  });

  // Ordenar por prioridad y timestamp
  const sortedAlerts = filteredAlerts.sort((a, b) => {
    // Primero por prioridad (CRITICAL primero)
    if (a.priority !== b.priority) {
      return a.priority === 'CRITICAL' ? -1 : 1;
    }
    // Luego por timestamp (más reciente primero)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Limitar cantidad visible
  const visibleAlerts = showAllAlerts ? sortedAlerts : sortedAlerts.slice(0, maxVisible);

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Alertas Críticas</h2>
          {unacknowledgedCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
              {unacknowledgedCount} sin revisar
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'unacknowledged' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sin revisar ({unacknowledgedCount})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'critical' 
                ? 'bg-red-100 text-red-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Críticas ({criticalCount})
          </button>
        </div>
      </div>

      {/* Lista de alertas */}
      {visibleAlerts.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'No hay alertas en el sistema.'
              : filter === 'unacknowledged'
              ? 'Todas las alertas han sido revisadas.'
              : 'No hay alertas críticas.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onViewPatient={onViewPatient}
            />
          ))}
        </div>
      )}

      {/* Mostrar más/menos */}
      {sortedAlerts.length > maxVisible && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAllAlerts(!showAllAlerts)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllAlerts 
              ? `Mostrar menos`
              : `Ver todas las alertas (${sortedAlerts.length - maxVisible} más)`
            }
          </button>
        </div>
      )}

      {/* Resumen en la parte inferior */}
      {alerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Total de alertas: {alerts.length}
            </span>
            <span>
              {criticalCount > 0 && (
                <span className="text-red-600 font-medium">
                  {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalAlerts;
