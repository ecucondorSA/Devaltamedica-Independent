/**
 * @fileoverview Punto de entrada principal para @altamedica/hooks
 * @module @altamedica/hooks
 * @description Biblioteca centralizada de React hooks para la plataforma AltaMedica
 * @author AltaMedica Platform Team
 * @version 1.0.0
 */

// ==========================================
// 🏥 HOOKS MÉDICOS (evitar duplicados)
// ==========================================
export {
  useDiagnosticEngine,
  useDoctorSchedule,
  useDoctorWorkflow,
  useMedicalAI,
  useMedicalRecord,
  useMedicalRecords,
  useWebRTC as useMedicalWebRTC,
  usePatientDashboard,
  usePatientPortal,
  usePrescription,
  usePrescriptions,
  useTelemedicine,
  useVideoCall,
  useVitalSigns,
  useVitalSignsMonitoring,
} from './medical';

// Accesos directos frecuentes
export { usePatientData } from './medical';

// ==========================================
// 🔐 HOOKS DE AUTENTICACIÓN
// ==========================================
export * from './auth';

// ==========================================
// 🌐 HOOKS DE API (evitar re-export de QUERY_KEYS duplicado)
// ==========================================
export { default as useAltamedicaAPI } from './useAltamedicaAPI';

// ==========================================
// 🎨 HOOKS DE UI/UX
// ==========================================
export * from './ui';

// ==========================================
// ⚡ HOOKS DE UTILIDADES
// ==========================================
export * from './utils';

// ==========================================
// 📊 HOOKS DE PERFORMANCE
// ==========================================
export * from './performance';

// ==========================================
// 🔄 HOOKS DE TIEMPO REAL (rename para evitar conflicto con useWebRTC médico)
// ==========================================
export { useNotifications, useRealTimeUpdates, useWebRTC, useWebSocket } from './realtime';
export * from './realtime/constants';
export * from './realtime/types';

// ==========================================
// 🧩 HOOKS COMPUESTOS
// ==========================================
export {
  useAdminDashboard,
  usePatientDashboard as useComposedPatientDashboard,
  useDoctorDashboard,
  useMedicalDashboard,
} from './composed/useMedicalDashboard';
export { useTelemedicineSession } from './composed/useTelemedicineSession';

// ==========================================
// 📝 HOOKS DE FORMULARIOS
// ==========================================
export * from './forms';

// ==========================================
// 🔌 PROVIDERS
// ==========================================
export * from './providers';

// ==========================================
// 🔎 HOOKS DE AUDITORÍA
// ==========================================
export * from './audit/useAuditLogs';

// ==========================================
// 🕰️ LEGACY (Compatibilidad temporal pacientes)
// ==========================================
export * from './legacy';
