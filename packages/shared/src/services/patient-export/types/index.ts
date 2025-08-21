import type { Timestamp } from 'firebase/firestore';

// Base interfaces for data collection
export interface DataCollector<T = any> {
  collect(patientId: string, dateRange?: DateRange): Promise<T[]>;
  validate(data: T[]): boolean;
  sanitize(data: T[]): T[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Export-related types (extracted from original service)
export interface ExportRequest {
  id: string;
  patientId: string;
  requestedBy: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: ExportFormat;
  scope: ExportScope;
  dateRange?: DateRange;
  includeOptions: ExportOptions;
  exportOptions?: any; // Added for compatibility with orchestrator
  completedDate?: Date;
  downloadUrl?: string;
  expirationDate?: Date;
  fileSize?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ExportFormat {
  type: 'json' | 'pdf' | 'csv' | 'zip' | 'fhir';
  includeImages: boolean;
  includeDocuments: boolean;
  language: 'es' | 'en' | 'pt';
}

export interface ExportScope {
  includeAll: boolean;
  categories?: DataCategory[];
  specificRecords?: string[];
}

export interface ExportOptions {
  includeMedicalHistory: boolean;
  includeLabResults: boolean;
  includePrescriptions: boolean;
  includeAppointments: boolean;
  includeVitalSigns: boolean;
  includeImmunizations: boolean;
  includeAllergies: boolean;
  includeProcedures: boolean;
  includeDiagnoses: boolean;
  includeNotes: boolean;
  includeImages: boolean;
  includeDocuments: boolean;
  includeBilling: boolean;
  includeConsents: boolean;
  includeAuditLogs: boolean;
}

export type DataCategory =
  | 'medical_records'
  | 'lab_results'
  | 'prescriptions'
  | 'appointments'
  | 'vital_signs'
  | 'immunizations'
  | 'allergies'
  | 'procedures'
  | 'diagnoses'
  | 'clinical_notes'
  | 'imaging'
  | 'documents'
  | 'billing'
  | 'consents'
  | 'audit_logs';

export interface PatientDataPackage {
  exportId: string;
  patientInfo: PatientInfo;
  medicalData: MedicalData;
  metadata: ExportMetadata;
  compliance: ComplianceInfo;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  emergencyContacts?: any[];
  insurance?: any[];
}

export interface MedicalData {
  medicalHistory?: any[];
  labResults?: any[];
  prescriptions?: any[];
  appointments?: any[];
  vitalSigns?: any[];
  immunizations?: any[];
  allergies?: any[];
  procedures?: any[];
  diagnoses?: any[];
  clinicalNotes?: any[];
  images?: any[];
  documents?: any[];
  billing?: any[];
  consents?: any[];
  auditLogs?: any[];
}

export interface ExportMetadata {
  exportDate: Date;
  exportVersion: string;
  dataRange?: DateRange;
  totalRecords: number;
  categories: string[];
  format: string;
  checksum: string;
  encrypted: boolean;
}

export interface ComplianceInfo {
  hipaaCompliant: boolean;
  ley26529Compliant: boolean;
  dataMinimization: boolean;
  patientConsent: boolean;
  auditLogged: boolean;
  encryptionUsed: boolean;
  retentionPeriod: string;
}

// Generator interfaces
export interface ExportGenerator {
  generate(dataPackage: PatientDataPackage, exportDir: string): Promise<string>;
  getFileExtension(): string;
  getSupportedLanguages(): string[];
}

export interface ExportResult {
  url: string;
  size: number;
  checksum?: string;
}

// Collection result interface
export interface CollectionResult<T = any> {
  data: T[];
  category: DataCategory;
  recordCount: number;
  collectedAt: Date;
}