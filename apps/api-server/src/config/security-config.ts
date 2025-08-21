// Configuración de seguridad para el API Server de Altamedica

export const securityConfig = {
  // Configuración de rate limiting
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requests por ventana
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5 // máximo 5 intentos de login
    },
    medicalData: {
      windowMs: 60 * 1000, // 1 minuto
      max: 30 // máximo 30 requests por minuto
    },
    telemedicine: {
      windowMs: 60 * 1000, // 1 minuto
      max: 60 // máximo 60 requests por minuto
    },
    createResource: {
      windowMs: 60 * 1000, // 1 minuto
      max: 10 // máximo 10 creaciones por minuto
    },
    search: {
      windowMs: 60 * 1000, // 1 minuto
      max: 50 // máximo 50 búsquedas por minuto
    }
  },

  // Configuración de CORS
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'https://altamedica.com',
      'https://app.altamedica.com',
      'https://doctors.altamedica.com',
      'https://patients.altamedica.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key'
    ]
  },

  // Configuración de auditoría
  audit: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    retentionDays: 2555, // 7 años
    logPHI: true,
    logRateLimits: true,
    logErrors: true
  },

  // Configuración de encriptación
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // bytes
    ivLength: 16, // bytes
    saltLength: 64 // bytes
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    issuer: 'altamedica-api',
    audience: 'altamedica-apps'
  },

  // Configuración de payload
  payload: {
    maxSize: 1024 * 1024, // 1MB
    allowedTypes: ['application/json', 'application/x-www-form-urlencoded']
  },

  // Configuración de headers de seguridad
  headers: {
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
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

  // Configuración de roles médicos
  roles: {
    doctor: {
      permissions: ['read:patient', 'write:patient', 'read:appointment', 'write:appointment', 'telemedicine']
    },
    nurse: {
      permissions: ['read:patient', 'write:patient', 'read:appointment', 'write:appointment']
    },
    patient: {
      permissions: ['read:own_patient', 'read:own_appointment', 'telemedicine']
    },
    admin: {
      permissions: ['*'] // Todos los permisos
    }
  },

  // Configuración de endpoints por tipo
  endpoints: {
    auth: ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'],
    medicalData: ['/api/patients', '/api/medical-records', '/api/diagnoses'],
    telemedicine: ['/api/telemedicine', '/api/video-calls', '/api/chat'],
    createResource: ['/api/patients', '/api/appointments', '/api/medical-records'],
    search: ['/api/search', '/api/patients/search', '/api/appointments/search'],
    general: ['/api/health', '/api/status', '/api/version']
  }
};

// Función para obtener configuración de rate limiting por endpoint
export const getRateLimitConfig = (endpoint: string) => {
  if (securityConfig.endpoints.auth.some(path => endpoint.startsWith(path))) {
    return securityConfig.rateLimiting.auth;
  }
  if (securityConfig.endpoints.medicalData.some(path => endpoint.startsWith(path))) {
    return securityConfig.rateLimiting.medicalData;
  }
  if (securityConfig.endpoints.telemedicine.some(path => endpoint.startsWith(path))) {
    return securityConfig.rateLimiting.telemedicine;
  }
  if (securityConfig.endpoints.createResource.some(path => endpoint.startsWith(path))) {
    return securityConfig.rateLimiting.createResource;
  }
  if (securityConfig.endpoints.search.some(path => endpoint.startsWith(path))) {
    return securityConfig.rateLimiting.search;
  }
  return securityConfig.rateLimiting.general;
};

// Función para verificar si un endpoint requiere autenticación
export const requiresAuth = (endpoint: string): boolean => {
  const publicEndpoints = [
    '/api/health',
    '/api/status',
    '/api/version',
    '/api/auth/login',
    '/api/auth/register'
  ];
  
  return !publicEndpoints.some(path => endpoint.startsWith(path));
};

// Función para verificar si un endpoint contiene PHI
export const containsPHI = (endpoint: string): boolean => {
  const phiEndpoints = [
    '/api/patients',
    '/api/medical-records',
    '/api/diagnoses',
    '/api/appointments',
    '/api/telemedicine'
  ];
  
  return phiEndpoints.some(path => endpoint.startsWith(path));
};

export default securityConfig; 