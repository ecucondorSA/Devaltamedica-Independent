/**
 * UnifiedAuthSystem - Sistema de autenticación unificado basado en Firebase Session Cookies
 * Eliminado completamente el flujo SSO/JWT - Solo cookies HttpOnly
 */

import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb, getAuthAdmin } from '../lib/firebase-admin';
import { AUTH_COOKIES } from '../constants/auth-cookies';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  AuthContext,
  AuthResult,
  AuthToken,
  UserRole,
  normalizeUserRole
} from '@altamedica/types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface NextAuthResult extends Omit<AuthResult, 'response'> {
  response?: NextResponse;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  idToken: z.string().optional(),
  rememberMe: z.boolean().optional()
}).refine(data => data.password || data.idToken, {
  message: "Se requiere contraseña o token de Firebase"
});

// ============================================================================
// MFA CONFIGURATION
// ============================================================================

const MFA_REQUIRED_ROLES: UserRole[] = ['ADMIN', 'DOCTOR'];

// ============================================================================
// ROUTE PERMISSIONS CONFIGURATION
// ============================================================================

export const routePermissions: Record<string, { 
  roles?: UserRole[]; 
  permissions?: string[]; 
  public?: boolean;
  allowAnyAuthenticated?: boolean;
}> = {
  // Public routes
  '/api/health': { public: true },
  '/api/v1/auth/session-login': { public: true },
  '/api/v1/auth/register': { public: true },
  
  // Authenticated routes (any role)
  '/api/v1/auth/session-logout': { allowAnyAuthenticated: true },
  '/api/v1/auth/session-verify': { allowAnyAuthenticated: true },
  '/api/v1/auth/me': { allowAnyAuthenticated: true },
  
  // Admin routes
  '/api/v1/admin': { roles: [UserRole.ADMIN] },
  '/api/v1/users': { roles: [UserRole.ADMIN], permissions: ['users:manage'] },
  '/api/v1/settings': { roles: [UserRole.ADMIN] },
  
  // Doctor routes
  '/api/v1/doctors': { roles: [UserRole.DOCTOR, UserRole.ADMIN] },
  '/api/v1/appointments/doctor': { roles: [UserRole.DOCTOR] },
  '/api/v1/prescriptions': { roles: [UserRole.DOCTOR], permissions: ['prescriptions:write'] },
  
  // Patient routes
  '/api/v1/patients': { roles: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] },
  '/api/v1/appointments/patient': { roles: [UserRole.PATIENT] },
  '/api/v1/medical-records': { roles: [UserRole.PATIENT, UserRole.DOCTOR], permissions: ['medical:read'] },
  
  // Company routes
  '/api/v1/companies': { roles: [UserRole.COMPANY, UserRole.ADMIN] },
  '/api/v1/marketplace': { roles: [UserRole.COMPANY, UserRole.DOCTOR] },
  
  // Telemedicine routes
  '/api/v1/telemedicine': { roles: [UserRole.PATIENT, UserRole.DOCTOR] },
  '/api/v1/webrtc': { roles: [UserRole.PATIENT, UserRole.DOCTOR] }
};

// ============================================================================
// CORE AUTH SERVICE - Solo Session Cookies
// ============================================================================

export class UnifiedAuthService {
  private static readonly usersCollection = 'users';
  private static readonly sessionCollection = 'sessions';
  
  /**
   * Verifica una cookie de sesión de Firebase
   */
  static async verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken | null> {
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      return decodedToken;
    } catch (error) {
      logger.error('Error verificando session cookie:', undefined, error);
      return null;
    }
  }

  /**
   * Obtiene el perfil del usuario desde la base de datos
   */
  static async getUserProfile(userId: string): Promise<AuthToken | null> {
    try {
      if (!adminDb) {
        logger.error('Database not initialized');
        return null;
      }
      
      const userDoc = await adminDb.collection(this.usersCollection).doc(userId).get();
      
      if (!userDoc.exists) {
        logger.error('User not found in database');
        return null;
      }

      const userData = userDoc.data()!;
      
      // Verificar si el usuario está activo
      if (!userData.isActive) {
        logger.error('User is not active');
        return null;
      }

      // Normalizar rol
      const normalizedRole = normalizeUserRole(userData.role);
      if (!normalizedRole) {
        logger.warn(`Rol inválido para usuario ${userId}: ${userData.role}`);
        return null;
      }

      return {
        userId: userDoc.id,
        email: userData.email,
        role: normalizedRole,
        firebaseUid: userDoc.id,
        permissions: userData.permissions || [],
        patientId: userData.patientId,
        doctorId: userData.doctorId,
        companyId: userData.companyId,
        firstName: userData.firstName,
        lastName: userData.lastName
      } as AuthToken;
    } catch (error) {
      logger.error('Error getting user profile:', undefined, error);
      return null;
    }
  }

  /**
   * Cierra la sesión revocando los refresh tokens
   */
  static async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authAdmin = getAuthAdmin();
      if (!authAdmin) {
        return {
          success: false,
          error: 'Firebase Admin no inicializado'
        };
      }
      
      // Revocar todos los refresh tokens del usuario
      await authAdmin.revokeRefreshTokens(userId);
      
      // Registrar el logout en la base de datos
      if (adminDb) {
        await adminDb.collection('audit_logs').add({
          userId,
          action: 'LOGOUT',
          timestamp: new Date().toISOString(),
          type: 'auth'
        });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Logout error:', undefined, error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }
}

// ============================================================================
// UNIFIED AUTH MIDDLEWARE - Principal función de autenticación
// ============================================================================

