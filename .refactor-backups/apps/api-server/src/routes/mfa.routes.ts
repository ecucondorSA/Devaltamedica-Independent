/**
 * 🔐 Rutas MFA (TOTP) - GAP-002-T2
 * TEMPORALMENTE DESHABILITADO - Migración a sistema de sesiones en progreso
 * TODO: Reimplementar usando UnifiedAuthSystem con sesiones
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';

const router = Router();

// Esquema para enable (opcional issuer)
const EnableSchema = z.object({
  issuer: z.string().min(1).optional(),
});

// Helper: obtener pepper y key de cifrado desde config/vars (en futuro mover a servicio config central)
function getPepper(): string {
  const pepper = process.env.MFA_PEPPER;
  if (!pepper) throw new Error('MFA_PEPPER no configurado');
  return pepper;
}

function getEncryptionKey(): Buffer | undefined {
  const key = process.env.MFA_ENC_KEY; // base64 o hex 32 bytes
  if (!key) return undefined;
  if (key.length === 44 && key.endsWith('=')) return Buffer.from(key, 'base64');
  if (key.length === 64) return Buffer.from(key, 'hex');
  throw new Error('MFA_ENC_KEY debe ser base64(32B) o hex(32B)');
}

// POST /api/v1/mfa/enable
// TODO: Reimplementar con UnifiedAuthSystem
router.post('/enable', async (req: Request, res: Response) => {
  return res.status(503).json({
    success: false,
    message: 'MFA temporalmente deshabilitado durante migración a sistema de sesiones',
  });
});

// POST /api/v1/mfa/disable
// TODO: Reimplementar con UnifiedAuthSystem
router.post('/disable', async (req: Request, res: Response) => {
  return res.status(503).json({
    success: false,
    message: 'MFA temporalmente deshabilitado durante migración a sistema de sesiones',
  });
});

export default router;
