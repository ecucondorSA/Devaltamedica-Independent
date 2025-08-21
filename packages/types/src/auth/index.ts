/**
 * Exports centralizados de tipos de autenticación
 */

// Roles unificados
export * from './roles';

// Auth tokens y contexto
export * from './auth-token';

// Nota: No re-exportamos símbolos ya incluidos vía export * para evitar TS2308
// (UserRole y AuthToken ya están disponibles). Eliminado ValidUserRole inexistente.