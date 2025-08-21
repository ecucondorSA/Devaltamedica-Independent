import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleRedirectMiddleware } from './src/middleware/role-redirect';
import { getDashboardUrl } from './src/config/app-urls';
import { logger } from '@altamedica/shared/services/logger.service';
// Token cache no necesario para sesiones basadas en cookies
// Las sesiones se validan directamente con el servidor

// Paths que requieren autenticación
const PROTECTED_PATHS = ['/dashboard', '/profile', '/admin', '/companies', '/doctors', '/patients'];

// Paths que no requieren validación (mejora performance)
const PUBLIC_PATHS = [
  '/api/health',
  '/api/public',
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Middleware optimizado con cache de tokens
 * 
 * Mejoras implementadas:
 * - LRU Cache para tokens validados
 * - Validación rápida sin crypto para tokens en cache
 * - Skip de paths públicos para mejor performance
 * - Validación de expiración local
 * - Decodificación de claims sin verificación para roles
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip paths públicos inmediatamente (mejora performance)
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check HTTPS en producción
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const url = request.nextUrl.clone();
      url.protocol = 'https:';
      return NextResponse.redirect(url);
    }
  }

  // Verificar si el path requiere autenticación
  const requiresAuth = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  if (!requiresAuth) {
    // Verificar redirección basada en rol para paths no protegidos
    const roleRedirect = await roleRedirectMiddleware(request);
    if (roleRedirect) {
      return roleRedirect;
    }
    return NextResponse.next();
  }

  // === VALIDACIÓN DE AUTENTICACIÓN CON SESIONES ===
  
  // Verificar cookie de sesión (soportar múltiples nombres por compatibilidad)
  const sessionCookie = request.cookies.get('altamedica_session')?.value || 
                       request.cookies.get('session')?.value ||
                       request.cookies.get('auth_token')?.value; // Legacy
  
  // Si no hay sesión, redirect a login
  if (!sessionCookie) {
    return redirectToLogin(request);
  }

  // Para sesiones basadas en cookies, verificar con el servidor
  // Las sesiones no se pueden validar localmente como los JWT
  try {
    // Hacer una verificación rápida con el servidor
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/session-verify`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!verifyResponse.ok) {
      return redirectToLogin(request);
    }

    const userData = await verifyResponse.json();

    // Si el usuario tiene selección de rol pendiente, forzar a /auth/select-role
    if (userData?.user && (userData.user.pendingRoleSelection === true || userData.pendingRoleSelection === true)) {
      const url = new URL('/auth/select-role', request.url);
      return NextResponse.redirect(url);
    }
    
    // Sesión válida, agregar headers con info del usuario
    const response = NextResponse.next();
    if (userData.user?.id) {
      response.headers.set('X-User-Id', userData.user.id);
    }
    if (userData.user?.role) {
      response.headers.set('X-User-Role', userData.user.role);
    }
    
    // Verificar redirección por rol si aplica
    if (userData.user?.role) {
      const roleRedirect = await checkRoleRedirect(request, userData.user.role);
      if (roleRedirect) {
        return roleRedirect;
      }
    }
    
    return response;
  } catch (error) {
    logger.error('Session verification failed:', error);
    return redirectToLogin(request);
  }
}

/**
 * Redirect a login con return URL
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/auth/login', request.url);
  
  // Agregar return URL para volver después del login
  const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
  if (returnUrl && returnUrl !== '/') {
    url.searchParams.set('returnUrl', returnUrl);
  }
  
  return NextResponse.redirect(url);
}

/**
 * Verificar redirección basada en rol
 */
async function checkRoleRedirect(request: NextRequest, role: string): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Mapeo de roles a paths permitidos
  const rolePathMap: Record<string, string[]> = {
    PATIENT: ['/dashboard', '/profile', '/patients'],
    DOCTOR: ['/dashboard', '/profile', '/doctors'],
    COMPANY: ['/dashboard', '/profile', '/companies'],
    ADMIN: ['/dashboard', '/profile', '/admin', '/companies', '/doctors', '/patients'],
  };
  
  const allowedPaths = rolePathMap[role] || ['/dashboard', '/profile'];
  
  // Si el usuario intenta acceder a un path no permitido para su rol
  const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
  
  if (!isAllowed && pathname !== '/') {
    // Redirect al dashboard apropiado para su rol
    const dashboardUrl = getDashboardUrl(role);
    if (dashboardUrl) {
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }
  
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes under /api (except protected ones)
     * - static files in public folder
     * - image optimization files
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};