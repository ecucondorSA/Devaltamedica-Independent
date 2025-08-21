import { NextFunction, Request, Response } from 'express';

// Middleware Express compatible (placeholder seguro). Implementa autenticación real según tu entorno.
export const authMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  // TODO: integrar verificación real de sesión (Firebase Session Cookies)
  next();
};

// Re-export de utilidades Next-based para uso fuera de Express si se requieren
export {
  requireRole,
  requireAuth,
  withAuth,
  withRole,
  routePermissions,
  UserRole,
} from '../auth/UnifiedAuthSystem';

export type { AuthToken, AuthContext, AuthResult } from '../auth/UnifiedAuthSystem';