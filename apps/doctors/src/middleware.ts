import { AUTH_COOKIES } from '@altamedica/auth';
// Remove problematic import - createCsp doesn't exist
// import { createCsp } from '@altamedica/config-next';
import { rateLimiter } from '@altamedica/utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];
const PROFILE_REQUIRED_PATHS = ['/dashboard', '/appointments', '/patients', '/telemedicine'];

function addSecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Simple CSP implementation
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': [
      "'self'",
      'http://localhost:3001', // API server
      'ws://localhost:8888', // Signaling server
    ],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
  };

  const csp = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
    
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const { pathname } = request.nextUrl;

  const clientIP = (request as any).ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const { isAllowed } = await rateLimiter(`doctors-app:${clientIP}`, 100, 60);

  if (!isAllowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get(AUTH_COOKIES.token);
  let isAuthenticated = !!authToken;

  if (isPublicPath(pathname)) {
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)), nonce);
    }
    return addSecurityHeaders(NextResponse.next(), nonce);
  }

  if (!isAuthenticated) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)), nonce);
  }
  
  return addSecurityHeaders(NextResponse.next(), nonce);
}

function isPublicPath(pathname: string) {
    return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};