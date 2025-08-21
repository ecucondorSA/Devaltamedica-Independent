import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (en producción usar Redis)
const requestStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  skipSuccessfulRequests?: boolean
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async limit(request: NextRequest): Promise<NextResponse | null> {
    const ip = this.getClientIP(request)
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()

    // Limpiar entradas expiradas
    this.cleanup()

    // Obtener o crear entrada para esta IP
    let entry = requestStore.get(key)
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      }
      requestStore.set(key, entry)
    }

    // Incrementar contador
    entry.count++

    // Verificar si excede el límite
    if (entry.count > this.config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        {
          error: this.config.message,
          retryAfter,
          limit: this.config.max,
          remaining: 0,
          resetTime: new Date(entry.resetTime).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': this.config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    // Request permitido - agregar headers informativos
    const remaining = this.config.max - entry.count
    const response = NextResponse.next()
    
    response.headers.set('X-RateLimit-Limit', this.config.max.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())

    return null // Permite continuar
  }

  private getClientIP(request: NextRequest): string {
    // Intentar obtener IP real del cliente
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (real) {
      return real
    }

    // Fallback para desarrollo local
    return request.ip || '127.0.0.1'
  }

  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of requestStore.entries()) {
      if (now > entry.resetTime) {
        requestStore.delete(key)
      }
    }
  }
}

// 🔐 CONFIGURACIONES PREDEFINIDAS PARA ALTAMEDICA

// Rate limiting para autenticación (más restrictivo)
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.'
})

// Rate limiting general para API (menos restrictivo)
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Límite de requests excedido. Intenta en 15 minutos.'
})

// Rate limiting para datos médicos sensibles
export const medicalDataRateLimit = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // máximo 50 requests por IP
  message: 'Límite de acceso a datos médicos excedido. Intenta en 5 minutos.'
})

// Rate limiting para uploads/archivos
export const uploadRateLimit = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // máximo 10 uploads por IP
  message: 'Límite de uploads excedido. Intenta en 10 minutos.'
})

// 🛡️ MIDDLEWARE HELPER PARA NEXT.JS
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Aplicar rate limiting
  const limitResponse = await rateLimiter.limit(request)
  
  if (limitResponse) {
    return limitResponse // Rate limit excedido
  }

  // Continuar con el handler normal
  return handler()
}

// 🚨 RATE LIMITER PARA EMERGENCIAS (más permisivo)
export const emergencyRateLimit = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 requests por minuto
  message: 'Sistema de emergencia: límite temporal aplicado.'
})

// 📊 FUNCIÓN DE ESTADÍSTICAS
export function getRateLimitStats() {
  const stats = {
    totalKeys: requestStore.size,
    activeIPs: new Set(),
    totalRequests: 0,
    blockedRequests: 0
  }

  for (const [key, entry] of requestStore.entries()) {
    const ip = key.split(':')[0]
    stats.activeIPs.add(ip)
    stats.totalRequests += entry.count
    
    if (entry.count > 100) { // Asumiendo límite promedio de 100
      stats.blockedRequests++
    }
  }

  return {
    ...stats,
    activeIPs: stats.activeIPs.size
  }
}
