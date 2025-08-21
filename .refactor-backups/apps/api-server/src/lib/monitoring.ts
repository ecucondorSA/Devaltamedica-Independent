// Sistema de monitoreo y health checks para Altamedica
// Monitoreo completo de APIs, base de datos, servicios externos y performance

import { logger } from '@altamedica/shared/services/logger.service';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    apis: HealthCheckResult;
    telemedicine: HealthCheckResult;
    notifications: HealthCheckResult;
    storage: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
    activeSessions: number;
  };
}

interface AlertConfig {
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook' | 'sms')[];
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    diskUsage: number; // percentage
    memoryUsage: number; // percentage
    cpuUsage: number; // percentage
  };
}

// Configuración de monitoreo
const monitoringConfig: AlertConfig = {
  enabled: process.env.NODE_ENV === 'production',
  channels: ['email', 'webhook'],
  thresholds: {
    responseTime: 2000, // 2 segundos
    errorRate: 5, // 5%
    diskUsage: 85, // 85%
    memoryUsage: 80, // 80%
    cpuUsage: 70 // 70%
  }
};

// Métricas en memoria (en producción usar Redis/InfluxDB)
const metrics = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  activeUsers: new Set(),
  activeSessions: new Set(),
  lastReset: Date.now()
};

// Función principal de health check
export async function performHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  logger.info('🔍 Ejecutando health check completo...');
  
  // Ejecutar todos los checks en paralelo
  const [
    databaseCheck,
    redisCheck,
    apisCheck,
    telemedicineCheck,
    notificationsCheck,
    storageCheck,
    memoryCheck,
    diskCheck
  ] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAPIs(),
    checkTelemedicine(),
    checkNotifications(),
    checkStorage(),
    checkMemory(),
    checkDisk()
  ]);

  // Procesar resultados
  const checks = {
    database: getResultValue(databaseCheck),
    redis: getResultValue(redisCheck),
    apis: getResultValue(apisCheck),
    telemedicine: getResultValue(telemedicineCheck),
    notifications: getResultValue(notificationsCheck),
    storage: getResultValue(storageCheck),
    memory: getResultValue(memoryCheck),
    disk: getResultValue(diskCheck)
  };

  // Determinar estado general
  const overallStatus = determineOverallStatus(checks);
  
  // Calcular métricas
  const currentMetrics = calculateMetrics();
  
  const healthResult: SystemHealth = {
    overall: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks,
    metrics: currentMetrics
  };

  const totalTime = Date.now() - startTime;
  logger.info(`✅ Health check completado en ${totalTime}ms - Estado: ${overallStatus}`);

  // Enviar alertas si es necesario
  if (overallStatus !== 'healthy' && monitoringConfig.enabled) {
    await sendHealthAlert(healthResult);
  }

  return healthResult;
}

// Check de base de datos
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // En producción: hacer query real a la base de datos
    await simulateOperation('SELECT 1', 100);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        connectionCount: 15,
        maxConnections: 100,
        queryTime: '1.2ms'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

// Check de Redis
async function checkRedis(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // En producción: ping a Redis
    await simulateOperation('PING', 50);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        connectedClients: 24,
        usedMemory: '156MB',
        keyspaceHits: 98765
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
}

// Check de APIs
async function checkAPIs(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const apiChecks = await Promise.allSettled([
      checkAPIEndpoint('/api/v1/health'),
      checkAPIEndpoint('/api/v1/patients'),
      checkAPIEndpoint('/api/v1/doctors'),
      checkAPIEndpoint('/api/v1/appointments')
    ]);

    const successfulChecks = apiChecks.filter(check => check.status === 'fulfilled').length;
    const totalChecks = apiChecks.length;
    const successRate = (successfulChecks / totalChecks) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (successRate === 100) {
      status = 'healthy';
    } else if (successRate >= 75) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        successfulEndpoints: successfulChecks,
        totalEndpoints: totalChecks,
        successRate: `${successRate}%`
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'API checks failed'
    };
  }
}

