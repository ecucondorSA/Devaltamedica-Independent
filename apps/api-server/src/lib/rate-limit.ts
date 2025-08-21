import { NextRequest } from 'next/server';
import { auditLog } from './audit';

import { logger } from '@altamedica/shared/services/logger.service';
// Interfaces
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skip?: (req: NextRequest) => boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  totalHits: number;
  remainingPoints: number;
  msBeforeNext: number;
  retryAfter?: number;
  blocked: boolean;
}

interface RateLimitStore {
  [key: string]: {
    hits: number;
    resetTime: number;
    blocked: boolean;
  };
}

// Configuraciones de rate limiting por endpoint
const rateLimitConfigs: { [key: string]: RateLimitConfig } = {
  'default': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: 'Too many requests from this IP, please try again later.'
  },
  'auth': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos de login
    message: 'Too many authentication attempts, please try again later.'
  },
  'medical-data': {
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto
    message: 'Rate limit exceeded for medical data access.'
  },
  'telemedicine': {
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // 60 requests por minuto
    message: 'Rate limit exceeded for telemedicine services.'
  },
  'create-resource': {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 creaciones por minuto
    message: 'Rate limit exceeded for resource creation.'
  },
  'search': {
    windowMs: 60 * 1000, // 1 minuto
    max: 50, // 50 búsquedas por minuto
    message: 'Rate limit exceeded for search operations.'
  },
  'analytics': {
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 requests por minuto
    message: 'Rate limit exceeded for analytics access.'
  },
  'applications': {
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto
    message: 'Rate limit exceeded for applications.'
  },
  'medical-locations': {
    windowMs: 60 * 1000, // 1 minuto
    max: 40, // 40 requests por minuto
    message: 'Rate limit exceeded for medical locations.'
  },
  'create-application': {
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 creaciones por minuto
    message: 'Rate limit exceeded for application creation.'
  },
  'update-application': {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 actualizaciones por minuto
    message: 'Rate limit exceeded for application updates.'
  },
  'delete-application': {
    windowMs: 60 * 1000, // 1 minuto
    max: 3, // 3 eliminaciones por minuto
    message: 'Rate limit exceeded for application deletion.'
  },
  'create-location': {
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 creaciones por minuto
    message: 'Rate limit exceeded for location creation.'
  },
  'update-location': {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 actualizaciones por minuto
    message: 'Rate limit exceeded for location updates.'
  },
  'delete-location': {
    windowMs: 60 * 1000, // 1 minuto
    max: 2, // 2 eliminaciones por minuto
    message: 'Rate limit exceeded for location deletion.'
  },
  'create-report': {
    windowMs: 60 * 1000, // 1 minuto
    max: 3, // 3 reportes por minuto
    message: 'Rate limit exceeded for report creation.'
  }
};

// Store en memoria para rate limiting (en producción usar Redis)
const rateLimitStore: RateLimitStore = {};

