import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import crypto from 'crypto';

import { logger } from './logger.service';
/**
 * Servicio de Autenticación Multi-Factor (MFA)
 * Implementa TOTP (Time-based One-Time Password) según RFC 6238
 * Cumple con requisitos de seguridad HIPAA para acceso a PHI
 */

export interface MFASecret {
  base32: string;
  hex: string;
  ascii: string;
  otpauth_url?: string;
  qr_data_url?: string;
}

export interface MFAVerificationResult {
  verified: boolean;
  delta?: number;
  errorMessage?: string;
}

export interface MFABackupCodes {
  codes: string[];
  generatedAt: Date;
  usedCodes: string[];
}

export interface MFAAttempt {
  userId: string;
  timestamp: Date;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

class MFAService {
  private readonly APP_NAME = 'AltaMedica Platform';
  private readonly TOKEN_VALIDITY_WINDOW = 2; // Ventana de tolerancia (períodos de 30s)
  private readonly MAX_ATTEMPTS = 5; // Máximo de intentos fallidos
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos de bloqueo
  private readonly BACKUP_CODES_COUNT = 10; // Número de códigos de respaldo
  
  // Cache de intentos de autenticación (en producción usar Redis)
  private attemptCache: Map<string, MFAAttempt[]> = new Map();

  /**
   * Genera un nuevo secreto MFA para un usuario
   */
  async generateSecret(userId: string, userEmail: string): Promise<MFASecret> {
    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.APP_NAME,
      length: 32 // 256 bits de entropía
    });

    // Generar URL para QR
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${this.APP_NAME}:${userEmail}`,
      issuer: this.APP_NAME,
      encoding: 'base32',
      period: 30,
      algorithm: 'sha1'
    });

    // Generar QR code como data URL
    let qrDataUrl: string | undefined;
    try {
      qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      logger.error('[MFA] Error generando QR code:', error);
    }

    return {
      base32: secret.base32,
      hex: secret.hex,
      ascii: secret.ascii,
      otpauth_url: otpauthUrl,
      qr_data_url: qrDataUrl
    };
  }

  /**
   * Verifica un código TOTP
   */
  verifyToken(
    token: string, 
    secret: string, 
    userId: string
  ): MFAVerificationResult {
    try {
      // Verificar si el usuario está bloqueado
      if (this.isUserLocked(userId)) {
        return {
          verified: false,
          errorMessage: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos'
        };
      }

      // Limpiar el token (remover espacios)
      const cleanToken = token.replace(/\s/g, '');

      // Verificar formato del token (6 dígitos)
      if (!/^\d{6}$/.test(cleanToken)) {
        this.recordAttempt(userId, false);
        return {
          verified: false,
          errorMessage: 'Código debe ser de 6 dígitos'
        };
      }

      // Verificar token con ventana de tolerancia
      const verification = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: this.TOKEN_VALIDITY_WINDOW,
        algorithm: 'sha1'
      });

      // Registrar intento
      this.recordAttempt(userId, verification);

      if (verification) {
        // Limpiar intentos fallidos en caso de éxito
        this.clearAttempts(userId);
        return {
          verified: true,
          delta: 0
        };
      } else {
        const remainingAttempts = this.getRemainingAttempts(userId);
        return {
          verified: false,
          errorMessage: remainingAttempts > 0 
            ? `Código incorrecto. ${remainingAttempts} intentos restantes`
            : 'Cuenta bloqueada. Intente nuevamente en 15 minutos'
        };
      }
    } catch (error) {
      logger.error('[MFA] Error verificando token:', error);
      return {
        verified: false,
        errorMessage: 'Error al verificar el código'
      };
    }
  }

  /**
   * Genera códigos de respaldo
   */
  generateBackupCodes(): MFABackupCodes {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generar código de 8 caracteres alfanuméricos
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return {
      codes,
      generatedAt: new Date(),
      usedCodes: []
    };
  }

  /**
   * Verifica un código de respaldo
   */
  verifyBackupCode(
    code: string, 
    backupCodes: MFABackupCodes
  ): boolean {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Buscar código en la lista
    const formattedCode = `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
    
    // Verificar si el código existe y no ha sido usado
    if (backupCodes.codes.includes(formattedCode) && 
        !backupCodes.usedCodes.includes(formattedCode)) {
      // Marcar código como usado
      backupCodes.usedCodes.push(formattedCode);
      return true;
    }
    
    return false;
  }

  /**
   * Registra un intento de autenticación
   */
  private recordAttempt(userId: string, success: boolean): void {
    const attempts = this.attemptCache.get(userId) || [];
    
    attempts.push({
      userId,
      timestamp: new Date(),
      success
    });

    // Mantener solo los últimos intentos relevantes
    const cutoffTime = Date.now() - this.LOCKOUT_DURATION;
    const recentAttempts = attempts.filter(
      a => a.timestamp.getTime() > cutoffTime
    );

    this.attemptCache.set(userId, recentAttempts);
  }

  /**
   * Verifica si un usuario está bloqueado
   */
  private isUserLocked(userId: string): boolean {
    const attempts = this.attemptCache.get(userId) || [];
    const cutoffTime = Date.now() - this.LOCKOUT_DURATION;
    
    const recentFailures = attempts.filter(
      a => !a.success && a.timestamp.getTime() > cutoffTime
    );

    return recentFailures.length >= this.MAX_ATTEMPTS;
  }

  /**
   * Obtiene el número de intentos restantes
   */
  private getRemainingAttempts(userId: string): number {
    const attempts = this.attemptCache.get(userId) || [];
    const cutoffTime = Date.now() - this.LOCKOUT_DURATION;
    
    const recentFailures = attempts.filter(
      a => !a.success && a.timestamp.getTime() > cutoffTime
    );

    return Math.max(0, this.MAX_ATTEMPTS - recentFailures.length);
  }

  /**
   * Limpia los intentos de un usuario
   */
  private clearAttempts(userId: string): void {
    this.attemptCache.delete(userId);
  }

  /**
   * Genera un token temporal para configuración inicial
   */
  generateSetupToken(userId: string): string {
    // Token válido por 10 minutos para configuración inicial
    const payload = {
      userId,
      purpose: 'mfa_setup',
      exp: Date.now() + 10 * 60 * 1000
    };
    
    // En producción, usar JWT firmado
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Valida un token de configuración
   */
  validateSetupToken(token: string): { valid: boolean; userId?: string } {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (payload.purpose !== 'mfa_setup' || Date.now() > payload.exp) {
        return { valid: false };
      }
      
      return { valid: true, userId: payload.userId };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Obtiene estadísticas de MFA para un usuario
   */
  getUserMFAStats(userId: string): {
    isLocked: boolean;
    remainingAttempts: number;
    lastAttempt?: Date;
  } {
    const attempts = this.attemptCache.get(userId) || [];
    const lastAttempt = attempts.length > 0 
      ? attempts[attempts.length - 1].timestamp 
      : undefined;

    return {
      isLocked: this.isUserLocked(userId),
      remainingAttempts: this.getRemainingAttempts(userId),
      lastAttempt
    };
  }
}

// Exportar instancia singleton
export const mfaService = new MFAService();

// Exportar clase para testing
export { MFAService };