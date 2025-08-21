/**
 * 🔧 API CLIENT CORE - ALTAMEDICA
 * Cliente base con autenticación, reintentos y gestión de errores
 */

import { z } from 'zod';
import { ApiError, NetworkError, ValidationError, AuthenticationError } from './errors';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onTokenExpired?: () => Promise<string | null>;
  onError?: (error: ApiError) => void;
}

export interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
  validate?: z.ZodSchema<any>;
  params?: Record<string, any>;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  private accessToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      onTokenExpired: async () => null,
      onError: () => {},
      ...config
    };
  }

  /**
   * Set the access token for authenticated requests
   */
  public setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make an API request with automatic retries and error handling
   */
  public async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      token = this.accessToken,
      skipAuth = false,
      retries = this.config.maxRetries,
      timeout = this.config.timeout,
      validate,
      ...fetchOptions
    } = options;

    const url = `${this.config.baseURL}${endpoint}`;
    
    // Setup headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {})
    };

    // Add auth header if token exists and not skipped
    if (token && !skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          ...fetchOptions,
          headers,
          signal: controller.signal
        },
        retries
      );

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response
      const data = await this.parseResponse<T>(response);

      // Validate response if schema provided
      if (validate) {
        try {
          return validate.parse(data);
        } catch (error) {
          throw new ValidationError(
            'Response validation failed',
            error instanceof z.ZodError ? error.errors : []
          );
        }
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error);
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  public put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  public patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Fetch with automatic retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retriesLeft: number
  ): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retriesLeft > 0 && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay);
        return this.fetchWithRetry(url, options, retriesLeft - 1);
      }
      throw error;
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json() as T;
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as any;
    }
    
    // Return response as-is for other content types
    return response as any;
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // Response might not be JSON
    }

    const errorMessage = errorData.message || errorData.error || response.statusText;

    switch (response.status) {
      case 401:
        // Try to refresh token
        const newToken = await this.config.onTokenExpired();
        if (newToken) {
          this.setAccessToken(newToken);
          throw new AuthenticationError('Token expired, please retry');
        }
        throw new AuthenticationError(errorMessage);
      
      case 403:
        throw new ApiError(errorMessage, response.status, 'FORBIDDEN');
      
      case 404:
        throw new ApiError(errorMessage, response.status, 'NOT_FOUND');
      
      case 422:
      case 400:
        throw new ValidationError(errorMessage, errorData.errors || []);
      
      case 429:
        throw new ApiError('Too many requests', response.status, 'RATE_LIMITED');
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ApiError('Server error', response.status, 'SERVER_ERROR');
      
      default:
        throw new ApiError(errorMessage, response.status, 'UNKNOWN');
    }
  }

  /**
   * Normalize different error types
   */
  private normalizeError(error: any): ApiError {
    if (error instanceof ApiError) {
      this.config.onError(error);
      return error;
    }

    if (error.name === 'AbortError') {
      const timeoutError = new NetworkError('Request timeout');
      this.config.onError(timeoutError);
      return timeoutError;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new NetworkError('Network error');
      this.config.onError(networkError);
      return networkError;
    }

    const genericError = new ApiError(
      error.message || 'Unknown error',
      0,
      'UNKNOWN'
    );
    this.config.onError(genericError);
    return genericError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.name === 'AbortError') {
      return true;
    }
    
    return false;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for convenience
let defaultClient: ApiClient | null = null;

export function createApiClient(config: ApiClientConfig): ApiClient {
  defaultClient = new ApiClient(config);
  return defaultClient;
}

export function getApiClient(): ApiClient {
  if (!defaultClient) {
    throw new Error('API client not initialized. Call createApiClient first.');
  }
  return defaultClient;
}