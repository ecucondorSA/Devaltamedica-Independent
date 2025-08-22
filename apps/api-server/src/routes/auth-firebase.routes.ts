import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getAuth } from 'firebase-admin/auth';
import { ROLE_REDIRECT_URLS } from '../config/auth-config';
import { AUTH_COOKIES } from '../constants/auth-cookies';
import { getFirestoreAdmin } from '../lib/firebase-admin';
import { issueCsrfToken } from '../middleware/csrf.middleware';

import { logger } from '@altamedica/shared';
const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Reducido de 10 a 3 intentos para mayor seguridad
  standardHeaders: true,
  legacyHeaders: false,
});

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // Cambiado de 'lax' a 'strict' para mayor seguridad
  path: '/',
  domain: process.env.COOKIE_DOMAIN || 'localhost',
};

// POST /api/v1/auth/session-login
// Body: { idToken: string }
router.post('/session-login', loginLimiter as any, async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ success: false, error: 'MISSING_ID_TOKEN' });

    const auth = getAuth();
    const expiresIn = 60 * 60 * 24 * 1000; // 1 día (reducido de 7 días para mayor seguridad)
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Emitir CSRF token de doble envío
    const csrfToken = issueCsrfToken(req, res);

    // Guardar cookie de sesión httpOnly
    res.cookie(AUTH_COOKIES.session, sessionCookie, {
      ...cookieBase,
      maxAge: expiresIn,
    });

    return res.status(200).json({ success: true, csrfToken });
  } catch (error: any) {
    logger.error('[Auth] session-login error', undefined, error);
    return res.status(401).json({ success: false, error: 'INVALID_ID_TOKEN' });
  }
});

// POST /api/v1/auth/session-logout
router.post('/session-logout', async (req: Request, res: Response) => {
  try {
    res.clearCookie(AUTH_COOKIES.session, { path: '/', domain: cookieBase.domain });
    res.clearCookie(AUTH_COOKIES.csrf, { path: '/', domain: cookieBase.domain });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'LOGOUT_FAILED' });
  }
});

// GET /api/v1/auth/session-verify
router.get('/session-verify', async (req: Request, res: Response) => {
  try {
    const sessionCookie = req.cookies?.[AUTH_COOKIES.session];
    if (!sessionCookie) return res.status(401).json({ success: false, error: 'NO_SESSION' });

    const auth = getAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    // 1) Intentar obtener rol desde token/claims
    let role: string | undefined = (decoded as any)?.role || (decoded as any)?.customClaims?.role;

    // 2) Si no hay rol en claims, intentar desde Firestore (perfil) y enviar flag pendingRoleSelection
    let pendingRoleSelection: boolean | undefined;
    if (!role) {
      try {
        const db = getFirestoreAdmin();
        const snap = await db?.doc(`users/${decoded.uid}`).get();
        const data = snap?.data() as any | undefined;
        role = data?.role;
        pendingRoleSelection = data?.pendingRoleSelection === true;
      } catch (e) {
        // continuar sin romper respuesta
      }
    }

    const lower = (role || '').toString().toLowerCase();
    const redirectUrl = lower && (ROLE_REDIRECT_URLS as any)[lower] ? (ROLE_REDIRECT_URLS as any)[lower] : undefined;
    return res.status(200).json({ success: true, user: { ...decoded, pendingRoleSelection }, role: role || null, redirectUrl, pendingRoleSelection: pendingRoleSelection === true });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'INVALID_SESSION' });
  }
});

export default router;
