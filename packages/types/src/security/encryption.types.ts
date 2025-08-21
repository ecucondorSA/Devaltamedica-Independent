/**
 * @fileoverview Tipos para encriptación y seguridad de datos
 * @module @altamedica/types/security/encryption
 * @description Definiciones para manejo seguro de datos médicos
 */

import { z } from 'zod';
import { PatientId, ProtectedHealthInfo } from '../core/branded.types';

// ==================== ENCRYPTION TYPES ====================

/**
 * Algoritmos de encriptación soportados
 * @enum {string}
 */
export enum EncryptionAlgorithm {
  /** AES-256 en modo GCM */
  AES_256_GCM = 'aes-256-gcm',
  /** AES-128 en modo CBC */
  AES_128_CBC = 'aes-128-cbc',
  /** ChaCha20-Poly1305 */
  CHACHA20_POLY1305 = 'chacha20-poly1305',
  /** RSA-4096 para claves */
  RSA_4096 = 'rsa-4096',
  /** ECDH para intercambio de claves */
  ECDH_P256 = 'ecdh-p256'
}

/**
 * Niveles de encriptación
 * @enum {string}
 */
export enum EncryptionLevel {
  /** Sin encriptación */
  NONE = 'none',
  /** Encriptación básica */
  BASIC = 'basic',
  /** Encriptación estándar */
  STANDARD = 'standard',
  /** Encriptación de alta seguridad */
  HIGH_SECURITY = 'high_security',
  /** Encriptación militar */
  MILITARY_GRADE = 'military_grade'
}

/**
 * Estados de encriptación
 * @enum {string}
 */
export enum EncryptionStatus {
  /** No encriptado */
  UNENCRYPTED = 'unencrypted',
  /** Encriptación en progreso */
  ENCRYPTING = 'encrypting',
  /** Encriptado */
  ENCRYPTED = 'encrypted',
  /** Desencriptación en progreso */
  DECRYPTING = 'decrypting',
  /** Error de encriptación */
  ENCRYPTION_ERROR = 'encryption_error',
  /** Clave comprometida */
  KEY_COMPROMISED = 'key_compromised'
}

// ==================== KEY MANAGEMENT ====================

/**
 * Información de clave de encriptación
 * @interface EncryptionKey
 */
