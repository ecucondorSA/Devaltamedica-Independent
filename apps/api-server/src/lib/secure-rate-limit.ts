/**
 * 🚀 ALTAMEDICA - SERVERLESS RATE LIMITING
 * Production-ready rate limiting with Redis support
 * Scales properly in serverless environments
 */

import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@altamedica/shared/services/logger.service';
// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message: string // Error message when limit exceeded
  skipSuccessfulRequests?: boolean
  keyGenerator?: (request: NextRequest) => string
  store?: 'memory' | 'redis' | 'database'
}

// Rate limit result interface
interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// In-memory store for development (fallback)
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * 🔄 Redis-based rate limiter for production
 */
class RedisRateLimiter {
  private redisClient: any = null

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis() {
    // Only initialize Redis in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
      try {
        // Dynamic import to avoid bundling issues in serverless
        const { Redis } = await import('ioredis')
        this.redisClient = new Redis(process.env.REDIS_URL!, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          lazyConnect: true
        })
        
        logger.info('✅ Redis rate limiter initialized')
      } catch (error) {
        logger.warn('⚠️ Redis not available, falling back to memory store:', error)
        this.redisClient = null
      }
    }
  }

  async checkLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()
    const resetTime = now + windowMs

    if (this.redisClient) {
      try {
        // Use Redis for distributed rate limiting
        const pipeline = this.redisClient.pipeline()
        pipeline.incr(key)
        pipeline.expire(key, Math.ceil(windowMs / 1000))
        
        const results = await pipeline.exec()
        const count = results[0][1] as number
        
        const remaining = Math.max(0, limit - count)
        
        return {
          success: count <= limit,
          limit,
          remaining,
          resetTime,
          retryAfter: count > limit ? Math.ceil(windowMs / 1000) : undefined
        }
      } catch (error) {
        logger.error('Redis rate limit error:', undefined, error)
        // Fallback to memory store
        return this.checkMemoryLimit(key, limit, windowMs)
      }
    } else {
      // Use memory store as fallback
      return this.checkMemoryLimit(key, limit, windowMs)
    }
  }

  private checkMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const resetTime = now + windowMs

    // Clean up expired entries
    this.cleanupMemoryStore()

    // Get or create entry
    let entry = memoryStore.get(key)
    
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime }
      memoryStore.set(key, entry)
    }

    entry.count++
    const remaining = Math.max(0, limit - entry.count)

    return {
      success: entry.count <= limit,
      limit,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: entry.count > limit ? Math.ceil((entry.resetTime - now) / 1000) : undefined
    }
  }

  private cleanupMemoryStore() {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key)
      }
    }
  }
}

// Singleton rate limiter instance
let rateLimiter: RedisRateLimiter | null = null

function getRateLimiter(): RedisRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RedisRateLimiter()
  }
  return rateLimiter
}

/**
 * 🛡️ Enhanced rate limiter class
 */
export class SecureRateLimiter {
  private config: RateLimitConfig
  private limiter: RedisRateLimiter

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      store: 'redis',
      ...config
    }
    this.limiter = getRateLimiter()
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Create a unique key based on IP, user agent, and endpoint
    const ip = this.getClientIP(request)
    const endpoint = request.nextUrl.pathname
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Hash the user agent to prevent key explosion
    const userAgentHash = this.simpleHash(userAgent)
    
    return `ratelimit:${ip}:${endpoint}:${userAgentHash}`
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers to get the real client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const cloudflare = request.headers.get('cf-connecting-ip')
    
    if (cloudflare) return cloudflare
    if (forwarded) return forwarded.split(',')[0].trim()
    if (real) return real
    
    return request.ip || '127.0.0.1'
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(request)
    return await this.limiter.checkLimit(key, this.config.max, this.config.windowMs)
  }

  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      try {
        const result = await this.checkLimit(request)
        
        if (!result.success) {
          const response = NextResponse.json(
            {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: this.config.message,
                retryAfter: result.retryAfter,
                limit: result.limit,
                remaining: 0,
                resetTime: new Date(result.resetTime).toISOString()
              }
            },
            { status: 429 }
          )
          
          // Add rate limit headers
          response.headers.set('X-RateLimit-Limit', result.limit.toString())
          response.headers.set('X-RateLimit-Remaining', '0')
          response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
          if (result.retryAfter) {
            response.headers.set('Retry-After', result.retryAfter.toString())
          }
          
          return response
        }
        
        // Request allowed - continue
        return null
      } catch (error) {
        logger.error('Rate limiting error:', undefined, error)
        // In case of error, allow the request (fail open)
        return null
      }
    }
  }
}

/**
 * 🎯 Predefined rate limiters for common use cases
 */

// Authentication endpoints (strict)
export const authRateLimiter = new SecureRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    return `auth:${ip}`
  }
})

// General API endpoints
export const apiRateLimiter = new SecureRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests. Please try again later.'
})

// Medical data endpoints (moderate)
export const medicalDataRateLimiter = new SecureRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: 'Too many medical data requests. Please try again in 5 minutes.'
})

// File upload endpoints (very strict)
export const uploadRateLimiter = new SecureRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 uploads per 10 minutes
  message: 'Too many file uploads. Please try again in 10 minutes.'
})

// Search endpoints
export const searchRateLimiter = new SecureRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: 'Too many search requests. Please try again in 1 minute.'
})

// Emergency endpoints (more permissive)
export const emergencyRateLimiter = new SecureRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Emergency endpoint rate limit exceeded.'
})

/**
 * 🔧 Utility function to apply rate limiting to handlers
 */
export async function withRateLimit<T extends NextRequest[]>(
  request: NextRequest,
  rateLimiter: SecureRateLimiter,
  handler: (...args: T) => Promise<NextResponse>
): Promise<NextResponse> {
  const limitResult = await rateLimiter.createMiddleware()(request)
  
  if (limitResult) {
    return limitResult // Rate limit exceeded
  }
  
  // Continue with the handler
  return handler(request as any)
}

/**
 * 📊 Rate limiting statistics (for monitoring)
 */
export function getRateLimitStats() {
  return {
    memoryStoreSize: memoryStore.size,
    memoryEntries: Array.from(memoryStore.entries()).map(([key, value]) => ({
      key,
      count: value.count,
      resetTime: new Date(value.resetTime).toISOString()
    }))
  }
}

export default {
  SecureRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  medicalDataRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  emergencyRateLimiter,
  withRateLimit,
  getRateLimitStats
}
