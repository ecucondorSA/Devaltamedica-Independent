/**
 * Servicio de Encriptación PHI - HIPAA Compliant
 * Utiliza AES-256-GCM para encriptación de datos médicos sensibles
 */

import * as crypto from 'crypto';
import { logger } from './logger.service';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyId?: string;
}

export interface EncryptionOptions {
  keyId?: string;
  encoding?: BufferEncoding;
  additionalData?: string;
}

class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly saltLength = 32;
  private readonly tagLength = 16;
  private readonly iterations = 100000;
  
  // Cache de claves derivadas para mejorar performance
  private keyCache = new Map<string, Buffer>();
  
  private constructor() {
    this.validateEnvironment();
  }
  
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
  
  /**
   * Valida que las claves de encriptación estén configuradas
   */
  private validateEnvironment(): void {
    if (!process.env.ENCRYPTION_KEY) {
      const error = 'ENCRYPTION_KEY not configured - PHI encryption disabled';
      logger.fatal(error, new Error(error));
      throw new Error(error);
    }
    
    if (process.env.ENCRYPTION_KEY.length < 64) {
      const error = 'ENCRYPTION_KEY must be at least 64 characters';
      logger.fatal(error, new Error(error));
      throw new Error(error);
    }
  }
  
  /**
   * Obtiene o deriva la clave de encriptación
   */
  private getKey(keyId?: string): Buffer {
    const cacheKey = keyId || 'default';
    
    // Verificar cache
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }
    
    // Derivar nueva clave
    const masterKey = process.env.ENCRYPTION_KEY!;
    const salt = keyId ? 
      crypto.createHash('sha256').update(keyId).digest() :
      Buffer.from('altamedica_default_salt_2025', 'utf8');
    
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.iterations,
      32,
      'sha256'
    );
    
    // Guardar en cache
    this.keyCache.set(cacheKey, key);
    
    return key;
  }
  
  /**
   * Encripta datos PHI
   */
  encryptPHI(data: any, options: EncryptionOptions = {}): EncryptedData {
    const timer = logger.startTimer('phi_encryption');
    
    try {
      // Convertir datos a string
      const plaintext = typeof data === 'string' ? 
        data : 
        JSON.stringify(data);
      
      // Generar IV aleatorio
      const iv = crypto.randomBytes(this.ivLength);
      
      // Obtener clave
      const key = this.getKey(options.keyId);
      
      // Crear cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Agregar datos adicionales autenticados (AAD)
      if (options.additionalData) {
        cipher.setAAD(Buffer.from(options.additionalData, 'utf8'));
      }
      
      // Encriptar
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Obtener tag de autenticación
      const authTag = cipher.getAuthTag();
      
      timer();
      
      return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.algorithm,
        keyId: options.keyId
      };
    } catch (error) {
      logger.error('PHI encryption failed', error, {
        action: 'encrypt_phi',
        hasKeyId: !!options.keyId
      });
      throw new Error('Failed to encrypt PHI data');
    }
  }
  
  /**
   * Desencripta datos PHI
   */
  decryptPHI(encryptedData: EncryptedData, options: EncryptionOptions = {}): any {
    const timer = logger.startTimer('phi_decryption');
    
    try {
      // Validar algoritmo
      if (encryptedData.algorithm !== this.algorithm) {
        throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
      }
      
      // Reconstruir buffers
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
      
      // Obtener clave
      const key = this.getKey(encryptedData.keyId || options.keyId);
      
      // Crear decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      // Agregar datos adicionales autenticados (AAD)
      if (options.additionalData) {
        decipher.setAAD(Buffer.from(options.additionalData, 'utf8'));
      }
      
      // Desencriptar
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      timer();
      
      // Intentar parsear como JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        // Si no es JSON, devolver string
        return decrypted;
      }
    } catch (error) {
      logger.error('PHI decryption failed', error, {
        action: 'decrypt_phi',
        algorithm: encryptedData.algorithm,
        hasKeyId: !!encryptedData.keyId
      });
      throw new Error('Failed to decrypt PHI data');
    }
  }
  
  /**
   * Encripta un campo específico en un objeto
   */
  encryptField(obj: any, fieldPath: string, options?: EncryptionOptions): any {
    const result = { ...obj };
    const fields = fieldPath.split('.');
    let current = result;
    
    for (let i = 0; i < fields.length - 1; i++) {
      if (!current[fields[i]]) {
        return result;
      }
      current = current[fields[i]];
    }
    
    const lastField = fields[fields.length - 1];
    if (current[lastField] !== undefined) {
      current[lastField] = this.encryptPHI(current[lastField], options);
    }
    
    return result;
  }
  
  /**
   * Desencripta un campo específico en un objeto
   */
  decryptField(obj: any, fieldPath: string, options?: EncryptionOptions): any {
    const result = { ...obj };
    const fields = fieldPath.split('.');
    let current = result;
    
    for (let i = 0; i < fields.length - 1; i++) {
      if (!current[fields[i]]) {
        return result;
      }
      current = current[fields[i]];
    }
    
    const lastField = fields[fields.length - 1];
    if (current[lastField] && typeof current[lastField] === 'object' && 'encrypted' in current[lastField]) {
      current[lastField] = this.decryptPHI(current[lastField], options);
    }
    
    return result;
  }
  
  /**
   * Encripta múltiples campos PHI en un objeto
   */
  encryptPHIFields(obj: any, phiFields: string[], options?: EncryptionOptions): any {
    let result = { ...obj };
    
    for (const field of phiFields) {
      result = this.encryptField(result, field, options);
    }
    
    return result;
  }
  
  /**
   * Desencripta múltiples campos PHI en un objeto
   */
  decryptPHIFields(obj: any, phiFields: string[], options?: EncryptionOptions): any {
    let result = { ...obj };
    
    for (const field of phiFields) {
      result = this.decryptField(result, field, options);
    }
    
    return result;
  }
  
  /**
   * Hash unidireccional para datos que no necesitan ser recuperados
   */
  hashPHI(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(this.saltLength).toString('hex');
    const hash = crypto.pbkdf2Sync(
      data,
      actualSalt,
      this.iterations,
      64,
      'sha512'
    ).toString('hex');
    
    return `${actualSalt}:${hash}`;
  }
  
  /**
   * Verifica un hash PHI
   */
  verifyPHIHash(data: string, hash: string): boolean {
    try {
      const [salt, storedHash] = hash.split(':');
      const computedHash = crypto.pbkdf2Sync(
        data,
        salt,
        this.iterations,
        64,
        'sha512'
      ).toString('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(storedHash),
        Buffer.from(computedHash)
      );
    } catch (error) {
      logger.error('PHI hash verification failed', error);
      return false;
    }
  }
  
  /**
   * Genera una clave segura para encriptación
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Rota las claves de encriptación (para mantenimiento)
   */
  async rotateKeys(oldKeyId: string, newKeyId: string, data: EncryptedData): Promise<EncryptedData> {
    try {
      // Desencriptar con clave antigua
      const decrypted = this.decryptPHI(data, { keyId: oldKeyId });
      
      // Re-encriptar con clave nueva
      const reencrypted = this.encryptPHI(decrypted, { keyId: newKeyId });
      
      logger.info('Encryption key rotated', {
        action: 'key_rotation',
        oldKeyId,
        newKeyId
      });
      
      return reencrypted;
    } catch (error) {
      logger.error('Key rotation failed', error, {
        oldKeyId,
        newKeyId
      });
      throw new Error('Failed to rotate encryption keys');
    }
  }
}

// Exportar instancia singleton
export const encryptionService = EncryptionService.getInstance();

// Campos PHI comunes que deben ser encriptados
export const PHI_FIELDS = [
  'ssn',
  'socialSecurityNumber',
  'dateOfBirth',
  'medicalRecordNumber',
  'healthPlanBeneficiaryNumber',
  'accountNumber',
  'certificateNumber',
  'licenseNumber',
  'vehicleIdentifier',
  'deviceIdentifier',
  'webUrl',
  'ipAddress',
  'biometricIdentifier',
  'facePhoto',
  'fingerprint',
  'voiceprint',
  'fullName',
  'email',
  'phoneNumber',
  'faxNumber',
  'address',
  'diagnosis',
  'treatment',
  'medication',
  'labResults',
  'insuranceInfo'
];

// Helper functions para uso directo
export const encrypt = (data: any, options?: EncryptionOptions) => 
  encryptionService.encryptPHI(data, options);

export const decrypt = (data: EncryptedData, options?: EncryptionOptions) => 
  encryptionService.decryptPHI(data, options);

export const hashData = (data: string, salt?: string) => 
  encryptionService.hashPHI(data, salt);

export const verifyHash = (data: string, hash: string) => 
  encryptionService.verifyPHIHash(data, hash);