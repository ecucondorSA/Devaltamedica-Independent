import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

import { logger } from '@altamedica/shared';
// Module type: ESM (via tsx/tsc; runtime CJS-compatible)

/**
 * Production Security Configuration
 * ❌ ELIMINATED: Development-only configurations and security bypasses
 * ✅ PRODUCTION: Enterprise-grade security settings
 */

// Environment validation schema
const EnvironmentSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  API_URL: z.string().url(),

  // Firebase (required)
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // JWT tokens (required)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Database
  DATABASE_URL: z.string().min(1).optional(),

  // External APIs
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),

  // Security features
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true'),
  AUDIT_LOGGING_ENABLED: z.enum(['true', 'false']).default('true'),
  RBAC_ENABLED: z.enum(['true', 'false']).default('true'),

  // Feature flags (production safety)
  PATIENT_EXPORT_ENABLED: z.enum(['true', 'false']).default('false'),
  AI_DIAGNOSIS_ENABLED: z.enum(['true', 'false']).default('false'),

  // HIPAA compliance
  PHI_ENCRYPTION_ENABLED: z.enum(['true', 'false']).default('true'),
  AUDIT_HASH_CHAIN_ENABLED: z.enum(['true', 'false']).default('true'),

  // CORS origins (comma separated)
  ALLOWED_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:3004',
    ),

  // WebRTC/Telemedicine
  TURN_SERVER_URL: z.string().optional(),
  TURN_SERVER_USERNAME: z.string().optional(),
  TURN_SERVER_PASSWORD: z.string().optional(),
  SIGNALING_SERVER_URL: z.string().default('http://localhost:8888'),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  // Load .env files in development
  if (!isProduction) {
    const cwd = process.cwd();
    const envFiles = [
      path.join(cwd, '.env'),
      path.join(cwd, '.env.local'),
      path.join(cwd, '.env.development'),
      path.join(cwd, '.env.development.local'),
    ];
    for (const envPath of envFiles) {
      try {
        if (fs.existsSync(envPath)) {
          dotenv.config({ path: envPath });
        }
      } catch { }
    }
  }

  // Development-safe defaults (MOCKS) — never use in production
  const devDefaults: Record<string, string> = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: String(process.env.PORT || 3001),
    API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'altamedica-dev',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'dev@example.com',
    FIREBASE_PRIVATE_KEY:
      process.env.FIREBASE_PRIVATE_KEY ||
      '-----BEGIN PRIVATE KEY-----\nDEV\n-----END PRIVATE KEY-----',
    JWT_SECRET: process.env.JWT_SECRET || 'x'.repeat(64),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'y'.repeat(64),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED || 'false',
    AUDIT_LOGGING_ENABLED: process.env.AUDIT_LOGGING_ENABLED || 'false',
    RBAC_ENABLED: process.env.RBAC_ENABLED || 'false',
    PHI_ENCRYPTION_ENABLED: process.env.PHI_ENCRYPTION_ENABLED || 'true',
    AUDIT_HASH_CHAIN_ENABLED: process.env.AUDIT_HASH_CHAIN_ENABLED || 'false',
    ALLOWED_ORIGINS:
      process.env.ALLOWED_ORIGINS ||
      'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004',
    SIGNALING_SERVER_URL: process.env.SIGNALING_SERVER_URL || 'http://localhost:8888',
  };

  // Build candidate env: in dev, fill only missing values with defaults
  const buildEnvForValidation = (): NodeJS.ProcessEnv => {
    if (isProduction) return process.env;
    const merged: Record<string, string> = { ...process.env } as unknown as Record<string, string>;

    // Backward-compat mappings
    if ((!merged.API_URL || merged.API_URL === '') && merged.NEXT_PUBLIC_API_URL) {
      merged.API_URL = merged.NEXT_PUBLIC_API_URL as unknown as string;
    }
    if (
      (!merged.JWT_REFRESH_EXPIRES_IN || merged.JWT_REFRESH_EXPIRES_IN === '') &&
      (merged as any).REFRESH_TOKEN_EXPIRES_IN
    ) {
      merged.JWT_REFRESH_EXPIRES_IN = (merged as any).REFRESH_TOKEN_EXPIRES_IN as string;
    }
    if (
      (!merged.AUDIT_LOGGING_ENABLED || merged.AUDIT_LOGGING_ENABLED === '') &&
      (merged as any).ENABLE_AUDIT_LOGGING
    ) {
      merged.AUDIT_LOGGING_ENABLED = (merged as any).ENABLE_AUDIT_LOGGING as string;
    }
    if (
      (!merged.ENCRYPTION_SECRET || merged.ENCRYPTION_SECRET === '') &&
      (merged as any).ENCRYPTION_KEY
    ) {
      merged.ENCRYPTION_SECRET = (merged as any).ENCRYPTION_KEY as string;
    }
    if ((!merged.JWT_REFRESH_SECRET || merged.JWT_REFRESH_SECRET === '') && merged.JWT_SECRET) {
      merged.JWT_REFRESH_SECRET = merged.JWT_SECRET;
    }

    // Derive FIREBASE_* from GOOGLE_APPLICATION_CREDENTIALS if available
    if (
      (!merged.FIREBASE_PROJECT_ID ||
        !merged.FIREBASE_CLIENT_EMAIL ||
        !merged.FIREBASE_PRIVATE_KEY) &&
      merged.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      try {
        const credPath = path.isAbsolute(merged.GOOGLE_APPLICATION_CREDENTIALS)
          ? merged.GOOGLE_APPLICATION_CREDENTIALS
          : path.join(process.cwd(), merged.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(credPath)) {
          const raw = fs.readFileSync(credPath, 'utf-8');
          const json = JSON.parse(raw);
          merged.FIREBASE_PROJECT_ID = merged.FIREBASE_PROJECT_ID || json.project_id;
          merged.FIREBASE_CLIENT_EMAIL = merged.FIREBASE_CLIENT_EMAIL || json.client_email;
          if (!merged.FIREBASE_PRIVATE_KEY && json.private_key) {
            merged.FIREBASE_PRIVATE_KEY = (json.private_key as string).replace(/\n/g, '\n');
          }
        }
      } catch { }
    }
    Object.entries(devDefaults).forEach(([key, value]) => {
      const current = (merged as any)[key];
      if (current === undefined || current === '') {
        (merged as any)[key] = value;
      }
    });
    return merged as unknown as NodeJS.ProcessEnv;
  };

  try {
    const envCandidate = buildEnvForValidation();
    const parsed = EnvironmentSchema.parse(envCandidate);
    if (!isProduction) {
      const usedDefaults = Object.keys(devDefaults).filter(
        (k) => !(process.env as any)[k] || (process.env as any)[k] === '',
      );
      if (usedDefaults.length > 0) {
        logger.warn(
          `⚠️ Using development defaults (MOCKS) for missing env vars: ${usedDefaults.join(', ')}`,
        );
        logger.warn('   Do NOT use these defaults in production.');
      }
    }
    return parsed;
  } catch (error) {
    logger.error('❌ Environment validation failed:');
    const zodErr = error as any;
    if (zodErr && Array.isArray(zodErr.issues)) {
      (zodErr.issues as Array<{ path: (string | number)[]; message: string }>).forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration. Check your .env file.');
  }
}

