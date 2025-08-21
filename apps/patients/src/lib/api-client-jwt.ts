/**
 * Cliente API con interceptores JWT
 * Maneja automáticamente tokens, refresh y reintentos
 */

import authService from '../services/auth-jwt.service';

interface ApiRequestConfig extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private readonly baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Request genérico con manejo automático de auth
   */
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { skipAuth = false, retries = 1, ...fetchConfig } = config;
    
    // Construir URL completa
    const url = `${this.baseURL}${endpoint}`;
    
    // Configurar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchConfig.headers,
    };

    // Agregar token si no se debe saltar auth
    if (!skipAuth) {
      const token = authService.getAuthHeaders()['Authorization'];
      if (token) {
        headers['Authorization'] = token;
      }
    }

    // Hacer request
    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        credentials: 'include', // Para cookies HttpOnly
      });

      // Si el token expiró, intentar refresh
      if (response.status === 401 && !skipAuth && retries > 0) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Reintentar con nuevo token
          return this.request<T>(endpoint, { ...config, retries: retries - 1 });
        }
      }

      // Manejar errores HTTP
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || `Error ${response.status}`,
          response.status,
          error
        );
      }

      // Parsear respuesta
      const data = await response.json();
      return data;
    } catch (error) {
      // Re-lanzar errores de API
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Convertir otros errores
      throw new ApiError(
        'Error de conexión con el servidor',
        0,
        error
      );
    }
  }

  /**
   * Manejar refresh de token
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // Si ya hay un refresh en progreso, esperar
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = authService.refreshToken()
      .then(result => result.success)
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // No establecer Content-Type, el navegador lo hará automáticamente
        ...config?.headers,
      },
    });
  }
}

/**
 * Error personalizado de API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

// Instancia singleton
const apiClient = new ApiClient();
export default apiClient;

// Exportar métodos para uso directo
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
};