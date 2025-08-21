/**
 * @fileoverview Hooks de formularios centralizados
 * @module @altamedica/hooks/forms
 * @description Hooks para gestión de formularios, validación y estado
 */

// Nota: Por ahora solo exportamos los hooks existentes en esta carpeta.
// Cuando se agreguen los demás módulos, se reactivarán sus exports.

// Hooks de integración disponibles (solo los existentes)
export { useFormWithAPI } from './useFormWithAPI';
export { useFormWithAuth } from './useFormWithAuth';
export { useFormWithCache } from './useFormWithCache';

// Tipos principales (solo los existentes actualmente)
export type { FormConfig, FormState } from './types';

// Constantes y utilidades disponibles actualmente
export { DEFAULT_FORM_CONFIG } from './config';
export { FORM_VALIDATION_MESSAGES } from './constants';

