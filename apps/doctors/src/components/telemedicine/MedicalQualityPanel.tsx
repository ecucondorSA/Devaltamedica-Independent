'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { Progress } from '@altamedica/ui';
import { 
  Stethoscope, 
  Heart, 
  Thermometer, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  Shield,
  Clock,
  TrendingUp,
  User,
  Eye,
  Ear,
  Zap,
  Settings
} from 'lucide-react';

interface MedicalQualityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MedicalMetrics {
  audioQuality: 'excellent' | 'good' | 'poor';
  videoQuality: 'excellent' | 'good' | 'poor';
  diagnosticClarity: 'excellent' | 'good' | 'poor';
  connectionStability: 'excellent' | 'good' | 'poor';
  sessionDuration: number;
  patientComfort: 'excellent' | 'good' | 'poor';
}

export default function MedicalQualityPanel({ 
  isOpen, 
  onClose 
}: MedicalQualityPanelProps) {
  const [medicalMetrics, setMedicalMetrics] = useState<MedicalMetrics>({
    audioQuality: 'excellent',
    videoQuality: 'excellent',
    diagnosticClarity: 'excellent',
    connectionStability: 'excellent',
    sessionDuration: 0,
    patientComfort: 'excellent'
  });

  const [optimizationStatus, setOptimizationStatus] = useState({
    audioOptimized: true,
    videoOptimized: true,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true
  });

  useEffect(() => {
    if (isOpen) {
      // Simular métricas médicas en tiempo real
      const interval = setInterval(() => {
        setMedicalMetrics(prev => ({
          ...prev,
          sessionDuration: prev.sessionDuration + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Calidad Médica</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Calidad de Diagnóstico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Calidad de Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Claridad Visual:</span>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(medicalMetrics.videoQuality)}
                      <span className={`text-sm font-medium ${getQualityColor(medicalMetrics.videoQuality)}`}>
                        {medicalMetrics.videoQuality === 'excellent' ? 'Excelente' : 
                         medicalMetrics.videoQuality === 'good' ? 'Buena' : 'Pobre'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Claridad Auditiva:</span>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(medicalMetrics.audioQuality)}
                      <span className={`text-sm font-medium ${getQualityColor(medicalMetrics.audioQuality)}`}>
                        {medicalMetrics.audioQuality === 'excellent' ? 'Excelente' : 
                         medicalMetrics.audioQuality === 'good' ? 'Buena' : 'Pobre'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Capacidad Diagnóstica:</span>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(medicalMetrics.diagnosticClarity)}
                      <Badge variant="outline" className={getQualityColor(medicalMetrics.diagnosticClarity)}>
                        {medicalMetrics.diagnosticClarity === 'excellent' ? 'Óptima' : 
                         medicalMetrics.diagnosticClarity === 'good' ? 'Adecuada' : 'Limitada'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Optimizaciones Médicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Optimizaciones Médicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ear className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Supresión de Ruidos</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Activa</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Cancelación de Eco</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Activa</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Control Automático de Ganancia</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Activo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">Filtros Médicos Especializados</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600">Aplicados</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Estado de la Sesión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Estado de la Sesión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duración de Consulta:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatDuration(medicalMetrics.sessionDuration)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estabilidad de Conexión:</span>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(medicalMetrics.connectionStability)}
                      <span className={`text-sm font-medium ${getQualityColor(medicalMetrics.connectionStability)}`}>
                        {medicalMetrics.connectionStability === 'excellent' ? 'Excelente' : 
                         medicalMetrics.connectionStability === 'good' ? 'Buena' : 'Inestable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Comodidad del Paciente:</span>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(medicalMetrics.patientComfort)}
                      <span className={`text-sm font-medium ${getQualityColor(medicalMetrics.patientComfort)}`}>
                        {medicalMetrics.patientComfort === 'excellent' ? 'Excelente' : 
                         medicalMetrics.patientComfort === 'good' ? 'Buena' : 'Pobre'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Recomendaciones Médicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Recomendaciones Médicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Calidad Óptima</span>
                    </div>
                    <p className="text-xs text-green-700">
                      La calidad de audio y video es excelente para diagnóstico médico.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Diagnóstico Visual</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Resolución Full HD permite evaluar detalles clínicos importantes.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Ear className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Auscultación</span>
                    </div>
                    <p className="text-xs text-purple-700">
                      Audio de alta calidad permite auscultación cardíaca y pulmonar.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Mantener Calidad</span>
                    </div>
                    <p className="text-xs text-orange-700">
                      Evitar cambios de configuración durante la consulta médica.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Calidad médica optimizada automáticamente para diagnóstico
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Reporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 