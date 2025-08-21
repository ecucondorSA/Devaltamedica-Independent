// 📊 GRÁFICO DE SIGNOS VITALES - ALTAMEDICA
// Visualización en tiempo real de métricas médicas con alertas inteligentes
// Compatible con monitoreo continuo y análisis de tendencias

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Activity, Thermometer, Wind, 
  TrendingUp, TrendingDown, AlertCircle, 
  ZoomIn, ZoomOut, Download, Maximize2
} from 'lucide-react';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import { CardCorporate, CardHeaderCorporate, CardContentCorporate } from '../corporate/CardCorporate';
import { StatusBadge } from '../medical/StatusBadge';
import { colors } from '../../theme/colors';

// 📊 TIPOS DE MÉTRICAS
export type VitalSignMetric = 
  | 'heartRate' 
  | 'bloodPressure' 
  | 'temperature' 
  | 'oxygenSaturation'
  | 'respiratoryRate';

// 📈 PUNTO DE DATOS
export interface VitalSignDataPoint {
  timestamp: Date;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}

// 🎯 PROPS DEL COMPONENTE
export interface VitalSignsChartProps {
  data: VitalSignDataPoint[];
  metrics?: VitalSignMetric[];
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  showAlerts?: boolean;
  showTrends?: boolean;
  showNormalRanges?: boolean;
  enableZoom?: boolean;
  enableExport?: boolean;
  realTime?: boolean;
  updateInterval?: number; // milisegundos
  patientAge?: number;
  className?: string;
  onAlertTriggered?: (metric: VitalSignMetric, value: number) => void;
}

// 🏥 CONFIGURACIÓN DE MÉTRICAS
const METRIC_CONFIG: Record<VitalSignMetric, {
  label: string;
  icon: React.ElementType;
  color: string;
  unit: string;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
}> = {
  heartRate: {
    label: 'Frecuencia Cardíaca',
    icon: Heart,
    color: colors.medical.emergency,
    unit: 'bpm',
    normalRange: { min: 60, max: 100 },
    criticalRange: { min: 40, max: 150 }
  },
  bloodPressure: {
    label: 'Presión Arterial',
    icon: Activity,
    color: colors.primary[500],
    unit: 'mmHg',
    normalRange: { min: 90, max: 120 }, // Sistólica
    criticalRange: { min: 70, max: 180 }
  },
  temperature: {
    label: 'Temperatura',
    icon: Thermometer,
    color: colors.medical.warning,
    unit: '°C',
    normalRange: { min: 36.1, max: 37.2 },
    criticalRange: { min: 35, max: 40 }
  },
  oxygenSaturation: {
    label: 'Saturación O₂',
    icon: Wind,
    color: colors.secondary[500],
    unit: '%',
    normalRange: { min: 95, max: 100 },
    criticalRange: { min: 85, max: 100 }
  },
  respiratoryRate: {
    label: 'Frecuencia Respiratoria',
    icon: Wind,
    color: colors.special.therapy,
    unit: 'rpm',
    normalRange: { min: 12, max: 20 },
    criticalRange: { min: 8, max: 30 }
  }
};

