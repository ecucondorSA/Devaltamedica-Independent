/**
 * 🔌 Integración de Validaciones Avanzadas con FormField
 * AltaMedica - Extensión del Sistema de Validación
 */

import {
    NAME_VALIDATION_PRESETS,
    NameValidationConfig,
    ValidationPreset,
    ValidationRule
} from '../types/validation-types';
import { NameValidator } from './name-validators';

/**
 * 🚀 Función para extender las validaciones del FormField
 * 
 * Uso en FormField:
 * ```tsx
 * <FormField
 *   validation={createAdvancedValidation('firstName')}
 *   // ... otros props
 * />
 * ```
 */
export function createAdvancedValidation(
  type: 'firstName' | 'lastName' | 'fullName',
  preset: ValidationPreset = 'STANDARD_FIRST_NAME',
  customConfig?: Partial<NameValidationConfig>
): ValidationRule {
  
  const baseConfig = type === 'lastName' 
    ? NAME_VALIDATION_PRESETS.STANDARD_LAST_NAME 
    : NAME_VALIDATION_PRESETS.STANDARD_FIRST_NAME;
    
  const finalConfig = { ...baseConfig, ...customConfig };
  
  return {
    required: true,
    minLength: 2,
    maxLength: 50,
    
    // Validación personalizada que usa nuestro NameValidator
    custom: (value: string) => {
      if (!value || typeof value !== 'string') {
        return 'Este campo es requerido';
      }

      const validator = new NameValidator(finalConfig);
      const result = validator.validateName(value, type === 'lastName' ? 'lastName' : 'firstName');
      
      if (!result.isValid) {
        return result.errors[0]; // Retornar el primer error
      }
      
      // Si hay advertencias y el modo estricto está activado, tratarlas como errores
      if (finalConfig.strictMode && result.warnings.length > 0) {
        return result.warnings[0];
      }
      
      return true; // Válido
    }
  };
}

/**
 * 🎯 Validaciones predefinidas listas para usar
 */
export const PRESET_VALIDATIONS = {
  
  // Validación estándar para nombres
  firstName: createAdvancedValidation('firstName', 'STANDARD_FIRST_NAME'),
  
  // Validación estándar para apellidos
  lastName: createAdvancedValidation('lastName', 'STANDARD_LAST_NAME'),
  
  // Validación estricta para entornos médicos
  medicalFirstName: createAdvancedValidation('firstName', 'MEDICAL_STRICT'),
  medicalLastName: createAdvancedValidation('lastName', 'MEDICAL_STRICT'),
  
  // Validación internacional más flexible
  internationalFirstName: createAdvancedValidation('firstName', 'INTERNATIONAL'),
  internationalLastName: createAdvancedValidation('lastName', 'INTERNATIONAL'),
  
} as const;

/**
 * 📋 Ejemplos de uso en formularios
 */
export const FORM_VALIDATION_EXAMPLES = {
  
  // Formulario de registro básico
  basicRegistration: {
    nombre: PRESET_VALIDATIONS.firstName,
    apellido: PRESET_VALIDATIONS.lastName,
    email: {
      required: true,
      email: true,
      custom: (value: string) => {
        if (!value.includes('@')) return 'Email inválido';
        return true;
      }
    }
  },
  
  // Formulario médico estricto
  medicalRegistration: {
    nombre: PRESET_VALIDATIONS.medicalFirstName,
    apellido: PRESET_VALIDATIONS.medicalLastName,
    numeroLicencia: {
      required: true,
      pattern: /^[A-Z]{2}\d{6}$/,
      custom: (value: string) => {
        if (!value.match(/^[A-Z]{2}\d{6}$/)) {
          return 'Formato de licencia médica inválido (ej: AB123456)';
        }
        return true;
      }
    }
  },
  
  // Formulario internacional
  internationalRegistration: {
    firstName: PRESET_VALIDATIONS.internationalFirstName,
    lastName: PRESET_VALIDATIONS.internationalLastName,
    country: {
      required: true,
      minLength: 2,
      maxLength: 50
    }
  }
  
} as const;

/**
 * 🔧 Función helper para crear validaciones personalizadas
 */
