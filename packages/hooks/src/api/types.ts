/**
 * @fileoverview Tipos para hooks de API
 */

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface APIError {
  message: string;
  code?: string | number;
  details?: any;
}

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAPIState<T> {
  data: T | undefined;
  loading: boolean;
  error: APIError | null;
  status: QueryStatus;
}