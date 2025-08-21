// ARCHIVO MIGRADO - Ver auth/UnifiedAuthSystem.ts
// Los tipos han sido consolidados en el sistema unificado de autenticación

export { 
  UserRole,
  type AuthToken,
  type AuthContext,
  type AuthResult,
  type SSOLoginRequest,
  type SSOLoginResponse
} from '../../auth/UnifiedAuthSystem';

// Legacy compatibility - deprecated
export type AuthUser = AuthToken;