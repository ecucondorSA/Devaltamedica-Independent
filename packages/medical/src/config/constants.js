/**
 * Medical constants and enums
 * @module @altamedica/medical/config/constants
 */
// Medical specializations
export const MEDICAL_SPECIALIZATIONS = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Gynecology',
    'Neurology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Urology'
];
// Common medical conditions
export const COMMON_CONDITIONS = [
    'Hypertension',
    'Diabetes Type 2',
    'Asthma',
    'Arthritis',
    'Depression',
    'Anxiety',
    'Allergies',
    'Migraine',
    'Thyroid Disorders',
    'Heart Disease'
];
// Appointment durations (in minutes)
export const APPOINTMENT_DURATIONS = {
    quickConsultation: 15,
    standard: 30,
    extended: 45,
    comprehensive: 60,
    procedure: 90,
    surgery: 120
};
// Vital signs normal ranges
export const VITAL_RANGES = {
    heartRate: { min: 60, max: 100, unit: 'bpm' },
    bloodPressure: {
        systolic: { min: 90, max: 120, unit: 'mmHg' },
        diastolic: { min: 60, max: 80, unit: 'mmHg' }
    },
    temperature: { min: 36.1, max: 37.2, unit: '°C' },
    respiratoryRate: { min: 12, max: 20, unit: 'breaths/min' },
    oxygenSaturation: { min: 95, max: 100, unit: '%' }
};
// Lab test types
export const LAB_TEST_TYPES = [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel',
    'Lipid Panel',
    'Liver Function Tests',
    'Thyroid Function Tests',
    'Hemoglobin A1C',
    'Urinalysis',
    'COVID-19 Test',
    'Glucose Test',
    'Cholesterol Test'
];
// Prescription frequencies
export const PRESCRIPTION_FREQUENCIES = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
];
// Emergency levels
export const EMERGENCY_LEVELS = {
    low: { value: 1, label: 'Low Priority', color: 'green' },
    medium: { value: 2, label: 'Medium Priority', color: 'yellow' },
    high: { value: 3, label: 'High Priority', color: 'orange' },
    critical: { value: 4, label: 'Critical', color: 'red' }
};
//# sourceMappingURL=constants.js.map