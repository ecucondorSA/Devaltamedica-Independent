import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { logger } from '@altamedica/shared';
// Configuración de encriptación para datos médicos PHI
interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
}

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
  salt?: string;
}

interface DecryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

// Configuración de encriptación AES-256-GCM (estándar HIPAA)
const encryptionConfig: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 12, // 96 bits recomendado para GCM
  tagLength: 16, // 128 bits
  saltLength: 16, // 128 bits suficiente
  iterations: 210000, // PBKDF2 iterations (NIST ~210k)
};

// Clave maestra de encriptación (en producción: usar AWS KMS, HashiCorp Vault, etc.)
const MASTER_KEY =
  process.env.ENCRYPTION_MASTER_KEY || 'CHANGE-THIS-IN-PRODUCTION-USE-PROPER-KEY-MANAGEMENT';

// Tipos de datos médicos que requieren encriptación
const PHI_DATA_TYPES = [
  'ssn',
  'medical_record_number',
  'patient_id',
  'diagnosis',
  'medication',
  'lab_result',
  'prescription',
  'medical_note',
  'genetic_info',
  'biometric_data',
  'insurance_info',
  'financial_info',
];

// Función para derivar clave de encriptación usando PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    encryptionConfig.iterations,
    encryptionConfig.keyLength,
    'sha256',
  );
}

// Función principal para encriptar datos PHI
export function encryptPHI(data: string, context?: string): EncryptionResult {
  try {
    if (!data || data.trim() === '') {
      throw new Error('No data provided for encryption');
    }

    // Generar salt único para cada encriptación
    const salt = crypto.randomBytes(encryptionConfig.saltLength);

    // Derivar clave de encriptación
    const key = deriveKey(MASTER_KEY, salt);

    // Generar IV único
    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    // Crear cipher correcto para GCM (sin authTagLength en Node.js 22+)
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv) as crypto.CipherGCM;
    const encryptedBuf = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    logger.info(`[ENCRYPTION] PHI data encrypted successfully (${context || 'unknown context'})`);

    return {
      encryptedData: encryptedBuf.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
    };
  } catch (error) {
    logger.error('Encryption error:', undefined, error);
    throw new Error(
      `Failed to encrypt PHI data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Función principal para desencriptar datos PHI
export function decryptPHI(encryptionResult: EncryptionResult, context?: string): DecryptionResult {
  try {
    if (!encryptionResult.encryptedData || !encryptionResult.iv || !encryptionResult.tag) {
      throw new Error('Invalid encryption data provided');
    }

    // Convertir hexadecimales a buffers
    const iv = Buffer.from(encryptionResult.iv, 'hex');
    const tag = Buffer.from(encryptionResult.tag, 'hex');
    const salt = encryptionResult.salt
      ? Buffer.from(encryptionResult.salt, 'hex')
      : crypto.randomBytes(encryptionConfig.saltLength);

    // Derivar clave de desencriptación
    const key = deriveKey(MASTER_KEY, salt);

    // Crear decipher correcto para GCM (sin authTagLength en Node.js 22+)
    const decipher = crypto.createDecipheriv(encryptionConfig.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptionResult.encryptedData, 'hex')),
      decipher.final(),
    ]).toString('utf8');

    logger.info(`[DECRYPTION] PHI data decrypted successfully (${context || 'unknown context'})`);

    return {
      success: true,
      data: decrypted,
    };
  } catch (error) {
    logger.error('Decryption error:', undefined, error);
    return {
      success: false,
      error: `Failed to decrypt PHI data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Función para encriptar objeto completo de paciente
export function encryptPatientData(patientData: any): any {
  const encryptedPatient = { ...patientData };

  // Campos que requieren encriptación
  const fieldsToEncrypt = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'ssn',
    'medicalRecordNumber',
    'address',
    'emergencyContact',
    'insurance',
  ];

  fieldsToEncrypt.forEach((field) => {
    if (encryptedPatient[field]) {
      try {
        if (typeof encryptedPatient[field] === 'object') {
          encryptedPatient[field] = encryptPHI(
            JSON.stringify(encryptedPatient[field]),
            `patient.${field}`,
          );
        } else {
          encryptedPatient[field] = encryptPHI(
            encryptedPatient[field].toString(),
            `patient.${field}`,
          );
        }
      } catch (error) {
        logger.error(`Error encrypting field ${field}:`, undefined, error);
      }
    }
  });

  return encryptedPatient;
}

// Función para desencriptar objeto completo de paciente
export function decryptPatientData(encryptedPatientData: any): any {
  const decryptedPatient = { ...encryptedPatientData };

  const fieldsToDecrypt = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'ssn',
    'medicalRecordNumber',
    'address',
    'emergencyContact',
    'insurance',
  ];

  fieldsToDecrypt.forEach((field) => {
    if (
      decryptedPatient[field] &&
      typeof decryptedPatient[field] === 'object' &&
      decryptedPatient[field].encryptedData
    ) {
      try {
        const decryptionResult = decryptPHI(decryptedPatient[field], `patient.${field}`);
        if (decryptionResult.success) {
          // Intentar parsear JSON si era un objeto
          try {
            decryptedPatient[field] = JSON.parse(decryptionResult.data!);
          } catch {
            decryptedPatient[field] = decryptionResult.data;
          }
        } else {
          logger.error(`Failed to decrypt field ${field}:`, decryptionResult.error);
          decryptedPatient[field] = '[DECRYPTION_FAILED]';
        }
      } catch (error) {
        logger.error(`Error decrypting field ${field}:`, undefined, error);
        decryptedPatient[field] = '[DECRYPTION_ERROR]';
      }
    }
  });

  return decryptedPatient;
}

