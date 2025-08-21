// Migrated partial anamnesis data from web-app (simplified subset)
// Datos ahora usan tipos desde @altamedica/types/medical

import { 
  EscenaAnamnesis, 
  HistoriaMedica, 
  Logro, 
  PreguntaAnamnesis, 
  SeccionAnamnesis 
} from '@altamedica/types/medical'

// Placeholder: this file will be replaced with the full structured dataset or fetched from API in future.
export const HISTORIAS_MEDICAS: Record<string, HistoriaMedica> = {
  'datos-personales': {
    id: 'datos-personales',
    titulo: 'Datos Personales',
    contenido: 'Información básica del paciente para anamnesis.'
  },
  'motivo-principal': {
    id: 'motivo-principal',
    titulo: 'Motivo de Consulta',
    contenido: 'Describe la razón principal de la visita médica.'
  }
}

export const LOGROS: Record<string, Logro> = {
  'primer-paso': { id: 'primer-paso', nombre: 'Primer Paso', descripcion: 'Completaste tu primera pregunta', icono: '👣', puntos: 10, rareza: 'comun' }
}

export const PREGUNTAS: PreguntaAnamnesis[] = [
  {
    id: 'motivo-principal',
    texto: '¿Cuál es el motivo principal de tu consulta hoy?',
    tipo: 'textarea',
    historiaPreliminar: HISTORIAS_MEDICAS['motivo-principal'],
    explicacionMedica: 'El motivo de consulta es la base del diagnóstico clínico inicial.',
    puntosGamificacion: 15,
    categoria: 'MOTIVO_CONSULTA',
    requerida: true,
    orden: 1
  }
]

export const SECCIONES_ANAMNESIS: SeccionAnamnesis[] = [
  {
    id: 'motivo',
    titulo: 'Motivo de Consulta',
    descripcion: 'Describe el problema principal que te trae a la consulta.',
    preguntas: PREGUNTAS,
    historia: HISTORIAS_MEDICAS['motivo-principal'],
    logrosDesbloqueables: [LOGROS['primer-paso']],
    orden: 1,
    puntosSeccion: 50
  }
]

export const ESCENAS: Record<string, EscenaAnamnesis> = {
  motivo: {
    id: 'motivo',
    titulo: 'Escena Inicial',
    descripcion: 'Contexto introductorio de la anamnesis.',
    imagenUrl: '/images/anamnesis/motivo.png',
    secciones: ['motivo'],
    orden: 1,
    puntosEscena: 25
  }
}
