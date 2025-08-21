// ARCHIVO MIGRADO - Ver auth/UnifiedAuthSystem.ts
// Este archivo ha sido consolidado en el sistema unificado de autenticación

export { 
  UnifiedAuthService as AuthService,
  LoginSchema,
  type SSOLoginRequest,
  type SSOLoginResponse,
  type AuthToken
} from '../../auth/UnifiedAuthSystem';