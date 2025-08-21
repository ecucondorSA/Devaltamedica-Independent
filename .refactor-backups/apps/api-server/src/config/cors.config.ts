import { getCorsConfig } from '../config/auth-config';

/**
 * Configuración CORS para el API Server
 * Compartida con todas las aplicaciones del monorepo
 */

// Obtener configuración según el entorno
const corsConfig = getCorsConfig();

// Configuración de CORS para Express/Next.js
export const CORS_OPTIONS = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origin (ej: Postman, aplicaciones móviles)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origin está en la lista permitida
    const allowedOrigins = Array.isArray(corsConfig.origin) 
      ? corsConfig.origin 
      : [corsConfig.origin];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: corsConfig.allowedHeaders,
  exposedHeaders: corsConfig.exposedHeaders,
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200,
};

// Configuración alternativa para Next.js API Routes
export const NEXTJS_CORS_HEADERS = {
  'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
  'Access-Control-Allow-Origin': '*', // Se manejará dinámicamente
  'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
  'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
  'Access-Control-Expose-Headers': corsConfig.exposedHeaders.join(', '),
  'Access-Control-Max-Age': '86400',
};

// Helper para aplicar CORS en Next.js API routes
export function applyCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;
  const allowedOrigins = Array.isArray(corsConfig.origin) 
    ? corsConfig.origin 
    : [corsConfig.origin];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  Object.entries(NEXTJS_CORS_HEADERS).forEach(([key, value]) => {
    if (key !== 'Access-Control-Allow-Origin') {
      res.setHeader(key, value);
    }
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

// Lista de rutas que no requieren CORS (internas)
export const CORS_EXEMPT_ROUTES = [
  '/api/health',
  '/api/metrics',
  '/_next',
  '/static',
];

// Middleware de CORS para Express
export function corsMiddleware(req: any, res: any, next: any) {
  const path = req.path || req.url;
  
  // Verificar si la ruta está exenta
  const isExempt = CORS_EXEMPT_ROUTES.some(route => path.startsWith(route));
  if (isExempt) {
    return next();
  }

  // Aplicar CORS
  const origin = req.headers.origin;
  const allowedOrigins = Array.isArray(corsConfig.origin) 
    ? corsConfig.origin 
    : [corsConfig.origin];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    res.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    res.header('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}