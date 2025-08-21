/**
 * Medical constants and enums
 * @module @altamedica/medical/config/constants
 */
export declare const MEDICAL_SPECIALIZATIONS: readonly ["General Practice", "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", "Gynecology", "Neurology", "Oncology", "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry", "Pulmonology", "Radiology", "Surgery", "Urology"];
export declare const COMMON_CONDITIONS: readonly ["Hypertension", "Diabetes Type 2", "Asthma", "Arthritis", "Depression", "Anxiety", "Allergies", "Migraine", "Thyroid Disorders", "Heart Disease"];
export declare const APPOINTMENT_DURATIONS: {
    readonly quickConsultation: 15;
    readonly standard: 30;
    readonly extended: 45;
    readonly comprehensive: 60;
    readonly procedure: 90;
    readonly surgery: 120;
};
export declare const VITAL_RANGES: {
    readonly heartRate: {
        readonly min: 60;
        readonly max: 100;
        readonly unit: "bpm";
    };
    readonly bloodPressure: {
        readonly systolic: {
            readonly min: 90;
            readonly max: 120;
            readonly unit: "mmHg";
        };
        readonly diastolic: {
            readonly min: 60;
            readonly max: 80;
            readonly unit: "mmHg";
        };
    };
    readonly temperature: {
        readonly min: 36.1;
        readonly max: 37.2;
        readonly unit: "°C";
    };
    readonly respiratoryRate: {
        readonly min: 12;
        readonly max: 20;
        readonly unit: "breaths/min";
    };
    readonly oxygenSaturation: {
        readonly min: 95;
        readonly max: 100;
        readonly unit: "%";
    };
};
export declare const LAB_TEST_TYPES: readonly ["Complete Blood Count (CBC)", "Basic Metabolic Panel", "Lipid Panel", "Liver Function Tests", "Thyroid Function Tests", "Hemoglobin A1C", "Urinalysis", "COVID-19 Test", "Glucose Test", "Cholesterol Test"];
export declare const PRESCRIPTION_FREQUENCIES: readonly ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed", "Before meals", "After meals", "At bedtime"];
export declare const EMERGENCY_LEVELS: {
    readonly low: {
        readonly value: 1;
        readonly label: "Low Priority";
        readonly color: "green";
    };
    readonly medium: {
        readonly value: 2;
        readonly label: "Medium Priority";
        readonly color: "yellow";
    };
    readonly high: {
        readonly value: 3;
        readonly label: "High Priority";
        readonly color: "orange";
    };
    readonly critical: {
        readonly value: 4;
        readonly label: "Critical";
        readonly color: "red";
    };
};
//# sourceMappingURL=constants.d.ts.map