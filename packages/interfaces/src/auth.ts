/**
 * Authentication interfaces
 * Core interfaces for authentication and authorization
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  metadata?: UserMetadata;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  location?: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  isActive: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: any;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type UserRole =
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'admin'
  | 'company_admin'
  | 'company_user'
  | 'super_admin';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'manage';

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date | string;
}

export interface UserMetadata {
  lastPasswordChange?: Date | string;
  mfaEnabled?: boolean;
  loginCount?: number;
  accountStatus?: AccountStatus;
  preferences?: UserPreferences;
  hipaaAgreement?: HIPAAAgreement;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  notifications?: NotificationPreferences;
  theme?: 'light' | 'dark' | 'system';
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  appointments: boolean;
  reminders: boolean;
  marketing: boolean;
}

export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
}

export interface HIPAAAgreement {
  accepted: boolean;
  acceptedAt?: Date | string;
  version: string;
  ipAddress?: string;
}

export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'locked';

export interface AuthProvider {
  name: 'google' | 'apple' | 'facebook' | 'email';
  providerId: string;
  providerUserId?: string;
}

export interface PasswordReset {
  token: string;
  email: string;
  expiresAt: Date | string;
  used: boolean;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: '2fa' | 'sms' | 'email';
  secret?: string;
  backupCodes?: string[];
  verifiedAt?: Date | string;
}
