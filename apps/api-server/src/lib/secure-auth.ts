/**
 * 🛡️ ALTAMEDICA - SECURE AUTHENTICATION SYSTEM
 * Unified authentication with Firebase + JWT hybrid approach
 * HIPAA Compliant with audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { auditLogger } from './audit-logger'
import { UserRole, UnifiedAuthService } from './auth'
import { getAuthAdmin, getFirestoreAdmin } from './firebase-admin'

import { logger } from '@altamedica/shared/services/logger.service';
// Types for authentication context
export interface SecureAuthContext {
  isAuthenticated: boolean
  user: {
    uid: string
    email: string
    role: UserRole
    permissions: string[]
    firebaseUid?: string
  } | null
  error?: string
  metadata?: {
    ipAddress: string
    userAgent: string
    timestamp: Date
  }
}

// Authentication errors
export class AuthenticationError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * 🔐 Secure token verification with multiple fallbacks
 */
export async function verifySecureToken(token: string): Promise<{
  isValid: boolean
  user?: any
  error?: string
}> {
  try {
    // First, try Firebase ID token verification
    const auth = getAuthAdmin()
    if (auth) {
      try {
        const decodedFirebaseToken = await auth.verifyIdToken(token)
        
        // Get additional user data from Firestore
        const db = getFirestoreAdmin()
        if (db) {
          const userDoc = await db.collection('users').doc(decodedFirebaseToken.uid).get()
          const userData = userDoc.data()
          
          return {
            isValid: true,
            user: {
              uid: decodedFirebaseToken.uid,
              email: decodedFirebaseToken.email,
              role: userData?.role || UserRole.PATIENT,
              permissions: userData?.permissions || [],
              firebaseUid: decodedFirebaseToken.uid,
              emailVerified: decodedFirebaseToken.email_verified,
              isActive: userData?.isActive !== false
            }
          }
        }
        
        // Fallback to Firebase token data only
        return {
          isValid: true,
          user: {
            uid: decodedFirebaseToken.uid,
            email: decodedFirebaseToken.email,
            role: (decodedFirebaseToken.role as UserRole) || UserRole.PATIENT,
            permissions: (decodedFirebaseToken.permissions as string[]) || [],
            firebaseUid: decodedFirebaseToken.uid
          }
        }
      } catch (firebaseError: any) {
        // Log Firebase auth failure
        logger.error('Firebase auth failed:', firebaseError.code || firebaseError.message)
        
        // Try JWT verification as fallback
        try {
          const jwtUser = await UnifiedAuthService.verifyAuthToken(token)
          if (jwtUser) {
            return {
              isValid: true,
              user: jwtUser
            }
          }
        } catch (jwtError) {
          logger.error('JWT verification also failed:', jwtError)
        }
        
        return {
          isValid: false,
          error: `Authentication failed: ${firebaseError.code || firebaseError.message}`
        }
      }
    }
    
    // If Firebase Admin is not available, try JWT only
    const jwtUser = await UnifiedAuthService.verifyAuthToken(token)
    if (jwtUser) {
      return {
        isValid: true,
        user: jwtUser
      }
    }
    
    return {
      isValid: false,
      error: 'No authentication method available'
    }
  } catch (error: any) {
    logger.error('Token verification error:', undefined, error)
    return {
      isValid: false,
      error: `Authentication error: ${error.message}`
    }
  }
}

/**
 * 🛡️ Extract and validate authentication from request
 */
