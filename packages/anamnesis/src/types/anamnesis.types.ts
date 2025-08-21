// Tipos locales de anamnesis (extraídos del origen web-app). Mantener aquí para evitar dependencias cruzadas.
// TODO(MIGRATION): Unificar con @altamedica/types si procede.

export interface PreguntaAnamnesis {
	id: string
	texto: string
	tipo: 'text' | 'number' | 'select' | 'textarea' | 'booleano' | 'opciones' | 'date' | 'seccion'
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
	respuesta: any
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

