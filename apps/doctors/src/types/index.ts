/**
 * Tipos centralizados para Doctors App
 * Implementa arquitectura 3-capas: Simple UI → Adapters → Complex Medical
 */

// ==================== TIPOS COMPLEJOS DE PACKAGES ====================
// Re-exporta desde @altamedica/types para usar fuente única de verdad

/*
export type {
  PatientProfile, // Tipo complejo HIPAA-compliant  
  Doctor,
  DoctorProfile,
  Appointment,
  MedicalRecord,
  Prescription,
  HealthMetrics,
  VitalSigns,
  LabResult,
  MedicalHistory,
  Medication,
  TelemedicineSession
} from '@altamedica/types';
*/

export type PatientProfile = any;
export type Doctor = any;
export type DoctorProfile = any;
export type Appointment = any;
export type MedicalRecord = any;
export type Prescription = any;
export type HealthMetrics = any;
export type VitalSigns = any;
export type LabResult = any;
export type MedicalHistory = any;
export type Medication = any;
export type TelemedicineSession = any;

// ==================== TIPOS SIMPLES PARA UI ====================
// Para componentes React que solo necesitan propiedades básicas

export interface SimpleDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface SimplePatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender?: string;
  phoneNumber?: string;
  status?: 'active' | 'inactive';
  // Propiedades adicionales requeridas por DoctorPatientsList
  lastVisit?: string;
  age?: number;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface SimpleAppointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  duration?: number;
}

export interface SimpleVitalSigns {
  temperature: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturation?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  timestamp: Date;
}

export interface SimplePrescription {
  id: string;
  patientId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: 'active' | 'completed' | 'cancelled';
  prescribedDate: string;
}

// ==================== ADAPTERS AVANZADOS ====================
// Para convertir entre tipos complejos y simples

export const toSimpleDoctor = (complexDoctor: any): SimpleDoctor => ({
  id: complexDoctor.id,
  firstName: complexDoctor.firstName || complexDoctor.personalInfo?.firstName,
  lastName: complexDoctor.lastName || complexDoctor.personalInfo?.lastName,
  email: complexDoctor.email || complexDoctor.contactInfo?.email,
  specialization: complexDoctor.specialization || complexDoctor.medicalInfo?.specialization || 'General Practice',
  licenseNumber: complexDoctor.licenseNumber || complexDoctor.credentials?.licenseNumber || 'N/A',
  status: complexDoctor.status || 'active'
});

export const toSimplePatient = (complexPatient: any): SimplePatient => ({
  id: complexPatient.id,
  firstName: complexPatient.firstName || complexPatient.personalInfo?.firstName,
  lastName: complexPatient.lastName || complexPatient.personalInfo?.lastName,
  email: complexPatient.email || complexPatient.contactInfo?.email,
  dateOfBirth: complexPatient.dateOfBirth || complexPatient.personalInfo?.dateOfBirth,
  gender: complexPatient.gender || complexPatient.personalInfo?.gender,
  phoneNumber: complexPatient.phoneNumber || complexPatient.contactInfo?.phoneNumber,
  status: complexPatient.status || 'active',
  // Mapeo de nuevas propiedades
  lastVisit: complexPatient.lastVisit || complexPatient.medicalHistory?.lastVisit,
  age: complexPatient.age || (complexPatient.personalInfo?.dateOfBirth ? new Date().getFullYear() - new Date(complexPatient.personalInfo.dateOfBirth).getFullYear() : undefined),
  bloodType: complexPatient.bloodType || complexPatient.medicalInfo?.bloodType,
  allergies: complexPatient.allergies || complexPatient.medicalInfo?.allergies,
  emergencyContact: complexPatient.emergencyContact || complexPatient.contactInfo?.emergencyContact
});

export const toSimpleAppointment = (complexAppointment: any): SimpleAppointment => ({
  id: complexAppointment.id,
  patientId: complexAppointment.patientId || complexAppointment.patient?.id,
  patientName: complexAppointment.patientName || 
    `${complexAppointment.patient?.firstName || ''} ${complexAppointment.patient?.lastName || ''}`.trim() || 'Unknown Patient',
  doctorId: complexAppointment.doctorId || complexAppointment.doctor?.id,
  date: complexAppointment.date || complexAppointment.scheduledDate || complexAppointment.appointmentDate,
  time: complexAppointment.time || complexAppointment.scheduledTime || complexAppointment.appointmentTime,
  type: complexAppointment.type || complexAppointment.appointmentType || 'consultation',
  status: complexAppointment.status || 'scheduled',
  duration: complexAppointment.duration || complexAppointment.estimatedDuration || 30
});

export const toSimplePrescription = (complexPrescription: any): SimplePrescription => ({
  id: complexPrescription.id,
  patientId: complexPrescription.patientId || complexPrescription.patient?.id,
  patientName: complexPrescription.patientName || 
    `${complexPrescription.patient?.firstName || ''} ${complexPrescription.patient?.lastName || ''}`.trim() || 'Unknown Patient',
  medicationName: complexPrescription.medicationName || complexPrescription.medication?.name || 'Unknown Medication',
  dosage: complexPrescription.dosage || complexPrescription.medication?.dosage || 'As directed',
  frequency: complexPrescription.frequency || complexPrescription.medication?.frequency || 'As needed',
  duration: complexPrescription.duration || complexPrescription.medication?.duration || '30 days',
  status: complexPrescription.status || 'active',
  prescribedDate: complexPrescription.prescribedDate || complexPrescription.createdAt || new Date().toISOString()
});

// Adapter para VitalSigns compatible con componentes legacy
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
  oxygenSaturation: simpleVitals.oxygenSaturation ? {
    value: simpleVitals.oxygenSaturation,
    unit: '%',
    status: simpleVitals.oxygenSaturation < 95 ? 'low' : 'normal'
  } : undefined,
  respiratoryRate: simpleVitals.respiratoryRate ? {
    value: simpleVitals.respiratoryRate,
    unit: 'bpm',
    status: simpleVitals.respiratoryRate > 20 ? 'high' : simpleVitals.respiratoryRate < 12 ? 'low' : 'normal'
  } : undefined,
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

// ==================== LEGACY COMPATIBILITY ====================
// Mantener nombres antiguos mientras migramos
// export type Patient = SimplePatient;
// export type Doctor = SimpleDoctor;
// export type Appointment = SimpleAppointment;
// export type Prescription = SimplePrescription;

// ==================== TIPOS DE AUTENTICACIÓN ====================
/*
export type {
  AuthUser,
  UserRole,
  AuthContext,
  AuthToken
} from '@altamedica/types';
*/

export type AuthUser = any;
export type UserRole = any;
export type AuthContext = any;
export type AuthToken = any;

// ==================== TIPOS DE API ====================
/*
export type {
  APIResponse,
  PaginatedResponse
} from '@altamedica/types';
*/

export type APIResponse = any;
export type PaginatedResponse = any;