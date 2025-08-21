import { UserRole } from './roles';

/**
 * Token de autenticación unificado para toda la plataforma
 * Usado por UnifiedAuthSystem y todos los servicios
 */
export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  firebaseUid?: string;
  permissions?: string[];
  patientId?: string;
  doctorId?: string;
  companyId?: string;
  firstName?: string;
  lastName?: string;
  exp: number;
  iat?: number;
}

/**
 * Contexto de autenticación con helpers
 */
export interface AuthContext {
  user: AuthToken | null;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

/**
 * Resultado de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: AuthToken;
  response?: any; // NextResponse en el contexto de Next.js
}

/**
 * Request para login SSO
 */
export interface SSOLoginRequest {
  email: string;
  password?: string;
  idToken?: string; // Firebase ID token
  rememberMe?: boolean;
}

/**
 * Response de login SSO
 */
export interface SSOLoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: AuthToken;
  redirectUrl?: string;
  message?: string;
}