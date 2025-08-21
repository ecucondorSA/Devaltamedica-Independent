/**
 * Doctor-related type definitions
 * @module @altamedica/medical/types/doctor
 */

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  phoneNumber?: string;
  yearsOfExperience?: number;
  education?: {
    degree: string;
    institution: string;
    year: number;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: Date;
    expiryDate?: Date;
  }[];
  languages?: string[];
  hospitalAffiliations?: string[];
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  patients?: string[]; // Patient IDs
}

export interface DoctorCreate extends Omit<Doctor, 'id'> {
  password?: string;
}

export interface DoctorUpdate extends Partial<Doctor> {
  id: string;
}