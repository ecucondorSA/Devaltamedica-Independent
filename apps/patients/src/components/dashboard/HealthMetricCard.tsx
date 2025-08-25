/**
 * HealthMetricCard.tsx - Componente para mostrar una métrica de salud
 * Proyecto: Altamedica Pacientes
 */

import React from 'react';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  link: string;
  className?: string;
}

export default function HealthMetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  link,
  className = '',
}: HealthMetricCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border p-4 hover:border-sky-400 hover:shadow-md transition-all duration-200 h-full ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-sky-100 rounded-lg">
          <Icon className="w-5 h-5 text-sky-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
      </div>
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">Funcionalidad temporalmente deshabilitada</p>
      </div>
    </div>
  );
}
