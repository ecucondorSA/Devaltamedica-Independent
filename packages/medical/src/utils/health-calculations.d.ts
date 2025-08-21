/**
 * Health-related calculation utilities
 * @module @altamedica/medical/utils/health-calculations
 */
/**
 * Calculate Body Mass Index (BMI)
 */
export declare const calculateBMI: (weightKg: number, heightCm: number) => {
    value: number;
    category: string;
    color: string;
};
/**
 * Calculate ideal weight range (using Devine formula)
 */
export declare const calculateIdealWeight: (heightCm: number, gender: "male" | "female") => {
    min: number;
    max: number;
};
/**
 * Calculate heart rate zones
 */
export declare const calculateHeartRateZones: (age: number) => {
    resting: {
        min: number;
        max: number;
    };
    moderate: {
        min: number;
        max: number;
    };
    vigorous: {
        min: number;
        max: number;
    };
    maximum: number;
};
/**
 * Validate blood pressure reading
 */
export declare const classifyBloodPressure: (systolic: number, diastolic: number) => {
    category: string;
    severity: "normal" | "elevated" | "high" | "critical";
    color: string;
};
//# sourceMappingURL=health-calculations.d.ts.map