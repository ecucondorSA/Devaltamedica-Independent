'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@altamedica/ui';
import { cn } from '@altamedica/utils';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  UserPlus,
  Zap,
  X,
  ExternalLink,
  Activity
} from 'lucide-react';

export interface IntelligentAlert {
  id: string;
  type: 'saturation' | 'redistribution' | 'staff_shortage' | 'system' | 'predictive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  hospitalName: string;
  location?: string;
  timestamp: Date;
  actions: AlertAction[];
  status: 'active' | 'acknowledged' | 'resolved';
  metadata: AlertMetadata;
  autoResolve?: boolean;
  estimatedResolutionTime?: number;
}

interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: 'redistribute' | 'publish_job' | 'notify_staff' | 'escalate' | 'dismiss';
  data?: any;
}

interface AlertMetadata {
  currentCapacity?: number;
  maxCapacity?: number;
  waitTime?: number;
  specialty?: string;
  patientCount?: number;
  confidence?: number;
  suggestedActions?: number;
}

interface IntelligentAlertsProps {
  position?: 'header' | 'sidebar' | 'floating';
  maxAlerts?: number;
  autoRefresh?: boolean;
  onActionExecute?: (alertId: string, action: AlertAction) => void;
}

// Mock data de alertas inteligentes
const mockAlerts: IntelligentAlert[] = [
  {
    id: 'alert-001',
    type: 'saturation',
    priority: 'critical',
    title: 'Saturación Crítica Detectada',
    message: 'Hospital San Vicente alcanzó 95% de capacidad en urgencias. Sistema sugiere redistribución inmediata.',
    hospitalName: 'Hospital San Vicente',
    location: 'Centro, Medellín',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
    status: 'active',
    actions: [
      { id: 'act-001', label: 'Redistribuir Ahora', type: 'primary', action: 'redistribute' },
      { id: 'act-002', label: 'Publicar Urgente', type: 'secondary', action: 'publish_job' }
    ],
    metadata: {
      currentCapacity: 23,
      maxCapacity: 25,
      waitTime: 45,
      patientCount: 8,
      confidence: 92,
      suggestedActions: 2
    },
    autoResolve: true,
    estimatedResolutionTime: 15
  },
  {
    id: 'alert-002',
    type: 'staff_shortage',
    priority: 'high',
    title: 'Déficit de Cardiólogos Predicho',
    message: 'IA detecta que necesitará 3 cardiólogos adicionales en las próximas 2 horas.',
    hospitalName: 'Hospital San Vicente',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'active',
    actions: [
      { id: 'act-003', label: 'Publicar Oferta', type: 'primary', action: 'publish_job' },
      { id: 'act-004', label: 'Notificar Red', type: 'secondary', action: 'notify_staff' }
    ],
    metadata: {
      specialty: 'Cardiología',
      confidence: 88,
      suggestedActions: 1
    }
  },
  {
    id: 'alert-003',
    type: 'redistribution',
    priority: 'medium',
    title: 'Redistribución Exitosa',
    message: '8 pacientes reasignados a Hospital Las Américas. Tiempo de espera reducido en 20 minutos.',
    hospitalName: 'Hospital Las Américas',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'resolved',
    actions: [
      { id: 'act-005', label: 'Ver Detalles', type: 'secondary', action: 'dismiss' }
    ],
    metadata: {
      patientCount: 8,
      waitTime: 20,
      confidence: 95
    }
  },
  {
    id: 'alert-004',
    type: 'predictive',
    priority: 'medium',
    title: 'Pico de Demanda Predicho',
    message: 'IA predice aumento del 30% en consultas de pediatría para mañana 14:00-18:00.',
    hospitalName: 'Red Hospitalaria',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    status: 'acknowledged',
    actions: [
      { id: 'act-006', label: 'Preparar Personal', type: 'primary', action: 'notify_staff' },
      { id: 'act-007', label: 'Ver Predicción', type: 'secondary', action: 'dismiss' }
    ],
    metadata: {
      specialty: 'Pediatría',
      confidence: 87
    }
  }
];

export function IntelligentAlerts({ 
  position = 'header', 
  maxAlerts = 5,
  autoRefresh = true,
  onActionExecute
}: IntelligentAlertsProps) {
  const [alerts, setAlerts] = useState<IntelligentAlert[]>(mockAlerts);
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const criticalAlerts = activeAlerts.filter(alert => alert.priority === 'critical');

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Aquí iría la lógica real de actualización de alertas
        logger.info('Actualizando alertas...');
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string, priority: string) => {
    const iconClass = priority === 'critical' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' : 
                     'text-blue-500';

    switch (type) {
      case 'saturation': return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
      case 'staff_shortage': return <Users className={`h-4 w-4 ${iconClass}`} />;
      case 'redistribution': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'predictive': return <Zap className={`h-4 w-4 ${iconClass}`} />;
      default: return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const executeAction = async (alertId: string, action: AlertAction) => {
    setProcessing(alertId);

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Llamar callback personalizado si existe
      onActionExecute?.(alertId, action);

      // Actualizar estado de la alerta según la acción
      if (action.action === 'redistribute' || action.action === 'publish_job') {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged' }
            : alert
        ));
      }

      logger.info(`Ejecutando acción: ${action.action} para alerta: ${alertId}`);
    } catch (error) {
      logger.error('Error ejecutando acción:', error);
    } finally {
      setProcessing(null);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const formatTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}m`;
  };

  // Render para header (compacto con dropdown)
  if (position === 'header') {
    return (
      <div className="relative">
        <button
          type="button"
          className={cn(
            "relative rounded-full p-2 transition-colors",
            criticalAlerts.length > 0 
              ? "bg-red-100 text-red-700 hover:bg-red-200" 
              : activeAlerts.length > 0 
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {criticalAlerts.length > 0 ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {activeAlerts.length > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white",
              criticalAlerts.length > 0 ? "bg-red-500" : "bg-orange-500"
            )}>
              {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  Alertas Inteligentes
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {activeAlerts.length} activas
                </Badge>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {alerts.slice(0, maxAlerts).map((alert) => (
                <div key={alert.id} className={cn(
                  "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  alert.status === 'active' ? 'bg-white' : 'bg-gray-50 opacity-75'
                )}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type, alert.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn("text-xs", getPriorityColor(alert.priority))}>
                            {alert.priority}
                          </Badge>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="mr-3">{alert.hospitalName}</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatTimeAgo(alert.timestamp)}</span>
                      </div>

                      {alert.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                          {alert.metadata.currentCapacity && (
                            <span>📊 {alert.metadata.currentCapacity}/{alert.metadata.maxCapacity}</span>
                          )}
                          {alert.metadata.waitTime && (
                            <span>⏱️ {alert.metadata.waitTime} min</span>
                          )}
                          {alert.metadata.confidence && (
                            <span>🎯 {alert.metadata.confidence}% confianza</span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {alert.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant={action.type === 'primary' ? 'default' : 'outline'}
                            className="text-xs h-7"
                            onClick={() => executeAction(alert.id, action)}
                            disabled={processing === alert.id}
                          >
                            {processing === alert.id ? (
                              <Activity className="h-3 w-3 mr-1 animate-spin" />
                            ) : action.type === 'primary' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <ExternalLink className="h-3 w-3 mr-1" />
                            )}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {alerts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No hay alertas activas</p>
                <p className="text-xs mt-1">El sistema está funcionando correctamente</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render para otros positions (sidebar, floating) sería similar pero adaptado
  return null;
}