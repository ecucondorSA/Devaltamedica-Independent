/**
 * 🎯 Tipos TypeScript para Validaciones Avanzadas
 * AltaMedica - Sistema de Validación de Nombres
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  numeric?: boolean;
  
  // 🆕 Validaciones avanzadas de nombres
  nameValidation?: NameValidationConfig;
  custom?: (value: any) => boolean | string;
}

export interface NameValidationConfig {
  type?: 'firstName' | 'lastName' | 'fullName';
  allowMiddleNames?: boolean;
  allowHyphens?: boolean;
  allowApostrophes?: boolean;
  checkConsonantLimit?: boolean;
  checkVowelLimit?: boolean;
  consonantLimit?: number;
  vowelLimit?: number;
  strictMode?: boolean;
  
  // Excepciones personalizadas
  customExceptions?: string[];
  
  // Configuración de reportes
  reportWarnings?: boolean;
  suggestCorrections?: boolean;
}

export interface NameValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  
  // Información detallada para debugging
  debug?: {
    consecutiveConsonants?: number;
    consecutiveVowels?: number;
    detectedPattern?: string;
    appliedExceptions?: string[];
  };
}

export interface FormFieldValidation extends ValidationRule {
  // Soporte para validación en tiempo real
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  
  // Mensajes personalizados
  messages?: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
    custom?: string;
  };
}

// 🎨 Presets de validación comunes para nombres
export const NAME_VALIDATION_PRESETS = {
  // Configuración estándar para nombres
  STANDARD_FIRST_NAME: {
    type: 'firstName' as const,
    allowMiddleNames: true,
    allowHyphens: true,
    allowApostrophes: false,
    checkConsonantLimit: true,
    checkVowelLimit: true,
    consonantLimit: 3,
    vowelLimit: 3,
    strictMode: false,
    reportWarnings: true
  },
  
  // Configuración estándar para apellidos
  STANDARD_LAST_NAME: {
    type: 'lastName' as const,
    allowMiddleNames: true,
    allowHyphens: true,
    allowApostrophes: true,
    checkConsonantLimit: true,
    checkVowelLimit: true,
    consonantLimit: 3,
    vowelLimit: 3,
    strictMode: false,
    reportWarnings: true
  },
  
  // Configuración estricta para entornos médicos
  MEDICAL_STRICT: {
    type: 'firstName' as const,
    allowMiddleNames: false,
    allowHyphens: false,
    allowApostrophes: false,
    checkConsonantLimit: true,
    checkVowelLimit: true,
    consonantLimit: 2,
    vowelLimit: 2,
    strictMode: true,
    reportWarnings: true,
    suggestCorrections: true
  },
  
  // Configuración internacional más flexible
  INTERNATIONAL: {
    type: 'firstName' as const,
    allowMiddleNames: true,
    allowHyphens: true,
    allowApostrophes: true,
    checkConsonantLimit: true,
    checkVowelLimit: true,
    consonantLimit: 4,
    vowelLimit: 4,
    strictMode: false,
    reportWarnings: false
  }
} as const;

// 🚀 Tipos de utilidad para el sistema de validación
export type ValidationPreset = keyof typeof NAME_VALIDATION_PRESETS;

export interface ValidationContext {
  fieldName: string;
  stepId?: string;
  formData?: Record<string, any>;
  userPreferences?: {
    language?: 'es' | 'en' | 'pt';
    strictMode?: boolean;
    culturalContext?: 'latin' | 'anglo' | 'other';
  };
}

export interface ValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  metadata?: ValidationMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

export interface ValidationSuggestion {
  original: string;
  suggested: string;
  reason: string;
  confidence: number; // 0-1
}

export interface ValidationMetadata {
  validatedAt: Date;
  validatorVersion: string;
  processingTime: number;
  rulesApplied: string[];
  exceptionsUsed?: string[];
}

// 🔧 Factory para crear configuraciones de validación
export function createNameValidationRule(
  preset: ValidationPreset,
  overrides?: Partial<NameValidationConfig>
): ValidationRule {
  const baseConfig = NAME_VALIDATION_PRESETS[preset];
  const mergedConfig = { ...baseConfig, ...overrides };
  
  return {
    nameValidation: mergedConfig,
    custom: (value: string) => {
      // Esta función será implementada por el NameValidator
      return true; // Placeholder
    }
  };
}

// 📋 Definición de códigos de error estándar
export const VALIDATION_ERROR_CODES = {
  // Errores básicos
  REQUIRED: 'validation.required',
  MIN_LENGTH: 'validation.minLength',
  MAX_LENGTH: 'validation.maxLength',
  INVALID_FORMAT: 'validation.invalidFormat',
  
  // Errores específicos de nombres
  INVALID_CHARACTERS: 'name.invalidCharacters',
  TOO_MANY_CONSONANTS: 'name.tooManyConsonants',
  TOO_MANY_VOWELS: 'name.tooManyVowels',
  INVALID_CAPITALIZATION: 'name.invalidCapitalization',
  CONTAINS_NUMBERS: 'name.containsNumbers',
  INVALID_SPECIAL_CHARS: 'name.invalidSpecialChars',
  
  // Errores de estructura
  MULTIPLE_SPACES: 'name.multipleSpaces',
  STARTS_WITH_SPACE: 'name.startsWithSpace',
  ENDS_WITH_SPACE: 'name.endsWithSpace',
  INVALID_HYPHEN_USAGE: 'name.invalidHyphenUsage',
  INVALID_APOSTROPHE_USAGE: 'name.invalidApostropheUsage'
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];

// 🌍 Configuraciones por idioma/región
export const LOCALE_CONFIGS = {
  'es-ES': {
    allowedChars: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\-']*$/,
    commonExceptions: ['josé', 'maría', 'jesús', 'ángel', 'raúl'],
    messages: {
      tooManyConsonants: 'Demasiadas consonantes consecutivas',
      tooManyVowels: 'Demasiadas vocales consecutivas',
      invalidChars: 'Caracteres no permitidos'
    }
  },
  'en-US': {
    allowedChars: /^[a-zA-Z\s\-']*$/,
    commonExceptions: ['edward', 'andrew', 'christopher', 'patricia'],
    messages: {
      tooManyConsonants: 'Too many consecutive consonants',
      tooManyVowels: 'Too many consecutive vowels',
      invalidChars: 'Invalid characters'
    }
  }
} as const;

export type SupportedLocale = keyof typeof LOCALE_CONFIGS;
