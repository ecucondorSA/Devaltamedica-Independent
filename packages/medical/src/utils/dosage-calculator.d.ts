/**
 * CRITICAL MEDICAL DOSAGE CALCULATOR
 *
 * ⚠️ WARNING: This is a STUB implementation.
 * Real implementation requires medical expertise and extensive validation.
 * DO NOT USE IN PRODUCTION without proper medical review.
 */
export interface PatientProfile {
    age: number;
    weight: number;
    height: number;
    sex: 'male' | 'female';
    creatinineLevel: number;
    creatinineClearance: number;
    liverFunction: 'normal' | 'mild' | 'moderate' | 'severe';
    allergies: string[];
    currentMedications: string[];
}
export interface MedicationProfile {
    name: string;
    standardDose: number;
    unit: string;
    route: string;
    maxDailyDose?: number;
    renalAdjustment?: boolean;
    hepaticAdjustment?: boolean;
}
export interface DosageRequest {
    patient: PatientProfile;
    medication: MedicationProfile;
    indication: string;
    duration?: number;
}
export declare class DosageCalculationError extends Error {
    constructor(message: string);
}
export declare function calculateDosage(request: DosageRequest): number;
export declare function calculatePediatricDosage(request: DosageRequest): number;
export declare function calculateGeriatricDosage(request: DosageRequest): number;
export declare function validateDosageRange(dosage: number, medication: MedicationProfile): boolean;
export declare function adjustDosageForWeight(baseDosage: number, weight: number): number;
export declare function adjustDosageForKidneyFunction(baseDosage: number, creatinineClearance: number): number;
export declare function adjustDosageForLiverFunction(baseDosage: number, liverFunction: string): number;
export declare function calculateInsulinDosage(patient: PatientProfile, bloodSugar: number): number;
export declare function calculateChemotherapyDosage(patient: PatientProfile, medication: MedicationProfile): number;
export declare function convertDosageUnits(dosage: number, fromUnit: string, toUnit: string): number;
//# sourceMappingURL=dosage-calculator.d.ts.map