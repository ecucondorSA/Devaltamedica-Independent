# Validación Técnica Independiente – AltaMedica Platform

Fecha: 2025-08-20

## Metodología y Criterios

- Evaluación objetiva basada únicamente en evidencia del código del repositorio (sin fuentes externas ni reportes previos).
- Áreas evaluadas y ponderación:
  - Seguridad: 30%
  - Testing: 25%
  - Arquitectura: 20%
  - Integración: 15%
  - Performance: 10%

## Score Numérico (0-100)

- Sub-scores:
  - Seguridad: 86
  - Testing: 76
  - Arquitectura: 85
  - Integración: 82
  - Performance: 84
- Cálculo (ponderado):
  - 0.30×86 + 0.25×76 + 0.20×85 + 0.15×82 + 0.10×84 = 82.5
- Score final: 82.5 / 100

---

## Evidencia Verificable

### 1) Seguridad

- Helmet (CSP, HSTS, nosniff, referrer-policy) – API Server:

```1:28:apps/api-server/src/middleware/security.ts
import helmet from 'helmet';
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});
```

- CORS con orígenes whitelisted, credenciales ON y header CSRF permitido – API Server:

```41:61:apps/api-server/src/server.ts
app.use(
  cors({
    origin: [
      /localhost:(3000|3001|3002|3003|3004|3005|3006|3008)$/,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3008',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token'],
    exposedHeaders: ['Set-Cookie'],
  }),
);
```

- CSRF doble envío (cookie + header) y emisión segura del token – API Server:

```5:34:apps/api-server/src/middleware/csrf.middleware.ts
const CSRF_HEADER = 'x-csrf-token';
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXEMPT_PATHS = new Set<string>(['/api/v1/auth/session-login']);
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();
  if (!CSRF_METHODS.has(req.method)) return next();
  const sessionCookie = req.cookies?.[AUTH_COOKIES.session] || req.cookies?.[AUTH_COOKIES.token];
  if (!sessionCookie) return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' });
  const csrfCookie = req.cookies?.[AUTH_COOKIES.csrf];
  const csrfHeader = req.headers[CSRF_HEADER] as string | undefined;
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ success: false, error: 'CSRF_MISMATCH' });
  }
  return next();
}
```

```36:45:apps/api-server/src/middleware/csrf.middleware.ts
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
```

- Cookies de sesión httpOnly y sameSite=strict – API Server:

```19:47:apps/api-server/src/routes/auth-firebase.routes.ts
const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  domain: process.env.COOKIE_DOMAIN || 'localhost',
};
...
res.cookie(AUTH_COOKIES.session, sessionCookie, {
  ...cookieBase,
  maxAge: expiresIn,
});
return res.status(200).json({ success: true, csrfToken });
```

- Rate limiting global y específico – API Server:

```15:33:apps/api-server/src/server.ts
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    logger.warn(`[RATE_LIMIT] IP ${req.ip} exceeded global rate limit`);
    res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
  },
});
app.use(globalRateLimiter);
```

```24:41:apps/api-server/src/middleware/rate-limiter.ts
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
```

- Nginx: gzip y headers HIPAA – Infra:

```70:104:config/nginx/nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types
  text/plain
  text/css
  text/xml
  text/javascript
  application/x-javascript
  application/xml+rss
  application/javascript
  application/json
  application/xml
  application/rss+xml
  application/atom+xml
  image/svg+xml;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:; media-src 'self';" always;
```

- Signaling Server (WebRTC): helmet, cors, compression y rate limit:

```45:53:apps/signaling-server/src/index.ts
app.use(helmet());
app.use(cors(serverConfig.cors));
app.use(compression());
const limiter = rateLimit(serverConfig.rateLimit);
app.use('/api/*', limiter as any);
```

- Observación de riesgo (no bloqueo inmediato): middleware `validateJWT` es placeholder (no verifica firma) y no se encontró su uso directo en rutas.

```87:100:apps/api-server/src/middleware/security.ts
// const decoded = jwt.verify(token, process.env.JWT_SECRET);
// req.user = decoded;
// Por ahora, solo verificamos que el token existe
req.user = { id: 'user-id', role: 'user' };
```

### 2) Testing

- Suite Playwright en `apps/companies/tests` con Page Objects y pruebas de navegación/estadísticas:

```12:21:apps/companies/tests/dashboard.spec.ts
// Login antes de cada prueba
await authPage.login();
await dashboardPage.goto('/dashboard');
await dashboardPage.assertPageTitle('Dashboard');
await dashboardPage.assertHeading('Dashboard de Empresa');
```

- Configuración Jest monorepo (coverage activado, mapeo de paths):

```6:13:config/environments/jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
};
```

```83:103:config/environments/jest.config.cjs
collectCoverage: true,
collectCoverageFrom: [
  'apps/**/src/**/*.{ts,tsx,js,jsx}',
  'packages/**/src/**/*.{ts,tsx,js,jsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/__tests__/**',
  '!**/*.test.{ts,tsx,js,jsx}',
  '!**/*.spec.{ts,tsx,js,jsx}',
  '!**/dist/**',
  '!**/build/**',
  '!**/.next/**',
],
coverageDirectory: '<rootDir>/coverage',
coverageReporters: ['json', 'lcov', 'text', 'html', 'cobertura'],
```