/**
 * Middleware unificado de autenticación para todas las rutas
 * Verifica session cookies y valida roles/permisos
 */
export async function UnifiedAuth(
  request: NextRequest,
  requiredRoles?: UserRole[] | UserRole,
  requiredPermissions?: string[]
): Promise<NextAuthResult> {
  try {
    // Obtener la cookie de sesión
    const sessionCookie = request.cookies.get(AUTH_COOKIES.session)?.value;
    
    if (!sessionCookie) {
      return {
        success: false,
        error: 'No hay sesión activa',
        response: NextResponse.json(
          { success: false, error: 'UNAUTHORIZED' },
          { 
            status: 401,
            headers: {
              'X-Auth-Error': 'NO_SESSION',
              'WWW-Authenticate': 'Session'
            }
          }
        )
      };
    }

    // Verificar la cookie de sesión con Firebase
    const decodedToken = await UnifiedAuthService.verifySessionCookie(sessionCookie);
    
    if (!decodedToken) {
      return {
        success: false,
        error: 'Sesión inválida o expirada',
        response: NextResponse.json(
          { success: false, error: 'INVALID_SESSION' },
          { 
            status: 401,
            headers: {
              'X-Auth-Error': 'INVALID_SESSION',
              'WWW-Authenticate': 'Session'
            }
          }
        )
      };
    }

    // Obtener el perfil completo del usuario
    const user = await UnifiedAuthService.getUserProfile(decodedToken.uid);
    
    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado o inactivo',
        response: NextResponse.json(
          { success: false, error: 'USER_NOT_FOUND' },
          { 
            status: 404,
            headers: {
              'X-Auth-Error': 'USER_NOT_FOUND'
            }
          }
        )
      };
    }

    // Verificar MFA para roles críticos
    if (MFA_REQUIRED_ROLES.includes(user.role)) {
      const userDoc = await adminDb?.collection('users').doc(user.userId).get();
      const userData = userDoc?.data();
      
      if (!userData?.mfaEnabled) {
        logger.warn(`⚠️ MFA requerido pero no habilitado para usuario ${user.userId} con rol ${user.role}`);
        return {
          success: false,
          error: 'MFA requerido para este rol',
          response: NextResponse.json(
            { 
              success: false, 
              error: 'MFA_REQUIRED',
              message: 'La autenticación de dos factores es obligatoria para roles administrativos y médicos'
            },
            { 
              status: 403,
              headers: {
                'X-Auth-Error': 'MFA_REQUIRED',
                'X-MFA-Enrollment': '/api/v1/auth/mfa/enroll'
              }
            }
          )
        };
      }
    }

    // Verificar roles si se especificaron
    if (requiredRoles) {
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!rolesArray.includes(user.role)) {
        return {
          success: false,
          error: 'Rol insuficiente',
          response: NextResponse.json(
            { 
              success: false, 
              error: 'INSUFFICIENT_ROLE',
              required: rolesArray,
              current: user.role
            },
            { 
              status: 403,
              headers: {
                'X-Auth-Error': 'INSUFFICIENT_ROLE',
                'X-Required-Roles': rolesArray.join(','),
                'X-Current-Role': user.role
              }
            }
          )
        };
      }
    }

    // Verificar permisos si se especificaron
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(
        permission => user.permissions?.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return {
          success: false,
          error: 'Permisos insuficientes',
          response: NextResponse.json(
            { 
              success: false, 
              error: 'INSUFFICIENT_PERMISSIONS',
              required: requiredPermissions,
              current: user.permissions
            },
            { 
              status: 403,
              headers: {
                'X-Auth-Error': 'INSUFFICIENT_PERMISSIONS',
                'X-Required-Permissions': requiredPermissions.join(',')
              }
            }
          )
        };
      }
    }

    // Registrar acceso para auditoría
    if (adminDb) {
      await adminDb.collection('audit_logs').add({
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        action: 'API_ACCESS',
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }

    // Autenticación exitosa
    return {
      success: true,
      user,
      context: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        firebaseUid: user.firebaseUid
      } as AuthContext
    };
  } catch (error) {
    logger.error('UnifiedAuth error:', undefined, error);
    return {
      success: false,
      error: 'Error interno del servidor',
      response: NextResponse.json(
        { success: false, error: 'INTERNAL_ERROR' },
        { 
          status: 500,
          headers: {
            'X-Auth-Error': 'INTERNAL_ERROR'
          }
        }
      )
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Middleware helper para requerir autenticación
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const auth = await UnifiedAuth(request);
    if (!auth.success) {
      return auth.response;
    }
    return handler(request, auth, ...args);
  };
}

/**
 * Middleware helper para requerir rol específico
 */
export function requireRole(role: UserRole | UserRole[]) {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      const auth = await UnifiedAuth(request, role);
      if (!auth.success) {
        return auth.response;
      }
      return handler(request, auth, ...args);
    };
  };
}

/**
 * Wrapper para rutas con autenticación
 */
export function withAuth(
  handler: (request: NextRequest, auth: NextAuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await UnifiedAuth(request);
    if (!auth.success) {
      return auth.response!;
    }
    return handler(request, auth);
  };
}

/**
 * Wrapper para rutas con rol específico
 */
export function withRole(
  role: UserRole | UserRole[],
  handler: (request: NextRequest, auth: NextAuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await UnifiedAuth(request, role);
    if (!auth.success) {
      return auth.response!;
    }
    return handler(request, auth);
  };
}

// Re-export types
export { UserRole } from '@altamedica/types';
export type { AuthToken, AuthContext, AuthResult } from '@altamedica/types';