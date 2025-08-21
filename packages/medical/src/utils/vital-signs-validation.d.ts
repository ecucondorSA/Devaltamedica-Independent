/**
 * CRITICAL VITAL SIGNS VALIDATOR
 *
 * ⚠️ WARNING: This is a STUB implementation.
 * Real implementation requires medical expertise and clinical validation.
 * DO NOT USE IN PRODUCTION without proper medical review.
 */
export interface VitalSigns {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
    timestamp: Date;
}
export interface PatientDemographics {
    age: number;
    sex: 'male' | 'female';
    weight: number;
    height: number;
    medicalConditions: string[];
}
export interface VitalSignsValidation {
    isValid: boolean;
    alerts: string[];
    emergencyConditions: EmergencyCondition[];
    riskScore: number;
    recommendations: string[];
}
export interface EmergencyCondition {
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    immediateAction: string;
    timeframe: string;
}
export interface VitalSignsThresholds {
    systolicBP: {
        min: number;
        max: number;
    };
    diastolicBP: {
        min: number;
        max: number;
    };
    heartRate: {
        min: number;
        max: number;
    };
    respiratoryRate: {
        min: number;
        max: number;
    };
    temperature: {
        min: number;
        max: number;
    };
    oxygenSaturation: {
        min: number;
        max: number;
    };
}
export declare class VitalSignsValidationError extends Error {
    constructor(message: string);
}
export declare function validateVitalSigns(vitalSigns: VitalSigns, demographics: PatientDemographics): VitalSignsValidation;
export declare function categorizeVitalSigns(vitalSigns: VitalSigns): string;
export declare function detectEmergencyConditions(vitalSigns: VitalSigns, demographics: PatientDemographics): EmergencyCondition[];
export declare function calculateVitalSignsScore(vitalSigns: VitalSigns, demographics: PatientDemographics): number;
export declare function generateVitalSignsAlert(vitalSigns: VitalSigns, demographics: PatientDemographics): string[];
export declare function predictDeteriorationRisk(vitalSigns: VitalSigns, demographics: PatientDemographics): number;
export declare function validateVitalSignsRange(vitalSigns: VitalSigns, thresholds: VitalSignsThresholds): boolean;
//# sourceMappingURL=vital-signs-validation.d.ts.map