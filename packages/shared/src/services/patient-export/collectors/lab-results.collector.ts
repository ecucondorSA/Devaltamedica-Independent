import type { DataCategory } from '../types';
import { BaseCollector } from './base.collector';

/**
 * Lab Results Collector
 * Handles collection of laboratory test results
 * Extracted from lines 478-505 of original PatientDataExportService
 */

export interface LabResult {
  id: string;
  patientId: string;
  resultDate: Date;
  testName: string;
  testCode: string;
  category: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  flag?: 'high' | 'low' | 'critical';
  providerId: string;
  providerName: string;
  labId: string;
  labName: string;
  orderDate: Date;
  collectionDate: Date;
  performedDate: Date;
  notes?: string;
  methodology?: string;
  equipment?: string;
  technician?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LabResultsCollector extends BaseCollector<LabResult> {
  protected readonly collectionName = 'lab_results';
  protected readonly category: DataCategory = 'lab_results';
  protected readonly dateField = 'resultDate';

  /**
   * Enhanced validation for lab results
   */
  override validate(data: LabResult[]): boolean {
    if (!super.validate(data)) {
      return false;
    }

    return data.every((result) => {
      return (
        result.id &&
        result.patientId &&
        result.resultDate instanceof Date &&
        result.testName &&
        result.testCode &&
        result.value !== undefined &&
        result.unit &&
        result.status &&
        ['normal', 'abnormal', 'critical', 'pending'].includes(result.status) &&
        result.providerId &&
        result.labId &&
        typeof result.verified === 'boolean'
      );
    });
  }

  /**
   * Sanitize lab results for export
   */
  override sanitize(data: LabResult[]): LabResult[] {
    return data.map((result) => ({
      ...result,
      // Ensure dates are properly formatted
      resultDate: result.resultDate instanceof Date ? result.resultDate : new Date(result.resultDate),
      orderDate: result.orderDate instanceof Date ? result.orderDate : new Date(result.orderDate),
      collectionDate: result.collectionDate instanceof Date ? result.collectionDate : new Date(result.collectionDate),
      performedDate: result.performedDate instanceof Date ? result.performedDate : new Date(result.performedDate),
      verifiedDate: result.verifiedDate instanceof Date ? result.verifiedDate : (result.verifiedDate ? new Date(result.verifiedDate) : undefined),
      createdAt: result.createdAt instanceof Date ? result.createdAt : new Date(result.createdAt),
      updatedAt: result.updatedAt instanceof Date ? result.updatedAt : new Date(result.updatedAt),
      // Sanitize sensitive technical information
      technician: this.shouldIncludeTechnicalData() ? result.technician : undefined,
      equipment: this.shouldIncludeTechnicalData() ? result.equipment : undefined,
    }));
  }

  /**
   * Enhanced document transformation for lab results
   */
  protected override transformDocument(id: string, data: any): LabResult {
    return {
      id,
      patientId: data.patientId,
      resultDate: data.resultDate?.toDate?.() || new Date(data.resultDate),
      testName: data.testName || '',
      testCode: data.testCode || '',
      category: data.category || 'general',
      value: data.value,
      unit: data.unit || '',
      referenceRange: data.referenceRange || '',
      status: data.status || 'pending',
      flag: data.flag,
      providerId: data.providerId || '',
      providerName: data.providerName || '',
      labId: data.labId || '',
      labName: data.labName || '',
      orderDate: data.orderDate?.toDate?.() || new Date(),
      collectionDate: data.collectionDate?.toDate?.() || new Date(),
      performedDate: data.performedDate?.toDate?.() || new Date(),
      notes: data.notes,
      methodology: data.methodology,
      equipment: data.equipment,
      technician: data.technician,
      verified: data.verified || false,
      verifiedBy: data.verifiedBy,
      verifiedDate: data.verifiedDate?.toDate?.(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }

  /**
   * Get mock lab results for development
   */
  protected override getMockData(patientId: string): LabResult[] {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-lab-1',
        patientId,
        resultDate: lastWeek,
        testName: 'Hemograma Completo',
        testCode: 'CBC',
        category: 'hematology',
        value: 14.5,
        unit: 'g/dL',
        referenceRange: '12.0-16.0',
        status: 'normal',
        providerId: 'mock-doctor-1',
        providerName: 'Dr. Juan Pérez',
        labId: 'mock-lab-central',
        labName: 'Laboratorio Central',
        orderDate: new Date(lastWeek.getTime() - 24 * 60 * 60 * 1000),
        collectionDate: lastWeek,
        performedDate: lastWeek,
        notes: 'Resultados dentro del rango normal',
        verified: true,
        verifiedBy: 'Dr. Ana Martínez',
        verifiedDate: lastWeek,
        createdAt: lastWeek,
        updatedAt: lastWeek,
      },
      {
        id: 'mock-lab-2',
        patientId,
        resultDate: lastMonth,
        testName: 'Glucosa en Ayunas',
        testCode: 'GLU',
        category: 'chemistry',
        value: 95,
        unit: 'mg/dL',
        referenceRange: '70-100',
        status: 'normal',
        providerId: 'mock-doctor-1',
        providerName: 'Dr. Juan Pérez',
        labId: 'mock-lab-central',
        labName: 'Laboratorio Central',
        orderDate: new Date(lastMonth.getTime() - 24 * 60 * 60 * 1000),
        collectionDate: lastMonth,
        performedDate: lastMonth,
        notes: 'Nivel de glucosa normal',
        verified: true,
        verifiedBy: 'Dr. Ana Martínez',
        verifiedDate: lastMonth,
        createdAt: lastMonth,
        updatedAt: lastMonth,
      },
    ];
  }

  /**
   * Check if technical data should be included in export
   */
  private shouldIncludeTechnicalData(): boolean {
    return (process.env.EXPORT_INCLUDE_TECHNICAL_DATA || 'false') === 'true';
  }

  /**
   * Collect lab results with enhanced error handling
   */
  override async collect(patientId: string, dateRange?: { from: Date; to: Date }): Promise<LabResult[]> {
    this.checkExportEnabled();

    if (this.shouldUseMockData()) {
      return this.getMockData(patientId);
    }

    return super.collect(patientId, dateRange);
  }

  /**
   * Get abnormal results only
   */
  async getAbnormalResults(patientId: string, dateRange?: { from: Date; to: Date }): Promise<LabResult[]> {
    const allResults = await this.collect(patientId, dateRange);
    return allResults.filter(result => 
      result.status === 'abnormal' || result.status === 'critical'
    );
  }

  /**
   * Get results by category
   */
  async getResultsByCategory(
    patientId: string, 
    category: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<LabResult[]> {
    const allResults = await this.collect(patientId, dateRange);
    return allResults.filter(result => result.category === category);
  }
}

// Export singleton instance
export const labResultsCollector = new LabResultsCollector();