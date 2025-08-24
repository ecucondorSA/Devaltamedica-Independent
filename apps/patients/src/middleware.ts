import {
  AUTH_COOKIES as AUTH_COOKIES_IMPORTED,
  LEGACY_AUTH_COOKIES as LEGACY_AUTH_COOKIES_IMPORTED,
} from '@altamedica/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
];

// Rutas que requieren perfil completo
const PROFILE_REQUIRED_PATHS = [
  '/appointments',
  '/telemedicine',
  '/medical-records',
  '/prescriptions',
];

// Rutas de API que no requieren autenticación
const PUBLIC_API_PATHS = ['/api/health', '/api/public'];

// Middleware de autenticación Firebase Auth con cookies HttpOnly
// Verificación segura con API Server
export async function middleware(request: NextRequest) {
  // Fallback defensivo si el paquete de auth aún no expone constantes
  const AUTH_COOKIES =
    AUTH_COOKIES_IMPORTED ??
    ({ token: 'altamedica_token', refresh: 'altamedica_refresh' } as const);
  const LEGACY_AUTH_COOKIES =
    LEGACY_AUTH_COOKIES_IMPORTED ?? ({ token: 'auth-token', refresh: 'refresh-token' } as const);
  const { pathname } = request.nextUrl;

  // Permitir acceso a archivos estáticos y recursos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 🔐 SISTEMA FIREBASE AUTH - Verificar cookies httpOnly (nombres estandarizados con fallback)
  const authToken =
    request.cookies.get(AUTH_COOKIES.token) ?? request.cookies.get(LEGACY_AUTH_COOKIES.token);
  const refreshToken =
    request.cookies.get(AUTH_COOKIES.refresh) ?? request.cookies.get(LEGACY_AUTH_COOKIES.refresh);

  // No podemos leer el contenido de las cookies httpOnly desde el cliente
  // Necesitamos verificar con el servidor
  let user = null;
  let isAuthenticated = false;

  // Si hay cookies de auth, verificar con el servidor
  if (authToken || refreshToken) {
    try {
      // Usar variable de entorno para la URL del API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const verifyResponse = await fetch(`${apiUrl}/api/v1/auth/verify`, {
        method: 'GET',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
        // Agregar timeout para evitar bloqueos
        signal: AbortSignal.timeout(5000),
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        user = data.user;
        isAuthenticated = true;
      }
    } catch (error) {
      // Manejo robusto de errores sin exponer información sensible
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout - permitir acceso pero marcar como no autenticado
        isAuthenticated = false;
      } else {
        // Otro error - log sin información sensible
        isAuthenticated = false;
      }
    }
  }

  // Verificar si es una ruta pública
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isPublicAPI = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));

  if (isPublicPath || isPublicAPI) {
    // Si el usuario está autenticado y trata de acceder a login/register, redirigir a dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Si no está autenticado, redirigir al login Firebase Auth
  if (!isAuthenticated) {
    // Redirigir al login Firebase Auth centralizado
    const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const patientsUrl = process.env.NEXT_PUBLIC_PATIENTS_URL || 'http://localhost:3003';
    const loginUrl = new URL(`${webAppUrl}/auth/login`);
    // Guardar la URL original para redirigir después del login
    loginUrl.searchParams.set('redirect', `${patientsUrl}${pathname}`);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar rol de paciente
  if (user && user.role !== 'patient') {
    // Si no es un paciente, redirigir a la app correcta
    const roleRedirectMap: Record<string, string> = {
      doctor: 'http://localhost:3002',
      'company-admin': 'http://localhost:3004',
      'platform-admin': 'http://localhost:3005',
    };

    const redirectUrl = roleRedirectMap[user.role];
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    // Si el rol no está mapeado, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar si el perfil está completo para rutas que lo requieren
  const requiresProfile = PROFILE_REQUIRED_PATHS.some((path) => pathname.startsWith(path));
  if (requiresProfile && user && !user.profileComplete) {
    // Si el perfil no está completo, redirigir a onboarding
    if (pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Agregar headers de seguridad
  const response = NextResponse.next();

  // Headers de seguridad HIPAA
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.mercadopago.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3001 ws://localhost:8888 https://api.mercadopago.com;",
  );

  // Header para indicar que es una app médica con datos sensibles
  response.headers.set('X-Medical-App', 'true');
  response.headers.set('X-HIPAA-Compliant', 'true');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/health (health checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
