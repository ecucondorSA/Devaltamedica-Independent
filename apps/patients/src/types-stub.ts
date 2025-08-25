// Stub temporal para @altamedica/types hasta que se resuelva el problema de resolución de módulos

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  languages: string[];
  isAvailable: boolean;
  consultationFee: number;
  telemedicineAvailable: boolean;
  isTelemedicine?: boolean;
  avatar?: string;
  location?: string;
  availableSlots?: string[];
  description?: string;
  education?: string[];
  certifications?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
  reason: string;
  isTelemedicine: boolean;
  estimatedDuration: number;
}
