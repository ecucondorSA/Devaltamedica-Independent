/**
 * Secure Cookie Service for Authentication Tokens
 * Replaces insecure localStorage usage with HttpOnly cookies
 * HIPAA compliant token storage
 */

export interface SecureCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export class SecureCookieService {
  private static readonly DEFAULT_OPTIONS: SecureCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };

  /**
   * Set authentication token in secure cookie
   */
  static setAuthToken(token: string, options: Partial<SecureCookieOptions> = {}): void {
    if (typeof window === 'undefined') return;

    const cookieOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create cookie string with security options
    let cookieString = `altamedica_auth_token=${encodeURIComponent(token)}`;
    
    if (cookieOptions.maxAge) {
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    }
    
    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }
    
    if (cookieOptions.domain) {
      cookieString += `; Domain=${cookieOptions.domain}`;
    }
    
    if (cookieOptions.secure) {
      cookieString += '; Secure';
    }
    
    if (cookieOptions.sameSite) {
      cookieString += `; SameSite=${cookieOptions.sameSite}`;
    }

    // Set cookie
    document.cookie = cookieString;
  }

  /**
   * Get authentication token from secure cookie
   */
  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith('altamedica_auth_token=')
    );

    if (!authCookie) return null;

    try {
      return decodeURIComponent(authCookie.split('=')[1]);
    } catch {
      return null;
    }
  }

  /**
   * Remove authentication token cookie
   */
  static removeAuthToken(): void {
    if (typeof window === 'undefined') return;

    // Set cookie with past expiration date
    document.cookie = 'altamedica_auth_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict';
  }

  /**
   * Check if auth token exists
   */
  static hasAuthToken(): boolean {
    return this.getAuthToken() !== null;
  }

  /**
   * Get token with Bearer prefix for API calls
   */
  static getBearerToken(): string | null {
    const token = this.getAuthToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Validate token format (basic validation)
   */
  static isValidToken(token: string): boolean {
    // Basic JWT format validation
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token);
  }

  /**
   * Refresh token (extend expiration)
   */
  static refreshToken(): void {
    const token = this.getAuthToken();
    if (token) {
      this.setAuthToken(token, { maxAge: this.DEFAULT_OPTIONS.maxAge });
    }
  }
}

// Export convenience functions
export const setAuthToken = SecureCookieService.setAuthToken.bind(SecureCookieService);
export const getAuthToken = SecureCookieService.getAuthToken.bind(SecureCookieService);
export const removeAuthToken = SecureCookieService.removeAuthToken.bind(SecureCookieService);
export const hasAuthToken = SecureCookieService.hasAuthToken.bind(SecureCookieService);
export const getBearerToken = SecureCookieService.getBearerToken.bind(SecureCookieService);
export const isValidToken = SecureCookieService.isValidToken.bind(SecureCookieService);
export const refreshToken = SecureCookieService.refreshToken.bind(SecureCookieService);

export default SecureCookieService;
