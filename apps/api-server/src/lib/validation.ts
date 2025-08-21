/**
 * 🛡️ Validation Utilities for Zod Schemas
 * Provides safe parsing with proper error handling
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Parse data with a Zod schema, throwing a formatted error if validation fails
 */
export function safeParseWithError<T extends z.ZodSchema>(
  schema: T,
  data: unknown,
  errorMessage = 'Validation failed'
): z.infer<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten();
    const formattedErrors = {
      message: errorMessage,
      fieldErrors: errors.fieldErrors,
      formErrors: errors.formErrors
    };
    
    throw new ValidationError(formattedErrors);
  }
  
  return result.data;
}

/**
 * Parse data and return NextResponse with error if validation fails
 */
export function safeParseWithResponse<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten();
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            fieldErrors: errors.fieldErrors,
            formErrors: errors.formErrors
          }
        },
        { status: 400 }
      )
    };
  }
  
  return {
    success: true,
    data: result.data
  };
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    public validationErrors: {
      message: string;
      fieldErrors: Record<string, string[] | undefined>;
      formErrors: string[];
    }
  ) {
    super(validationErrors.message);
    this.name = 'ValidationError';
  }
}

/**
 * Helper to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Format Zod error for response
 */
export function formatZodError(error: z.ZodError) {
  const errors = error.flatten();
  return {
    fieldErrors: errors.fieldErrors,
    formErrors: errors.formErrors
  };
}

/**
 * Parse request body with schema validation
 */
export async function parseRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        error: JSON.stringify(formatZodError(result.error))
      };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body'
    };
  }
}

/**
 * Parse query parameters with schema validation
 */
export function parseQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      success: false,
      error: JSON.stringify(formatZodError(result.error))
    };
  }
  
  return {
    success: true,
    data: result.data
  };
}