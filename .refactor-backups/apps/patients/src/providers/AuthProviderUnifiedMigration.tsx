/**
 * Archivo de Migración Temporal - AuthProvider Unificado
 * Este archivo actúa como puente entre el sistema anterior y el nuevo paquete @altamedica/auth
 * Permite migración gradual sin romper la funcionalidad existente
 */

'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
// Importación temporal comentada hasta resolver configuración del workspace
// import { AuthProvider as NewAuthProvider, useAuth as useNewAuth, User as NewUser, UserRole  } from '@altamedica/auth';;
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';

// Interfaces del sistema anterior (mantenemos compatibilidad)
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profileImage?: string;
}

interface AuthState {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// Contexto de compatibilidad
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
  clearError: () => {}
});

// Función para convertir el nuevo formato de usuario al formato anterior
const convertUser = (newUser: NewUser): AuthUser => ({
  id: newUser.id,
  email: newUser.email,
  name: newUser.name,
  role: newUser.role,
  emailVerified: newUser.isEmailVerified,
  createdAt: newUser.createdAt.toISOString(),
  lastLoginAt: newUser.lastLoginAt?.toISOString(),
  profileImage: newUser.avatar
});

// Componente puente que usa el nuevo AuthProvider internamente
const AuthProviderBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
  const newAuth = useNewAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Escuchar cambios en Firebase Auth para mantener compatibilidad
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Crear funciones de compatibilidad
  const login = useCallback(async (email: string, password: string) => {
    await newAuth.login({ email, password });
  }, [newAuth]);

  const logout = useCallback(async () => {
    await newAuth.logout();
  }, [newAuth]);

  const checkAuth = useCallback(async () => {
    await newAuth.refreshUser();
  }, [newAuth]);

  const clearError = useCallback(() => {
    newAuth.clearError();
  }, [newAuth]);

  // Convertir el estado del nuevo sistema al formato anterior
  const contextValue: AuthContextType = {
    user: newAuth.user ? convertUser(newAuth.user) : null,
    firebaseUser,
    isAuthenticated: newAuth.isAuthenticated,
    isLoading: newAuth.isLoading,
    error: newAuth.error,
    login,
    logout,
    checkAuth,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Proveedor principal que combina ambos sistemas
export function AuthProviderUnified({ children }: { children: ReactNode }) {
  return (
    <NewAuthProvider>
      <AuthProviderBridge>
        {children}
      </AuthProviderBridge>
    </NewAuthProvider>
  );
}

// Hook de compatibilidad que mantiene la interfaz anterior
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProviderUnified');
  }
  return context;
}

// Hook para rutas protegidas (mantiene compatibilidad)
export function useRequireAuth(redirectTo = '/') {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      checkAuth().then(() => {
        if (!isAuthenticated) {
          router.push(redirectTo);
        }
      });
    }
  }, [isAuthenticated, isLoading, checkAuth, router, redirectTo]);
  
  return { isAuthenticated, isLoading };
}
