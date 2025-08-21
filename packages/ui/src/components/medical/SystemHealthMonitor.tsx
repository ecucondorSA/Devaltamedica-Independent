// 🖥️ SISTEMA DE MONITOREO DE SALUD - ALTAMEDICA
// Monitor de salud del sistema para administradores

'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { CardCorporate, CardContentCorporate } from '../corporate/CardCorporate';
import { StatusBadge } from './StatusBadge';

// 🔧 TIPOS
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  uptime: number;
  responseTime: number;
  lastCheck?: Date;
  errorCount?: number;
}

export interface SystemHealthMonitorProps {
  services: ServiceHealth[];
  onServiceClick?: (service: ServiceHealth) => void;
  refreshInterval?: number;
  className?: string;
}

// 🎨 CONFIGURACIÓN DE ESTADO
const SERVICE_STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Saludable'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Advertencia'
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Crítico'
  },
  down: {
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Inactivo'
  }
};

// 🖥️ COMPONENTE PRINCIPAL
export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  services,
  onServiceClick,
  refreshInterval = 30000,
  className = ''
}) => {
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  // 🔄 AUTO-REFRESH
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // 📊 CALCULAR ESTADÍSTICAS GENERALES
  const stats = React.useMemo(() => {
    const total = services.length;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const warning = services.filter(s => s.status === 'warning').length;
    const critical = services.filter(s => s.status === 'critical').length;
    const down = services.filter(s => s.status === 'down').length;
    
    const avgUptime = services.reduce((acc, s) => acc + s.uptime, 0) / total;
    const avgResponseTime = services.reduce((acc, s) => acc + s.responseTime, 0) / total;

    return {
      total,
      healthy,
      warning,
      critical,
      down,
      healthyPercentage: (healthy / total) * 100,
      avgUptime,
      avgResponseTime
    };
  }, [services]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Resumen General */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
          <div className="text-xs text-green-700">Saludables</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
          <div className="text-xs text-yellow-700">Advertencias</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-xs text-red-700">Críticos</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.avgUptime.toFixed(1)}%</div>
          <div className="text-xs text-blue-700">Uptime Promedio</div>
        </div>
      </div>

      {/* Lista de Servicios */}
      <div className="space-y-3">
        {services.map((service, index) => {
          const config = SERVICE_STATUS_CONFIG[service.status];
          const Icon = config.icon;

          return (
            <div
              key={`${service.name}-${index}`}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${config.bgColor} ${config.borderColor}
                hover:shadow-md hover:scale-[1.02]
              `}
              onClick={() => onServiceClick?.(service)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {service.uptime.toFixed(2)}% uptime
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.responseTime}ms
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <StatusBadge 
                    status={
                      service.status === 'healthy' ? 'active' :
                      service.status === 'warning' ? 'warning' :
                      service.status === 'critical' ? 'critical' : 'inactive'
                    }
                    text={config.label}
                    size="sm"
                  />
                  {service.errorCount && service.errorCount > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {service.errorCount} errores
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Uptime */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Disponibilidad</span>
                  <span className="text-xs font-medium text-gray-700">{service.uptime.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      service.uptime >= 99.5 ? 'bg-green-500' :
                      service.uptime >= 95 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${service.uptime}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con información de actualización */}
      <div className="text-center py-3 text-xs text-gray-500 border-t">
        Última actualización: {lastUpdate.toLocaleTimeString('es-AR')} | 
        Próxima actualización en {Math.ceil(refreshInterval / 1000)}s
      </div>
    </div>
  );
};

export default SystemHealthMonitor;