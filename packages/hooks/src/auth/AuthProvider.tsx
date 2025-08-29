/**
 * @fileoverview Proveedor de contexto de autenticación
 * @module @altamedica/hooks/auth/AuthProvider
 * @description Componente React que proporciona contexto de autenticación a toda la app
 */

import { createContext, ReactNode, useContext, useEffect } from 'react';
import { logger } from '@altamedica/shared';
import { useAuth, User } from '@altamedica/auth';
import type { AuthState, AuthTokens } from './types';

// Unificar logging con logger compartido (Edge-safe)
// ==========================================
// CONTEXTO DE AUTENTICACIÓN
// ==========================================

interface AuthContextValue {
  // Estado de autenticación
  authState: AuthState;
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Métodos de autenticación
  login: (credentials: any) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<User>;
  refreshToken: () => Promise<void>;
  
  // Métodos de utilidad
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ==========================================
// PROVEEDOR DE AUTENTICACIÓN
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
  config?: {
    autoInitialize?: boolean;
    autoRedirect?: boolean;
    persistSession?: boolean;
    enableMedicalContext?: boolean;
  };
}

export function AuthProvider({ 
  children, 
  config = {} 
}: AuthProviderProps) {
  const auth = useAuth();

  // Inicialización automática
  useEffect(() => {
    if (config.autoInitialize !== false) {
      // La inicialización se maneja dentro del hook useAuth
      logger.info('[AuthProvider] Inicializando autenticación automática');
    }
  }, [config.autoInitialize]);

  const contextValue: AuthContextValue = {
    // Estado
    authState: (auth as any).authState || 'idle',
    user: auth.user,
    tokens: (auth as any).tokens || null,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error?.toString() || null,
    
    // Métodos
    login: async (credentials: any) => { 
      await auth.login(credentials); 
      return auth.user!;
    },
    logout: auth.logout,
    register: async (data: any) => { 
      await auth.signUp(data); 
      return auth.user!;
    },
    refreshToken: (auth as any).refreshTokens || (() => Promise.resolve()),
    
    // Utilidades
    hasPermission: (permission: string) => (auth as any).hasPermission?.(permission as any) || false,
    hasRole: (role: string) => (auth as any).hasRole?.(role as any) || false,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// HOOK DE CONTEXTO
// ==========================================

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuthContext debe ser usado dentro de un AuthProvider. ' +
      'Asegúrate de envolver tu componente con <AuthProvider>.'
    );
  }
  
  return context;
}

// ==========================================
// EXPORTACIONES
// ==========================================

export { AuthContext };
export type { AuthContextValue, AuthProviderProps };
