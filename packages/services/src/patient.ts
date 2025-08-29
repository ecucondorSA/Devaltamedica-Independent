/**
 * Patient Service
 * Business logic for patient operations
 */

import type {
  Patient,
  MedicalRecord,
  Appointment,
  LabResult,
  Prescription,
  VitalSigns,
  Diagnosis,
  Treatment
} from '@altamedica/interfaces';

/**
 * DEPRECATED name: PatientService (kept for compatibility)
 * Prefer using PatientAnalyticsService to avoid confusion with database PatientService.
 */
export class PatientService {
  /**
   * Calculate patient risk score based on medical history
   */
  static calculateRiskScore(patient: Patient, medicalRecords: MedicalRecord[]): RiskScore {
    let score = 0;
    const factors: RiskFactor[] = [];
    
    // Age factor
    const age = this.calculateAge(patient.dateOfBirth);
    if (age > 65) {
      score += 20;
      factors.push({ factor: 'age', value: age, impact: 20 });
    } else if (age > 50) {
      score += 10;
      factors.push({ factor: 'age', value: age, impact: 10 });
    }
    
    // Chronic conditions
    const chronicConditions = this.extractChronicConditions(medicalRecords);
    score += chronicConditions.length * 15;
    if (chronicConditions.length > 0) {
      factors.push({
        factor: 'chronic_conditions',
        value: chronicConditions.join(', '),
        impact: chronicConditions.length * 15
      });
    }
    
    // Recent hospitalizations
    const recentHospitalizations = this.countRecentHospitalizations(medicalRecords);
    score += recentHospitalizations * 25;
    if (recentHospitalizations > 0) {
      factors.push({
        factor: 'hospitalizations',
        value: recentHospitalizations,
        impact: recentHospitalizations * 25
      });
    }
    
    // Medication count
    const medicationCount = patient.medications?.length || 0;
    if (medicationCount > 5) {
      score += 15;
      factors.push({ factor: 'polypharmacy', value: medicationCount, impact: 15 });
    }
    
    // BMI calculation
    const latestVitals = this.getLatestVitalSigns(medicalRecords);
    if (latestVitals?.bmi) {
      if (latestVitals.bmi > 30 || latestVitals.bmi < 18.5) {
        score += 10;
        factors.push({ factor: 'bmi', value: latestVitals.bmi, impact: 10 });
      }
    }
    
    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
      recommendations: this.generateRecommendations(factors)
    };
  }
  
  /**
   * Check patient eligibility for specific treatments
   */
  static checkTreatmentEligibility(
    patient: Patient,
    treatment: TreatmentOption,
    medicalRecords: MedicalRecord[]
  ): EligibilityResult {
    const contraindications: string[] = [];
    const warnings: string[] = [];
    let eligible = true;
    
    // Check age restrictions
    const age = this.calculateAge(patient.dateOfBirth);
    if (treatment.minAge && age < treatment.minAge) {
      eligible = false;
      contraindications.push(`Patient age (${age}) below minimum required (${treatment.minAge})`);
    }
    if (treatment.maxAge && age > treatment.maxAge) {
      eligible = false;
      contraindications.push(`Patient age (${age}) above maximum allowed (${treatment.maxAge})`);
    }
    
    // Check for drug interactions
    if (patient.medications && treatment.contraindications) {
      const interactions = this.findDrugInteractions(patient.medications, treatment.contraindications);
      if (interactions.length > 0) {
        eligible = false;
        contraindications.push(...interactions);
      }
    }
    
    // Check for allergies
    if (patient.allergies && treatment.allergens) {
      const allergyConflicts = patient.allergies.filter(allergy => 
        treatment.allergens?.includes(allergy)
      );
      if (allergyConflicts.length > 0) {
        eligible = false;
        contraindications.push(`Patient allergic to: ${allergyConflicts.join(', ')}`);
      }
    }
    
    // Check for condition requirements
    if (treatment.requiredConditions) {
      const patientConditions = this.extractAllConditions(medicalRecords);
      const missingConditions = treatment.requiredConditions.filter(
        cond => !patientConditions.includes(cond)
      );
      if (missingConditions.length > 0) {
        eligible = false;
        contraindications.push(`Missing required conditions: ${missingConditions.join(', ')}`);
      }
    }
    
    // Check for excluded conditions
    if (treatment.excludedConditions) {
      const patientConditions = this.extractAllConditions(medicalRecords);
      const conflictingConditions = treatment.excludedConditions.filter(
        cond => patientConditions.includes(cond)
      );
      if (conflictingConditions.length > 0) {
        warnings.push(`Patient has conditions that may affect treatment: ${conflictingConditions.join(', ')}`);
      }
    }
    
    return {
      eligible,
      contraindications,
      warnings,
      alternativeTreatments: eligible ? [] : this.suggestAlternatives(treatment)
    };
  }
  
  /**
   * Generate patient health summary
   */
  static generateHealthSummary(
    patient: Patient,
    medicalRecords: MedicalRecord[],
    appointments: Appointment[],
    labResults: LabResult[]
  ): HealthSummary {
    const recentRecords = this.getRecentRecords(medicalRecords, 90);
    const upcomingAppointments = this.getUpcomingAppointments(appointments);
    const recentLabs = this.getRecentLabResults(labResults, 30);
    
    return {
      patientInfo: {
        name: `${patient.firstName} ${patient.lastName}`,
        age: this.calculateAge(patient.dateOfBirth),
        gender: patient.gender
      },
      currentConditions: this.extractActiveConditions(recentRecords),
      currentMedications: patient.medications || [],
      allergies: patient.allergies || [],
      recentVitals: this.getLatestVitalSigns(recentRecords),
      upcomingAppointments: upcomingAppointments.map(apt => ({
        date: apt.date,
        time: apt.time,
        type: apt.type,
        doctor: apt.doctorId
      })),
      recentLabResults: this.summarizeLabResults(recentLabs),
      riskScore: this.calculateRiskScore(patient, medicalRecords),
      preventiveCareReminders: this.generatePreventiveCareReminders(patient, medicalRecords),
      lastUpdated: new Date()
    };
  }
  
  /**
   * Helper methods
   */
  private static calculateAge(dateOfBirth: Date | string): number {
    const dob = new Date(dateOfBirth);
    const ageDiff = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  
  private static extractChronicConditions(records: MedicalRecord[]): string[] {
    const chronicCodes = ['E11', 'I10', 'J44', 'N18', 'F32']; // ICD-10 codes for chronic conditions
    const conditions = new Set<string>();
    
    records.forEach(record => {
      record.diagnosis?.forEach(diag => {
        if (chronicCodes.some(code => diag.code.startsWith(code))) {
          conditions.add(diag.description);
        }
      });
    });
    
    return Array.from(conditions);
  }
  
  private static countRecentHospitalizations(records: MedicalRecord[]): number {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return records.filter(record => {
      const visitDate = new Date(record.visitDate);
      return visitDate > sixMonthsAgo && record.chiefComplaint?.includes('admission');
    }).length;
  }
  
  private static getLatestVitalSigns(records: MedicalRecord[]): VitalSigns | undefined {
    const recordsWithVitals = records.filter(r => r.vitalSigns);
    if (recordsWithVitals.length === 0) return undefined;
    
    recordsWithVitals.sort((a, b) => 
      new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
    
    return recordsWithVitals[0].vitalSigns;
  }
  
  private static getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }
  
  private static generateRecommendations(factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    factors.forEach(factor => {
      switch (factor.factor) {
        case 'age':
          if (factor.value > 65) {
            recommendations.push('Schedule regular health checkups every 3 months');
            recommendations.push('Consider preventive screenings');
          }
          break;
        case 'chronic_conditions':
          recommendations.push('Maintain regular medication compliance');
          recommendations.push('Monitor symptoms daily');
          break;
        case 'hospitalizations':
          recommendations.push('Follow up with primary care physician');
          recommendations.push('Consider home health monitoring');
          break;
        case 'polypharmacy':
          recommendations.push('Review medications with pharmacist');
          recommendations.push('Check for potential drug interactions');
          break;
        case 'bmi':
          if (factor.value > 30) {
            recommendations.push('Consult with nutritionist');
            recommendations.push('Develop exercise plan with physician');
          }
          break;
      }
    });
    
    return recommendations;
  }
  
  private static findDrugInteractions(medications: any[], contraindications: string[]): string[] {
    // Simplified drug interaction check
    return [];
  }
  
  private static extractAllConditions(records: MedicalRecord[]): string[] {
    const conditions = new Set<string>();
    records.forEach(record => {
      record.diagnosis?.forEach(diag => conditions.add(diag.code));
    });
    return Array.from(conditions);
  }
  
  private static suggestAlternatives(treatment: TreatmentOption): string[] {
    // Simplified alternative treatment suggestions
    return ['Consult with specialist for alternative options'];
  }
  
  private static getRecentRecords(records: MedicalRecord[], days: number): MedicalRecord[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return records.filter(r => new Date(r.visitDate) > cutoff);
  }
  
  private static getUpcomingAppointments(appointments: Appointment[]): Appointment[] {
    const now = new Date();
    return appointments.filter(apt => new Date(apt.date) > now);
  }
  
  private static getRecentLabResults(results: LabResult[], days: number): LabResult[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return results.filter(r => new Date(r.testDate) > cutoff);
  }
  
  private static extractActiveConditions(records: MedicalRecord[]): string[] {
    const conditions = new Set<string>();
    records.forEach(record => {
      record.diagnosis?.filter(d => d.type === 'primary').forEach(diag => {
        conditions.add(diag.description);
      });
    });
    return Array.from(conditions);
  }
  
  private static summarizeLabResults(results: LabResult[]): any[] {
    return results.map(result => ({
      test: result.testName,
      date: result.testDate,
      abnormalValues: result.results.filter(r => r.flag && r.flag !== 'normal')
    }));
  }
  
  private static generatePreventiveCareReminders(patient: Patient, records: MedicalRecord[]): string[] {
    const reminders: string[] = [];
    const age = this.calculateAge(patient.dateOfBirth);
    
    // Age-based screenings
    if (age >= 50) {
      reminders.push('Colonoscopy screening recommended');
    }
    if (age >= 40) {
      reminders.push('Annual mammogram recommended');
    }
    
    // General preventive care
    reminders.push('Annual flu vaccination');
    reminders.push('Dental checkup every 6 months');
    
    return reminders;
  }
}

// Preferred alias to avoid confusion with database-level PatientService
export const PatientAnalyticsService = PatientService;

/**
 * Types
 */
export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  value: any;
  impact: number;
}

export interface TreatmentOption {
  id: string;
  name: string;
  minAge?: number;
  maxAge?: number;
  contraindications?: string[];
  allergens?: string[];
  requiredConditions?: string[];
  excludedConditions?: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  contraindications: string[];
  warnings: string[];
  alternativeTreatments: string[];
}

export interface HealthSummary {
  patientInfo: {
    name: string;
    age: number;
    gender: string;
  };
  currentConditions: string[];
  currentMedications: any[];
  allergies: string[];
  recentVitals?: VitalSigns;
  upcomingAppointments: any[];
  recentLabResults: any[];
  riskScore: RiskScore;
  preventiveCareReminders: string[];
  lastUpdated: Date;
}
