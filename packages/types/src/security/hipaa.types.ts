/**
 * @fileoverview Tipos para compliance HIPAA y seguridad médica
 * @module @altamedica/types/security/hipaa
 * @description Definiciones para cumplimiento de HIPAA Privacy Rule y Security Rule
 */

import { z } from 'zod';
import { UserId, PatientId, DoctorId } from '../core/branded.types';

// ==================== HIPAA COMPLIANCE LEVELS ====================

/**
 * Niveles de información protegida de salud (PHI)
 * @enum {string}
 */
export enum PHILevel {
  /** Información no sensible */
  NON_PHI = 'non_phi',
  /** PHI de riesgo bajo */
  LOW_RISK_PHI = 'low_risk_phi',
  /** PHI estándar */
  STANDARD_PHI = 'standard_phi',
  /** PHI altamente sensible */
  HIGH_RISK_PHI = 'high_risk_phi',
  /** Información super protegida */
  SUPER_PROTECTED = 'super_protected'
}

/**
 * Tipos de entidades cubiertas bajo HIPAA
 * @enum {string}
 */
export enum CoveredEntityType {
  /** Proveedor de salud */
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  /** Plan de salud */
  HEALTH_PLAN = 'health_plan',
  /** Clearing house de salud */
  HEALTHCARE_CLEARINGHOUSE = 'healthcare_clearinghouse',
  /** Asociado de negocio */
  BUSINESS_ASSOCIATE = 'business_associate'
}

// ==================== ACCESS CONTROL ====================

/**
 * Roles de acceso HIPAA
 * @enum {string}
 */
export enum HIPAARole {
  /** Administrador de seguridad */
  SECURITY_ADMIN = 'security_admin',
  /** Oficial de privacidad */
  PRIVACY_OFFICER = 'privacy_officer',
  /** Proveedor de tratamiento */
  TREATMENT_PROVIDER = 'treatment_provider',
  /** Personal de pago */
  PAYMENT_STAFF = 'payment_staff',
  /** Personal de operaciones de salud */
  HEALTHCARE_OPERATIONS = 'healthcare_operations',
  /** Investigador autorizado */
  AUTHORIZED_RESEARCHER = 'authorized_researcher',
  /** Auditoria de compliance */
  COMPLIANCE_AUDITOR = 'compliance_auditor'
}

/**
 * Propósitos de uso de PHI bajo HIPAA
 * @enum {string}
 */
export enum PHIUsePurpose {
  /** Tratamiento médico */
  TREATMENT = 'treatment',
  /** Procesamiento de pagos */
  PAYMENT = 'payment',
  /** Operaciones de atención médica */
  HEALTHCARE_OPERATIONS = 'healthcare_operations',
  /** Divulgación requerida por ley */
  REQUIRED_BY_LAW = 'required_by_law',
  /** Salud pública */
  PUBLIC_HEALTH = 'public_health',
  /** Investigación autorizada */
  AUTHORIZED_RESEARCH = 'authorized_research',
  /** Emergencia de salud pública */
  PUBLIC_HEALTH_EMERGENCY = 'public_health_emergency'
}

// ==================== AUDIT TRAIL ====================

/**
 * Evento de auditoría HIPAA
 * @interface HIPAAAuditEvent
 */
