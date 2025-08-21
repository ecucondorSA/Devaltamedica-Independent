'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MarketplaceMetrics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  hiredCandidates: number;
  averageTimeToHire: number;
  topSpecialties: Array<{
    specialty: string;
    jobsCount: number;
    averageSalary: number;
  }>;
  monthlyStats: Array<{
    month: string;
    jobsPosted: number;
    applications: number;
    hires: number;
  }>;
  salaryRanges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  competitorAnalysis: Array<{
    competitor: string;
    marketShare: number;
    averageResponseTime: number;
    averageRating: number;
  }>;
}

export default function MarketplaceAnalytics() {
  const [metrics, setMetrics] = useState<MarketplaceMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockMetrics: MarketplaceMetrics = {
        totalJobs: 127,
        activeJobs: 34,
        totalApplications: 1,
        hiredCandidates: 23,
        averageTimeToHire: 18,
        topSpecialties: [
          { specialty: 'Cardiología', jobsCount: 28, averageSalary: 12000 },
          { specialty: 'Pediatría', jobsCount: 22, averageSalary: 8500 },
          { specialty: 'Neurología', jobsCount: 18, averageSalary: 13500 },
          { specialty: 'Oncología', jobsCount: 15, averageSalary: 14000 },
          { specialty: 'Ginecología', jobsCount: 12, averageSalary: 9500 },
        ],
        monthlyStats: [
          { month: 'Ene', jobsPosted: 8, applications: 156, hires: 4 },
          { month: 'Feb', jobsPosted: 12, applications: 198, hires: 6 },
          { month: 'Mar', jobsPosted: 15, applications: 234, hires: 8 },
          { month: 'Abr', jobsPosted: 18, applications: 267, hires: 9 },
          { month: 'May', jobsPosted: 22, applications: 312, hires: 12 },
          { month: 'Jun', jobsPosted: 19, applications: 289, hires: 11 },
          { month: 'Jul', jobsPosted: 25, applications: 356, hires: 14 },
          { month: 'Ago', jobsPosted: 8, applications: 98, hires: 3 },
        ],
        salaryRanges: [
          { range: '< $5,000', count: 18, percentage: 14.2 },
          { range: '$5,000 - $8,000', count: 34, percentage: 26.8 },
          { range: '$8,000 - $12,000', count: 42, percentage: 33.1 },
          { range: '$12,000 - $18,000', count: 25, percentage: 19.7 },
          { range: '> $18,000', count: 8, percentage: 6.3 },
        ],
        conversionFunnel: [
          { stage: 'Ofertas Publicadas', count: 127, percentage: 100 },
          { stage: 'Con Aplicaciones', count: 98, percentage: 77.2 },
          { stage: 'Entrevistas', count: 67, percentage: 52.8 },
          { stage: 'Ofertas Extendidas', count: 34, percentage: 26.8 },
          { stage: 'Contrataciones', count: 23, percentage: 18.1 },
        ],
        competitorAnalysis: [
          { competitor: 'Hospital San Vicente', marketShare: 35.2, averageResponseTime: 2.4, averageRating: 4.8 },
          { competitor: 'Hospital Italiano', marketShare: 28.7, averageResponseTime: 3.1, averageRating: 4.9 },
          { competitor: 'Hospital Metropolitano', marketShare: 18.3, averageResponseTime: 4.2, averageRating: 4.6 },
          { competitor: 'Otros', marketShare: 17.8, averageResponseTime: 5.8, averageRating: 4.3 },
        ],
      };
      
      setMetrics(mockMetrics);
      setIsLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  if (isLoading || !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics del Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Análisis completo del rendimiento y métricas del marketplace médico
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            📥 Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ofertas</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalJobs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">💼</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">↗ +12%</span>
            <span className="text-gray-500 text-sm ml-2">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ofertas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeJobs}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🟢</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-600 text-sm font-medium">↗ +8%</span>
            <span className="text-gray-500 text-sm ml-2">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aplicaciones</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalApplications.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">↗ +24%</span>
            <span className="text-gray-500 text-sm ml-2">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contrataciones</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.hiredCandidates}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">↗ +18%</span>
            <span className="text-gray-500 text-sm ml-2">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageTimeToHire}d</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏱️</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-red-600 text-sm font-medium">↗ +2d</span>
            <span className="text-gray-500 text-sm ml-2">vs. período anterior</span>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias mensuales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendencias Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.monthlyStats}>
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="jobsPosted" stackId="1" stroke="#3B82F6" fillOpacity={1} fill="url(#colorJobs)" name="Ofertas Publicadas" />
              <Area type="monotone" dataKey="hires" stackId="2" stroke="#10B981" fillOpacity={1} fill="url(#colorApplications)" name="Contrataciones" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top especialidades */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏥 Top Especialidades</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.topSpecialties} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="specialty" type="category" width={100} />
              <Tooltip formatter={(value, name) => [value, name === 'jobsCount' ? 'Ofertas' : 'Salario Promedio (USD)']} />
              <Bar dataKey="jobsCount" fill="#3B82F6" name="Ofertas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análisis adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución salarial */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Distribución Salarial</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.salaryRanges}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metrics.salaryRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {metrics.salaryRanges.map((range, index) => (
              <div key={range.range} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="flex-1">{range.range}</span>
                <span className="font-medium">{range.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Embudo de conversión */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Embudo de Conversión</h3>
          <div className="space-y-3">
            {metrics.conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                  <span className="text-sm text-gray-500">{stage.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{stage.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Análisis competitivo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Análisis Competitivo</h3>
          <div className="space-y-4">
            {metrics.competitorAnalysis.map((competitor, index) => (
              <div key={competitor.competitor} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{competitor.competitor}</span>
                  <span className="text-sm text-gray-500">{competitor.marketShare.toFixed(1)}%</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Tiempo respuesta:</span>
                    <span className="font-medium">{competitor.averageResponseTime}h</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Rating promedio:</span>
                    <span className="font-medium flex items-center">
                      ⭐ {competitor.averageRating}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className={`h-1 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${competitor.marketShare}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Recomendaciones Estratégicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">📈</span>
              <h4 className="font-medium text-gray-900">Optimización de Ofertas</h4>
            </div>
            <p className="text-sm text-gray-600">
              Enfocar en especialidades de alta demanda como Cardiología y Neurología que muestran mejor conversión.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">⚡</span>
              <h4 className="font-medium text-gray-900">Tiempo de Respuesta</h4>
            </div>
            <p className="text-sm text-gray-600">
              Reducir el tiempo promedio de contratación implementando entrevistas rápidas y procesos automatizados.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🎯</span>
              <h4 className="font-medium text-gray-900">Segmentación</h4>
            </div>
            <p className="text-sm text-gray-600">
              Crear campañas dirigidas para especialidades específicas con salarios competitivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
