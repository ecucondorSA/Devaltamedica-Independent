/**
 * @fileoverview Hooks de autenticación centralizados
 * @module @altamedica/hooks/auth
 * @description Hooks para autenticación, autorización y gestión de usuarios
 */

// Hooks principales que existen
export { useAuth } from './useAuth';
export { AuthProvider, useAuthContext, type AuthContextValue, type AuthProviderProps } from './AuthProvider';

// Tipos principales que existen
export type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  Role,
  Permission
} from './types';

// Constantes que existen
export { DEFAULT_TOKEN_CONFIG, DEFAULT_SESSION_CONFIG, AUDIT_EVENTS, AUTH_ROUTES, USER_ROLES, PERMISSIONS } from './constants';