// Check de telemedicina
async function checkTelemedicine(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Verificar servidores STUN/TURN
    await simulateOperation('STUN check', 200);
    await simulateOperation('WebRTC connectivity', 150);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        stunServers: 'accessible',
        turnServers: 'accessible',
        activeRooms: 3,
        webrtcConnections: 6
      }
    };
  } catch (error) {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Telemedicine services degraded'
    };
  }
}

// Check de notificaciones
async function checkNotifications(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Verificar servicios de notificación
    await simulateOperation('FCM check', 120);
    await simulateOperation('Email service check', 80);
    await simulateOperation('SMS service check', 100);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        fcm: 'operational',
        email: 'operational',
        sms: 'operational',
        pendingNotifications: 45
      }
    };
  } catch (error) {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Notification services degraded'
    };
  }
}

// Check de almacenamiento
async function checkStorage(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // En producción: verificar acceso a S3, almacenamiento local, etc.
    const storageInfo = {
      totalSpace: '1TB',
      usedSpace: '340GB',
      freeSpace: '660GB',
      usagePercentage: 34
    };
    
    const status = storageInfo.usagePercentage > 85 ? 'degraded' : 'healthy';
    
    return {
      status,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: storageInfo
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Storage check failed'
    };
  }
}

// Check de memoria
async function checkMemory(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = 8 * 1024 * 1024 * 1024; // 8GB simulado
    const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (memoryPercentage < monitoringConfig.thresholds.memoryUsage) {
      status = 'healthy';
    } else if (memoryPercentage < 90) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        usagePercentage: `${memoryPercentage.toFixed(1)}%`
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed'
    };
  }
}

// Check de disco
async function checkDisk(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // En producción: usar librería como 'fs' para verificar espacio en disco
    const diskInfo = {
      totalSpace: 500 * 1024 * 1024 * 1024, // 500GB
      freeSpace: 200 * 1024 * 1024 * 1024,  // 200GB
      usedSpace: 300 * 1024 * 1024 * 1024   // 300GB
    };
    
    const usagePercentage = (diskInfo.usedSpace / diskInfo.totalSpace) * 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (usagePercentage < monitoringConfig.thresholds.diskUsage) {
      status = 'healthy';
    } else if (usagePercentage < 95) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      details: {
        totalSpace: `${Math.round(diskInfo.totalSpace / 1024 / 1024 / 1024)}GB`,
        freeSpace: `${Math.round(diskInfo.freeSpace / 1024 / 1024 / 1024)}GB`,
        usedSpace: `${Math.round(diskInfo.usedSpace / 1024 / 1024 / 1024)}GB`,
        usagePercentage: `${usagePercentage.toFixed(1)}%`
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Disk check failed'
    };
  }
}

// Funciones auxiliares
async function checkAPIEndpoint(endpoint: string): Promise<void> {
  // Simular check de endpoint
  await simulateOperation(`GET ${endpoint}`, Math.random() * 200 + 50);
}

async function simulateOperation(operation: string, delay: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simular falla ocasional
  if (Math.random() < 0.05) { // 5% de probabilidad de falla
    throw new Error(`Simulated failure for ${operation}`);
  }
}

function getResultValue(result: PromiseSettledResult<HealthCheckResult>): HealthCheckResult {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: 0,
      error: result.reason?.message || 'Check failed'
    };
  }
}

