/**
 * @fileoverview Tipos para historias clínicas y registros médicos
 * @module @altamedica/types/medical/clinical/medical-record
 * @description Definiciones de tipos para el sistema de historias clínicas con compliance HIPAA
 */

import { z } from 'zod';
import { BaseEntity } from '../../core/base.types';
import { PatientId, DoctorId, MedicalRecordId, ICD10Code, ProtectedHealthInfo } from '../../core/branded.types';

// ==================== ENUMS ====================

/**
 * Tipos de registro médico
 * @enum {string}
 */
export enum MedicalRecordType {
  /** Consulta médica */
  CONSULTATION = 'consultation',
  /** Resultado de laboratorio */
  LAB_RESULT = 'lab_result',
  /** Estudio de imagen */
  IMAGING_STUDY = 'imaging_study',
  /** Prescripción médica */
  PRESCRIPTION = 'prescription',
  /** Procedimiento realizado */
  PROCEDURE = 'procedure',
  /** Nota de evolución */
  PROGRESS_NOTE = 'progress_note',
  /** Resumen de alta */
  DISCHARGE_SUMMARY = 'discharge_summary',
  /** Historia clínica inicial */
  INITIAL_ASSESSMENT = 'initial_assessment',
  /** Nota de enfermería */
  NURSING_NOTE = 'nursing_note',
  /** Reporte quirúrgico */
  SURGICAL_REPORT = 'surgical_report',
  /** Evaluación de emergencia */
  EMERGENCY_ASSESSMENT = 'emergency_assessment',
  /** Consentimiento informado */
  INFORMED_CONSENT = 'informed_consent'
}

/**
 * Estado del registro médico
 * @enum {string}
 */
export enum RecordStatus {
  /** Borrador */
  DRAFT = 'draft',
  /** Pendiente de revisión */
  PENDING_REVIEW = 'pending_review',
  /** Finalizado */
  FINALIZED = 'finalized',
  /** Enmendado */
  AMENDED = 'amended',
  /** Anulado */
  VOIDED = 'voided',
  /** Archivado */
  ARCHIVED = 'archived'
}

/**
 * Nivel de confidencialidad
 * @enum {string}
 */
export enum ConfidentialityLevel {
  /** Información normal */
  NORMAL = 'normal',
  /** Información sensible */
  SENSITIVE = 'sensitive',
  /** Información muy sensible */
  HIGHLY_SENSITIVE = 'highly_sensitive',
  /** Restringido */
  RESTRICTED = 'restricted'
}

// ==================== INTERFACES ====================

/**
 * Anexo/archivo adjunto
 * @interface MedicalAttachment
 */
export interface MedicalAttachment {
  /** ID único del archivo */
  id: string;
  /** Nombre del archivo */
  fileName: string;
  /** Tipo MIME */
  mimeType: string;
  /** Tamaño en bytes */
  size: number;
  /** URL de descarga (temporal) */
  url?: string;
  /** Tipo de documento */
  documentType: 'lab_result' | 'imaging' | 'report' | 'consent' | 'other';
  /** Descripción */
  description?: string;
  /** Fecha de carga */
  uploadedAt: Date;
  /** Cargado por */
  uploadedBy: string;
  /** Está encriptado */
  isEncrypted: boolean;
}

/**
 * Anotación/nota en el registro
 * @interface ClinicalNote
 */
export interface ClinicalNote {
  /** Tipo de nota */
  type: 'subjective' | 'objective' | 'assessment' | 'plan';
  /** Contenido de la nota */
  content: string;
  /** Autor de la nota */
  author: string;
  /** Rol del autor */
  authorRole: string;
  /** Timestamp */
  timestamp: Date;
  /** Está firmada digitalmente */
  isSigned: boolean;
  /** Firma digital */
  digitalSignature?: string;
}

/**
 * Enmienda al registro
 * @interface RecordAmendment
 */