export async function authenticateSecureRequest(request: NextRequest): Promise<SecureAuthContext> {
  const metadata = {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.ip || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date()
  }

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get token from cookies as fallback
  const cookieToken = request.cookies.get('altamedica_token')?.value || request.cookies.get('auth-token')?.value
      
      if (!cookieToken) {
        await auditLogger.logAuthFailure('MISSING_TOKEN', metadata.ipAddress, metadata.userAgent)
        
        return {
          isAuthenticated: false,
          user: null,
          error: 'Authentication token required',
          metadata
        }
      }
      
      // Verify cookie token
      const cookieResult = await verifySecureToken(cookieToken)
      if (!cookieResult.isValid) {
        await auditLogger.logAuthFailure('INVALID_COOKIE_TOKEN', metadata.ipAddress, metadata.userAgent)
        
        return {
          isAuthenticated: false,
          user: null,
          error: cookieResult.error || 'Invalid cookie token',
          metadata
        }
      }
      
      await auditLogger.logAuthSuccess(cookieResult.user, metadata.ipAddress, metadata.userAgent)
      
      return {
        isAuthenticated: true,
        user: cookieResult.user,
        metadata
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the token
    const result = await verifySecureToken(token)
    
    if (!result.isValid) {
      await auditLogger.logAuthFailure('INVALID_TOKEN', metadata.ipAddress, metadata.userAgent)
      
      return {
        isAuthenticated: false,
        user: null,
        error: result.error || 'Invalid authentication token',
        metadata
      }
    }

    // Check if user is active
    if (result.user && result.user.isActive === false) {
      await auditLogger.logAuthFailure('USER_INACTIVE', metadata.ipAddress, metadata.userAgent, result.user.uid)
      
      return {
        isAuthenticated: false,
        user: null,
        error: 'User account is inactive',
        metadata
      }
    }

    // Log successful authentication
    await auditLogger.logAuthSuccess(result.user, metadata.ipAddress, metadata.userAgent)

    return {
      isAuthenticated: true,
      user: result.user,
      metadata
    }
  } catch (error: any) {
    logger.error('Authentication error:', undefined, error)
    await auditLogger.logAuthFailure('SYSTEM_ERROR', metadata.ipAddress, metadata.userAgent)
    
    return {
      isAuthenticated: false,
      user: null,
      error: `Authentication system error: ${error.message}`,
      metadata
    }
  }
}

/**
 * 🛡️ Middleware HOC for securing API routes
 */
export function withSecureAuth(
  handler: (request: NextRequest, auth: SecureAuthContext) => Promise<NextResponse>,
  options: {
    requiredRoles?: UserRole[]
    requiredPermissions?: string[]
    allowInactive?: boolean
  } = {}
) {
  return async function(request: NextRequest): Promise<NextResponse> {
    try {
      const auth = await authenticateSecureRequest(request)
      
      if (!auth.isAuthenticated) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: auth.error || 'Authentication required'
            }
          },
          { status: 401 }
        )
      }

      // Check role requirements
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!auth.user || !options.requiredRoles.includes(auth.user.role)) {
          await auditLogger.logAuthFailure(
            'INSUFFICIENT_ROLE', 
            auth.metadata?.ipAddress || 'unknown',
            auth.metadata?.userAgent || 'unknown',
            auth.user?.uid
          )
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient role permissions'
              }
            },
            { status: 403 }
          )
        }
      }

      // Check permission requirements
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        if (!auth.user || !options.requiredPermissions.every(permission => 
          auth.user!.permissions.includes(permission)
        )) {
          await auditLogger.logAuthFailure(
            'INSUFFICIENT_PERMISSIONS',
            auth.metadata?.ipAddress || 'unknown',
            auth.metadata?.userAgent || 'unknown',
            auth.user?.uid
          )
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions'
              }
            },
            { status: 403 }
          )
        }
      }

      // Call the handler with authenticated context
      return await handler(request, auth)
      
    } catch (error: any) {
      logger.error('Authentication middleware error:', undefined, error)
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication system error'
          }
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 🎯 Convenience functions for common authentication patterns
 */

// For public endpoints that optionally use auth
export function withOptionalAuth(
  handler: (request: NextRequest, auth?: SecureAuthContext) => Promise<NextResponse>
) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const auth = await authenticateSecureRequest(request)
    return handler(request, auth.isAuthenticated ? auth : undefined)
  }
}

// For admin-only endpoints
export function withAdminAuth(
  handler: (request: NextRequest, auth: SecureAuthContext) => Promise<NextResponse>
) {
  return withSecureAuth(handler, { requiredRoles: [UserRole.ADMIN] })
}

// For doctor-only endpoints
export function withDoctorAuth(
  handler: (request: NextRequest, auth: SecureAuthContext) => Promise<NextResponse>
) {
  return withSecureAuth(handler, { requiredRoles: [UserRole.DOCTOR, UserRole.ADMIN] })
}

// For patient endpoints
export function withPatientAuth(
  handler: (request: NextRequest, auth: SecureAuthContext) => Promise<NextResponse>
) {
  return withSecureAuth(handler, { requiredRoles: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] })
}

// For medical data access (requires special permissions)
export function withMedicalDataAuth(
  handler: (request: NextRequest, auth: SecureAuthContext) => Promise<NextResponse>
) {
  return withSecureAuth(handler, { 
    requiredPermissions: ['medical_data:read'] 
  })
}

export default {
  authenticateSecureRequest,
  withSecureAuth,
  withOptionalAuth,
  withAdminAuth,
  withDoctorAuth,
  withPatientAuth,
  withMedicalDataAuth
}
