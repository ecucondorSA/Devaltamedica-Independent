import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './src/middleware/auth.middleware';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración de rutas que requieren autenticación
export const config = {
  matcher: [
    // Incluir todas las rutas API excepto las específicamente excluidas
    '/api/:path*',
    // Excluir archivos estáticos y _next
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};

// Rutas que no requieren autenticación
const publicRoutes = [
  '/api/health',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  // Rutas públicas de información
  '/api/v1/public',
];

// Rutas que requieren roles específicos
const roleBasedRoutes: Record<string, string[]> = {
  '/api/v1/admin': ['admin'],
  '/api/v1/doctors': ['doctor', 'admin'],
  '/api/v1/patients': ['patient', 'doctor', 'admin'],
  '/api/v1/companies': ['company', 'admin'],
  '/api/v1/marketplace': ['company', 'doctor', 'admin'],
  '/api/v1/staff': ['staff', 'admin'],
  '/api/v1/analytics': ['admin', 'company'],
  '/api/v1/billing': ['admin', 'company'],
  '/api/v1/prescriptions': ['doctor', 'patient', 'admin'],
  '/api/v1/appointments': ['doctor', 'patient', 'admin'],
  '/api/v1/telemedicine': ['doctor', 'patient'],
  '/api/v1/webrtc': ['doctor', 'patient'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir CORS para desarrollo
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
  }

  // Verificar si es una ruta de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Aplicar middleware de autenticación para rutas protegidas
  try {
    return await authMiddleware(request);
  } catch (error) {
    logger.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}