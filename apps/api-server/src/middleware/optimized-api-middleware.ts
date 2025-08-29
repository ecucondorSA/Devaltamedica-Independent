// optimized-api-middleware.ts
// Optimización por Lead Backend Developer (r4kh6oc5t)
// Implementado por Lead Frontend Developer para ecosistema Altamedica

import { admin } from '@/lib/firebase-admin';
import { createErrorResponse } from '@/lib/response-helpers';
import Redis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { z } from 'zod';

import { logger } from '@altamedica/shared';
// Configuración de Redis para caché y rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Rate limiting por tipo de endpoint para Altamedica
export const rateLimitConfigs = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 intentos por 15min
  medical: { windowMs: 60 * 1000, max: 100 }, // 100 requests por minuto
  general: { windowMs: 60 * 1000, max: 200 }, // 200 requests por minuto
  admin: { windowMs: 60 * 1000, max: 50 }, // 50 requests por minuto
  patient: { windowMs: 60 * 1000, max: 150 }, // 150 requests por minuto
  doctor: { windowMs: 60 * 1000, max: 300 }, // 300 requests por minuto
  emergency: { windowMs: 30 * 1000, max: 50 }, // 50 requests por 30 segundos
};

// Logger estructurado para APIs médicas de Altamedica
interface APILogEntry {
  timestamp: string;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ipAddress: string;
  error?: string;
  medicalDataAccessed?: boolean;
  userRole?: string;
  appType?: 'admin' | 'doctors' | 'patients' | 'companies' | 'medical';
}

class APILogger {
  static async log(entry: APILogEntry): Promise<void> {
    const logData = {
      ...entry,
      environment: process.env.NODE_ENV,
      service: 'altamedica-api-server',
      version: '1.0.0',
      platform: 'altamedica',
    };

    // Log a consola con formato estructurado
    logger.info(JSON.stringify(logData));

    // Para producción: enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      try {
        await redis.lpush('altamedica_api_logs', JSON.stringify(logData));
        await redis.expire('altamedica_api_logs', 24 * 60 * 60); // 24 horas
      } catch (error) {
        logger.error('Failed to log to Redis:', undefined, error);
      }
    }
  }
}

// Cache wrapper con TTL configurable para Altamedica
export class APICache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error:', undefined, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', undefined, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', undefined, error);
    }
  }

  static generateKey(prefix: string, ...parts: string[]): string {
    return `altamedica:${prefix}:${parts.join(':')}`;
  }

  // Métodos específicos para Altamedica
  static async getPatientData(patientId: string): Promise<any | null> {
    return this.get(this.generateKey('patient', patientId));
  }

  static async setPatientData(patientId: string, data: any, ttl: number = 600): Promise<void> {
    await this.set(this.generateKey('patient', patientId), data, ttl);
  }

  static async getDoctorData(doctorId: string): Promise<any | null> {
    return this.get(this.generateKey('doctor', doctorId));
  }

  static async setDoctorData(doctorId: string, data: any, ttl: number = 600): Promise<void> {
    await this.set(this.generateKey('doctor', doctorId), data, ttl);
  }

  static async getMedicalRecords(recordId: string): Promise<any | null> {
    return this.get(this.generateKey('medical_record', recordId));
  }

  static async setMedicalRecords(recordId: string, data: any, ttl: number = 300): Promise<void> {
    await this.set(this.generateKey('medical_record', recordId), data, ttl);
  }
}

// Middleware de validación avanzada
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  validationType: 'body' | 'query' | 'params' = 'body'
) {
  return function (handler: (request: NextRequest, validated: T) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now();

      try {
        let dataToValidate: any;

        switch (validationType) {
          case 'body':
            dataToValidate = await request.json();
            break;
          case 'query':
            dataToValidate = Object.fromEntries(new URL(request.url).searchParams);
            break;
          case 'params':
            // Los params se pasan desde el contexto de Next.js
            dataToValidate = {}; // Se maneja en el handler específico
            break;
        }

        const validated = schema.parse(dataToValidate);
        const response = await handler(request, validated);

        // Log exitoso
        await APILogger.log({
          timestamp: new Date().toISOString(),
          endpoint: new URL(request.url).pathname,
          method: request.method,
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return response;

      } catch (error) {
        const responseTime = Date.now() - startTime;

        if (error instanceof z.ZodError) {
          // Log error de validación
          await APILogger.log({
            timestamp: new Date().toISOString(),
            endpoint: new URL(request.url).pathname,
            method: request.method,
            statusCode: 400,
            responseTime,
            ipAddress: request.ip || 'unknown',
            error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          });

          return NextResponse.json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Invalid request data',
              error.errors
            ),
            { status: 400 }
          );
        }

        // Log error general
        await APILogger.log({
          timestamp: new Date().toISOString(),
          endpoint: new URL(request.url).pathname,
          method: request.method,
          statusCode: 500,
          responseTime,
          ipAddress: request.ip || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    };
  };
}

// Middleware de autenticación mejorado para Altamedica
export function withAuth(requiredRoles?: string[]) {
  return function (handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json(
            createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
            { status: 401 }
          );
        }

        const token = authHeader.substring(7);

        // Verificar token en caché primero
        const cacheKey = APICache.generateKey('auth', token);
        let user = await APICache.get(cacheKey);

        if (!user) {
          // Verificar con Firebase Auth
          try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            user = {
              uid: decodedToken.uid,
              email: decodedToken.email,
              roles: decodedToken.roles || ['patient'],
              isEmailVerified: decodedToken.email_verified || false
            };
            await APICache.set(cacheKey, user, 300); // Cache por 5 minutos
          } catch (firebaseError) {
            // Placeholder para desarrollo
            if (process.env.NODE_ENV === 'development') {
              user = {
                uid: 'dev-user',
                email: 'dev@altamedica.com',
                roles: ['patient'],
                isEmailVerified: true
              };
            } else {
              throw firebaseError;
            }
          }
        }

        // Verificar roles si son requeridos
        if (requiredRoles && requiredRoles.length > 0) {
          const userRoles = user.roles || [];
          const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

          if (!hasRequiredRole) {
            return NextResponse.json(
              createErrorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions'),
              { status: 403 }
            );
          }
        }

        // Agregar usuario al request para uso posterior
        (request as any).user = user;

        return await handler(request, user);

      } catch (error) {
        return NextResponse.json(
          createErrorResponse('AUTH_ERROR', 'Authentication failed'),
          { status: 401 }
        );
      }
    };
  };
}