// Función para encriptar registros médicos
export function encryptMedicalRecord(recordData: any): any {
  const encryptedRecord = { ...recordData };

  // Campos médicos sensibles
  const medicalFields = [
    'diagnosis',
    'symptoms',
    'medications',
    'vitalSigns',
    'description',
    'notes',
    'labResults',
    'prescriptions',
    'attachments',
  ];

  medicalFields.forEach((field) => {
    if (encryptedRecord[field]) {
      try {
        const dataToEncrypt =
          typeof encryptedRecord[field] === 'object'
            ? JSON.stringify(encryptedRecord[field])
            : encryptedRecord[field].toString();

        encryptedRecord[field] = encryptPHI(dataToEncrypt, `medical_record.${field}`);
      } catch (error) {
        logger.error(`Error encrypting medical field ${field}:`, undefined, error);
      }
    }
  });

  return encryptedRecord;
}

// Función para desencriptar registros médicos
export function decryptMedicalRecord(encryptedRecordData: any): any {
  const decryptedRecord = { ...encryptedRecordData };

  const medicalFields = [
    'diagnosis',
    'symptoms',
    'medications',
    'vitalSigns',
    'description',
    'notes',
    'labResults',
    'prescriptions',
    'attachments',
  ];

  medicalFields.forEach((field) => {
    if (
      decryptedRecord[field] &&
      typeof decryptedRecord[field] === 'object' &&
      decryptedRecord[field].encryptedData
    ) {
      try {
        const decryptionResult = decryptPHI(decryptedRecord[field], `medical_record.${field}`);
        if (decryptionResult.success) {
          try {
            decryptedRecord[field] = JSON.parse(decryptionResult.data!);
          } catch {
            decryptedRecord[field] = decryptionResult.data;
          }
        } else {
          logger.error(`Failed to decrypt medical field ${field}:`, decryptionResult.error);
          decryptedRecord[field] = '[DECRYPTION_FAILED]';
        }
      } catch (error) {
        logger.error(`Error decrypting medical field ${field}:`, undefined, error);
        decryptedRecord[field] = '[DECRYPTION_ERROR]';
      }
    }
  });

  return decryptedRecord;
}

// Función para hashear contraseñas de forma segura
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Aumentado para mayor seguridad médica
  return await bcrypt.hash(password, saltRounds);
}

// Función para verificar contraseñas
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Función para generar tokens seguros
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Función para generar ID únicos seguros para pacientes
export function generateSecurePatientId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `PAT_${timestamp}_${randomBytes}`.toUpperCase();
}

// Función para generar ID únicos seguros para médicos
export function generateSecureDoctorId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `DOC_${timestamp}_${randomBytes}`.toUpperCase();
}

