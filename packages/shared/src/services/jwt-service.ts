/**
import { logger } from './logger.service';

 * 🔐 JWT SERVICE - ALTAMEDICA
 * Servicio centralizado para manejo de JWT en todas las aplicaciones
 * Usado por: Web-App, Admin, Doctors, Patients, Companies Apps
 */

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

interface CookieConfig {
  path: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

const COOKIE_NAMES = {
  accessToken: 'altamedica_access_token',
  refreshToken: 'altamedica_refresh_token',
  userRole: 'altamedica_user_role'
};

const DEFAULT_COOKIE_CONFIG: CookieConfig = {
  path: '/',
  domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
  httpOnly: false, // Client-side JWT handling
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
};

/**
 * Servicio para manejar JWT de forma consistente en todas las apps
 */
export class JWTService {
  /**
   * Decodifica un token JWT (sin verificar firma)
   * Útil para el cliente
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      logger.error('Error decodificando token:', error);
      return null;
    }
  }
  
  /**
   * Verifica si un token ha expirado
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    // exp está en segundos, Date.now() en milisegundos
    return Date.now() >= payload.exp * 1000;
  }
  
  /**
   * Obtiene el tiempo restante del token en milisegundos
   */
  static getTokenTimeLeft(token: string): number {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return 0;
    }
    
    const expirationTime = payload.exp * 1000;
    const timeLeft = expirationTime - Date.now();
    return timeLeft > 0 ? timeLeft : 0;
  }
  
  /**
   * Guarda el token en cookies
   */
  static setToken(token: string, type: 'access' | 'refresh' = 'access'): void {
    if (typeof window === 'undefined') return;
    
    const cookieName = type === 'access' 
      ? COOKIE_NAMES.accessToken 
      : COOKIE_NAMES.refreshToken;
    
    // Construir string de cookie
    let cookieString = `${cookieName}=${token}`;
    cookieString += `; path=${DEFAULT_COOKIE_CONFIG.path}`;
    cookieString += `; max-age=${DEFAULT_COOKIE_CONFIG.maxAge}`;
    
    if (DEFAULT_COOKIE_CONFIG.secure) {
      cookieString += '; secure';
    }
    
    cookieString += `; samesite=${DEFAULT_COOKIE_CONFIG.sameSite}`;
    
    document.cookie = cookieString;
  }
  
  /**
   * Obtiene el token de las cookies
   */
  static getToken(type: 'access' | 'refresh' = 'access'): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookieName = type === 'access' 
      ? COOKIE_NAMES.accessToken 
      : COOKIE_NAMES.refreshToken;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === cookieName) {
        return value;
      }
    }
    
    return null;
  }
  
  /**
   * Elimina el token de las cookies
   */
  static removeToken(type: 'access' | 'refresh' | 'all' = 'all'): void {
    if (typeof window === 'undefined') return;
    
    const removeTokenCookie = (cookieName: string) => {
      document.cookie = `${cookieName}=; path=${DEFAULT_COOKIE_CONFIG.path}; max-age=0`;
    };
    
    if (type === 'all') {
      removeTokenCookie(COOKIE_NAMES.accessToken);
      removeTokenCookie(COOKIE_NAMES.refreshToken);
      removeTokenCookie(COOKIE_NAMES.userRole);
    } else {
      const cookieName = type === 'access' 
        ? COOKIE_NAMES.accessToken 
        : COOKIE_NAMES.refreshToken;
      removeTokenCookie(cookieName);
    }
  }
  
  /**
   * Guarda el rol del usuario en una cookie separada
   * (útil para verificaciones rápidas sin decodificar el token)
   */
  static setUserRole(role: string): void {
    if (typeof window === 'undefined') return;
    
    let cookieString = `${COOKIE_NAMES.userRole}=${role}`;
    cookieString += `; path=${DEFAULT_COOKIE_CONFIG.path}`;
    cookieString += `; max-age=${DEFAULT_COOKIE_CONFIG.maxAge}`;
    
    if (DEFAULT_COOKIE_CONFIG.secure) {
      cookieString += '; secure';
    }
    
    cookieString += `; samesite=${DEFAULT_COOKIE_CONFIG.sameSite}`;
    
    document.cookie = cookieString;
  }
  
  /**
   * Obtiene el rol del usuario de la cookie
   */
  static getUserRole(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === COOKIE_NAMES.userRole) {
        return value;
      }
    }
    
    return null;
  }
  
  /**
   * Verifica si el usuario tiene un token válido
   */
  static isAuthenticated(): boolean {
    const token = this.getToken('access');
    if (!token) return false;
    
    return !this.isTokenExpired(token);
  }
  
  /**
   * Obtiene la información del usuario del token
   */
  static getCurrentUser(): TokenPayload | null {
    const token = this.getToken('access');
    if (!token) return null;
    
    return this.decodeToken(token);
  }
  
  /**
   * Maneja el refresh del token
   */
  static async refreshAccessToken(apiUrl?: string): Promise<boolean> {
    try {
      const refreshToken = this.getToken('refresh');
      if (!refreshToken || this.isTokenExpired(refreshToken)) {
        return false;
      }
      
      const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Llamar al endpoint de refresh
      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      // Guardar nuevo access token
      if (data.accessToken || data.data?.accessToken) {
        const newToken = data.accessToken || data.data.accessToken;
        this.setToken(newToken, 'access');
        
        // Actualizar rol si viene en la respuesta
        const role = data.role || data.data?.role;
        if (role) {
          this.setUserRole(role);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return false;
    }
  }
  
  /**
   * Configura un intervalo para refrescar el token automáticamente
   */
  static setupAutoRefresh(apiUrl?: string): () => void {
    const checkAndRefresh = async () => {
      const token = this.getToken('access');
      if (!token) return;
      
      const timeLeft = this.getTokenTimeLeft(token);
      
      // Si quedan menos de 5 minutos, refrescar
      if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
        await this.refreshAccessToken(apiUrl);
      }
    };
    
    // Verificar cada minuto
    const intervalId = setInterval(checkAndRefresh, 60 * 1000);
    
    // Retornar función de limpieza
    return () => clearInterval(intervalId);
  }

  /**
   * Valida formato del token
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Obtiene claims específicos del token
   */
  static getTokenClaim<T = any>(token: string, claim: string): T | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;
    
    return (payload as any)[claim] || null;
  }

  /**
   * Limpia todos los datos de autenticación
   */
  static clearAuthData(): void {
    this.removeToken('all');
  // No interactuar con localStorage para tokens/sesión; backend maneja cookies HttpOnly
  }
}

// Singleton para uso global
let jwtServiceInstance: JWTService | null = null;

export const getJWTService = (): typeof JWTService => {
  return JWTService;
};

// Exportar instancia para conveniencia
export const jwtService = JWTService;

// Export por defecto
export default JWTService;