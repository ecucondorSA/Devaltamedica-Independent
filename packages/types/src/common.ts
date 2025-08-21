/**
 * Common types used across the platform
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: "patient" | "doctor" | "admin";
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin: string;
}

export interface Patient extends User {
  role: "patient";
  patientId: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Doctor extends User {
  role: "doctor";
  doctorId: string;
  specialty: string;
  license: string;
  experience: number;
  education: string[];
  certifications: string[];
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type StatusType =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}