export interface EncryptionKey {
  /** ID único de la clave */
  keyId: string;
  /** Algoritmo utilizado */
  algorithm: EncryptionAlgorithm;
  /** Longitud de la clave en bits */
  keyLength: number;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de expiración */
  expiresAt?: Date;
  /** Estado de la clave */
  status: KeyStatus;
  /** Propósito de la clave */
  purpose: KeyPurpose;
  /** Nivel de acceso requerido */
  accessLevel: number;
  /** Rotación automática habilitada */
  autoRotation: boolean;
  /** Intervalo de rotación en días */
  rotationInterval?: number;
  /** Última rotación */
  lastRotatedAt?: Date;
  /** HSM (Hardware Security Module) utilizado */
  hsmProvider?: string;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Estados de clave de encriptación
 * @enum {string}
 */
export enum KeyStatus {
  /** Clave activa */
  ACTIVE = 'active',
  /** Clave inactiva */
  INACTIVE = 'inactive',
  /** Clave comprometida */
  COMPROMISED = 'compromised',
  /** Clave expirada */
  EXPIRED = 'expired',
  /** Clave revocada */
  REVOKED = 'revoked',
  /** Clave en rotación */
  ROTATING = 'rotating'
}

/**
 * Propósitos de clave
 * @enum {string}
 */
export enum KeyPurpose {
  /** Encriptación de datos */
  DATA_ENCRYPTION = 'data_encryption',
  /** Encriptación de claves */
  KEY_ENCRYPTION = 'key_encryption',
  /** Firma digital */
  DIGITAL_SIGNATURE = 'digital_signature',
  /** Autenticación */
  AUTHENTICATION = 'authentication',
  /** Intercambio de claves */
  KEY_EXCHANGE = 'key_exchange'
}

// ==================== ENCRYPTED DATA ====================

/**
 * Datos encriptados con metadatos
 * @interface EncryptedData
 * @template T - Tipo de los datos originales
 */
export interface EncryptedData<T = any> {
  /** Datos encriptados en base64 */
  encryptedContent: string;
  /** Algoritmo utilizado */
  algorithm: EncryptionAlgorithm;
  /** ID de la clave utilizada */
  keyId: string;
  /** Vector de inicialización */
  iv: string;
  /** Tag de autenticación (para GCM) */
  authTag?: string;
  /** Hash de los datos originales */
  originalHash: string;
  /** Timestamp de encriptación */
  encryptedAt: Date;
  /** Tamaño original en bytes */
  originalSize: number;
  /** Nivel de encriptación aplicado */
  encryptionLevel: EncryptionLevel;
  /** Metadatos no encriptados */
  metadata?: {
    /** Tipo de datos */
    dataType?: string;
    /** Clasificación de seguridad */
    classification?: string;
    /** Requiere autorización especial */
    requiresSpecialAuth?: boolean;
    /** Fecha de expiración de los datos */
    dataExpiresAt?: Date;
  };
}

/**
 * Campo encriptado de base de datos
 * @interface EncryptedField
 */
export interface EncryptedField {
  /** Valor encriptado */
  value: string;
  /** Algoritmo utilizado */
  algorithm: EncryptionAlgorithm;
  /** ID de la clave */
  keyId: string;
  /** Vector de inicialización */
  iv: string;
  /** Tag de autenticación */
  authTag?: string;
  /** Versión del esquema de encriptación */
  schemaVersion: number;
}

// ==================== ENCRYPTION CONTEXT ====================

/**
 * Contexto de encriptación para auditoría
 * @interface EncryptionContext
 */
export interface EncryptionContext {
  /** ID del usuario que solicita */
  userId: string;
  /** ID del paciente (si aplica) */
  patientId?: PatientId;
  /** Propósito del acceso */
  purpose: string;
  /** Nivel de autorización */
  authorizationLevel: number;
  /** IP de origen */
  sourceIP: string;
  /** Timestamp de la solicitud */
  requestedAt: Date;
  /** Duración máxima de acceso */
  maxAccessDuration?: number;
  /** Restricciones adicionales */
  restrictions?: string[];
  /** Información de la sesión */
  sessionInfo?: {
    sessionId: string;
    deviceType: string;
    userAgent: string;
  };
}

// ==================== SECURE COMMUNICATION ====================

/**
 * Configuración de comunicación segura
 * @interface SecureCommunicationConfig
 */
export interface SecureCommunicationConfig {
  /** Protocolo utilizado */
  protocol: 'TLS_1_3' | 'TLS_1_2' | 'DTLS_1_2';
  /** Suite de cifrado */
  cipherSuite: string;
  /** Certificado del servidor */
  serverCertificate: {
    fingerprint: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
  };
  /** Verificación de certificado del cliente */
  clientCertRequired: boolean;
  /** Perfect Forward Secrecy habilitado */
  pfsEnabled: boolean;
  /** HSTS habilitado */
  hstsEnabled: boolean;
  /** Pinning de certificado */
  certificatePinning?: {
    pins: string[];
    includeSubdomains: boolean;
    maxAge: number;
  };
}

// ==================== DATA AT REST ====================

/**
 * Configuración de encriptación en reposo
 * @interface DataAtRestConfig
 */
export interface DataAtRestConfig {
  /** Encriptación de base de datos */
  databaseEncryption: {
    enabled: boolean;
    algorithm: EncryptionAlgorithm;
    keyRotationEnabled: boolean;
    transparentDataEncryption: boolean;
  };
  /** Encriptación de archivos */
  fileEncryption: {
    enabled: boolean;
    algorithm: EncryptionAlgorithm;
    compressionEnabled: boolean;
    deduplicationSafe: boolean;
  };
  /** Encriptación de backup */
  backupEncryption: {
    enabled: boolean;
    algorithm: EncryptionAlgorithm;
    keyEscrow: boolean;
    offSiteKeyStorage: boolean;
  };
  /** Encriptación de logs */
  logEncryption: {
    enabled: boolean;
    algorithm: EncryptionAlgorithm;
    retentionPeriod: number;
  };
}

// ==================== ZERO KNOWLEDGE TYPES ====================

/**
 * Prueba de conocimiento cero
 * @interface ZeroKnowledgeProof
 */
export interface ZeroKnowledgeProof {
  /** ID de la prueba */
  proofId: string;
  /** Algoritmo de ZKP utilizado */
  algorithm: 'zk-SNARKs' | 'zk-STARKs' | 'Bulletproofs';
  /** Declaración a probar */
  statement: string;
  /** Prueba generada */
  proof: string;
  /** Parámetros públicos */
  publicParameters: string;
  /** Verificador utilizado */
  verifier: string;
  /** Estado de verificación */
  verified: boolean;
  /** Timestamp de generación */
  generatedAt: Date;
  /** Timestamp de verificación */
  verifiedAt?: Date;
}

// ==================== HOMOMORPHIC ENCRYPTION ====================

/**
 * Encriptación homomórfica para cálculos sobre datos encriptados
 * @interface HomomorphicEncryption
 */
export interface HomomorphicEncryption {
  /** Esquema homomórfico utilizado */
  scheme: 'BGV' | 'BFV' | 'CKKS' | 'TFHE';
  /** Nivel de seguridad */
  securityLevel: number;
  /** Datos encriptados */
  encryptedData: string;
  /** Parámetros públicos */
  publicKey: string;
  /** Operaciones permitidas */
  allowedOperations: ('addition' | 'multiplication' | 'comparison')[];
  /** Ruido actual */
  noiseLevel: number;
  /** Capacidad de operaciones restante */
  remainingOperations: number;
}

// ==================== SCHEMAS ====================

/**
 * Schema para datos encriptados
 */
export const EncryptedDataSchema = z.object({
  encryptedContent: z.string(),
  algorithm: z.nativeEnum(EncryptionAlgorithm),
  keyId: z.string(),
  iv: z.string(),
  authTag: z.string().optional(),
  originalHash: z.string(),
  encryptedAt: z.date(),
  originalSize: z.number().positive(),
  encryptionLevel: z.nativeEnum(EncryptionLevel)
});

/**
 * Schema para clave de encriptación
 */
export const EncryptionKeySchema = z.object({
  keyId: z.string(),
  algorithm: z.nativeEnum(EncryptionAlgorithm),
  keyLength: z.number().positive(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  status: z.nativeEnum(KeyStatus),
  purpose: z.nativeEnum(KeyPurpose),
  accessLevel: z.number().min(0).max(10),
  autoRotation: z.boolean()
});