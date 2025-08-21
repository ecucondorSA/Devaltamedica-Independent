/**
 * @fileoverview Branded types para mayor seguridad de tipos
 * @module @altamedica/types/core/branded
 * @description Tipos nominales que previenen errores de asignación incorrecta
 */

/**
 * Tipo marca para crear tipos nominales
 * @internal
 */
declare const brand: unique symbol;

/**
 * Tipo base para crear branded types
 * @type Brand
 * @template T - Tipo base
 * @template B - Marca única
 */
export type Brand<T, B> = T & { [brand]: B };

// ==================== ID TYPES ====================

/**
 * ID único de paciente
 * @type PatientId
 * @description Previene asignación accidental de otros IDs
 */
export type PatientId = Brand<string, 'PatientId'>;

/**
 * ID único de doctor
 * @type DoctorId
 * @description Previene asignación accidental de otros IDs
 */
export type DoctorId = Brand<string, 'DoctorId'>;

/**
 * ID único de cita médica
 * @type AppointmentId
 * @description Previene asignación accidental de otros IDs
 */
export type AppointmentId = Brand<string, 'AppointmentId'>;

/**
 * ID único de compañía
 * @type CompanyId
 * @description Previene asignación accidental de otros IDs
 */
export type CompanyId = Brand<string, 'CompanyId'>;

/**
 * ID único de historia clínica
 * @type MedicalRecordId
 * @description Previene asignación accidental de otros IDs
 */
export type MedicalRecordId = Brand<string, 'MedicalRecordId'>;

/**
 * ID único de prescripción
 * @type PrescriptionId
 * @description Previene asignación accidental de otros IDs
 */
export type PrescriptionId = Brand<string, 'PrescriptionId'>;

/**
 * ID único de usuario
 * @type UserId
 * @description Previene asignación accidental de otros IDs
 */
export type UserId = Brand<string, 'UserId'>;

// ==================== SENSITIVE DATA TYPES ====================

/**
 * Número de documento encriptado
 * @type EncryptedDNI
 * @description DNI/Documento encriptado según HIPAA
 */
export type EncryptedDNI = Brand<string, 'EncryptedDNI'>;

/**
 * Número de seguro social encriptado
 * @type EncryptedSSN
 * @description SSN encriptado según HIPAA
 */
export type EncryptedSSN = Brand<string, 'EncryptedSSN'>;

/**
 * Información médica protegida (PHI)
 * @type ProtectedHealthInfo
 * @description Datos que requieren encriptación HIPAA
 */
export type ProtectedHealthInfo = Brand<string, 'PHI'>;

/**
 * Token de autenticación JWT
 * @type AuthToken
 * @description Token JWT para autenticación
 */
export type AuthToken = Brand<string, 'AuthToken'>;

/**
 * Token de refresh JWT
 * @type RefreshToken
 * @description Token para renovar autenticación
 */
export type RefreshToken = Brand<string, 'RefreshToken'>;

// ==================== MEDICAL CODES ====================

/**
 * Código ICD-10
 * @type ICD10Code
 * @description Clasificación Internacional de Enfermedades
 */
export type ICD10Code = Brand<string, 'ICD10'>;

/**
 * Código CPT
 * @type CPTCode
 * @description Current Procedural Terminology
 */
export type CPTCode = Brand<string, 'CPT'>;

/**
 * Código LOINC
 * @type LOINCCode
 * @description Logical Observation Identifiers Names and Codes
 */
export type LOINCCode = Brand<string, 'LOINC'>;

/**
 * Código de medicamento NDC
 * @type NDCCode
 * @description National Drug Code
 */
export type NDCCode = Brand<string, 'NDC'>;

// ==================== HELPER FUNCTIONS ====================

/**
 * Crea un PatientId validado
 * @param id - String ID a convertir
 * @returns PatientId branded
 * @throws Error si el ID es inválido
 */
export function createPatientId(id: string): PatientId {
  if (!id || typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid PatientId');
  }
  return id as PatientId;
}

/**
 * Crea un DoctorId validado
 * @param id - String ID a convertir
 * @returns DoctorId branded
 * @throws Error si el ID es inválido
 */
export function createDoctorId(id: string): DoctorId {
  if (!id || typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid DoctorId');
  }
  return id as DoctorId;
}

/**
 * Crea un AppointmentId validado
 * @param id - String ID a convertir
 * @returns AppointmentId branded
 * @throws Error si el ID es inválido
 */
export function createAppointmentId(id: string): AppointmentId {
  if (!id || typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid AppointmentId');
  }
  return id as AppointmentId;
}

/**
 * Crea un AuthToken validado
 * @param token - String token a convertir
 * @returns AuthToken branded
 * @throws Error si el token es inválido
 */
export function createAuthToken(token: string): AuthToken {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('Invalid JWT token format');
  }
  return token as AuthToken;
}

/**
 * Crea un ICD10Code validado
 * @param code - Código ICD-10 a validar
 * @returns ICD10Code branded
 * @throws Error si el código es inválido
 */
export function createICD10Code(code: string): ICD10Code {
  // Validación básica de formato ICD-10
  const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
  if (!icd10Pattern.test(code)) {
    throw new Error('Invalid ICD-10 code format');
  }
  return code as ICD10Code;
}

/**
 * Type guard para verificar si un valor es un PatientId
 * @param value - Valor a verificar
 * @returns true si es PatientId
 */
export function isPatientId(value: unknown): value is PatientId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard para verificar si un valor es un DoctorId
 * @param value - Valor a verificar
 * @returns true si es DoctorId
 */
export function isDoctorId(value: unknown): value is DoctorId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard para verificar si un valor es información protegida
 * @param value - Valor a verificar
 * @returns true si es PHI
 */
export function isProtectedHealthInfo(value: unknown): value is ProtectedHealthInfo {
  return typeof value === 'string' && value.startsWith('encrypted:');
}