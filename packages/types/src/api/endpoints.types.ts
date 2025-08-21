/**
 * @fileoverview Tipos para endpoints específicos de la API
 * @module @altamedica/types/api/endpoints
 */

import { UserRole } from '../auth/roles';
import {
  DoctorProfile,
  PatientProfile
} from '../medical';

// ==================== AUTH ENDPOINTS ====================

/**
 * Request de login
 * @interface LoginRequest
 */
export interface LoginRequest {
  /** Email del usuario */
  email: string;
  /** Contraseña */
  password: string;
  /** Recordar sesión */
  rememberMe?: boolean;
  /** Tipo de dispositivo */
  deviceType?: 'web' | 'mobile' | 'tablet';
  /** Información del dispositivo */
  deviceInfo?: {
    userAgent: string;
    platform: string;
    appVersion?: string;
  };
}

/**
 * Response de login
 * @interface LoginResponse
 */
export interface LoginResponse {
  /** Token de acceso JWT */
  accessToken: string;
  /** Token de refresh */
  refreshToken: string;
  /** Expiración del access token */
  expiresIn: number;
  /** Tipo de token */
  tokenType: 'Bearer';
  /** Información del usuario */
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileComplete: boolean;
    avatarUrl?: string;
  };
  /** Requiere 2FA */
  requires2FA?: boolean;
  /** Requiere cambio de contraseña */
  requiresPasswordChange?: boolean;
}

/**
 * Request de registro
 * @interface RegisterRequest
 */
export interface RegisterRequest {
  /** Email */
  email: string;
  /** Contraseña */
  password: string;
  /** Confirmación de contraseña */
  passwordConfirmation: string;
  /** Nombre */
  firstName: string;
  /** Apellido */
  lastName: string;
  /** Rol inicial */
  role: UserRole;
  /** Teléfono */
  phoneNumber?: string;
  /** Aceptación de términos */
  acceptTerms: boolean;
  /** Consentimiento de marketing */
  marketingConsent?: boolean;
  /** Código de invitación */
  invitationCode?: string;
}

/**
 * Request para refresh token
 * @interface RefreshTokenRequest
 */
export interface RefreshTokenRequest {
  /** Refresh token actual */
  refreshToken: string;
}

/**
 * Request para cambio de contraseña
 * @interface ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  /** Contraseña actual */
  currentPassword: string;
  /** Nueva contraseña */
  newPassword: string;
  /** Confirmación de nueva contraseña */
  newPasswordConfirmation: string;
  /** Cerrar otras sesiones */
  logoutOtherSessions?: boolean;
}

// ==================== PATIENT ENDPOINTS ====================

/**
 * Request para crear paciente
 * @interface CreatePatientRequest
 */
export interface CreatePatientRequest extends Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'> {
  /** ID del usuario asociado */
  userId: string;
  /** Enviar email de bienvenida */
  sendWelcomeEmail?: boolean;
}

/**
 * Request para actualizar paciente
 * @interface UpdatePatientRequest
 */
export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  /** Razón de la actualización */
  updateReason?: string;
}

/**
 * Filtros para búsqueda de pacientes
 * @interface PatientSearchFilters
 */
export interface PatientSearchFilters {
  /** Búsqueda por nombre o documento */
  search?: string;
  /** Filtrar por género */
  gender?: string;
  /** Filtrar por tipo de sangre */
  bloodType?: string;
  /** Filtrar por edad mínima */
  minAge?: number;
  /** Filtrar por edad máxima */
  maxAge?: number;
  /** Filtrar por compañía */
  companyId?: string;
  /** Filtrar por condición crónica */
  chronicCondition?: string;
  /** Incluir inactivos */
  includeInactive?: boolean;
}

// ==================== DOCTOR ENDPOINTS ====================

/**
 * Request para crear doctor
 * @interface CreateDoctorRequest
 */
export interface CreateDoctorRequest extends Omit<DoctorProfile, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'averageRating' | 'totalReviews'> {
  /** ID del usuario asociado */
  userId: string;
  /** Documentos de verificación */
  verificationDocuments?: {
    licensePhoto: string;
    diplomaPhoto: string;
    additionalCertificates?: string[];
  };
}

/**
 * Request para actualizar doctor
 * @interface UpdateDoctorRequest
 */
export interface UpdateDoctorRequest extends Partial<CreateDoctorRequest> {
  /** Actualizar horarios */
  updateSchedule?: boolean;
  /** Actualizar tarifas */
  updateFees?: boolean;
}

/**
 * Filtros para búsqueda de doctores
 * @interface DoctorSearchFilters
 */
