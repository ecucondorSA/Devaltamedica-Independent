/**
 * @fileoverview Hook principal de autenticación unificado
 * @module @altamedica/hooks/auth/useAuth
 * @description Hook centralizado que consolida toda la lógica de autenticación
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTH_ERROR_MESSAGES,
  DEFAULT_SESSION_CONFIG,
  DEFAULT_TOKEN_CONFIG,
  getCombinedPermissions,
  getEnvironmentUrls,
  hasRoleHierarchy
} from './constants';
import type {
  AuthConfig,
  AuthEventData,
  AuthState,
  AuthTokens,
  LoginCredentials,
  Permission,
  RegisterData,
  Role,
  UseAuthReturn,
  User,
  UserProfile
} from './types';
import { AuthError } from './types';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// ==========================================
// TIPOS ESPECÍFICOS DEL HOOK
// ==========================================

interface UseAuthOptions extends Partial<AuthConfig> {
  /** Si debe inicializar automáticamente */
  autoInitialize?: boolean;
  /** Si debe redirigir automáticamente */
  autoRedirect?: boolean;
  /** Callback para eventos de autenticación */
  onAuthEvent?: (event: AuthEventData) => void;
  /** Si debe persistir la sesión */
  persistSession?: boolean;
  /** Si debe usar el contexto médico */
  enableMedicalContext?: boolean;
}

interface AuthContext {
  user: User | null;
  tokens: AuthTokens | null;
  sessionId: string | null;
  lastActivity: Date | null;
}

// ==========================================
// STORAGE UTILITIES
// ==========================================

class AuthStorage {
  private prefix = DEFAULT_TOKEN_CONFIG.STORAGE_KEY_PREFIX;
  
  constructor(private storageType: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage') {}

  set(key: string, value: any): void {
    const fullKey = `${this.prefix}${key}`;
    
    if (this.storageType === 'memory') {
      (this as any)[fullKey] = JSON.stringify(value);
      return;
    }

    try {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      logger.warn('Failed to save to storage:', error);
    }
  }

  get<T>(key: string): T | null {
    const fullKey = `${this.prefix}${key}`;
    
    if (this.storageType === 'memory') {
      const value = (this as any)[fullKey];
      return value ? JSON.parse(value) : null;
    }

    try {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      const value = storage.getItem(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn('Failed to read from storage:', error);
      return null;
    }
  }

  remove(key: string): void {
    const fullKey = `${this.prefix}${key}`;
    
    if (this.storageType === 'memory') {
      delete (this as any)[fullKey];
      return;
    }

    try {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(fullKey);
    } catch (error) {
      logger.warn('Failed to remove from storage:', error);
    }
  }

  clear(): void {
    if (this.storageType === 'memory') {
      Object.keys(this).forEach(key => {
        if (key.startsWith(this.prefix)) {
          delete (this as any)[key];
        }
      });
      return;
    }

    try {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => storage.removeItem(key));
    } catch (error) {
      logger.warn('Failed to clear storage:', error);
    }
  }
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook principal de autenticación que consolida toda la funcionalidad
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    autoInitialize = true,
    autoRedirect = false,
    onAuthEvent,
    persistSession = true,
    enableMedicalContext = true,
    apiUrl = getEnvironmentUrls().API_BASE,
    tokens: tokenConfig = {},
    session: sessionConfig = {},
    security = {}
  } = options;

  // ==========================================
  // ESTADO DEL HOOK
  // ==========================================

  const [authState, setAuthState] = useState<AuthState>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // ==========================================
  // REFS Y CONFIGURACIÓN
  // ==========================================

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storage = useRef(new AuthStorage('localStorage'));
  const initializingRef = useRef(false);

  // Configuración combinada
  const config = useMemo(() => ({
    apiUrl,
    tokens: { ...DEFAULT_TOKEN_CONFIG, ...tokenConfig },
    session: { ...DEFAULT_SESSION_CONFIG, ...sessionConfig },
    security: {
      requireMFA: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      bruteForceProtection: true,
      ...security
    }
  }), [apiUrl, tokenConfig, sessionConfig, security]);

  // ==========================================
  // UTILIDADES INTERNAS
  // ==========================================