// 📊 COMPONENTE PRINCIPAL
export const VitalSignsChart: React.FC<VitalSignsChartProps> = ({
  data,
  metrics = ['heartRate', 'bloodPressure', 'temperature', 'oxygenSaturation'],
  timeRange = '24h',
  showAlerts = true,
  showTrends = true,
  showNormalRanges = true,
  enableZoom = true,
  enableExport = true,
  realTime = false,
  updateInterval = 5000,
  patientAge,
  className = '',
  onAlertTriggered
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<VitalSignMetric>>(new Set(metrics));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Record<VitalSignMetric, boolean>>({} as any);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: VitalSignDataPoint } | null>(null);

  // 🔄 FILTRAR DATOS SEGÚN RANGO DE TIEMPO
  const filteredData = useMemo(() => {
    const now = new Date();
    const rangeMap = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now.getTime() - rangeMap[timeRange];
    return data.filter(point => point.timestamp.getTime() >= cutoff);
  }, [data, timeRange]);

  // 📈 CALCULAR TENDENCIAS
  const calculateTrend = (metric: VitalSignMetric): 'up' | 'down' | 'stable' => {
    if (filteredData.length < 2) return 'stable';
    
    const recentData = filteredData.slice(-10);
    const values = recentData
      .map(point => {
        if (metric === 'bloodPressure') {
          return point.bloodPressure?.systolic;
        }
        return point[metric];
      })
      .filter(val => val !== undefined) as number[];
    
    if (values.length < 2) return 'stable';
    
    const avgFirst = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
    const avgSecond = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length - Math.floor(values.length / 2));
    
    const difference = avgSecond - avgFirst;
    const percentChange = (difference / avgFirst) * 100;
    
    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange > 0 ? 'up' : 'down';
  };

  // 🚨 VERIFICAR ALERTAS
  const checkAlerts = () => {
    if (!showAlerts || filteredData.length === 0) return;
    
    const latestData = filteredData[filteredData.length - 1];
    const newAlerts: Record<VitalSignMetric, boolean> = {} as any;
    
    selectedMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      let value: number | undefined;
      
      if (metric === 'bloodPressure') {
        value = latestData.bloodPressure?.systolic;
      } else {
        value = latestData[metric];
      }
      
      if (value !== undefined) {
        const isOutOfRange = value < config.normalRange.min || value > config.normalRange.max;
        newAlerts[metric] = isOutOfRange;
        
        if (isOutOfRange && onAlertTriggered) {
          onAlertTriggered(metric, value);
        }
      }
    });
    
    setActiveAlerts(newAlerts);
  };

  // 🎨 DIBUJAR GRÁFICO
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configurar dimensiones
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Limpiar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Configuración de márgenes
    const margin = { top: 40, right: 60, bottom: 60, left: 70 };
    const chartWidth = rect.width - margin.left - margin.right;
    const chartHeight = rect.height - margin.top - margin.bottom;
    
    // Dibujar fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, colors.backgrounds.secondary);
    gradient.addColorStop(1, colors.backgrounds.primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Configurar área de gráfico
    ctx.save();
    ctx.translate(margin.left, margin.top);
    
    // Dibujar cuadrícula
    ctx.strokeStyle = colors.gray[200];
    ctx.lineWidth = 0.5;
    
    // Líneas horizontales
    for (let i = 0; i <= 5; i++) {
      const y = (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
    }
    
    // Líneas verticales
    for (let i = 0; i <= 8; i++) {
      const x = (chartWidth / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }
    
    // Dibujar rangos normales si está habilitado
    if (showNormalRanges) {
      selectedMetrics.forEach(metric => {
        const config = METRIC_CONFIG[metric];
        const { normalRange, criticalRange } = config;
        
        // Normalizar valores para el gráfico
        const yMin = (1 - normalRange.min / criticalRange.max) * chartHeight;
        const yMax = (1 - normalRange.max / criticalRange.max) * chartHeight;
        
        // Área de rango normal
        ctx.fillStyle = colors.alpha.primary10;
        ctx.fillRect(0, yMax, chartWidth, yMin - yMax);
      });
    }
    
    // Dibujar líneas de datos
    selectedMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      
      filteredData.forEach((point, index) => {
        const x = (index / (filteredData.length - 1)) * chartWidth * zoomLevel;
        let value: number | undefined;
        
        if (metric === 'bloodPressure') {
          value = point.bloodPressure?.systolic;
        } else {
          value = point[metric];
        }
        
        if (value !== undefined) {
          const y = (1 - value / config.criticalRange.max) * chartHeight;
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
          
          // Dibujar punto
          ctx.save();
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      
      ctx.stroke();
    });
    
    // Dibujar etiquetas del eje Y
    ctx.fillStyle = colors.text.secondary;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'right';
    
    selectedMetrics.forEach((metric, idx) => {
      const config = METRIC_CONFIG[metric];
      const y = 20 + idx * 20;
      
      ctx.fillStyle = config.color;
      ctx.fillText(`${config.label} (${config.unit})`, -10, y);
    });
    
    // Dibujar etiquetas del eje X (tiempo)
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.text.secondary;
    
    const timeLabels = getTimeLabels(filteredData, timeRange);
    timeLabels.forEach((label, index) => {
      const x = (index / (timeLabels.length - 1)) * chartWidth;
      ctx.fillText(label, x, chartHeight + 20);
    });
    
    ctx.restore();
    
    // Dibujar información del punto hover
    if (hoveredPoint) {
      drawTooltip(ctx, hoveredPoint, rect);
    }
  };

  // 🏷️ OBTENER ETIQUETAS DE TIEMPO
  const getTimeLabels = (data: VitalSignDataPoint[], range: string): string[] => {
    if (data.length === 0) return [];
    
    const formatMap = {
      '1h': (date: Date) => date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      '6h': (date: Date) => date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      '24h': (date: Date) => date.toLocaleTimeString('es-AR', { hour: '2-digit' }),
      '7d': (date: Date) => date.toLocaleDateString('es-AR', { weekday: 'short' }),
      '30d': (date: Date) => date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    };
    
    const formatter = formatMap[range] || formatMap['24h'];
    const labels: string[] = [];
    const labelCount = 8;
    
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      labels.push(formatter(data[index].timestamp));
    }
    
    return labels;
  };

  // 📍 DIBUJAR TOOLTIP
  const drawTooltip = (
    ctx: CanvasRenderingContext2D, 
    point: { x: number; y: number; data: VitalSignDataPoint },
    rect: DOMRect
  ) => {
    const padding = 10;
    const lineHeight = 20;
    const metrics = Array.from(selectedMetrics);
    const width = 200;
    const height = padding * 2 + (metrics.length + 1) * lineHeight;
    
    // Posición del tooltip
    let x = point.x + 10;
    let y = point.y - height / 2;
    
    // Ajustar si se sale de los límites
    if (x + width > rect.width) {
      x = point.x - width - 10;
    }
    if (y < 0) {
      y = padding;
    }
    if (y + height > rect.height) {
      y = rect.height - height - padding;
    }
    
    // Fondo del tooltip
    ctx.fillStyle = colors.alpha.white90;
    ctx.strokeStyle = colors.gray[300];
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // Contenido del tooltip
    ctx.fillStyle = colors.text.primary;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'left';
    
    // Fecha y hora
    ctx.fillText(
      point.data.timestamp.toLocaleString('es-AR'),
      x + padding,
      y + padding + lineHeight
    );
    
    // Valores de métricas
    metrics.forEach((metric, index) => {
      const config = METRIC_CONFIG[metric];
      let value: string;
      
      if (metric === 'bloodPressure' && point.data.bloodPressure) {
        value = `${point.data.bloodPressure.systolic}/${point.data.bloodPressure.diastolic}`;
      } else {
        const val = point.data[metric];
        value = val !== undefined ? `${val}` : 'N/A';
      }
      
      ctx.fillStyle = config.color;
      ctx.fillText(
        `${config.label}: ${value} ${config.unit}`,
        x + padding,
        y + padding + (index + 2) * lineHeight
      );
    });
  };

  // 🖱️ MANEJAR HOVER
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Buscar punto más cercano
    const margin = { left: 70, right: 60, top: 40, bottom: 60 };
    const chartWidth = rect.width - margin.left - margin.right;
    const relativeX = (x - margin.left) / chartWidth;
    
    const dataIndex = Math.round(relativeX * (filteredData.length - 1));
    
    if (dataIndex >= 0 && dataIndex < filteredData.length) {
      setHoveredPoint({
        x,
        y,
        data: filteredData[dataIndex]
      });
    } else {
      setHoveredPoint(null);
    }
  };

  // 📥 EXPORTAR DATOS
  const exportData = () => {
    const csvContent = [
      // Headers
      ['Timestamp', ...Array.from(selectedMetrics).map(m => METRIC_CONFIG[m].label)].join(','),
      // Data
      ...filteredData.map(point => {
        const values = [point.timestamp.toISOString()];
        
        selectedMetrics.forEach(metric => {
          if (metric === 'bloodPressure' && point.bloodPressure) {
            values.push(`${point.bloodPressure.systolic}/${point.bloodPressure.diastolic}`);
          } else {
            values.push(String(point[metric] || ''));
          }
        });
        
        return values.join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vital-signs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔄 ACTUALIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    if (realTime) {
      const interval = setInterval(() => {
        drawChart();
        checkAlerts();
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [realTime, updateInterval]);

  // 📊 DIBUJAR AL CAMBIAR DATOS
  useEffect(() => {
    drawChart();
    checkAlerts();
  }, [filteredData, selectedMetrics, zoomLevel, showNormalRanges]);

  // 🖥️ REDIMENSIONAR
  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 📊 CALCULAR ESTADÍSTICAS ACTUALES
  const currentStats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const latest = filteredData[filteredData.length - 1];
    const stats: Record<VitalSignMetric, {
      value: number | string;
      status: 'normal' | 'warning' | 'critical';
      trend: 'up' | 'down' | 'stable';
    }> = {} as any;
    
    selectedMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      let value: number | string = 'N/A';
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      
      if (metric === 'bloodPressure' && latest.bloodPressure) {
        value = `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}`;
        const sys = latest.bloodPressure.systolic;
        
        if (sys < config.normalRange.min || sys > config.normalRange.max) {
          status = 'warning';
        }
        if (sys < config.criticalRange.min || sys > config.criticalRange.max) {
          status = 'critical';
        }
      } else if (latest[metric] !== undefined) {
        value = latest[metric] as number;
        const numValue = value as number;
        
        if (numValue < config.normalRange.min || numValue > config.normalRange.max) {
          status = 'warning';
        }
        if (numValue < config.criticalRange.min || numValue > config.criticalRange.max) {
          status = 'critical';
        }
      }
      
      stats[metric] = {
        value,
        status,
        trend: calculateTrend(metric)
      };
    });
    
    return stats;
  }, [filteredData, selectedMetrics]);

  return (
    <CardCorporate 
      variant="default" 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}
      medical={true}
    >
      <CardHeaderCorporate
        title="Monitoreo de Signos Vitales"
        subtitle={`Últimas ${timeRange} - ${filteredData.length} mediciones`}
        medical={true}
        actions={
          <div className="flex items-center gap-2">
            {/* Selector de rango de tiempo */}
            <select
              value={timeRange}
              onChange={(e) => {/* Implementar cambio de rango */}}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="1h">1 hora</option>
              <option value="6h">6 horas</option>
              <option value="24h">24 horas</option>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
            </select>
            
            {/* Controles de zoom */}
            {enableZoom && (
              <>
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  icon={<ZoomOut className="w-4 h-4" />}
                />
                <span className="text-sm text-gray-600">{Math.round(zoomLevel * 100)}%</span>
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  icon={<ZoomIn className="w-4 h-4" />}
                />
              </>
            )}
            
            {/* Botones de acción */}
            {enableExport && (
              <ButtonCorporate
                variant="ghost"
                size="sm"
                onClick={exportData}
                icon={<Download className="w-4 h-4" />}
              />
            )}
            <ButtonCorporate
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              icon={<Maximize2 className="w-4 h-4" />}
            />
          </div>
        }
      />

      <CardContentCorporate>
        {/* Resumen de métricas actuales */}
        {currentStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from(selectedMetrics).map(metric => {
              const config = METRIC_CONFIG[metric];
              const stat = currentStats[metric];
              const Icon = config.icon;
              
              return (
                <div
                  key={metric}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${activeAlerts[metric] 
                      ? 'border-red-500 bg-red-50 animate-pulse' 
                      : 'border-gray-200 bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${config.color}`} style={{ color: config.color }} />
                    {showTrends && (
                      <div className="flex items-center gap-1">
                        {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {stat.trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{config.label}</div>
                  <div className="text-lg font-bold" style={{ color: config.color }}>
                    {stat.value} {config.unit}
                  </div>
                  {showAlerts && activeAlerts[metric] && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Fuera de rango normal
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Canvas del gráfico */}
        <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: '400px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          
          {/* Overlay de tiempo real */}
          {realTime && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              En vivo
            </div>
          )}
        </div>

        {/* Leyenda y controles de métricas */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="text-sm text-gray-600">Métricas:</div>
          {metrics.map(metric => {
            const config = METRIC_CONFIG[metric];
            const Icon = config.icon;
            const isSelected = selectedMetrics.has(metric);
            
            return (
              <label
                key={metric}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newSelected = new Set(selectedMetrics);
                    if (e.target.checked) {
                      newSelected.add(metric);
                    } else {
                      newSelected.delete(metric);
                    }
                    setSelectedMetrics(newSelected);
                  }}
                  className="sr-only"
                />
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-sm font-medium">{config.label}</span>
              </label>
            );
          })}
        </div>

        {/* Alertas activas */}
        {showAlerts && Object.keys(activeAlerts).some(key => activeAlerts[key as VitalSignMetric]) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Alertas Activas</span>
            </div>
            <div className="space-y-1">
              {Object.entries(activeAlerts).map(([metric, isActive]) => {
                if (!isActive) return null;
                const config = METRIC_CONFIG[metric as VitalSignMetric];
                return (
                  <div key={metric} className="text-sm text-red-700">
                    • {config.label} fuera del rango normal ({config.normalRange.min}-{config.normalRange.max} {config.unit})
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContentCorporate>
    </CardCorporate>
  );
};