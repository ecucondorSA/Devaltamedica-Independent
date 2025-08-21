import type { DataCategory } from '../types';
import { BaseCollector } from './base.collector';

/**
 * Vital Signs Collector
 * Handles collection of patient vital signs data
 * Extracted from lines 574-601 of original PatientDataExportService
 */

export interface VitalSign {
  id: string;
  patientId: string;
  recordedAt: Date;
  recordedBy: string;
  facilityId?: string;
  facilityName?: string;
  deviceId?: string;
  deviceType?: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    unit: 'mmHg';
  };
  heartRate?: {
    value: number;
    unit: 'bpm';
    rhythm: 'regular' | 'irregular';
  };
  temperature?: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
    site: 'oral' | 'rectal' | 'axillary' | 'tympanic' | 'temporal';
  };
  respiratoryRate?: {
    value: number;
    unit: 'breaths/min';
  };
  oxygenSaturation?: {
    value: number;
    unit: 'percent';
    oxygenSupport?: boolean;
    flowRate?: number;
  };
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  height?: {
    value: number;
    unit: 'cm' | 'inches';
  };
  bmi?: {
    value: number;
    category: 'underweight' | 'normal' | 'overweight' | 'obese';
  };
  painScore?: {
    value: number; // 0-10 scale
    scale: 'numeric' | 'faces' | 'behavioral';
  };
  glucoseLevel?: {
    value: number;
    unit: 'mg/dL' | 'mmol/L';
    context: 'fasting' | 'random' | 'postprandial';
  };
  notes?: string;
  alerts?: string[];
  abnormalFlags: string[];
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class VitalSignsCollector extends BaseCollector<VitalSign> {
  protected readonly collectionName = 'vital_signs';
  protected readonly category: DataCategory = 'vital_signs';
  protected readonly dateField = 'recordedAt';

  /**
   * Enhanced validation for vital signs
   */
  override validate(data: VitalSign[]): boolean {
    if (!super.validate(data)) {
      return false;
    }

    return data.every((vitalSign) => {
      return (
        vitalSign.id &&
        vitalSign.patientId &&
        vitalSign.recordedAt instanceof Date &&
        vitalSign.recordedBy &&
        Array.isArray(vitalSign.abnormalFlags) &&
        typeof vitalSign.validated === 'boolean' &&
        this.hasAtLeastOneVitalSign(vitalSign)
      );
    });
  }

  /**
   * Check if vital sign record has at least one measurement
   */
  private hasAtLeastOneVitalSign(vitalSign: VitalSign): boolean {
    return !!(
      vitalSign.bloodPressure ||
      vitalSign.heartRate ||
      vitalSign.temperature ||
      vitalSign.respiratoryRate ||
      vitalSign.oxygenSaturation ||
      vitalSign.weight ||
      vitalSign.height ||
      vitalSign.bmi ||
      vitalSign.painScore ||
      vitalSign.glucoseLevel
    );
  }

  /**
   * Sanitize vital signs for export
   */
  override sanitize(data: VitalSign[]): VitalSign[] {
    return data.map((vitalSign) => ({
      ...vitalSign,
      // Ensure dates are properly formatted
      recordedAt: vitalSign.recordedAt instanceof Date 
        ? vitalSign.recordedAt 
        : new Date(vitalSign.recordedAt),
      validatedAt: vitalSign.validatedAt instanceof Date 
        ? vitalSign.validatedAt 
        : (vitalSign.validatedAt ? new Date(vitalSign.validatedAt) : undefined),
      createdAt: vitalSign.createdAt instanceof Date 
        ? vitalSign.createdAt 
        : new Date(vitalSign.createdAt),
      updatedAt: vitalSign.updatedAt instanceof Date 
        ? vitalSign.updatedAt 
        : new Date(vitalSign.updatedAt),
      // Ensure arrays are properly initialized
      abnormalFlags: Array.isArray(vitalSign.abnormalFlags) ? vitalSign.abnormalFlags : [],
      alerts: Array.isArray(vitalSign.alerts) ? vitalSign.alerts : undefined,
      // Remove device-specific technical data if not authorized
      deviceId: this.shouldIncludeTechnicalData() ? vitalSign.deviceId : undefined,
      deviceType: this.shouldIncludeTechnicalData() ? vitalSign.deviceType : undefined,
    }));
  }

  /**
   * Enhanced document transformation for vital signs
   */
  protected override transformDocument(id: string, data: any): VitalSign {
    return {
      id,
      patientId: data.patientId,
      recordedAt: data.recordedAt?.toDate?.() || new Date(data.recordedAt),
      recordedBy: data.recordedBy || '',
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      bloodPressure: data.bloodPressure,
      heartRate: data.heartRate,
      temperature: data.temperature,
      respiratoryRate: data.respiratoryRate,
      oxygenSaturation: data.oxygenSaturation,
      weight: data.weight,
      height: data.height,
      bmi: data.bmi,
      painScore: data.painScore,
      glucoseLevel: data.glucoseLevel,
      notes: data.notes,
      alerts: data.alerts,
      abnormalFlags: Array.isArray(data.abnormalFlags) ? data.abnormalFlags : [],
      validated: data.validated || false,
      validatedBy: data.validatedBy,
      validatedAt: data.validatedAt?.toDate?.(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }

  /**
   * Get mock vital signs for development
   */
  protected override getMockData(patientId: string): VitalSign[] {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-vitals-1',
        patientId,
        recordedAt: lastWeek,
        recordedBy: 'nurse-maria',
        facilityId: 'mock-facility-1',
        facilityName: 'Centro Médico Central',
        deviceId: 'monitor-001',
        deviceType: 'automatic_monitor',
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg',
        },
        heartRate: {
          value: 72,
          unit: 'bpm',
          rhythm: 'regular',
        },
        temperature: {
          value: 36.5,
          unit: 'celsius',
          site: 'oral',
        },
        respiratoryRate: {
          value: 16,
          unit: 'breaths/min',
        },
        oxygenSaturation: {
          value: 98,
          unit: 'percent',
          oxygenSupport: false,
        },
        weight: {
          value: 70,
          unit: 'kg',
        },
        height: {
          value: 170,
          unit: 'cm',
        },
        bmi: {
          value: 24.2,
          category: 'normal',
        },
        painScore: {
          value: 2,
          scale: 'numeric',
        },
        notes: 'Signos vitales normales',
        abnormalFlags: [],
        validated: true,
        validatedBy: 'Dr. Juan Pérez',
        validatedAt: lastWeek,
        createdAt: lastWeek,
        updatedAt: lastWeek,
      },
      {
        id: 'mock-vitals-2',
        patientId,
        recordedAt: lastMonth,
        recordedBy: 'nurse-carlos',
        facilityId: 'mock-facility-1',
        facilityName: 'Centro Médico Central',
        bloodPressure: {
          systolic: 140,
          diastolic: 90,
          unit: 'mmHg',
        },
        heartRate: {
          value: 85,
          unit: 'bpm',
          rhythm: 'regular',
        },
        temperature: {
          value: 37.2,
          unit: 'celsius',
          site: 'oral',
        },
        respiratoryRate: {
          value: 18,
          unit: 'breaths/min',
        },
        oxygenSaturation: {
          value: 96,
          unit: 'percent',
          oxygenSupport: false,
        },
        notes: 'Presión arterial ligeramente elevada',
        alerts: ['Hipertensión leve'],
        abnormalFlags: ['bp_high', 'temp_elevated'],
        validated: true,
        validatedBy: 'Dr. María González',
        validatedAt: lastMonth,
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
   * Collect vital signs with enhanced error handling
   */
  override async collect(patientId: string, dateRange?: { from: Date; to: Date }): Promise<VitalSign[]> {
    this.checkExportEnabled();

    if (this.shouldUseMockData()) {
      return this.getMockData(patientId);
    }

    return super.collect(patientId, dateRange);
  }

  /**
   * Get abnormal vital signs only
   */
  async getAbnormalVitalSigns(patientId: string, dateRange?: { from: Date; to: Date }): Promise<VitalSign[]> {
    const allVitalSigns = await this.collect(patientId, dateRange);
    return allVitalSigns.filter(vitalSign => 
      vitalSign.abnormalFlags.length > 0 || vitalSign.alerts?.length
    );
  }

  /**
   * Get latest vital signs
   */
  async getLatestVitalSigns(patientId: string): Promise<VitalSign | null> {
    const allVitalSigns = await this.collect(patientId);
    if (allVitalSigns.length === 0) return null;
    
    // Sort by recorded date desc and return the most recent
    return allVitalSigns.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
  }

  /**
   * Calculate BMI if not provided
   */
  calculateBMI(weight: number, height: number): { value: number; category: string } {
    const heightInMeters = height / 100; // Convert cm to meters
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category: string;
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';

    return {
      value: Math.round(bmi * 10) / 10, // Round to 1 decimal
      category,
    };
  }
}

// Export singleton instance
export const vitalSignsCollector = new VitalSignsCollector();