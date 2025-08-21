// Sistema de Monitoreo de Performance en Tiempo Real - Altamedica
// Real-time metrics + Medical compliance + Performance analytics

'use client'

import React, { useRef, useState, useEffect, useCallback, memo } from 'react'

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
// Tipos para métricas de performance
interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  
  // Métricas específicas de aplicación médica
  apiResponseTime: Record<string, number[]>
  componentRenderTime: Record<string, number[]>
  cacheHitRate: Record<string, number>
  errorRate: Record<string, number>
  
  // Métricas de recursos
  memoryUsage: number
  networkLatency: number
  bundleSize: number
  
  // Métricas de usuario médico
  pageLoadTime: number
  timeToInteractive: number
  medicalWorkflowCompletionTime: Record<string, number[]>
  
  // Timestamps
  sessionStart: number
  lastUpdate: number
}

interface MedicalPerformanceConfig {
  enableRealTimeMonitoring: boolean
  enableWebVitals: boolean
  enableApiMetrics: boolean
  enableErrorTracking: boolean
  reportingInterval: number // ms
  maxMetricsHistory: number
  medicalWorkflows: string[]
  performanceThresholds: {
    lcp: number // ms
    fid: number // ms
    cls: number
    apiResponse: number // ms
    errorRate: number // %
  }
}

// Configuración por defecto optimizada para aplicaciones médicas
const DEFAULT_CONFIG: MedicalPerformanceConfig = {
  enableRealTimeMonitoring: true,
  enableWebVitals: true,
  enableApiMetrics: true,
  enableErrorTracking: true,
  reportingInterval: 10000, // 10 segundos
  maxMetricsHistory: 100,
  medicalWorkflows: [
    'patient_search',
    'appointment_booking',
    'medical_record_access',
    'prescription_creation',
    'telemedicine_session'
  ],
  performanceThresholds: {
    lcp: 2500, // 2.5 segundos
    fid: 100,  // 100ms
    cls: 0.1,  // 10%
    apiResponse: 1000, // 1 segundo
    errorRate: 1 // 1%
  }
}

// Singleton para gestión de métricas globales
class MedicalPerformanceMonitor {
  private static instance: MedicalPerformanceMonitor
  private metrics: PerformanceMetrics
  private config: MedicalPerformanceConfig
  private observers: Map<string, any>
  private reportingInterval: NodeJS.Timeout | null = null
  private workflowTimers: Map<string, number> = new Map()

  constructor(config: MedicalPerformanceConfig = DEFAULT_CONFIG) {
    this.config = config
    this.metrics = this.initializeMetrics()
    this.observers = new Map()
    
    if (typeof window !== 'undefined') {
      this.setupPerformanceObservers()
      this.startReporting()
    }
  }

