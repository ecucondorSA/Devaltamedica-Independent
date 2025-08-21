'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Share2,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  BarChart3,
  Download as DownloadIcon,
  Printer,
  Mail,
  X
} from 'lucide-react';

interface LabResult {
  id: string;
  date: string;
  testName: string;
  category: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  trend: 'up' | 'down' | 'stable';
  notes?: string;
  doctor: string;
  lab: string;
  attachments?: string[];
}

interface LabCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  tests: LabResult[];
}

export default function LabResultsPage() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'chart' | 'timeline'>('list');
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [categories, setCategories] = useState<LabCategory[]>([]);

  useEffect(() => {
    loadLabResults();
  }, []);

  useEffect(() => {
    filterResults();
    groupResultsByCategory();
  }, [results, searchTerm, selectedCategory, selectedStatus, selectedDate]);

  const loadLabResults = async () => {
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockResults: LabResult[] = [
        {
          id: '1',
          date: '2025-01-15',
          testName: 'Hemoglobina',
          category: 'Hematología',
          value: '14.2',
          unit: 'g/dL',
          referenceRange: '12.0-16.0',
          status: 'normal',
          trend: 'stable',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '2',
          date: '2025-01-15',
          testName: 'Glucosa en ayunas',
          category: 'Bioquímica',
          value: '95',
          unit: 'mg/dL',
          referenceRange: '70-100',
          status: 'normal',
          trend: 'down',
          doctor: 'Dra. María Ruiz',
          lab: 'Laboratorio Central'
        },
        {
          id: '3',
          date: '2025-01-15',
          testName: 'Colesterol Total',
          category: 'Lípidos',
          value: '180',
          unit: 'mg/dL',
          referenceRange: '<200',
          status: 'normal',
          trend: 'down',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '4',
          date: '2025-01-15',
          testName: 'Triglicéridos',
          category: 'Lípidos',
          value: '150',
          unit: 'mg/dL',
          referenceRange: '<150',
          status: 'normal',
          trend: 'stable',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '5',
          date: '2025-01-15',
          testName: 'Creatinina',
          category: 'Función Renal',
          value: '1.1',
          unit: 'mg/dL',
          referenceRange: '0.7-1.3',
          status: 'normal',
          trend: 'stable',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '6',
          date: '2025-01-15',
          testName: 'Tiroxina Libre (T4)',
          category: 'Hormonas',
          value: '1.2',
          unit: 'ng/dL',
          referenceRange: '0.8-1.8',
          status: 'normal',
          trend: 'up',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '7',
          date: '2024-12-15',
          testName: 'Hemoglobina',
          category: 'Hematología',
          value: '13.8',
          unit: 'g/dL',
          referenceRange: '12.0-16.0',
          status: 'normal',
          trend: 'up',
          doctor: 'Dr. Carlos García López',
          lab: 'Laboratorio Central'
        },
        {
          id: '8',
          date: '2024-12-15',
          testName: 'Glucosa en ayunas',
          category: 'Bioquímica',
          value: '102',
          unit: 'mg/dL',
          referenceRange: '70-100',
          status: 'high',
          trend: 'down',
          notes: 'Ligeramente elevada, monitorear',
          doctor: 'Dra. María Ruiz',
          lab: 'Laboratorio Central'
        }
      ];

      setResults(mockResults);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading lab results:', error);
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(result => result.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(result => result.status === selectedStatus);
    }

    if (selectedDate !== 'all') {
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.date).toISOString().split('T')[0];
        return resultDate === selectedDate;
      });
    }

    setFilteredResults(filtered);
  };

  const groupResultsByCategory = () => {
    const categoryMap = new Map<string, LabResult[]>();
    
    filteredResults.forEach(result => {
      if (!categoryMap.has(result.category)) {
        categoryMap.set(result.category, []);
      }
      categoryMap.get(result.category)!.push(result);
    });

    const groupedCategories: LabCategory[] = Array.from(categoryMap.entries()).map(([name, tests]) => ({
      name,
      icon: <Activity className="w-6 h-6" />,
      color: getCategoryColor(name),
      tests
    }));

    setCategories(groupedCategories);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Hematología': 'bg-red-100 text-red-800',
      'Bioquímica': 'bg-blue-100 text-blue-800',
      'Lípidos': 'bg-green-100 text-green-800',
      'Función Renal': 'bg-purple-100 text-purple-800',
      'Hormonas': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
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

  const isValueNormal = (result: LabResult) => {
    const value = parseFloat(result.value);
    const range = result.referenceRange;
    
    if (range.includes('<')) {
      const max = parseFloat(range.replace('<', ''));
      return value < max;
    } else if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      return value >= min && value <= max;
    }
    
    return true;
  };

  const exportResults = () => {
    // Implementar exportación de resultados
    logger.info('Exporting lab results...');
  };

  const printResults = () => {
    // Implementar impresión de resultados
    logger.info('Printing lab results...');
  };

  const emailResults = () => {
    // Implementar envío por email
    logger.info('Emailing lab results...');
  };

  const openResultModal = (result: LabResult) => {
    setSelectedResult(result);
    setShowResultModal(true);
  };

  const dates = Array.from(new Set(results.map(r => r.date))).sort((a, b) => b.localeCompare(a));
  const resultCategories = Array.from(new Set(results.map(r => r.category))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados de laboratorio...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Resultados de Laboratorio</h1>
              <p className="text-gray-600 mt-1">Revisa y analiza tus resultados médicos</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportResults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={printResults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={emailResults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar con filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
              
              {/* Búsqueda */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar pruebas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {resultCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="normal">Normal</option>
                  <option value="high">Elevado</option>
                  <option value="low">Bajo</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>

              {/* Fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las fechas</option>
                  {dates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resumen estadístico */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Resumen</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total de pruebas:</span>
                    <span className="font-medium">{filteredResults.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Normales:</span>
                    <span className="font-medium text-green-600">
                      {filteredResults.filter(r => r.status === 'normal').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Anormales:</span>
                    <span className="font-medium text-orange-600">
                      {filteredResults.filter(r => r.status !== 'normal').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* Controles de vista */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Vista:</span>
                  <div className="flex space-x-1">
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
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'timeline'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Cronología
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredResults.length} resultados encontrados
                </div>
              </div>
            </div>

            {/* Vista de lista */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {resultCategories.map((category) => (
                  <div key={category.name} className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-600">{category.tests.length} pruebas</p>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {category.tests.map((result) => (
                        <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-medium text-gray-900">{result.testName}</h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                                  {result.status}
                                </span>
                                {getTrendIcon(result.trend)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Valor:</span>
                                  <p className="font-medium">{result.value} {result.unit}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Rango normal:</span>
                                  <p className="font-medium">{result.referenceRange}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Fecha:</span>
                                  <p className="font-medium">{new Date(result.date).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Laboratorio:</span>
                                  <p className="font-medium">{result.lab}</p>
                                </div>
                              </div>
                              {result.notes && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                                  <p className="text-sm text-yellow-800">{result.notes}</p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => openResultModal(result)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md ml-4"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista de gráficos */}
            {viewMode === 'chart' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Tendencias</h3>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Los gráficos estarán disponibles próximamente</p>
                </div>
              </div>
            )}

            {/* Vista de cronología */}
            {viewMode === 'timeline' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Cronología de Resultados</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {dates.map((date) => {
                      const dateResults = filteredResults.filter(r => r.date === date);
                      return (
                        <div key={date} className="border-l-4 border-blue-500 pl-6">
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900">
                              {new Date(date).toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h4>
                            <p className="text-sm text-gray-600">{dateResults.length} pruebas realizadas</p>
                          </div>
                          <div className="space-y-3">
                            {dateResults.map((result) => (
                              <div key={result.id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{result.testName}</h5>
                                    <p className="text-sm text-gray-600">
                                      {result.value} {result.unit} • {result.referenceRange}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                                      {result.status}
                                    </span>
                                    {getTrendIcon(result.trend)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle del resultado */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalle del Resultado</h2>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedResult.testName}</h3>
                  <p className="text-gray-600">{selectedResult.category}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Valor:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedResult.value} {selectedResult.unit}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Rango normal:</span>
                    <p className="text-gray-900">{selectedResult.referenceRange}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <p className="text-gray-900">{selectedResult.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tendencia:</span>
                    <div className="flex items-center">
                      {getTrendIcon(selectedResult.trend)}
                      <span className="ml-1 text-gray-900">{selectedResult.trend}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span>
                    <p className="text-gray-900">{new Date(selectedResult.date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Laboratorio:</span>
                    <p className="text-gray-900">{selectedResult.lab}</p>
                  </div>
                </div>
                
                {selectedResult.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notas:</span>
                    <p className="text-gray-900 mt-1">{selectedResult.notes}</p>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Interpretación</h4>
                  <div className={`p-3 rounded-md ${
                    selectedResult.status === 'normal' 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-yellow-50 text-yellow-800'
                  }`}>
                    {selectedResult.status === 'normal' 
                      ? 'El resultado está dentro del rango normal.'
                      : 'El resultado está fuera del rango normal. Consulta con tu médico.'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
