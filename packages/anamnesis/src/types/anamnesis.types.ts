// Tipos locales de anamnesis (extraídos del origen web-app). Mantener aquí para evitar dependencias cruzadas.
// TODO(MIGRATION): Unificar con @altamedica/types si procede.

export interface PreguntaAnamnesis {
	id: string
	texto: string
	tipo: 'text' | 'number' | 'select' | 'textarea' | 'booleano' | 'opciones' | 'date' | 'seccion'
	// English alias used in some migrated components
	type?: 'text' | 'number' | 'select' | 'textarea' | 'boolean' | 'date' | 'section'
	opciones?: string[]
	categoria?: string
	puntosGamificacion?: number
	nivelDificultad?: number
	requiereContextoClinico?: boolean
	requerida?: boolean
	requiereExplicacion?: boolean
	explicacion?: string
	explicacionMedica?: string
	historiaPreliminar?: {
		id: string
		titulo: string
		contenido: string
	}
	validacion?: (valor: any) => boolean | string
}

export interface RespuestaAnamnesis {
	preguntaId: string
	// Keep both spanish and english property names to be compatible with older code
	respuesta?: any
	valor?: any
	tipo?: string
	urgente?: boolean
	timestamp?: Date
	puntos?: number
	tiempoRespuesta?: number
	logros?: string[]
	contexto?: string
}

export interface LogroAnamnesis {
	id: string
	nombre: string
	descripcion: string
	puntosRequeridos: number
	emoji?: string
}

// Logros gamificados (utilizados por componentes GameComponents y LogrosComponent)
export type RarezaLogro = 'comun' | 'raro' | 'epico' | 'legendario'
export interface Logro {
	id: string
	nombre: string
	descripcion: string
	puntos: number
	rareza: RarezaLogro
	icono: string // emoji o representación visual
	fechaDesbloqueo?: string
}

export type UrgencyLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY'

export interface MedicalAlert {
	id: string
	type: 'info' | 'warning' | 'danger'
	title: string
	message: string
	priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface DrugInteractionResult {
	hasInteractions: boolean
	interactions: Array<{ drug1: string; drug2: string; severity: string; description?: string }>
	recommendations: string[]
}

export interface ValidationResult {
	valid: boolean
	severity?: 'info' | 'warning' | 'critical'
	message?: string
}

// Backwards-compatible aliases and minimal types expected by older consumers
// (e.g. hooks that were migrated from web-app). Keep these minimal and expand
// later if needed.

export type AnamnesisQuestion = PreguntaAnamnesis;
export type AnamnesisResponse = RespuestaAnamnesis;

// English aliases expected by some migrated hooks
export type AnamnesisSection = SeccionAnamnesis;

export interface ProgresoAnamnesis {
	seccionActual: number;
	preguntaActual: number;
	respuestas: Record<string, RespuestaAnamnesis>;
	puntosAcumulados: number;
	logrosObtenidos: string[];
	tiempoTotal: number;
	nivelCompletitud: number;
}

export interface SeccionAnamnesis {
	id: string;
	titulo?: string;
	preguntas?: PreguntaAnamnesis[];
	[key: string]: any;
}

export interface EscenaAnamnesis {
	id: string;
	titulo?: string;
	descripcion?: string;
	[key: string]: any;
}

export interface AnamnesisData {
	patientId?: string;
	// Support both array-of-sections and record keyed by section id used across codebase
	sections?: SeccionAnamnesis[] | Record<string, RespuestaAnamnesis[]> | Record<string, any>;
	progreso?: ProgresoAnamnesis;
	[key: string]: any;
}


