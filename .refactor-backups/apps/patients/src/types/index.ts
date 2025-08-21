/**
 * Tipos centralizados para Patients App
 * Re-exporta desde @altamedica/types para usar fuente única de verdad
 */

// ✅ TIPOS MÉDICOS CENTRALIZADOS
export type {
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
  HealthMetrics,
  VitalSigns,
  LabResult,
  MedicalHistory,
  Medication
} from '@altamedica/types';

// ✅ TIPOS DE AUTENTICACIÓN
export type {
  AuthUser,
  UserRole,
  AuthContext,
  AuthToken
} from '@altamedica/types';

// ✅ TIPOS DE API
export type {
  APIResponse,
  PaginatedResponse
} from '@altamedica/types';

// ✅ Re-export tipos específicos del dashboard (ya correcto)
export * from './dashboard-types';