// ============================================================================
// LEGACY AUTH MIDDLEWARE - NOW RE-EXPORTS FROM UNIFIED SYSTEM
// ============================================================================
//
// Este archivo ha sido migrado al UnifiedAuthSystem para consolidar
// múltiples implementaciones de autenticación en una sola API coherente.
//
// COMPATIBILIDAD: Este archivo mantiene la API legacy para retrocompatibilidad
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { UnifiedAuth, UserRole, AuthToken } from '../../../../api-server/src/auth/UnifiedAuthSystem'

// Re-export types para compatibilidad
export type { AuthToken, UserRole }

// Legacy compatibility function
export async function verifyAuthToken(request: NextRequest) {
  const authResult = await UnifiedAuth(request);
  if (authResult.success && authResult.user) {
    // Convertir formato para compatibilidad legacy
    return {
      uid: authResult.user.userId,
      email: authResult.user.email,
      role: authResult.user.role,
      custom_claims: {
        role: authResult.user.role
      }
    };
  }
  return null;
}

export function requireAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authResult = await UnifiedAuth(request);
    
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { error: 'Unauthorized - Se requiere autenticación' },
        { status: 401 }
      );
    }

    // Convertir formato para compatibilidad legacy
    const user = {
      uid: authResult.user?.userId,
      email: authResult.user?.email,
      role: authResult.user?.role,
      custom_claims: {
        role: authResult.user?.role
      }
    };

    return handler(request, user);
  }
}

export function requireRole(roles: string[], handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Convertir roles strings a UserRole enum
    const userRoles = roles.map(role => role.toUpperCase() as UserRole);
    const authResult = await UnifiedAuth(request, userRoles);
    
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { error: authResult.user ? 'Forbidden - Rol insuficiente' : 'Unauthorized - Se requiere autenticación' },
        { status: authResult.user ? 403 : 401 }
      );
    }

    // Convertir formato para compatibilidad legacy
    const user = {
      uid: authResult.user?.userId,
      email: authResult.user?.email,
      role: authResult.user?.role,
      custom_claims: {
        role: authResult.user?.role
      }
    };

    return handler(request, user);
  }
}