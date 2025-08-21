// ==================== COMMON TYPES ====================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin: string;
}

export type UserRole =
  | "admin"
  | "doctor"
  | "patient"
  | "nurse"
  | "receptionist";

export interface Patient extends BaseEntity {
  userId: string;
  dni: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies: string[];
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

export interface Doctor extends BaseEntity {
  userId: string;
  licenseNumber: string;
  specialties: string[];
  experience: number; // years
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  certifications: {
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

// ==================== MEDICAL TYPES ====================

export interface MedicalRecord extends BaseEntity {
  patientId: string;
  doctorId: string;
  title: string;
  description?: string;
  date: string;
  type: MedicalRecordType;
  priority: Priority;
  status: "active" | "archived" | "pending";
  attachments?: string[];
  metadata?: Record<string, any>;
}

export type MedicalRecordType =
  | "consultation"
  | "examination"
  | "prescription"
  | "lab_result"
  | "imaging"
  | "surgery"
  | "vaccination";

export type Priority = "low" | "medium" | "high" | "critical";

export interface Prescription extends BaseEntity {
  patientId: string;
  doctorId: string;
  medications: Medication[];
  date: string;
  status: "active" | "completed" | "cancelled";
  notes?: string;
  attachments?: string[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
}

export interface Appointment extends BaseEntity {
  patientId: string;
  doctorId: string;
  date: string;
  duration: number; // minutes
  type: AppointmentType;
  status: AppointmentStatus;
  location?: string;
  isTelemedicine: boolean;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
}

export type AppointmentType =
  | "consultation"
  | "examination"
  | "follow_up"
  | "emergency"
  | "surgery"
  | "vaccination";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface LabResult extends BaseEntity {
  patientId: string;
  doctorId: string;
  testName: string;
  testDate: string;
  results: LabTestResult[];
  status: "pending" | "completed" | "abnormal" | "critical";
  notes?: string;
  attachments?: string[];
}

export interface LabTestResult {
  parameter: string;
  value: number | string;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  status: "normal" | "high" | "low" | "critical";
}

// ==================== API TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== FILTER TYPES ====================

export interface DateRange {
  start: string;
  end: string;
}

export interface SearchFilters {
  query?: string;
  dateRange?: DateRange;
  status?: string[];
  type?: string[];
  doctorId?: string;
  patientId?: string;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ==================== FILE TYPES ====================

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ==================== LOCATION TYPES ====================

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// ==================== COMPANY TYPES ====================

export interface Company extends BaseEntity {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: Location;
  specialties: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFavorite?: boolean;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalPrescriptions: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  appointmentsByType: Record<AppointmentType, number>;
  revenueByMonth: {
    month: string;
    amount: number;
  }[];
  patientGrowth: {
    month: string;
    count: number;
  }[];
}

// ==================== EXPORT ====================

// Eliminamos las exportaciones duplicadas que causan conflictos
// Los tipos ya están exportados individualmente arriba