// Función principal de rate limiting
export async function rateLimit(req: NextRequest, type: string = 'default'): Promise<RateLimitResult> {
  try {
    // Obtener configuración para el tipo de endpoint
    const config = rateLimitConfigs[type] || rateLimitConfigs['default'];
    
    // Generar clave única para el cliente
    const key = generateKey(req, type);
    
    // Verificar si debe saltarse el rate limiting
    if (config.skip && config.skip(req)) {
      return {
        success: true,
        totalHits: 0,
        remainingPoints: config.max,
        msBeforeNext: 0,
        blocked: false
      };
    }

    // Obtener o crear entrada en el store
    const now = Date.now();
    let entry = rateLimitStore[key];

    if (!entry || now > entry.resetTime) {
      // Crear nueva entrada o resetear ventana
      entry = {
        hits: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
      rateLimitStore[key] = entry;
    }

    // Incrementar contador
    entry.hits++;

    // Verificar límite
    const isBlocked = entry.hits > config.max;
    entry.blocked = isBlocked;

    const result: RateLimitResult = {
      success: !isBlocked,
      totalHits: entry.hits,
      remainingPoints: Math.max(0, config.max - entry.hits),
      msBeforeNext: entry.resetTime - now,
      retryAfter: isBlocked ? Math.ceil((entry.resetTime - now) / 1000) : undefined,
      blocked: isBlocked
    };

    // Auditar si está bloqueado
    if (isBlocked) {
      await auditRateLimit(req, type, entry.hits, config.max);
    }

    return result;

  } catch (error) {
    logger.error('Rate limiting error:', undefined, error);
    // En caso de error, permitir la solicitud
    return {
      success: true,
      totalHits: 0,
      remainingPoints: 100,
      msBeforeNext: 0,
      blocked: false
    };
  }
}

// Función específica para rate limiting de autenticación
export async function rateLimitAuth(req: NextRequest, action: 'login' | 'register' | 'reset-password' = 'login'): Promise<RateLimitResult> {
  const config = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // 5 intentos
      message: 'Too many login attempts, please try again later.'
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 3, // 3 registros
      message: 'Too many registration attempts, please try again later.'
    },
    'reset-password': {
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 3, // 3 intentos de reset
      message: 'Too many password reset attempts, please try again later.'
    }
  };

  const selectedConfig = config[action];
  const key = `auth:${action}:${getClientIdentifier(req)}`;
  
  return await applyRateLimit(req, key, selectedConfig);
}

// Función específica para rate limiting de datos médicos
export async function rateLimitMedicalData(req: NextRequest, operation: 'read' | 'write' | 'delete'): Promise<RateLimitResult> {
  const config = {
    read: {
      windowMs: 60 * 1000, // 1 minuto
      max: 50, // 50 lecturas
      message: 'Too many medical data read operations.'
    },
    write: {
      windowMs: 60 * 1000, // 1 minuto
      max: 20, // 20 escrituras
      message: 'Too many medical data write operations.'
    },
    delete: {
      windowMs: 60 * 1000, // 1 minuto
      max: 5, // 5 eliminaciones
      message: 'Too many medical data delete operations.'
    }
  };

  const selectedConfig = config[operation];
  const key = `medical:${operation}:${getClientIdentifier(req)}`;
  
  return await applyRateLimit(req, key, selectedConfig);
}

// Función específica para rate limiting de telemedicina
export async function rateLimitTelemedicine(req: NextRequest, action: 'session' | 'call' | 'chat'): Promise<RateLimitResult> {
  const config = {
    session: {
      windowMs: 60 * 1000, // 1 minuto
      max: 5, // 5 sesiones por minuto
      message: 'Too many telemedicine sessions.'
    },
    call: {
      windowMs: 60 * 1000, // 1 minuto
      max: 10, // 10 llamadas por minuto
      message: 'Too many telemedicine calls.'
    },
    chat: {
      windowMs: 60 * 1000, // 1 minuto
      max: 100, // 100 mensajes de chat por minuto
      message: 'Too many chat messages.'
    }
  };

  const selectedConfig = config[action];
  const key = `telemedicine:${action}:${getClientIdentifier(req)}`;
  
  return await applyRateLimit(req, key, selectedConfig);
}

// Función para obtener estadísticas de rate limiting
export async function getRateLimitStats(key?: string): Promise<any> {
  if (key) {
    const entry = rateLimitStore[key];
    if (entry) {
      return {
        key,
        hits: entry.hits,
        resetTime: entry.resetTime,
        blocked: entry.blocked,
        remainingMs: entry.resetTime - Date.now()
      };
    }
    return null;
  }

  // Estadísticas generales
  const stats = {
    totalEntries: Object.keys(rateLimitStore).length,
    blockedEntries: 0,
    totalHits: 0,
    entries: []
  };

  for (const [key, entry] of Object.entries(rateLimitStore)) {
    if (entry.blocked) {
      stats.blockedEntries++;
    }
    stats.totalHits += entry.hits;
    
    stats.entries.push({
      key,
      hits: entry.hits,
      blocked: entry.blocked,
      remainingMs: entry.resetTime - Date.now()
    });
  }

  return stats;
}

