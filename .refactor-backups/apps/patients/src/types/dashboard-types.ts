/**
 * dashboard-types.ts - Tipos Específicos para Dashboard con APIs Reales
 * Proyecto: Altamedica Pacientes
 * Diseño: Compatibles con tipos existentes, extensión conservadora
 */

import type { 
  Appointment, 
  MedicalRecord, 
  Prescription, 
  HealthMetrics as BaseHealthMetrics,
  Patient,
  AuthUser 
} from './index';

// 📊 DTOs específicos para Dashboard API Real
export interface PatientDashboardDTO {
  patient: Patient;
  upcomingAppointments: DashboardAppointment[];
  recentMedicalRecords: DashboardMedicalRecord[];
  activePrescriptions: DashboardPrescription[];
  healthMetrics: DashboardHealthMetrics | null;
  notifications: DashboardNotification[];
  quickStats: DashboardQuickStats;
  lastUpdated: string;
}

export interface UserProfileDTO {
  user: AuthUser;
  patient?: Patient;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
  lastActivity: string;
}

// 🎯 Versiones optimizadas para Dashboard (menos campos, más eficientes)
export interface DashboardAppointment extends Pick<Appointment, 
  'id' | 'doctorId' | 'date' | 'time' | 'type' | 'status' | 'reason' | 'isTelemedicine' | 'location'> {
  doctorName: string;
  doctorSpecialty: string;
  estimatedDuration: number;
  canJoinVideo: boolean;
  reminderSent: boolean;
}

export interface DashboardMedicalRecord extends Pick<MedicalRecord,
  'id' | 'date' | 'type' | 'title' | 'description' | 'priority' | 'tags'> {
  doctorName: string;
  doctorSpecialty: string;
  attachmentCount: number;
  hasActionableItems: boolean;
}

export interface DashboardPrescription extends Pick<Prescription,
  'id' | 'medicationName' | 'dosage' | 'frequency' | 'status' | 'prescribedDate' | 'expiryDate'> {
  doctorName: string;
  remainingDoses?: number;
  nextDoseTime?: string;
  criticalAlerts: string[];
}

// 📈 Métricas mejoradas para dashboard
export interface DashboardHealthMetrics extends BaseHealthMetrics {
  trend: {
    bloodPressureStatus: 'improving' | 'stable' | 'worsening' | 'unknown';
    weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown';
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  };
  alerts: HealthAlert[];
  nextRecommendedCheckup?: string;
}

export interface HealthAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  actionRequired: boolean;
  dueDate?: string;
}

// 🔔 Notificaciones específicas de dashboard
export interface DashboardNotification {
  id: string;
  type: 'appointment' | 'prescription' | 'test_result' | 'system' | 'reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// 📊 Estadísticas rápidas
export interface DashboardQuickStats {
  appointmentsThisMonth: number;
  activePrescriptions: number;
  unreadNotifications: number;
  pendingTestResults: number;
  overdueTasks: number;
  healthScore?: number; // 0-100
}

// 👤 Preferencias de usuario
export interface UserPreferences {
  language: 'es' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    testResultAlerts: boolean;
  };
  dashboard: {
    defaultView: 'overview' | 'appointments' | 'health';
    showHealthMetrics: boolean;
    showQuickActions: boolean;
    compactMode: boolean;
  };
  privacy: {
    shareDataForResearch: boolean;
    allowMarketing: boolean;
    publicProfile: boolean;
  };
}

// 🔒 Configuraciones de seguridad
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: ActiveSession[];
  loginHistory: LoginHistoryEntry[];
  securityQuestions: SecurityQuestion[];
  emergencyContacts: EmergencyContactSecurity[];
}

export interface ActiveSession {
  id: string;
  deviceInfo: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActivity: string;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  timestamp: string;
  deviceInfo: string;
  location: string;
  ipAddress: string;
  success: boolean;
  failureReason?: string;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  isAnswered: boolean;
}

export interface EmergencyContactSecurity {
  name: string;
  relationship: string;
  phoneNumber: string;
  canAccessMedicalInfo: boolean;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

// 🔄 Tipos de respuesta de API
export interface DashboardApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  metadata?: {
    requestId: string;
    processingTime: number;
    version: string;
  };
}

export interface DashboardApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    suggestions?: string[];
  };
  timestamp: string;
}

// 🚨 Estados de carga específicos para dashboard
export interface DashboardLoadingState {
  overall: boolean;
  appointments: boolean;
  medicalRecords: boolean;
  prescriptions: boolean;
  healthMetrics: boolean;
  notifications: boolean;
  userProfile: boolean;
}

export interface DashboardErrorState {
  appointments?: string;
  medicalRecords?: string;
  prescriptions?: string;
  healthMetrics?: string;
  notifications?: string;
  userProfile?: string;
  network?: string;
  general?: string;
}

// 🔧 Utilidades para transformación de datos
export type DashboardDataTransformer<T, U> = (rawData: T) => U;

export interface DataSyncStatus {
  lastSync: string;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError?: string;
}

// 📱 Tipos específicos para responsividad del dashboard
export interface DashboardViewport {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface DashboardLayout {
  sidebar: {
    isCollapsed: boolean;
    width: number;
  };
  main: {
    gridColumns: number;
    compactMode: boolean;
  };
  quickActions: {
    visible: boolean;
    position: 'top' | 'bottom' | 'sidebar';
  };
}

// 🎯 Exportaciones específicas para casos de uso
export type DashboardAppointmentSummary = Pick<DashboardAppointment, 
  'id' | 'date' | 'time' | 'doctorName' | 'type' | 'status'>;

export type DashboardPrescriptionSummary = Pick<DashboardPrescription,
  'id' | 'medicationName' | 'dosage' | 'frequency' | 'status'>;

export type DashboardHealthSummary = Pick<DashboardHealthMetrics,
  'bloodPressure' | 'heartRate' | 'weight' | 'trend'>;

// 🔗 Tipos para integración con hooks existentes
export interface DashboardHookState {
  data: PatientDashboardDTO | null;
  loading: DashboardLoadingState;
  errors: DashboardErrorState;
  lastUpdated: string | null;
  isRefreshing: boolean;
}

export interface DashboardHookActions {
  refresh: () => Promise<void>;
  refreshSection: (section: keyof DashboardLoadingState) => Promise<void>;
  clearErrors: () => void;
  clearError: (section: keyof DashboardErrorState) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

export type DashboardHookReturn = [DashboardHookState, DashboardHookActions];