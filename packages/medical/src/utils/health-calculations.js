/**
 * Health-related calculation utilities
 * @module @altamedica/medical/utils/health-calculations
 */
/**
 * Calculate Body Mass Index (BMI)
 */
export const calculateBMI = (weightKg, heightCm) => {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const roundedBMI = Math.round(bmi * 10) / 10;
    let category = '';
    let color = '';
    if (bmi < 18.5) {
        category = 'Underweight';
        color = 'text-yellow-600';
    }
    else if (bmi < 25) {
        category = 'Normal weight';
        color = 'text-green-600';
    }
    else if (bmi < 30) {
        category = 'Overweight';
        color = 'text-orange-600';
    }
    else {
        category = 'Obese';
        color = 'text-red-600';
    }
    return { value: roundedBMI, category, color };
};
/**
 * Calculate ideal weight range (using Devine formula)
 */
export const calculateIdealWeight = (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    let idealWeight;
    if (gender === 'male') {
        idealWeight = 50 + 2.3 * (heightInches - 60);
    }
    else {
        idealWeight = 45.5 + 2.3 * (heightInches - 60);
    }
    // ±10% range
    return {
        min: Math.round(idealWeight * 0.9),
        max: Math.round(idealWeight * 1.1)
    };
};
/**
 * Calculate heart rate zones
 */
export const calculateHeartRateZones = (age) => {
    const maxHR = 220 - age;
    return {
        resting: { min: 60, max: 100 },
        moderate: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.7) },
        vigorous: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.85) },
        maximum: maxHR
    };
};
/**
 * Validate blood pressure reading
 */
export const classifyBloodPressure = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) {
        return { category: 'Normal', severity: 'normal', color: 'text-green-600' };
    }
    else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
        return { category: 'Elevated', severity: 'elevated', color: 'text-yellow-600' };
    }
    else if (systolic >= 130 && systolic < 140 || diastolic >= 80 && diastolic < 90) {
        return { category: 'High Blood Pressure Stage 1', severity: 'high', color: 'text-orange-600' };
    }
    else if (systolic >= 140 || diastolic >= 90) {
        return { category: 'High Blood Pressure Stage 2', severity: 'high', color: 'text-red-600' };
    }
    else if (systolic > 180 || diastolic > 120) {
        return { category: 'Hypertensive Crisis', severity: 'critical', color: 'text-red-800' };
    }
    return { category: 'Unknown', severity: 'normal', color: 'text-gray-600' };
};
//# sourceMappingURL=health-calculations.js.map