import { buildAppMiddleware, middlewareConfig } from '@altamedica/auth/app-middleware-factory';

// SSO centralizado para Companies (rol opcional: 'company-admin' / 'company-user')
const e2eBypass = process.env.E2E_USE_MOCK_LOGIN === '1'
const isDev = process.env.NODE_ENV !== 'production'
export const middleware = buildAppMiddleware({
  app: 'companies',
  allowedRoles: [],
  loginUrl: process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3000/auth/login',
  apiUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify`
    : 'http://localhost:3001/api/v1/auth/verify',
  publicPaths: [
    '/api/health', '/_next', '/favicon.ico', '/icons', '/images', '/robots.txt', '/sitemap.xml',
    // E2E/dev bypass para rutas clave
    ...((isDev || e2eBypass) ? ['/', '/operations-hub', '/marketplace'] : []),
  ],
  debug: process.env.NODE_ENV === 'development',
});
export const config = middlewareConfig;

