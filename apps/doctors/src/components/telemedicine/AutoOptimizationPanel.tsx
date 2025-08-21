'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { Progress } from '@altamedica/ui';
import { 
  Settings, 
  Zap, 
  Wifi, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  WifiOff,
  WifiIcon
} from 'lucide-react';
import { useAutoOptimizer, NetworkMetrics } from '../services/AutoOptimizer';

import { logger } from '@altamedica/shared/services/logger.service';
interface AutoOptimizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMetrics?: NetworkMetrics;
}

export default function AutoOptimizationPanel({ 
  isOpen, 
  onClose, 
  currentMetrics 
}: AutoOptimizationPanelProps) {
  const { optimizer, analyzeAndOptimize, getOptimizationRecommendations, getPerformanceStats } = useAutoOptimizer();
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (currentMetrics && isOpen) {
      analyzeMetrics();
    }
  }, [currentMetrics, isOpen]);

  const analyzeMetrics = async () => {
    if (!currentMetrics) return;

    setIsAnalyzing(true);
    
    try {
      const result = analyzeAndOptimize(currentMetrics);
      setOptimizationResult(result);
      
      const recs = getOptimizationRecommendations();
      setRecommendations(recs);
      
      const stats = getPerformanceStats();
      setPerformanceStats(stats);
    } catch (error) {
      logger.error('Error en análisis de optimización:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      default: return <WifiIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Optimización Automática</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>

          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analizando rendimiento de la conexión...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de Estado Actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Estado Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentMetrics && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentMetrics.latency}ms
                          </div>
                          <div className="text-xs text-gray-600">Latencia</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {currentMetrics.fps}
                          </div>
                          <div className="text-xs text-gray-600">FPS</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {(currentMetrics.packetLoss * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Pérdida</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(currentMetrics.bandwidth / 1000)}Mbps
                          </div>
                          <div className="text-xs text-gray-600">Ancho de Banda</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Calidad de Conexión:</span>
                          <div className="flex items-center gap-2">
                            {getQualityIcon(optimizationResult?.recommendedProfile === 'high' ? 'excellent' : 'good')}
                            <span className={`text-sm font-medium ${getQualityColor(optimizationResult?.recommendedProfile === 'high' ? 'excellent' : 'good')}`}>
                              {optimizationResult?.recommendedProfile === 'high' ? 'Excelente' : 'Buena'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Perfil Actual:</span>
                          <Badge variant="outline">
                            {performanceStats?.profileInfo?.name || 'HD'}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Optimizaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Optimizaciones Aplicadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {optimizationResult?.optimizations.length > 0 ? (
                    <div className="space-y-2">
                      {optimizationResult.optimizations.map((opt: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p>No se requieren optimizaciones</p>
                    </div>
                  )}

                  {optimizationResult?.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-800">Advertencias:</h4>
                      {optimizationResult.warnings.map((warning: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-orange-800">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Recomendaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations?.immediate.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">Inmediatas:</h4>
                      <div className="space-y-1">
                        {recommendations.immediate.map((rec: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations?.suggested.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-800 mb-2">Sugeridas:</h4>
                      <div className="space-y-1">
                        {recommendations.suggested.map((rec: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-orange-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations?.longTerm.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">A Largo Plazo:</h4>
                      <div className="space-y-1">
                        {recommendations.longTerm.map((rec: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!recommendations?.immediate.length && !recommendations?.suggested.length && !recommendations?.longTerm.length) && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p>No se requieren recomendaciones</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Estadísticas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceStats && (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Optimizaciones aplicadas:</span>
                          <Badge variant="outline">{performanceStats.optimizationCount}</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Última optimización:</span>
                          <span className="text-sm text-gray-800">
                            {performanceStats.lastOptimization ? 
                              performanceStats.lastOptimization.toLocaleTimeString() : 
                              'Nunca'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-gray-800 mb-2">Configuración Actual:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Resolución:</span>
                            <span className="text-gray-800">
                              {performanceStats.profileInfo?.video.width}x{performanceStats.profileInfo?.video.height}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Frame Rate:</span>
                            <span className="text-gray-800">
                              {performanceStats.profileInfo?.video.frameRate} FPS
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bitrate:</span>
                            <span className="text-gray-800">
                              {performanceStats.profileInfo?.video.bitrate} Kbps
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Codec:</span>
                            <span className="text-gray-800">
                              {performanceStats.profileInfo?.codec.video}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                La optimización automática está activa y se ajusta en tiempo real
              </div>
              <Button onClick={analyzeMetrics} disabled={isAnalyzing}>
                <Activity className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analizando...' : 'Reanalizar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 