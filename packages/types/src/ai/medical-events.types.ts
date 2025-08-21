/**
 * @fileoverview Tipos para eventos del sistema médico
 * @module @altamedica/types/ai/medical-events
 * @description Sistema de eventos para comunicación entre componentes médicos
 */

import { z } from 'zod';
import { PatientId, DoctorId, AppointmentId, MedicalRecordId } from '../core/branded.types';

// ==================== BASE EVENT TYPES ====================

/**
 * Evento base del sistema médico
 * @interface BaseMedicalEvent
 * @template T - Tipo de payload del evento
 */
export interface BaseMedicalEvent<T = any> {
  /** ID único del evento */
  id: string;
  /** Tipo del evento */
  type: MedicalEventType;
  /** Timestamp de creación */
  timestamp: Date;
  /** Fuente que generó el evento */
  source: EventSource;
  /** Versión del esquema de evento */
  version: string;
  /** Datos del evento */
  payload: T;
  /** Metadatos adicionales */
  metadata: EventMetadata;
  /** Contexto médico */
  medicalContext?: MedicalContext;
}

/**
 * Metadatos del evento
 * @interface EventMetadata
 */
export interface EventMetadata {
  /** ID de correlación para tracking */
  correlationId?: string;
  /** ID de la sesión de usuario */
  sessionId?: string;
  /** Usuario que causó el evento */
  causedBy?: string;
  /** Nivel de prioridad */
  priority: EventPriority;
  /** Tags para categorización */
  tags?: string[];
  /** TTL del evento en milisegundos */
  ttl?: number;
  /** Requiere acknowledgment */
  requiresAck?: boolean;
}

/**
 * Contexto médico del evento
 * @interface MedicalContext
 */
export interface MedicalContext {
  /** ID del paciente involucrado */
  patientId?: PatientId;
  /** ID del doctor involucrado */
  doctorId?: DoctorId;
  /** ID de la cita relacionada */
  appointmentId?: AppointmentId;
  /** ID del registro médico */
  medicalRecordId?: MedicalRecordId;
  /** Departamento médico */
  department?: string;
  /** Ubicación física */
  location?: string;
  /** Especialidad médica */
  specialty?: string;
}

// ==================== ENUMS ====================

/**
 * Tipos de eventos médicos
 * @enum {string}
 */
export enum MedicalEventType {
  // Eventos de paciente
  PATIENT_CREATED = 'patient.created',
  PATIENT_UPDATED = 'patient.updated',
  PATIENT_DELETED = 'patient.deleted',
  PATIENT_ADMITTED = 'patient.admitted',
  PATIENT_DISCHARGED = 'patient.discharged',
  
  // Eventos de citas
  APPOINTMENT_SCHEDULED = 'appointment.scheduled',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',
  APPOINTMENT_STARTED = 'appointment.started',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment.rescheduled',
  
  // Eventos de historia clínica
  MEDICAL_RECORD_CREATED = 'medical_record.created',
  MEDICAL_RECORD_UPDATED = 'medical_record.updated',
  MEDICAL_RECORD_SIGNED = 'medical_record.signed',
  MEDICAL_RECORD_ACCESSED = 'medical_record.accessed',
  
  // Eventos de prescripción
  PRESCRIPTION_CREATED = 'prescription.created',
  PRESCRIPTION_DISPENSED = 'prescription.dispensed',
  PRESCRIPTION_CANCELLED = 'prescription.cancelled',
  
  // Eventos de laboratorio
  LAB_ORDER_CREATED = 'lab_order.created',
  LAB_RESULT_AVAILABLE = 'lab_result.available',
  LAB_RESULT_CRITICAL = 'lab_result.critical',
  
  // Eventos de alertas médicas
  ALLERGY_ALERT = 'alert.allergy',
  DRUG_INTERACTION_ALERT = 'alert.drug_interaction',
  CRITICAL_VALUE_ALERT = 'alert.critical_value',
  
  // Eventos de telemedicina
  VIDEO_CALL_STARTED = 'video_call.started',
  VIDEO_CALL_ENDED = 'video_call.ended',
  VIDEO_CALL_FAILED = 'video_call.failed',
  
  // Eventos de facturación
  BILLING_CREATED = 'billing.created',
  PAYMENT_RECEIVED = 'payment.received',
  INSURANCE_CLAIM_SUBMITTED = 'insurance.claim_submitted',
  
  // Eventos de sistema
  SYSTEM_BACKUP_COMPLETED = 'system.backup_completed',
  SYSTEM_MAINTENANCE_START = 'system.maintenance_start',
  SYSTEM_MAINTENANCE_END = 'system.maintenance_end',
  
  // Eventos de seguridad
  SECURITY_BREACH_DETECTED = 'security.breach_detected',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  DATA_EXPORT_REQUESTED = 'security.data_export_requested'
}

/**
 * Fuentes de eventos
 * @enum {string}
 */
export enum EventSource {
  // Aplicaciones
  WEB_APP = 'web_app',
  MOBILE_APP = 'mobile_app',
  ADMIN_PANEL = 'admin_panel',
  API_SERVER = 'api_server',
  
