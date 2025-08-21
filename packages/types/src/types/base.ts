// ==================== BASE TYPES ====================

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileComplete: boolean;
}

export type UserRole = "admin" | "doctor" | "patient" | "staff";

export interface SearchFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export type AppointmentType =
  | "consultation"
  | "follow-up"
  | "emergency"
  | "routine"
  | "specialist";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  sideEffects?: string[];
}

export type MedicalRecordType =
  | "consultation"
  | "diagnosis"
  | "treatment"
  | "lab_result"
  | "imaging"
  | "prescription"
  | "vaccination"
  | "surgery"
  | "allergy"
  | "family_history";

export type Priority = "low" | "medium" | "high" | "critical";

export interface LabTestResult {
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: {
    min: number;
    max: number;
  };
  status: "normal" | "high" | "low" | "critical";
  notes?: string;
}

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    trend: Array<{
      date: string;
      count: number;
    }>;
  };
  patients: {
    total: number;
    new: number;
    active: number;
    trend: Array<{
      date: string;
      count: number;
    }>;
  };
  revenue: {
    total: number;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
    byDoctor: Array<{
      doctorId: string;
      doctorName: string;
      amount: number;
    }>;
  };
  performance: {
    averageAppointmentDuration: number;
    patientSatisfaction: number;
    doctorUtilization: number;
  };
}
