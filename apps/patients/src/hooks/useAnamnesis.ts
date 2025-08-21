/**
 * 🏥 ANAMNESIS HOOK - PATIENTS APP
 * 
 * ✅ MIGRADO A PAQUETE UNIFICADO (2025-08-16)
 * 
 * Este archivo ahora es un wrapper del hook unificado
 * para mantener compatibilidad con código existente.
 * 
 * NUEVA UBICACIÓN: @altamedica/anamnesis
 * 
 * @deprecated Use useAnamnesis from @altamedica/anamnesis
 */

import { useAnamnesis as useAnamnesisUnified } from '@altamedica/anamnesis';
import type { 
  UseAnamnesisReturn as UnifiedReturn,
  UseAnamnesisOptions 
} from '@altamedica/anamnesis';

// Re-export types for backward compatibility
export type { 
  AnamnesisData,
  ProgresoAnamnesis,
  SeccionAnamnesis,
  PreguntaAnamnesis,
  RespuestaAnamnesis,
  Logro,
  EscenaAnamnesis 
} from '@altamedica/anamnesis';

// Legacy interface maintained for compatibility
interface UseAnamnesisReturn extends UnifiedReturn {}

/**
 * @deprecated Use useAnamnesis from @altamedica/anamnesis
 */
export function useAnamnesis(pacienteId?: string): UseAnamnesisReturn {
  // Use the unified hook with default options
  return useAnamnesisUnified({
    patientId: pacienteId,
    autoSave: true,
    mode: 'professional'
  });
}

// Default export for backward compatibility
export default useAnamnesis;