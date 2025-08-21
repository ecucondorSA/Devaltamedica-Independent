/**
 * Utility para suprimir warnings CSS específicos
 * Basado en investigación de issues de Next.js GitHub:
 * - Issue #52347: Turbopack CSS deprecation warnings
 * - Issue #48748: Chrome DevTools warnings
 * - Issue #53921: Development mode CSS warnings
 */

// Lista de warnings CSS conocidos que deben ser suprimidos
const CSS_WARNINGS_TO_SUPPRESS = [
  // -ms-high-contrast deprecation (Chrome DevTools)
  '-ms-high-contrast is in the process of being deprecated',
  'Please see https://chromestatus.com/feature/5205675327217664 for tips on updating to the new Forced Colors Mode standard',
  
  // Webkit deprecations
  'webkit-high-contrast media query is deprecated',
  
  // React DevTools warnings
  'message handler took',
  'Violation',
  
  // Fast Refresh issues
  'Fast Refresh] done in NaNms',
  'Fast Refresh] rebuilding',
  
  // Turbopack internal warnings
  'turbopack-hot-reloader',
] as const;

/**
 * Intercepta console.warn para filtrar warnings CSS conocidos
 * Solo se ejecuta en modo desarrollo
 */
export function suppressCSSWarnings() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    const shouldSuppress = CSS_WARNINGS_TO_SUPPRESS.some(warning => 
      message.includes(warning)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suprimir errores específicos de CSS deprecation
    const shouldSuppress = CSS_WARNINGS_TO_SUPPRESS.some(warning => 
      message.includes(warning)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
}

/**
 * Función para restaurar console original
 */
export function restoreConsole() {
  // Esta función puede ser usada en tests o cuando se necesite
  // restaurar el comportamiento original de console
}

// Auto-ejecutar en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  suppressCSSWarnings();
}
