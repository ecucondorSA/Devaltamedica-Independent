/**
 * @fileoverview Type guards para validación general
 * @module @altamedica/types/guards/validation-guards
 * @description Guards para validación de datos comunes y utilidades
 */

import { z } from 'zod';

// ==================== PRIMITIVE GUARDS ====================

/**
 * Verifica si un valor es una cadena no vacía
 * @param value - Valor a verificar
 * @returns true si es string no vacío
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica si un valor es un número válido
 * @param value - Valor a verificar
 * @returns true si es número válido
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Verifica si un valor es un entero positivo
 * @param value - Valor a verificar
 * @returns true si es entero positivo
 */
export function isPositiveInteger(value: unknown): value is number {
  return isValidNumber(value) && value > 0 && Number.isInteger(value);
}

/**
 * Verifica si un valor es una fecha válida
 * @param value - Valor a verificar
 * @returns true si es fecha válida
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Verifica si un valor es una fecha en el pasado
 * @param value - Valor a verificar
 * @returns true si es fecha pasada
 */
export function isPastDate(value: unknown): value is Date {
  return isValidDate(value) && value < new Date();
}

/**
 * Verifica si un valor es una fecha en el futuro
 * @param value - Valor a verificar
 * @returns true si es fecha futura
 */
export function isFutureDate(value: unknown): value is Date {
  return isValidDate(value) && value > new Date();
}

// ==================== FORMAT GUARDS ====================

/**
 * Verifica si un valor es un email válido
 * @param value - Valor a verificar
 * @returns true si es email válido
 */
export function isValidEmail(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Verifica si un valor es un UUID válido
 * @param value - Valor a verificar
 * @returns true si es UUID válido
 */
export function isValidUUID(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Verifica si un valor es un teléfono válido (formato internacional)
 * @param value - Valor a verificar
 * @returns true si es teléfono válido
 */
export function isValidPhone(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Verifica si un valor es una URL válida
 * @param value - Valor a verificar
 * @returns true si es URL válida
 */
export function isValidURL(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si un valor es una dirección IP válida
 * @param value - Valor a verificar
 * @returns true si es IP válida
 */
export function isValidIP(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  // IPv4
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(value)) return true;
  
  // IPv6 (simplificado)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(value);
}

// ==================== ARRAY GUARDS ====================

/**
 * Verifica si un valor es un array no vacío
 * @param value - Valor a verificar
 * @returns true si es array no vacío
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Verifica si todos los elementos de un array pasan una validación
 * @param value - Array a verificar
 * @param validator - Función validadora
 * @returns true si todos los elementos son válidos
 */
export function isArrayOf<T>(
  value: unknown,
  validator: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(validator);
}

/**
 * Verifica si un valor es un array de strings no vacíos
 * @param value - Valor a verificar
 * @returns true si es array de strings no vacíos
 */
export function isArrayOfStrings(value: unknown): value is string[] {
  return isArrayOf(value, isNonEmptyString);
}

/**
 * Verifica si un valor es un array de números válidos
 * @param value - Valor a verificar
 * @returns true si es array de números válidos
 */
export function isArrayOfNumbers(value: unknown): value is number[] {
  return isArrayOf(value, isValidNumber);
}

// ==================== OBJECT GUARDS ====================

/**
 * Verifica si un valor es un objeto plano (no null, no array)
 * @param value - Valor a verificar
 * @returns true si es objeto plano
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         !(value instanceof Date);
}

/**
 * Verifica si un objeto tiene todas las claves requeridas
 * @param value - Objeto a verificar
 * @param requiredKeys - Claves requeridas
 * @returns true si tiene todas las claves
 */
export function hasRequiredKeys<T extends string>(
  value: unknown,
  requiredKeys: T[]
): value is Record<T, unknown> {
  if (!isPlainObject(value)) return false;
  
  return requiredKeys.every(key => key in value);
}

/**
 * Verifica si un objeto tiene exactamente las claves especificadas
 * @param value - Objeto a verificar
 * @param exactKeys - Claves exactas
 * @returns true si tiene exactamente esas claves
 */
export function hasExactKeys<T extends string>(
  value: unknown,
  exactKeys: T[]
): value is Record<T, unknown> {
  if (!isPlainObject(value)) return false;
  
  const objectKeys = Object.keys(value);
  return objectKeys.length === exactKeys.length &&
         exactKeys.every(key => key in value);
}

// ==================== CONDITIONAL GUARDS ====================

/**
 * Verifica si un valor cumple una condición personalizada
 * @param value - Valor a verificar
 * @param condition - Función de condición
 * @returns true si cumple la condición
 */
export function satisfiesCondition<T>(
  value: unknown,
  condition: (val: unknown) => val is T
): value is T {
  return condition(value);
}

/**
 * Verifica si un valor está en una lista de valores permitidos
 * @param value - Valor a verificar
 * @param allowedValues - Valores permitidos
 * @returns true si está en la lista
 */
export function isOneOf<T>(
  value: unknown,
  allowedValues: readonly T[]
): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Verifica si un valor está en un rango numérico
 * @param value - Valor a verificar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @param inclusive - Si incluye los extremos
 * @returns true si está en el rango
 */
export function isInRange(
  value: unknown,
  min: number,
  max: number,
  inclusive: boolean = true
): value is number {
  if (!isValidNumber(value)) return false;
  
  return inclusive 
    ? value >= min && value <= max
    : value > min && value < max;
}

// ==================== ZOD INTEGRATION GUARDS ====================

/**
 * Crea un type guard basado en un schema de Zod
 * @param schema - Schema de Zod
 * @returns Type guard
 */
export function createZodGuard<T>(
  schema: z.ZodSchema<T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    const result = schema.safeParse(value);
    return result.success;
  };
}

/**
 * Verifica si un valor pasa la validación de un schema de Zod
 * @param value - Valor a verificar
 * @param schema - Schema de Zod
 * @returns true si pasa la validación
 */
export function isValidBySchema<T>(
  value: unknown,
  schema: z.ZodSchema<T>
): value is T {
  const result = schema.safeParse(value);
  return result.success;
}

// ==================== NULLABLE GUARDS ====================

/**
 * Verifica si un valor no es null ni undefined
 * @param value - Valor a verificar
 * @returns true si no es null ni undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Verifica si un valor no es null
 * @param value - Valor a verificar
 * @returns true si no es null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Verifica si un valor no es undefined
 * @param value - Valor a verificar
 * @returns true si no es undefined
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// ==================== EXPORT CONVENIENCE GUARDS ====================

/**
 * Guards de validación agrupados por categoría
 */
export const ValidationGuards = {
  // Primitivos
  primitive: {
    isNonEmptyString,
    isValidNumber,
    isPositiveInteger,
    isValidDate,
    isPastDate,
    isFutureDate
  },
  
  // Formatos
  format: {
    isValidEmail,
    isValidUUID,
    isValidPhone,
    isValidURL,
    isValidIP
  },
  
  // Arrays
  array: {
    isNonEmptyArray,
    isArrayOf,
    isArrayOfStrings,
    isArrayOfNumbers
  },
  
  // Objetos
  object: {
    isPlainObject,
    hasRequiredKeys,
    hasExactKeys
  },
  
  // Condicionales
  conditional: {
    satisfiesCondition,
    isOneOf,
    isInRange
  },
  
  // Zod
  zod: {
    createZodGuard,
    isValidBySchema
  },
  
  // Nullable
  nullable: {
    isNotNullish,
    isNotNull,
    isNotUndefined
  }
} as const;