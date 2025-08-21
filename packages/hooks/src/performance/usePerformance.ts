/**
 * @fileoverview Hook innovador de performance monitoring
 * @module @altamedica/hooks/performance/usePerformance
 * @description Hook avanzado para monitoreo de performance en tiempo real
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// ==========================================
// TIPOS
// ==========================================

interface PerformanceMetrics {
  // Métricas de rendering
  renderCount: number;
  averageRenderTime: number;
  slowRenders: number;
  
  // Métricas de memoria
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercentage: number;
  
  // Métricas de red
  navigationTiming: PerformanceNavigationTiming | null;
  paintTiming: { fcp?: number; lcp?: number };
  
  // Web Vitals
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  
  // Métricas médicas específicas
  medicalDataLoadTime: number;
  hipaaComplianceOverhead: number;
  telemedicineLatency: number;
}

interface PerformanceAlert {
  type: 'memory' | 'render' | 'network' | 'vitals' | 'medical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  suggestions: string[];
}

interface PerformanceConfig {
  // Umbrales de alerta
  slowRenderThreshold: number;
  memoryThreshold: number;
  networkThreshold: number;
  
  // Configuración de monitoreo
  sampleRate: number;
  enableCLS: boolean;
  enableFID: boolean;
  enableLCP: boolean;
  
  // Configuración médica
  trackMedicalOperations: boolean;
  trackHIPAACompliance: boolean;
  trackTelemedicine: boolean;
  
  // Callbacks
  onAlert?: (alert: PerformanceAlert) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

interface UsePerformanceReturn {
  // Métricas actuales
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  
  // Controles
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
  
  // Medición manual
  measureOperation: <T>(name: string, operation: () => T | Promise<T>) => Promise<T>;
  measureMedicalOperation: <T>(operation: () => T | Promise<T>, context: MedicalContext) => Promise<T>;
  
  // Análisis
  getPerformanceScore: () => number;
  getOptimizationSuggestions: () => string[];
  exportMetrics: () => PerformanceReport;
  
  // Utilidades
  mark: (name: string) => void;
  measure: (name: string, startMark: string, endMark?: string) => number;
}

interface MedicalContext {
  operation: 'patient_load' | 'record_save' | 'telemedicine_start' | 'hipaa_encrypt';
  patientId?: string;
  dataSize?: number;
  requiresEncryption?: boolean;
}

interface PerformanceReport {
  timestamp: Date;
  sessionDuration: number;
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  score: number;
  suggestions: string[];
  medicalOperations: MedicalOperationMetric[];
}

interface MedicalOperationMetric {
  operation: string;
  count: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  hipaaCompliant: boolean;
}

// ==========================================
// CONFIGURACIÓN POR DEFECTO
// ==========================================

const DEFAULT_CONFIG: PerformanceConfig = {
  slowRenderThreshold: 16, // 16ms para 60fps
  memoryThreshold: 80, // 80% del heap
  networkThreshold: 2000, // 2 segundos
  sampleRate: 1, // 100% de las muestras
  enableCLS: true,
  enableFID: true,
  enableLCP: true,
  trackMedicalOperations: true,
  trackHIPAACompliance: true,
  trackTelemedicine: true
};

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook innovador para monitoreo de performance en aplicaciones médicas
 */
