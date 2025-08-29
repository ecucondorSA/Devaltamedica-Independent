import { createAuthMiddleware } from '@altamedica/auth/middleware';
import { createCsp } from '@altamedica/config-next';
import { logger } from '@altamedica/shared/services/logger.service';
import { rateLimiter } from '@altamedica/utils/rate-limiter';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const authMiddleware = createAuthMiddleware({
  loginUrl: process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3000/auth/login',
  apiUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify`
    : 'http://localhost:3001/api/v1/auth/verify',
  allowedRoles: [],
});

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

const HIGH_RISK_ROUTES = ['/patients', '/medical', '/appointments'];

function addSecurityHeaders(response: NextResponse, nonce: string) {
  const csp = createCsp({
    nonce,
    overrides: {
      'script-src': [
        'https://cdn.jsdelivr.net',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.gstatic.com',
        'https://www.google.com',
      ],
      'style-src': ['https://fonts.googleapis.com'],
      'img-src': ['https:', 'https://*.gstatic.com', 'https://*.googleusercontent.com'],
      'font-src': ['https://fonts.gstatic.com'],
      'connect-src': [
        'http://localhost:*',
        'ws://localhost:*',
        'wss://localhost:*',
        'https://api.altamedica.com',
        'https://*.firebaseio.com',
        'https://firebase.googleapis.com',
        'https://firestore.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://identitytoolkit.googleapis.com',
        'https://firebaseinstallations.googleapis.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.googleapis.com',
      ],
      'frame-src': ['https://accounts.google.com', 'https://*.google.com'],
      'media-src': ['blob:'],
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) {
    const clientIP = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const limit = pathname.startsWith('/auth/') ? 20 : 100;
    const windowInSeconds = 60;

    const { isAllowed, remaining } = await rateLimiter(
      `mw:${pathname}:${clientIP}`,
      limit,
      windowInSeconds
    );

    if (!isAllowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(windowInSeconds),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        },
      });
    }
  }

  if (ROUTE_MAPPINGS[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTE_MAPPINGS[pathname];
    const response = NextResponse.redirect(url, { status: 301 });
    return addSecurityHeaders(response, nonce);
  }

  const publicPaths = [
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
    '/terminos',
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
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  let response = NextResponse.next();
  if (!isPublicPath) {
    const authResponse = await authMiddleware(request);
    if (authResponse && authResponse.status !== 200) {
      return addSecurityHeaders(authResponse, nonce);
    }
    response = authResponse || NextResponse.next();
  }

  if (isHighRiskRoute(pathname)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    logMedicalAccess(request, pathname);
  }

  return addSecurityHeaders(response, nonce);
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
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
