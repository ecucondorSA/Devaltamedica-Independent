/**
 * @altamedica/firebase/client-exports
 * Exportaciones seguras solo para el lado del cliente
 * NO incluye Firebase Admin para evitar errores de WebAssembly
 */

// Exportar configuración principal
export * from './config';

// Exportar funciones de performance
export * from './performance';

// Exportar cliente con funciones de inicialización
export * from './client';

// Exportar cliente-only para aplicaciones del lado del cliente
export * from './client-only';

// NO exportar admin para evitar problemas en el frontend
// export * from './admin'; // ❌ NO incluir en cliente
