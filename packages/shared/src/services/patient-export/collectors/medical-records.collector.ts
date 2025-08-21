import type { DataCategory } from '../types';
import { BaseCollector } from './base.collector';

/**
 * Medical Records Collector
 * Handles collection of medical history and medical records data
 * Extracted from lines 444-473 of original PatientDataExportService
 */

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: Date;
  type: string;
  description: string;
  value?: string;
  providerId: string;
  providerName: string;
  facilityId?: string;
  facilityName?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class MedicalRecordsCollector extends BaseCollector<MedicalRecord> {
  protected readonly collectionName = 'medical_records';
  protected readonly category: DataCategory = 'medical_records';
  protected readonly dateField = 'date';

  /**
   * Enhanced validation for medical records
   */
  override validate(data: MedicalRecord[]): boolean {
    if (!super.validate(data)) {
      return false;
    }

    return data.every((record) => {
      return (
        record.id &&
        record.patientId &&
        record.date instanceof Date &&
        record.type &&
        record.description &&
        record.providerId &&
        record.status &&
        ['active', 'resolved', 'inactive'].includes(record.status)
      );
    });
  }

  /**
   * Sanitize medical records for export
   * Removes sensitive internal metadata while preserving medical data
   */
  override sanitize(data: MedicalRecord[]): MedicalRecord[] {
    return data.map((record) => ({
      ...record,
      // Ensure dates are properly formatted
      date: record.date instanceof Date ? record.date : new Date(record.date),
      createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
      // Remove sensitive internal metadata
      metadata: this.sanitizeMetadata(record.metadata),
    }));
  }

  /**
   * Enhanced document transformation for medical records
   */
  protected override transformDocument(id: string, data: any): MedicalRecord {
    return {
      id,
      patientId: data.patientId,
      date: data.date?.toDate?.() || new Date(data.date),
      type: data.type || 'general',
      description: data.description || '',
      value: data.value,
      providerId: data.providerId || '',
      providerName: data.providerName || '',
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      chiefComplaint: data.chiefComplaint,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      followUp: data.followUp,
      severity: data.severity || 'medium',
      status: data.status || 'active',
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      metadata: data.metadata,
    };
  }

  /**
   * Get mock medical records for development
   */
  protected override getMockData(patientId: string): MedicalRecord[] {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-record-1',
        patientId,
        date: lastWeek,
        type: 'consultation',
        description: 'Consulta de rutina - Control general',
        providerId: 'mock-doctor-1',
        providerName: 'Dr. Juan Pérez',
        facilityId: 'mock-facility-1',
        facilityName: 'Centro Médico Central',
        chiefComplaint: 'Control de salud general',
        diagnosis: 'Paciente en buen estado general',
        treatment: 'Continuar con hábitos saludables',
        followUp: 'Control en 6 meses',
        severity: 'low',
        status: 'active',
        createdAt: lastWeek,
        updatedAt: lastWeek,
      },
      {
        id: 'mock-record-2',
        patientId,
        date: lastMonth,
        type: 'emergency',
        description: 'Consulta de emergencia - Dolor abdominal',
        providerId: 'mock-doctor-2',
        providerName: 'Dra. María González',
        facilityId: 'mock-facility-2',
        facilityName: 'Hospital de Emergencias',
        chiefComplaint: 'Dolor abdominal agudo',
        diagnosis: 'Gastritis aguda',
        treatment: 'Medicación antiespasmódica y dieta',
        followUp: 'Control en 48 horas',
        severity: 'medium',
        status: 'resolved',
        createdAt: lastMonth,
        updatedAt: lastMonth,
      },
    ];
  }

  /**
   * Sanitize metadata removing sensitive information
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    
    // Remove potentially sensitive fields
    delete sanitized.internalNotes;
    delete sanitized.staffComments;
    delete sanitized.billingCodes;
    delete sanitized.insuranceInfo;
    
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Collect medical records with enhanced error handling
   */
  override async collect(patientId: string, dateRange?: { from: Date; to: Date }): Promise<MedicalRecord[]> {
    this.checkExportEnabled();

    if (this.shouldUseMockData()) {
      return this.getMockData(patientId);
    }

    return super.collect(patientId, dateRange);
  }
}

// Export singleton instance
export const medicalRecordsCollector = new MedicalRecordsCollector();