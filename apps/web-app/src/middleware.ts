import { createSSOMiddleware } from '@altamedica/auth/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * 🏥 AltaMedica Web App SSO Middleware
 * Gateway application with HIPAA-compliant security headers
 */

// Create SSO middleware with web-app specific config
const ssoMiddleware = createSSOMiddleware({
  appName: 'web-app',
  // No role restrictions - gateway accepts all authenticated users
  allowedRoles: [],
  loginUrl: process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3000/auth/login',
  apiUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify`
    : 'http://localhost:3001/api/v1/auth/verify',
  // Extended public paths for web-app
  publicPaths: [
    '/',
    '/manifest.json',
    '/api/font-css',
    '/Video_Listo_.mp4',
    '/Video_Listo_Encuentra_Doctor.mp4',
    '/Video_Listo_Telemedicina.mp4',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/complete-profile',
    '/about',
    '/services',
    '/contact',
    '/contacto',
    '/pricing',
    '/privacy',
    '/terms',
    '/help',
    '/demo',
    '/landing-demo',
    '/telemedicine',
    '/especialistas',
    '/servicios',
    '/hipaa',
    '/status',
    '/api/health',
    '/api/contact',
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
    '/public',
  ],
  debug: process.env.NODE_ENV === 'development',
});

// Spanish to English route mappings for i18n support
const ROUTE_MAPPINGS: Record<string, string> = {
  '/contacto': '/contact',
  '/nosotros': '/about',
  '/acerca': '/about',
  '/precios': '/pricing',
  '/privacidad': '/privacy',
  '/terminos': '/terms',
  '/ayuda': '/help',
  '/testimonios': '/testimonials',
};

// High-risk medical routes that need extra logging
const HIGH_RISK_ROUTES = [
  '/patients',
  '/medical',
  // '/anamnesis', // removido en marketing scope
  // '/patient3d', // removido en marketing scope
  '/appointments',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Handle Spanish route redirections for i18n
  if (ROUTE_MAPPINGS[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTE_MAPPINGS[pathname];
    return NextResponse.redirect(url, { status: 301 });
  }

  // 1. Run SSO middleware first
  const ssoResponse = await ssoMiddleware(request);

  // If SSO middleware returns a response (redirect/unauthorized), use it
  if (ssoResponse && ssoResponse.status !== 200) {
    return ssoResponse;
  }

  // 2. Add additional HIPAA-specific headers
  const response = ssoResponse || NextResponse.next();

  // Enhanced security headers for medical routes
  if (isHighRiskRoute(pathname)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Log access to high-risk routes
    logMedicalAccess(request, pathname);
  }

  // 3. Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: https://*.gstatic.com https://*.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://api.altamedica.com https://*.firebaseio.com https://firebase.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebaseinstallations.googleapis.com https://accounts.google.com https://apis.google.com https://www.googleapis.com",
    "frame-src 'self' https://accounts.google.com https://*.google.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // 4. Rate limiting for auth routes
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (shouldRateLimit(clientIP, pathname)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  }

  return response;
}

function isHighRiskRoute(pathname: string): boolean {
  return HIGH_RISK_ROUTES.some((route) => pathname.startsWith(route));
}

function logMedicalAccess(request: NextRequest, pathname: string) {
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const userId = request.headers.get('x-user-id') || 'anonymous';

  logger.info(
    `[HIPAA_AUDIT] ${timestamp} - User: ${userId} - IP: ${ip} - Path: ${pathname} - UA: ${userAgent}`,
  );

  // TODO: Implement HIPAA-compliant audit logging
  // Requirements:
  // - Log to immutable storage
  // - Include user identity
  // - Track PHI access
  // - Maintain for 6+ years
}

// Simple in-memory rate limiting for development
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function shouldRateLimit(clientIP: string, pathname: string): boolean {
  const now = Date.now();
  const key = `${clientIP}:${pathname}`;
  const limit = pathname.startsWith('/auth/') ? 5 : 100; // 5 for auth, 100 for API
  const windowMs = 60000; // 1 minute window

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count++;
  return record.count > limit;
}

// Export SSO middleware config from @altamedica/auth
export { ssoMiddlewareConfig as config } from '@altamedica/auth/middleware';
