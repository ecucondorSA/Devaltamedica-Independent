// 🩺 HOOK DE VALIDACIÓN MÉDICA - ALTAMEDICA
// Validaciones médicas especializadas con rangos normales y recomendaciones
// Basado en estándares médicos internacionales y guías clínicas

import { useState, useCallback } from 'react';

// 📊 TIPOS DE SIGNOS VITALES
export type VitalSignType = 
  | 'heartRate' 
  | 'bloodPressureSystolic' 
  | 'bloodPressureDiastolic'
  | 'temperature' 
  | 'oxygenSaturation' 
  | 'respiratoryRate'
  | 'glucose'
  | 'weight'
  | 'height'
  | 'bmi';

// 🎯 SEVERIDAD MÉDICA
export type MedicalSeverity = 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';

// 📋 INTERFAZ DE VALIDACIÓN
export interface ValidationResult {
  isNormal: boolean;
  severity: MedicalSeverity;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  recommendation: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  alerts: string[];
}

// 🏥 RANGOS NORMALES POR SIGNO VITAL
const NORMAL_VITAL_RANGES: Record<VitalSignType, { min: number; max: number; unit: string }> = {
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg' },
  bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg' },
  temperature: { min: 36.1, max: 37.2, unit: '°C' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  respiratoryRate: { min: 12, max: 20, unit: 'rpm' },
  glucose: { min: 70, max: 100, unit: 'mg/dL' }, // En ayunas
  weight: { min: 45, max: 120, unit: 'kg' }, // Rango amplio adulto
  height: { min: 140, max: 210, unit: 'cm' }, // Rango amplio adulto
  bmi: { min: 18.5, max: 24.9, unit: 'kg/m²' },
};

// 🚨 CALCULAR SEVERIDAD
const calculateSeverity = (type: VitalSignType, value: number): MedicalSeverity => {
  const range = NORMAL_VITAL_RANGES[type];
  const percentage = ((value - range.min) / (range.max - range.min)) * 100;

  // Valores dentro del rango normal
  if (value >= range.min && value <= range.max) {
    return 'normal';
  }

  // Calcular desviación del rango normal
  let deviation: number;
  if (value < range.min) {
    deviation = ((range.min - value) / range.min) * 100;
  } else {
    deviation = ((value - range.max) / range.max) * 100;
  }

  // Clasificar severidad según desviación
  if (deviation < 10) return 'mild';
  if (deviation < 20) return 'moderate';
  if (deviation < 30) return 'severe';
  return 'critical';
};

// 📝 OBTENER RECOMENDACIONES MÉDICAS
const getRecommendation = (type: VitalSignType, value: number, severity: MedicalSeverity): string => {
  const recommendations: Record<VitalSignType, Record<MedicalSeverity, string>> = {
    heartRate: {
      normal: 'Frecuencia cardíaca normal. Mantener estilo de vida saludable.',
      mild: 'Frecuencia cardíaca ligeramente alterada. Monitorear y consultar si persiste.',
      moderate: 'Frecuencia cardíaca anormal. Consultar médico en las próximas 24-48 horas.',
      severe: 'Frecuencia cardíaca muy anormal. Buscar atención médica hoy.',
      critical: '¡EMERGENCIA! Buscar atención médica inmediata.',
    },
    bloodPressureSystolic: {
      normal: 'Presión arterial óptima. Mantener hábitos saludables.',
      mild: 'Presión ligeramente elevada. Reducir sal y estrés.',
      moderate: 'Hipertensión grado 1. Consultar médico esta semana.',
      severe: 'Hipertensión grado 2. Consultar médico en 24 horas.',
      critical: '¡CRISIS HIPERTENSIVA! Emergencia médica inmediata.',
    },
    temperature: {
      normal: 'Temperatura corporal normal.',
      mild: 'Febrícula. Hidratarse y descansar. Monitorear evolución.',
      moderate: 'Fiebre moderada. Tomar antipiréticos y consultar si persiste.',
      severe: 'Fiebre alta. Consultar médico urgente.',
      critical: '¡FIEBRE MUY ALTA! Emergencia médica. Riesgo de convulsiones.',
    },
    oxygenSaturation: {
      normal: 'Saturación de oxígeno excelente.',
      mild: 'Saturación ligeramente baja. Respirar profundo y monitorear.',
      moderate: 'Hipoxemia leve. Consultar médico pronto.',
      severe: 'Hipoxemia moderada. Buscar atención médica urgente.',
      critical: '¡HIPOXEMIA SEVERA! Requiere oxígeno suplementario urgente.',
    },
    // ... Más recomendaciones para otros signos vitales
    bloodPressureDiastolic: {
      normal: 'Presión diastólica normal.',
      mild: 'Presión diastólica ligeramente alterada.',
      moderate: 'Presión diastólica anormal. Consultar médico.',
      severe: 'Presión diastólica preocupante. Atención médica urgente.',
      critical: '¡EMERGENCIA! Presión diastólica crítica.',
    },
    respiratoryRate: {
      normal: 'Frecuencia respiratoria normal.',
      mild: 'Respiración ligeramente alterada. Relajarse y respirar profundo.',
      moderate: 'Taquipnea o bradipnea. Evaluar causa y consultar.',
      severe: 'Dificultad respiratoria. Buscar atención médica.',
      critical: '¡INSUFICIENCIA RESPIRATORIA! Emergencia médica.',
    },
    glucose: {
      normal: 'Glucemia en rango normal.',
      mild: 'Glucemia ligeramente alterada. Ajustar dieta.',
      moderate: 'Prediabetes o hiperglucemia. Consultar endocrinólogo.',
      severe: 'Diabetes no controlada. Requiere tratamiento urgente.',
      critical: '¡EMERGENCIA DIABÉTICA! Riesgo de coma.',
    },
    weight: {
      normal: 'Peso dentro del rango saludable.',
      mild: 'Ligero sobrepeso o bajo peso. Ajustar nutrición.',
      moderate: 'Sobrepeso u obesidad grado 1. Plan nutricional necesario.',
      severe: 'Obesidad grado 2. Requiere intervención médica.',
      critical: 'Obesidad mórbida. Riesgo cardiovascular alto.',
    },
    height: {
      normal: 'Altura dentro del rango normal.',
      mild: 'Altura en percentil bajo o alto.',
      moderate: 'Evaluar crecimiento con pediatra/endocrinólogo.',
      severe: 'Posible trastorno del crecimiento.',
      critical: 'Requiere evaluación especializada urgente.',
    },
    bmi: {
      normal: 'IMC saludable. Mantener estilo de vida activo.',
      mild: 'Ligero sobrepeso. Aumentar actividad física.',
      moderate: 'Sobrepeso. Implementar cambios en dieta y ejercicio.',
      severe: 'Obesidad. Requiere plan médico integral.',
      critical: 'Obesidad severa. Alto riesgo de comorbilidades.',
    },
  };

  return recommendations[type]?.[severity] || 'Consultar con profesional médico para evaluación.';
};

// 🚑 DETERMINAR URGENCIA
const determineUrgency = (severity: MedicalSeverity): ValidationResult['urgency'] => {
  switch (severity) {
    case 'normal':
      return 'routine';
    case 'mild':
      return 'routine';
    case 'moderate':
      return 'soon';
    case 'severe':
      return 'urgent';
    case 'critical':
      return 'emergency';
  }
};

// 🎯 HOOK PRINCIPAL
export const useMedicalValidation = () => {
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);

  // 🩺 VALIDAR SIGNO VITAL
  const validateVitalSign = useCallback((
    type: VitalSignType, 
    value: number,
    patientAge?: number,
    patientConditions?: string[]
  ): ValidationResult => {
    const range = NORMAL_VITAL_RANGES[type];
    const isNormal = value >= range.min && value <= range.max;
    const severity = calculateSeverity(type, value);
    const recommendation = getRecommendation(type, value, severity);
    const urgency = determineUrgency(severity);

    // 🚨 Generar alertas específicas
    const alerts: string[] = [];
    
    // Alertas por valores críticos
    if (severity === 'critical') {
      alerts.push('⚠️ VALOR CRÍTICO - Requiere atención médica inmediata');
    }

    // Alertas específicas por tipo
    if (type === 'oxygenSaturation' && value < 90) {
      alerts.push('🚨 Saturación de oxígeno peligrosamente baja');
    }
    
    if (type === 'bloodPressureSystolic' && value > 180) {
      alerts.push('🚨 Crisis hipertensiva - Emergencia médica');
    }
    
    if (type === 'temperature' && value > 40) {
      alerts.push('🚨 Hipertermia severa - Riesgo vital');
    }

    if (type === 'glucose' && value < 50) {
      alerts.push('🚨 Hipoglucemia severa - Riesgo de pérdida de conciencia');
    }

    // Ajustes por edad (ejemplo simplificado)
    if (patientAge) {
      if (patientAge > 65 && type === 'bloodPressureSystolic') {
        // Ajustar rangos para adultos mayores
        range.max = 130;
      }
      if (patientAge < 18 && type === 'heartRate') {
        // Ajustar rangos para niños
        range.min = 70;
        range.max = 120;
      }
    }

    const result: ValidationResult = {
      isNormal,
      severity,
      value,
      unit: range.unit,
      normalRange: range,
      recommendation,
      urgency,
      alerts,
    };

    // Guardar en historial
    setValidationHistory(prev => [...prev, result]);

    return result;
  }, []);

  // 💊 VALIDAR DOSIS DE MEDICAMENTO
  const validateMedicationDose = useCallback((
    medication: string,
    dose: number,
    unit: string,
    patientWeight?: number,
    patientAge?: number
  ) => {
    // Implementación simplificada - en producción usar base de datos de medicamentos
    const commonMedications: Record<string, { min: number; max: number; unit: string }> = {
      paracetamol: { min: 500, max: 1000, unit: 'mg' },
      ibuprofeno: { min: 200, max: 800, unit: 'mg' },
      amoxicilina: { min: 250, max: 1000, unit: 'mg' },
      // ... más medicamentos
    };

    const medInfo = commonMedications[medication.toLowerCase()];
    if (!medInfo) {
      return {
        isValid: false,
        message: 'Medicamento no encontrado en base de datos. Verificar con farmacéutico.',
      };
    }

    const isValid = dose >= medInfo.min && dose <= medInfo.max;
    const message = isValid 
      ? 'Dosis dentro del rango terapéutico normal.'
      : `Dosis fuera del rango normal (${medInfo.min}-${medInfo.max} ${medInfo.unit})`;

    return { isValid, message, recommendedRange: medInfo };
  }, []);

  // 📊 VALIDAR MÚLTIPLES VITALES
  const validateMultipleVitals = useCallback((
    vitals: Partial<Record<VitalSignType, number>>
  ): Record<VitalSignType, ValidationResult> => {
    const results: Partial<Record<VitalSignType, ValidationResult>> = {};
    
    Object.entries(vitals).forEach(([type, value]) => {
      if (typeof value === 'number') {
        results[type as VitalSignType] = validateVitalSign(type as VitalSignType, value);
      }
    });

    return results as Record<VitalSignType, ValidationResult>;
  }, [validateVitalSign]);

  // 🏥 CALCULAR SCORE DE SALUD GENERAL
  const calculateHealthScore = useCallback((
    validations: ValidationResult[]
  ): { score: number; status: 'excellent' | 'good' | 'fair' | 'poor'; message: string } => {
    if (validations.length === 0) {
      return { score: 0, status: 'fair', message: 'Sin datos suficientes' };
    }

    const severityScores: Record<MedicalSeverity, number> = {
      normal: 100,
      mild: 80,
      moderate: 60,
      severe: 30,
      critical: 0,
    };

    const totalScore = validations.reduce((sum, val) => sum + severityScores[val.severity], 0);
    const averageScore = totalScore / validations.length;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (averageScore >= 90) {
      status = 'excellent';
      message = 'Excelente estado de salud. Mantener hábitos actuales.';
    } else if (averageScore >= 70) {
      status = 'good';
      message = 'Buen estado de salud con áreas de mejora menor.';
    } else if (averageScore >= 50) {
      status = 'fair';
      message = 'Estado de salud regular. Se recomienda consulta médica.';
    } else {
      status = 'poor';
      message = 'Estado de salud preocupante. Buscar atención médica pronto.';
    }

    return { score: Math.round(averageScore), status, message };
  }, []);

  // 🔄 LIMPIAR HISTORIAL
  const clearValidationHistory = useCallback(() => {
    setValidationHistory([]);
  }, []);

  return {
    validateVitalSign,
    validateMedicationDose,
    validateMultipleVitals,
    calculateHealthScore,
    validationHistory,
    clearValidationHistory,
  };
};