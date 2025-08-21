'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { MedicalAlert } from '../../../types/medical-types';

import { logger } from '@altamedica/shared/services/logger.service';
interface MedicalAlertsProps {
  patientId: string;
  onEmergencyTrigger?: () => void;
  onAlertClick?: (alert: MedicalAlert) => void;
  maxVisible?: number;
}

const MedicalAlerts: React.FC<MedicalAlertsProps> = ({
  patientId,
  onEmergencyTrigger,
  onAlertClick,
  maxVisible = 5
}) => {
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'unread'>('unread');

  // Cargar alertas
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        // Simulación de carga - en producción vendría de la API
        const mockAlerts: MedicalAlert[] = [
          {
            id: '1',
            patientId,
            type: 'vital_sign',
            severity: 'critical',
            title: 'Presión arterial elevada crítica',
            message: 'La presión arterial ha alcanzado niveles críticos: 180/120 mmHg. Se requiere atención inmediata.',
            timestamp: new Date(Date.now() - 30 * 60000), // Hace 30 minutos
            acknowledged: false,
            actionRequired: true,
            relatedEntityId: 'vs-001'
          },
          {
            id: '2',
            patientId,
            type: 'medication',
            severity: 'warning',
            title: 'Medicamento próximo a agotarse',
            message: 'Metformina 850mg - Quedan 3 dosis. Es necesario solicitar resurtido.',
            timestamp: new Date(Date.now() - 2 * 3600000), // Hace 2 horas
            acknowledged: false,
            actionRequired: true,
            relatedEntityId: 'med-002'
          },
          {
            id: '3',
            patientId,
            type: 'lab_result',
            severity: 'critical',
            title: 'Resultado de laboratorio crítico',
            message: 'Glucosa en ayunas: 320 mg/dL (crítico). Requiere evaluación médica urgente.',
            timestamp: new Date(Date.now() - 4 * 3600000), // Hace 4 horas
            acknowledged: true,
            acknowledgedBy: 'Dr. Martínez',
            acknowledgedAt: new Date(Date.now() - 3 * 3600000),
            actionRequired: false,
            relatedEntityId: 'lab-003'
          },
          {
            id: '4',
            patientId,
            type: 'appointment',
            severity: 'info',
            title: 'Recordatorio de cita',
            message: 'Cita con Dr. García mañana a las 10:00 AM. Recuerde ayuno de 8 horas.',
            timestamp: new Date(Date.now() - 6 * 3600000), // Hace 6 horas
            acknowledged: false,
            actionRequired: false,
            relatedEntityId: 'apt-004'
          },
          {
            id: '5',
            patientId,
            type: 'general',
            severity: 'warning',
            title: 'Actualización del plan de tratamiento',
            message: 'Su médico ha actualizado su plan de tratamiento. Por favor revise los cambios.',
            timestamp: new Date(Date.now() - 24 * 3600000), // Hace 24 horas
            acknowledged: false,
            actionRequired: true,
            relatedEntityId: null
          }
        ];

        setAlerts(mockAlerts);
      } catch (error) {
        logger.error('Error cargando alertas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, [patientId]);

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'unread') return !alert.acknowledged;
    return true;
  });

  // Contar alertas por tipo
  const alertCounts = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    unread: alerts.filter(a => !a.acknowledged).length
  };

  // Verificar si hay alertas críticas no reconocidas
  const hasCriticalUnacknowledged = alerts.some(
    a => a.severity === 'critical' && !a.acknowledged
  );

  // Marcar alerta como reconocida
  const acknowledgeAlert = async (alertId: string) => {
    try {
      // En producción, esto actualizaría en el servidor
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              acknowledged: true, 
              acknowledgedBy: 'Usuario actual',
              acknowledgedAt: new Date()
            }
          : alert
      ));
    } catch (error) {
      logger.error('Error al reconocer alerta:', error);
    }
  };

  // Obtener icono según tipo de alerta
  const getAlertIcon = (type: string) => {
    const icons = {
      vital_sign: '❤️',
      medication: '💊',
      appointment: '📅',
      lab_result: '🔬',
      general: '📢'
    };
    return icons[type] || '⚠️';
  };

  // Obtener estilo según severidad
  const getSeverityStyle = (severity: string) => {
    const styles = {
      critical: {
        container: 'bg-red-50 border-red-300',
        icon: 'text-red-600',
        title: 'text-red-900',
        badge: 'bg-red-100 text-red-800'
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-300',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        badge: 'bg-yellow-100 text-yellow-800'
      },
      info: {
        container: 'bg-blue-50 border-blue-300',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800'
      }
    };
    return styles[severity] || styles.info;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header con resumen */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Alertas Médicas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {alertCounts.unread > 0 && (
                <span className="text-orange-600 font-medium">
                  {alertCounts.unread} sin leer • 
                </span>
              )}
              {alertCounts.critical > 0 && (
                <span className="text-red-600 font-medium">
                  {alertCounts.critical} crítica{alertCounts.critical > 1 ? 's' : ''} • 
                </span>
              )}
              {alertCounts.total} total
            </p>
          </div>

          {hasCriticalUnacknowledged && onEmergencyTrigger && (
            <button
              onClick={onEmergencyTrigger}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors animate-pulse"
            >
              <span className="mr-2">🚨</span>
              Activar Emergencia
            </button>
          )}
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {(['all', 'critical', 'unread'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {filterType === 'all' ? 'Todas' :
               filterType === 'critical' ? 'Críticas' :
               'Sin leer'}
              {filterType !== 'all' && (
                <span className="ml-1">
                  ({filterType === 'critical' ? alertCounts.critical : alertCounts.unread})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">✅</span>
            <p className="text-gray-500">
              {filter === 'all' ? 'No hay alertas activas' :
               filter === 'critical' ? 'No hay alertas críticas' :
               'Todas las alertas han sido leídas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts
              .slice(0, showAll ? undefined : maxVisible)
              .map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                  onClick={() => onAlertClick?.(alert)}
                />
              ))}
            
            {!showAll && filteredAlerts.length > maxVisible && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Mostrar {filteredAlerts.length - maxVisible} alertas más
              </button>
            )}
            
            {showAll && filteredAlerts.length > maxVisible && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-2 text-center text-gray-600 hover:text-gray-700 font-medium text-sm"
              >
                Mostrar menos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resumen estadístico */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{alertCounts.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{alertCounts.critical}</p>
            <p className="text-xs text-gray-600">Críticas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{alertCounts.unread}</p>
            <p className="text-xs text-gray-600">Sin leer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta de alerta individual
const AlertCard: React.FC<{
  alert: MedicalAlert;
  onAcknowledge: () => void;
  onClick?: () => void;
}> = ({ alert, onAcknowledge, onClick }) => {
  const severityStyle = {
    critical: {
      container: 'bg-red-50 border-red-300',
      icon: 'text-red-600',
      title: 'text-red-900',
      badge: 'bg-red-100 text-red-800',
      button: 'bg-red-600 text-white hover:bg-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-300',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
      button: 'bg-yellow-600 text-white hover:bg-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-300',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 text-white hover:bg-blue-700'
    }
  }[alert.severity];

  const alertIcon = {
    vital_sign: '❤️',
    medication: '💊',
    appointment: '📅',
    lab_result: '🔬',
    general: '📢'
  }[alert.type] || '⚠️';

  // Calcular tiempo transcurrido
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Justo ahora';
  };

  return (
    <div 
      className={`
        p-4 rounded-lg border-2 transition-all cursor-pointer
        ${severityStyle.container}
        ${!alert.acknowledged ? 'shadow-sm' : 'opacity-75'}
        ${alert.severity === 'critical' && !alert.acknowledged ? 'animate-pulse' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className={`text-2xl ${severityStyle.icon}`}>{alertIcon}</span>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className={`font-semibold ${severityStyle.title}`}>
                {alert.title}
              </h4>
              {!alert.acknowledged && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    alert.severity === 'critical' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></span>
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
            
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{getTimeAgo(alert.timestamp)}</span>
              {alert.acknowledged && alert.acknowledgedBy && (
                <>
                  <span>•</span>
                  <span>Reconocido por {alert.acknowledgedBy}</span>
                </>
              )}
              {alert.actionRequired && !alert.acknowledged && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">Acción requerida</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!alert.acknowledged && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAcknowledge();
            }}
            className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${severityStyle.button}`}
          >
            Reconocer
          </button>
        )}
      </div>
    </div>
  );
};

export default MedicalAlerts; 