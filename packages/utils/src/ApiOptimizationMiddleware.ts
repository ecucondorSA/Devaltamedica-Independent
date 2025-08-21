// API Middleware Optimizado para Performance Médica - Altamedica
// Request deduplication + Cache integration + Performance monitoring

import { NextRequest, NextResponse } from 'next/server'
import { medicalCache } from '@altamedica/medical';

import { logger } from '@altamedica/shared/services/logger.service';
// Tipos para el middleware de optimización
interface RequestMetrics {
  startTime: number
  endTime?: number
  duration?: number
  cacheHit: boolean
  responseSize: number
  statusCode: number
  endpoint: string
  method: string
  userId?: string
}

interface DeduplicationEntry {
  promise: Promise<NextResponse>
  timestamp: number
  requestCount: number
}

interface OptimizationConfig {
  enableCache: boolean
  enableDeduplication: boolean
  enableMetrics: boolean
  cacheStrategy: 'aggressive' | 'conservative' | 'smart'
  cacheTTL: {
    [key: string]: number
  }
  deduplicationWindow: number // ms
  compressionThreshold: number // bytes
  rateLimitWindow: number // ms
  rateLimitRequests: number
}

// Configuración por defecto optimizada para médico
const DEFAULT_CONFIG: OptimizationConfig = {
  enableCache: true,
  enableDeduplication: true,
  enableMetrics: true,
  cacheStrategy: 'smart',
  cacheTTL: {
    'GET:/api/pacientes': 2 * 60 * 1000, // 2 minutos
    'GET:/api/citas': 1 * 60 * 1000, // 1 minuto
    'GET:/api/disponibilidad': 30 * 1000, // 30 segundos
    'GET:/api/lookup': 30 * 60 * 1000, // 30 minutos
    'POST:/api/audit': 0 // No cache para auditoría
  },
  deduplicationWindow: 5000, // 5 segundos
  compressionThreshold: 1024, // 1KB
  rateLimitWindow: 60 * 1000, // 1 minuto
  rateLimitRequests: 100
}

// Maps para deduplicación y rate limiting
const pendingRequests = new Map<string, DeduplicationEntry>()
const requestMetrics = new Map<string, RequestMetrics[]>()
const rateLimitCounters = new Map<string, { count: number; resetTime: number }>()

// Función para generar clave de cache/deduplicación
function generateCacheKey(req: NextRequest): string {
  const url = new URL(req.url)
  const method = req.method
  const pathname = url.pathname
  const searchParams = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  
  const baseKey = `${method}:${pathname}`
  return searchParams ? `${baseKey}?${searchParams}` : baseKey
}

// Función para determinar el tipo de cache
function getCacheType(pathname: string): string {
  if (pathname.includes('/pacientes')) return 'patients'
  if (pathname.includes('/citas')) return 'appointments'
  if (pathname.includes('/lookup') || pathname.includes('/reference')) return 'lookup'
  return 'system'
}

// Función para obtener TTL específico
function getTTL(key: string, config: OptimizationConfig): number {
  return config.cacheTTL[key] || 60000 // 1 minuto por defecto
}

// Función para comprimir respuesta si es necesario
function shouldCompress(data: any, threshold: number): boolean {
  const size = JSON.stringify(data).length
  return size > threshold
}

// Función para registrar métricas
function recordMetrics(
  endpoint: string,
  method: string,
  metrics: RequestMetrics
): void {
  const key = `${method}:${endpoint}`
  
  if (!requestMetrics.has(key)) {
    requestMetrics.set(key, [])
  }
  
  const endpointMetrics = requestMetrics.get(key)!
  endpointMetrics.push(metrics)
  
  // Mantener solo las últimas 100 métricas por endpoint
  if (endpointMetrics.length > 100) {
    endpointMetrics.shift()
  }
  
  // Log para monitoreo médico
  logger.info(`[MEDICAL-API-METRICS] ${key}`, {
    duration: metrics.duration,
    cacheHit: metrics.cacheHit,
    responseSize: metrics.responseSize,
    statusCode: metrics.statusCode,
    timestamp: new Date().toISOString()
  })
}

