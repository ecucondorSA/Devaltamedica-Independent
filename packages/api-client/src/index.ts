/**
 * 🌐 @ALTAMEDICA/API-CLIENT
 * Cliente API centralizado para toda la plataforma AltaMedica
 * Gestión unificada de llamadas, errores, autenticación y tipos
 */

// Export base types first to avoid circular dependencies
export * from './base-types';

// Then export the rest
export * from './client';
export * from './types';
export * from './endpoints';
export * from './errors';
export * from './hooks';
export * from './cache/strategies';
export * from './hooks/optimistic/useOptimisticAppointments';