// TODO: Definir UserRole en @altamedica/types
// Stub temporal para permitir el build
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;

  // Profile specific fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Medical specific fields (for doctors)
  medicalLicense?: string;
  specialties?: string[];
  hospitalAffiliations?: string[];

  // Company specific fields (for company admins)
  companyId?: string;
  companyName?: string;
  department?: string;

  // Settings
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}
