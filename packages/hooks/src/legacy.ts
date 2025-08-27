/**
// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};

 * @file legacy.ts
 * 🚑 Capa de compatibilidad temporal para nombres de hooks legacy usados en apps (doctors/patients)
 * Objetivo: reducir errores de TypeScript mientras migramos definitivamente a @altamedica/api-client.
 *
 * Estrategia:
 * 1. Intentar re-exportar los hooks reales desde '@altamedica/api-client/hooks'.
 * 2. Si el import falla (en tiempo de build de tipo por ausencia temporal), proveer stubs NO funcionales
 *    que advierten en consola en modo dev.
 * 3. Marcar todos como @deprecated y guiar a nueva ruta.
 *
 * NOTA: Mantener este archivo ligero y eliminarlo cuando finalice la consolidación médica (Fase 2).
 */

// Tipado laxo para evitar romper compilación si api-client aún no construye
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

interface LegacyHookShimOptions {
  name: string;
  target?: AnyFn;
  replacement?: string;
}

function createShim<T extends AnyFn>({ name, target, replacement }: LegacyHookShimOptions): T {
  if (target) return target as T;
  // Stub que avisa sólo en desarrollo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shim: AnyFn = (..._args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      logger.warn(`[@altamedica/hooks][legacy] Hook ${name} no disponible aún. Usa ${replacement || 'api-client/hooks'} cuando esté listo.`);
    }
    return {};
  };
  return shim as T;
}

// Intentar cargar implementación real
let real: Record<string, AnyFn> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  real = require('@altamedica/api-client');
} catch (_e) {
  real = null; // api-client aún no disponible o build fallido
}

/** @deprecated Usar usePatients (api-client) */
export const usePatients: AnyFn = createShim({ name: 'usePatients', target: real?.usePatients });
/** @deprecated Usar usePatient (api-client) */
export const usePatient: AnyFn = createShim({ name: 'usePatient', target: real?.usePatient });
/** @deprecated Usar useCreatePatient (api-client) */
export const useCreatePatient: AnyFn = createShim({ name: 'useCreatePatient', target: real?.useCreatePatient });
/** @deprecated Usar useUpdatePatient (api-client) */
export const useUpdatePatient: AnyFn = createShim({ name: 'useUpdatePatient', target: real?.useUpdatePatient });
/** @deprecated Usar useDeletePatient (api-client) */
export const useDeletePatient: AnyFn = createShim({ name: 'useDeletePatient', target: real?.useDeletePatient });
/** @deprecated Usar usePatientAppointments (api-client) */
export const usePatientAppointments: AnyFn = createShim({ name: 'usePatientAppointments', target: real?.usePatientAppointments });
/** @deprecated Usar usePatientMedicalHistory (api-client) */
export const usePatientMedicalHistory: AnyFn = createShim({ name: 'usePatientMedicalHistory', target: real?.usePatientMedicalHistory });
/** @deprecated Usar usePatientPrescriptions (api-client) */
export const usePatientPrescriptions: AnyFn = createShim({ name: 'usePatientPrescriptions', target: real?.usePatientPrescriptions });
/** @deprecated Usar usePatientDocuments (api-client) */
export const usePatientDocuments: AnyFn = createShim({ name: 'usePatientDocuments', target: real?.usePatientDocuments });
/** @deprecated Usar useUploadPatientDocument (api-client) */
export const useUploadPatientDocument: AnyFn = createShim({ name: 'useUploadPatientDocument', target: real?.useUploadPatientDocument });

// Export types laxo para no bloquear build; la consolidación moverá tipos definitivos a @altamedica/types
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Patient {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatientPrescription {}

export const __LEGACY_PATIENT_HOOKS__ = {
  ready: !!real,
  source: real ? '@altamedica/api-client/hooks' : 'shim',
};
