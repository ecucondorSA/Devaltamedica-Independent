import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { trackRequest } from '@/lib/monitoring';

import { logger } from '@altamedica/shared/services/logger.service';
// Middleware unificado de seguridad para todas las APIs médicas
export async function securityMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimitType?: string;
    auditAction?: string;
    allowedRoles?: string[];
    requiresPermission?: string;
    containsPHI?: boolean;
  } = {}
): Promise<NextResponse> {
  const startTime = Date.now();
  let authUser: any = null;
  let auditSuccess = true;
  let errorMessage = '';

  try {
    // 1. RATE LIMITING (siempre primero)
    const rateLimitType = options.rateLimitType || 'default';
    const rateLimitResult = await rateLimit(req, rateLimitType);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitResult.retryAfter,
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
      
      // Headers de rate limiting
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingPoints.toString());
      response.headers.set('X-RateLimit-Reset', new Date(Date.now() + rateLimitResult.msBeforeNext).toISOString());
      
      auditSuccess = false;
      errorMessage = 'Rate limit exceeded';
      return response;
    }

    // 2. AUTENTICACIÓN (si es requerida)
    if (options.requireAuth !== false) {
      const authResult = await verifyAuth(req);
      
      if (!authResult.success) {
        const response = NextResponse.json(
          { error: 'Unauthorized', message: authResult.error },
          { status: 401 }
        );
        
        auditSuccess = false;
        errorMessage = authResult.error || 'Authentication failed';
        return response;
      }
      
      authUser = authResult.user!;

      // 3. VERIFICACIÓN DE ROLES
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        const hasRole = options.allowedRoles.some(role => authUser.roles.includes(role));
        
        if (!hasRole) {
          const response = NextResponse.json(
            { error: 'Forbidden', message: `Required roles: ${options.allowedRoles.join(', ')}` },
            { status: 403 }
          );
          
          auditSuccess = false;
          errorMessage = `Insufficient roles. Required: ${options.allowedRoles.join(', ')}`;
          return response;
        }
      }

      // 4. VERIFICACIÓN DE PERMISOS
      if (options.requiresPermission) {
        const hasPermission = authUser.permissions.includes(options.requiresPermission) || 
                             authUser.roles.includes('admin');
        
        if (!hasPermission) {
          const response = NextResponse.json(
            { error: 'Forbidden', message: `Required permission: ${options.requiresPermission}` },
            { status: 403 }
          );
          
          auditSuccess = false;
          errorMessage = `Missing permission: ${options.requiresPermission}`;
          return response;
        }
      }
    }

    // 5. EJECUTAR HANDLER PRINCIPAL
    const response = await handler(req, authUser);
    const responseTime = Date.now() - startTime;

    // 6. TRACKING DE MÉTRICAS
    trackRequest(responseTime, response.status >= 400);
    
    // 7. HEADERS DE SEGURIDAD
    addSecurityHeaders(response);

    return response;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Security middleware error:', undefined, error);
    
    // Tracking de error
    trackRequest(responseTime, true);
    
    auditSuccess = false;
    errorMessage = error instanceof Error ? error.message : 'Internal security error';
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    
    addSecurityHeaders(response);
    return response;

  } finally {
    // 8. AUDITORÍA (siempre se ejecuta)
    if (options.auditAction) {
      try {
        await auditLog({
          action: options.auditAction,
          userId: authUser?.id || 'anonymous',
          resource: extractResourceFromPath(req.url),
          details: {
            method: req.method,
            url: req.url,
            userAgent: req.headers.get('user-agent'),
            responseTime: Date.now() - startTime,
            rateLimitUsed: rateLimitType
          },
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || undefined,
          success: auditSuccess,
          error: errorMessage || undefined,
          severity: auditSuccess ? 'low' : 'high',
          category: options.containsPHI ? 'medical' : 'system',
          containsPHI: options.containsPHI || false
        });
      } catch (auditError) {
        logger.error('Audit logging failed:', auditError);
      }
    }
  }
}

// Función para agregar headers de seguridad
function addSecurityHeaders(response: NextResponse): void {
  // Headers de seguridad médica
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS para HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CSP para prevenir XSS
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';"
  );
  
  // Headers de aplicación médica
  response.headers.set('X-Medical-App', 'AltaMedica');
  response.headers.set('X-HIPAA-Compliant', 'true');
  response.headers.set('X-Response-Time', Date.now().toString());
}

// Función para extraer recurso de la URL
function extractResourceFromPath(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    // Extraer recurso principal de la API
    if (parts.length >= 3 && parts[0] === 'api' && parts[1] === 'v1') {
      return parts[2]; // medical-locations, applications, etc.
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Función para obtener IP del cliente
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  return req.ip || 'unknown';
}

// Wrapper para crear APIs seguras fácilmente
export function createSecureAPI(
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimitType?: string;
    auditAction?: string;
    allowedRoles?: string[];
    requiresPermission?: string;
    containsPHI?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    return await securityMiddleware(req, handler, options);
  };
}

// Middlewares específicos para diferentes tipos de endpoints

// Para endpoints de datos médicos (máxima seguridad)
export function createMedicalAPI(
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    allowedRoles?: string[];
    requiresPermission?: string;
    auditAction?: string;
  } = {}
) {
  return createSecureAPI(handler, {
    requireAuth: true,
    rateLimitType: 'medical-data',
    containsPHI: true,
    allowedRoles: options.allowedRoles || ['doctor', 'nurse', 'admin'],
    requiresPermission: options.requiresPermission,
    auditAction: options.auditAction || 'medical_data_access'
  });
}

// Para endpoints de telemedicina
export function createTelemedicineAPI(
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    allowedRoles?: string[];
    auditAction?: string;
  } = {}
) {
  return createSecureAPI(handler, {
    requireAuth: true,
    rateLimitType: 'telemedicine',
    containsPHI: true,
    allowedRoles: options.allowedRoles || ['doctor', 'patient'],
    auditAction: options.auditAction || 'telemedicine_access'
  });
}

// Para endpoints de administración
export function createAdminAPI(
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    auditAction?: string;
    requiresPermission?: string;
  } = {}
) {
  return createSecureAPI(handler, {
    requireAuth: true,
    rateLimitType: 'admin',
    allowedRoles: ['admin'],
    requiresPermission: options.requiresPermission,
    auditAction: options.auditAction || 'admin_action'
  });
}

// Para endpoints públicos con rate limiting básico
export function createPublicAPI(
  handler: (req: NextRequest, authUser?: any) => Promise<NextResponse>,
  options: {
    rateLimitType?: string;
    auditAction?: string;
  } = {}
) {
  return createSecureAPI(handler, {
    requireAuth: false,
    rateLimitType: options.rateLimitType || 'default',
    auditAction: options.auditAction
  });
}

export default {
  securityMiddleware,
  createSecureAPI,
  createMedicalAPI,
  createTelemedicineAPI,
  createAdminAPI,
  createPublicAPI
};