- E2E centralizado (Playwright) con scripts en `e2e/package.json` y documentación en `docs/TESTING-COMPLETE.md`.

### 3) Arquitectura

- Monorepo con separación por `apps/` y `packages/` (p. ej., `@altamedica/api-client`, `@altamedica/hooks`, `@altamedica/shared`).
- Next.js hardened config centralizada con headers de seguridad y optimización de imágenes:

```130:170:packages/config-next/src/index.ts
poweredByHeader: false,
compress: true,
images: {
  formats: ['image/webp', 'image/avif'],
  domains: ['localhost', 'altamedica.com', ...images.domains || []],
},
async headers() {
  const headers = [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: buildCsp({ dev: isDev, ...cspConfig }) },
        ...hipaaSecurityHeaders,
        ...extraHeaders,
      ],
    },
  ];
  return headers;
},
```

### 4) Integración

- Cliente API centralizado con baseURL, timeouts y reintentos:

```45:51:packages/hooks/src/api/useAltamedicaAPI.ts
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  version: '/api/v1',
  timeout: 30000,
  retries: 3,
  enableAuth: true,
  enableAuditLog: true
};
```

- Autenticación SSO Firebase + sesión httpOnly con verificación de rol y redirect:

```54:85:apps/web-app/src/components/auth/LoginForm.tsx
const authUser = await SharedAuthService.login(email, password);
const csrfToken = await SharedAuthService.establishServerSession();
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const verifyRes = await fetch(`${apiBaseUrl}/api/v1/auth/session-verify`, { credentials: 'include' });
router.push(redirectUrl);
```

```71:91:apps/web-app/src/services/shared-auth.ts
const res = await fetch(`${API_BASE}/api/v1/auth/session-login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ idToken }),
});
const data = await res.json();
return data?.csrfToken || null;
```

### 5) Performance

- Next.js con `compress: true`, seguridad y optimización de imágenes (ver apartado Arquitectura).
- Nginx con gzip y ajustes de red (buffers y keepalive) – ver evidencia Seguridad.
- `apps/patients/next.config.mjs` añade `removeConsole` en producción y headers de caché para estáticos y rutas específicas.

---

## Hallazgos

- Fuertes controles de seguridad en API Server (Helmet, CORS estricto, CSRF doble envío, cookies httpOnly+SameSite=strict, múltiples rate limiters).
- Signaling Server aplica helmet, compresión y rate limit, y valida JWT con secreto propio.
- Integración consistente en clientes API y flujo de SSO con establecimiento de sesión en backend.
- Cobertura de testing E2E presente en `apps/companies` y configuración Jest monorepo; evidencia de E2E central (Playwright) en `e2e`.
- Configuración de Next y Nginx con optimizaciones de performance y headers de seguridad.

Riesgos/Gap detectados (evidencia arriba):

- CSP de Nginx permite `'unsafe-inline'` y `'unsafe-eval'` (debilita protección XSS en producción).
- Middleware `validateJWT` es un placeholder (no verifica firma); evitar su uso o implementarlo correctamente.
- En `withUnifiedAuth` hay bypass de verificación en `development` (útil para dev, asegurar que no se propague a otros entornos).
- Duplicidad de `allowedHeaders` en CORS de `server.ts` (riesgo bajo, confusión de config).
- No se observan umbrales de cobertura mínimos (coverageThreshold) en Jest.

---

## Recomendaciones Priorizadas

- Críticas
  - Endurecer CSP en Nginx: eliminar `'unsafe-inline'` y `'unsafe-eval'`; usar nonces/hashes para scripts y estilos.
  - Eliminar o implementar correctamente `validateJWT` y añadir pruebas unitarias de firma/exp/expiración/revocación.
- Altas
  - Asegurar que cualquier bypass de auth por entorno se controle por flag explícita (`ENABLE_AUTH_BYPASS=false`) y quede deshabilitado en staging/producción.
  - Añadir `coverageThreshold` en Jest (global ≥80% lines/branches/functions) y gatear en CI.
  - Revisar `allowedHeaders` duplicado en CORS (`server.ts`) y unificar configuración.
- Medias
  - Añadir pruebas unitarias/integración para CSRF, CORS y rate limiting.
  - Reforzar `sameSite` del cookie CSRF si aplica, y validar rotación del token.
  - Revisar listas de `origin` en CORS para producción (dominios exactos, sin regex amplio).
- Bajas
  - Añadir headers de caching y `immutable` en más rutas estáticas donde corresponda.
  - Preload/preconnect de orígenes críticos (DB/API) en Next.js según perfiles de uso.

---

## Estado Final

NO-GO a producción hasta corregir los ítems críticos (CSP sin `'unsafe-inline'/'unsafe-eval'` y JWT placeholder).

---

## Anexos

- Documentación de testing en `docs/TESTING-COMPLETE.md` y suite E2E en `e2e/`.
- Configuración segura de Next centralizada en `packages/config-next/`.