  static getInstance(config?: MedicalPerformanceConfig): MedicalPerformanceMonitor {
    if (!MedicalPerformanceMonitor.instance) {
      MedicalPerformanceMonitor.instance = new MedicalPerformanceMonitor(config)
    }
    return MedicalPerformanceMonitor.instance
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      apiResponseTime: {},
      componentRenderTime: {},
      cacheHitRate: {},
      errorRate: {},
      memoryUsage: 0,
      networkLatency: 0,
      bundleSize: 0,
      pageLoadTime: 0,
      timeToInteractive: 0,
      medicalWorkflowCompletionTime: {},
      sessionStart: Date.now(),
      lastUpdate: Date.now()
    }
  }

  private setupPerformanceObservers(): void {
    // Observer para Web Vitals
    if (this.config.enableWebVitals && 'PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.metrics.lcp = lastEntry.startTime
        this.updateMetrics()
      })
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)
      } catch (e) {
        logger.warn('[MEDICAL-PERFORMANCE] LCP observer not supported')
      }

      // FCP Observer
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime
          this.updateMetrics()
        }
      })
      
      try {
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('fcp', fcpObserver)
      } catch (e) {
        logger.warn('[MEDICAL-PERFORMANCE] FCP observer not supported')
      }

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries() as any[]
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.metrics.cls = clsValue
        this.updateMetrics()
      })
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)
      } catch (e) {
        logger.warn('[MEDICAL-PERFORMANCE] CLS observer not supported')
      }

      // Navigation Observer
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[]
        const navEntry = entries[0]
        
        if (navEntry) {
          this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart
          this.metrics.timeToInteractive = navEntry.domInteractive - navEntry.fetchStart
          this.updateMetrics()
        }
      })
      
      try {
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (e) {
        logger.warn('[MEDICAL-PERFORMANCE] Navigation observer not supported')
      }
    }

    // Monitorear memoria si está disponible
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory
        this.metrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize
        this.updateMetrics()
      }, 5000)
    }
  }

  private startReporting(): void {
    if (this.config.enableRealTimeMonitoring) {
      this.reportingInterval = setInterval(() => {
        this.generatePerformanceReport()
      }, this.config.reportingInterval)
    }
  }

  private updateMetrics(): void {
    this.metrics.lastUpdate = Date.now()
  }

  private generatePerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.metrics.sessionStart,
      metrics: { ...this.metrics },
      thresholds: this.config.performanceThresholds,
      violations: this.checkThresholdViolations()
    }

    // Log para monitoreo médico
    logger.info('[MEDICAL-PERFORMANCE-REPORT]', report)

    // Enviar a sistema de monitoreo (implementar según necesidades)
    this.sendToMonitoringSystem(report)
  }

  private checkThresholdViolations(): string[] {
    const violations: string[] = []
    const { performanceThresholds } = this.config

    if (this.metrics.lcp && this.metrics.lcp > performanceThresholds.lcp) {
      violations.push(`LCP excede threshold: ${this.metrics.lcp}ms > ${performanceThresholds.lcp}ms`)
    }

    if (this.metrics.fid && this.metrics.fid > performanceThresholds.fid) {
      violations.push(`FID excede threshold: ${this.metrics.fid}ms > ${performanceThresholds.fid}ms`)
    }

    if (this.metrics.cls && this.metrics.cls > performanceThresholds.cls) {
      violations.push(`CLS excede threshold: ${this.metrics.cls} > ${performanceThresholds.cls}`)
    }

    return violations
  }

  private sendToMonitoringSystem(report: any): void {
    // Implementar envío a sistema de monitoreo médico
    // Por ahora, solo logging
    if (report.violations.length > 0) {
      logger.warn('[MEDICAL-PERFORMANCE-ALERT] Performance violations detected:', report.violations)
    }
  }

  // Métodos públicos

  recordApiCall(endpoint: string, duration: number, success: boolean): void {
    if (!this.config.enableApiMetrics) return

    // Registrar tiempo de respuesta
    if (!this.metrics.apiResponseTime[endpoint]) {
      this.metrics.apiResponseTime[endpoint] = []
    }
    
    this.metrics.apiResponseTime[endpoint].push(duration)
    
    // Mantener solo las últimas métricas
    if (this.metrics.apiResponseTime[endpoint].length > this.config.maxMetricsHistory) {
      this.metrics.apiResponseTime[endpoint].shift()
    }

    // Registrar errores
    if (!success) {
      if (!this.metrics.errorRate[endpoint]) {
        this.metrics.errorRate[endpoint] = 0
      }
      this.metrics.errorRate[endpoint]++
    }

    this.updateMetrics()
  }

  recordComponentRender(componentName: string, renderTime: number): void {
    if (!this.metrics.componentRenderTime[componentName]) {
      this.metrics.componentRenderTime[componentName] = []
    }
    
    this.metrics.componentRenderTime[componentName].push(renderTime)
    
    if (this.metrics.componentRenderTime[componentName].length > this.config.maxMetricsHistory) {
      this.metrics.componentRenderTime[componentName].shift()
    }

    this.updateMetrics()
  }

  startMedicalWorkflow(workflowName: string): void {
    this.workflowTimers.set(workflowName, Date.now())
  }

  completeMedicalWorkflow(workflowName: string): number {
    const startTime = this.workflowTimers.get(workflowName)
    if (!startTime) return 0

    const duration = Date.now() - startTime
    this.workflowTimers.delete(workflowName)

    if (!this.metrics.medicalWorkflowCompletionTime[workflowName]) {
      this.metrics.medicalWorkflowCompletionTime[workflowName] = []
    }

    this.metrics.medicalWorkflowCompletionTime[workflowName].push(duration)
    
    if (this.metrics.medicalWorkflowCompletionTime[workflowName].length > this.config.maxMetricsHistory) {
      this.metrics.medicalWorkflowCompletionTime[workflowName].shift()
    }

    this.updateMetrics()
    return duration
  }

  recordCacheHit(cacheType: string, hit: boolean): void {
    if (!this.metrics.cacheHitRate[cacheType]) {
      this.metrics.cacheHitRate[cacheType] = 0
    }

    // Calcular hit rate como promedio móvil simple
    const currentRate = this.metrics.cacheHitRate[cacheType]
    this.metrics.cacheHitRate[cacheType] = hit 
      ? (currentRate + 1) / 2 
      : currentRate / 2

    this.updateMetrics()
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getAverageApiResponseTime(endpoint?: string): number {
    if (endpoint) {
      const times = this.metrics.apiResponseTime[endpoint]
      return times && times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0
    }

    // Promedio global
    let totalTime = 0
    let totalCalls = 0

    Object.values(this.metrics.apiResponseTime).forEach(times => {
      totalTime += times.reduce((sum, time) => sum + time, 0)
      totalCalls += times.length
    })

    return totalCalls > 0 ? totalTime / totalCalls : 0
  }

  cleanup(): void {
    // Limpiar observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()

    // Limpiar intervalos
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
      this.reportingInterval = null
    }

    // Limpiar timers de workflow
    this.workflowTimers.clear()
  }
}

