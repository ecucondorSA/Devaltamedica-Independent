/**
 * @fileoverview Utilidades para validación de datos
 * @module @altamedica/types/utils/validation-utils
 * @description Funciones utilitarias para validación y sanitización
 */

import { z } from 'zod';

/**
 * Resultado de validación con detalles
 */
export interface ValidationResult<T = any> {
  /** Validación exitosa */
  isValid: boolean;
  /** Datos validados (si es exitoso) */
  data?: T;
  /** Errores de validación */
  errors: ValidationError[];
  /** Warnings no críticos */
  warnings: ValidationWarning[];
}

/**
 * Error de validación detallado
 */
export interface ValidationError {
  /** Campo con error */
  field: string;
  /** Mensaje de error */
  message: string;
  /** Código de error */
  code: string;
  /** Valor que causó el error */
  value?: any;
  /** Valor esperado */
  expected?: any;
}

/**
 * Warning de validación
 */
export interface ValidationWarning {
  /** Campo con warning */
  field: string;
  /** Mensaje de warning */
  message: string;
  /** Código de warning */
  code: string;
  /** Valor actual */
  value?: any;
}

export const ValidationUtils = {
  /**
   * Valida un objeto con múltiples schemas
   * @param data - Datos a validar
   * @param schemas - Array de schemas a aplicar
   * @returns Resultado de validación
   */
  validateWithMultipleSchemas<T>(
    data: unknown,
    schemas: z.ZodSchema<T>[]
  ): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    for (const schema of schemas) {
      const result = schema.safeParse(data);
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).received,
          expected: (err as any).expected
        })));
      }
    }
    
    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? data as T : undefined,
      errors,
      warnings
    };
  },

  /**
   * Sanitiza una cadena removiendo caracteres peligrosos
   * @param str - Cadena a sanitizar
   * @param options - Opciones de sanitización
   * @returns Cadena sanitizada
   */
  sanitizeString(str: string, options: {
    removeHtml?: boolean;
    removeScripts?: boolean;
    maxLength?: number;
    allowedChars?: RegExp;
  } = {}): string {
    let sanitized = str;
    
    // Remover HTML si se especifica
    if (options.removeHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Remover scripts
    if (options.removeScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    // Limitar longitud
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    // Filtrar caracteres permitidos
    if (options.allowedChars) {
      sanitized = sanitized.replace(options.allowedChars, '');
    }
    
    return sanitized.trim();
  },

  /**
   * Normaliza un email
   * @param email - Email a normalizar
   * @returns Email normalizado
   */
  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  },

  /**
   * Normaliza un número de teléfono
   * @param phone - Teléfono a normalizar
   * @returns Teléfono normalizado
   */
  normalizePhone(phone: string): string {
    // Remover espacios, guiones y paréntesis
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Agregar + si no lo tiene y no es un número local
    if (!normalized.startsWith('+') && normalized.length > 10) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  },

  /**
   * Valida y normaliza un campo de entrada
   * @param value - Valor a procesar
   * @param type - Tipo de campo
   * @param options - Opciones adicionales
   * @returns Valor procesado y validación
   */
  processField(
    value: unknown,
    type: 'email' | 'phone' | 'string' | 'number' | 'date',
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    } = {}
  ): { value: any; isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let processedValue = value;
    
    // Verificar si es requerido
    if (options.required && (value === null || value === undefined || value === '')) {
      errors.push('Campo requerido');
      return { value: processedValue, isValid: false, errors };
    }
    
    // Si no es requerido y está vacío, retornar
    if (!options.required && (value === null || value === undefined || value === '')) {
      return { value: null, isValid: true, errors: [] };
    }
    
    switch (type) {
      case 'email':
        if (typeof value === 'string') {
          processedValue = this.normalizeEmail(value);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(processedValue as string)) {
            errors.push('Email inválido');
          }
        } else {
          errors.push('El email debe ser una cadena');
        }
        break;
        
      case 'phone':
        if (typeof value === 'string') {
          processedValue = this.normalizePhone(value);
          if (!/^\+?[1-9]\d{1,14}$/.test((processedValue as string).replace(/\D/g, ''))) {
            errors.push('Teléfono inválido');
          }
        } else {
          errors.push('El teléfono debe ser una cadena');
        }
        break;
        
      case 'string':
        if (typeof value === 'string') {
          processedValue = this.sanitizeString(value, { maxLength: options.maxLength });
          const str = processedValue as string;
          
          if (options.minLength && str.length < options.minLength) {
            errors.push(`Mínimo ${options.minLength} caracteres`);
          }
          if (options.maxLength && str.length > options.maxLength) {
            errors.push(`Máximo ${options.maxLength} caracteres`);
          }
          if (options.pattern && !options.pattern.test(str)) {
            errors.push('Formato inválido');
          }
        } else {
          errors.push('Debe ser una cadena');
        }
        break;
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push('Debe ser un número válido');
        } else {
          processedValue = num;
        }
        break;
        
      case 'date':
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            errors.push('Fecha inválida');
          }
        } else if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push('Fecha inválida');
          } else {
            processedValue = date;
          }
        } else {
          errors.push('Debe ser una fecha válida');
        }
        break;
    }
    
    return {
      value: processedValue,
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valida un conjunto de campos
   * @param data - Datos a validar
   * @param fieldDefinitions - Definiciones de campos
   * @returns Resultado de validación completa
   */
  validateFields(
    data: Record<string, unknown>,
    fieldDefinitions: Record<string, {
      type: 'email' | 'phone' | 'string' | 'number' | 'date';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      customValidator?: (value: any) => string | null;
    }>
  ): ValidationResult<Record<string, any>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const processedData: Record<string, any> = {};
    
    for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
      const fieldValue = data[fieldName];
      const result = this.processField(fieldValue, definition.type, definition);
      
      processedData[fieldName] = result.value;
      
      // Agregar errores
      result.errors.forEach(error => {
        errors.push({
          field: fieldName,
          message: error,
          code: 'validation_error',
          value: fieldValue
        });
      });
      
      // Validación personalizada
      if (definition.customValidator && result.isValid) {
        const customError = definition.customValidator(result.value);
        if (customError) {
          errors.push({
            field: fieldName,
            message: customError,
            code: 'custom_validation_error',
            value: fieldValue
          });
        }
      }
    }
    
    const result: ValidationResult<Record<string, any>> = {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
    if (errors.length === 0) {
      result.data = processedData;
    }
    
    return result;
  },

  /**
   * Crea un validador débil que permite errores menores
   * @param schema - Schema base
   * @param allowedErrors - Errores permitidos
   * @returns Validador débil
   */
  createLenientValidator<T>(
    schema: z.ZodSchema<T>,
    allowedErrors: string[] = []
  ): (data: unknown) => ValidationResult<T> {
    return (data: unknown) => {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          isValid: true,
          data: result.data,
          errors: [],
          warnings: []
        };
      }
      
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      result.error.errors.forEach(err => {
        const errorInfo = {
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).received
        };
        
        if (allowedErrors.includes(err.code)) {
          warnings.push(errorInfo);
        } else {
          errors.push(errorInfo);
        }
      });
      
      const validationResult: ValidationResult<T> = {
        isValid: errors.length === 0,
        errors,
        warnings
      };
      
      if (errors.length === 0) {
        validationResult.data = data as T;
      }
      
      return validationResult;
    };
  },

  /**
   * Combina múltiples resultados de validación
   * @param results - Resultados a combinar
   * @returns Resultado combinado
   */
  combineValidationResults<T>(
    results: ValidationResult<T>[]
  ): ValidationResult<T[]> {
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const validData = results
      .filter(r => r.isValid && r.data !== undefined)
      .map(r => r.data!);
    
    const combinedResult: ValidationResult<T[]> = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
    
    if (allErrors.length === 0) {
      combinedResult.data = validData;
    }
    
    return combinedResult;
  },

  /**
   * Crea un resumen de errores de validación
   * @param errors - Errores a resumir
   * @returns Resumen legible
   */
  summarizeValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return 'Sin errores';
    
    const errorsByField = errors.reduce((acc, error) => {
      if (!acc[error.field]) acc[error.field] = [];
      acc[error.field].push(error.message);
      return acc;
    }, {} as Record<string, string[]>);
    
    return Object.entries(errorsByField)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
  }
} as const;