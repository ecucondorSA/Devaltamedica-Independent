import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthToken,
  verifyAuthToken,
  refreshAuthToken,
  authStorage,
  AUTH_CONSTANTS
} from '@/lib/response-helpers';
import type { UserType } from '@/lib/response-helpers';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  userType: UserType;
}

/**
 * Extracts and verifies authentication token from Next.js API route request
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  let token: string | undefined;

  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookie
    token = request.cookies.get('altamedica_token')?.value;
  }

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(createTokenMissingResponse(), { status: 401 })
    };
  }

  try {
    const decoded = verifyAuthToken(token);
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
        userType: decoded.userType
      },
      error: null
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      user: null,
      error: NextResponse.json(createTokenInvalidResponse(errorMessage), { status: 401 })
    };
  }
}

/**
 * Middleware wrapper for Next.js API routes that require authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const { user, error } = await authenticateApiRequest(request);
    
    if (error) {
      return error;
    }
    
    if (!user) {
      return NextResponse.json(createUnauthorizedResponse(), { status: 401 });
    }

    return handler(request, user, ...args);
  };
}

/**
 * Middleware wrapper for Next.js API routes that require specific user types
 */
export function withUserType(
  allowedTypes: UserType[],
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, ...args: any[]): Promise<NextResponse> => {
    if (!allowedTypes.includes(user.userType)) {
      return NextResponse.json(
        createForbiddenResponse(`Access denied. Required user types: ${allowedTypes.join(', ')}`), 
        { status: 403 }
      );
    }

    return handler(request, user, ...args);
  });
}

/**
 * Middleware wrapper for Next.js API routes that require admin access
 */
export function withAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withUserType(['admin'], handler);
}

/**
 * Middleware wrapper for Next.js API routes that require doctor access
 */
export function withDoctor(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withUserType(['doctor', 'admin'], handler);
}

/**
 * Middleware wrapper for Next.js API routes that require patient access
 */
export function withPatient(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withUserType(['patient', 'admin'], handler);
}

/**
 * Middleware wrapper for Next.js API routes that require company access
 */
export function withCompany(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withUserType(['company', 'admin'], handler);
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const { user } = await authenticateApiRequest(request);
  return user;
}

/**
 * Check if user owns the resource based on URL parameter
 */
export function withResourceOwnership(
  paramName = 'id',
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, context: any, ...args: any[]): Promise<NextResponse> => {
    const resourceUserId = context?.params?.[paramName];
    
    if (user.uid !== resourceUserId && user.userType !== 'admin') {
      return NextResponse.json(
        createForbiddenResponse('Access denied. You can only access your own resources.'),
        { status: 403 }
      );
    }

    return handler(request, user, context, ...args);
  });
}
