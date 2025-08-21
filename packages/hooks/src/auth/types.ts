/**
 * @fileoverview Tipos para hooks de autenticación
 * @module @altamedica/hooks/auth/types
 * @description Definiciones de tipos para sistema de autenticación unificado
 */

// ==========================================
// TIPOS BASE DE AUTENTICACIÓN
// ==========================================

/**
 * Estados de autenticación
 */
export type AuthState = 
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'
  | 'expired';

/**
 * Tipos de usuario en el sistema médico
 */
export type UserType = 
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'admin'
  | 'company'
  | 'specialist'
  | 'technician';

/**
 * Roles del sistema con jerarquía
 */
export type Role = 
  | 'super_admin'
  | 'admin'
  | 'medical_director'
  | 'doctor'
  | 'nurse'
  | 'specialist'
  | 'company_admin'
  | 'company_user'
  | 'patient'
  | 'guest';

/**
 * Permisos granulares del sistema
 */
export type Permission = 
  | 'read_patients'
  | 'write_patients'
  | 'read_medical_records'
  | 'write_medical_records'
  | 'prescribe_medications'
  | 'schedule_appointments'
  | 'access_telemedicine'
  | 'manage_users'
  | 'view_analytics'
  | 'billing_access'
  | 'system_admin'
  | 'export_data'
  | 'hipaa_access';

// ==========================================
// USUARIO Y PERFIL
// ==========================================

/**
 * Usuario base del sistema
 */
export interface User {
  /** ID único del usuario */
  id: string;
  /** Email principal */
  email: string;
  /** Nombre completo */
  name: string;
  /** Nombre de usuario (opcional) */
  username?: string;
  /** Avatar URL */
  avatar?: string;
  /** Tipo de usuario */
  userType: UserType;
  /** Roles asignados */
  roles: Role[];
  /** Estado del usuario */
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  /** Si el usuario está verificado */
  verified: boolean;
  /** Fecha de último login */
  lastLogin?: Date;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de actualización */
  updatedAt: Date;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Perfil extendido del usuario
 */
export interface UserProfile extends User {
  /** Información personal */
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  /** Preferencias del usuario */
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    accessibility: {
      fontSize: 'small' | 'medium' | 'large';
      highContrast: boolean;
      screenReader: boolean;
    };
  };
  
  /** Configuración de sesión */
  sessionConfig: {
    maxSessions: number;
    sessionTimeout: number;
    requireMFA: boolean;
    allowRememberMe: boolean;
  };
}

/**
 * Perfil médico específico
 */
export interface MedicalProfile {
  /** ID del usuario médico */
  userId: string;
  /** Número de licencia médica */
  licenseNumber?: string;
  /** Especialidades */
  specialties: string[];
  /** Certificaciones */
  certifications: Array<{
    name: string;
    issuer: string;
    issuedDate: Date;
    expiryDate?: Date;
    verified: boolean;
  }>;
  /** Información hospitalaria */
  hospitalAffiliations: Array<{
    hospitalId: string;
    hospitalName: string;
    department: string;
    position: string;
    startDate: Date;
    endDate?: Date;
  }>;
  /** Configuración HIPAA */
  hipaaConfig: {
    certified: boolean;
    certificationDate?: Date;
    accessLevel: 'basic' | 'full' | 'restricted';
    auditingEnabled: boolean;
  };
  /** Estadísticas del médico */
  stats?: {
    totalPatients: number;
    totalConsultations: number;
    averageRating: number;
    yearsOfExperience: number;
  };
}

// ==========================================
// TOKENS Y SESIONES
// ==========================================

/**
 * Tokens de autenticación
 */
export interface AuthTokens {
  /** Token de acceso JWT */
  accessToken: string;
  /** Token de actualización */
  refreshToken: string;
  /** Token ID (Firebase/OIDC) */
  idToken?: string;
  /** Tiempo de expiración del access token */
  expiresAt: Date;
  /** Alcance de los tokens */
  scope?: string[];
  /** Tipo de token */
  tokenType: 'Bearer' | 'JWT';
}

/**
 * Datos de sesión
 */
export interface SessionData {
  /** ID de la sesión */
  sessionId: string;
  /** Usuario asociado */
  user: User;
  /** Tokens activos */
  tokens: AuthTokens;
  /** Información del dispositivo */
  device: {
    userAgent: string;
    ipAddress: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    location?: {
      country: string;
      city: string;
    };
  };
  /** Timestamps de la sesión */
  timestamps: {
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
  };
  /** Estado de la sesión */
  isActive: boolean;
  /** Configuración de MFA */
  mfa?: {
    enabled: boolean;
    verified: boolean;
    methods: Array<'sms' | 'email' | 'totp' | 'biometric'>;
  };
}

// ==========================================
// CONFIGURACIÓN DE SSO
// ==========================================

/**
 * Proveedores de SSO soportados
 */
