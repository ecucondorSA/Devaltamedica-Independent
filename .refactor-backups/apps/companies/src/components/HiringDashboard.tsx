"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
// Note: Using emojis instead of lucide-react icons to avoid Turbopack issues
import { Card, CardContent, CardHeader, CardTitle, Button } from '@altamedica/ui';

import { logger } from '@altamedica/shared/services/logger.service';
interface HiringMetrics {
  companyId: string;
  period: string;
  activeJobOffers: number;
  totalApplications: number;
  newApplications: number;
  applicationsInReview: number;
  applicationsInInterview: number;
  totalHires: number;
  averageTimeToHire: number;
  averageApplicationsPerJob: number;
  conversionRate: number;
  averageApplicantRating: number;
  applicationsGrowth: number;
  hiresGrowth: number;
  topSpecialties: Array<{
    specialty: string;
    applications: number;
    hires: number;
  }>;
  applicationsTimeline: Array<{
    date: string;
    applications: number;
    hires: number;
  }>;
  specialtyDistribution: Array<{
    specialty: string;
    percentage: number;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function HiringDashboard() {
  const [period, setPeriod] = useState<string>('last_30_days');
  const [isExporting, setIsExporting] = useState(false);

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['hiring-dashboard', period],
    queryFn: async (): Promise<HiringMetrics> => {
      const response = await fetch(`/api/hiring-dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar métricas');
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/hiring-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ format, period }),
      });

      const result = await response.json();
      if (result.success) {
        // Simular descarga
        window.open(result.data.downloadUrl, '_blank');
      }
    } catch (error) {
      logger.error('Error exporting report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="text-5xl text-red-500 block mb-4">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar dashboard</h3>
          <p className="text-gray-600">No se pudieron cargar las métricas de contratación</p>
        </div>
      </div>
    );
  }

  const periodLabels = {
    'last_7_days': 'Últimos 7 días',
    'last_30_days': 'Últimos 30 días',
    'last_90_days': 'Últimos 90 días',
    'last_year': 'Último año'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Contratación</h1>
          <p className="text-gray-600 mt-1">Métricas y análisis de reclutamiento</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportReport('pdf')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            📥
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ofertas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeJobOffers}</p>
              </div>
              <span className="text-4xl">💼</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aplicaciones Totales</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalApplications}</p>
                <div className="flex items-center mt-1">
                  {metrics.applicationsGrowth >= 0 ? (
                    <span className="text-green-600 mr-1">📈</span>
                  ) : (
                    <span className="text-red-600 mr-1">📉</span>
                  )}
                  <span className={`text-sm ${metrics.applicationsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(metrics.applicationsGrowth)}%
                  </span>
                </div>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contrataciones</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalHires}</p>
                <div className="flex items-center mt-1">
                  {metrics.hiresGrowth >= 0 ? (
                    <span className="text-green-600 mr-1">📈</span>
                  ) : (
                    <span className="text-red-600 mr-1">📉</span>
                  )}
                  <span className={`text-sm ${metrics.hiresGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(metrics.hiresGrowth)}%
                  </span>
                </div>
              </div>
              <span className="text-4xl">✅</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageTimeToHire}d</p>
                <p className="text-sm text-gray-500 mt-1">Para contratar</p>
              </div>
              <span className="text-4xl">⏰</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline de Aplicaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            Pipeline de Aplicaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">📄</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.newApplications}</p>
              <p className="text-sm text-gray-600">Nuevas</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">👁️</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.applicationsInReview}</p>
              <p className="text-sm text-gray-600">En Revisión</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.applicationsInInterview}</p>
              <p className="text-sm text-gray-600">Entrevistas</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalHires}</p>
              <p className="text-sm text-gray-600">Contratados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Aplicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.applicationsTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#8884d8" 
                  name="Aplicaciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="hires" 
                  stroke="#82ca9d" 
                  name="Contrataciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Specialty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Especialidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.specialtyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.specialtyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Specialties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Especialidades con Más Demanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Especialidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Aplicaciones</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Contrataciones</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tasa Conversión</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topSpecialties.map((specialty, index) => (
                  <tr key={specialty.specialty} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        {specialty.specialty}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{specialty.applications}</td>
                    <td className="py-3 px-4 font-medium text-green-600">{specialty.hires}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {((specialty.hires / specialty.applications) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}