  const emitAuthEvent = useCallback((event: Omit<AuthEventData, 'timestamp'>) => {
    const eventData: AuthEventData = {
      ...event,
      timestamp: new Date()
    };
    
    onAuthEvent?.(eventData);
    
    // También registrar en console para desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.info('Auth Event:', eventData);
    }
  }, [onAuthEvent]);

  const updateAuthState = useCallback((newState: AuthState, userData?: User | null, tokenData?: AuthTokens | null) => {
    setAuthState(newState);
    
    if (userData !== undefined) {
      setUser(userData);
    }
    
    if (tokenData !== undefined) {
      setTokens(tokenData);
    }

    // Limpiar error si el estado es exitoso
    if (newState === 'authenticated') {
      setError(null);
    }
  }, []);

  const saveAuthData = useCallback((userData: User, tokenData: AuthTokens) => {
    if (persistSession) {
      storage.current.set('user', userData);
      storage.current.set('tokens', tokenData);
      storage.current.set('sessionId', `session_${Date.now()}`);
      storage.current.set('lastActivity', new Date());
    }
  }, [persistSession]);

  const clearAuthData = useCallback(() => {
    storage.current.clear();
    
    // Limpiar timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  // ==========================================
  // GESTIÓN DE TOKENS
  // ==========================================

  const scheduleTokenRefresh = useCallback((expiresAt: Date) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const threshold = (config.tokens as any).AUTO_REFRESH_THRESHOLD ?? 5 * 60 * 1000;
    const timeUntilRefresh = expiresAt.getTime() - Date.now() - threshold;
    
    if (timeUntilRefresh > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTokens();
      }, timeUntilRefresh);
    }
  }, [config.tokens]);

  // Declarar logout primero para evitar referencia previa
  const logout = useCallback(async (): Promise<void> => {
    const currentUserId = user?.id || 'unknown';

    try {
      // Llamar endpoint de logout con cookies
      await fetch(`${config.apiUrl}/api/v1/auth/session-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Importante para cookies
      });

      emitAuthEvent({
        event: 'logout',
        userId: currentUserId,
        metadata: {
          success: true
        }
      });

    } catch (error) {
      logger.warn('Logout endpoint failed:', error);
    } finally {
      // Limpiar estado local independientemente del resultado
      updateAuthState('unauthenticated', null, null);
      clearAuthData();
    }
  }, [user, tokens, config.apiUrl, updateAuthState, clearAuthData, emitAuthEvent]);

  const refreshTokens = useCallback(async (): Promise<void> => {
    // Con sesiones basadas en cookies, verificamos la sesión
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/auth/session-verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Importante para cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token inválido, cerrar sesión
          await logout();
          throw new AuthError('Session expired', 'TOKEN_EXPIRED');
        }
        throw new AuthError('Failed to refresh tokens', 'REFRESH_FAILED');
      }

      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        
        if (persistSession) {
          storage.current.set('user', data.user);
          storage.current.set('lastActivity', new Date());
        }
      }

      emitAuthEvent({
        event: 'token_refresh',
        userId: user?.id || 'unknown',
        metadata: {
          success: true
        }
      });

    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      emitAuthEvent({
        event: 'token_refresh',
        userId: user?.id || 'unknown',
        metadata: {
          success: false,
          errorCode: error instanceof AuthError ? error.code : 'UNKNOWN_ERROR'
        }
      });

      throw error;
    }
  }, [tokens, config.apiUrl, user, logout, persistSession, saveAuthData, scheduleTokenRefresh, emitAuthEvent]);

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setAuthState('loading');
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/auth/session-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.code || 'LOGIN_FAILED';
        const errorMessage = AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES] || data.message;
        throw new AuthError(errorMessage, errorCode, data);
      }

      // Procesar datos de usuario (sin tokens, las cookies las maneja el servidor)
      const userData: User = data.user;

      // Actualizar estado
      updateAuthState('authenticated', userData, null);
      
      // Guardar solo datos del usuario si está habilitado
      if (persistSession) {
        storage.current.set('user', userData);
        storage.current.set('sessionId', `session_${Date.now()}`);
        storage.current.set('lastActivity', new Date());
      }

      // Emitir evento
      emitAuthEvent({
        event: 'login',
        userId: userData.id,
        metadata: {
          success: true,
          userType: userData.userType
        }
      });

    } catch (error) {
      const authError = error instanceof AuthError ? error : new AuthError('Login failed', 'LOGIN_FAILED');
      setError(authError);
      setAuthState('unauthenticated');

      emitAuthEvent({
        event: 'login',
        userId: credentials.email,
        metadata: {
          success: false,
          errorCode: authError.code
        }
      });

      throw authError;
    }
  }, [config, updateAuthState, saveAuthData, scheduleTokenRefresh, emitAuthEvent]);

  // logout ya declarado arriba

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    setAuthState('loading');
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.code || 'REGISTRATION_FAILED';
        const errorMessage = AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES] || data.message;
        throw new AuthError(errorMessage, errorCode, data);
      }

      // Si el registro incluye login automático
      if (data.user && data.success) {
        const newUser: User = data.user;

        updateAuthState('authenticated', newUser, null);
        
        if (persistSession) {
          storage.current.set('user', newUser);
          storage.current.set('sessionId', `session_${Date.now()}`);
          storage.current.set('lastActivity', new Date());
        }
      } else {
        // Registro exitoso pero requiere verificación
        setAuthState('unauthenticated');
      }

      emitAuthEvent({
        event: 'register',
        userId: data.user?.id || userData.email,
        metadata: {
          success: true,
          userType: userData.userType,
          requiresVerification: !data.accessToken
        }
      });

    } catch (error) {
      const authError = error instanceof AuthError ? error : new AuthError('Registration failed', 'REGISTRATION_FAILED');
      setError(authError);
      setAuthState('unauthenticated');

      emitAuthEvent({
        event: 'register',
        userId: userData.email,
        metadata: {
          success: false,
          errorCode: authError.code
        }
      });

      throw authError;
    }
  }, [config, updateAuthState, saveAuthData, scheduleTokenRefresh, emitAuthEvent]);

  // ==========================================
  // GESTIÓN DE PERFIL
  // ==========================================

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new AuthError('Not authenticated', 'UNAUTHENTICATED');
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new AuthError('Failed to update profile', 'PROFILE_UPDATE_FAILED');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      
      if (persistSession) {
        storage.current.set('user', updatedUser);
        storage.current.set('lastActivity', new Date());
      }

      emitAuthEvent({
        event: 'profile_update',
        userId: user.id,
        metadata: {
          success: true,
          updatedFields: Object.keys(updates)
        }
      });

    } catch (error) {
      const authError = error instanceof AuthError ? error : new AuthError('Profile update failed', 'PROFILE_UPDATE_FAILED');
      setError(authError);
      
      emitAuthEvent({
        event: 'profile_update',
        userId: user.id,
        metadata: {
          success: false,
          errorCode: authError.code
        }
      });

      throw authError;
    }
  }, [user, tokens, config.apiUrl, persistSession, saveAuthData, emitAuthEvent]);

  // ==========================================
  // MÉTODOS DE AUTORIZACIÓN
  // ==========================================

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    const userPermissions = getCombinedPermissions(user.roles);
    return userPermissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: Role): boolean => {
    if (!user) return false;
    
    return user.roles.some(userRole => 
      userRole === role || hasRoleHierarchy(userRole, role)
    );
  }, [user]);

  const hasAnyRole = useCallback((roles: Role[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setAuthState('loading');

      // Verificar sesión con el servidor
      const response = await fetch(`${config.apiUrl}/api/v1/auth/session-verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Importante para cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          updateAuthState('authenticated', data.user, null);
          
          if (persistSession) {
            storage.current.set('user', data.user);
            storage.current.set('sessionId', `session_${Date.now()}`);
            storage.current.set('lastActivity', new Date());
          }
          return;
        }
      }

      // Si no hay sesión válida, intentar recuperar datos de storage
      const storedUser = storage.current.get<User>('user');
      if (storedUser) {
        // Verificar con el servidor si la sesión sigue válida
        try {
          await refreshTokens();
        } catch (error) {
          logger.warn('Session verification failed:', error);
          clearAuthData();
          setAuthState('unauthenticated');
        }
      } else {
        setAuthState('unauthenticated');
      }

    } catch (error) {
      logger.error('Auth initialization failed:', error);
      setAuthState('unauthenticated');
      clearAuthData();
    } finally {
      initializingRef.current = false;
    }
  }, [refreshTokens, updateAuthState, clearAuthData, scheduleTokenRefresh, config.tokens]);

  // ==========================================
  // EFECTOS
  // ==========================================

  // Inicialización automática
  useEffect(() => {
    if (autoInitialize) {
      initializeAuth();
    }
  }, [autoInitialize, initializeAuth]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  // ==========================================
  // VALORES DERIVADOS
  // ==========================================

  const isAuthenticated = authState === 'authenticated' && !!user;
  const isLoading = authState === 'loading';

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Métodos de autenticación
    login,
    logout,
    register,
    
    // Gestión de tokens
    refreshTokens,
    
    // Gestión de perfil
    updateProfile,
    
    // Métodos de autorización
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions
  } as UseAuthReturn & {
    hasAnyRole: (roles: Role[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
  };
}

// ==========================================
// HOOK DE ESTADO SIMPLIFICADO
// ==========================================

/**
 * Hook simplificado que solo retorna el estado de autenticación
 */
export function useAuthState(options?: Pick<UseAuthOptions, 'autoInitialize'>) {
  const { user, isAuthenticated, isLoading, error } = useAuth({
    autoInitialize: options?.autoInitialize ?? true,
    persistSession: false // No persistir para solo estado
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    authState: isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated' as AuthState
  };
}