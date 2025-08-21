// ARCHIVO MIGRADO - Ver auth/UnifiedAuthSystem.ts
// Este archivo ha sido consolidado en el sistema unificado de autenticación
// La funcionalidad completa ahora se encuentra en auth/UnifiedAuthSystem.ts

export { 
  UnifiedAuthService as default,
  UnifiedAuthService,
  UnifiedAuth,
  UserRole,
  createAuthContext,
  extractTokenFromHeader,
  requireAuth,
  requireRole,
  requireAdmin,
  requireDoctor,
  requirePatient,
  requireCompany,
  withAuth,
  withRole,
  type AuthToken,
  type AuthContext,
  type AuthResult,
  type SSOLoginRequest,
  type SSOLoginResponse
} from '../auth/UnifiedAuthSystem';