export function usePerformance(config: Partial<PerformanceConfig> = {}): UsePerformanceReturn {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // ==========================================
  // ESTADO
  // ==========================================
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => ({
    renderCount: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryUsagePercentage: 0,
    navigationTiming: null,
    paintTiming: {},
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    timeToInteractive: 0,
    medicalDataLoadTime: 0,
    hipaaComplianceOverhead: 0,
    telemedicineLatency: 0
  }));
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // ==========================================
  // REFS
  // ==========================================
  
  const observerRef = useRef<PerformanceObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderTimesRef = useRef<number[]>([]);
  const medicalOperationsRef = useRef<Map<string, MedicalOperationMetric>>(new Map());
  const sessionStartRef = useRef<Date>(new Date());
  const lastMemoryMeasureRef = useRef<number>(0);
  
  // ==========================================
  // WEB VITALS MONITORING
  // ==========================================
  
  const setupWebVitalsMonitoring = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;
    
    // Largest Contentful Paint (LCP)
    if (finalConfig.enableLCP) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        setMetrics(prev => ({
          ...prev,
          paintTiming: { ...prev.paintTiming, lcp: lastEntry.startTime }
        }));
        
        if (lastEntry.startTime > 2500) { // Umbral de LCP
          addAlert({
            type: 'vitals',
            severity: lastEntry.startTime > 4000 ? 'critical' : 'high',
            message: 'Largest Contentful Paint es demasiado lento',
            value: lastEntry.startTime,
            threshold: 2500,
            suggestions: [
              'Optimizar imágenes principales',
              'Usar lazy loading',
              'Minimizar JavaScript crítico',
              'Implementar preload para recursos importantes'
            ]
          });
        }
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        logger.warn('LCP observation failed:', error);
      }
    }
    
    // First Input Delay (FID)
    if (finalConfig.enableFID) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({
            ...prev,
            firstInputDelay: entry.processingStart - entry.startTime
          }));
          
          if (entry.processingStart - entry.startTime > 100) {
            addAlert({
              type: 'vitals',
              severity: 'high',
              message: 'First Input Delay es demasiado alto',
              value: entry.processingStart - entry.startTime,
              threshold: 100,
              suggestions: [
                'Reducir JavaScript de terceros',
                'Optimizar event handlers',
                'Usar Web Workers para procesamiento pesado',
                'Implementar code splitting'
              ]
            });
          }
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        logger.warn('FID observation failed:', error);
      }
    }
    
    // Cumulative Layout Shift (CLS)
    if (finalConfig.enableCLS) {
      let clsValue = 0;
      
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({
              ...prev,
              cumulativeLayoutShift: clsValue
            }));
            
            if (clsValue > 0.1) {
              addAlert({
                type: 'vitals',
                severity: clsValue > 0.25 ? 'critical' : 'high',
                message: 'Cumulative Layout Shift es demasiado alto',
                value: clsValue,
                threshold: 0.1,
                suggestions: [
                  'Especificar dimensiones para imágenes',
                  'Reservar espacio para contenido dinámico',
                  'Evitar insertar contenido arriba del fold',
                  'Usar transform y opacity para animaciones'
                ]
              });
            }
          }
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logger.warn('CLS observation failed:', error);
      }
    }
    
  }, [finalConfig]);
  
  // ==========================================
  // MEMORY MONITORING
  // ==========================================
  
  const monitorMemory = useCallback(() => {
    if (!('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    setMetrics(prev => ({
      ...prev,
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryUsagePercentage: memoryUsage
    }));
    
    // Alertas de memoria
    if (memoryUsage > finalConfig.memoryThreshold) {
      addAlert({
        type: 'memory',
        severity: memoryUsage > 90 ? 'critical' : 'high',
        message: `Uso de memoria alto: ${memoryUsage.toFixed(1)}%`,
        value: memoryUsage,
        threshold: finalConfig.memoryThreshold,
        suggestions: [
          'Liberar referencias no utilizadas',
          'Implementar lazy loading de componentes',
          'Usar React.memo para prevenir re-renders',
          'Verificar memory leaks en event listeners'
        ]
      });
    }
    
    // Detectar memory leaks
    const memoryIncrease = memory.usedJSHeapSize - lastMemoryMeasureRef.current;
    if (memoryIncrease > 10 * 1024 * 1024) { // 10MB de incremento
      addAlert({
        type: 'memory',
        severity: 'medium',
        message: 'Posible memory leak detectado',
        value: memoryIncrease,
        threshold: 10 * 1024 * 1024,
        suggestions: [
          'Verificar closures que mantengan referencias',
          'Limpiar timers y intervals',
          'Remover event listeners al desmontar componentes',
          'Usar WeakMap/WeakSet cuando sea apropiado'
        ]
      });
    }
    
    lastMemoryMeasureRef.current = memory.usedJSHeapSize;
  }, [finalConfig.memoryThreshold]);
  
  // ==========================================
  // RENDER PERFORMANCE
  // ==========================================
  
  const measureRenderPerformance = useCallback((renderTime: number) => {
    renderTimesRef.current.push(renderTime);
    
    // Mantener solo las últimas 100 mediciones
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100);
    }
    
    const average = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
    const slowRenders = renderTimesRef.current.filter(time => time > finalConfig.slowRenderThreshold).length;
    
    setMetrics(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      averageRenderTime: average,
      slowRenders: slowRenders
    }));
    
    // Alerta por render lento
    if (renderTime > finalConfig.slowRenderThreshold) {
      addAlert({
        type: 'render',
        severity: renderTime > 33 ? 'high' : 'medium', // 33ms = ~30fps
        message: `Render lento detectado: ${renderTime.toFixed(2)}ms`,
        value: renderTime,
        threshold: finalConfig.slowRenderThreshold,
        suggestions: [
          'Optimizar con React.memo',
          'Usar useMemo para cálculos costosos',
          'Implementar virtualization para listas largas',
          'Dividir componentes grandes'
        ]
      });
    }
  }, [finalConfig.slowRenderThreshold]);
  
  // ==========================================
  // MEDICAL OPERATIONS TRACKING
  // ==========================================
  
  const measureMedicalOperation = useCallback(async <T>(
    operation: () => T | Promise<T>,
    context: MedicalContext
  ): Promise<T> => {
    if (!finalConfig.trackMedicalOperations) {
      return await operation();
    }
    
    const startTime = performance.now();
    const startMark = `medical_${context.operation}_start_${Date.now()}`;
    performance.mark(startMark);
    
    try {
      const result = await operation();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Actualizar métricas específicas médicas
      switch (context.operation) {
        case 'patient_load':
          setMetrics(prev => ({
            ...prev,
            medicalDataLoadTime: duration
          }));
          break;
          
        case 'hipaa_encrypt':
          setMetrics(prev => ({
            ...prev,
            hipaaComplianceOverhead: prev.hipaaComplianceOverhead + duration
          }));
          break;
          
        case 'telemedicine_start':
          setMetrics(prev => ({
            ...prev,
            telemedicineLatency: duration
          }));
          break;
      }
      
      // Actualizar estadísticas de operación
      const existing = medicalOperationsRef.current.get(context.operation) || {
        operation: context.operation,
        count: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        hipaaCompliant: context.requiresEncryption || false
      };
      
      existing.count++;
      existing.averageTime = (existing.averageTime * (existing.count - 1) + duration) / existing.count;
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.minTime = Math.min(existing.minTime, duration);
      
      medicalOperationsRef.current.set(context.operation, existing);
      
      // Alertas específicas médicas
      if (duration > 3000 && context.operation === 'patient_load') {
        addAlert({
          type: 'medical',
          severity: 'high',
          message: 'Carga de datos del paciente muy lenta',
          value: duration,
          threshold: 3000,
          suggestions: [
            'Implementar caching de datos médicos',
            'Optimizar consultas a la base de datos',
            'Usar paginación para historiales largos',
            'Comprimir datos PHI de forma segura'
          ]
        });
      }
      
      return result;
      
    } catch (error) {
      // Medir tiempo de operaciones fallidas también
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      addAlert({
        type: 'medical',
        severity: 'critical',
        message: `Error en operación médica: ${context.operation}`,
        value: duration,
        threshold: 0,
        suggestions: [
          'Verificar conectividad con sistemas médicos',
          'Validar integridad de datos PHI',
          'Revisar permisos HIPAA',
          'Implementar fallback para operaciones críticas'
        ]
      });
      
      throw error;
    }
  }, [finalConfig.trackMedicalOperations]);
  
  // ==========================================
  // UTILIDADES
  // ==========================================
  
  const addAlert = useCallback((alert: Omit<PerformanceAlert, 'timestamp'>) => {
    const fullAlert: PerformanceAlert = {
      ...alert,
      timestamp: new Date()
    };
    
    setAlerts(prev => [fullAlert, ...prev.slice(0, 49)]); // Máximo 50 alertas
    
    // Callback de configuración
    finalConfig.onAlert?.(fullAlert);
  }, [finalConfig]);
  
  const measureOperation = useCallback(async <T>(
    name: string,
    operation: () => T | Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    performance.mark(`${name}_start`);
    
    try {
      const result = await operation();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
      
      return result;
    } catch (error) {
      performance.mark(`${name}_error`);
      throw error;
    }
  }, []);
  
  const mark = useCallback((name: string) => {
    performance.mark(name);
  }, []);
  
  const measure = useCallback((name: string, startMark: string, endMark?: string): number => {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, 'measure');
    return entries.length > 0 ? entries[entries.length - 1].duration : 0;
  }, []);
  
  const getPerformanceScore = useCallback((): number => {
    let score = 100;
    
    // Penalizar por alertas
    alerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    // Penalizar por métricas específicas
    if (metrics.memoryUsagePercentage > 80) score -= 15;
    if (metrics.averageRenderTime > 16) score -= 10;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (metrics.firstInputDelay > 100) score -= 10;
    
    return Math.max(0, score);
  }, [metrics, alerts]);
  
  const getOptimizationSuggestions = useCallback((): string[] => {
    const suggestions = new Set<string>();
    
    alerts.forEach(alert => {
      alert.suggestions.forEach(suggestion => suggestions.add(suggestion));
    });
    
    // Sugerencias generales basadas en métricas
    if (metrics.memoryUsagePercentage > 70) {
      suggestions.add('Optimizar gestión de memoria');
    }
    
    if (metrics.slowRenders > 10) {
      suggestions.add('Optimizar componentes que renderizan lento');
    }
    
    if (medicalOperationsRef.current.size > 0) {
      suggestions.add('Revisar performance de operaciones médicas');
    }
    
    return Array.from(suggestions);
  }, [metrics, alerts]);
  
  const exportMetrics = useCallback((): PerformanceReport => {
    return {
      timestamp: new Date(),
      sessionDuration: Date.now() - sessionStartRef.current.getTime(),
      metrics,
      alerts,
      score: getPerformanceScore(),
      suggestions: getOptimizationSuggestions(),
      medicalOperations: Array.from(medicalOperationsRef.current.values())
    };
  }, [metrics, alerts, getPerformanceScore, getOptimizationSuggestions]);
  
  // ==========================================
  // CONTROLES
  // ==========================================
  
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    sessionStartRef.current = new Date();
    
    // Setup Web Vitals monitoring
    setupWebVitalsMonitoring();
    
    // Setup memory monitoring
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(monitorMemory, 5000); // Cada 5 segundos
    
    // Medir navigation timing inicial
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        setMetrics(prev => ({
          ...prev,
          navigationTiming: navEntries[0]
        }));
      }
    }
    
  }, [isMonitoring, setupWebVitalsMonitoring, monitorMemory]);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);
  
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);
  
  // ==========================================
  // EFECTOS
  // ==========================================
  
  // Auto-start monitoring
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);
  
  // Callback de métricas
  useEffect(() => {
    finalConfig.onMetricsUpdate?.(metrics);
  }, [metrics, finalConfig]);
  
  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    // Estado
    metrics,
    alerts,
    isMonitoring,
    
    // Controles
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    
    // Medición
    measureOperation,
    measureMedicalOperation,
    
    // Análisis
    getPerformanceScore,
    getOptimizationSuggestions,
    exportMetrics,
    
    // Utilidades
    mark,
    measure
  };
}