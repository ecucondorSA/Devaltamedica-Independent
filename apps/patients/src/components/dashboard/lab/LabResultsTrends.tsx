'use client';

import React, { useMemo, useState } from 'react';

interface LabResult {
  id: string;
  patientId: string;
  orderedDate: string | Date;
  completedDate?: string | Date;
  status: 'ordered' | 'in-progress' | 'completed' | 'cancelled';
  category: string;
  overallStatus: 'normal' | 'warning' | 'critical';
  urgency: 'routine' | 'urgent' | 'stat';
  tests: LabTest[];
  orderedBy: string;
  labName: string;
  laboratory?: string;
  notes?: string;
}

interface LabTest {
  id: string;
  name: string;
  value: number;
  result: string;
  unit: string;
  referenceRange: { min: number; max: number };
  status: 'normal' | 'high' | 'low' | 'critical';
  isAbnormal: boolean;
}

interface LabResultsTrendsProps {
  results: LabResult[];
  compact?: boolean;
  showComparisons?: boolean;
  showReports?: boolean;
  onResultClick?: (result: LabResult) => void;
  onDownloadReport?: (resultId: string) => void;
}

const LabResultsTrends: React.FC<LabResultsTrendsProps> = ({
  results,
  compact = false,
  showComparisons = false,
  showReports = false,
  onResultClick,
  onDownloadReport,
}) => {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Filtrar resultados por rango de tiempo
  const filteredResults = useMemo(() => {
    const now = new Date();
    let filtered = [...results];

    // Filtrar por tiempo
    if (timeRange !== 'all') {
      const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      filtered = filtered.filter(
        (result) => result.completedDate && new Date(result.completedDate) >= cutoffDate,
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((result) => result.category === selectedCategory);
    }

    // Filtrar solo críticos
    if (showCriticalOnly) {
      filtered = filtered.filter(
        (result) =>
          result.overallStatus === 'critical' ||
          result.tests.some((test) => test.status === 'critical'),
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.completedDate || b.orderedDate).getTime() -
        new Date(a.completedDate || a.orderedDate).getTime(),
    );
  }, [results, timeRange, selectedCategory, showCriticalOnly]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const uniqueCategories = new Set(results.map((r) => r.category));
    return Array.from(uniqueCategories);
  }, [results]);

  // Vista compacta
  if (compact) {
    const recentResults = filteredResults.slice(0, 3);
    const pendingResults = results.filter(
      (r) => r.status === 'ordered' || r.status === 'in-progress',
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Resultados de Laboratorio</h3>
          {pendingResults.length > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              {pendingResults.length} pendiente{pendingResults.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {recentResults.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">🔬</span>
            <p className="text-gray-500">No hay resultados recientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onResultClick?.(result)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {result.category === 'blood'
                        ? '🩸'
                        : result.category === 'urine'
                          ? '🧪'
                          : result.category === 'imaging'
                            ? '📷'
                            : '🔬'}{' '}
                      {result.category.charAt(0).toUpperCase() + result.category.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {result.tests.length} prueba{result.tests.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(result.completedDate || result.orderedDate).toLocaleDateString(
                        'es-MX',
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </p>
                  </div>
                  <StatusIndicator status={result.overallStatus || 'normal'} />
                </div>
              </button>
            ))}

            {filteredResults.length > 3 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver {filteredResults.length - 3} más...
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Análisis de Resultados de Laboratorio
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} en los
              últimos{' '}
              {timeRange === '3m'
                ? '3 meses'
                : timeRange === '6m'
                  ? '6 meses'
                  : timeRange === '1y'
                    ? '12 meses'
                    : 'todos los tiempos'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showCriticalOnly ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">⚠️</span>
              Solo críticos
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Selector de categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Selector de rango de tiempo */}
            <div className="flex items-center bg-white rounded-lg border border-gray-300">
              {(['3m', '6m', '1y', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${range === '3m' ? 'rounded-l-lg' : range === 'all' ? 'rounded-r-lg' : ''}`}
                >
                  {range === '3m' ? '3M' : range === '6m' ? '6M' : range === '1y' ? '1A' : 'Todo'}
                </button>
              ))}
            </div>
          </div>

          {showReports && (
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              <span className="mr-1">📊</span>
              Generar informe
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Lista de resultados */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Resultados Recientes</h3>

          {filteredResults.map((result) => (
            <LabResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick?.(result)}
              onDownload={() => onDownloadReport?.(result.id)}
              showReports={showReports}
            />
          ))}

          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-gray-500">
                No se encontraron resultados con los filtros aplicados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-gray-600">Total de pruebas:</span>
              <span className="ml-1 font-medium text-gray-900">
                {filteredResults.reduce((sum, r) => sum + r.tests.length, 0)}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">Estado:</span>
              <div className="flex items-center space-x-2">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-green-600 font-medium">
                    {filteredResults.filter((r) => r.overallStatus === 'normal').length}
                  </span>
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  <span className="text-yellow-600 font-medium">
                    {filteredResults.filter((r) => r.overallStatus === 'warning').length}
                  </span>
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  <span className="text-red-600 font-medium">
                    {filteredResults.filter((r) => r.overallStatus === 'critical').length}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Exportar datos</button>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta de resultado
const LabResultCard: React.FC<{
  result: LabResult;
  onClick?: () => void;
  onDownload?: () => void;
  showReports?: boolean;
}> = ({ result, onClick, onDownload, showReports }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryIcons: Record<string, string> = {
    blood: '🩸',
    urine: '🧪',
    imaging: '📷',
    pathology: '🔬',
    other: '📋',
  };

  const urgencyColors: Record<'routine' | 'urgent' | 'stat', string> = {
    routine: 'text-gray-600',
    urgent: 'text-orange-600',
    stat: 'text-red-600',
  };

  const criticalTests = result.tests.filter((t) => t.status === 'critical');
  const abnormalTests = result.tests.filter((t) => t.status === 'high' || t.status === 'low');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{categoryIcons[result.category]}</span>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">
                  {result.category.charAt(0).toUpperCase() + result.category.slice(1)} -{' '}
                  {result.tests.length} pruebas
                </h4>
                <span className={`text-xs font-medium ${urgencyColors[result.urgency]}`}>
                  {result.urgency === 'stat'
                    ? 'URGENTE'
                    : result.urgency === 'urgent'
                      ? 'Prioritario'
                      : ''}
                </span>
              </div>

              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span>
                  Ordenado:{' '}
                  {new Date(result.orderedDate).toLocaleDateString('es-MX', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {result.completedDate && (
                  <>
                    <span>•</span>
                    <span>
                      Completado:{' '}
                      {new Date(result.completedDate).toLocaleDateString('es-MX', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>Dr. {result.orderedBy}</span>
              </div>

              {(criticalTests.length > 0 || abnormalTests.length > 0) && (
                <div className="flex items-center space-x-3 mt-2">
                  {criticalTests.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {criticalTests.length} crítico{criticalTests.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {abnormalTests.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      {abnormalTests.length} anormal{abnormalTests.length > 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <StatusIndicator status={result.overallStatus || 'normal'} size="large" />
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="mt-4 space-y-3">
            {result.tests.map((test, index) => (
              <TestResultRow key={index} test={test} />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {result.laboratory && <span>Laboratorio: {result.laboratory}</span>}
            </div>
            <div className="flex items-center space-x-3">
              {onClick && (
                <button
                  onClick={onClick}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver detalles completos
                </button>
              )}
              {showReports && onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Descargar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para fila de resultado de prueba
const TestResultRow: React.FC<{ test: LabTest }> = ({ test }) => {
  const getStatusColor = () => {
    switch (test.status) {
      case 'critical':
        return 'bg-red-100 text-red-900 border-red-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      default:
        return 'bg-green-100 text-green-900 border-green-200';
    }
  };

  const getStatusIcon = () => {
    switch (test.status) {
      case 'critical':
        return '⚠️';
      case 'high':
        return '⬆️';
      case 'low':
        return '⬇️';
      default:
        return '✓';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-medium">{test.name}</span>
          </div>
          <div className="mt-1 text-sm">
            <span className="font-semibold">{test.result}</span>
            {test.unit && <span className="ml-1 text-gray-600">{test.unit}</span>}
            {test.referenceRange && (
              <span className="ml-3 text-gray-600">(Ref: {test.referenceRange.min} - {test.referenceRange.max})</span>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

// Componente para indicador de estado
const StatusIndicator: React.FC<{ status: string; size?: 'small' | 'large' }> = ({
  status,
  size = 'small',
}) => {
  const styles = {
    normal: { bg: 'bg-green-100', text: 'text-green-800', label: 'Normal' },
    abnormal: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Anormal' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Crítico' },
  }[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' };

  return (
    <span
      className={`
      inline-flex items-center rounded-full font-medium
      ${styles.bg} ${styles.text}
      ${size === 'large' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}
    `}
    >
      {styles.label}
    </span>
  );
};

export default LabResultsTrends;
