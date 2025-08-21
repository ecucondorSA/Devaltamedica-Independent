'use client';

// Import UserRole from types package
import { UserRole } from '@altamedica/types';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  RegisterData,
  TokenData,
  User,
} from '../types';
import { AuthStorage } from '../utils';
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
// Mapeo local de rutas por rol para evitar dependencia cruzada con @altamedica/shared
const ROLE_ROUTES: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'http://localhost:3003',
  [UserRole.DOCTOR]: 'http://localhost:3002',
  [UserRole.COMPANY]: 'http://localhost:3004',
  [UserRole.ADMIN]: 'http://localhost:3005',
};


// Estado inicial
const initialState: AuthState = {
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Tipos de acciones
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; role: UserRole } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role as UserRole | null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Crear contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de contexto
interface AuthProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  apiBaseUrl = typeof window !== 'undefined'
    ? (window as any).NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    : 'http://localhost:3001',
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función para hacer peticiones autenticadas con cookies
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Importante para cookies
    };

    const response = await fetch(`${apiBaseUrl}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Sesión expirada, hacer logout
        logout();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Login con sesiones basadas en cookies
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/session-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();

      // Guardar datos del usuario (sin tokens, las cookies las maneja el servidor)
      AuthStorage.saveUserData(data.user);

      // Obtener el rol del usuario desde la respuesta
      const userRole = data.user?.role || UserRole.PATIENT;

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, role: userRole } });

      // Redirigir según el rol
      const redirectUrl = data.redirectUrl || ROLE_ROUTES[userRole];
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // SignIn - Compatible con la implementación existente
  const signIn = async (credentials: LoginCredentials): Promise<void> => {
    await login(credentials);
  };

  // SignIn con Google - Usando sesiones basadas en cookies
  const signInWithGoogle = async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      logger.info('🔐 [AuthContext] Iniciando Google Sign-In...');

      // PASO 1: Obtener idToken de Firebase
      let idToken: string | null = null;

      try {
        // Verificar si Firebase está disponible globalmente
        const firebaseGlobal = (window as any).firebase;

        if (firebaseGlobal && firebaseGlobal.auth) {
          const provider = new firebaseGlobal.auth.GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');

          const result = await firebaseGlobal.auth().signInWithPopup(provider);
          idToken = await result.user.getIdToken();

          logger.info('✅ [AuthContext] Firebase Google Sign-In exitoso');
        }
      } catch (authError) {
        logger.error('❌ [AuthContext] Error en Google Sign-In:', authError);
        throw authError;
      }

      if (!idToken) {
        throw new Error('No se pudo obtener el token de Google');
      }

      // PASO 2: Enviar token al servidor para establecer sesión
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/session-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Error al establecer sesión');
      }

      const data = await response.json();

      // PASO 3: Guardar datos del usuario
      AuthStorage.saveUserData(data.user);

      // PASO 4: Actualizar estado del contexto
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, role: data.user?.role || UserRole.PATIENT },
      });

      logger.info('✅ [AuthContext] Google Sign-In completado exitosamente');
    } catch (error) {
      logger.error('❌ [AuthContext] Error en Google Sign-In:', error);
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Error al iniciar sesión con Google',
      });
    }
  };

  // SignUp - Alias para register para compatibilidad
  const signUp = async (data: RegisterData): Promise<void> => {
    await register(data);
  }; // Registro
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error en el registro');
      }

      const result = await response.json();

      // Guardar datos del usuario (sin tokens, las cookies las maneja el servidor)
      AuthStorage.saveUserData(result.user);

      // Obtener el rol del usuario desde la respuesta
      const userRole = result.user?.role || UserRole.PATIENT;

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user, role: userRole } });

      // Redirigir según el rol
      const redirectUrl = ROLE_ROUTES[userRole];
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/auth/session-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
      });
    } catch (error) {
      logger.error('Error during logout:', error);
    } finally {
      AuthStorage.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Refrescar datos del usuario
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/session-verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
      });

      if (!response.ok) {
        throw new Error('Sesión inválida');
      }

      const userData = await response.json();
      AuthStorage.saveUserData(userData.user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { 
        user: userData.user, 
        role: userData.user?.role || UserRole.PATIENT 
      } });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Error al actualizar datos del usuario' });
    }
  };

  // Limpiar error
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sesión con el servidor
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/session-verify`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Importante para cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            AuthStorage.saveUserData(data.user);
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: data.user, role: data.user?.role || UserRole.PATIENT },
            });
            return;
          }
        }
      } catch (error) {
        logger.error('Error verificando sesión:', error);
      }

      // Si no hay sesión válida, limpiar todo
      AuthStorage.clearTokens();
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    checkAuth();
  }, [apiBaseUrl]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    signIn,
    signUp,
    signInWithGoogle,
    register,
    logout,
    refreshUser,
    clearError,
    userProfile: state.user, // Alias para compatibilidad
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
