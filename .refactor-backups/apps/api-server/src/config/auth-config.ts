/**
 * Configuración de autenticación y CORS para el API Server
 */

import { securityConfig } from './security-config';

// Tipos de configuración
interface CorsConfig {
  origin: string[] | string;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: string;
  refreshExpiry: string;
  issuer: string;
  audience: string;
}

/**
 * Obtener configuración de CORS según el entorno
 */
export function getCorsConfig(): CorsConfig {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // En desarrollo, permitir localhost con todos los puertos
  const developmentOrigins = [
    'http://localhost:3000', // web-app
    'http://localhost:3001', // api-server
    'http://localhost:3002', // doctors
    'http://localhost:3003', // patients
    'http://localhost:3004', // companies
    'http://localhost:3005', // admin
    'http://localhost:8888', // signaling-server
  ];

  // En producción, usar dominios configurados
  const productionOrigins = [
    'https://altamedica.com',
    'https://app.altamedica.com',
    'https://api.altamedica.com',
    'https://doctors.altamedica.com',
    'https://patients.altamedica.com',
    'https://companies.altamedica.com',
    'https://admin.altamedica.com',
  ];

  return {
    origin: isDevelopment 
      ? developmentOrigins 
      : process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : productionOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Session-Id',
      'X-Request-Id',
      'X-Device-Id',
      'X-User-Agent'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-Id',
      'X-Response-Time',
      'Retry-After'
    ]
  };
}

/**
 * Obtener configuración de autenticación
 */
export function getAuthConfig(): AuthConfig {
  return {
    jwtSecret: process.env.JWT_SECRET || securityConfig.jwt.secret,
    jwtExpiry: process.env.JWT_EXPIRY || securityConfig.jwt.expiresIn,
    refreshExpiry: process.env.REFRESH_EXPIRY || securityConfig.jwt.refreshExpiresIn,
    issuer: process.env.JWT_ISSUER || securityConfig.jwt.issuer,
    audience: process.env.JWT_AUDIENCE || securityConfig.jwt.audience
  };
}

/**
 * Verificar si un origen está permitido
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Permitir requests sin origin en desarrollo (Postman, etc.)
    return process.env.NODE_ENV !== 'production';
  }

  const corsConfig = getCorsConfig();
  const allowedOrigins = Array.isArray(corsConfig.origin) 
    ? corsConfig.origin 
    : [corsConfig.origin];

  return allowedOrigins.includes(origin);
}

/**
 * Obtener headers de CORS para respuestas
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const corsConfig = getCorsConfig();
  const headers: Record<string, string> = {};

  // Si el origen está permitido, establecer el header específico
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV !== 'production') {
    // En desarrollo, permitir cualquier origen
    headers['Access-Control-Allow-Origin'] = '*';
  }

  // Otros headers CORS
  headers['Access-Control-Allow-Credentials'] = corsConfig.credentials.toString();
  headers['Access-Control-Allow-Methods'] = corsConfig.methods.join(', ');
  headers['Access-Control-Allow-Headers'] = corsConfig.allowedHeaders.join(', ');
  headers['Access-Control-Expose-Headers'] = corsConfig.exposedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = '86400'; // 24 horas

  return headers;
}

/**
 * Configuración de cookies SSO
 */
export const SSO_COOKIE_CONFIG = {
  name: 'altamedica_sso_session',
  domain: process.env.NODE_ENV === 'production' ? '.altamedica.com' : 'localhost',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

/**
 * Configuración de sesiones SSO
 */
export const SSO_SESSION_CONFIG = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutos de inactividad
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 horas máximo
  refreshThreshold: 5 * 60 * 1000, // Refrescar si quedan menos de 5 minutos
  maxConcurrentSessions: 3, // Máximo 3 sesiones concurrentes por usuario
};

/**
 * URLs de redirección por rol
 */
export const ROLE_REDIRECT_URLS = {
  patient: process.env.PATIENT_APP_URL || 'http://localhost:3003/dashboard',
  doctor: process.env.DOCTOR_APP_URL || 'http://localhost:3002/dashboard',
  company: process.env.COMPANY_APP_URL || 'http://localhost:3004/dashboard',
  admin: process.env.ADMIN_APP_URL || 'http://localhost:3005/dashboard',
  staff: process.env.WEB_APP_URL || 'http://localhost:3000/dashboard',
};

/**
 * Configuración de Firebase Admin
 */
export const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'altamedica-platform',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

export default {
  getCorsConfig,
  getAuthConfig,
  isOriginAllowed,
  getCorsHeaders,
  SSO_COOKIE_CONFIG,
  SSO_SESSION_CONFIG,
  ROLE_REDIRECT_URLS,
  FIREBASE_CONFIG
};