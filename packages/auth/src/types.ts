// Tipos para el sistema de autenticación SSO
// TODO: Definir UserRole en @altamedica/types
// Stub temporal para permitir el build
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin'
}

export { UserRole };

// En la implementación previa existía un enum UserType con los mismos valores de negocio.
// Lo mantenemos como alias para compatibilidad transicional (p.ej. código que aún hace referencia a userType).
export type UserType = UserRole;

export interface SSOTokenPayload {
  uid: string;
  email: string;
  userType: UserType;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  uid: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface SSOUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string | null;
  emailVerified: boolean;
  metadata: {
    lastLoginAt: string;
    createdAt: string;
  };
  userType?: UserType; // alias redundante, se eliminará en refactor futuro
  roles?: string[];
  permissions?: string[];
}

export interface SSOConfig {
  apiServerUrl: string;
  webAppUrl: string;
  currentAppPort: string;
  appName: string;
}

export interface SSOToken {
  token: string;
  expiresAt: number;
  refreshToken: string;
  user: SSOUser;
  customToken?: string;
}

// ==========================================
// TIPOS DEL SISTEMA DE AUTENTICACIÓN UNIFICADO
// ==========================================

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface SignInOptions {
  provider?: 'google' | 'facebook' | 'email';
  redirect?: boolean;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthContextType extends AuthState {
  // Métodos de autenticación
  login: (credentials: LoginCredentials) => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signInWithGoogle: (options?: SignInOptions) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // Alias para compatibilidad
  userProfile?: User | null;
}