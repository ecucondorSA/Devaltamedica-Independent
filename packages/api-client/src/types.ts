/**
 * 📋 API TYPES - ALTAMEDICA
 * Tipos comunes para respuestas de API
 */

export interface ApiResponse<T = any> {
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface CreateResponse {
  id: string;
  success: boolean;
  message?: string;
}

export interface UpdateResponse {
  success: boolean;
  message?: string;
  updated?: number;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  deleted?: number;
}

export interface BatchResponse<T> {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, boolean>;
  timestamp: Date;
  version: string;
  uptime: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any[];
    timestamp: Date;
    path?: string;
  };
}