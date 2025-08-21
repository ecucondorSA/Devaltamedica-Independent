/**
 * @fileoverview Exportaciones del módulo médico principal
 * @module @altamedica/types/medical
 */

// Re-exportar todos los submódulos médicos
export * from './clinical';
export * from './doctor';
export * from './medication.types';
export * from './patient';

// Exportar tipos de anamnesis directamente para compatibilidad
export * from './anamnesis.types';

// También mantener el namespace para compatibilidad hacia atrás
export * as Anamnesis from './anamnesis.types';
