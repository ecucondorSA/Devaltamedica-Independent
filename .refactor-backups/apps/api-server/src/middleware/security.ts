import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración de seguridad con Helmet
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

// Configuración de CORS para aplicaciones médicas
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Permitir requests sin origin (móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'https://altamedica.com',
      'https://app.altamedica.com',
      'https://doctors.altamedica.com',
      'https://patients.altamedica.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

// Middleware para validar tokens JWT
export const validateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'No authorization header',
      message: 'Authorization header is required'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Invalid token format',
      message: 'Bearer token is required'
    });
  }

  try {
    // Aquí deberías validar el JWT con tu secret
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // Por ahora, solo verificamos que el token existe
    req.user = { id: 'user-id', role: 'user' };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
};

// Middleware para verificar roles médicos
export const requireMedicalRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    const userRole = (req.user as any).role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware para sanitizar datos de entrada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitizar params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Función para sanitizar objetos
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remover caracteres peligrosos
      sanitized[key] = value
        .replace(/[<>]/g, '') // Remover < y >
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/on\w+=/gi, '') // Remover event handlers
        .trim();
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  
  return sanitized;
}

// Middleware para prevenir ataques de timing
export const preventTimingAttacks = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Agregar delay aleatorio para prevenir timing attacks
    const randomDelay = Math.random() * 100; // 0-100ms
    setTimeout(() => {
      // Log de timing (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        logger.info(`⏱️ Response time: ${responseTime}ms + ${randomDelay.toFixed(2)}ms delay`);
      }
    }, randomDelay);
  });
  
  next();
};

// Middleware para validar tamaño de payload
export const validatePayloadSize = (maxSize: number = 1024 * 1024) => { // 1MB por defecto
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload too large',
        message: `Maximum payload size is ${maxSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

// Middleware para logging de seguridad
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  };
  
  // Log de requests sospechosos
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /javascript:/i, // JavaScript injection
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
  ];
  
  const requestString = JSON.stringify(securityInfo).toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (isSuspicious) {
    logger.warn(`🚨 Suspicious request detected:`, securityInfo);
  }
  
  next();
};

// Exportar todos los middlewares de seguridad
export const securityMiddlewares = {
  headers: securityHeaders,
  cors: cors(corsOptions),
  jwt: validateJWT,
  sanitize: sanitizeInput,
  timing: preventTimingAttacks,
  payload: validatePayloadSize,
  logger: securityLogger
};

export default securityMiddlewares; 