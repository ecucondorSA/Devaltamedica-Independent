// ==================== API TYPES ====================

import {
  User,
  UserRole,
  SearchFilters,
  DateRange,
  AppointmentType,
  AppointmentStatus,
  Medication,
  MedicalRecordType,
  Priority,
  LabTestResult,
  FileUpload,
  AnalyticsData,
} from './base';

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  requiresAuth?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== AUTH TYPES ====================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ==================== PATIENT API TYPES ====================

export interface CreatePatientRequest {
  userId: string;
  dni: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  id: string;
}

export interface PatientFilters extends SearchFilters {
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  hasInsurance?: boolean;
  ageRange?: {
    min: number;
    max: number;
  };
}

// ==================== DOCTOR API TYPES ====================

export interface CreateDoctorRequest {
  userId: string;
  licenseNumber: string;
  specialties: string[];
  experience: number;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    expiryDate: string;
  }[];
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
}

export interface UpdateDoctorRequest extends Partial<CreateDoctorRequest> {
  id: string;
}

export interface DoctorFilters extends SearchFilters {
  specialties?: string[];
  experienceMin?: number;
  experienceMax?: number;
  availability?: {
    day: string;
    time: string;
  };
}

// ==================== APPOINTMENT API TYPES ====================

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  type: AppointmentType;
  location?: string;
  isTelemedicine?: boolean;
  notes?: string;
  symptoms?: string[];
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
  id: string;
  status?: AppointmentStatus;
  diagnosis?: string;
}

export interface AppointmentFilters extends SearchFilters {
  dateRange?: DateRange;
  type?: AppointmentType[];
  status?: AppointmentStatus[];
  isTelemedicine?: boolean;
  doctorId?: string;
  patientId?: string;
}

// ==================== PRESCRIPTION API TYPES ====================

export interface CreatePrescriptionRequest {
  patientId: string;
  doctorId: string;
  medications: Medication[];
  notes?: string;
  attachments?: string[];
}

export interface UpdatePrescriptionRequest extends Partial<CreatePrescriptionRequest> {
  id: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface PrescriptionFilters extends SearchFilters {
  status?: string[];
  medicationName?: string;
  doctorId?: string;
  patientId?: string;
}

// ==================== MEDICAL RECORD API TYPES ====================

export interface CreateMedicalRecordRequest {
  patientId: string;
  doctorId: string;
  title: string;
  description?: string;
  type: MedicalRecordType;
  priority?: Priority;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateMedicalRecordRequest extends Partial<CreateMedicalRecordRequest> {
  id: string;
  status?: 'active' | 'archived' | 'pending';
}

export interface MedicalRecordFilters extends SearchFilters {
  type?: MedicalRecordType[];
  priority?: Priority[];
  status?: string[];
  doctorId?: string;
  patientId?: string;
}

// ==================== LAB RESULT API TYPES ====================

export interface CreateLabResultRequest {
  patientId: string;
  doctorId: string;
  testName: string;
  testDate: string;
  results: LabTestResult[];
  notes?: string;
  attachments?: string[];
}

export interface UpdateLabResultRequest extends Partial<CreateLabResultRequest> {
  id: string;
  status?: 'pending' | 'completed' | 'abnormal' | 'critical';
}

export interface LabResultFilters extends SearchFilters {
  testName?: string;
  status?: string[];
  dateRange?: DateRange;
  doctorId?: string;
  patientId?: string;
}

// ==================== COMPANY API TYPES ====================

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  specialties: string[];
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  id: string;
}

export interface CompanyFilters extends SearchFilters {
  specialties?: string[];
  rating?: {
    min: number;
    max: number;
  };
  isVerified?: boolean;
  location?: {
    lat: number;
    lng: number;
    radius: number; // km
  };
}

// ==================== FILE UPLOAD API TYPES ====================

export interface FileUploadRequest {
  file: File;
  type: 'medical_record' | 'prescription' | 'lab_result' | 'avatar' | 'logo';
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  file: FileUpload;
  url: string;
}

// ==================== NOTIFICATION API TYPES ====================

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  id: string;
  read?: boolean;
}

export interface NotificationFilters extends SearchFilters {
  type?: string[];
  read?: boolean;
  userId?: string;
}

// ==================== ANALYTICS API TYPES ====================

export interface AnalyticsRequest {
  dateRange: DateRange;
  filters?: {
    doctorId?: string;
    patientId?: string;
    type?: string[];
  };
}

export interface AnalyticsResponse {
  data: AnalyticsData;
  generatedAt: string;
}
