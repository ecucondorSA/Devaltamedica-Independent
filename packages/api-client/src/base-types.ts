/**
 * Base Types for API Client
 * Extracted to avoid circular dependencies
 */

export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface BaseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface BaseRequestOptions {
  token?: string;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
  params?: Record<string, any>;
}