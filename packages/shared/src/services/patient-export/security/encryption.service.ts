import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../logger.service';

/**
 * Encryption Service for Patient Data Export
 * Handles AES-256-GCM encryption for HIPAA compliance
 * Extracted from lines 1105-1127 of original PatientDataExportService
 * Enhanced with key management and multiple encryption modes
 */

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'aes-256-ctr';
  keySize: number;
  ivSize: number;
  tagSize?: number; // For GCM mode
  saltSize?: number; // For key derivation
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag?: string; // For GCM mode
  salt?: string; // For key derivation
  algorithm: string;
  keyDerivation?: {
    method: 'pbkdf2' | 'scrypt';
    iterations?: number;
    cost?: number;
    blockSize?: number;
    parallelization?: number;
  };
}

export interface EncryptionResult {
  filePath: string;
  originalSize: number;
  encryptedSize: number;
  checksum: string;
  metadata: EncryptedData;
}

export interface KeyDerivationOptions {
  password?: string;
  salt?: Buffer;
  iterations?: number;
  keyLength?: number;
  method?: 'pbkdf2' | 'scrypt';
}

export class EncryptionService {
  private readonly defaultConfig: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keySize: 32, // 256 bits
    ivSize: 16, // 128 bits
    tagSize: 16, // 128 bits for GCM
    saltSize: 32, // 256 bits for salt
  };

  private encryptionKey: Buffer | null = null;

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize encryption key from environment or generate new one
   */
  private initializeEncryptionKey(): void {
    const keyHex = process.env.EXPORT_ENCRYPTION_KEY;
    
    if (keyHex) {
      try {
        this.encryptionKey = Buffer.from(keyHex, 'hex');
        if (this.encryptionKey.length !== this.defaultConfig.keySize) {
          throw new Error(`Invalid key size: expected ${this.defaultConfig.keySize} bytes`);
        }
      } catch (error) {
        logger.error('Invalid encryption key in environment', 'Encryption', error);
        this.encryptionKey = null;
      }
    }

    if (!this.encryptionKey) {
      logger.warn('No valid encryption key found, encryption will be disabled', 'Encryption');
    }
  }

  /**
   * Check if encryption is available and configured
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Encrypt a file using AES-256-GCM
   * Enhanced version with multiple algorithm support and metadata
   */
  async encryptFile(
    inputFilePath: string,
    config?: Partial<EncryptionConfig>
  ): Promise<EncryptionResult> {
    if (!this.isEncryptionEnabled()) {
      throw new Error('Encryption is not enabled - no valid encryption key available');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const algorithm = finalConfig.algorithm;
    const key = this.encryptionKey!;

    try {
      // Generate random IV
      const iv = crypto.randomBytes(finalConfig.ivSize);
      
      // Create cipher
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      // Generate output file path
      const encryptedFilePath = `${inputFilePath}.encrypted`;
      
      // Get original file size and create checksum
      const originalStats = fs.statSync(inputFilePath);
      const originalSize = originalStats.size;
      const originalChecksum = await this.calculateFileChecksum(inputFilePath);

      // Create streams
      const input = fs.createReadStream(inputFilePath);
      const output = fs.createWriteStream(encryptedFilePath);

      // Encryption promise
      const encryptionPromise = new Promise<void>((resolve, reject) => {
        input
          .pipe(cipher)
          .pipe(output)
          .on('finish', resolve)
          .on('error', reject);
      });

      await encryptionPromise;

      // Get authentication tag for GCM mode
      let tag: Buffer | undefined;
      if (algorithm === 'aes-256-gcm') {
        tag = (cipher as crypto.CipherGCM).getAuthTag();
      }

      // Get encrypted file size
      const encryptedStats = fs.statSync(encryptedFilePath);
      const encryptedSize = encryptedStats.size;

      // Create metadata
      const metadata: EncryptedData = {
        encrypted: 'true',
        iv: iv.toString('hex'),
        algorithm,
        tag: tag?.toString('hex'),
      };

      // Calculate checksum of encrypted file
      const encryptedChecksum = await this.calculateFileChecksum(encryptedFilePath);

      // Remove original file for security
      fs.unlinkSync(inputFilePath);

      return {
        filePath: encryptedFilePath,
        originalSize,
        encryptedSize,
        checksum: encryptedChecksum,
        metadata,
      };
    } catch (error) {
      logger.error('Error encrypting file', 'Encryption', error);
      throw new Error(`File encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt a file using the stored metadata
   */
  async decryptFile(
    encryptedFilePath: string,
    metadata: EncryptedData,
    outputFilePath?: string
  ): Promise<string> {
    if (!this.isEncryptionEnabled()) {
      throw new Error('Decryption is not enabled - no valid encryption key available');
    }

    const key = this.encryptionKey!;
    const algorithm = metadata.algorithm;
    const iv = Buffer.from(metadata.iv, 'hex');
    const tag = metadata.tag ? Buffer.from(metadata.tag, 'hex') : undefined;

    const outputPath = outputFilePath || encryptedFilePath.replace('.encrypted', '.decrypted');

    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      // Set auth tag for GCM mode
      if (algorithm === 'aes-256-gcm' && tag) {
        (decipher as crypto.DecipherGCM).setAuthTag(tag);
      }

      // Create streams
      const input = fs.createReadStream(encryptedFilePath);
      const output = fs.createWriteStream(outputPath);

      // Decryption promise
      const decryptionPromise = new Promise<void>((resolve, reject) => {
        input
          .pipe(decipher)
          .pipe(output)
          .on('finish', resolve)
          .on('error', reject);
      });

      await decryptionPromise;

      return outputPath;
    } catch (error) {
      logger.error('Error decrypting file', 'Encryption', error);
      throw new Error(`File decryption failed: ${error}`);
    }
  }

  /**
   * Encrypt data in memory (for small datasets)
   */
  encryptData(data: string | Buffer, config?: Partial<EncryptionConfig>): EncryptedData {
    if (!this.isEncryptionEnabled()) {
      throw new Error('Encryption is not enabled - no valid encryption key available');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const algorithm = finalConfig.algorithm;
    const key = this.encryptionKey!;
    const iv = crypto.randomBytes(finalConfig.ivSize);

    try {
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      let tag: string | undefined;
      if (algorithm === 'aes-256-gcm') {
        tag = (cipher as crypto.CipherGCM).getAuthTag().toString('hex');
      }

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag,
        algorithm,
      };
    } catch (error) {
      logger.error('Error encrypting data', 'Encryption', error);
      throw new Error(`Data encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data in memory
   */
  decryptData(encryptedData: EncryptedData): string {
    if (!this.isEncryptionEnabled()) {
      throw new Error('Decryption is not enabled - no valid encryption key available');
    }

    const key = this.encryptionKey!;
    const algorithm = encryptedData.algorithm;
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = encryptedData.tag ? Buffer.from(encryptedData.tag, 'hex') : undefined;

    try {
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      if (algorithm === 'aes-256-gcm' && tag) {
        (decipher as crypto.DecipherGCM).setAuthTag(tag);
      }

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data', 'Encryption', error);
      throw new Error(`Data decryption failed: ${error}`);
    }
  }

  /**
   * Derive encryption key from password using PBKDF2 or Scrypt
   */
  deriveKeyFromPassword(
    password: string,
    options: KeyDerivationOptions = {}
  ): { key: Buffer; salt: Buffer; metadata: any } {
    const salt = options.salt || crypto.randomBytes(this.defaultConfig.saltSize || 32);
    const iterations = options.iterations || 100000;
    const keyLength = options.keyLength || this.defaultConfig.keySize;
    const method = options.method || 'pbkdf2';

    let key: Buffer;
    let metadata: any;

    try {
      switch (method) {
        case 'pbkdf2':
          key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
          metadata = { method: 'pbkdf2', iterations, keyLength, hash: 'sha256' };
          break;

        case 'scrypt':
          const cost = 16384; // N parameter
          const blockSize = 8; // r parameter
          const parallelization = 1; // p parameter
          key = crypto.scryptSync(password, salt, keyLength, { cost, blockSize, parallelization });
          metadata = { method: 'scrypt', cost, blockSize, parallelization, keyLength };
          break;

        default:
          throw new Error(`Unsupported key derivation method: ${method}`);
      }

      return { key, salt, metadata };
    } catch (error) {
      logger.error('Error deriving key from password', 'Encryption', error);
      throw new Error(`Key derivation failed: ${error}`);
    }
  }

  /**
   * Calculate file checksum (SHA-256)
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Verify file integrity using checksum
   */
  async verifyFileIntegrity(filePath: string, expectedChecksum: string): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateFileChecksum(filePath);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      logger.error('Error verifying file integrity', 'Encryption', error);
      return false;
    }
  }

  /**
   * Generate new encryption key
   */
  generateNewKey(keySize: number = this.defaultConfig.keySize): Buffer {
    return crypto.randomBytes(keySize);
  }

  /**
   * Secure file deletion (overwrite before deletion)
   */
  async secureDeleteFile(filePath: string, passes: number = 3): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Overwrite file multiple times with random data
      for (let pass = 0; pass < passes; pass++) {
        const randomData = crypto.randomBytes(fileSize);
        fs.writeFileSync(filePath, randomData);
        fs.fsyncSync(fs.openSync(filePath, 'r+')); // Force write to disk
      }

      // Final deletion
      fs.unlinkSync(filePath);
    } catch (error) {
      logger.error('Error in secure file deletion', 'Encryption', error);
      throw new Error(`Secure file deletion failed: ${error}`);
    }
  }

  /**
   * Get encryption metadata for compliance reporting
   */
  getEncryptionMetadata(): {
    algorithm: string;
    keySize: number;
    ivSize: number;
    enabled: boolean;
    compliance: string[];
  } {
    return {
      algorithm: this.defaultConfig.algorithm,
      keySize: this.defaultConfig.keySize,
      ivSize: this.defaultConfig.ivSize,
      enabled: this.isEncryptionEnabled(),
      compliance: ['HIPAA', 'AES-256', 'NIST-SP-800-38D'],
    };
  }

  /**
   * Encrypt export metadata for storage
   */
  encryptExportMetadata(metadata: any): EncryptedData | null {
    if (!this.isEncryptionEnabled()) {
      return null;
    }

    try {
      const jsonData = JSON.stringify(metadata);
      return this.encryptData(jsonData);
    } catch (error) {
      logger.error('Error encrypting export metadata', 'Encryption', error);
      return null;
    }
  }

  /**
   * Decrypt export metadata
   */
  decryptExportMetadata(encryptedMetadata: EncryptedData): any | null {
    if (!this.isEncryptionEnabled()) {
      return null;
    }

    try {
      const jsonData = this.decryptData(encryptedMetadata);
      return JSON.parse(jsonData);
    } catch (error) {
      logger.error('Error decrypting export metadata', 'Encryption', error);
      return null;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
