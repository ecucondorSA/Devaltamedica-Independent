import {
  AUTH_COOKIES as AUTH_COOKIES_IMPORTED,
  LEGACY_AUTH_COOKIES as LEGACY_AUTH_COOKIES_IMPORTED,
} from '@altamedica/auth';
import { buildCsp } from '@altamedica/config-next';
// import { rateLimiter } from '@altamedica/utils/rate-limiter';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/privacy', '/terms'];
const PROFILE_REQUIRED_PATHS = ['/appointments', '/telemedicine', '/medical-records', '/prescriptions'];
const PUBLIC_API_PATHS = ['/api/health', '/api/public'];

function addSecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const csp = buildCsp({
    nonce,
    overrides: {
      'script-src': ['https://checkout.mercadopago.com'],
      'img-src': ['https:'],
      'font-src': ['data:'],
      'connect-src': [
        'http://localhost:3001',
        'ws://localhost:8888',
        'https://api.mercadopago.com',
      ],
    },
  });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Medical-App', 'true');
  response.headers.set('X-HIPAA-Compliant', 'true');

  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const { pathname } = request.nextUrl;

  // Apply rate limiting to all incoming requests for this app
  // const clientIP = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  // const { isAllowed, remaining } = await rateLimiter(`patients-app:${clientIP}`, 100, 60);

  // if (!isAllowed) {
  //   return new NextResponse('Too Many Requests', {
  //     status: 429,
  //     headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': String(remaining) },
  //   });
  // }

  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const AUTH_COOKIES = AUTH_COOKIES_IMPORTED ?? { token: 'altamedica_token', refresh: 'altamedica_refresh' };
  const LEGACY_AUTH_COOKIES = LEGACY_AUTH_COOKIES_IMPORTED ?? { token: 'auth-token', refresh: 'refresh-token' };

  const authToken = request.cookies.get(AUTH_COOKIES.token) ?? request.cookies.get(LEGACY_AUTH_COOKIES.token);
  const refreshToken = request.cookies.get(AUTH_COOKIES.refresh) ?? request.cookies.get(LEGACY_AUTH_COOKIES.refresh);

  let user = null;
  let isAuthenticated = false;

  if (authToken || refreshToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const verifyResponse = await fetch(`${apiUrl}/api/v1/auth/verify`, {
        method: 'GET',
        headers: { Cookie: request.headers.get('cookie') || '' },
        signal: AbortSignal.timeout(5000),
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        user = data.user;
        isAuthenticated = true;
      }
    } catch (error) {
      isAuthenticated = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublicAPI = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));

  if (isPublicPath || isPublicAPI) {
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      return addSecurityHeaders(response, nonce);
    }
    return addSecurityHeaders(NextResponse.next(), nonce);
  }

  if (!isAuthenticated) {
    const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const patientsUrl = process.env.NEXT_PUBLIC_PATIENTS_URL || 'http://localhost:3003';
    const loginUrl = new URL(`${webAppUrl}/auth/login`);
    loginUrl.searchParams.set('redirect', `${patientsUrl}${pathname}`);
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response, nonce);
  }

  if (user && user.role !== 'patient') {
    const roleRedirectMap: Record<string, string> = {
      doctor: 'http://localhost:3002',
      'company-admin': 'http://localhost:3004',
      'platform-admin': 'http://localhost:3005',
    };
    const redirectUrl = roleRedirectMap[user.role];
    if (redirectUrl) {
      const response = NextResponse.redirect(redirectUrl);
      return addSecurityHeaders(response, nonce);
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    return addSecurityHeaders(response, nonce);
  }

  const requiresProfile = PROFILE_REQUIRED_PATHS.some((path) => pathname.startsWith(path));
  if (requiresProfile && user && !user.profileComplete) {
    if (pathname !== '/onboarding') {
      const response = NextResponse.redirect(new URL('/onboarding', request.url));
      return addSecurityHeaders(response, nonce);
    }
  }

  return addSecurityHeaders(NextResponse.next(), nonce);
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
