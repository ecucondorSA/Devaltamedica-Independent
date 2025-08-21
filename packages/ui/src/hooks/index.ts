// 🪝 HOOKS MÉDICOS - EXPORTACIONES
// Hooks especializados para funcionalidades médicas
// Validación, datos del paciente, signos vitales y más

// 🩺 VALIDACIÓN MÉDICA
export { 
  useMedicalValidation,
  type ValidationResult,
  type VitalSignType,
  type MedicalSeverity
} from './useMedicalValidation';

// 👤 DATOS DEL PACIENTE
export { 
  usePatientData,
  type UsePatientDataOptions,
  type PatientData,
  type Medication,
  type CurrentVitals,
  type MedicalHistory
} from './usePatientData';