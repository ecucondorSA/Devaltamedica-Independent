/**
 * Roles canónicos del sistema AltaMedica
 * Unificación y reducción de duplicados. SOLO se mantienen roles realmente operativos.
 * Si en el futuro se requiere granularidad adicional, extender aquí conservando compatibilidad.
 */

import { z } from 'zod';

// Enum único de roles activos.
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  COMPANY = 'company'
}

// Zod schema para validación directa
export const UserRoleSchema = z.nativeEnum(UserRole);
export type UserRoleString = `${UserRole}`;

// Alias legacy -> valor canónico
export const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  // Variantes de company
  'company-admin': UserRole.COMPANY,
  'company_admin': UserRole.COMPANY,
  'COMPANY_ADMIN': UserRole.COMPANY,
  'COMPANY': UserRole.COMPANY,
  'company-user': UserRole.COMPANY,
  'companyUser': UserRole.COMPANY,

  // Variantes de admin/platform
  'platform-admin': UserRole.ADMIN,
  'PLATFORM_ADMIN': UserRole.ADMIN,
  'ADMIN': UserRole.ADMIN,
  'super_admin': UserRole.ADMIN,
  'super-admin': UserRole.ADMIN,

  // Otras variantes médicas específicas mapeadas al rol DOCTOR
  'medical_director': UserRole.DOCTOR,
  'medical-director': UserRole.DOCTOR,
  'specialist': UserRole.DOCTOR,
  'nurse': UserRole.DOCTOR,
  'staff': UserRole.ADMIN, // staff se colapsa a admin si aparece
  'guest': UserRole.PATIENT // guest lo tratamos como patient mínimo acceso
};

/**
 * Normaliza cualquier string de rol (legacy / variantes) al valor canónico.
 * Si no se reconoce, opcionalmente retorna undefined o GUEST.
 */
export function normalizeUserRole(input: string | null | undefined, fallback: UserRole | undefined = UserRole.PATIENT): UserRole | undefined {
  if (!input) return fallback;
  // Igualar case y trim
  const key = input.trim();
  if (UserRoleSchema.safeParse(key).success) {
    return key as UserRole;
  }
  const lower = key.toLowerCase();
  if (LEGACY_ROLE_ALIASES[lower]) return LEGACY_ROLE_ALIASES[lower];
  if (LEGACY_ROLE_ALIASES[key]) return LEGACY_ROLE_ALIASES[key];
  return fallback; // fallback puede ser undefined si se desea forzar validación externa
}

/** Helpers semánticos básicos **/
export const isAdminRole = (r: UserRole | null | undefined) => r === UserRole.ADMIN;
export const isDoctorRole = (r: UserRole | null | undefined) => r === UserRole.DOCTOR;
export const isPatientRole = (r: UserRole | null | undefined) => r === UserRole.PATIENT;
export const isCompanyRole = (r: UserRole | null | undefined) => r === UserRole.COMPANY;
export const CLINICAL_ROLES: ReadonlySet<UserRole> = new Set([UserRole.DOCTOR]);
export const BUSINESS_ROLES: ReadonlySet<UserRole> = new Set([UserRole.COMPANY]);
export function isClinicalRole(r: UserRole | null | undefined) { return !!r && CLINICAL_ROLES.has(r); }
export function isBusinessRole(r: UserRole | null | undefined) { return !!r && BUSINESS_ROLES.has(r); }

// Export agrupado por conveniencia.
export const Roles = {
  ...UserRole,
  normalize: normalizeUserRole,
  isAdminRole,
  isDoctorRole,
  isPatientRole,
  isCompanyRole,
  isClinicalRole,
  isBusinessRole
};

export default UserRole;
