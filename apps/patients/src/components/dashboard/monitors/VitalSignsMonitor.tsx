'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect, useRef } from 'react';
import { VitalSigns } from '@altamedica/types';

interface VitalSignsMonitorProps {
  vitalSigns: VitalSigns;
  compact?: boolean;
  realTime?: boolean;
  showHistory?: boolean;
  showTrends?: boolean;
  onAlertTrigger?: (alert: any) => void;
}

const VitalSignsMonitor: React.FC<VitalSignsMonitorProps> = ({
  vitalSigns,
  compact = false,
  realTime = false,
  showHistory = false,
  showTrends = false,
  onAlertTrigger
}) => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('heartRate');
  const [isRecording, setIsRecording] = useState(false);
  const animationRef = useRef<number>(0);

  // Configuración de métricas vitales
  const vitalMetrics = [
    {
      id: 'heartRate',
      name: 'Frecuencia Cardíaca',
      icon: '❤️',
      unit: 'lpm',
      color: '#ef4444',
      normalRange: { min: 60, max: 100 },
      criticalRange: { min: 40, max: 180 },
      currentValue: vitalSigns.heartRate || 0,
      status: 'normal', // This needs to be calculated based on the value
      waveform: true
    },
    {
      id: 'bloodPressure',
      name: 'Presión Arterial',
      icon: '🩺',
      unit: 'mmHg',
      color: '#3b82f6',
      normalRange: { min: 90, max: 140 },
      currentValue: `${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic}`,
      systolic: vitalSigns.bloodPressureSystolic,
      diastolic: vitalSigns.bloodPressureDiastolic,
      status: 'normal' // This needs to be calculated
    },
    {
      id: 'oxygenSaturation',
      name: 'Saturación O₂',
      icon: '💨',
      unit: '%',
      color: '#10b981',
      normalRange: { min: 95, max: 100 },
      criticalRange: { min: 88, max: 100 },
      currentValue: vitalSigns.oxygenSaturation || 98,
      status: 'normal' // This needs to be calculated
    },
    {
      id: 'respiratoryRate',
      name: 'Frecuencia Respiratoria',
      icon: '🫁',
      unit: 'rpm',
      color: '#8b5cf6',
      normalRange: { min: 12, max: 20 },
      currentValue: vitalSigns.respiratoryRate || 16,
      status: 'normal' // This needs to be calculated
    },
    {
      id: 'temperature',
      name: 'Temperatura',
      icon: '🌡️',
      unit: '°C',
      color: '#f59e0b',
      normalRange: { min: 36.1, max: 37.2 },
      criticalRange: { min: 35, max: 40 },
      currentValue: vitalSigns.temperature?.value || 0,
      status: vitalSigns.temperature?.status || 'normal'
    },
    {
      id: 'glucose',
      name: 'Glucosa',
      icon: '🩸',
      unit: 'mg/dL',
      color: '#ec4899',
      normalRange: { min: 70, max: 140 },
      currentValue: vitalSigns.glucose?.value || 95,
      status: vitalSigns.glucose?.status || 'normal'
    }
  ];

  // Simulación de datos en tiempo real
  useEffect(() => {
    if (realTime && !compact) {
      const generateRealTimeData = () => {
        const now = new Date();
        const newDataPoint = {
          timestamp: now.toISOString(),
          time: now.toLocaleTimeString(),
          ...vitalMetrics.reduce((acc, metric) => {
            if (metric.id === 'bloodPressure') {
              acc[`${metric.id}_systolic`] = metric.systolic + (Math.random() - 0.5) * 5;
              acc[`${metric.id}_diastolic`] = metric.diastolic + (Math.random() - 0.5) * 3;
            } else {
              const baseValue = typeof metric.currentValue === 'number' ? metric.currentValue : 0;
              acc[metric.id] = baseValue + (Math.random() - 0.5) * 2;
            }
            return acc;
          }, {} as any)
        };

        setHistoricalData(prev => {
          const updated = [...prev, newDataPoint];
          return updated.slice(-60); // Mantener últimos 60 puntos
        });

        // Verificar alertas
        checkForAlerts(newDataPoint);
      };

      const interval = setInterval(generateRealTimeData, 1000);
      return () => clearInterval(interval);
    }
  }, [realTime, compact, vitalMetrics]);

  const checkForAlerts = (data: any) => {
    vitalMetrics.forEach(metric => {
      const value = data[metric.id];
      if (value && metric.criticalRange) {
        if (value < metric.criticalRange.min || value > metric.criticalRange.max) {
          onAlertTrigger?.({
            type: 'vital_sign_critical',
            metric: metric.name,
            value,
            timestamp: data.timestamp,
            severity: 'critical'
          });
        }
      }
    });
  };

  // Vista compacta
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Signos Vitales</h3>
        <div className="grid grid-cols-2 gap-3">
          {vitalMetrics.slice(0, 4).map((metric) => (
            <div 
              key={metric.id}
              className={`p-3 rounded-lg border ${
                metric.status === 'critical' 
                  ? 'border-red-300 bg-red-50' 
                  : metric.status === 'warning'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{metric.icon}</span>
                {metric.status !== 'normal' && (
                  <span className={`text-xs font-medium ${
                    metric.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {metric.status === 'critical' ? '⚠️' : '⚡'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1">{metric.name}</p>
              <p className="text-lg font-bold text-gray-900">
                {metric.currentValue}
                <span className="text-xs font-normal text-gray-600 ml-1">{metric.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista completa
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header con controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Monitor de Signos Vitales</h2>
            <p className="text-sm text-gray-600 mt-1">
              {realTime ? 'Monitoreo en tiempo real' : 'Última lectura'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {realTime && (
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{isRecording ? '⏹️' : '⏺️'}</span>
                {isRecording ? 'Detener' : 'Grabar'}
              </button>
            )}
            
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitalMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              isSelected={selectedMetric === metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              realTime={realTime}
            />
          ))}
        </div>
      </div>

      {/* Gráfico de tendencias */}
      {showTrends && historicalData.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendencia: {vitalMetrics.find(m => m.id === selectedMetric)?.name}
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            {/* Aquí iría el componente de gráfico real */}
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Gráfico de tendencias - {historicalData.length} puntos de datos</p>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {showHistory && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial Reciente</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {historicalData.slice(-10).reverse().map((data, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{data.time}</span>
                <div className="flex items-center space-x-4">
                  {vitalMetrics.slice(0, 3).map(metric => (
                    <span key={metric.id} className="text-sm">
                      <span className="text-gray-500">{metric.icon}</span>
                      <span className="ml-1 font-medium">
                        {data[metric.id]?.toFixed(0) || '--'} {metric.unit}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas activas */}
      {vitalSigns.hasAnomalies && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Anomalías detectadas en signos vitales
              </p>
              <p className="text-xs text-red-600 mt-1">
                Se requiere atención médica inmediata
              </p>
            </div>
            <button className="ml-4 text-red-600 hover:text-red-700 font-medium text-sm">
              Ver detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para cada métrica
const MetricCard: React.FC<{
  metric: any;
  isSelected: boolean;
  onClick: () => void;
  realTime: boolean;
}> = ({ metric, isSelected, onClick, realTime }) => {
  const [animatedValue, setAnimatedValue] = useState(metric.currentValue);

  useEffect(() => {
    if (realTime && typeof metric.currentValue === 'number') {
      const interval = setInterval(() => {
        setAnimatedValue((prev: any) => {
          const variance = (Math.random() - 0.5) * 2;
          return prev + variance;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [realTime, metric.currentValue]);

  const isInNormalRange = (value: number) => {
    return value >= metric.normalRange.min && value <= metric.normalRange.max;
  };

  const displayValue = realTime && typeof animatedValue === 'number' 
    ? animatedValue.toFixed(0) 
    : metric.currentValue;

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      } ${
        metric.status === 'critical' ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{metric.icon}</span>
        <div className={`w-2 h-2 rounded-full ${
          metric.status === 'normal' ? 'bg-green-500' :
          metric.status === 'warning' ? 'bg-yellow-500' :
          'bg-red-500 animate-pulse'
        }`}></div>
      </div>
      
      <div className="text-left">
        <p className="text-sm font-medium text-gray-700 mb-1">{metric.name}</p>
        <p className="text-2xl font-bold text-gray-900">
          {displayValue}
          <span className="text-sm font-normal text-gray-600 ml-1">{metric.unit}</span>
        </p>
        
        {/* Rango normal */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Rango normal</span>
            <span>{metric.normalRange.min}-{metric.normalRange.max}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${
                metric.status === 'normal' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, 
                  ((parseFloat(displayValue) - metric.normalRange.min) / 
                   (metric.normalRange.max - metric.normalRange.min)) * 100
                ))}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default VitalSignsMonitor; 