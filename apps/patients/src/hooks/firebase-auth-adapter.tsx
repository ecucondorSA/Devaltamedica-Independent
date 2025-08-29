/**
 * firebase-auth-adapter.tsx
 * Adaptador para integrar Firebase Auth con el sistema existente de patients
 * Enfoque conservador: mantiene la estructura actual pero usa Firebase
 *
 * Ubicación: apps/patients/src/hooks/firebase-auth-adapter.tsx
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';

import { logger } from '@altamedica/shared';
// Lazy loading para Firebase Auth - solo se carga cuando sea necesario
const FirebaseAuth = dynamic(() => import('firebase/auth'), {
  ssr: false
});

const FirebaseFirestore = dynamic(() => import('firebase/firestore'), {
  ssr: false
});

// Importar la configuración local de Firebase
// import { auth, db } from "../lib/firebase";

// Tipos compatibles con el sistema existente
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
} from '@altamedica/auth';

/**
 * Servicio adaptador que conecta Firebase con el sistema existente
 * Enfoque conservador: mínimos cambios al código actual
 *
 * TEMPORAL: Versión mock sin Firebase hasta que esté configurado
 */
export class FirebaseAuthAdapter {
  private static instance: FirebaseAuthAdapter;

  private constructor() {}

  static getInstance(): FirebaseAuthAdapter {
    if (!FirebaseAuthAdapter.instance) {
      FirebaseAuthAdapter.instance = new FirebaseAuthAdapter();
    }
    return FirebaseAuthAdapter.instance;
  }

  /**
   * Convierte usuario de Firebase al formato existente
   * Mantiene compatibilidad total con el código actual
   */
  private async mapFirebaseUserToLocal(firebaseUser: any): Promise<User> {
    // Versión mock temporal
    return {
      id: firebaseUser?.uid || "mock-user-id",
      email: firebaseUser?.email || "mock@example.com",
      firstName: firebaseUser?.displayName?.split(" ")[0] || "Mock",
      lastName: firebaseUser?.displayName?.split(" ")[1] || "User",
      role: "patient",
      patientId: firebaseUser?.uid || "mock-patient-id",
      doctorId: undefined,
      permissions: ["read:own_records"],
      avatar: firebaseUser?.photoURL,
      phoneNumber: firebaseUser?.phoneNumber,
      lastLogin: new Date().toISOString(),
      isActive: true,
    };
  }

  /**
   * Login usando Firebase Auth
   * Compatible con la interfaz existente
   */
  async login(credentials: LoginCredentials): Promise<{
    user: User;
    token: string;
  }> {
    // Versión mock temporal
    logger.info("Mock login with:", credentials.email);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "mock-user-id",
      email: credentials.email,
      firstName: "Mock",
      lastName: "User",
      role: "patient",
      patientId: "mock-patient-id",
      permissions: ["read:own_records", "write:own_appointments"],
      isActive: true,
    };

    const mockToken = "mock-jwt-token";

  // No guardar tokens en storage; api-server gestionará cookies HttpOnly

    return { user: mockUser, token: mockToken };
  }

  /**
   * Registro de nuevo usuario
   * Crea usuario en Firebase y Firestore
   */
  async register(data: RegisterData): Promise<{
    user: User;
    token: string;
  }> {
    // Versión mock temporal
    logger.info("Mock register with:", data.email);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "mock-user-id",
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "patient",
      patientId: "mock-patient-id",
      permissions: ["read:own_records", "write:own_appointments"],
      isActive: true,
    };

    const mockToken = "mock-jwt-token";

  // No guardar tokens en storage

    return { user: mockUser, token: mockToken };
  }

  /**
   * Logout
   * Cierra sesión en Firebase y limpia localStorage
   */
  async logout(): Promise<void> {
    // Versión mock temporal
    logger.info("Mock logout");

  // Nada que limpiar en storage (cookies HttpOnly se limpian en backend)
  }

  /**
   * Obtener usuario actual
   * Verifica si hay sesión activa
   */
  async getCurrentUser(): Promise<User | null> {
  // Versión mock temporal: sin storage, retornar null
  return null;
  }

  /**
   * Observar cambios de autenticación
   * Compatible con el patrón existente
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Versión mock temporal - no hace nada
    logger.info("Mock onAuthStateChanged");
    return () => {}; // No-op unsubscribe
  }

  /**
   * Refrescar token
   * Mantiene la sesión activa
   */
  async refreshToken(): Promise<string | null> {
  // Versión mock temporal: sin storage
  return null;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
  // Versión mock temporal: sin storage
  return false;
  }
}

// Exportar instancia única
export const firebaseAuthAdapter = FirebaseAuthAdapter.getInstance();

/**
 * Hook para usar Firebase Auth con la interfaz existente
 * Reemplaza mínimamente el useAuth actual
 */
export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Verificar estado inicial
    const checkInitialAuth = async () => {
      try {
  const user = await firebaseAuthAdapter.getCurrentUser();
  const token = null; // Tokens manejados vía cookies HttpOnly

        setAuthState({
          user,
          token,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Error verificando autenticación",
        }));
      }
    };

    checkInitialAuth();

    // Suscribirse a cambios de auth (mock)
    const unsubscribe = firebaseAuthAdapter.onAuthStateChanged((user) => {
      setAuthState((prev) => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    });

    return unsubscribe;
  }, []);

  // Métodos que mantienen la misma interfaz
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await firebaseAuthAdapter.login(credentials);

      setAuthState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Error en login",
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseAuthAdapter.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await firebaseAuthAdapter.register(data);

      setAuthState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Error en registro",
      }));
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const token = await firebaseAuthAdapter.refreshToken();
    if (token) {
      setAuthState((prev) => ({ ...prev, token }));
    }
  }, []);

  // Métodos auxiliares compatibles
  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      // Implementación mock temporal
      if (!authState.user) return;

      // Actualizar estado local
      setAuthState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
      }));
    },
    [authState.user]
  );

  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!authState.user) return false;
      return (
        authState.user.permissions.includes(permission) ||
        authState.user.permissions.includes("*")
      );
    },
    [authState.user]
  );

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!authState.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(authState.user.role);
    },
    [authState.user]
  );

  return {
    authState,
    login,
    logout,
    register,
    refreshToken,
    updateProfile,
    checkPermission,
    hasRole,
  };
}
