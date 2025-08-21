/**
 * 🔐 UNIFIED AUTHENTICATION MIDDLEWARE - ALTAMEDICA
 * Sistema de autenticación centralizado para todos los endpoints
 * Versión: 2.0.0 - Refactorizado para arquitectura orientada a dominios
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIES, LEGACY_AUTH_COOKIES } from '../../constants/auth-cookies';
import { adminAuth, adminDb } from '../lib/firebase-admin';

import { logger } from '@altamedica/shared/services/logger.service';
export interface AuthUser {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'COMPANY';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  companyId?: string;
  permissions: string[];
  metadata?: {
    lastSignIn?: Date;
    signInCount?: number;
    ipAddress?: string;
  };
}

export interface ServiceContext {
  userId: string;
  userRole: string;
  companyId?: string;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  context?: ServiceContext;
  response?: NextResponse;
}

// Main authentication function - simplified interface
export async function UnifiedAuth(
  request: NextRequest,
  allowedRoles: string[] = [],
  requiredPermissions: string[] = []
): Promise<AuthResult> {
  try {
    // Extract and verify token
    const authUser = await extractAndVerifyToken(request);
    
    if (!authUser) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(authUser.role) && authUser.role !== 'ADMIN') {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Insufficient role permissions' },
          { status: 403 }
        )
      };
    }

    // Check specific permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        authUser.permissions.includes(permission) || authUser.role === 'ADMIN'
      );

      if (!hasRequiredPermissions) {
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          )
        };
      }
    }

    // Create service context
    const context: ServiceContext = {
      userId: authUser.id,
      userRole: authUser.role,
      companyId: authUser.companyId,
      permissions: authUser.permissions
    };

    return {
      success: true,
      user: authUser,
      context
    };

  } catch (error) {
    logger.error('Authentication error:', undefined, error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication system error' },
        { status: 500 }
      )
    };
  }
}

// Extract and verify Firebase token
async function extractAndVerifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try different token sources
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // Fallback to cookie (standard name with legacy fallback)
    if (!token) {
      token = request.cookies.get(AUTH_COOKIES.token)?.value || request.cookies.get(LEGACY_AUTH_COOKIES.token)?.value || request.cookies.get('auth-token')?.value;
    }
    
    if (!token) {
      return null;
    }

    // Handle development/testing tokens
    if (token === 'mock-token' && process.env.NODE_ENV === 'development') {
      return createMockUser();
    }

    // Verify Firebase token
    if (!adminAuth || !adminDb) {
      logger.error('Firebase Admin no inicializado');
      return null;
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user profile from Firestore
  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      logger.error('User profile not found for uid:', decodedToken.uid);
      return null;
    }

    const userData = userDoc.data()!;
    
    // Check if user is active
    if (!userData.isActive) {
      logger.error('User account is inactive:', decodedToken.uid);
      return null;
    }

    // Get user permissions
    const permissions = getUserPermissions(userData.role, userData.companyId);

    const authUser: AuthUser = {
      id: decodedToken.uid,
      email: decodedToken.email || userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive,
      companyId: userData.companyId,
      permissions,
      metadata: {
        lastSignIn: new Date(),
        signInCount: userData.metadata?.signInCount || 0,
        ipAddress: getClientIP(request)
      }
    };

    return authUser;

  } catch (error) {
    logger.error('Token verification error:', undefined, error);
    return null;
  }
}

// Get user permissions based on role
function getUserPermissions(role: string, companyId?: string): string[] {
  const basePermissions: Record<string, string[]> = {
    ADMIN: ['admin:all'],
    DOCTOR: [
      'appointments:read', 'appointments:create', 'appointments:update',
      'patients:read', 'patients:create', 'patients:update',
      'medical-records:read', 'medical-records:create', 'medical-records:update',
      'prescriptions:read', 'prescriptions:create', 'prescriptions:update',
      'telemedicine:read', 'telemedicine:create', 'telemedicine:update',
      'ai:read', 'ai:create'
    ],
    PATIENT: [
      'appointments:read', 'appointments:create',
      'medical-records:read',
      'prescriptions:read',
      'telemedicine:read', 'telemedicine:create',
      'notifications:read'
    ],
    COMPANY: [
      'marketplace:read', 'marketplace:create', 'marketplace:update',
      'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
      'applications:read', 'applications:update'
    ]
  };

  return basePermissions[role] || [];
}

// Create mock user for development
function createMockUser(): AuthUser {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock user not allowed in production');
  }

  return {
    id: 'mock-user-id',
    email: 'dev@altamedica.com',
    role: 'DOCTOR',
    firstName: 'Dr. Mock',
    lastName: 'User',
    isActive: true,
    permissions: [
      'appointments:read', 'appointments:create', 'appointments:update',
      'patients:read', 'patients:create', 'patients:update',
      'medical-records:read', 'medical-records:create', 'medical-records:update',
      'prescriptions:read', 'prescriptions:create', 'prescriptions:update',
      'telemedicine:read', 'telemedicine:create',
      'ai:read', 'ai:create'
    ]
  };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || 'unknown';
}