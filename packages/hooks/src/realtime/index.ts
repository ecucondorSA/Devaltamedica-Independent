/**
 * @fileoverview Hooks de tiempo real - solo archivos existentes
 */

// Hooks que realmente existen
export { useNotifications } from './useNotifications';
export { useRealTimeUpdates } from './useRealTimeUpdates'; 
export { useWebSocket } from './useWebSocket';
// Export placeholder until real WebRTC is wired via @altamedica/telemedicine-core
export { useWebRTC } from './useWebRTC';

// Tipos que existen
export * from './types';

// Constantes que existen
export * from './constants';