/**
 * 🛡️ Global Error Handler Middleware
 * Handles all errors in a consistent, secure manner
 * P1 Security: Structured error responses with request tracking
 */

import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { logger } from '@altamedica/shared';
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler middleware
 * - Logs errors with request context
 * - Prevents stack trace leakage in production
 * - Provides consistent error format
 * - Tracks errors with request IDs
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Generate or use existing request ID
  const requestId = (req as any).requestId || crypto.randomUUID();

  // Determine status code
  const status = err.status || 500;

  // Log error with full context
  const errorContext = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      status,
      stack: err.stack,
    },
    user: (req as any).user?.uid || 'anonymous',
  };

  // Log based on severity
  if (status >= 500) {
    logger.error('[ERROR] Server Error:', JSON.stringify(errorContext));
  } else if (status >= 400) {
    logger.warn('[WARNING] Client Error:', JSON.stringify(errorContext));
  } else {
    logger.info('[INFO] Error:', JSON.stringify(errorContext));
  }

  // Prepare response based on environment
  let responseBody: any = {
    error: true,
    requestId,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'production') {
    // Production: minimal information
    responseBody.message = getProductionMessage(status);
    responseBody.status = status;

    // Add retry information for rate limiting
    if (status === 429 && res.getHeader('Retry-After')) {
      responseBody.retryAfter = res.getHeader('Retry-After');
    }
  } else {
    // Development: full error details
    responseBody.message = err.message;
    responseBody.status = status;
    responseBody.code = err.code;
    responseBody.details = err.details;
    responseBody.stack = err.stack?.split('\n').slice(0, 5); // First 5 lines of stack
    responseBody.path = req.path;
    responseBody.method = req.method;
  }

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Request-ID', requestId);

  // Send response
  res.status(status).json(responseBody);
};

/**
 * Get user-friendly error message for production
 */
function getProductionMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request - The request could not be understood',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - You do not have permission to access this resource',
    404: 'Not Found - The requested resource could not be found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict - The request conflicts with the current state',
    422: 'Unprocessable Entity - The request was well-formed but contains invalid data',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Something went wrong on our side',
    502: 'Bad Gateway - Invalid response from upstream server',
    503: 'Service Unavailable - The service is temporarily unavailable',
    504: 'Gateway Timeout - The upstream server did not respond in time',
  };

  return messages[status] || `Error ${status}`;
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create structured error with status and code
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error creators
 */
export const errors = {
  badRequest: (message: string = 'Bad Request', details?: any) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string = 'Conflict') => new AppError(message, 409, 'CONFLICT'),

  validationError: (details: any) =>
    new AppError('Validation failed', 422, 'VALIDATION_ERROR', details),

  tooManyRequests: (retryAfter?: number) =>
    new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter }),

  internalError: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = errors.notFound('Endpoint');
  next(err);
};

/**
 * Validation error formatter for Zod
 */
export const formatZodError = (error: any): AppError => {
  const details = error.errors?.map((e: any) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return errors.validationError(details);
};
