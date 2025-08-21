import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../auth/UnifiedAuthSystem';

// Middleware Express para autorización por roles/permisos (placeholder permisivo)
export const authorize = (
  _requiredRoles?: Array<UserRole | string>,
  _requiredPermissions?: string[]
) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // TODO: integrar validación real de roles/permisos
    next();
  };
};

// Re-exports útiles
export { requireRole, requireAuth, UserRole } from '../auth/UnifiedAuthSystem';
export type { AuthToken, AuthContext } from '../auth/UnifiedAuthSystem';