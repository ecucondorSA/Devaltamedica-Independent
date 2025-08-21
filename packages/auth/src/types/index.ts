// Tipos centralizados para autenticación en AltaMedica

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  // Propiedades específicas para doctores
  specialization?: string;
  specialty?: string;
  // Token para compatibilidad con sistemas existentes
  token?: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin' | 'company';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignInOptions {
  redirectUrl?: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signIn: (email: string, password: string, options?: SignInOptions) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>; // Alias para register
  signInWithGoogle?: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  userProfile?: User | null; // Alias para compatibilidad
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
