// ARCHIVO MIGRADO - Ver auth/UnifiedAuthSystem.ts
// Este archivo ha sido consolidado en el sistema unificado de autenticación

export { 
  UnifiedAuth as authMiddleware,
  requireAuth,
  requireRole,
  requireAdmin,
  requireDoctor, 
  requirePatient,
  requireCompany,
  withAuth,
  withRole,
  extractTokenFromHeader,
  getUserFromRequest,
  UserRole,
  type AuthToken,
  type AuthContext
} from '../auth/UnifiedAuthSystem';