// Middleware de rate limiting
export function withRateLimit(limitType: keyof typeof rateLimitConfigs = 'general') {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const config = rateLimitConfigs[limitType];
      const clientId = request.ip || 'unknown';
      const key = `altamedica:rate_limit:${limitType}:${clientId}`;

      try {
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.expire(key, Math.floor(config.windowMs / 1000));
        }

        if (current > config.max) {
          return NextResponse.json(
            createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.floor(config.windowMs / 1000)),
                'X-RateLimit-Limit': String(config.max),
                'X-RateLimit-Remaining': String(Math.max(0, config.max - current)),
              }
            }
          );
        }

        const response = await handler(request);

        // Agregar headers de rate limit
        response.headers.set('X-RateLimit-Limit', String(config.max));
        response.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.max - current)));

        return response;

      } catch (error) {
        // Si Redis falla, permitir la request pero loggear el error
        logger.error('Rate limiting error:', undefined, error);
        return await handler(request);
      }
    };
  };
}

// Middleware compuesto para endpoints médicos de Altamedica
export function withMedicalAPI<T>(
  schema: z.ZodSchema<T>,
  requiredRoles: string[] = ['patient', 'doctor', 'admin'],
  rateLimitType: keyof typeof rateLimitConfigs = 'medical'
) {
  return function (handler: (request: NextRequest, validated: T, user: any) => Promise<NextResponse>) {
    return withRateLimit(rateLimitType)(
      withAuth(requiredRoles)(
        withValidation(schema)((request, validated) =>
          handler(request, validated, (request as any).user)
        )
      )
    );
  };
}

// Middleware específico para pacientes
export function withPatientAPI<T>(
  schema: z.ZodSchema<T>
) {
  return withMedicalAPI(schema, ['patient', 'doctor', 'admin'], 'patient');
}

// Middleware específico para doctores
export function withDoctorAPI<T>(
  schema: z.ZodSchema<T>
) {
  return withMedicalAPI(schema, ['doctor', 'admin'], 'doctor');
}

// Middleware para emergencias médicas
export function withEmergencyAPI<T>(
  schema: z.ZodSchema<T>
) {
  return withMedicalAPI(schema, ['doctor', 'admin', 'emergency'], 'emergency');
}

// Healthcheck mejorado con métricas detalladas para Altamedica
export class HealthChecker {
  static async checkDatabase(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      // Verificar Firebase
      await admin.firestore().collection('health').limit(1).get();
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  static async checkRedis(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await redis.ping();
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  static async getSystemMetrics() {
    const memUsage = process.memoryUsage();

    return {
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: process.platform === 'linux' ? os.loadavg() : null
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: 'altamedica',
      service: 'api-server',
    };
  }

  static async getFullHealthStatus() {
    const [dbHealth, redisHealth, metrics] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.getSystemMetrics()
    ]);

    const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
      metrics,
      platform: 'altamedica',
    };
  }
}

// Utilidades específicas para Altamedica
export class AltamedicaUtils {
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (real) {
      return real;
    }

    return request.ip || '127.0.0.1';
  }

  static isMedicalEndpoint(pathname: string): boolean {
    const medicalPaths = [
      '/api/patients',
      '/api/doctors',
      '/api/medical',
      '/api/appointments',
      '/api/records',
      '/api/prescriptions'
    ];

    return medicalPaths.some(path => pathname.startsWith(path));
  }

  static getUserRoleFromRequest(request: NextRequest): string {
    const user = (request as any).user;
    return user?.roles?.[0] || 'anonymous';
  }
}

// Exportar todo para uso en otros archivos
export {
  AltamedicaUtils, APICache, APILogger, HealthChecker, rateLimitConfigs
};
