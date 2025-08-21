/**
 * 📋 MEDICAL HISTORY HOOK - ALTAMEDICA (DEPRECATED)
 * 
 * ⚠️ DEPRECATION NOTICE:
 * Este hook ha sido consolidado en useMedicalHistoryUnified.ts
 * 
 * MIGRACIONES COMPLETADAS:
 * - ✅ useMedicalRecords.ts (IA médica + dashboard) → useMedicalHistoryUnified.ts
 * - ✅ usePatientHistory.ts (TanStack Query) → useMedicalHistoryUnified.ts  
 * - ✅ useMedicalHistory.ts (API real) → useMedicalHistoryUnified.ts
 * 
 * NUEVA UBICACIÓN: ./useMedicalHistoryUnified.ts
 */

import { 
  useMedicalHistoryUnified, 
  useMedicalRecord as useMedicalRecordUnified 
} from './useMedicalHistoryUnified';

// Re-export the unified hooks with backward compatibility
export const useMedicalHistory = useMedicalHistoryUnified;
export const useMedicalRecord = useMedicalRecordUnified;

// Default export for backward compatibility
export default {
  useMedicalHistory: useMedicalHistoryUnified,
  useMedicalRecord: useMedicalRecordUnified,
};