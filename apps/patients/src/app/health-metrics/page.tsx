'use client';

import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Droplets,
    Edit,
    Heart,
    LineChart,
    Minus,
    Plus,
    Trash2,
    TrendingDown,
    TrendingUp,
    User,
    Weight,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  date: string;
  time: string;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  targetRange: {
    min: number;
    max: number;
  };
  notes?: string;
  source: 'manual' | 'device' | 'lab';
}

interface MetricCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  metrics: HealthMetric[];
}

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [viewMode, setViewMode] = useState<'dashboard' | 'list' | 'chart'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [categories, setCategories] = useState<MetricCategory[]>([]);

  // Formulario para agregar/editar métrica
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    unit: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    loadHealthMetrics();
  }, []);

  useEffect(() => {
    filterMetrics();
    groupMetricsByCategory();
  }, [metrics, selectedCategory, selectedPeriod]);

  const loadHealthMetrics = async () => {
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockMetrics: HealthMetric[] = [
        {
          id: '1',
          name: 'Presión Arterial Sistólica',
          value: 120,
          unit: 'mmHg',
          category: 'Cardiovascular',
          date: '2025-01-15',
          time: '08:30',
          trend: 'stable',
          status: 'normal',
          targetRange: { min: 90, max: 140 },
          source: 'manual'
        },
        {
          id: '2',
          name: 'Presión Arterial Diastólica',
          value: 80,
          unit: 'mmHg',
          category: 'Cardiovascular',
          date: '2025-01-15',
          time: '08:30',
          trend: 'stable',
          status: 'normal',
          targetRange: { min: 60, max: 90 },
          source: 'manual'
        },
        {
          id: '3',
          name: 'Frecuencia Cardíaca',
          value: 72,
          unit: 'bpm',
          category: 'Cardiovascular',
          date: '2025-01-15',
          time: '08:30',
          trend: 'down',
          status: 'normal',
          targetRange: { min: 60, max: 100 },
          source: 'device'
        },
        {
          id: '4',
          name: 'Peso',
          value: 70.5,
          unit: 'kg',
          category: 'Antropométricas',
          date: '2025-01-15',
          time: '07:00',
          trend: 'down',
          status: 'normal',
          targetRange: { min: 60, max: 80 },
          source: 'device'
        },
        {
          id: '5',
          name: 'Temperatura',
          value: 36.8,
          unit: '°C',
          category: 'Vitales',
          date: '2025-01-15',
          time: '08:00',
          trend: 'stable',
          status: 'normal',
          targetRange: { min: 36.0, max: 37.5 },
          source: 'device'
        },
        {
          id: '6',
          name: 'Glucemia',
          value: 95,
          unit: 'mg/dL',
          category: 'Metabólicas',
          date: '2025-01-15',
          time: '07:30',
          trend: 'down',
          status: 'normal',
          targetRange: { min: 70, max: 100 },
          source: 'lab'
        },
        {
          id: '7',
          name: 'Oxigenación',
          value: 98,
          unit: '%',
          category: 'Respiratorias',
          date: '2025-01-15',
          time: '08:15',
          trend: 'stable',
          status: 'normal',
          targetRange: { min: 95, max: 100 },
          source: 'device'
        },
        {
          id: '8',
          name: 'Pasos Diarios',
          value: 8500,
          unit: 'pasos',
          category: 'Actividad',
          date: '2025-01-15',
          time: '23:59',
          trend: 'up',
          status: 'normal',
          targetRange: { min: 8000, max: 12000 },
          source: 'device'
        }
      ];

      setMetrics(mockMetrics);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading health metrics:', error);
      setLoading(false);
    }
  };

  const filterMetrics = () => {
    let filtered = metrics;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(metric => metric.category === selectedCategory);
    }

    // Filtrar por período
    const now = new Date();
    const periodDays = parseInt(selectedPeriod.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    filtered = filtered.filter(metric => new Date(metric.date) >= cutoffDate);

    setFilteredMetrics(filtered);
  };

  const groupMetricsByCategory = () => {
    const categoryMap = new Map<string, HealthMetric[]>();
    
    filteredMetrics.forEach(metric => {
      if (!categoryMap.has(metric.category)) {
        categoryMap.set(metric.category, []);
      }
      categoryMap.get(metric.category)!.push(metric);
    });

    const groupedCategories: MetricCategory[] = Array.from(categoryMap.entries()).map(([name, metrics]) => ({
      name,
      icon: getCategoryIcon(name),
      color: getCategoryColor(name),
      metrics
    }));

    setCategories(groupedCategories);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cardiovascular': return <Heart className="w-6 h-6" />;
      case 'Antropométricas': return <Weight className="w-6 h-6" />;
      case 'Vitales': return <Activity className="w-6 h-6" />;
      case 'Metabólicas': return <Zap className="w-6 h-6" />;
      case 'Respiratorias': return <Droplets className="w-6 h-6" />;
      case 'Actividad': return <User className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Cardiovascular': 'bg-red-100 text-red-800',
      'Antropométricas': 'bg-blue-100 text-blue-800',
      'Vitales': 'bg-green-100 text-green-800',
      'Metabólicas': 'bg-purple-100 text-purple-800',
      'Respiratorias': 'bg-yellow-100 text-yellow-800',
      'Actividad': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const isValueNormal = (metric: HealthMetric) => {
    return metric.value >= metric.targetRange.min && metric.value <= metric.targetRange.max;
  };

  const getLatestMetric = (category: string) => {
    const categoryMetrics = metrics.filter(m => m.category === category);
    return categoryMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const handleAddMetric = () => {
    setFormData({
      name: '',
      value: '',
      unit: '',
      category: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditMetric = (metric: HealthMetric) => {
    setSelectedMetric(metric);
    setFormData({
      name: metric.name,
      value: metric.value.toString(),
      unit: metric.unit,
      category: metric.category,
      notes: metric.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmitMetric = () => {
    // Implementar guardado de métrica
    logger.info('Saving metric:', formData);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleDeleteMetric = (metricId: string) => {
    // Implementar eliminación de métrica
    logger.info('Deleting metric:', metricId);
  };

  const metricCategories = Array.from(new Set(metrics.map(m => m.category))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas de salud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Métricas de Salud</h1>
              <p className="text-gray-600 mt-1">Monitorea y gestiona tus indicadores de salud</p>
            </div>
            <button
              onClick={handleAddMetric}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Métrica
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {metricCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1d">Último día</option>
                  <option value="7d">Última semana</option>
                  <option value="30d">Último mes</option>
                  <option value="90d">Últimos 3 meses</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'dashboard'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'chart'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Gráficos
              </button>
            </div>
          </div>
        </div>

        {/* Vista Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="space-y-8">
            {/* Resumen general */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Normales</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredMetrics.filter(m => m.status === 'normal').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Advertencias</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredMetrics.filter(m => m.status === 'warning').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Críticos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredMetrics.filter(m => m.status === 'critical').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredMetrics.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas por categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {metricCategories.map((category) => {
                const latestMetric = getLatestMetric(category);
                if (!latestMetric) return null;

                return (
                  <div key={category} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                          {getCategoryIcon(category)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver todas
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{latestMetric.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {latestMetric.value} {latestMetric.unit}
                          </span>
                          {getTrendIcon(latestMetric.trend)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Rango: {latestMetric.targetRange.min}-{latestMetric.targetRange.max} {latestMetric.unit}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${getStatusColor(latestMetric.status)}`}>
                          {latestMetric.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Última medición: {new Date(latestMetric.date).toLocaleDateString('es-ES')} a las {latestMetric.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista Lista */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {metricCategories.map((category) => (
              <div key={category.name} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.metrics.length} métricas</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {category.metrics.map((metric) => (
                    <div key={metric.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{metric.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(metric.status)}`}>
                              {metric.status}
                            </span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Valor:</span>
                              <p className="font-medium">{metric.value} {metric.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Rango objetivo:</span>
                              <p className="font-medium">{metric.targetRange.min}-{metric.targetRange.max} {metric.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fecha:</span>
                              <p className="font-medium">{new Date(metric.date).toLocaleDateString('es-ES')}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Hora:</span>
                              <p className="font-medium">{metric.time}</p>
                            </div>
                          </div>
                          {metric.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <p className="text-sm text-blue-800">{metric.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditMetric(metric)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMetric(metric.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vista Gráficos */}
        {viewMode === 'chart' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Tendencias</h3>
            <div className="text-center py-12">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Los gráficos estarán disponibles próximamente</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar métrica */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agregar Métrica</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Presión Arterial"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="mmHg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {metricCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitMetric}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar métrica */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Editar Métrica</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {metricCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitMetric}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
