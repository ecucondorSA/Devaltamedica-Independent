import { createSSOMiddleware, ssoMiddlewareConfig } from './middleware';
import type { NextRequest } from 'next/server';

/** Registro declarativo de apps y configuración de acceso */
export const AppAccessRegistry = {
  doctors: {
    allowedRoles: ['doctor'] as string[],
    devBypass: ['/', '/telemedicine/session/demo'],
  },
  patients: {
    allowedRoles: ['patient'] as string[],
    devBypass: ['/', '/telemedicine/session/demo'],
  },
  companies: {
    allowedRoles: [] as string[],
    devBypass: ['/', '/operations-hub', '/marketplace'],
  },
  admin: {
    allowedRoles: ['admin'] as string[],
    devBypass: [],
  },
};

export type AppId = keyof typeof AppAccessRegistry;

interface BuildOptions { app: AppId; loginUrl?: string; apiUrl?: string; extraPublic?: string[] }

export function buildAppMiddleware({ app, loginUrl, apiUrl, extraPublic = [] }: BuildOptions) {
  const cfg = AppAccessRegistry[app];
  const e2eBypass = process.env.E2E_USE_MOCK_LOGIN === '1';
  const isDev = process.env.NODE_ENV !== 'production';
  const publicPaths = [
    '/api/health', '/_next', '/favicon.ico', '/icons', '/images', '/robots.txt', '/sitemap.xml',
    ...(extraPublic),
    ...((isDev || e2eBypass) ? cfg.devBypass : []),
  ];
  const sso = createSSOMiddleware({
    appName: app,
    allowedRoles: cfg.allowedRoles,
    loginUrl: loginUrl || process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3000/auth/login',
    apiUrl: apiUrl || (process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/session-verify`
      : 'http://localhost:3001/api/v1/auth/session-verify'),
    publicPaths,
    debug: process.env.NODE_ENV === 'development',
  });
  return async function middleware(request: NextRequest) { return sso(request); };
}

export const middlewareConfig = ssoMiddlewareConfig;
