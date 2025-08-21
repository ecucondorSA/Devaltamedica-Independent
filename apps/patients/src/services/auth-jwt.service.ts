/**
 * Servicio de autenticación con JWT para la app de pacientes
 * Maneja login, logout, refresh tokens y persistencia de sesión
 */

import { UserRole } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profileComplete?: boolean;
  };
  error?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

class AuthJWTService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  private readonly TOKEN_KEY = 'altamedica_access_token';
  private readonly REFRESH_TOKEN_KEY = 'altamedica_refresh_token';
  private readonly USER_KEY = 'altamedica_user';
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Login con credenciales
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Para cookies HttpOnly
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al iniciar sesión',
        };
      }

      // Guardar tokens y usuario
      if (data.token) {
        this.setToken(data.token);
      }
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      if (data.user) {
        this.setUser(data.user);
        
        // Verificar rol de paciente
        if (data.user.role !== UserRole.PATIENT) {
          this.logout(); // Limpiar datos si no es paciente
          return {
            success: false,
            error: 'Acceso no autorizado para este portal',
          };
        }
      }

      // Configurar auto-refresh
      this.setupTokenRefresh();

      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
      };
    } catch (error) {
      logger.error('Error en login:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor',
      };
    }
  }

  /**
   * Registro de nuevo paciente
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          role: UserRole.PATIENT, // Siempre registrar como paciente en esta app
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al registrar usuario',
        };
      }

      // Auto-login después del registro exitoso
      if (data.token) {
        this.setToken(data.token);
        this.setRefreshToken(data.refreshToken);
        this.setUser(data.user);
        this.setupTokenRefresh();
      }

      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
      };
    } catch (error) {
      logger.error('Error en registro:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor',
      };
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<AuthResponse> {
    const token = this.getToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No hay sesión activa',
      };
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el token expiró, intentar refresh
        if (response.status === 401) {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            // Reintentar con nuevo token
            return this.getCurrentUser();
          }
        }
        
        return {
          success: false,
          error: data.error || 'Error al obtener usuario',
        };
      }

      // Actualizar datos locales
      if (data.user) {
        this.setUser(data.user);
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No hay refresh token disponible',
      };
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logout(); // Limpiar sesión si falla el refresh
        return {
          success: false,
          error: 'Sesión expirada, por favor inicie sesión nuevamente',
        };
      }

      // Actualizar tokens
      if (data.token) {
        this.setToken(data.token);
      }
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }

      // Reconfigurar auto-refresh
      this.setupTokenRefresh();

      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      logger.error('Error en refresh token:', error);
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const token = this.getToken();
    
    // Intentar logout en servidor
    if (token) {
      try {
        await fetch(`${this.API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        logger.error('Error en logout servidor:', error);
      }
    }

    // Limpiar datos locales
    this.clearTokens();
    this.clearUser();
    this.clearRefreshTimer();
  }

  /**
   * Configurar auto-refresh de token
   */
  private setupTokenRefresh(): void {
    this.clearRefreshTimer();
    
    const token = this.getToken();
    if (!token) return;

    try {
      // Decodificar token para obtener expiración
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return;

      // Calcular tiempo para refresh (5 minutos antes de expirar)
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const refreshIn = expiresAt - now - (5 * 60 * 1000);

      if (refreshIn > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, refreshIn);
      }
    } catch (error) {
      logger.error('Error configurando auto-refresh:', error);
    }
  }

  /**
   * Decodificar JWT token
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Verificar si el token es válido
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return false;

      // Verificar expiración
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Obtener headers con autorización
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return token
      ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  // Métodos de almacenamiento local
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  private setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  private clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Singleton instance
export const authService = new AuthJWTService();
export default authService;