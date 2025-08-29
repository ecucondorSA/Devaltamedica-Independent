import { NextResponse } from 'next/server';
import { z } from 'zod';

// Simple logger implementation to avoid circular dependencies
const baseLogger = {
  info: (message: any, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message: any, data?: any) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message: any, data?: any) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message: any, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// Error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// Logger
export const logger = {
  info: (message: string, data?: any) => {
    baseLogger.info(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    baseLogger.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    baseLogger.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      baseLogger.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  }
};

// Validation helpers
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${errorMessage}`);
    }
    throw new ValidationError('Invalid data format');
  }
};

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const validatePagination = (params: any): Required<PaginationParams> => {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

  return { page, limit, sortBy, sortOrder };
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Response helpers
export const successResponse = (data: any, message?: string, meta?: any) => {
  return NextResponse.json({
    success: true,
    message: message || 'Success',
    data,
    meta
  });
};

export const createSuccessResponse = (data: any, message?: string, meta?: any) => {
  return NextResponse.json({
    success: true,
    message: message || 'Success',
    data,
    meta
  });
};

export const createErrorResponse = (
  error: string | AppError,
  statusCode: number = 500
) => {
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: error.statusCode });
  }

  return NextResponse.json({
    success: false,
    message: typeof error === 'string' ? error : 'Internal server error',
    timestamp: new Date().toISOString()
  }, { status: statusCode });
};

export const errorResponse = (
  error: string | AppError,
  statusCode: number = 500
) => {
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      message: error.message,
      code: error.code
    }, { status: error.statusCode });
  }

  return NextResponse.json({
    success: false,
    message: typeof error === 'string' ? error : 'Internal server error'
  }, { status: statusCode });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error('Async handler error:', error);
      if (error instanceof AppError) {
        return errorResponse(error);
      }
      return errorResponse('Internal server error', 500);
    }
  };
};

// Standard error codes
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Medical specific errors
  INVALID_MEDICAL_LICENSE: 'INVALID_MEDICAL_LICENSE',
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  PRESCRIPTION_EXPIRED: 'PRESCRIPTION_EXPIRED',
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  DOCTOR_NOT_AVAILABLE: 'DOCTOR_NOT_AVAILABLE',
} as const;

// Enhanced error handler
export function handleError(error: unknown): NextResponse {
  // Zod validation error
  if (error instanceof z.ZodError) {
    logger.error('Validation error:', error.errors);
    return NextResponse.json({
      success: false,
      message: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.errors : undefined,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  // Custom AppError
  if (error instanceof AppError) {
    return errorResponse(error);
  }

  // Firebase/Firestore error
  if (error instanceof Error && error.message.includes('Firebase')) {
    logger.error('Firebase error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database operation failed',
      code: ErrorCodes.DATABASE_ERROR,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  // Generic Error
  if (error instanceof Error) {
    logger.error('Unhandled error:', error);
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An internal error occurred';
      
    return NextResponse.json({
      success: false,
      message,
      code: ErrorCodes.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  // Unknown error
  logger.error('Unknown error:', error);
  return NextResponse.json({
    success: false,
    message: 'An unexpected error occurred',
    code: ErrorCodes.INTERNAL_ERROR,
    timestamp: new Date().toISOString()
  }, { status: 500 });
}

// Request validation helpers
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new ValidationError('Invalid request body');
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return schema.parse(params);
}

// Security headers
export function getSecurityHeaders(): HeadersInit {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// Add security headers to response
export function withSecurityHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });
  return response;
}