import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { AUTH_COOKIES } from '../constants/auth-cookies';

export function requireRoles(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionCookie = req.cookies?.[AUTH_COOKIES.session];
      if (!sessionCookie) {
        return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' });
      }
      const auth = getAuth();
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      const role = (decoded as any).role || (decoded as any)['customClaims']?.role;
      if (!role || !roles.includes(String(role).toLowerCase())) {
        return res.status(403).json({ success: false, error: 'INSUFFICIENT_ROLE' });
      }
      (req as any).user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'INVALID_SESSION' });
    }
  };
}

export function requirePermissions(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionCookie = req.cookies?.[AUTH_COOKIES.session];
      if (!sessionCookie) {
        return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' });
      }
      const auth = getAuth();
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      const userPerms: string[] =
        (decoded as any).permissions || (decoded as any)['customClaims']?.permissions || [];
      const ok = permissions.every((p) => userPerms.includes(p) || userPerms.includes('admin:all'));
      if (!ok) {
        return res.status(403).json({ success: false, error: 'INSUFFICIENT_PERMISSIONS' });
      }
      (req as any).user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'INVALID_SESSION' });
    }
  };
}
