import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth, createAuthContext  } from '@altamedica/auth';;

import { logger } from '@altamedica/shared/services/logger.service';
// Tipos de middleware de autorización para telemedicina
export interface TelemedicineAuthOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  requirePermissions?: string[];
  checkResourceOwnership?: boolean;
  allowSelfAccess?: boolean;
}

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    patientId?: string;
    doctorId?: string;
    status: string;
  };
}

/**
 * Middleware principal de autenticación para endpoints de telemedicina
 */
export function telemedicineAuthMiddleware(options: TelemedicineAuthOptions = {}) {
  const {
    requireAuth = true,
    allowedRoles = ['doctor', 'patient'],
    requirePermissions = ['telemedicine'],
    checkResourceOwnership = true,
    allowSelfAccess = true
  } = options;

  return async (req: AuthenticatedRequest): Promise<NextResponse | void> => {
    try {
      // 1. Verificar autenticación si es requerida
      if (requireAuth) {
        const authResult = await UnifiedAuth(req);
        
        if (!authResult.success) {
          return authResult.response!;
        }

        // Agregar usuario autenticado al request
        req.user = authResult.user;
      }

      // 2. Verificar roles permitidos
      if (req.user && allowedRoles.length > 0) {
        const authContext = createAuthContext(req.user);
        const hasValidRole = allowedRoles.some(role => authContext.hasRole(role as any));
        
        if (!hasValidRole) {
          return NextResponse.json(
            { 
              error: 'Insufficient role permissions',
              code: 'INSUFFICIENT_ROLE',
              required: allowedRoles,
              current: req.user.role
            },
            { status: 403 }
          );
        }
      }

      // 3. Verificar permisos específicos
      if (req.user && requirePermissions.length > 0) {
        const authContext = createAuthContext(req.user);
        const hasValidPermission = requirePermissions.every(permission => 
          authContext.hasPermission(permission)
        );
        
        if (!hasValidPermission) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              required: requirePermissions,
              current: req.user.permissions
            },
            { status: 403 }
          );
        }
      }

      // 4. Verificar propiedad del recurso (si es aplicable)
      if (req.user && checkResourceOwnership) {
        const ownershipCheck = await checkTelemedicineResourceOwnership(req);
        
        if (ownershipCheck.shouldCheck && !ownershipCheck.hasAccess) {
          return NextResponse.json(
            { 
              error: 'Access denied to this resource',
              code: 'RESOURCE_ACCESS_DENIED'
            },
            { status: 403 }
          );
        }
      }

      // Si llegamos aquí, la autenticación y autorización son válidas
      return;

    } catch (error) {
      logger.error('Telemedicine auth middleware error:', undefined, error);
      return NextResponse.json(
        { 
          error: 'Authentication service error',
          code: 'AUTH_SERVICE_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Verificar si el usuario tiene acceso al recurso de telemedicina específico
 */
async function checkTelemedicineResourceOwnership(req: AuthenticatedRequest): Promise<{
  shouldCheck: boolean;
  hasAccess: boolean;
}> {
  const user = req.user!;
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');

  // Extraer IDs de la URL
  const sessionId = extractSessionId(pathSegments);
  const roomId = extractRoomId(pathSegments);
  const userId = extractUserId(pathSegments);

  // No verificar ownership para endpoints generales
  if (!sessionId && !roomId && !userId) {
    return { shouldCheck: false, hasAccess: true };
  }

  try {
    // Importar servicio de telemedicina
    const { TelemedicineService } = await import('@/lib/mock-medical');
    const { prisma } = await import('@/lib/mock-medical');
    const telemedicineService = new TelemedicineService(prisma);

    // Verificar acceso por sessionId
    if (sessionId) {
      const session = await telemedicineService.getSessionById(sessionId);
      
      if (!session) {
        return { shouldCheck: true, hasAccess: false };
      }

      // Verificar si el usuario es parte de la sesión
      const authContext = createAuthContext(user);
      const isPatient = user.patientId === session.patientId;
      const isDoctor = user.doctorId === session.doctorId;
      const isAdmin = authContext.hasRole('admin' as any);

      return { 
        shouldCheck: true, 
        hasAccess: isPatient || isDoctor || isAdmin 
      };
    }

    // Verificar acceso por roomId
    if (roomId) {
      const session = await telemedicineService.getSessionByRoomId(roomId);
      
      if (!session) {
        return { shouldCheck: true, hasAccess: false };
      }

      const authContext = createAuthContext(user);
      const isPatient = user.patientId === session.patientId;
      const isDoctor = user.doctorId === session.doctorId;
      const isAdmin = authContext.hasRole('admin' as any);

      return { 
        shouldCheck: true, 
        hasAccess: isPatient || isDoctor || isAdmin 
      };
    }

    // Verificar acceso por userId (para endpoints de sesiones por usuario)
    if (userId) {
      const authContext = createAuthContext(user);
      const isOwnData = user.userId === userId || 
                       user.patientId === userId || 
                       user.doctorId === userId;
      const isAdmin = authContext.hasRole('admin' as any);

      return { 
        shouldCheck: true, 
        hasAccess: isOwnData || isAdmin 
      };
    }

    return { shouldCheck: false, hasAccess: true };

  } catch (error) {
    logger.error('Error checking resource ownership:', undefined, error);
    return { shouldCheck: true, hasAccess: false };
  }
}

/**
 * Middleware específico para endpoints de sesiones
 */
export function sessionAuthMiddleware() {
  return telemedicineAuthMiddleware({
    requireAuth: true,
    allowedRoles: ['doctor', 'patient', 'admin'],
    requirePermissions: ['telemedicine'],
    checkResourceOwnership: true
  });
}

/**
 * Middleware específico para endpoints de chat
 */
export function chatAuthMiddleware() {
  return telemedicineAuthMiddleware({
    requireAuth: true,
    allowedRoles: ['doctor', 'patient'],
    requirePermissions: ['telemedicine'],
    checkResourceOwnership: true
  });
}

/**
 * Middleware específico para endpoints administrativos
 */
export function adminTelemedicineAuthMiddleware() {
  return telemedicineAuthMiddleware({
    requireAuth: true,
    allowedRoles: ['admin', 'supervisor'],
    requirePermissions: ['telemedicine', 'admin'],
    checkResourceOwnership: false
  });
}

/**
 * Middleware específico para médicos
 */
export function doctorTelemedicineAuthMiddleware() {
  return telemedicineAuthMiddleware({
    requireAuth: true,
    allowedRoles: ['doctor'],
    requirePermissions: ['telemedicine'],
    checkResourceOwnership: true
  });
}

/**
 * Middleware específico para pacientes
 */
export function patientTelemedicineAuthMiddleware() {
  return telemedicineAuthMiddleware({
    requireAuth: true,
    allowedRoles: ['patient'],
    requirePermissions: ['telemedicine'],
    checkResourceOwnership: true
  });
}

// Funciones auxiliares para extraer IDs de la URL
function extractSessionId(pathSegments: string[]): string | null {
  const sessionIndex = pathSegments.findIndex(segment => segment === 'sessions');
  if (sessionIndex !== -1 && pathSegments[sessionIndex + 1]) {
    return pathSegments[sessionIndex + 1];
  }
  return null;
}

function extractRoomId(pathSegments: string[]): string | null {
  const roomIndex = pathSegments.findIndex(segment => segment === 'rooms');
  if (roomIndex !== -1 && pathSegments[roomIndex + 1]) {
    return pathSegments[roomIndex + 1];
  }
  return null;
}

function extractUserId(pathSegments: string[]): string | null {
  const userIndex = pathSegments.findIndex(segment => segment === 'user');
  if (userIndex !== -1 && pathSegments[userIndex + 1]) {
    return pathSegments[userIndex + 1];
  }
  return null;
}

/**
 * Función helper para usar en API routes
 */
export async function withTelemedicineAuth<T>(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<T>,
  options?: TelemedicineAuthOptions
): Promise<T | NextResponse> {
  const authMiddleware = telemedicineAuthMiddleware(options);
  const authResult = await authMiddleware(req as AuthenticatedRequest);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  return handler(req as AuthenticatedRequest);
}

/**
 * Decorator para rutas de API con autenticación automática
 */
export function requireTelemedicineAuth(options?: TelemedicineAuthOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      const authResult = await withTelemedicineAuth(req, () => method.apply(this, [req, ...args]), options);
      return authResult;
    };
    
    return descriptor;
  };
}

export default {
  telemedicineAuthMiddleware,
  sessionAuthMiddleware,
  chatAuthMiddleware,
  adminTelemedicineAuthMiddleware,
  doctorTelemedicineAuthMiddleware,
  patientTelemedicineAuthMiddleware,
  withTelemedicineAuth,
  requireTelemedicineAuth
};