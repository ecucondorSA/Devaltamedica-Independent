/**
 * 🔐 UNIFIED AUTHENTICATION MIDDLEWARE - ALTAMEDICA
 * Sistema de autenticación centralizado para todos los endpoints
 * Versión: 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createErrorResponse } from '@/lib/response-helpers';
import { auditLog } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';

import { logger } from '@altamedica/shared/services/logger.service';
export interface AuthUser {
  uid: string;
  email: string;
  role: string;
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

export interface AuthContext {
  isAuthenticated: boolean;
  user?: AuthUser;
  token?: string;
  permissions: string[];
}

export interface AuthOptions {
  required?: boolean;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  skipRateLimit?: boolean;
  rateLimitKey?: string;
  auditAction?: string;
}

// Main authentication middleware
export async function withUnifiedAuth(
  request: NextRequest,
  handler: (request: NextRequest, authContext: AuthContext) => Promise<NextResponse>,
  options: AuthOptions = {}
): Promise<NextResponse> {
  const {
    required = true,
    allowedRoles = [],
    requiredPermissions = [],
    skipRateLimit = false,
    rateLimitKey = 'default',
    auditAction
  } = options;

  try {
    // Rate limiting (if not skipped)
    if (!skipRateLimit) {
      const rateLimitResult = await rateLimit(request, rateLimitKey);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
            retryAfter: rateLimitResult.retryAfter
          }),
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
            }
          }
        );
      }
    }

    // Extract and verify token
    const authResult = await extractAndVerifyToken(request);
    
    // Check if authentication is required
    if (required && !authResult.isAuthenticated) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Check role permissions
    if (authResult.user && allowedRoles.length > 0) {
      if (!allowedRoles.includes(authResult.user.role) && !authResult.user.permissions.includes('admin:all')) {
        await auditLog({
          action: 'unauthorized_access_attempt',
          userId: authResult.user.uid,
          resource: 'api',
          details: {
            requiredRoles: allowedRoles,
            userRole: authResult.user.role,
            endpoint: request.url
          },
          category: 'security',
          severity: 'high',
          success: false
        });

        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Insufficient role permissions'),
          { status: 403 }
        );
      }
    }

    // Check specific permissions
    if (authResult.user && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        authResult.user!.permissions.includes(permission) ||
        authResult.user!.permissions.includes('admin:all')
      );

      if (!hasRequiredPermissions) {
        await auditLog({
          action: 'unauthorized_permission_attempt',
          userId: authResult.user.uid,
          resource: 'api',
          details: {
            requiredPermissions,
            userPermissions: authResult.user.permissions,
            endpoint: request.url
          },
          category: 'security',
          severity: 'high',
          success: false
        });

        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Insufficient permissions'),
          { status: 403 }
        );
      }
    }

    // Add service context to request
    if (authResult.user) {
      (request as any).serviceContext = {
        userId: authResult.user.uid,
        userRole: authResult.user.role,
        companyId: authResult.user.companyId,
        permissions: authResult.user.permissions
      };
    }

    // Audit successful authentication (if specified)
    if (auditAction && authResult.user) {
      await auditLog({
        action: auditAction,
        userId: authResult.user.uid,
        resource: 'api',
        details: {
          endpoint: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ipAddress: getClientIP(request)
        },
        category: 'api',
        severity: 'low'
      });
    }

    // Call the actual handler
    return await handler(request, authResult);

  } catch (error) {
    logger.error('Authentication middleware error:', undefined, error);
    
    return NextResponse.json(
      createErrorResponse('AUTH_ERROR', 'Authentication system error'),
      { status: 500 }
    );
  }
}

// Extract and verify Firebase token
async function extractAndVerifyToken(request: NextRequest): Promise<AuthContext> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isAuthenticated: false,
        permissions: []
      };
    }

    const token = authHeader.substring(7);
    
    // Handle development/testing tokens
    if (token === 'mock-token' || process.env.NODE_ENV === 'development') {
      return await createMockAuthContext(token);
    }

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data()!;
    
    // Check if user is active
    if (!userData.isActive) {
      throw new Error('User account is inactive');
    }

    // Get user permissions
    const permissions = await getUserPermissions(decodedToken.uid, userData.role, userData.companyId);

    // Update last activity
    await updateUserActivity(decodedToken.uid, request);

    const authUser: AuthUser = {
      uid: decodedToken.uid,
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

    return {
      isAuthenticated: true,
      user: authUser,
      token,
      permissions
    };

  } catch (error) {
    logger.error('Token verification error:', undefined, error);
    
    return {
      isAuthenticated: false,
      permissions: []
    };
  }
}

// Get user permissions based on role and company
async function getUserPermissions(userId: string, role: string, companyId?: string): Promise<string[]> {
  const basePermissions: Record<string, string[]> = {
    admin: ['admin:all'],
    doctor: [
      'appointments:read', 'appointments:create', 'appointments:update',
      'patients:read', 'patients:create', 'patients:update',
      'medical-records:read', 'medical-records:create', 'medical-records:update',
      'prescriptions:read', 'prescriptions:create', 'prescriptions:update',
      'lab-results:read', 'lab-results:create',
      'telemedicine:read', 'telemedicine:create', 'telemedicine:update',
      'ai:read', 'ai:create',
      'reports:read', 'reports:create'
    ],
    patient: [
      'appointments:read', 'appointments:create',
      'medical-records:read',
      'prescriptions:read',
      'lab-results:read',
      'telemedicine:read', 'telemedicine:create',
      'notifications:read'
    ],
    company: [
      'doctors:read', 'doctors:create', 'doctors:update',
      'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
      'marketplace:read',
      'reports:read'
    ],
    nurse: [
      'appointments:read', 'appointments:update',
      'patients:read', 'patients:update',
      'medical-records:read',
      'lab-results:read', 'lab-results:create'
    ]
  };

  let permissions = basePermissions[role] || [];

  // Add company-specific permissions
  if (companyId) {
    const companyPermissions = await getCompanyPermissions(companyId);
    permissions = [...permissions, ...companyPermissions];
  }

  // Add custom user permissions
  const customPermissions = await getCustomUserPermissions(userId);
  permissions = [...permissions, ...customPermissions];

  return [...new Set(permissions)]; // Remove duplicates
}

// Get company-specific permissions
async function getCompanyPermissions(companyId: string): Promise<string[]> {
  try {
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return [];
    }
    
    const companyData = companyDoc.data()!;
    return companyData.permissions || [];
  } catch (error) {
    logger.error('Error getting company permissions:', undefined, error);
    return [];
  }
}

// Get custom user permissions
async function getCustomUserPermissions(userId: string): Promise<string[]> {
  try {
    const permissionsDoc = await adminDb.collection('user_permissions').doc(userId).get();
    if (!permissionsDoc.exists) {
      return [];
    }
    
    const permissionsData = permissionsDoc.data()!;
    return permissionsData.permissions || [];
  } catch (error) {
    logger.error('Error getting custom user permissions:', undefined, error);
    return [];
  }
}

// Update user activity
async function updateUserActivity(userId: string, request: NextRequest): Promise<void> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      'metadata.lastActivity': new Date(),
      'metadata.lastIP': getClientIP(request),
      'metadata.lastUserAgent': request.headers.get('user-agent'),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error updating user activity:', undefined, error);
    // Don't throw error, as this is not critical
  }
}

// Create mock authentication context for development
async function createMockAuthContext(token: string): Promise<AuthContext> {
  if (process.env.NODE_ENV === 'production') {
    return {
      isAuthenticated: false,
      permissions: []
    };
  }

  const mockUser: AuthUser = {
    uid: 'mock-user-id',
    email: 'dev@altamedica.com',
    role: 'doctor',
    firstName: 'Dr. Mock',
    lastName: 'User',
    isActive: true,
    companyId: 'mock-company',
    permissions: [
      'appointments:read', 'appointments:create', 'appointments:update',
      'patients:read', 'patients:create', 'patients:update',
      'medical-records:read', 'medical-records:create', 'medical-records:update',
      'prescriptions:read', 'prescriptions:create', 'prescriptions:update',
      'lab-results:read', 'lab-results:create',
      'telemedicine:read', 'telemedicine:create',
      'ai:read', 'ai:create'
    ]
  };

  return {
    isAuthenticated: true,
    user: mockUser,
    token,
    permissions: mockUser.permissions
  };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Convenience function for creating authenticated routes
export function createAuthenticatedRoute(
  handler: (request: NextRequest, authContext: AuthContext) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    return withUnifiedAuth(request, handler, options);
  };
}

// Convenience function for public routes (no auth required)
export function createPublicRoute(
  handler: (request: NextRequest, authContext: AuthContext) => Promise<NextResponse>,
  options: Omit<AuthOptions, 'required'> = {}
) {
  return async (request: NextRequest, context?: any) => {
    return withUnifiedAuth(request, handler, { ...options, required: false });
  };
}