import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUrl } from '../config/app-urls';

import { logger } from '@altamedica/shared/services/logger.service';
// Intentar importar constantes, pero con fallbacks para evitar errores en dev
let AUTH_COOKIES_IMPORTED: any, LEGACY_AUTH_COOKIES_IMPORTED: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auth = require('@altamedica/auth');
  AUTH_COOKIES_IMPORTED = auth.AUTH_COOKIES;
  LEGACY_AUTH_COOKIES_IMPORTED = auth.LEGACY_AUTH_COOKIES;
} catch {}

const AUTH_COOKIES = AUTH_COOKIES_IMPORTED ?? { token: 'altamedica_token', refresh: 'altamedica_refresh' };
const LEGACY_AUTH_COOKIES = LEGACY_AUTH_COOKIES_IMPORTED ?? { token: 'am_token', refresh: 'am_refresh' };

/**
 * Middleware para redirigir usuarios a su aplicación correspondiente según su rol
 */
export async function roleRedirectMiddleware(request: NextRequest) {
  // Obtener el token de autenticación
  const authToken = request.cookies.get(AUTH_COOKIES.token)?.value ?? request.cookies.get(LEGACY_AUTH_COOKIES.token)?.value;
  
  if (!authToken) {
    return null; // No hay token, dejar que pase
  }
  
  try {
    // Decodificar el token para obtener el rol del usuario
    // Nota: En producción, esto debería validarse con una clave secreta
    let tokenPayload: any = {};
    try {
      const parts = authToken.split('.');
      if (parts.length >= 2 && typeof atob === 'function') {
        const decoded = atob(parts[1]);
        tokenPayload = JSON.parse(decoded);
      }
    } catch {
      tokenPayload = {};
    }
    const userRole = tokenPayload.role;
    const currentPath = request.nextUrl.pathname;
    
    // Rutas que requieren redirección según rol
    const protectedPaths = ['/dashboard', '/profile', '/appointments', '/settings'];
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
    
    // Si el usuario no es paciente y está en una ruta protegida de web-app
    if (isProtectedPath && userRole && userRole !== 'patient') {
      const targetUrl = getDashboardUrl(userRole);
      
      // Si la URL objetivo es diferente del origen actual, redirigir
      if (targetUrl.startsWith('http')) {
        return NextResponse.redirect(new URL(targetUrl));
      }
    }
    
    // Verificar si un usuario paciente intenta acceder a rutas de otros roles
    if (userRole === 'patient' && currentPath.includes('/admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
  } catch (error) {
    logger.error('Error procesando token en middleware:', error);
    // En caso de error, dejar que la aplicación maneje la autenticación
  }
  
  return null;
}

/**
 * Configuración de rutas para el middleware
 */
export const roleRedirectConfig = {
  matcher: [
    // Incluir rutas protegidas
    '/dashboard/:path*',
    '/profile/:path*',
    '/appointments/:path*',
    '/settings/:path*',
    // Excluir archivos estáticos y API
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};