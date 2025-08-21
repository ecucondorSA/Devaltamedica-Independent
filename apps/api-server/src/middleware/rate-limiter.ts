import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

import { logger } from '@altamedica/shared/services/logger.service';
// Rate limiter general para toda la API
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
    });
  }
});

// Rate limiter estricto para autenticación
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many login attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000)
    });
  }
});

// Rate limiter para endpoints médicos críticos
export const medicalDataRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requests por minuto
  message: {
    error: 'Too many requests to medical data, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Medical data rate limit exceeded',
      message: 'Too many requests to medical data, please slow down.',
      retryAfter: Math.ceil(60 / 1000) // 1 minute in seconds
    });
  }
});

// Rate limiter para creación de recursos
export const createResourceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 creaciones por minuto
  message: {
    error: 'Too many resource creation attempts, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Resource creation rate limit exceeded',
      message: 'Too many resource creation attempts, please slow down.',
      retryAfter: Math.ceil(60 / 1000)
    });
  }
});

// Rate limiter para telemedicina (más permisivo)
export const telemedicineRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requests por minuto para telemedicina
  message: {
    error: 'Too many telemedicine requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Telemedicine rate limit exceeded',
      message: 'Too many telemedicine requests, please slow down.',
      retryAfter: Math.ceil(60 / 1000)
    });
  }
});

// Rate limiter para búsquedas
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // máximo 50 búsquedas por minuto
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Search rate limit exceeded',
      message: 'Too many search requests, please slow down.',
      retryAfter: Math.ceil(60 / 1000)
    });
  }
});

// Middleware para logging de rate limiting
export const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      logger.warn(`🚨 Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, User-Agent: ${req.get('User-Agent')}`);
      
      // Aquí podrías integrar con el sistema de auditoría
      // auditLogger.logRateLimitExceeded(req);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Configuración de rate limiting por tipo de endpoint
export const rateLimitConfig = {
  general: generalRateLimiter,
  auth: authRateLimiter,
  medicalData: medicalDataRateLimiter,
  createResource: createResourceRateLimiter,
  telemedicine: telemedicineRateLimiter,
  search: searchRateLimiter
};

export default rateLimitConfig; 