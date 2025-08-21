import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { jwtService } from '@altamedica/shared';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Middleware de enforcement de MFA
 * Requiere MFA para roles críticos (admin, doctor)
 * Cumple con requisitos de seguridad HIPAA para acceso a PHI
 */

// Roles que requieren MFA obligatorio
const MFA_REQUIRED_ROLES = ['admin', 'doctor'];

// Rutas excluidas del enforcement MFA
const EXCLUDED_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/sso',
  '/api/v1/auth/mfa/verify',
  '/api/v1/auth/mfa/setup',
  '/api/v1/auth/mfa/enable',
  '/api/v1/auth/logout',
  '/api/health'
];

export interface MFAEnforcementResult {
  success: boolean;
  requiresMFA?: boolean;
  userId?: string;
  role?: string;
  response?: NextResponse;
}

/**
 * Verifica si un usuario requiere MFA basado en su rol y configuración
 */
export async function enforceMFA(
  request: NextRequest,
  userId: string,
  userRole: string
): Promise<MFAEnforcementResult> {
  try {
    // Verificar si la ruta está excluida
    const path = request.nextUrl.pathname;
    if (EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))) {
      return { success: true };
    }

    // Verificar si el rol requiere MFA
    if (!MFA_REQUIRED_ROLES.includes(userRole)) {
      return { success: true };
    }

    // Obtener información del usuario desde Firestore
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      };
    }

    const userData = userDoc.data();

    // Verificar si MFA está habilitado para el usuario
    if (!userData.mfaEnabled) {
      // Para roles críticos, MFA debe ser obligatorio
      return {
        success: false,
        requiresMFA: true,
        userId,
        role: userRole,
        response: NextResponse.json(
          {
            success: false,
            error: 'MFA requerido',
            message: 'Su rol requiere autenticación de dos factores. Por favor, configure MFA en su perfil.',
            requiresMFASetup: true,
            userId,
            role: userRole
          },
          { status: 403 }
        )
      };
    }

    // Verificar token JWT para validar MFA
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('altamedica_token');
    const token = authHeader?.replace('Bearer ', '') || cookieToken?.value;

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Token no encontrado' },
          { status: 401 }
        )
      };
    }

    // Decodificar token para verificar estado MFA
    const decoded = await jwtService.verifyToken(token);
    
    if (!decoded || !decoded.mfaVerified) {
      // El usuario tiene MFA habilitado pero no ha verificado en esta sesión
      return {
        success: false,
        requiresMFA: true,
        userId,
        role: userRole,
        response: NextResponse.json(
          {
            success: false,
            error: 'Verificación MFA requerida',
            message: 'Por favor, complete la verificación de dos factores para continuar.',
            requiresMFAVerification: true,
            userId,
            role: userRole
          },
          { status: 403 }
        )
      };
    }

    // Verificar tiempo desde última verificación MFA
    const lastVerification = userData.lastMfaVerification?.toDate();
    if (lastVerification) {
      const hoursSinceVerification = (Date.now() - lastVerification.getTime()) / (1000 * 60 * 60);
      
      // Re-verificar MFA cada 12 horas para operaciones críticas
      if (hoursSinceVerification > 12) {
        return {
          success: false,
          requiresMFA: true,
          userId,
          role: userRole,
          response: NextResponse.json(
            {
              success: false,
              error: 'Re-verificación MFA requerida',
              message: 'Por seguridad, debe verificar MFA nuevamente.',
              requiresMFAReVerification: true,
              userId,
              role: userRole
            },
            { status: 403 }
          )
        };
      }
    }

    // Verificar dispositivo confiable si está configurado
    const deviceToken = request.cookies.get('altamedica_device');
    if (deviceToken && userData.trustedDevices) {
      const isTrustedDevice = userData.trustedDevices.some(
        (device: any) => device.token === deviceToken.value
      );

      if (isTrustedDevice) {
        // Dispositivo confiable, permitir acceso
        return { success: true };
      }
    }

    // Todo verificado correctamente
    return { success: true };

  } catch (error) {
    logger.error('[MFA Enforcement] Error:', undefined, error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Error al verificar MFA' },
        { status: 500 }
      )
    };
  }
}

/**
 * Middleware wrapper para aplicar enforcement MFA
 */
export async function withMFAEnforcement(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  userId: string,
  userRole: string
): Promise<NextResponse> {
  const mfaResult = await enforceMFA(request, userId, userRole);

  if (!mfaResult.success) {
    return mfaResult.response || NextResponse.json(
      { success: false, error: 'MFA requerido' },
      { status: 403 }
    );
  }

  // Continuar con el handler original
  return handler(request);
}

/**
 * Verifica si una ruta específica requiere MFA
 */
export function requiresMFAForRoute(path: string, role: string): boolean {
  // Excluir rutas públicas
  if (EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))) {
    return false;
  }

  // Rutas críticas que siempre requieren MFA
  const CRITICAL_PATHS = [
    '/api/v1/patients',
    '/api/v1/prescriptions',
    '/api/v1/medical-records',
    '/api/v1/audit-logs',
    '/api/v1/users/admin',
    '/api/v1/billing',
    '/api/v1/payments'
  ];

  // Verificar si es una ruta crítica
  const isCriticalPath = CRITICAL_PATHS.some(critical => path.startsWith(critical));

  // Requiere MFA si:
  // 1. El rol está en la lista de roles que requieren MFA
  // 2. Es una ruta crítica
  return MFA_REQUIRED_ROLES.includes(role) || isCriticalPath;
}

/**
 * Configura headers de seguridad para respuestas MFA
 */
export function setMFASecurityHeaders(response: NextResponse): void {
  // Headers de seguridad adicionales para operaciones MFA
  response.headers.set('X-MFA-Required', 'true');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

/**
 * Registra eventos de MFA para auditoría
 */
export async function logMFAEvent(
  eventType: 'enforcement' | 'bypass' | 'failure',
  userId: string,
  role: string,
  path: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const mfaLogsRef = doc(db, 'mfa_logs', `${userId}_${Date.now()}`);
    
    await setDoc(mfaLogsRef, {
      eventType,
      userId,
      role,
      path,
      timestamp: new Date(),
      metadata,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip
    });
  } catch (error) {
    logger.error('[MFA Logging] Error:', undefined, error);
  }
}