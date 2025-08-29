/**
 * Tipos centralizados para Patients App
 * Re-exporta desde @altamedica/types para usar fuente única de verdad
 */

// ✅ TIPOS MÉDICOS CENTRALIZADOS
export type {
  PatientProfile, // Tipo complejo HIPAA-compliant
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

// ==================== TIPOS SIMPLES PARA UI ====================
// Para componentes React que solo necesitan propiedades básicas

export interface SimplePatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender?: string;
  phoneNumber?: string;
  status?: 'active' | 'inactive';
}

export interface SimpleAppointment {
  id: string;
  patientId: string;
  doctorName?: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface SimpleVitalSigns {
  temperature: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  weight?: number;
  height?: number;
  timestamp: Date;
}

// ==================== ADAPTERS AVANZADOS ====================
// Para componentes legacy que esperan estructura compleja

export const toCompatibleVitalSigns = (simpleVitals: SimpleVitalSigns) => ({
  temperature: {
    value: simpleVitals.temperature,
    unit: '°C',
    status: simpleVitals.temperature > 37.5 ? 'high' : simpleVitals.temperature < 36.1 ? 'low' : 'normal'
  },
  heartRate: {
    value: simpleVitals.heartRate,
    unit: 'bpm',
    status: simpleVitals.heartRate > 100 ? 'high' : simpleVitals.heartRate < 60 ? 'low' : 'normal'
  },
  bloodPressure: {
    systolic: { value: simpleVitals.bloodPressure.systolic, unit: 'mmHg' },
    diastolic: { value: simpleVitals.bloodPressure.diastolic, unit: 'mmHg' },
    status: simpleVitals.bloodPressure.systolic > 140 ? 'high' : 'normal'
  },
  weight: simpleVitals.weight ? {
    value: simpleVitals.weight,
    unit: 'kg'
  } : undefined,
  height: simpleVitals.height ? {
    value: simpleVitals.height,
    unit: 'cm'  
  } : undefined,
  timestamp: simpleVitals.timestamp,
  overall: 'stable' as const
});

// ==================== ADAPTERS ====================
// Para convertir entre tipos complejos y simples

export const toSimplePatient = (complexPatient: any): SimplePatient => ({
  id: complexPatient.id,
  firstName: complexPatient.firstName || complexPatient.personalInfo?.firstName,
  lastName: complexPatient.lastName || complexPatient.personalInfo?.lastName,
  email: complexPatient.email || complexPatient.contactInfo?.email,
  dateOfBirth: complexPatient.dateOfBirth || complexPatient.personalInfo?.dateOfBirth,
  gender: complexPatient.gender || complexPatient.personalInfo?.gender,
  phoneNumber: complexPatient.phoneNumber || complexPatient.contactInfo?.phoneNumber,
  status: complexPatient.status || 'active'
});

// ==================== LEGACY COMPATIBILITY ====================
// Mantener nombres antiguos mientras migramos
export type Patient = SimplePatient;

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