// Función para verificar rate limiting
function checkRateLimit(
  identifier: string,
  config: OptimizationConfig
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const counter = rateLimitCounters.get(identifier)
  
  if (!counter || now > counter.resetTime) {
    // Reiniciar contador
    rateLimitCounters.set(identifier, {
      count: 1,
      resetTime: now + config.rateLimitWindow
    })
    
    return {
      allowed: true,
      resetTime: now + config.rateLimitWindow,
      remaining: config.rateLimitRequests - 1
    }
  }
  
  if (counter.count >= config.rateLimitRequests) {
    return {
      allowed: false,
      resetTime: counter.resetTime,
      remaining: 0
    }
  }
  
  counter.count++
  return {
    allowed: true,
    resetTime: counter.resetTime,
    remaining: config.rateLimitRequests - counter.count
  }
}

// Middleware principal de optimización
export async function optimizeApiRequest(
  request: NextRequest,
  config: OptimizationConfig = DEFAULT_CONFIG
): Promise<NextResponse> {
  const startTime = performance.now()
  const url = new URL(request.url)
  const method = request.method
  const pathname = url.pathname
  const cacheKey = generateCacheKey(request)
  const cacheType = getCacheType(pathname)
  
  // Extraer identificador para rate limiting (IP o user ID)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = forwarded?.split(',')[0] || realIP || 'unknown'
  const userId = request.headers.get('x-user-id')
  const rateLimitId = userId || clientIP
  
  // Verificar rate limiting
  const rateLimit = checkRateLimit(rateLimitId, config)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        exito: false,
        mensaje: 'Rate limit excedido',
        codigoError: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date(),
        trazabilidad: Date.now().toString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.rateLimitRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    )
  }

  let cacheHit = false
  let response: NextResponse

  try {
    // 1. Verificar cache para métodos GET (si está habilitado)
    if (method === 'GET' && config.enableCache) {
      const cached = medicalCache.get(cacheKey)
      if (cached) {
        cacheHit = true
        
        // Crear respuesta desde cache
        response = NextResponse.json(cached, {
          headers: {
            'X-Cache-Status': 'HIT',
            'X-Cache-Type': cacheType,
            'X-Response-Time': (performance.now() - startTime).toFixed(2) + 'ms'
          }
        })
        
        // Registrar métricas de cache hit
        if (config.enableMetrics) {
          const endTime = performance.now()
          recordMetrics(pathname, method, {
            startTime,
            endTime,
            duration: endTime - startTime,
            cacheHit: true,
            responseSize: JSON.stringify(cached).length,
            statusCode: 200,
            endpoint: pathname,
            method,
            userId: userId ?? undefined
          })
        }
        
        return response
      }
    }

    // 2. Verificar deduplicación para requests idénticos en paralelo
    if (config.enableDeduplication && pendingRequests.has(cacheKey)) {
      const pending = pendingRequests.get(cacheKey)!
      
      // Verificar si la request no es muy antigua
      if (Date.now() - pending.timestamp < config.deduplicationWindow) {
        pending.requestCount++
        
        logger.info(`[MEDICAL-API] Deduplicating request: ${cacheKey} (count: ${pending.requestCount})`)
        
        // Esperar la respuesta de la request original
        response = await pending.promise
        
        // Clonar la respuesta para este request
        const clonedResponse = NextResponse.json(await response.clone().json(), {
          status: response.status,
          headers: response.headers
        })
        return clonedResponse
      } else {
        // Request muy antigua, eliminar del mapa
        pendingRequests.delete(cacheKey)
      }
    }

    // 3. Procesar request original
    const processRequest = async (): Promise<NextResponse> => {
      // Aquí iría la lógica de procesamiento de la API original
      // Por ahora, simularemos una respuesta
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
      
      const responseData = {
        exito: true,
        datos: { 
          message: `Respuesta optimizada para ${pathname}`,
          timestamp: new Date().toISOString(),
          cacheKey,
          method
        },
        mensaje: 'Request procesada exitosamente',
        timestamp: new Date(),
        trazabilidad: Date.now().toString()
      }

      const apiResponse = NextResponse.json(responseData, {
        headers: {
          'X-Cache-Status': 'MISS',
          'X-Cache-Type': cacheType,
          'X-Response-Time': (performance.now() - startTime).toFixed(2) + 'ms',
          'X-RateLimit-Limit': config.rateLimitRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      })

      // 4. Guardar en cache si aplica
      if (method === 'GET' && config.enableCache) {
        const ttl = getTTL(cacheKey, config)
        if (ttl > 0) {
          medicalCache.set(cacheKey, responseData, ttl)
        }
      }

      return apiResponse
    }

    // Registrar request pendiente para deduplicación
    if (config.enableDeduplication) {
      const requestPromise = processRequest()
      pendingRequests.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
        requestCount: 1
      })

      // Limpiar después del procesamiento
      requestPromise.finally(() => {
        setTimeout(() => pendingRequests.delete(cacheKey), config.deduplicationWindow)
      })
    }

    // Ejecutar request
    response = config.enableDeduplication 
      ? await pendingRequests.get(cacheKey)!.promise
      : await processRequest()

  } catch (error) {
    logger.error(`[MEDICAL-API-ERROR] ${pathname}:`, error)
    
    response = NextResponse.json(
      {
        exito: false,
        mensaje: 'Error interno del servidor',
        codigoError: 'INTERNAL_ERROR',
        timestamp: new Date(),
        trazabilidad: Date.now().toString()
      },
      { 
        status: 500,
        headers: {
          'X-Cache-Status': 'ERROR',
          'X-Response-Time': (performance.now() - startTime).toFixed(2) + 'ms'
        }
      }
    )
  }

  // Registrar métricas finales
  if (config.enableMetrics) {
    const responseText = await response.clone().text()
    const endTime = performance.now()
    
    recordMetrics(pathname, method, {
      startTime,
      endTime,
      duration: endTime - startTime,
      cacheHit,
      responseSize: responseText.length,
      statusCode: response.status,
      endpoint: pathname,
      method,
      userId: userId ?? undefined
    })
  }

  return response
}

