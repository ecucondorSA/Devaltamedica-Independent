/**
 * @fileoverview Hooks de accesibilidad temporales para la aplicación de pacientes
 * @description Implementación temporal mientras se refactoriza '@altamedica/hooks'
 * @todo Migrar a '@altamedica/hooks' una vez que esté estable
 */

// Re-exportar desde el package centralizado - TEMPORALMENTE DESHABILITADO
// export {
//   useAccessibility,
//   useAccessibilityCapabilities,
//   useWCAGCompliance
// } from '@altamedica/hooks';

// Implementación temporal local
export const useAccessibility = () => {
  return {
    isHighContrast: false,
    fontSize: 'normal' as const,
    enableScreenReader: false,
  };
};

export const useAccessibilityCapabilities = () => {
  return {
    hasScreenReader: false,
    hasKeyboardNavigation: true,
  };
};

export const useWCAGCompliance = () => {
  return {
    level: 'AA' as const,
    violations: [],
  };
};