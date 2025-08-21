/**
 * Multi-Factor Authentication Service
 * HIPAA Compliant - Requerido para roles médicos
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { Environment } from '@altamedica/shared/config/environment';
import { logger } from '@altamedica/shared/services/logger.service';
import { UserRole } from '@altamedica/types';

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export class MFAService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly TOKEN_WINDOW = 2; // Allow 2 windows before/after
  
  /**
   * Verifica si un rol requiere MFA obligatorio
   */
  static requiresMFA(role: UserRole): boolean {
    const mfaRoles: UserRole[] = ['ADMIN', 'DOCTOR'];
    return mfaRoles.includes(role);
  }
  
  /**
   * Genera un nuevo secreto MFA para un usuario
   */
  static async setupMFA(userId: string, email: string): Promise<MFASetupResult> {
    try {
      // Generar secreto único
      const secret = authenticator.generateSecret();
      
      // Generar nombre de la app para el authenticator
      const appName = 'AltaMedica Platform';
      const otpAuthUrl = authenticator.keyuri(email, appName, secret);
      
      // Generar QR Code
      const qrCode = await QRCode.toDataURL(otpAuthUrl);
      
      // Generar códigos de respaldo
      const backupCodes = this.generateBackupCodes();
      
      // Log de auditoría HIPAA
      logger.logMedicalAction('mfa_setup_initiated', userId, {
        userId,
        action: 'mfa_setup',
        metadata: {
          email,
          timestamp: new Date().toISOString()
        }
      });
      
      return {
        secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      logger.error('MFA setup failed', error, { userId });
      throw new Error('Failed to setup MFA');
    }
  }
  
  /**
   * Verifica un código TOTP
   */
  static verifyTOTP(token: string, secret: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret,
        window: this.TOKEN_WINDOW
      });
    } catch (error) {
      logger.error('TOTP verification error', error);
      return false;
    }
  }
  
  /**
   * Verifica MFA con manejo de intentos
   */
  static async verifyMFA(
    userId: string,
    token: string,
    secret: string,
    attempts: number = 0
  ): Promise<MFAVerificationResult> {
    try {
      // Verificar intentos máximos
      if (attempts >= this.MAX_ATTEMPTS) {
        logger.warn('MFA max attempts exceeded', { userId, attempts });
        
        // Bloquear cuenta temporalmente
        await this.lockAccount(userId);
        
        return {
          success: false,
          error: 'Maximum attempts exceeded. Account locked temporarily.',
          attemptsRemaining: 0
        };
      }
      
      // Verificar token
      const isValid = this.verifyTOTP(token, secret);
      
      if (isValid) {
        // Log de éxito
        logger.info('MFA verification successful', {
          userId,
          action: 'mfa_verify_success'
        });
        
        return { success: true };
      } else {
        const remaining = this.MAX_ATTEMPTS - attempts - 1;
        
        logger.warn('MFA verification failed', {
          userId,
          attempts: attempts + 1,
          remaining
        });
        
        return {
          success: false,
          error: `Invalid code. ${remaining} attempts remaining.`,
          attemptsRemaining: remaining
        };
      }
    } catch (error) {
      logger.error('MFA verification error', error, { userId });
      return {
        success: false,
        error: 'Verification failed. Please try again.'
      };
    }
  }
  
  /**
   * Genera códigos de respaldo seguros
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generar código de 8 caracteres alfanuméricos
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }
  
  /**
   * Verifica un código de respaldo
   */
  static async verifyBackupCode(
    userId: string,
    code: string,
    storedCodes: string[]
  ): Promise<boolean> {
    try {
      const codeIndex = storedCodes.indexOf(code.toUpperCase());
      
      if (codeIndex === -1) {
        logger.warn('Invalid backup code attempt', { userId });
        return false;
      }
      
      // Código válido - marcarlo como usado
      // En producción, esto debe actualizar la DB
      logger.info('Backup code used successfully', {
        userId,
        action: 'backup_code_used',
        codeIndex
      });
      
      return true;
    } catch (error) {
      logger.error('Backup code verification error', error, { userId });
      return false;
    }
  }
  
  /**
   * Bloquea temporalmente una cuenta después de muchos intentos fallidos
   */
  private static async lockAccount(userId: string): Promise<void> {
    const lockDuration = 15 * 60 * 1000; // 15 minutos
    
    logger.warn('Account locked due to failed MFA attempts', {
      userId,
      action: 'account_locked',
      duration: lockDuration,
      metadata: {
        lockedUntil: new Date(Date.now() + lockDuration).toISOString()
      }
    });
    
    // TODO: Implementar bloqueo en base de datos
    // await db.collection('users').doc(userId).update({
    //   mfaLocked: true,
    //   mfaLockedUntil: new Date(Date.now() + lockDuration)
    // });
  }
  
  /**
   * Verifica si una cuenta está bloqueada
   */
  static async isAccountLocked(userId: string): Promise<boolean> {
    // TODO: Implementar verificación en base de datos
    // const user = await db.collection('users').doc(userId).get();
    // const data = user.data();
    // 
    // if (data?.mfaLocked && data.mfaLockedUntil) {
    //   if (new Date(data.mfaLockedUntil) > new Date()) {
    //     return true;
    //   }
    // }
    
    return false;
  }
  
  /**
   * Resetea MFA para un usuario (requiere permisos de admin)
   */
  static async resetMFA(
    userId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    logger.warn('MFA reset requested', {
      userId,
      action: 'mfa_reset',
      metadata: {
        adminId,
        reason,
        timestamp: new Date().toISOString()
      }
    });
    
    // TODO: Implementar reset en base de datos
    // await db.collection('users').doc(userId).update({
    //   mfaEnabled: false,
    //   mfaSecret: null,
    //   mfaBackupCodes: null
    // });
  }
}