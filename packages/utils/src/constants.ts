// ==================== MEDICAL CONSTANTS ====================

export const MEDICAL_SPECIALTIES = [
  "Cardiología",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Hematología",
  "Infectología",
  "Medicina Interna",
  "Nefrología",
  "Neurología",
  "Oncología",
  "Oftalmología",
  "Ortopedia",
  "Otorrinolaringología",
  "Pediatría",
  "Psiquiatría",
  "Radiología",
  "Reumatología",
  "Traumatología",
  "Urología",
] as const;

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const GENDERS = ["male", "female", "other"] as const;

export const APPOINTMENT_TYPES = [
  "consultation",
  "examination",
  "follow_up",
  "emergency",
  "surgery",
  "vaccination",
] as const;

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const MEDICAL_RECORD_TYPES = [
  "consultation",
  "examination",
  "prescription",
  "lab_result",
  "imaging",
  "surgery",
  "vaccination",
] as const;

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const USER_ROLES = [
  "admin",
  "doctor",
  "patient",
  "nurse",
  "receptionist",
] as const;

// ==================== MEDICAL VALUES ====================

export const NORMAL_VITAL_SIGNS = {
  bloodPressure: {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 },
  },
  heartRate: { min: 60, max: 100 },
  temperature: { min: 36.1, max: 37.2 },
  respiratoryRate: { min: 12, max: 20 },
  oxygenSaturation: { min: 95, max: 100 },
} as const;

export const BMI_CATEGORIES = {
  underweight: { min: 0, max: 18.5, label: "Bajo peso" },
  normal: { min: 18.5, max: 24.9, label: "Peso normal" },
  overweight: { min: 25, max: 29.9, label: "Sobrepeso" },
  obese: { min: 30, max: 34.9, label: "Obesidad" },
  severelyObese: { min: 35, max: 39.9, label: "Obesidad severa" },
  morbidlyObese: { min: 40, max: Infinity, label: "Obesidad mórbida" },
} as const;

// ==================== MEDICAL CODES ====================

export const ICD10_CATEGORIES = [
  "A00-B99", // Enfermedades infecciosas y parasitarias
  "C00-D49", // Neoplasias
  "D50-D89", // Enfermedades de la sangre
  "E00-E89", // Enfermedades endocrinas
  "F01-F99", // Trastornos mentales
  "G00-G99", // Enfermedades del sistema nervioso
  "H00-H59", // Enfermedades del ojo
  "H60-H95", // Enfermedades del oído
  "I00-I99", // Enfermedades del sistema circulatorio
  "J00-J99", // Enfermedades del sistema respiratorio
  "K00-K95", // Enfermedades del sistema digestivo
  "L00-L99", // Enfermedades de la piel
  "M00-M99", // Enfermedades del sistema osteomuscular
  "N00-N99", // Enfermedades del sistema genitourinario
  "O00-O9A", // Embarazo, parto y puerperio
  "P00-P96", // Condiciones originadas en el período perinatal
  "Q00-Q99", // Malformaciones congénitas
  "R00-R99", // Síntomas y signos
  "S00-T88", // Traumatismos, envenenamientos
  "V01-Y99", // Causas externas
  "Z00-Z99", // Factores que influyen en el estado de salud
] as const;

// ==================== MEDICAL UNITS ====================

export const MEDICAL_UNITS = {
  weight: "kg",
  height: "cm",
  temperature: "°C",
  bloodPressure: "mmHg",
  heartRate: "lpm",
  respiratoryRate: "rpm",
  oxygenSaturation: "%",
  bloodGlucose: "mg/dL",
  cholesterol: "mg/dL",
  creatinine: "mg/dL",
  hemoglobin: "g/dL",
  whiteBloodCells: "cells/μL",
  platelets: "cells/μL",
} as const;

// ==================== MEDICAL COLORS ====================

export const MEDICAL_COLORS = {
  primary: "#2563eb", // Blue
  secondary: "#64748b", // Slate
  success: "#16a34a", // Green
  warning: "#ca8a04", // Yellow
  danger: "#dc2626", // Red
  info: "#0891b2", // Cyan
  emergency: "#dc2626", // Red
  critical: "#991b1b", // Dark Red
  normal: "#16a34a", // Green
  abnormal: "#ca8a04", // Yellow
  high: "#dc2626", // Red
  low: "#0891b2", // Cyan
} as const;

// ==================== MEDICAL ICONS ====================

export const MEDICAL_ICONS = {
  patient: "👤",
  doctor: "👨‍⚕️",
  nurse: "👩‍⚕️",
  hospital: "🏥",
  ambulance: "🚑",
  medicine: "💊",
  syringe: "💉",
  stethoscope: "🩺",
  thermometer: "🌡️",
  heart: "❤️",
  brain: "🧠",
  bone: "🦴",
  eye: "👁️",
  ear: "👂",
  tooth: "🦷",
  blood: "🩸",
  dna: "🧬",
  microscope: "🔬",
  xray: "📷",
  pill: "💊",
  bandage: "🩹",
  wheelchair: "♿",
  crutches: "🩼",
} as const;

// ==================== MEDICAL MESSAGES ====================

export const MEDICAL_MESSAGES = {
  appointment: {
    created: "Cita creada exitosamente",
    updated: "Cita actualizada exitosamente",
    cancelled: "Cita cancelada exitosamente",
    confirmed: "Cita confirmada exitosamente",
    reminder: "Recordatorio de cita médica",
  },
  prescription: {
    created: "Prescripción creada exitosamente",
    updated: "Prescripción actualizada exitosamente",
    cancelled: "Prescripción cancelada exitosamente",
    completed: "Prescripción completada exitosamente",
  },
  medicalRecord: {
    created: "Registro médico creado exitosamente",
    updated: "Registro médico actualizado exitosamente",
    archived: "Registro médico archivado exitosamente",
  },
  labResult: {
    created: "Resultado de laboratorio creado exitosamente",
    updated: "Resultado de laboratorio actualizado exitosamente",
    abnormal: "Resultado de laboratorio anormal detectado",
  },
  patient: {
    created: "Paciente registrado exitosamente",
    updated: "Información del paciente actualizada exitosamente",
    discharged: "Paciente dado de alta exitosamente",
  },
  doctor: {
    created: "Doctor registrado exitosamente",
    updated: "Información del doctor actualizada exitosamente",
    verified: "Doctor verificado exitosamente",
  },
} as const;

// ==================== MEDICAL VALIDATION ====================

export const MEDICAL_VALIDATION = {
  dni: {
    pattern: /^\d{8}$/,
    message: "El DNI debe tener 8 dígitos",
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: "Número de teléfono inválido",
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email inválido",
  },
  bloodPressure: {
    systolic: { min: 70, max: 200 },
    diastolic: { min: 40, max: 130 },
    message: "Valores de presión arterial fuera de rango",
  },
  heartRate: {
    min: 40,
    max: 200,
    message: "Frecuencia cardíaca fuera de rango",
  },
  temperature: {
    min: 35,
    max: 42,
    message: "Temperatura fuera de rango",
  },
  weight: {
    min: 0.5,
    max: 500,
    message: "Peso fuera de rango",
  },
  height: {
    min: 30,
    max: 250,
    message: "Altura fuera de rango",
  },
} as const;

// ==================== UI CONSTANTS ====================

export const COLORS = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const SPACING = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const FONT_SIZES = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const BORDER_RADIUS = {
  none: "0",
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

export const TRANSITIONS = {
  fast: "150ms ease-in-out",
  normal: "250ms ease-in-out",
  slow: "350ms ease-in-out",
} as const;