export type SSOProvider = 
  | 'google'
  | 'microsoft'
  | 'apple'
  | 'okta'
  | 'auth0'
  | 'firebase'
  | 'saml'
  | 'ldap';

/**
 * Configuración de SSO
 */
export interface SSOConfig {
  /** Proveedor activo */
  provider: SSOProvider;
  /** Configuración específica del proveedor */
  providerConfig: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    additionalParams?: Record<string, string>;
  };
  /** Si SSO está habilitado */
  enabled: boolean;
  /** Si es obligatorio */
  required: boolean;
  /** Dominios permitidos */
  allowedDomains?: string[];
  /** Configuración de mapeo de roles */
  roleMapping?: Record<string, Role[]>;
}

// ==========================================
// CONFIGURACIÓN DE AUTENTICACIÓN
// ==========================================

/**
 * Configuración principal de autenticación
 */
export interface AuthConfig {
  /** URL base de la API */
  apiUrl: string;
  /** Configuración de tokens */
  tokens: {
  // Nuevos campos camelCase utilizados por el hook y apps
  accessTokenExpiry?: number;
  refreshTokenExpiry?: number;
  automaticRefresh?: boolean;
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  // Campos heredados en MAYÚSCULAS para compatibilidad con DEFAULT_TOKEN_CONFIG
  ACCESS_TOKEN_EXPIRY?: number;
  REFRESH_TOKEN_EXPIRY?: number;
  AUTO_REFRESH_THRESHOLD?: number;
  STORAGE_KEY_PREFIX?: string;
  };
  /** Configuración de sesión */
  session: {
    timeout: number;
    maxConcurrentSessions: number;
    requireReauthentication: boolean;
  };
  /** Configuración de SSO */
  sso?: SSOConfig;
  /** Configuración de Firebase */
  firebase?: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    useEmulator?: boolean;
  };
  /** Configuración médica específica */
  medical: {
    requireHipaaCompliance: boolean;
    auditAllActions: boolean;
    sessionRecording: boolean;
    encryptedStorage: boolean;
  };
  /** Configuración de seguridad */
  security: {
    requireMFA: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    bruteForceProtection: boolean;
    ipWhitelist?: string[];
  };
}

// ==========================================
// PERMISOS Y AUTORIZACIÓN
// ==========================================

/**
 * Matriz de permisos por rol
 */
export interface PermissionMatrix {
  [role: string]: Permission[];
}

/**
 * Contexto de autorización
 */
export interface AuthorizationContext {
  /** Usuario actual */
  user: User;
  /** Permisos efectivos */
  permissions: Permission[];
  /** Recursos accesibles */
  resources: string[];
  /** Contexto médico (si aplica) */
  medicalContext?: {
    currentPatientId?: string;
    currentHospitalId?: string;
    currentDepartment?: string;
  };
}

// ==========================================
// EVENTOS DE AUTENTICACIÓN
// ==========================================

/**
 * Eventos del sistema de autenticación
 */
export type AuthEvent = 
  | 'login'
  | 'logout'
  | 'register'
  | 'token_refresh'
  | 'session_expired'
  | 'permission_denied'
  | 'mfa_required'
  | 'password_change'
  | 'profile_update'
  | 'role_change';

/**
 * Datos del evento de autenticación
 */
export interface AuthEventData {
  /** Tipo de evento */
  event: AuthEvent;
  /** Usuario relacionado */
  userId: string;
  /** Timestamp del evento */
  timestamp: Date;
  /** Metadatos del evento */
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorCode?: string;
    additionalInfo?: Record<string, any>;
  // Campos adicionales opcionales usados por hooks
  userType?: UserType;
  updatedFields?: string[];
  requiresVerification?: boolean;
  };
}

// ==========================================
// HOOKS RETURN TYPES
// ==========================================

/**
 * Valor de retorno del hook useAuth
 */
export interface UseAuthReturn {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Métodos de autenticación
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  
  // Gestión de tokens
  refreshTokens: () => Promise<void>;
  
  // Utilidades
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

/**
 * Datos de registro
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  acceptTerms: boolean;
  medicalLicense?: string;
}

// ==========================================
// GUARD TYPES
// ==========================================

/**
 * Configuración de guards de autenticación
 */
export interface AuthGuardConfig {
  /** Roles requeridos */
  requiredRoles?: Role[];
  /** Permisos requeridos */
  requiredPermissions?: Permission[];
  /** Si requiere verificación */
  requireVerified?: boolean;
  /** Contexto médico requerido */
  requireMedicalContext?: boolean;
  /** Redirección si no autorizado */
  redirectTo?: string;
  /** Mensaje de error personalizado */
  errorMessage?: string;
}

// ==========================================
// ERROR TYPES
// ==========================================

/**
 * Errores específicos de autenticación
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Códigos de error de autenticación
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  HIPAA_VIOLATION: 'HIPAA_VIOLATION'
} as const;