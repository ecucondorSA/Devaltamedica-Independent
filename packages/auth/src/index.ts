// @altamedica/auth - Paquete centralizado de autenticación consolidado
// IMPORTANTE: Este archivo ahora incluye toda la funcionalidad unificada

export const authVersion = '1.1.0';

// ============== SERVICIOS ==============
// Servicio de autenticación consolidado (migrado desde auth-service)
export { AuthService, PublicUserRole, getAuthService } from './services/AuthService';
// Re-export de UserRole desde types para evitar dependencia cruzada
export { UserRole } from '@altamedica/types';

// Tipos principales
export type { AuthState, LoginCredentials, RegisterData, User } from './services/AuthService';

// ============== HOOKS Y COMPONENTES ==============
// Hooks de React (migrado y mejorado desde auth-service)
export {
  AuthContext,
  AuthProvider,
  useAuth,
  useProtectedRoute,
  useRequireAuth,
  useRole,
} from './hooks/useAuth';

// ============== LEGACY EXPORTS ==============
// Re-export todo desde client.ts para mantener compatibilidad con imports existentes
// Esto permite que el código existente siga funcionando sin cambios inmediatos
export * from './client';

// ============== COMPATIBILIDAD ==============
// Exportaciones adicionales para compatibilidad con auth-service
export { default as default } from './services/AuthService';

// ============== REDIRECCIONES ==============
export * from './utils/redirects';

// ============== CONSTANTES ==============
// Nombres de cookies estandarizados (evitar imports profundos)
export { AUTH_COOKIES, LEGACY_AUTH_COOKIES } from './constants/cookies';

// ============== MIDDLEWARE ==============
// Middleware para Next.js apps (SSO removido; solo session-based auth)
export { authGuard, createAuthMiddleware } from './middleware/auth-guard';

// ============== COMPONENTES ==============
// Componentes unificados de autenticación
export {
  AuthGuard,
  ProtectedRoute,
  PublicRoute,
  RouteGuard,
  type AuthGuardProps,
} from './components';

// ============= MFA UTILITIES (GAP-002-T1) =============
export * from './mfa';
