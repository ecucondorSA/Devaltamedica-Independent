/**
 * Componente de Estadísticas del Dashboard
 * KPIs médicos en tiempo real con alertas visuales
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';
import { DashboardStats } from '@/hooks/useDashboard';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  subtitle?: string;
  isLoading?: boolean;
  critical?: boolean;
}

interface DashboardStatsProps {
  stats: DashboardStats;
  isLoading: boolean;
  compactMode?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color,
  subtitle,
  isLoading = false,
  critical = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg
      ${critical ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
      ${critical ? 'animate-pulse' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={`text-sm font-medium ${critical ? 'text-red-800' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${critical ? 'text-red-900' : 'text-gray-900'}`}>
            {typeof value === 'number' && value > 999 
              ? `${(value / 1000).toFixed(1)}k` 
              : value
            }
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center text-sm ${changeColorClasses[changeType]}`}>
              <span className="mr-1">
                {changeType === 'increase' && '↗'}
                {changeType === 'decrease' && '↘'}
                {changeType === 'neutral' && '→'}
              </span>
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        
        <div className={`
          h-12 w-12 rounded-full flex items-center justify-center
          ${critical ? 'bg-red-100' : colorClasses[color]}
          ${critical ? 'animate-bounce' : ''}
        `}>
          <div className={`h-6 w-6 ${critical ? 'text-red-600' : iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
      
      {critical && (
        <div className="mt-4 flex items-center text-red-700 text-sm">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Requiere atención inmediata
        </div>
      )}
    </div>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading, 
  compactMode = false 
}) => {
  // Iconos SVG para las estadísticas
  const UsersIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CalendarIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const ClockIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ExclamationIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );

  const TrendingUpIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const HeartIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const DollarIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const ChartIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const gridCols = compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Datos en tiempo real</span>
        </div>
      </div>

      {/* Grid principal de estadísticas */}
      <div className={`grid ${gridCols} gap-6`}>
        {/* Total de Pacientes */}
        <StatsCard
          title="Total Pacientes"
          value={stats.totalPatients}
          change={5.2}
          changeType="increase"
          icon={UsersIcon}
          color="blue"
          subtitle="Pacientes activos"
          isLoading={isLoading}
        />

        {/* Citas de Hoy */}
        <StatsCard
          title="Citas Hoy"
          value={stats.todayAppointments}
          change={-2.1}
          changeType="decrease"
          icon={CalendarIcon}
          color="green"
          subtitle={`${stats.pendingAppointments} pendientes`}
          isLoading={isLoading}
        />

        {/* Alertas Críticas */}
        <StatsCard
          title="Alertas Críticas"
          value={stats.criticalAlerts}
          icon={ExclamationIcon}
          color="red"
          subtitle="Requieren atención"
          isLoading={isLoading}
          critical={stats.criticalAlerts > 0}
        />

        {/* Tiempo de Espera */}
        <StatsCard
          title="Tiempo Espera"
          value={`${stats.averageWaitTime}min`}
          change={1.5}
          changeType="decrease"
          icon={ClockIcon}
          color="yellow"
          subtitle="Promedio hoy"
          isLoading={isLoading}
        />
      </div>

      {/* Grid secundario - métricas adicionales */}
      {!compactMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Consultas del Mes */}
          <StatsCard
            title="Consultas/Mes"
            value={stats.monthlyConsultations}
            change={8.7}
            changeType="increase"
            icon={TrendingUpIcon}
            color="indigo"
            subtitle="Este mes"
            isLoading={isLoading}
          />

          {/* Satisfacción del Paciente */}
          <StatsCard
            title="Satisfacción"
            value={`${stats.patientSatisfactionRate.toFixed(1)}/5`}
            change={0.3}
            changeType="increase"
            icon={HeartIcon}
            color="purple"
            subtitle="Calificación promedio"
            isLoading={isLoading}
          />

          {/* Ingresos del Mes */}
          <StatsCard
            title="Ingresos/Mes"
            value={`$${(stats.revenueThisMonth / 1000).toFixed(0)}k`}
            change={12.4}
            changeType="increase"
            icon={DollarIcon}
            color="green"
            subtitle="Este mes"
            isLoading={isLoading}
          />

          {/* Eficiencia Operativa */}
          <StatsCard
            title="Eficiencia"
            value="94%"
            change={2.1}
            changeType="increase"
            icon={ChartIcon}
            color="blue"
            subtitle="Índice operativo"
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Alertas importantes */}
      {stats.criticalAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-red-400">
                {ExclamationIcon}
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Atención: {stats.criticalAlerts} alerta{stats.criticalAlerts > 1 ? 's' : ''} crítica{stats.criticalAlerts > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Hay pacientes que requieren atención inmediata. Revise la sección de alertas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
