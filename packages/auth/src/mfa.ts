import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { authenticator } from 'otplib';

/**
 * Utilidades MFA (TOTP) - GAP-002-T1
 * - Generación de secreto base32
 * - Hash irreversible (HMAC-SHA256 + pepper)
 * - Cifrado reversible opcional (AES-256-GCM)
 * - Verificación TOTP con ventana corta
 */

export interface GenerateSecretOptions {
  /** Nombre de la cuenta (email del usuario) para etiqueta en app Authenticator */
  accountName: string;
  /** Nombre de la entidad/issuer mostrado en la app */
  issuer?: string;
  /** Pepper global (NO almacenar en BD) */
  pepper: string;
  /** Clave AES-256 para cifrado reversible (32 bytes base64 o hex) */
  encryptionKey?: Buffer | string;
}

export interface GeneratedMfaSecret {
  secret: string; // base32
  otpauthUrl: string;
  secretHash: string; // HMAC hash irreversible
  secretEnc?: string; // Cifrado reversible base64 (iv:ciphertext:tag)
}

// Normaliza key AES desde base64/hex a Buffer 32 bytes
function normalizeAesKey(key: string | Buffer): Buffer {
  if (Buffer.isBuffer(key)) return key;
  if (key.length === 44 && key.endsWith('=')) return Buffer.from(key, 'base64');
  if (key.length === 64) return Buffer.from(key, 'hex');
  throw new Error('encryptionKey debe ser buffer o base64(32 bytes) o hex(32 bytes)');
}

export function generateMfaSecret(opts: GenerateSecretOptions): GeneratedMfaSecret {
  const { accountName, issuer = 'AltaMedica', pepper, encryptionKey } = opts;
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(accountName, issuer, secret);
  const secretHash = hashSecret(secret, pepper);
  let secretEnc: string | undefined;
  if (encryptionKey) {
    secretEnc = encryptSecret(secret, encryptionKey);
  }
  return { secret, otpauthUrl, secretHash, secretEnc };
}

export function hashSecret(secret: string, pepper: string): string {
  return createHmac('sha256', pepper).update(secret).digest('hex');
}

export function encryptSecret(secret: string, key: string | Buffer): string {
  const k = normalizeAesKey(key);
  const iv = randomBytes(12); // GCM 96 bits
  const cipher = createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptSecret(enc: string, key: string | Buffer): string {
  const k = normalizeAesKey(key);
  const [ivB64, ctB64, tagB64] = enc.split(':');
  if (!ivB64 || !ctB64 || !tagB64) throw new Error('Formato cifrado inválido');
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', k, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

export interface VerifyTotpOptions {
  token: string;
  // Usar secret en claro (si recién generado) o descifrado; NO almacenar en claro después.
  secret: string;
  window?: number; // ventana de tolerancia (default 1 = +-30s)
}

export function verifyTotpCode({ token, secret, window = 1 }: VerifyTotpOptions): boolean {
  if (!/^[0-9]{6}$/.test(token)) return false;
  if (window === 1) {
    return authenticator.verify({ token, secret });
  }
  // Ajuste temporal de la ventana usando options (no tipado), luego se restaura
  const opts: any = authenticator.options || {};
  const originalWindow = opts.window;
  try {
    opts.window = window;
    authenticator.options = opts;
    return authenticator.verify({ token, secret });
  } finally {
    opts.window = originalWindow;
    authenticator.options = opts;
  }
}

export function constantTimeHashCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export function validateExpectedHash(secret: string, pepper: string, expectedHash: string): boolean {
  const current = hashSecret(secret, pepper);
  return constantTimeHashCompare(current, expectedHash);
}

export function rotateSecret(oldVersion: number): number {
  return oldVersion + 1;
}
