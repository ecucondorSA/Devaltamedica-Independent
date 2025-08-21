"use client";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from '@altamedica/ui';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Network,
  XCircle,
  Zap
} from 'lucide-react';
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Switch local mínimo para evitar depender de UI inexistente
type SwitchProps = { checked: boolean; onCheckedChange: (checked: boolean) => void };
const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange }) => (
  <label className="inline-flex items-center cursor-pointer select-none">
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
    <span className={`relative inline-block h-5 w-9 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </span>
  </label>
);

// Lazy load components
const TelemedicineCall = lazy(() => import('../telemedicine/TelemedicineCall'));
const TelemedicineDashboard = lazy(() => import('../dashboard/TelemedicineDashboard'));

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    quality: 'excellent' | 'good' | 'poor';
  };
  cpu: {
    usage: number;
    temperature: number;
  };
  battery: {
    level: number;
    charging: boolean;
  };
  telemedicine: {
    videoQuality: 'high' | 'medium' | 'low';
    audioQuality: 'high' | 'medium' | 'low';
    connectionStability: number;
    packetLoss: number;
  };
}

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  enableMemoization: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  videoQuality: 'high' | 'medium' | 'low';
  audioQuality: 'high' | 'medium' | 'low';
  autoOptimize: boolean;
}

export default function PerformanceOptimizer() {
  // Toast no-op para evitar dependencia ausente
  const toast = useCallback((..._args: any[]) => {}, []);
  
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [settings, setSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableVirtualization: true,
    enableMemoization: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    enableCompression: true,
    enableCaching: true,
    videoQuality: 'medium',
    audioQuality: 'medium',
    autoOptimize: true
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Inicializar monitoreo de rendimiento
  useEffect(() => {
    if (isMonitoring) {
      startPerformanceMonitoring();
    } else {
      stopPerformanceMonitoring();
    }

    return () => {
      stopPerformanceMonitoring();
    };
  }, [isMonitoring]);

  // Monitoreo automático de rendimiento
  // (efecto de auto-optimización movido más abajo para declarar dependencias primero)

  // Iniciar monitoreo de rendimiento
  const startPerformanceMonitoring = () => {
    // Monitoreo de FPS
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        updateMetrics({ fps });
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Monitoreo de memoria
    if ('memory' in performance) {
      const memoryInterval = setInterval(() => {
        const memory = (performance as any).memory;
        updateMetrics({
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
          }
        });
      }, 2000);

      monitoringIntervalRef.current = memoryInterval;
    }

    // Performance Observer para métricas web
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            updateMetrics({
              network: {
                latency: Math.round(navEntry.responseEnd - navEntry.requestStart),
                bandwidth: calculateBandwidth(navEntry),
                quality: getNetworkQuality(navEntry.responseEnd - navEntry.requestStart)
              }
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      performanceObserverRef.current = observer;
    }

    // Monitoreo de batería
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          updateMetrics({
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging
            }
          });
        };

        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        updateBattery();
      });
    }

    // Monitoreo de CPU (simulado)
    const cpuInterval = setInterval(() => {
      const cpuUsage = Math.random() * 100;
      updateMetrics({
        cpu: {
          usage: Math.round(cpuUsage),
          temperature: Math.round(30 + cpuUsage * 0.5)
        }
      });
    }, 5000);

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    monitoringIntervalRef.current = cpuInterval;
  };

  // Detener monitoreo
  const stopPerformanceMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
      performanceObserverRef.current = null;
    }
  };

  // Actualizar métricas
  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => prev ? { ...prev, ...newMetrics } : null);
  }, []);

  // Calcular ancho de banda
  const calculateBandwidth = (navEntry: PerformanceNavigationTiming) => {
    const transferSize = navEntry.transferSize || 0;
    const duration = navEntry.responseEnd - navEntry.requestStart;
    return duration > 0 ? Math.round(transferSize / duration) : 0;
  };

  // Obtener calidad de red
  const getNetworkQuality = (latency: number): 'excellent' | 'good' | 'poor' => {
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    return 'poor';
  };

  // Verificar rendimiento y optimizar automáticamente
  const checkPerformanceAndOptimize = useCallback(() => {
    if (!metrics) return;

    const optimizations: string[] = [];

    // Optimizar calidad de video si FPS es bajo
    if (metrics.fps < 30 && settings.videoQuality !== 'low') {
      optimizations.push('Reduciendo calidad de video para mejorar FPS');
      setSettings(prev => ({ ...prev, videoQuality: 'low' }));
    }

    // Optimizar si uso de memoria es alto
    if (metrics.memory.percentage > 80) {
      optimizations.push('Limpieza de memoria automática');
      if ('gc' in window) {
        (window as any).gc();
      }
    }

    // Optimizar si latencia de red es alta
    if (metrics.network.latency > 500) {
      optimizations.push('Activando compresión de datos');
      setSettings(prev => ({ ...prev, enableCompression: true }));
    }

    if (optimizations.length > 0) {
      setOptimizationHistory(prev => [
        {
          timestamp: new Date(),
          optimizations,
          metrics: { ...metrics }
        },
        ...prev.slice(0, 9)
      ]);

      toast({
        title: 'Optimización automática',
        description: `Aplicadas ${optimizations.length} optimizaciones`,
      });
    }
  }, [metrics, settings, toast]);

  // Monitoreo automático de rendimiento (intervalo periódico)
  useEffect(() => {
    let interval: number | undefined;
    if (settings.autoOptimize) {
      interval = window.setInterval(() => {
        checkPerformanceAndOptimize();
      }, 30000);
    }
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [settings.autoOptimize, checkPerformanceAndOptimize]);

  // Optimización manual
  const performManualOptimization = useCallback(() => {
    const optimizations: string[] = [];

    // Limpiar cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        optimizations.push('Cache limpiado');
      });
    }

    // Forzar garbage collection
    if ('gc' in window) {
      (window as any).gc();
      optimizations.push('Garbage collection forzado');
    }

    // Optimizar imágenes
    if (settings.enableImageOptimization) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.loading !== 'lazy') {
          img.loading = 'lazy';
        }
      });
      optimizations.push('Imágenes optimizadas');
    }

    // Actualizar historial
    setOptimizationHistory(prev => [
      {
        timestamp: new Date(),
        optimizations,
        type: 'manual'
      },
      ...prev.slice(0, 9)
    ]);

    toast({
      title: 'Optimización manual completada',
      description: `Aplicadas ${optimizations.length} optimizaciones`,
    });
  }, [settings.enableImageOptimization, toast]);

  // Memoizar componentes pesados
  const MemoizedTelemedicineCall = useMemo(() => {
    return React.memo(TelemedicineCall);
  }, []);

  const MemoizedDashboard = useMemo(() => {
    return React.memo(TelemedicineDashboard);
  }, []);

  // Optimizar configuración de telemedicina
  const optimizeTelemedicineSettings = useCallback(() => {
    if (!metrics) return;

    const newSettings = { ...settings };

    // Ajustar calidad de video basado en FPS
    if (metrics.fps < 25) {
      newSettings.videoQuality = 'low';
    } else if (metrics.fps < 45) {
      newSettings.videoQuality = 'medium';
    } else {
      newSettings.videoQuality = 'high';
    }

    // Ajustar calidad de audio basado en latencia
    if (metrics.network.latency > 300) {
      newSettings.audioQuality = 'low';
    } else if (metrics.network.latency > 150) {
      newSettings.audioQuality = 'medium';
    } else {
      newSettings.audioQuality = 'high';
    }

    setSettings(newSettings);

    toast({
      title: 'Configuración optimizada',
      description: 'Ajustes de telemedicina optimizados automáticamente',
    });
  }, [metrics, settings, toast]);

  // Obtener color de estado
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Obtener icono de estado
  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value <= thresholds.warning) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Optimizador de Rendimiento</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo y optimización automática del sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={isMonitoring}
            onCheckedChange={setIsMonitoring}
          />
          <span className="text-sm">Monitoreo en tiempo real</span>
          <Button onClick={performManualOptimization} variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Optimizar Ahora
          </Button>
        </div>
      </div>

      {/* Métricas en tiempo real */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FPS</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.fps}</div>
              <Progress value={Math.min(metrics.fps, 60)} max={60} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.fps >= 60 ? 'Excelente' : metrics.fps >= 30 ? 'Bueno' : 'Necesita optimización'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memoria</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.memory.percentage}%</div>
              <Progress value={metrics.memory.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.memory.used}MB / {metrics.memory.total}MB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latencia</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.network.latency}ms</div>
              <div className="flex items-center mt-2">
                {getStatusIcon(metrics.network.latency, { good: 100, warning: 300 })}
                <span className={`text-sm ml-1 ${getStatusColor(metrics.network.latency, { good: 100, warning: 300 })}`}>
                  {metrics.network.quality}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cpu.usage}%</div>
              <Progress value={metrics.cpu.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.cpu.temperature}°C
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuración de optimización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Optimizaciones Automáticas</CardTitle>
            <CardDescription>
              Configuración de optimizaciones automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Carga diferida</p>
                <p className="text-xs text-gray-600">Cargar componentes bajo demanda</p>
              </div>
              <Switch
                checked={settings.enableLazyLoading}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableLazyLoading: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Virtualización</p>
                <p className="text-xs text-gray-600">Optimizar listas largas</p>
              </div>
              <Switch
                checked={settings.enableVirtualization}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableVirtualization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Memoización</p>
                <p className="text-xs text-gray-600">Evitar re-renders innecesarios</p>
              </div>
              <Switch
                checked={settings.enableMemoization}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableMemoization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Optimización de imágenes</p>
                <p className="text-xs text-gray-600">Carga lazy y compresión</p>
              </div>
              <Switch
                checked={settings.enableImageOptimization}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableImageOptimization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Optimización automática</p>
                <p className="text-xs text-gray-600">Ajustar configuración automáticamente</p>
              </div>
              <Switch
                checked={settings.autoOptimize}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoOptimize: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Telemedicina</CardTitle>
            <CardDescription>
              Optimización específica para sesiones de video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Calidad de video</label>
              <select
                value={settings.videoQuality}
                onChange={(e) => setSettings(prev => ({ ...prev, videoQuality: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="high">Alta (1080p)</option>
                <option value="medium">Media (720p)</option>
                <option value="low">Baja (480p)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Calidad de audio</label>
              <select
                value={settings.audioQuality}
                onChange={(e) => setSettings(prev => ({ ...prev, audioQuality: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="high">Alta (48kHz)</option>
                <option value="medium">Media (44.1kHz)</option>
                <option value="low">Baja (22kHz)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compresión de datos</p>
                <p className="text-xs text-gray-600">Reducir ancho de banda</p>
              </div>
              <Switch
                checked={settings.enableCompression}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCompression: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Cache de sesiones</p>
                <p className="text-xs text-gray-600">Almacenar datos de sesión</p>
              </div>
              <Switch
                checked={settings.enableCaching}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCaching: checked }))}
              />
            </div>

            <Button onClick={optimizeTelemedicineSettings} className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Optimizar Telemedicina
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historial de optimizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Optimizaciones</CardTitle>
          <CardDescription>
            Últimas optimizaciones aplicadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {optimizationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay optimizaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {optimizationHistory.map((entry, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {entry.timestamp.toLocaleString()}
                    </p>
                    <div className="mt-1">
                      {entry.optimizations.map((opt: string, optIndex: number) => (
                        <Badge key={optIndex} variant="secondary" className="mr-2 mb-1">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Componentes optimizados */}
      {showAdvanced && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Componentes Optimizados</CardTitle>
              <CardDescription>
                Componentes con optimizaciones aplicadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Cargando componentes...</div>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Telemedicina (Lazy Loaded)</h4>
                    <MemoizedTelemedicineCall
                      sessionId="demo"
                      roomId="demo-room"
                      onEndCall={() => {}}
                    />
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Dashboard (Memoized)</h4>
                    <MemoizedDashboard />
                  </div>
                </div>
              </Suspense>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón para mostrar/ocultar avanzado */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Ocultar' : 'Mostrar'} Configuración Avanzada
        </Button>
      </div>
    </div>
  );
} 