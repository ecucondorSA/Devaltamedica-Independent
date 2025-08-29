/**
 * @fileoverview Tipos simples para Admin App - Capa de App
 * @description Estos tipos representan la interfaz de la aplicación admin,
 * simplificados para la UI y consumidos a través de adaptadores
 */

// ==================== TIPOS SIMPLES PARA UI ADMIN ====================

/** Usuario simple para vista administrativa */
export interface SimpleUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActivity: string;
  createdAt: string;
}

/** Estadísticas del dashboard administrativo */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers24h: number;
  totalAppointments: number;
  activeAppointments: number;
  completedAppointments: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  errorRate: number;
  averageResponseTime: number;
}

/** Información del sistema para monitoreo */
export interface SystemHealth {
  status: 'up' | 'down' | 'degraded';
  services: ServiceHealth[];
  metrics: SystemMetrics;
  alerts: SystemAlert[];
}

/** Estado de un servicio individual */
export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  port?: number;
  responseTime?: number;
  lastCheck: string;
  uptime?: number;
}

/** Métricas del sistema */
export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
}

/** Alerta del sistema */
export interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  service?: string;
}

/** Log de auditoría simplificado */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error';
}

/** Configuración del sistema */
export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  enableNotifications: boolean;
  maxSessionDuration: number;
  passwordPolicy: PasswordPolicy;
  hipaaCompliance: HIPAASettings;
  general: {
    siteName: string;
    siteUrl: string;
    timezone: string;
    language: string;
    debugMode: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

/** Política de contraseñas */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  expirationDays: number;
}

/** Configuración HIPAA */
export interface HIPAASettings {
  auditLogsRetentionDays: number;
  encryptionEnabled: boolean;
  accessLogsEnabled: boolean;
  dataBackupFrequency: 'daily' | 'weekly' | 'monthly';
}

/** Información de sesión activa */
export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  location?: string;
  device: string;
}

/** Reporte analítico simple */
export interface AnalyticsReport {
  period: string;
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageSessionDuration: number;
  topPages: PageAnalytics[];
  userGrowth: GrowthData[];
}

/** Analíticas de página */
export interface PageAnalytics {
  path: string;
  views: number;
  uniqueUsers: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

/** Datos de crecimiento */
export interface GrowthData {
  date: string;
  users: number;
  appointments: number;
  revenue?: number;
}

/** Notificación administrativa */
export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

/** Filtros para gestión de usuarios */
export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/** Filtros para logs de auditoría */
export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: 'info' | 'warning' | 'error';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/** Respuesta paginada simple */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Configuración de la app admin */
export interface AdminConfig {
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  enableDebug: boolean;
  features: {
    userManagement: boolean;
    systemMonitoring: boolean;
    auditLogs: boolean;
    analytics: boolean;
    maintenance: boolean;
  };
}

// ==================== ACCIONES Y ESTADOS ====================

/** Estado de carga */
export interface LoadingState {
  loading: boolean;
  error?: string;
  lastUpdated?: string;
}

/** Resultado de una acción administrativa */
export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

/** Estados de formularios admin */
export interface AdminFormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// ==================== TIPOS DE EXPORT PARA ADAPTADORES ====================

/** Interface que deben implementar los adaptadores */
export interface AdminAdapter<TComplex, TSimple> {
  toSimple(complex: TComplex): TSimple;
  fromSimple(simple: TSimple): TComplex;
  validateSimple(simple: TSimple): boolean;
}

/** Contexto del admin para providers */
export interface AdminContext {
  user: SimpleUser | null;
  permissions: string[];
  settings: SystemSettings;
  loading: boolean;
  error?: string;
}

// ==================== CONSTANTES Y ENUMS ====================

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  COMPANY: 'company',
  STAFF: 'staff',
} as const;

export const SYSTEM_ALERTS_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
} as const;