// Función para limpiar entradas expiradas
export async function cleanupExpiredEntries(): Promise<number> {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of Object.entries(rateLimitStore)) {
    if (now > entry.resetTime) {
      delete rateLimitStore[key];
      cleaned++;
    }
  }

  return cleaned;
}

// Función para resetear rate limit para una clave específica
export async function resetRateLimit(key: string): Promise<boolean> {
  if (rateLimitStore[key]) {
    delete rateLimitStore[key];
    return true;
  }
  return false;
}

// Función para bloquear temporalmente una IP
export async function blockIP(ip: string, durationMs: number): Promise<void> {
  const key = `blocked:${ip}`;
  rateLimitStore[key] = {
    hits: 999999,
    resetTime: Date.now() + durationMs,
    blocked: true
  };

  await auditLog({
    action: 'ip_blocked',
    userId: 'system',
    resource: 'rate_limit',
    details: { ip, durationMs },
    severity: 'high',
    category: 'system'
  });
}

// Función para desbloquear una IP
export async function unblockIP(ip: string): Promise<boolean> {
  const key = `blocked:${ip}`;
  if (rateLimitStore[key]) {
    delete rateLimitStore[key];
    
    await auditLog({
      action: 'ip_unblocked',
      userId: 'system',
      resource: 'rate_limit',
      details: { ip },
      severity: 'medium',
      category: 'system'
    });
    
    return true;
  }
  return false;
}

// Funciones auxiliares
function generateKey(req: NextRequest, type: string): string {
  const config = rateLimitConfigs[type];
  
  if (config?.keyGenerator) {
    return config.keyGenerator(req);
  }
  
  return `${type}:${getClientIdentifier(req)}`;
}

function getClientIdentifier(req: NextRequest): string {
  // Obtener IP del cliente
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  
  // Obtener User-Agent para mayor especificidad
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Crear hash simple del User-Agent
  const userAgentHash = userAgent.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `${ip}:${userAgentHash}`;
}

async function applyRateLimit(req: NextRequest, key: string, config: any): Promise<RateLimitResult> {
  const now = Date.now();
  let entry = rateLimitStore[key];

  if (!entry || now > entry.resetTime) {
    entry = {
      hits: 0,
      resetTime: now + config.windowMs,
      blocked: false
    };
    rateLimitStore[key] = entry;
  }

  entry.hits++;
  const isBlocked = entry.hits > config.max;
  entry.blocked = isBlocked;

  if (isBlocked) {
    await auditRateLimit(req, key, entry.hits, config.max);
  }

  return {
    success: !isBlocked,
    totalHits: entry.hits,
    remainingPoints: Math.max(0, config.max - entry.hits),
    msBeforeNext: entry.resetTime - now,
    retryAfter: isBlocked ? Math.ceil((entry.resetTime - now) / 1000) : undefined,
    blocked: isBlocked
  };
}

async function auditRateLimit(req: NextRequest, type: string, hits: number, max: number): Promise<void> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  await auditLog({
    action: 'rate_limit_exceeded',
    userId: 'anonymous',
    resource: 'rate_limit',
    details: {
      type,
      ip,
      userAgent,
      hits,
      max,
      url: req.url,
      method: req.method
    },
    severity: 'high',
    category: 'system',
    ipAddress: ip,
    userAgent
  });
}

// Tarea de limpieza automática cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    try {
      const cleaned = await cleanupExpiredEntries();
      if (cleaned > 0) {
        logger.info(`[RATE_LIMIT] Cleaned ${cleaned} expired entries`);
      }
    } catch (error) {
      logger.error('Error cleaning rate limit entries:', undefined, error);
    }
  }, 5 * 60 * 1000); // 5 minutos
}

export default {
  rateLimit,
  rateLimitAuth,
  rateLimitMedicalData,
  rateLimitTelemedicine,
  getRateLimitStats,
  cleanupExpiredEntries,
  resetRateLimit,
  blockIP,
  unblockIP
};