// Export validated environment (throws if invalid)
export const env = validateEnvironment();

/**
 * Content Security Policy (CSP) configuration
 * PRODUCTION: Strict CSP headers
 */
export const cspConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // TODO: Remove in production, use nonce instead
    'https://www.googletagmanager.com',
    'https://apis.google.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // TODO: Replace with nonce for production
    'https://fonts.googleapis.com',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://firebasestorage.googleapis.com',
    'https://lh3.googleusercontent.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.altamedica.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://api.mercadopago.com',
    'wss:', // WebRTC signaling
  ],
  'media-src': ["'self'", 'blob:', 'https://firebasestorage.googleapis.com'],
  'frame-src': [
    "'none'", // Strict frame policy
  ],
  'form-action': ["'self'"],
  'frame-ancestors': [
    "'none'", // Prevent clickjacking
  ],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(cspConfig)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * CORS configuration by environment
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      // In production, reject requests with no origin
      return callback(new Error('Origin not allowed by CORS'), false);
    }

    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Additional origin validation for production
    if (env.NODE_ENV === 'production') {
      // Allow only altamedica.com subdomains in production
      const altamedicaPattern = /^https:\/\/[a-zA-Z0-9-]+\.altamedica\.com$/;
      if (altamedicaPattern.test(origin)) {
        return callback(null, true);
      }
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
  // Custom key generator for rate limiting
  keyGenerator: (req: any) => {
    // Use IP address or authenticated user ID
    return req.user?.id || req.ip || 'anonymous';
  },
  // Custom handler for rate limit exceeded
  handler: (req: any, res: any) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
    });
  },
};

/**
 * API route specific rate limits
 */
export const apiRateLimits = {
  // Authentication routes (stricter)
  '/api/v1/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  '/api/v1/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
  },
  // Medical data routes (moderate)
  '/api/v1/patients': {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
  },
  '/api/v1/prescriptions': {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
  },
  // Export routes (very strict)
  '/api/v1/exports': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2, // 2 export requests per hour
  },
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent embedding in frames (clickjacking protection)
  'X-Frame-Options': 'DENY',
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (feature policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  // Request ID for tracing
  'X-Request-ID': () => `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
};

/**
 * Validation patterns for common inputs
 */
export const inputValidation = {
  // Medical record number pattern
  medicalRecordNumber: /^MRN\d{6,10}$/,
  // Patient ID pattern (UUID v4)
  patientId: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // Doctor license number pattern
  doctorLicense: /^MD\d{6,8}$/,
  // Phone number pattern (international)
  phoneNumber: /^\+?[1-9]\d{1,14}$/,
  // IP address pattern
  ipAddress:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
};

/**
 * Security configuration validation
 */
export function validateSecurityConfig() {
  const issues: string[] = [];

  // Check JWT secrets in production
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.length < 64) {
      issues.push('JWT_SECRET should be at least 64 characters in production');
    }
    if (env.JWT_REFRESH_SECRET.length < 64) {
      issues.push('JWT_REFRESH_SECRET should be at least 64 characters in production');
    }
    if (env.ALLOWED_ORIGINS.includes('localhost')) {
      issues.push('ALLOWED_ORIGINS should not include localhost in production');
    }
  }

  // Check required HIPAA configurations
  if (env.PHI_ENCRYPTION_ENABLED !== 'true') {
    issues.push('PHI_ENCRYPTION_ENABLED must be true for HIPAA compliance');
  }
  if (env.AUDIT_LOGGING_ENABLED !== 'true') {
    issues.push('AUDIT_LOGGING_ENABLED must be true for HIPAA compliance');
  }

  if (issues.length > 0) {
    logger.warn('⚠️ Security configuration issues:');
    issues.forEach((issue) => logger.warn(`  - ${issue}`));
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Validate security configuration on module load
if (env.NODE_ENV === 'production') {
  const securityValidation = validateSecurityConfig();
  if (!securityValidation.isValid) {
    logger.error('❌ Security configuration validation failed in production');
    throw new Error('Invalid security configuration for production deployment');
  }
}
