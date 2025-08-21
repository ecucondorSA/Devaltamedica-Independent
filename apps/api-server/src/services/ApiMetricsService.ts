// Usar performance nativo de Node.js
const performance = global.performance || (typeof window === 'undefined' ? require('perf_hooks').performance : window.performance);

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface APIMetricData {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  errorMessage?: string;
}

export interface EndpointStats {
  path: string;
  method: string;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  lastUsed: Date;
  errorRate: number;
  status: 'operational' | 'degraded' | 'down';
  consumers: Set<string>;
}

export interface SystemMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  uptime: number;
  activeEndpoints: number;
  uniqueConsumers: number;
  requestsPerMinute: number;
  errorRate: number;
}

// ============================================================================
// SERVICIO DE MÉTRICAS DE API
// ============================================================================

class ApiMetricsService {
  private static instance: ApiMetricsService;
  private metrics: Map<string, APIMetricData[]> = new Map();
  private endpointStats: Map<string, EndpointStats> = new Map();
  private startTime: Date = new Date();
  private readonly MAX_METRICS_PER_ENDPOINT = 1000;
  private readonly DEGRADED_THRESHOLD = 500; // ms
  private readonly ERROR_THRESHOLD = 5; // %

  private constructor() {
    // Singleton pattern
    this.setupCleanupJob();
  }

  public static getInstance(): ApiMetricsService {
    if (!ApiMetricsService.instance) {
      ApiMetricsService.instance = new ApiMetricsService();
    }
    return ApiMetricsService.instance;
  }

  // ============================================================================
  // RECOPILACIÓN DE MÉTRICAS
  // ============================================================================

  /**
   * Registra una métrica de API
   */
  public recordMetric(data: APIMetricData): void {
    const key = `${data.method}:${data.endpoint}`;
    
    // Almacenar métrica individual
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const endpointMetrics = this.metrics.get(key)!;
    endpointMetrics.push(data);
    
    // Mantener solo las últimas N métricas
    if (endpointMetrics.length > this.MAX_METRICS_PER_ENDPOINT) {
      endpointMetrics.shift();
    }
    
    // Actualizar estadísticas del endpoint
    this.updateEndpointStats(key, data);
  }

  /**
   * Middleware para Express/Next.js que captura métricas automáticamente
   */
  public createMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const originalSend = res.send;
      
      res.send = function(data: any) {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        // Registrar métrica
        ApiMetricsService.getInstance().recordMetric({
          endpoint: req.path || req.url,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip || req.connection.remoteAddress,
          userId: req.user?.id,
          errorMessage: res.statusCode >= 400 ? data : undefined
        });
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Actualiza las estadísticas de un endpoint específico
   */
  private updateEndpointStats(key: string, data: APIMetricData): void {
    const [method, path] = key.split(':');
    
    if (!this.endpointStats.has(key)) {
      this.endpointStats.set(key, {
        path,
        method,
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
        errorRate: 0,
        status: 'operational',
        consumers: new Set()
      });
    }
    
    const stats = this.endpointStats.get(key)!;
    
    // Actualizar contadores
    stats.totalRequests++;
    if (data.statusCode >= 400) {
      stats.totalErrors++;
    }
    
    // Actualizar tiempo promedio de respuesta
    const currentMetrics = this.metrics.get(key) || [];
    const responseTimes = currentMetrics.map(m => m.responseTime);
    stats.averageResponseTime = Math.round(
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    );
    
    // Actualizar última vez usado
    stats.lastUsed = data.timestamp;
    
    // Calcular tasa de error
    stats.errorRate = (stats.totalErrors / stats.totalRequests) * 100;
    
    // Determinar estado del endpoint
    stats.status = this.determineEndpointStatus(stats);
    
    // Agregar consumidor (basado en User-Agent)
    if (data.userAgent) {
      const consumer = this.extractConsumerFromUserAgent(data.userAgent);
      if (consumer) {
        stats.consumers.add(consumer);
      }
    }
  }

  /**
   * Determina el estado de un endpoint basado en métricas
   */
  private determineEndpointStatus(stats: EndpointStats): 'operational' | 'degraded' | 'down' {
    // Si no hay requests recientes (últimos 5 minutos), considerar down
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (stats.lastUsed < fiveMinutesAgo) {
      return 'down';
    }
    
    // Si el tiempo de respuesta promedio o la tasa de error son altos
    if (stats.averageResponseTime > this.DEGRADED_THRESHOLD || stats.errorRate > this.ERROR_THRESHOLD) {
      return 'degraded';
    }
    
    return 'operational';
  }

  /**
   * Extrae el nombre del consumidor del User-Agent
   */
  private extractConsumerFromUserAgent(userAgent: string): string | null {
    const patterns = [
      { pattern: /altamedica-mobile/i, name: 'Mobile App' },
      { pattern: /altamedica-web/i, name: 'Web Portal' },
      { pattern: /altamedica-admin/i, name: 'Admin Dashboard' },
      { pattern: /postman/i, name: 'Postman' },
      { pattern: /insomnia/i, name: 'Insomnia' },
      { pattern: /curl/i, name: 'cURL' },
      { pattern: /python/i, name: 'Python Client' },
      { pattern: /javascript/i, name: 'JavaScript Client' }
    ];
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(userAgent)) {
        return name;
      }
    }
    
