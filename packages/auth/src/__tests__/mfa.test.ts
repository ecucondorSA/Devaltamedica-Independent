import { describe, expect, it } from 'vitest';
import { decryptSecret, generateMfaSecret, rotateSecret, validateExpectedHash, verifyTotpCode } from '../mfa';

// Pepper y key de prueba (NO usar en prod)
const PEPPER = 'test-pepper-123';
const ENC_KEY = Buffer.alloc(32, 7); // 0x07 repetido

describe('MFA Utils', () => {
  it('genera secreto, hash y cifrado consistente', () => {
    const { secret, secretHash, secretEnc } = generateMfaSecret({ accountName: 'user@example.com', pepper: PEPPER, encryptionKey: ENC_KEY });
    expect(secret).toMatch(/^[A-Z2-7]+=*$/); // base32
    expect(secretHash).toHaveLength(64);
    expect(secretEnc).toBeTruthy();
    const decrypted = decryptSecret(secretEnc!, ENC_KEY);
    expect(decrypted).toBe(secret);
    expect(validateExpectedHash(secret, PEPPER, secretHash)).toBe(true);
  });

  it('verifica código TOTP válido recién generado', () => {
    const gen = generateMfaSecret({ accountName: 'user2@example.com', pepper: PEPPER });
    // Para test: generamos código usando otplib igual que en implementación
    // (Acceso directo a secret en test está permitido)
    const { authenticator } = require('otplib');
    const token = authenticator.generate(gen.secret);
    expect(verifyTotpCode({ token, secret: gen.secret })).toBe(true);
  });

  it('rechaza códigos inválidos', () => {
    const gen = generateMfaSecret({ accountName: 'user3@example.com', pepper: PEPPER });
    expect(verifyTotpCode({ token: '000000', secret: gen.secret })).toBe(false);
    expect(verifyTotpCode({ token: 'abc123', secret: gen.secret })).toBe(false);
  });

  it('rota versión correctamente', () => {
    expect(rotateSecret(0)).toBe(1);
  });
});
