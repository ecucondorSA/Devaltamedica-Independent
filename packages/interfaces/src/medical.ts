/**
 * Medical domain interfaces
 * Core interfaces for medical data and operations
 */

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female' | 'other';
  address?: Address;
  emergencyContact?: EmergencyContact;
  insurance?: Insurance;
  medicalHistory?: MedicalRecord[];
  allergies?: string[];
  medications?: Medication[];
  medicalRecordNumber?: string;
  patientId?: string;
  age?: number;
  bloodType?: string;
  emergencyContacts?: EmergencyContact[];
  activeAppointments?: Appointment[];
  pastAppointments?: number;
  isNewPatient?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialties: string[];
  licenseNumber: string;
  npi?: string;
  availability?: Availability[];
  languages: string[];
  hospital?: string;
  acceptedInsurance?: string[];
  rating?: number;
  reviewCount?: number;
  ageRestrictions?: {
    min?: number;
    max?: number;
  };
  activeAppointments?: number;
  consultationFee?: number;
  returningPatientDiscount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date | string;
  time: string;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  rescheduleHistory?: Array<
    | {
        from: Date | string;
        to: Date | string;
        reason?: string;
        originalDate?: Date | string;
        newDate?: string;
        rescheduledAt?: string;
        rescheduledBy?: string;
      }
    | {
        originalDate: Date | string;
        newDate: string;
        reason: string;
        rescheduledAt: string;
        rescheduledBy: string;
      }
  >;
  recurrenceInfo?: {
    rule?: RecurrenceRule;
    isRecurring: boolean;
    parentId?: string;
    seriesId?: string;
    occurrenceNumber?: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  visitDate: Date | string;
  chiefComplaint?: string;
  diagnosis?: Diagnosis[];
  treatments?: Treatment[];
  prescriptions?: Prescription[];
  labResults?: LabResult[];
  vitalSigns?: VitalSigns;
  notes?: string;
  attachments?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions?: string;
  startDate: Date | string;
  endDate?: Date | string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  pharmacy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface LabResult {
  id: string;
  patientId: string;
  orderedBy?: string;
  testName: string;
  testDate: Date | string;
  results: LabTestResult[];
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  attachments?: string[];
  createdAt: Date | string;
}

export interface LabTestResult {
  parameter: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  flag?: 'high' | 'low' | 'normal' | 'critical';
}

export interface Diagnosis {
  code: string; // ICD-10 code
  description: string;
  type: 'primary' | 'secondary';
  dateOfDiagnosis: Date | string;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  startDate: Date | string;
  endDate?: Date | string;
  frequency?: string;
  provider?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date | string;
  endDate?: Date | string;
  prescribedBy?: string;
  reason?: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  coverageType: string;
  validFrom: Date | string;
  validTo?: Date | string;
  copay?: number;
  deductible?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface Availability {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export type AppointmentType =
  | 'consultation'
  | 'follow-up'
  | 'emergency'
  | 'surgery'
  | 'lab-test'
  | 'vaccination'
  | 'check-up'
  | 'telemedicine';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'rescheduled';

export interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomId: string;
  startedAt?: Date | string;
  endedAt?: Date | string;
  duration?: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  notes?: string;
  technicalIssues?: string[];
  patientRating?: number;
  doctorRating?: number;
}

export interface TimeSlot {
  id?: string;
  start?: Date | string;
  end?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  available: boolean;
  doctorId?: string;
  duration?: number;
  type?: AppointmentType;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: Date | string;
  byWeekDay?: number[];
  byMonth?: number[];
  byMonthDay?: number[];
  maxOccurrences?: number;
}