// Hook para usar el monitor de performance en componentes
export const useMedicalPerformance = (
  componentName: string,
  config?: Partial<MedicalPerformanceConfig>
) => {
  const monitor = useRef<MedicalPerformanceMonitor | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const renderStart = useRef<number>(0)

  // Inicializar monitor
  useEffect(() => {
    monitor.current = MedicalPerformanceMonitor.getInstance(config as MedicalPerformanceConfig)
    setMetrics(monitor.current.getMetrics())
  }, [config])

  // Medir tiempo de render del componente
  useEffect(() => {
    renderStart.current = performance.now()
    
    return () => {
      if (monitor.current) {
        const renderTime = performance.now() - renderStart.current
        monitor.current.recordComponentRender(componentName, renderTime)
      }
    }
  })

  // Métodos para el componente
  const recordApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    monitor.current?.recordApiCall(endpoint, duration, success)
  }, [])

  const startWorkflow = useCallback((workflowName: string) => {
    monitor.current?.startMedicalWorkflow(workflowName)
  }, [])

  const completeWorkflow = useCallback((workflowName: string) => {
    return monitor.current?.completeMedicalWorkflow(workflowName) || 0
  }, [])

  const recordCacheHit = useCallback((cacheType: string, hit: boolean) => {
    monitor.current?.recordCacheHit(cacheType, hit)
  }, [])

  const getMetrics = useCallback(() => {
    return monitor.current?.getMetrics() || null
  }, [])

  return {
    metrics,
    recordApiCall,
    startWorkflow,
    completeWorkflow,
    recordCacheHit,
    getMetrics,
    getAverageApiResponseTime: monitor.current?.getAverageApiResponseTime.bind(monitor.current)
  }
}

// Componente de visualización de métricas en tiempo real
export const MedicalPerformanceDashboard: React.FC<{
  minimized?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}> = memo(({ minimized = true, position = 'bottom-right' }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(!minimized)

  useEffect(() => {
    const monitor = MedicalPerformanceMonitor.getInstance()
    
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!metrics) return null

  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position] || positionClasses['bottom-right']}`}>
      <div className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
      }`}>
        <div 
          className="p-2 bg-medical-primary text-white rounded-t-lg cursor-pointer flex items-center justify-between"
          onClick={() => setIsVisible(!isVisible)}
        >
          <span className="text-sm font-medium">Performance</span>
          <span className="text-xs">{isVisible ? '−' : '+'}</span>
        </div>
        
        {isVisible && (
          <div className="p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={metrics.lcp && metrics.lcp > 2500 ? 'text-red-600' : 'text-green-600'}>
                {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>FCP:</span>
              <span className={metrics.fcp && metrics.fcp > 1800 ? 'text-red-600' : 'text-green-600'}>
                {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={metrics.cls && metrics.cls > 0.1 ? 'text-red-600' : 'text-green-600'}>
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={metrics.memoryUsage > 0.8 ? 'text-red-600' : 'text-green-600'}>
                {(metrics.memoryUsage * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

MedicalPerformanceDashboard.displayName = 'MedicalPerformanceDashboard'

// Exports
export default MedicalPerformanceMonitor
export { DEFAULT_CONFIG as defaultPerformanceConfig }
export type { PerformanceMetrics, MedicalPerformanceConfig }