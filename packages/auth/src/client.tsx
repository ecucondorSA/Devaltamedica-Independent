/**
 * @altamedica/auth - Client-side exports
 * Este archivo contiene todos los exports que requieren 'use client'
 */

'use client';

// Re-export all client-side hooks and components
export {
  AuthContext,
  AuthProvider,
  useAuth,
  useProtectedRoute,
  useRequireAuth,
  useRole,
} from './hooks/useAuth';

// Export types that are safe for client-side
export type { AuthState, LoginCredentials, RegisterData, User } from './services/AuthService';
