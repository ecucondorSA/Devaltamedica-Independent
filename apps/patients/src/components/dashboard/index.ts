// Componentes principales del dashboard
export { default as PatientDashboard } from './PatientDashboard';

// Monitores y seguimiento
export { default as VitalSignsMonitor } from './monitors/VitalSignsMonitor';
export { default as MedicationTracker } from './trackers/MedicationTracker';

// Citas y programación
export { default as UpcomingAppointments } from './appointments/UpcomingAppointments';

// Laboratorio y resultados
export { default as LabResultsTrends } from './lab/LabResultsTrends';

// Alertas y emergencias
export { default as MedicalAlerts } from './alerts/MedicalAlerts';
export { default as EmergencyPanel } from './emergency/EmergencyPanel';

// Acciones y comunicación
export { default as QuickActions } from './actions/QuickActions';
export { default as TeamCommunication } from './communication/TeamCommunication';

// Documentos
export { default as MedicalDocuments } from './documents/MedicalDocuments';

// ✅ Tipos de datos desde package central
export type {
  Patient,
  VitalSigns,
  Medication,
  Appointment,
  LabResult
} from '@altamedica/types';

// Utilidades
export {
  formatDate,
  calculateBMI
} from '../../utils/medical-helpers'; 