    return 'Unknown Client';
  }

  // ============================================================================
  // OBTENCIÓN DE MÉTRICAS
  // ============================================================================

  /**
   * Obtiene las métricas del sistema completo
   */
  public getSystemMetrics(): SystemMetrics {
    const allStats = Array.from(this.endpointStats.values());
    const totalRequests = allStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
    const totalErrors = allStats.reduce((sum, stat) => sum + stat.totalErrors, 0);
    const allConsumers = new Set<string>();
    
    // Recopilar todos los consumidores únicos
    allStats.forEach(stat => {
      stat.consumers.forEach(consumer => allConsumers.add(consumer));
    });
    
    // Calcular tiempo promedio de respuesta ponderado
    let weightedResponseTime = 0;
    let totalWeight = 0;
    
    allStats.forEach(stat => {
      const weight = stat.totalRequests;
      weightedResponseTime += stat.averageResponseTime * weight;
      totalWeight += weight;
    });
    
    const averageResponseTime = totalWeight > 0 ? Math.round(weightedResponseTime / totalWeight) : 0;
    
    // Calcular uptime (tiempo desde que inició el servicio)
    const uptimeMs = Date.now() - this.startTime.getTime();
    const uptimeHours = uptimeMs / (1000 * 60 * 60);
    const uptime = Math.min(99.99, 99.9 + (uptimeHours / 1000)); // Simulación de uptime
    
    // Calcular requests por minuto (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    let recentRequests = 0;
    
    for (const [key, metrics] of this.metrics.entries()) {
      recentRequests += metrics.filter(m => m.timestamp > fiveMinutesAgo).length;
    }
    
    const requestsPerMinute = recentRequests / 5;
    
    return {
      totalRequests,
      totalErrors,
      averageResponseTime,
      uptime,
      activeEndpoints: allStats.filter(stat => stat.status !== 'down').length,
      uniqueConsumers: allConsumers.size,
      requestsPerMinute: Math.round(requestsPerMinute),
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
    };
  }

  /**
   * Obtiene las estadísticas de todos los endpoints
   */
  public getAllEndpointStats(): EndpointStats[] {
    return Array.from(this.endpointStats.values());
  }

  /**
   * Obtiene las estadísticas de un endpoint específico
   */
  public getEndpointStats(method: string, path: string): EndpointStats | null {
    const key = `${method}:${path}`;
    return this.endpointStats.get(key) || null;
  }

  /**
   * Obtiene las métricas históricas de un endpoint
   */
  public getEndpointHistory(method: string, path: string): APIMetricData[] {
    const key = `${method}:${path}`;
    return this.metrics.get(key) || [];
  }

  /**
   * Obtiene métricas filtradas por categoría
   */
  public getEndpointsByCategory(): { [category: string]: EndpointStats[] } {
    const categories = {
      medical: [] as EndpointStats[],
      notifications: [] as EndpointStats[],
      employment: [] as EndpointStats[],
      analytics: [] as EndpointStats[],
      other: [] as EndpointStats[]
    };
    
    this.endpointStats.forEach(stat => {
      if (stat.path.includes('/doctors') || stat.path.includes('/patients') || stat.path.includes('/appointments')) {
        categories.medical.push(stat);
      } else if (stat.path.includes('/notifications')) {
        categories.notifications.push(stat);
      } else if (stat.path.includes('/jobs')) {
        categories.employment.push(stat);
      } else if (stat.path.includes('/analytics')) {
        categories.analytics.push(stat);
      } else {
        categories.other.push(stat);
      }
    });
    
    return categories;
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Limpia métricas antiguas para evitar uso excesivo de memoria
   */
  private setupCleanupJob(): void {
    setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      for (const [key, metrics] of this.metrics.entries()) {
        const filteredMetrics = metrics.filter(m => m.timestamp > oneDayAgo);
        this.metrics.set(key, filteredMetrics);
        
        // Si no hay métricas recientes, remover el endpoint
        if (filteredMetrics.length === 0) {
          this.metrics.delete(key);
          this.endpointStats.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Ejecutar cada hora
  }

  /**
   * Resetea todas las métricas (útil para testing)
   */
  public reset(): void {
    this.metrics.clear();
    this.endpointStats.clear();
    this.startTime = new Date();
  }

  /**
   * Exporta métricas en formato JSON
   */
  public exportMetrics(): any {
    return {
      systemMetrics: this.getSystemMetrics(),
      endpointStats: this.getAllEndpointStats(),
      categories: this.getEndpointsByCategory(),
      exportTime: new Date().toISOString()
    };
  }
}

export default ApiMetricsService;