export interface RecordAmendment {
  /** ID de la enmienda */
  id: string;
  /** Razón de la enmienda */
  reason: string;
  /** Descripción de cambios */
  description: string;
  /** Contenido original */
  originalContent: any;
  /** Contenido enmendado */
  amendedContent: any;
  /** Autor de la enmienda */
  amendedBy: string;
  /** Fecha de la enmienda */
  amendedAt: Date;
  /** Aprobado por */
  approvedBy?: string;
  /** Fecha de aprobación */
  approvedAt?: Date;
}

/**
 * Acceso al registro médico
 * @interface RecordAccess
 */
export interface RecordAccess {
  /** Usuario que accedió */
  userId: string;
  /** Rol del usuario */
  userRole: string;
  /** Tipo de acceso */
  accessType: 'view' | 'edit' | 'print' | 'download' | 'share';
  /** Timestamp del acceso */
  accessedAt: Date;
  /** IP desde donde se accedió */
  ipAddress: string;
  /** Razón del acceso */
  accessReason?: string;
  /** Duración del acceso en segundos */
  duration?: number;
}

/**
 * Historia clínica completa
 * @interface MedicalRecord
 * @extends BaseEntity
 * @hipaa-compliant true
 */
export interface MedicalRecord extends BaseEntity {
  /** ID único del registro (branded type) */
  id: MedicalRecordId;
  /** ID del paciente */
  patientId: PatientId;
  /** ID del doctor/profesional */
  providerId: DoctorId;
  /** Número de episodio */
  episodeNumber?: string;
  
  // Tipo y estado
  /** Tipo de registro */
  type: MedicalRecordType;
  /** Estado del registro */
  status: RecordStatus;
  /** Nivel de confidencialidad */
  confidentiality: ConfidentialityLevel;
  
  // Información clínica
  /** Título del registro */
  title: string;
  /** Resumen ejecutivo */
  summary?: string;
  /** Notas clínicas estructuradas */
  clinicalNotes: ClinicalNote[];
  /** Contenido principal (encriptado si es PHI) */
  content: ProtectedHealthInfo;
  
  // Códigos y clasificaciones
  /** Diagnósticos (ICD-10) */
  diagnoses?: DiagnosisRecord[];
  /** Procedimientos realizados */
  procedures?: ProcedureRecord[];
  /** Medicamentos administrados */
  medications?: MedicationRecord[];
  
  // Archivos adjuntos
  /** Documentos adjuntos */
  attachments: MedicalAttachment[];
  
  // Firma y validación
  /** Firmado por */
  signedBy?: string;
  /** Fecha de firma */
  signedAt?: Date;
  /** Firma digital */
  digitalSignature?: string;
  /** Requiere contrafirma */
  requiresCountersignature: boolean;
  /** Contrafirmado por */
  countersignedBy?: string;
  
  // Control de versiones
  /** Número de versión */
  version: number;
  /** Es la versión actual */
  isCurrent: boolean;
  /** ID de versión anterior */
  previousVersionId?: MedicalRecordId;
  /** Enmiendas realizadas */
  amendments: RecordAmendment[];
  
  // Auditoría y acceso
  /** Registro de accesos */
  accessLog: RecordAccess[];
  /** Última visualización */
  lastViewedAt?: Date;
  /** Última visualización por */
  lastViewedBy?: string;
  
  // Referencias
  /** ID de cita relacionada */
  appointmentId?: string;
  /** ID de admisión (si aplica) */
  admissionId?: string;
  /** IDs de registros relacionados */
  relatedRecordIds?: MedicalRecordId[];
  
  // Metadatos adicionales
  /** Ubicación donde se creó */
  createdAtLocation?: string;
  /** Departamento/Servicio */
  department?: string;
  /** Plantilla utilizada */
  templateId?: string;
  /** Tags para búsqueda */
  tags?: string[];
}

/**
 * Registro de diagnóstico
 * @interface DiagnosisRecord
 */
