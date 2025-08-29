// ==================== UNIFIED USER TYPE ====================
// NOTA: Este es el tipo User unificado para resolver conflictos
// Compatible con apps/admin y todas las apps

import { UserRole } from '../auth/roles';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  // IDs compatibles
  id: string; // Para apps que usan 'id'
  uid?: string; // Para apps que usan 'uid' (Firebase)

  // Info personal
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Para compatibilidad con apps que usan 'name'
  displayName?: string; // Para componentes admin

  // Contacto
  phone?: string;
  phoneNumber?: string; // Para compatibilidad
  avatar?: string;

  // Role y permisos
  role: UserRole;

  // Estados
  isActive: boolean;
  status?: 'active' | 'inactive' | 'pending' | 'suspended'; // Para componentes admin
  profileComplete?: boolean;

  // Timestamps
  lastLogin?: string;
  lastLoginAt?: Date;
}

// Removido: export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff'; - ahora importado desde auth/roles

// Export tambien como 'name' para compatibilidad
export type UserWithName = User & {
  name: string;
};

// Helper para convertir User a formato con name
export function userToNameFormat(user: User): UserWithName {
  return {
    ...user,
    name: `${user.firstName} ${user.lastName}`,
  };
}

// Helper para asegurar compatibilidad uid/id
export function normalizeUser(user: any): User {
  return {
    ...user,
    id: user.id || user.uid,
    uid: user.uid || user.id,
    phone: user.phone || user.phoneNumber,
    phoneNumber: user.phoneNumber || user.phone,
    name: user.name || `${user.firstName} ${user.lastName}`,
  };
}

// ==================== OTHER BASE TYPES ====================

export interface SearchFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'routine' | 'specialist';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  sideEffects?: string[];
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
