import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIES } from '../constants/auth-cookies';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXEMPT_PATHS = new Set<string>(['/api/v1/auth/session-login']);

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // Exempt initial session creation to allow issuing CSRF token
  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    return next();
  }
  // Only enforce on state-changing methods
  if (!CSRF_METHODS.has(req.method)) {
    return next();
  }

  // Require a session cookie to validate CSRF
  const sessionCookie = req.cookies?.[AUTH_COOKIES.session] || req.cookies?.[AUTH_COOKIES.token];
  if (!sessionCookie) {
    return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' });
  }

  // Read CSRF token from cookie and header
  const csrfCookie = req.cookies?.[AUTH_COOKIES.csrf];
  const csrfHeader = req.headers[CSRF_HEADER] as string | undefined;

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ success: false, error: 'CSRF_MISMATCH' });
  }

  return next();
}

export function issueCsrfToken(req: Request, res: Response) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(AUTH_COOKIES.csrf, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return token;
}
