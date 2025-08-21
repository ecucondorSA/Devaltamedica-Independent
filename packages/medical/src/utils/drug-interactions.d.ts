/**
 * CRITICAL DRUG INTERACTION CHECKER
 *
 * ⚠️ WARNING: This is a STUB implementation.
 * Real implementation requires extensive pharmaceutical database and medical expertise.
 * DO NOT USE IN PRODUCTION without proper medical review and validation.
 */
export interface MedicationProfile {
    name: string;
    activeIngredient: string;
    dosage: number;
    unit: string;
    frequency: string;
    route: string;
}
export interface PatientMedications {
    current: MedicationProfile[];
    proposed?: MedicationProfile;
}
export interface DrugInteraction {
    medication1: string;
    medication2: string;
    severity: InteractionSeverity;
    mechanism: string;
    clinicalEffect: string;
    recommendation: string;
}
export interface ContraindicationCheck {
    medication: string;
    contraindication: string;
    reason: string;
    severity: 'absolute' | 'relative';
}
export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';
export declare class DrugInteractionError extends Error {
    constructor(message: string);
}
export declare function checkDrugInteractions(medications: PatientMedications): DrugInteraction[];
export declare function analyzeDrugCombination(med1: MedicationProfile, med2: MedicationProfile): DrugInteraction | null;
export declare function getInteractionSeverity(med1: string, med2: string): InteractionSeverity;
export declare function predictInteractionOutcome(interaction: DrugInteraction): string;
export declare function generateInteractionWarning(interaction: DrugInteraction): string;
export declare function checkContraindications(medication: MedicationProfile, patientConditions: string[]): ContraindicationCheck[];
export declare function validateDrugCombination(medications: MedicationProfile[]): boolean;
//# sourceMappingURL=drug-interactions.d.ts.map