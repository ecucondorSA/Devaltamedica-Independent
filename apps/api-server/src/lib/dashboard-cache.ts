/**
import { logger } from '@altamedica/shared/services/logger.service';

 * Sistema de Caché Optimizado para Dashboard
 * Reduce significativamente los costos de Firebase
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milliseconds
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  // TTL optimizados por tipo de dato
  private readonly TTL_CONFIG = {
    // Datos que cambian poco - cachear por más tiempo
    users: 5 * 60 * 1000, // 5 minutos
    payments: 10 * 60 * 1000, // 10 minutos
    compliance: 30 * 60 * 1000, // 30 minutos
    
    // Datos más dinámicos - cachear menos tiempo
    appointments: 2 * 60 * 1000, // 2 minutos
    alerts: 1 * 60 * 1000, // 1 minuto
    systemHealth: 30 * 1000, // 30 segundos
    recentActivity: 1 * 60 * 1000, // 1 minuto
    
    // Métricas del sistema - tiempo real
    systemMetrics: 15 * 1000, // 15 segundos
  };

  /**
   * Obtiene datos del caché si están vigentes
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Almacena datos en el caché con TTL apropiado
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.TTL_CONFIG[key as keyof typeof this.TTL_CONFIG] || 60000;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Obtiene datos con fallback a función de fetch
   */
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // Intentar obtener del caché primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.info(`📋 Cache HIT for ${key}`);
      return cached;
    }

    // Si no está en caché, hacer fetch y cachear
    logger.info(`🔄 Cache MISS for ${key}, fetching...`);
    const data = await fetchFn();
    this.set(key, data, customTtl);
    
    return data;
  }

  /**
   * Limpia el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(entry => 
        now - entry.timestamp <= entry.ttl
      ).length,
      expiredEntries: entries.filter(entry => 
        now - entry.timestamp > entry.ttl
      ).length,
      cacheSize: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia global del caché
export const dashboardCache = new DashboardCache();

// Cleanup automático cada 5 minutos
setInterval(() => {
  dashboardCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Configuración optimizada para desarrollo vs producción
 */
export const DASHBOARD_CONFIG = {
  development: {
    // 🛡️ PROTECCIÓN: En desarrollo, usar principalmente datos mock para ahorrar cuota
    useFirestore: false, // ← Deshabilitado para proteger tu cuota diaria
    updateInterval: 60000, // 1 minuto
    enableAutoRefresh: true,
    useMockData: true // ← Usando datos simulados para no gastar Firebase
  },
  
  production: {
    // En producción, usar datos reales con caché agresivo
    useFirestore: true,
    updateInterval: 300000, // 5 minutos
    enableAutoRefresh: true,
    useMockData: false,
    
    // Configuración de costos
    maxDailyReads: 50000, // Límite diario de lecturas
    costAlertThreshold: 1000 // Alertar si se superan 1000 lecturas/hora
  }
};

/**
 * Contador de operaciones para monitoreo de costos
 */
class OperationCounter {
  private reads = 0;
  private writes = 0;
  private startTime = Date.now();

  incrementReads(count = 1): void {
    this.reads += count;
  }

  incrementWrites(count = 1): void {
    this.writes += count;
  }

  getStats() {
    const elapsed = Date.now() - this.startTime;
    const hours = elapsed / (1000 * 60 * 60);
    
    return {
      reads: this.reads,
      writes: this.writes,
      elapsed: Math.round(elapsed / 1000), // segundos
      readsPerHour: Math.round(this.reads / hours),
      writesPerHour: Math.round(this.writes / hours),
      estimatedDailyCost: this.calculateDailyCost()
    };
  }

  private calculateDailyCost(): number {
    const hoursElapsed = (Date.now() - this.startTime) / (1000 * 60 * 60);
    const projectedDailyReads = (this.reads / hoursElapsed) * 24;
    const projectedDailyWrites = (this.writes / hoursElapsed) * 24;
    
    // Costos de Firebase Firestore
    const readCost = (projectedDailyReads / 100000) * 0.06;
    const writeCost = (projectedDailyWrites / 100000) * 0.18;
    
    return readCost + writeCost;
  }

  reset(): void {
    this.reads = 0;
    this.writes = 0;
    this.startTime = Date.now();
  }
}

export const operationCounter = new OperationCounter();
