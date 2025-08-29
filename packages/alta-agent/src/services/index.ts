/**
 * ESM Module: Servicios para Alta Agent
 * Punto de entrada para subpaquete `@altamedica/alta-agent/services`
 */

// Servicios existentes ya implementados en el core
export { AltaAgent } from '../core/AltaAgent';
export { type AltaAgentConfig, type AltaAgentState } from '../types/alta.types';

// Re-export para compatibilidad con imports esperados
export { AltaAgent as AltaAgentService } from '../core/AltaAgent';
