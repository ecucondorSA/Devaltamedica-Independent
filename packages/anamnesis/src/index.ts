// Barrel principal del paquete @altamedica/anamnesis
// ✅ MIGRACIÓN COMPLETA - Consolidación de componentes anamnesis

// Types are available via their files directly. Avoid re-exporting here to prevent
// duplicate type symbol collisions with component-local types during d.ts bundling.

// Componente principal unificado
export * from './components/UnifiedAnamnesis'

// Hook unificado
export * from './hooks/useAnamnesis'

// Componentes (se irán añadiendo)
export * from './components/HistoriaMedicaComponent'
export * from './components/placeholder'
// Lote 1 migrado
export * from './components/GameComponents'
export * from './components/HistoriaInteractiva'
export * from './components/LogrosComponent'
export * from './components/PreguntaInteractiva'
export * from './components/ResumenAnamnesis'
// Servicios utilitarios
export * from './services/anamnesisService'