  // Servicios médicos
  EHR_SYSTEM = 'ehr_system',
  LAB_SYSTEM = 'lab_system',
  PHARMACY_SYSTEM = 'pharmacy_system',
  IMAGING_SYSTEM = 'imaging_system',
  
  // Dispositivos médicos
  VITAL_SIGNS_MONITOR = 'vital_signs_monitor',
  ECG_MACHINE = 'ecg_machine',
  BLOOD_PRESSURE_MONITOR = 'bp_monitor',
  
  // Sistemas externos
  INSURANCE_PROVIDER = 'insurance_provider',
  GOVERNMENT_SYSTEM = 'government_system',
  THIRD_PARTY_API = 'third_party_api',
  
  // Automatización
  SCHEDULED_JOB = 'scheduled_job',
  AI_SYSTEM = 'ai_system',
  RULE_ENGINE = 'rule_engine'
}

/**
 * Prioridades de evento
 * @enum {string}
 */
export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// ==================== SPECIFIC EVENT PAYLOADS ====================

/**
 * Payload para eventos de paciente
 * @interface PatientEventPayload
 */
export interface PatientEventPayload {
  /** ID del paciente */
  patientId: PatientId;
  /** Datos del paciente (parciales o completos) */
  patientData?: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    medicalRecordNumber: string;
    insuranceInfo: any;
  }>;
  /** Cambios realizados (para updates) */
  changes?: Record<string, { oldValue: any; newValue: any }>;
  /** Razón del cambio */
  reason?: string;
}

/**
 * Payload para eventos de cita
 * @interface AppointmentEventPayload
 */
export interface AppointmentEventPayload {
  /** ID de la cita */
  appointmentId: AppointmentId;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor */
  doctorId: DoctorId;
  /** Fecha y hora de la cita */
  scheduledDate: Date;
  /** Tipo de cita */
  appointmentType: string;
  /** Estado anterior (para cambios) */
  previousStatus?: string;
  /** Estado nuevo */
  newStatus?: string;
  /** Razón del cambio */
  reason?: string;
  /** Información adicional */
  additionalInfo?: Record<string, any>;
}

/**
 * Payload para eventos de alerta médica
 * @interface MedicalAlertPayload
 */
export interface MedicalAlertPayload {
  /** Tipo de alerta */
  alertType: 'allergy' | 'drug_interaction' | 'critical_value' | 'contraindication';
  /** Severidad de la alerta */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Mensaje de la alerta */
  message: string;
  /** Paciente afectado */
  patientId: PatientId;
  /** Datos específicos de la alerta */
  alertData: {
    /** Medicamento/sustancia involucrada */
    substance?: string;
    /** Valor crítico */
    criticalValue?: {
      parameter: string;
      value: number;
      unit: string;
      normalRange: string;
    };
    /** Interacción detectada */
    interaction?: {
      drug1: string;
      drug2: string;
      interactionType: string;
    };
  };
  /** Acciones recomendadas */
  recommendedActions: string[];
  /** Se requiere intervención inmediata */
  requiresImmediateAction: boolean;
}

/**
 * Payload para eventos de resultado de laboratorio
 * @interface LabResultEventPayload
 */
export interface LabResultEventPayload {
  /** ID del resultado */
  resultId: string;
  /** ID del paciente */
  patientId: PatientId;
  /** Nombre del estudio */
  testName: string;
  /** Código del estudio */
  testCode?: string;
  /** Valor del resultado */
  value: string | number;
  /** Unidad */
  unit?: string;
  /** Rango de referencia */
  referenceRange?: string;
  /** Es valor crítico */
  isCritical: boolean;
  /** Estado del resultado */
  status: 'normal' | 'abnormal' | 'critical';
  /** Médico solicitante */
  orderingPhysician: DoctorId;
  /** Laboratorio */
  laboratory: string;
  /** Fecha de recolección */
  collectionDate: Date;
  /** Fecha de resultado */
  resultDate: Date;
}

/**
 * Payload para eventos de prescripción
 * @interface PrescriptionEventPayload
 */
export interface PrescriptionEventPayload {
  /** ID de la prescripción */
  prescriptionId: string;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor */
  doctorId: DoctorId;
  /** Medicamentos prescritos */
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  /** Farmacia */
  pharmacy?: string;
  /** Estado de la prescripción */
  status: 'pending' | 'dispensed' | 'cancelled';
  /** Notas especiales */
  notes?: string;
}

/**
 * Payload para eventos de telemedicina
 * @interface TelemedicineEventPayload
 */
export interface TelemedicineEventPayload {
  /** ID de la sesión */
  sessionId: string;
  /** ID de la cita */
  appointmentId: AppointmentId;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor */
  doctorId: DoctorId;
  /** Plataforma utilizada */
  platform: string;
  /** URL de la reunión */
  meetingUrl?: string;
  /** Duración en minutos */
  duration?: number;
  /** Calidad de la conexión */
  connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  /** Razón de finalización/falla */
  reason?: string;
  /** Métricas técnicas */
  technicalMetrics?: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
  };
}

// ==================== EVENT HANDLERS ====================

/**
 * Handler de eventos médicos
 * @interface MedicalEventHandler
 * @template T - Tipo de payload del evento
 */
