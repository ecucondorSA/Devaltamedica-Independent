/**
import { logger } from '@altamedica/shared/services/logger.service';

 * @file medical-hooks-alias.ts
 * Alias temporal para migrar de '@altamedica/medical-hooks' a '@altamedica/hooks'.
 * Provee un subconjunto estable re-exportado desde los módulos actuales.
 * Marcará deprecation en consola cuando se use en modo dev.
 */

/* eslint-disable no-console */
if (process.env.NODE_ENV !== 'production') {
  logger.warn('[DEPRECATION] Importar desde "@altamedica/medical-hooks" será removido. Usar "@altamedica/hooks" directamente.');
}

export {
  usePatients,
  // TODO: Restore when available
  // useAppointments as useAppointmentsLegacy,
  // useWebRTC as useWebRTCLegacy,
  // useVideoCall as useVideoCallLegacy,
} from './legacy';

// Exportar también los hooks médicos ya estables
export {
  useTelemedicine,
  useMedicalRecord,
  useMedicalRecords,
  usePrescription,
  usePrescriptions,
  useDoctorSchedule,
  useDoctorWorkflow,
  // TODO: Restore when available
  // useTelemedicineSession,
  useMedicalAI,
  useDiagnosticEngine,
} from './medical';
