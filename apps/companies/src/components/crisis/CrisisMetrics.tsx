'use client';

import React from 'react';
import {
  Bed,
  Clock,
  Users,
  Ambulance,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
  status: 'critical' | 'warning' | 'normal' | 'good';
  icon: React.ReactNode;
}

export function CrisisMetrics() {
  const metrics: Metric[] = [
    {
      id: 'saturation',
      label: 'Saturación Promedio',
      value: '85%',
      trend: 'up',
      change: '+12%',
      status: 'critical',
      icon: <Bed className="w-4 h-4" />
    },
    {
      id: 'wait-time',
      label: 'Tiempo Espera',
      value: '2.5h',
      trend: 'up',
      change: '+45min',
      status: 'critical',
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 'active-transfers',
      label: 'Transferencias Activas',
      value: '12',
      trend: 'up',
      change: '+5',
      status: 'warning',
      icon: <Ambulance className="w-4 h-4" />
    },
    {
      id: 'staff-ratio',
      label: 'Ratio Personal/Paciente',
      value: '1:8',
      trend: 'down',
      change: '-2',
      status: 'warning',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'critical-patients',
      label: 'Pacientes Críticos',
      value: '47',
      trend: 'up',
      change: '+8',
      status: 'critical',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      id: 'network-health',
      label: 'Salud de Red',
      value: '65%',
      trend: 'down',
      change: '-15%',
      status: 'warning',
      icon: <Activity className="w-4 h-4" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-vscode-crisis-critical';
      case 'warning': return 'text-vscode-crisis-warning';
      case 'normal': return 'text-vscode-crisis-info';
      case 'good': return 'text-vscode-crisis-success';
      default: return 'text-vscode-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-vscode-crisis-critical/20 border-vscode-crisis-critical/50';
      case 'warning': return 'bg-vscode-crisis-warning/20 border-vscode-crisis-warning/50';
      case 'normal': return 'bg-vscode-crisis-info/20 border-vscode-crisis-info/50';
      case 'good': return 'bg-vscode-crisis-success/20 border-vscode-crisis-success/50';
      default: return 'bg-vscode-input border-vscode-border';
    }
  };

  const getTrendIcon = (trend: string, status: string) => {
    const colorClass = getStatusColor(status);
    if (trend === 'up') {
      return <TrendingUp className={`w-3 h-3 ${colorClass}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`w-3 h-3 ${colorClass}`} />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={`rounded p-3 border transition-all ${getStatusBg(metric.status)}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-2 ${getStatusColor(metric.status)}`}>
              {metric.icon}
              <span className="text-xs font-medium text-vscode-foreground">
                {metric.label}
              </span>
            </div>
            {getTrendIcon(metric.trend, metric.status)}
          </div>

          {/* Value */}
          <div className="flex items-end justify-between">
            <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
              {metric.value}
            </div>
            <div className={`text-xs font-medium ${getStatusColor(metric.status)}`}>
              {metric.change}
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-2">
            <div className="w-full bg-vscode-input rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  metric.status === 'critical' 
                    ? 'bg-vscode-crisis-critical' 
                    : metric.status === 'warning' 
                    ? 'bg-vscode-crisis-warning' 
                    : metric.status === 'normal'
                    ? 'bg-vscode-crisis-info'
                    : 'bg-vscode-crisis-success'
                }`}
                style={{ 
                  width: metric.status === 'critical' ? '95%' : 
                         metric.status === 'warning' ? '75%' : 
                         metric.status === 'normal' ? '50%' : '25%'
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Summary Card */}
      <div className="md:col-span-2 bg-vscode-crisis-critical/20 border border-vscode-crisis-critical/50 rounded p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-vscode-crisis-critical" />
          <span className="text-sm font-semibold text-white">Estado de Crisis Activo</span>
        </div>
        
        <div className="text-xs text-vscode-foreground mb-2">
          La red hospitalaria está operando en <span className="text-vscode-crisis-critical font-bold">modo crisis</span> debido a alta saturación y déficit de personal.
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-vscode-crisis-critical hover:bg-vscode-crisis-critical/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
            Protocolo Emergencia
          </button>
          <button className="flex-1 bg-vscode-button hover:bg-vscode-button-hover text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
            Redistribuir Ahora
          </button>
        </div>
      </div>
    </div>
  );
}