export interface HIPAAAuditEvent {
  /** ID único del evento */
  eventId: string;
  /** Timestamp del evento */
  timestamp: Date;
  /** Tipo de evento */
  eventType: HIPAAAuditEventType;
  /** Usuario que realizó la acción */
  userId: UserId;
  /** Rol del usuario */
  userRole: HIPAARole;
  /** Paciente afectado */
  patientId?: PatientId;
  /** Recurso accedido */
  resourceType: HIPAAResourceType;
  /** ID del recurso */
  resourceId: string;
  /** Acción realizada */
  action: HIPAAAuditAction;
  /** Propósito del acceso */
  purpose: PHIUsePurpose;
  /** Resultado de la acción */
  outcome: 'success' | 'failure' | 'partial';
  /** Dirección IP de origen */
  sourceIP: string;
  /** User agent del cliente */
  userAgent?: string;
  /** Ubicación geográfica */
  location?: string;
  /** Duración de la sesión en segundos */
  sessionDuration?: number;
  /** Datos adicionales del evento */
  eventData?: Record<string, any>;
  /** Nivel de riesgo del evento */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Tipos de eventos de auditoría
 * @enum {string}
 */
export enum HIPAAAuditEventType {
  /** Acceso a datos */
  DATA_ACCESS = 'data_access',
  /** Modificación de datos */
  DATA_MODIFICATION = 'data_modification',
  /** Creación de datos */
  DATA_CREATE = 'data_create',
  /** Eliminación de datos */
  DATA_DELETE = 'data_delete',
  /** Exportación de datos */
  DATA_EXPORT = 'data_export',
  /** Impresión de datos */
  DATA_PRINT = 'data_print',
  /** Inicio de sesión */
  LOGIN = 'login',
  /** Cierre de sesión */
  LOGOUT = 'logout',
  /** Intento de acceso fallido */
  ACCESS_DENIED = 'access_denied',
  /** Cambio de permisos */
  PERMISSION_CHANGE = 'permission_change',
  /** Divulgación de datos */
  DATA_DISCLOSURE = 'data_disclosure'
}

/**
 * Tipos de recursos HIPAA
 * @enum {string}
 */
export enum HIPAAResourceType {
  /** Registro de paciente */
  PATIENT_RECORD = 'patient_record',
  /** Historia clínica */
  MEDICAL_RECORD = 'medical_record',
  /** Resultado de laboratorio */
  LAB_RESULT = 'lab_result',
  /** Imagen médica */
  MEDICAL_IMAGE = 'medical_image',
  /** Prescripción */
  PRESCRIPTION = 'prescription',
  /** Cita médica */
  APPOINTMENT = 'appointment',
  /** Facturación */
  BILLING_RECORD = 'billing_record',
  /** Comunicación */
  COMMUNICATION = 'communication'
}

/**
 * Acciones de auditoría
 * @enum {string}
 */
export enum HIPAAAuditAction {
  /** Leer/Ver */
  READ = 'read',
  /** Crear */
  CREATE = 'create',
  /** Actualizar */
  UPDATE = 'update',
  /** Eliminar */
  DELETE = 'delete',
  /** Buscar */
  SEARCH = 'search',
  /** Exportar */
  EXPORT = 'export',
  /** Imprimir */
  PRINT = 'print',
  /** Compartir */
  SHARE = 'share',
  /** Copiar */
  COPY = 'copy'
}

// ==================== MINIMUM NECESSARY RULE ====================

/**
 * Configuración de acceso mínimo necesario
 * @interface MinimumNecessaryConfig
 */
export interface MinimumNecessaryConfig {
  /** Rol del usuario */
  userRole: HIPAARole;
  /** Propósito del acceso */
  purpose: PHIUsePurpose;
  /** Campos permitidos */
  allowedFields: string[];
  /** Campos explícitamente denegados */
  deniedFields?: string[];
  /** Restricciones temporales */
  timeRestrictions?: {
    /** Acceso válido desde */
    validFrom?: Date;
    /** Acceso válido hasta */
    validUntil?: Date;
    /** Días de la semana permitidos */
    allowedDaysOfWeek?: number[];
    /** Horas permitidas */
    allowedHours?: {
      start: string;
      end: string;
    };
  };
  /** Restricciones de ubicación */
  locationRestrictions?: {
    /** IPs permitidas */
    allowedIPs?: string[];
    /** Países permitidos */
    allowedCountries?: string[];
    /** Requiere VPN */
    requiresVPN?: boolean;
  };
}

// ==================== BREACH DETECTION ====================

/**
 * Detección de violaciones de seguridad
 * @interface SecurityBreachEvent
 */
export interface SecurityBreachEvent {
  /** ID único de la violación */
  breachId: string;
  /** Timestamp de detección */
  detectedAt: Date;
  /** Tipo de violación */
  breachType: SecurityBreachType;
  /** Severidad de la violación */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Usuario involucrado */
  userId?: UserId;
  /** Pacientes afectados */
  affectedPatients: PatientId[];
  /** Descripción de la violación */
  description: string;
  /** Datos comprometidos */
  compromisedData: string[];
  /** Acciones tomadas */
  mitigationActions: string[];
  /** Estado de la investigación */
  investigationStatus: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  /** Requiere notificación */
  requiresNotification: boolean;
  /** Fecha límite para notificación */
  notificationDeadline?: Date;
  /** Autoridades a notificar */
  authoritiesToNotify?: string[];
}

/**
 * Tipos de violaciones de seguridad
 * @enum {string}
 */
export enum SecurityBreachType {
  /** Acceso no autorizado */
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  /** Divulgación inadecuada */
  IMPROPER_DISCLOSURE = 'improper_disclosure',
  /** Pérdida de datos */
  DATA_LOSS = 'data_loss',
  /** Robo de datos */
  DATA_THEFT = 'data_theft',
  /** Alteración no autorizada */
  UNAUTHORIZED_ALTERATION = 'unauthorized_alteration',
  /** Destrucción de datos */
  DATA_DESTRUCTION = 'data_destruction',
  /** Falla de encriptación */
  ENCRYPTION_FAILURE = 'encryption_failure',
  /** Violación de acceso mínimo */
  MINIMUM_NECESSARY_VIOLATION = 'minimum_necessary_violation'
}

// ==================== CONSENT MANAGEMENT ====================

/**
 * Consentimiento del paciente según HIPAA
 * @interface HIPAAConsent
 */
export interface HIPAAConsent {
  /** ID del consentimiento */
  consentId: string;
  /** ID del paciente */
  patientId: PatientId;
  /** Tipo de consentimiento */
  consentType: HIPAAConsentType;
  /** Estado del consentimiento */
  status: 'granted' | 'denied' | 'revoked' | 'expired';
  /** Fecha de otorgamiento */
  grantedAt: Date;
  /** Fecha de revocación */
  revokedAt?: Date;
  /** Fecha de expiración */
  expiresAt?: Date;
  /** Propósitos autorizados */
  authorizedPurposes: PHIUsePurpose[];
  /** Proveedores autorizados */
  authorizedProviders?: DoctorId[];
  /** Restricciones específicas */
  restrictions?: string[];
  /** Firma digital */
  digitalSignature?: string;
  /** Testigo */
  witness?: {
    name: string;
    signature: string;
    date: Date;
  };
  /** Versión del formulario de consentimiento */
  consentFormVersion: string;
}

/**
 * Tipos de consentimiento HIPAA
 * @enum {string}
 */
export enum HIPAAConsentType {
  /** Consentimiento general para tratamiento */
  TREATMENT_CONSENT = 'treatment_consent',
  /** Autorización para divulgación */
  DISCLOSURE_AUTHORIZATION = 'disclosure_authorization',
  /** Consentimiento para investigación */
  RESEARCH_CONSENT = 'research_consent',
  /** Autorización para marketing */
  MARKETING_AUTHORIZATION = 'marketing_authorization',
  /** Consentimiento para fundraising */
  FUNDRAISING_CONSENT = 'fundraising_consent',
  /** Directiva de privacidad */
  PRIVACY_DIRECTIVE = 'privacy_directive'
}

// ==================== SCHEMAS ====================

/**
 * Schema para evento de auditoría HIPAA
 */
export const HIPAAAuditEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.date(),
  eventType: z.nativeEnum(HIPAAAuditEventType),
  userId: z.string(),
  userRole: z.nativeEnum(HIPAARole),
  patientId: z.string().optional(),
  resourceType: z.nativeEnum(HIPAAResourceType),
  resourceId: z.string(),
  action: z.nativeEnum(HIPAAAuditAction),
  purpose: z.nativeEnum(PHIUsePurpose),
  outcome: z.enum(['success', 'failure', 'partial']),
  sourceIP: z.string().ip(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical'])
});

/**
 * Schema para violación de seguridad
 */
export const SecurityBreachEventSchema = z.object({
  breachId: z.string(),
  detectedAt: z.date(),
  breachType: z.nativeEnum(SecurityBreachType),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedPatients: z.array(z.string()),
  description: z.string(),
  compromisedData: z.array(z.string()),
  investigationStatus: z.enum(['pending', 'in_progress', 'resolved', 'escalated']),
  requiresNotification: z.boolean()
});