// Función para obtener métricas de rendimiento
export function getApiMetrics(): Record<string, {
  averageResponseTime: number
  cacheHitRate: number
  totalRequests: number
  errorRate: number
  lastMinuteRequests: number
}> {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const result: Record<string, any> = {}

  requestMetrics.forEach((metrics, endpoint) => {
    const recentMetrics = metrics.filter(m => (m.endTime || m.startTime) > oneMinuteAgo)
    const cacheHits = metrics.filter(m => m.cacheHit).length
    const errors = metrics.filter(m => m.statusCode >= 400).length
    
    result[endpoint] = {
      averageResponseTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length 
        : 0,
      cacheHitRate: metrics.length > 0 ? (cacheHits / metrics.length) * 100 : 0,
      totalRequests: metrics.length,
      errorRate: metrics.length > 0 ? (errors / metrics.length) * 100 : 0,
      lastMinuteRequests: recentMetrics.length
    }
  })

  return result
}

// Función para limpiar métricas antiguas
export function cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
  const cutoffTime = Date.now() - maxAge
  
  requestMetrics.forEach((metrics, endpoint) => {
    const filteredMetrics = metrics.filter(m => (m.endTime || m.startTime) > cutoffTime)
    requestMetrics.set(endpoint, filteredMetrics)
  })
  
  // Limpiar contadores de rate limit expirados
  const currentTime = Date.now()
  rateLimitCounters.forEach((counter, key) => {
    if (currentTime > counter.resetTime) {
      rateLimitCounters.delete(key)
    }
  })
}

// Exports
export default optimizeApiRequest
export type { OptimizationConfig, RequestMetrics }