// Función para generar ID seguros para citas médicas
export function generateSecureAppointmentId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `APT_${timestamp}_${randomBytes}`.toUpperCase();
}

// Función para detectar si un campo contiene PHI
export function isPHIData(fieldName: string, value: any): boolean {
  if (!value) return false;

  const fieldNameLower = fieldName.toLowerCase();

  // Verificar si el nombre del campo indica PHI
  const containsPHIKeyword = PHI_DATA_TYPES.some((type) =>
    fieldNameLower.includes(type.replace('_', '')),
  );

  if (containsPHIKeyword) return true;

  // Verificar patrones comunes de PHI en el valor
  const valueStr = value.toString();

  // SSN pattern
  if (/^\d{3}-?\d{2}-?\d{4}$/.test(valueStr)) return true;

  // Medical record number pattern
  if (/^(MRN|MR|MED)\d+$/i.test(valueStr)) return true;

  // Fecha de nacimiento pattern
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueStr) && fieldNameLower.includes('birth')) return true;

  return false;
}

// Función para auditar acceso a datos encriptados
export async function auditEncryptionAccess(
  action: 'encrypt' | 'decrypt',
  dataType: string,
  userId: string,
  success: boolean,
): Promise<void> {
  try {
    const { auditLog } = await import('./audit');

    await auditLog({
      action: `phi_${action}`,
      userId,
      resource: 'encryption',
      details: {
        dataType,
        algorithm: encryptionConfig.algorithm,
        timestamp: new Date().toISOString(),
      },
      success,
      category: 'medical',
      severity: 'high',
      containsPHI: true,
    });
  } catch (error) {
    logger.error('Failed to audit encryption access:', undefined, error);
  }
}

// Función para rotar claves de encriptación (para producción)
export function rotateEncryptionKey(): string {
  logger.warn(
    '🔄 Key rotation should be implemented with proper key management system (AWS KMS, HashiCorp Vault, etc.)',
  );

  // En producción: implementar rotación real con sistema de gestión de claves
  const newKey = crypto.randomBytes(32).toString('hex');

  logger.info('🔑 New encryption key generated (implement proper storage)');
  return newKey;
}

// Función para verificar integridad de configuración de encriptación
export function verifyEncryptionConfig(): boolean {
  try {
    // Probar creación de cipher con parámetros correctos
    const salt = crypto.randomBytes(encryptionConfig.saltLength);
    const key = deriveKey('test-key', salt);
    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    const testCipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv) as crypto.CipherGCM;
    testCipher.update('test');
    testCipher.final();

    // Verificar longitudes de configuración
    if (encryptionConfig.keyLength < 32) {
      logger.error('⚠️  Key length too short for medical data');
      return false;
    }

    if (encryptionConfig.iterations < 100000) {
      logger.error('⚠️  PBKDF2 iterations too low for medical data');
      return false;
    }

    // Verificar clave maestra
    if (MASTER_KEY === 'CHANGE-THIS-IN-PRODUCTION-USE-PROPER-KEY-MANAGEMENT') {
      logger.warn('⚠️  Using default master key - CHANGE IN PRODUCTION!');
      return false;
    }

    logger.info('✅ Encryption configuration verified');
    return true;
  } catch (error) {
    logger.error('❌ Encryption configuration verification failed:', undefined, error);
    return false;
  }
}

// Exportar configuración para monitoreo
export function getEncryptionStatus() {
  return {
    algorithm: encryptionConfig.algorithm,
    keyLength: encryptionConfig.keyLength,
    configValid: verifyEncryptionConfig(),
    masterKeyConfigured: MASTER_KEY !== 'CHANGE-THIS-IN-PRODUCTION-USE-PROPER-KEY-MANAGEMENT',
  };
}

export default {
  encryptPHI,
  decryptPHI,
  encryptPatientData,
  decryptPatientData,
  encryptMedicalRecord,
  decryptMedicalRecord,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSecurePatientId,
  generateSecureDoctorId,
  generateSecureAppointmentId,
  isPHIData,
  auditEncryptionAccess,
  rotateEncryptionKey,
  verifyEncryptionConfig,
  getEncryptionStatus,
};
