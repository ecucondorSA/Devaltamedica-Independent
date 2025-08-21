// 👥 Re-export del hook centralizado usePatients
// Este archivo mantiene compatibilidad durante la migración
export {
  usePatients,
  usePatientsSearch
} from '@altamedica/medical-hooks';
export type {
  Patient,
  UseApiOptions
} from '@altamedica/medical-hooks';