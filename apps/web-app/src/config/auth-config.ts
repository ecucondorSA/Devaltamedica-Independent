/**
 * Configuración centralizada de autenticación para todas las aplicaciones
 * Esta configuración debe ser compartida entre todas las apps del monorepo
 */

// Configuración JWT
export const JWT_CONFIG = {
  // Clave secreta compartida (en producción usar variable de entorno)
  secret: process.env.JWT_SECRET || 'altamedica-dev-secret-key-2025',
  
  // Opciones del token
  options: {
    expiresIn: '24h',              // Duración del token
    issuer: 'altamedica',          // Emisor
    audience: 'altamedica-apps',   // Audiencia
  },
  
  // Configuración de refresh token
  refreshToken: {
    expiresIn: '7d',               // Duración del refresh token
    secret: process.env.JWT_REFRESH_SECRET || 'altamedica-refresh-secret-2025',
  }
};

// Configuración de cookies
export const COOKIE_CONFIG = {
  // Nombre de las cookies
  names: {
    accessToken: 'altamedica_token',
    refreshToken: 'altamedica_refresh',
    userRole: 'altamedica_role',
  },
  
  // Opciones de cookie para desarrollo
  development: {
    httpOnly: true,
    secure: false,                 // false en desarrollo (HTTP)
    sameSite: 'lax' as const,
    domain: 'localhost',           // Compartir entre apps en localhost
    path: '/',
    maxAge: 86400000,             // 24 horas en ms
  },
  
  // Opciones de cookie para producción
  production: {
    httpOnly: true,
    secure: true,                  // true en producción (HTTPS)
    sameSite: 'strict' as const,
    domain: '.altamedica.com',     // Dominio principal
    path: '/',
    maxAge: 86400000,             // 24 horas en ms
  }
};

// Configuración CORS
export const CORS_CONFIG = {
  // Orígenes permitidos en desarrollo
  development: {
    origin: [
      'http://localhost:3000',     // web-app
      'http://localhost:3001',     // api-server
      'http://localhost:3002',     // doctors
      'http://localhost:3003',     // patients
      'http://localhost:3004',     // companies
      'http://localhost:3005',     // admin
      'http://localhost:3006',     // medical
      'http://localhost:8888',     // signaling server
      'http://altamedica.local:3000',     // web-app con dominio local
      'http://altamedica.local:3001',     // api-server con dominio local
      'http://altamedica.local:3002',     // doctors con dominio local
      'http://altamedica.local:3003',     // patients con dominio local
      'http://altamedica.local:3004',     // companies con dominio local
      'http://altamedica.local:3005',     // admin con dominio local
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  },
  
  // Orígenes permitidos en producción
  production: {
    origin: [
      'https://altamedica.com',
      'https://www.altamedica.com',
      'https://app.altamedica.com',
      'https://doctors.altamedica.com',
      'https://patients.altamedica.com',
      'https://companies.altamedica.com',
      'https://admin.altamedica.com',
      'https://api.altamedica.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  }
};

// Obtener configuración según el entorno
export function getCookieConfig() {
  return process.env.NODE_ENV === 'production' 
    ? COOKIE_CONFIG.production 
    : COOKIE_CONFIG.development;
}

export function getCorsConfig() {
  return process.env.NODE_ENV === 'production' 
    ? CORS_CONFIG.production 
    : CORS_CONFIG.development;
}

// Configuración de sesión
export const SESSION_CONFIG = {
  // Tiempo de inactividad antes de cerrar sesión (ms)
  inactivityTimeout: 30 * 60 * 1000, // 30 minutos
  
  // Tiempo para mostrar advertencia antes de cerrar sesión (ms)
  warningTime: 5 * 60 * 1000, // 5 minutos antes
  
  // Verificar actividad cada X tiempo (ms)
  checkInterval: 60 * 1000, // cada minuto
};

// URLs de autenticación
export const AUTH_URLS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh',
  verify: '/api/auth/verify',
  profile: '/api/auth/profile',
};

// Roles del sistema
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  COMPANY: 'company',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];