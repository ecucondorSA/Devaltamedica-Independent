/**
 * AppError Class
 * Unified error handling for the application
 */

export enum ErrorCode {
  // Authentication errors (1000-1099)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  INVALID_CREDENTIALS = 'AUTH_005',
  
  // Validation errors (1100-1199)  
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',
  INVALID_FORMAT = 'VAL_004',
  
  // Business logic errors (1200-1299)
  RESOURCE_NOT_FOUND = 'BUS_001',
  RESOURCE_ALREADY_EXISTS = 'BUS_002',
  OPERATION_NOT_ALLOWED = 'BUS_003',
  QUOTA_EXCEEDED = 'BUS_004',
  
  // Database errors (1300-1399)
  DATABASE_ERROR = 'DB_001',
  DUPLICATE_KEY = 'DB_002',
  TRANSACTION_FAILED = 'DB_003',
  CONNECTION_ERROR = 'DB_004',
  
  // External service errors (1400-1499)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  API_LIMIT_EXCEEDED = 'EXT_002',
  SERVICE_UNAVAILABLE = 'EXT_003',
  
  // System errors (1500-1599)
  INTERNAL_ERROR = 'SYS_001',
  NOT_IMPLEMENTED = 'SYS_002',
  CONFIGURATION_ERROR = 'SYS_003',
  
  // HIPAA compliance errors (1600-1699)
  HIPAA_VIOLATION = 'HIPAA_001',
  PHI_ACCESS_DENIED = 'HIPAA_002',
  AUDIT_LOG_FAILURE = 'HIPAA_003',
  ENCRYPTION_REQUIRED = 'HIPAA_004'
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  suggestion?: string;
  documentation?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: ErrorDetails
  ) {
    super(message);
    
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();
    this.correlationId = this.generateCorrelationId();
    
    Error.captureStackTrace(this, this.constructor);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }

  public static isAppError(error: any): error is AppError {
    return error instanceof AppError;
  }

  // Factory methods for common errors
  static unauthorized(message: string = 'Unauthorized access'): AppError {
    return new AppError(message, ErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(message: string = 'Access forbidden'): AppError {
    return new AppError(message, ErrorCode.INSUFFICIENT_PERMISSIONS, 403);
  }

  static notFound(resource: string): AppError {
    return new AppError(
      `${resource} not found`,
      ErrorCode.RESOURCE_NOT_FOUND,
      404,
      true,
      { field: 'resource', value: resource }
    );
  }

  static validation(field: string, message: string, value?: any): AppError {
    return new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      { field, value }
    );
  }

  static conflict(resource: string, field?: string): AppError {
    return new AppError(
      `${resource} already exists`,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      409,
      true,
      { field }
    );
  }

  static database(message: string, details?: ErrorDetails): AppError {
    return new AppError(
      message,
      ErrorCode.DATABASE_ERROR,
      500,
      false,
      details
    );
  }

  static external(service: string, message: string): AppError {
    return new AppError(
      `External service error: ${service} - ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      false,
      { field: 'service', value: service }
    );
  }

  static hipaaViolation(message: string, details?: ErrorDetails): AppError {
    return new AppError(
      `HIPAA Compliance Violation: ${message}`,
      ErrorCode.HIPAA_VIOLATION,
      403,
      true,
      details
    );
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(
      message,
      ErrorCode.INTERNAL_ERROR,
      500,
      false
    );
  }
}

/**
 * Error handler middleware for Express
 */
export function errorHandler(
  err: Error | AppError,
  req: any,
  res: any,
  next: any
) {
  // Log error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });

  // Handle AppError
  if (AppError.isAppError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
        correlationId: err.correlationId
      }
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Duplicate entry',
          code: ErrorCode.DUPLICATE_KEY,
          details: { field: prismaError.meta?.target }
        }
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
          code: ErrorCode.RESOURCE_NOT_FOUND
        }
      });
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: err.message
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: ErrorCode.INVALID_TOKEN
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        code: ErrorCode.TOKEN_EXPIRED
      }
    });
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Something went wrong',
      code: ErrorCode.INTERNAL_ERROR,
      ...(isDevelopment && { stack: err.stack })
    }
  });
}

/**
 * Async error wrapper for Express routes
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error logger utility
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  
  private constructor() {}
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  log(error: Error | AppError, context?: any): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(AppError.isAppError(error) && {
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        details: error.details,
        correlationId: error.correlationId
      }),
      context
    };
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., CloudWatch, Datadog, etc.)
      this.sendToLoggingService(errorLog);
    } else {
      console.error('Error Log:', errorLog);
    }
  }
  
  private sendToLoggingService(errorLog: any): void {
    // Implement integration with logging service
    // Example: AWS CloudWatch, Datadog, Sentry, etc.
  }
}