// 🏥 COMPONENTE DASHBOARD: HealthMetricsCard
// PROACTIVO: <100 líneas, granular, tipado

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface HealthMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color: 'red' | 'green' | 'blue' | 'purple' | 'yellow' | 'gray';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    isGood: boolean;
  };
}

interface HealthMetricsCardProps {
  metric: HealthMetric;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const HealthMetricsCard: React.FC<HealthMetricsCardProps> = ({
  metric,
  size = 'md',
  onClick,
  className = ""
}) => {
  const { label, value, unit, icon: Icon, color, trend } = metric;

  const colorClasses = {
    red: 'text-red-500',
    green: 'text-green-500', 
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    yellow: 'text-yellow-500',
    gray: 'text-gray-500'
  };

  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', padding: 'p-4' },
    md: { icon: 'w-8 h-8', text: 'text-2xl', padding: 'p-6' },
    lg: { icon: 'w-10 h-10', text: 'text-3xl', padding: 'p-8' }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    const trendColor = trend.isGood ? 'text-green-500' : 'text-red-500';
    const arrow = trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→';
    
    return (
      <span className={`text-xs font-medium ${trendColor}`}>
        {arrow} {trend.percentage}%
      </span>
    );
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer
        ${sizeClasses[size].padding} ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center">
        <Icon className={`${sizeClasses[size].icon} ${colorClasses[color]}`} />
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`${sizeClasses[size].text} font-semibold text-gray-900`}>
              {value}
              {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </p>
            {getTrendIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMetricsCard;