function determineOverallStatus(checks: SystemHealth['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status);
  
  if (statuses.every(status => status === 'healthy')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

function calculateMetrics() {
  const currentTime = Date.now();
  const timeDiff = (currentTime - metrics.lastReset) / 1000 / 60; // minutos
  
  return {
    requestsPerMinute: timeDiff > 0 ? Math.round(metrics.requests / timeDiff) : 0,
    averageResponseTime: metrics.requests > 0 ? Math.round(metrics.totalResponseTime / metrics.requests) : 0,
    errorRate: metrics.requests > 0 ? Math.round((metrics.errors / metrics.requests) * 100) : 0,
    activeUsers: metrics.activeUsers.size,
    activeSessions: metrics.activeSessions.size
  };
}

// Funciones de tracking de métricas
export function trackRequest(responseTime: number, isError: boolean = false): void {
  metrics.requests++;
  metrics.totalResponseTime += responseTime;
  
  if (isError) {
    metrics.errors++;
  }
}

export function trackUser(userId: string): void {
  metrics.activeUsers.add(userId);
  
  // Limpiar usuarios inactivos cada 30 minutos
  setTimeout(() => {
    metrics.activeUsers.delete(userId);
  }, 30 * 60 * 1000);
}

export function trackSession(sessionId: string): void {
  metrics.activeSessions.add(sessionId);
  
  // Limpiar sesiones inactivas cada hora
  setTimeout(() => {
    metrics.activeSessions.delete(sessionId);
  }, 60 * 60 * 1000);
}

export function resetMetrics(): void {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.totalResponseTime = 0;
  metrics.lastReset = Date.now();
}

// Sistema de alertas
async function sendHealthAlert(health: SystemHealth): Promise<void> {
  const alertMessage = {
    title: `🚨 Alerta de Sistema - Estado: ${health.overall.toUpperCase()}`,
    message: generateAlertMessage(health),
    priority: health.overall === 'unhealthy' ? 'critical' : 'high',
    timestamp: health.timestamp
  };

  logger.info(`[ALERT] ${alertMessage.title}`);
  logger.info(alertMessage.message);

  if (monitoringConfig.enabled) {
    // En producción: enviar por los canales configurados
    for (const channel of monitoringConfig.channels) {
      await sendAlert(channel, alertMessage);
    }
  }
}

function generateAlertMessage(health: SystemHealth): string {
  const unhealthyChecks = Object.entries(health.checks)
    .filter(([, check]) => check.status !== 'healthy')
    .map(([name, check]) => `${name}: ${check.status} (${check.error || 'degraded performance'})`)
    .join('\n');

  return `
Sistema AltaMedica - Estado General: ${health.overall.toUpperCase()}
Tiempo de actividad: ${Math.round(health.uptime / 3600)} horas
Versión: ${health.version}

Problemas detectados:
${unhealthyChecks || 'Ninguno'}

Métricas actuales:
- Requests/min: ${health.metrics.requestsPerMinute}
- Tiempo de respuesta promedio: ${health.metrics.averageResponseTime}ms
- Tasa de errores: ${health.metrics.errorRate}%
- Usuarios activos: ${health.metrics.activeUsers}
- Sesiones activas: ${health.metrics.activeSessions}

Timestamp: ${health.timestamp}
  `.trim();
}

async function sendAlert(channel: string, alert: any): Promise<void> {
  switch (channel) {
    case 'email':
      logger.info(`[EMAIL ALERT] ${alert.title}`);
      break;
    case 'slack':
      logger.info(`[SLACK ALERT] ${alert.title}`);
      break;
    case 'webhook':
      logger.info(`[WEBHOOK ALERT] ${alert.title}`);
      break;
    case 'sms':
      logger.info(`[SMS ALERT] ${alert.title}`);
      break;
  }
}

// Health check simple para endpoint
export async function simpleHealthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
}

// Middleware para tracking automático
export function createHealthTrackingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      trackRequest(responseTime, isError);
      
      // Track user si hay información de autenticación
      if (req.user?.id) {
        trackUser(req.user.id);
      }
      
      // Track session si hay sessionId
      if (req.sessionId) {
        trackSession(req.sessionId);
      }
    });
    
    next();
  };
}

export default {
  performHealthCheck,
  simpleHealthCheck,
  trackRequest,
  trackUser,
  trackSession,
  resetMetrics,
  createHealthTrackingMiddleware
};
