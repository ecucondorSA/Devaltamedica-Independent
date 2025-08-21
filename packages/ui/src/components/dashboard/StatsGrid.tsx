import * as React from 'react';
import { MetricCard, MetricCardProps } from './MetricCard';
import { cn } from '../../utils/cn';

export interface StatsGridProps {
  stats: MetricCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ 
  stats, 
  columns = 4, 
  className 
}: StatsGridProps) {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  return (
    <div className={cn(`grid gap-4 ${gridClass}`, className)}>
      {stats.map((stat, index) => (
        <MetricCard key={index} {...stat} />
      ))}
    </div>
  );
}