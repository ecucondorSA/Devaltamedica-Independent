/**
 * Firebase Functions para ALTAMEDICA
 * Sistema Unificado de Autenticación
 */

// Exportar funciones de custom claims
export { setCustomClaims, updateCustomClaims } from './setCustomClaims';

// Exportar funciones de marketplace
export { onApplicationAccepted, onContractCompleted, onDoctorReviewCreated, onCompanyReviewCreated } from './marketplace';