export interface MedicalEventHandler<T = any> {
  /** Tipo de evento que maneja */
  eventType: MedicalEventType;
  /** Función handler */
  handle: (event: BaseMedicalEvent<T>) => Promise<void> | void;
  /** Filtros opcionales */
  filters?: EventFilters;
  /** Configuración del handler */
  config?: HandlerConfig;
}

/**
 * Filtros para eventos
 * @interface EventFilters
 */
export interface EventFilters {
  /** Filtrar por fuente */
  source?: EventSource[];
  /** Filtrar por prioridad mínima */
  minPriority?: EventPriority;
  /** Filtrar por paciente */
  patientId?: PatientId;
  /** Filtrar por doctor */
  doctorId?: DoctorId;
  /** Filtrar por tags */
  tags?: string[];
  /** Filtro personalizado */
  customFilter?: (event: BaseMedicalEvent) => boolean;
}

/**
 * Configuración del handler
 * @interface HandlerConfig
 */
export interface HandlerConfig {
  /** Máximo número de reintentos */
  maxRetries?: number;
  /** Delay entre reintentos en ms */
  retryDelay?: number;
  /** Timeout en ms */
  timeout?: number;
  /** Procesamiento paralelo */
  parallel?: boolean;
  /** Dead letter queue */
  deadLetterQueue?: boolean;
}

// ==================== EVENT BUS ====================

/**
 * Configuración del bus de eventos
 * @interface EventBusConfig
 */
export interface EventBusConfig {
  /** Tamaño máximo de la cola */
  maxQueueSize?: number;
  /** Persistir eventos */
  persistent?: boolean;
  /** Ordenamiento de eventos */
  ordered?: boolean;
  /** Durabilidad */
  durable?: boolean;
  /** Configuración de retry */
  retryConfig?: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * Métricas del bus de eventos
 * @interface EventBusMetrics
 */
export interface EventBusMetrics {
  /** Total de eventos procesados */
  totalProcessed: number;
  /** Eventos exitosos */
  successful: number;
  /** Eventos fallidos */
  failed: number;
  /** Eventos en cola */
  queued: number;
  /** Tiempo promedio de procesamiento */
  avgProcessingTime: number;
  /** Throughput (eventos/segundo) */
  throughput: number;
  /** Última actualización de métricas */
  lastUpdated: Date;
}

// ==================== SPECIALIZED EVENTS ====================

/**
 * Evento de emergencia médica
 * @interface MedicalEmergencyEvent
 */
export interface MedicalEmergencyEvent extends BaseMedicalEvent<{
  /** Tipo de emergencia */
  emergencyType: 'cardiac_arrest' | 'respiratory_failure' | 'severe_bleeding' | 'anaphylaxis' | 'other';
  /** Ubicación de la emergencia */
  location: string;
  /** Nivel de severidad */
  severity: 1 | 2 | 3 | 4 | 5;
  /** Recursos requeridos */
  requiredResources: string[];
  /** Tiempo estimado de respuesta */
  estimatedResponseTime?: number;
  /** Personal notificado */
  notifiedPersonnel: DoctorId[];
}> {
  type: MedicalEventType.CRITICAL_VALUE_ALERT;
  metadata: EventMetadata & {
    priority: EventPriority.EMERGENCY;
    requiresAck: true;
  };
}

/**
 * Evento de cumplimiento regulatorio
 * @interface ComplianceEvent
 */
export interface ComplianceEvent extends BaseMedicalEvent<{
  /** Tipo de compliance */
  complianceType: 'hipaa' | 'gdpr' | 'fda' | 'joint_commission';
  /** Acción de compliance */
  action: 'audit_log' | 'data_access' | 'consent_obtained' | 'data_breach';
  /** Detalles del evento */
  details: Record<string, any>;
  /** Requiere reporte */
  requiresReporting: boolean;
  /** Fecha límite para acción */
  actionDeadline?: Date;
}> {
  metadata: EventMetadata & {
    tags: ['compliance'];
  };
}

// ==================== SCHEMAS ====================

/**
 * Schema para evento médico base
 */
export const BaseMedicalEventSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(MedicalEventType),
  timestamp: z.date(),
  source: z.nativeEnum(EventSource),
  version: z.string(),
  payload: z.any(),
  metadata: z.object({
    correlationId: z.string().optional(),
    sessionId: z.string().optional(),
    causedBy: z.string().optional(),
    priority: z.nativeEnum(EventPriority),
    tags: z.array(z.string()).optional(),
    ttl: z.number().optional(),
    requiresAck: z.boolean().optional()
  }),
  medicalContext: z.object({
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    appointmentId: z.string().optional(),
    medicalRecordId: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    specialty: z.string().optional()
  }).optional()
});

/**
 * Schema para payload de alerta médica
 */
export const MedicalAlertPayloadSchema = z.object({
  alertType: z.enum(['allergy', 'drug_interaction', 'critical_value', 'contraindication']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  patientId: z.string(),
  alertData: z.record(z.any()),
  recommendedActions: z.array(z.string()),
  requiresImmediateAction: z.boolean()
});