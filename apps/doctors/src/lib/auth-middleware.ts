import { NextRequest, NextResponse } from 'next/server'
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { Environment } from '@altamedica/shared/config/environment'
import { logger } from '@altamedica/shared/services/logger.service'
import { UserRole } from '@altamedica/types'

// Initialize Firebase Admin SDK
const initAdmin = () => {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getApp()
}

export async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split('Bearer ')[1]
    const app = initAdmin()
    const auth = getAuth(app)
    
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    logger.error('Auth verification failed', error, { 
      action: 'auth_verification',
      metadata: { hasAuthHeader: !!authHeader }
    })
    return null
  }
}

export function requireAuth(handler: (req: NextRequest, user: DecodedIdToken) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await verifyAuthToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Se requiere autenticación' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

export function requireRole(roles: UserRole[], handler: (req: NextRequest, user: DecodedIdToken) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await verifyAuthToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Se requiere autenticación' },
        { status: 401 }
      )
    }

    const userRole = (user.role || user.custom_claims?.role) as UserRole
    if (!userRole || !roles.includes(userRole)) {
      logger.warn('Access denied - insufficient role', {
        userId: user.uid,
        userRole,
        requiredRoles: roles,
        action: 'role_check_failed'
      })
      return NextResponse.json(
        { error: 'Forbidden - Rol insuficiente' },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}