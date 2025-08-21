/**
 * BRIDGE FILE - Re-export from @altamedica/types
 * 
 * Este archivo ahora re-exporta los tipos de anamnesis desde el paquete compartido
 * @altamedica/types para mantener compatibilidad con código existente.
 * 
 * IMPORTANTE: Use directamente '@altamedica/types/medical' en nuevo código
 * 
 * @deprecated Use '@altamedica/types/medical' directamente
 */

export type {
  // Tipos básicos
  TipoPregunta,
  RarezaLogro,
  UrgencyLevel,
  AlertType,
  AlertPriority,
  ValidationSeverity,
  CategoriaAnamnesis,
  
  // Interfaces
  HistoriaMedica,
  LogroAnamnesis,
  Logro,
  PreguntaAnamnesis,
  RespuestaAnamnesis,
  ValidationResult,
  MedicalAlert,
  VitalSigns,
  ClinicalAnalysis,
  SeccionAnamnesis,
  ProgresoAnamnesis,
  EscenaAnamnesis,
  NivelGamificacion,
  EstadisticasAnamnesis,
  ResumenMedico,
} from '@altamedica/types/medical';

// Re-export schemas si son necesarios
export {
  VitalSignsSchema,
  MedicalAlertSchema,
  ClinicalAnalysisSchema,
  RespuestaAnamnesisSchema,
  ResumenMedicoSchema,
} from '@altamedica/types/medical';