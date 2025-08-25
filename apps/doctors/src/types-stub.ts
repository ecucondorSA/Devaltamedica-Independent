// Stub temporal para @altamedica/types hasta que se resuelva el problema de resolución de módulos

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export enum PublicUserRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  COMPANY = 'company',
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  profileComplete: boolean;
  metadata: {
    createdAt: string;
    lastLoginAt: string;
  };
}
