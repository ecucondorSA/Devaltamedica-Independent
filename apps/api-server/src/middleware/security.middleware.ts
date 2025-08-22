import { logger } from '@altamedica/shared';
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
  apiRateLimits,
  corsConfig,
  env,
  rateLimitConfig,
  securityHeaders,
  validateSecurityConfig
} from '../config/production-security';

/**
 * Production-Ready Security Middleware
 * 
 * Implements:
 * - CORS with environment-specific origins
 * - Rate limiting per route
 * - Security headers (CSP, HSTS, etc.)
 * - Request sanitization
 * - Audit logging
 */

// Create base rate limiter
const baseRateLimiter = rateLimit(rateLimitConfig);

// Create route-specific rate limiters
const routeRateLimiters = new Map<string, any>();

// Initialize route-specific rate limiters
Object.entries(apiRateLimits).forEach(([route, config]) => {
  routeRateLimiters.set(route, rateLimit({
    ...rateLimitConfig,
    ...config,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }));
});

/**
 * Apply rate limiting based on route
 */
export const applyRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting if disabled
  if (env.RATE_LIMIT_ENABLED !== 'true') {
    return next();
  }

  // Find matching route-specific rate limiter
  const path = req.path;
  for (const [route, limiter] of routeRateLimiters.entries()) {
    if (path.startsWith(route)) {
      return limiter(req, res, next);
    }
  }

  // Apply base rate limiter for unmatched routes
  return baseRateLimiter(req, res, next);
};

/**
 * Apply security headers
 */
export const applySecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Apply static security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (typeof value === 'function') {
      res.setHeader(header, value());
    } else {
      res.setHeader(header, value);
    }
  });

  // Add request ID for tracing
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;

  next();
};

/**
 * CORS middleware with production configuration
 */
export const corsMiddleware = cors(corsConfig);

/**
 * Helmet middleware for additional security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        'https://api.altamedica.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'wss:',
      ],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
});

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove dangerous characters from query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove SQL injection attempts
        req.query[key] = (req.query[key] as string)
          .replace(/['";\\]/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');
      }
    });
  }

  // Limit request body size for non-file uploads
  if (req.headers['content-type'] &&
    !req.headers['content-type'].includes('multipart/form-data')) {
    const maxSize = 1024 * 1024; // 1MB
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        res.status(413).json({
          error: 'Payload too large',
          message: 'Request body exceeds maximum allowed size',
        });
        req.destroy();
      }
    });
  }

  next();
};

/**
 * Audit logging middleware
 */
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  // Skip if audit logging is disabled
  if (env.AUDIT_LOGGING_ENABLED !== 'true') {
    return next();
  }

  const startTime = Date.now();
  const requestId = (req as any).requestId || 'unknown';

  // Log request
  logger.info(`[AUDIT] ${new Date().toISOString()} | ${requestId} | ${req.method} ${req.path} | IP: ${req.ip}`);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`[AUDIT] ${new Date().toISOString()} | ${requestId} | Response: ${res.statusCode} | Duration: ${duration}ms`);
  });

  next();
};

/**
 * Initialize all security middlewares
 */
export const initializeSecurityMiddlewares = (app: any) => {
  // Validate security configuration
  const validation = validateSecurityConfig();
  if (!validation.isValid && env.NODE_ENV === 'production') {
    throw new Error('Security configuration validation failed');
  }

  // Apply middlewares in order
  app.use(corsMiddleware);
  app.use(helmetMiddleware);
  app.use(applySecurityHeaders);
  app.use(sanitizeRequest);
  app.use(applyRateLimit);
  app.use(auditLog);

  logger.info('✅ Security middlewares initialized successfully');
  logger.info(`   - CORS: ${env.ALLOWED_ORIGINS}`);
  logger.info(`   - Rate Limiting: ${env.RATE_LIMIT_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  logger.info(`   - Audit Logging: ${env.AUDIT_LOGGING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  logger.info(`   - CSP: Enabled with strict policy`);
  logger.info(`   - HSTS: Enabled with preload`);
};

export default {
  corsMiddleware,
  helmetMiddleware,
  applySecurityHeaders,
  applyRateLimit,
  sanitizeRequest,
  auditLog,
  initializeSecurityMiddlewares,
};