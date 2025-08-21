'use client';

import React from 'react';
import { mockMetrics } from '@/data/mockMetrics';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

function MetricCard({ title, value, subtitle, icon, borderColor, bgColor, textColor, trend }: MetricCardProps) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${borderColor} hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <span>{trend.positive ? '↗️' : '↘️'}</span> {trend.value}
            </p>
          )}
        </div>
        <div className={`h-12 w-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsGrid() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      {/* Métricas Principales - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pacientes Activos"
          value={mockMetrics.activePatients.toLocaleString()}
          subtitle={`de ${mockMetrics.totalPatients.toLocaleString()} total`}
          icon="👥"
          borderColor="border-sky-200"
          bgColor="bg-sky-100"
          textColor="text-sky-700"
        />
        
        <MetricCard
          title="Médicos Activos"
          value={mockMetrics.activeDoctors}
          subtitle={`de ${mockMetrics.totalDoctors} total`}
          icon="👨‍⚕️"
          borderColor="border-blue-200"
          bgColor="bg-blue-100"
          textColor="text-blue-700"
        />
        
        <MetricCard
          title="Ingresos Mensuales"
          value={formatCurrency(mockMetrics.monthlyRevenue)}
          icon="💵"
          borderColor="border-green-200"
          bgColor="bg-green-100"
          textColor="text-green-700"
          trend={{ value: "+12% vs mes anterior", positive: true }}
        />
        
        <MetricCard
          title="Citas del Mes"
          value={mockMetrics.totalAppointments}
          subtitle={`${mockMetrics.completedAppointments} completadas`}
          icon="📅"
          borderColor="border-purple-200"
          bgColor="bg-purple-100"
          textColor="text-purple-700"
        />
      </div>

      {/* Métricas de Rendimiento - Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Satisfacción del Paciente</h3>
            <span className="text-red-500">❤️</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{mockMetrics.patientSatisfaction}</span>
            <span className="text-sm text-gray-500 mb-1">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-full rounded ${
                  i < Math.floor(mockMetrics.patientSatisfaction) ? 'bg-yellow-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Tiempo de Espera</h3>
            <span className="text-blue-500">⏰</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{mockMetrics.averageWaitTime}</span>
            <span className="text-sm text-gray-500 mb-1">minutos</span>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            mockMetrics.averageWaitTime < 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {mockMetrics.averageWaitTime < 30 ? 'Óptimo' : 'Mejorable'}
          </span>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Ocupación de Camas</h3>
            <span className="text-purple-500">🛏️</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{mockMetrics.bedOccupancyRate}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${mockMetrics.bedOccupancyRate}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}