export interface DoctorSearchFilters {
  /** Búsqueda por nombre o matrícula */
  search?: string;
  /** Filtrar por especialidad */
  specialty?: string;
  /** Filtrar por subespecialidad */
  subSpecialty?: string;
  /** Ofrece telemedicina */
  offersTelemedicine?: boolean;
  /** Acepta nuevos pacientes */
  acceptingNewPatients?: boolean;
  /** Rango de precio mínimo */
  minPrice?: number;
  /** Rango de precio máximo */
  maxPrice?: number;
  /** Calificación mínima */
  minRating?: number;
  /** Idiomas */
  languages?: string[];
  /** Seguros aceptados */
  acceptedInsurance?: string[];
  /** Disponible en fecha específica */
  availableDate?: string;
  /** Ubicación (radio en km) */
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

// ==================== APPOINTMENT ENDPOINTS ====================

/**
 * Request para crear cita
 * @interface CreateAppointmentRequest
 */
export interface CreateAppointmentRequest {
  /** ID del paciente */
  patientId: string;
  /** ID del doctor */
  doctorId: string;
  /** Fecha y hora programada */
  scheduledDate: string;
  /** Duración en minutos */
  duration: number;
  /** Tipo de cita */
  type: string;
  /** Tipo de consulta */
  consultationType: string;
  /** Motivo de consulta */
  chiefComplaint: string;
  /** Síntomas */
  symptoms?: string[];
  /** Es virtual */
  isVirtual: boolean;
  /** Notas del paciente */
  patientNotes?: string;
  /** Preparación requerida */
  requiresPreparation?: boolean;
  /** Recordatorios */
  reminders?: {
    type: string;
    minutesBefore: number;
  }[];
}

/**
 * Request para actualizar cita
 * @interface UpdateAppointmentRequest
 */
export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
  /** Nuevo estado */
  status?: string;
  /** Razón del cambio */
  changeReason?: string;
}

/**
 * Request para cancelar cita
 * @interface CancelAppointmentRequest
 */
export interface CancelAppointmentRequest {
  /** Razón de cancelación */
  reason: string;
  /** Notas adicionales */
  notes?: string;
  /** Reprogramar automáticamente */
  reschedule?: boolean;
  /** Fechas sugeridas para reprogramar */
  suggestedDates?: string[];
}

/**
 * Filtros para búsqueda de citas
 * @interface AppointmentSearchFilters
 */
export interface AppointmentSearchFilters {
  /** ID del paciente */
  patientId?: string;
  /** ID del doctor */
  doctorId?: string;
  /** Estado de la cita */
  status?: string[];
  /** Tipo de cita */
  type?: string[];
  /** Rango de fechas */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  /** Especialidad */
  specialty?: string;
  /** Es virtual */
  isVirtual?: boolean;
  /** Incluir canceladas */
  includeCancelled?: boolean;
}

// ==================== MEDICAL RECORD ENDPOINTS ====================

/**
 * Request para crear historia clínica
 * @interface CreateMedicalRecordRequest
 */
export interface CreateMedicalRecordRequest {
  /** ID del paciente */
  patientId: string;
  /** ID del proveedor */
  providerId: string;
  /** Tipo de registro */
  type: string;
  /** Título */
  title: string;
  /** Contenido */
  content: string;
  /** Nivel de confidencialidad */
  confidentiality: string;
  /** ID de cita relacionada */
  appointmentId?: string;
  /** Diagnósticos */
  diagnoses?: {
    code: string;
    description: string;
    type: string;
  }[];
  /** Archivos adjuntos */
  attachments?: string[];
  /** Tags */
  tags?: string[];
}

/**
 * Request para actualizar historia clínica
 * @interface UpdateMedicalRecordRequest
 */
export interface UpdateMedicalRecordRequest extends Partial<CreateMedicalRecordRequest> {
  /** Razón de la actualización */
  updateReason: string;
  /** Es una enmienda */
  isAmendment?: boolean;
}

/**
 * Filtros para búsqueda de historias clínicas
 * @interface MedicalRecordSearchFilters
 */
export interface MedicalRecordSearchFilters {
  /** ID del paciente */
  patientId?: string;
  /** ID del proveedor */
  providerId?: string;
  /** Tipo de registro */
  type?: string[];
  /** Rango de fechas */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  /** Buscar en contenido */
  searchContent?: string;
  /** Tags */
  tags?: string[];
  /** Incluir archivados */
  includeArchived?: boolean;
}

// ==================== ANALYTICS ENDPOINTS ====================

/**
 * Request para analytics
 * @interface AnalyticsRequest
 */
export interface AnalyticsRequest {
  /** Tipo de métrica */
  metricType: 'appointments' | 'patients' | 'revenue' | 'satisfaction';
  /** Rango de tiempo */
  timeRange: {
    startDate: string;
    endDate: string;
  };
  /** Granularidad */
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
  /** Agrupar por */
  groupBy?: string[];
  /** Filtros adicionales */
  filters?: Record<string, any>;
  /** Incluir comparación con período anterior */
  includeComparison?: boolean;
}

/**
 * Response de analytics
 * @interface AnalyticsResponse
 */
export interface AnalyticsResponse {
  /** Datos de la métrica */
  data: AnalyticsDataPoint[];
  /** Resumen */
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  };
  /** Comparación con período anterior */
  comparison?: {
    previousTotal: number;
    changeAmount: number;
    changePercentage: number;
  };
}

/**
 * Punto de datos de analytics
 * @interface AnalyticsDataPoint
 */
export interface AnalyticsDataPoint {
  /** Timestamp o label */
  label: string;
  /** Valor */
  value: number;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}