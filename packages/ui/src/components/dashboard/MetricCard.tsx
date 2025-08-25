import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { cn } from '../../utils/cn';

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    direction?: 'up' | 'down' | 'neutral';
    label?: string;
  };
  status?: 'normal' | 'success' | 'warning' | 'critical';
  realTimeUpdate?: boolean;
  medicalContext?: {
    isEmergency?: boolean;
    hipaaCompliant?: boolean;
    lastUpdated?: Date;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  subtitle,
  icon,
  trend,
  status,
  realTimeUpdate,
  medicalContext,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              {trend.label || 'from last month'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