export interface DiagnosisRecord {
  /** Código ICD-10 */
  code: ICD10Code;
  /** Descripción del diagnóstico */
  description: string;
  /** Tipo de diagnóstico */
  type: 'principal' | 'secondary' | 'complication' | 'comorbidity';
  /** Estado del diagnóstico */
  status: 'active' | 'resolved' | 'chronic' | 'remission';
  /** Fecha de diagnóstico */
  diagnosedAt: Date;
  /** Diagnosticado por */
  diagnosedBy: string;
  /** Severidad */
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  /** Notas adicionales */
  notes?: string;
}

/**
 * Registro de procedimiento
 * @interface ProcedureRecord
 */
export interface ProcedureRecord {
  /** Código CPT */
  cptCode?: string;
  /** Nombre del procedimiento */
  name: string;
  /** Descripción detallada */
  description?: string;
  /** Fecha y hora de inicio */
  startTime: Date;
  /** Fecha y hora de fin */
  endTime?: Date;
  /** Realizado por */
  performedBy: string;
  /** Asistido por */
  assistedBy?: string[];
  /** Ubicación */
  location?: string;
  /** Hallazgos */
  findings?: string;
  /** Complicaciones */
  complications?: string;
  /** Exitoso */
  wasSuccessful: boolean;
}

/**
 * Registro de medicación
 * @interface MedicationRecord
 */
export interface MedicationRecord {
  /** Código NDC */
  ndcCode?: string;
  /** Nombre del medicamento */
  name: string;
  /** Dosis administrada */
  dosage: string;
  /** Vía de administración */
  route: string;
  /** Frecuencia */
  frequency?: string;
  /** Administrado por */
  administeredBy: string;
  /** Fecha y hora de administración */
  administeredAt: Date;
  /** Reacción adversa */
  adverseReaction?: string;
  /** Notas */
  notes?: string;
}

/**
 * Plantilla de historia clínica
 * @interface MedicalRecordTemplate
 */
export interface MedicalRecordTemplate {
  /** ID de la plantilla */
  id: string;
  /** Nombre de la plantilla */
  name: string;
  /** Tipo de registro al que aplica */
  recordType: MedicalRecordType;
  /** Especialidad médica */
  specialty?: string;
  /** Secciones de la plantilla */
  sections: TemplateSection[];
  /** Activa */
  isActive: boolean;
  /** Versión */
  version: string;
}

/**
 * Sección de plantilla
 * @interface TemplateSection
 */
export interface TemplateSection {
  /** Título de la sección */
  title: string;
  /** Descripción */
  description?: string;
  /** Es requerida */
  isRequired: boolean;
  /** Orden de aparición */
  order: number;
  /** Campos de la sección */
  fields: TemplateField[];
}

/**
 * Campo de plantilla
 * @interface TemplateField
 */
export interface TemplateField {
  /** Nombre del campo */
  name: string;
  /** Etiqueta visible */
  label: string;
  /** Tipo de campo */
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  /** Es requerido */
  isRequired: boolean;
  /** Valor por defecto */
  defaultValue?: any;
  /** Opciones (para select/radio) */
  options?: string[];
  /** Validaciones */
  validations?: FieldValidation[];
}

/**
 * Validación de campo
 * @interface FieldValidation
 */
export interface FieldValidation {
  /** Tipo de validación */
  type: 'min' | 'max' | 'pattern' | 'custom';
  /** Valor de la validación */
  value: any;
  /** Mensaje de error */
  errorMessage: string;
}

// ==================== SCHEMAS ====================

/**
 * Schema de validación para historia clínica
 */
export const MedicalRecordSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  providerId: z.string(),
  type: z.nativeEnum(MedicalRecordType),
  status: z.nativeEnum(RecordStatus),
  confidentiality: z.nativeEnum(ConfidentialityLevel),
  title: z.string(),
  content: z.string(),
  version: z.number().positive(),
  isCurrent: z.boolean(),
  requiresCountersignature: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema para crear historia clínica
 */
export const CreateMedicalRecordSchema = MedicalRecordSchema.omit({
  id: true,
  version: true,
  isCurrent: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Schema para actualizar historia clínica
 */
export const UpdateMedicalRecordSchema = CreateMedicalRecordSchema.partial();