export function createCustomNameValidation(options: {
  type: 'firstName' | 'lastName';
  consonantLimit?: number;
  vowelLimit?: number;
  allowHyphens?: boolean;
  allowApostrophes?: boolean;
  allowMiddleNames?: boolean;
  strictMode?: boolean;
  customExceptions?: string[];
  customMessages?: Record<string, string>;
}): ValidationRule {
  
  const config: NameValidationConfig = {
    type: options.type,
    consonantLimit: options.consonantLimit ?? 3,
    vowelLimit: options.vowelLimit ?? 3,
    allowHyphens: options.allowHyphens ?? true,
    allowApostrophes: options.allowApostrophes ?? true,
    allowMiddleNames: options.allowMiddleNames ?? true,
    strictMode: options.strictMode ?? false,
    customExceptions: options.customExceptions ?? []
  };
  
  return {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      const validator = new NameValidator(config);
      const result = validator.validateName(value, options.type);
      
      if (!result.isValid) {
        // Usar mensaje personalizado si está disponible
        const errorCode = result.errors[0];
        return options.customMessages?.[errorCode] ?? result.errors[0];
      }
      
      return true;
    }
  };
}

/**
 * 🧪 Función de prueba para validar la integración
 */
export function testFormFieldIntegration(): void {
  logger.info('🧪 Pruebas de Integración FormField + Validaciones Avanzadas\n');
  
  const testCases = [
    {
      name: 'Eduardo',
      validation: PRESET_VALIDATIONS.firstName,
      expectedValid: true
    },
    {
      name: 'Edward', // Excepción conocida
      validation: PRESET_VALIDATIONS.firstName,
      expectedValid: true
    },
    {
      name: 'Xxxyyy', // Demasiadas consonantes
      validation: PRESET_VALIDATIONS.firstName,
      expectedValid: false
    },
    {
      name: 'María José', // Nombre compuesto
      validation: PRESET_VALIDATIONS.firstName,
      expectedValid: true
    },
    {
      name: 'O\'Connor', // Apellido con apóstrofe
      validation: PRESET_VALIDATIONS.lastName,
      expectedValid: true
    }
  ];
  
  testCases.forEach(({ name, validation, expectedValid }) => {
    const result = validation.custom!(name);
    const isValid = result === true;
    const passed = isValid === expectedValid;
    const status = passed ? '✅' : '❌';
    
    logger.info(`${status} "${name}": ${isValid ? 'Válido' : result}`);
  });
}

/**
 * 📚 Documentación de uso
 */
export const USAGE_EXAMPLES = `
// 🎯 Uso Básico en Componente FormField

import { PRESET_VALIDATIONS } from '@altamedica/auth';

<FormField
  stepId="registro"
  fieldId="nombre"
  label="Nombre"
  type="text"
  validation={PRESET_VALIDATIONS.firstName}
  placeholder="Ingresa tu nombre"
/>

<FormField
  stepId="registro"
  fieldId="apellido"
  label="Apellido"
  type="text"
  validation={PRESET_VALIDATIONS.lastName}
  placeholder="Ingresa tu apellido"
/>

// 🔧 Uso Personalizado

import { createCustomNameValidation } from '@altamedica/auth';

const validacionEstricta = createCustomNameValidation({
  type: 'firstName',
  consonantLimit: 2,
  vowelLimit: 2,
  allowHyphens: false,
  strictMode: true,
  customMessages: {
    'Demasiadas consonantes': 'Tu nombre tiene demasiadas consonantes seguidas'
  }
});

<FormField
  validation={validacionEstricta}
  // ... otros props
/>

// 🌍 Configuración por Contexto Médico

import { FORM_VALIDATION_EXAMPLES } from '@altamedica/auth';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// Para registro médico estricto
const validaciones = FORM_VALIDATION_EXAMPLES.medicalRegistration;

<FormField validation={validaciones.nombre} />
<FormField validation={validaciones.apellido} />
<FormField validation={validaciones.numeroLicencia} />
`;

// Exportar todo lo necesario
export default {
  createAdvancedValidation,
  PRESET_VALIDATIONS,
  FORM_VALIDATION_EXAMPLES,
  createCustomNameValidation,
  testFormFieldIntegration,
  USAGE_EXAMPLES
};
