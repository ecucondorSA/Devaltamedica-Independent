// Migrated pure service utilities from web-app/src/services/anamnesisService.ts
// Persistence-related functions (guardar / obtener) are intentionally omitted here to avoid coupling
// with frontend Firebase config. A future adapter can inject a Firestore instance if needed.

import { RespuestaAnamnesis } from '../types/anamnesis.types'

// ---- Pure utility functions ----

export const generarResumenMedico = (respuestas: Record<string, RespuestaAnamnesis>): string => {
  const secciones = {
    datosPersonales: [] as string[],
    motivoConsulta: [] as string[],
    enfermedadActual: [] as string[],
    antecedentesPersonales: [] as string[],
    antecedentesFamiliares: [] as string[],
    revisionSistemas: [] as string[]
  }

  for (const preguntaId in respuestas) {
    const respuesta: RespuestaAnamnesis = respuestas[preguntaId]
    const valor = respuesta.respuesta
    if (preguntaId.includes('nombre')) secciones.datosPersonales.push(`Nombre: ${valor}`)
    else if (preguntaId.includes('edad')) secciones.datosPersonales.push(`Edad: ${valor} años`)
    else if (preguntaId.includes('sexo')) secciones.datosPersonales.push(`Sexo: ${valor}`)
    else if (preguntaId.includes('ocupacion')) secciones.datosPersonales.push(`Ocupación: ${valor}`)
    else if (preguntaId.includes('motivo')) secciones.motivoConsulta.push(valor)
    else if (preguntaId.includes('inicio') || preguntaId.includes('como-comenzo')) secciones.enfermedadActual.push(valor)
    else if (preguntaId.includes('dolor')) secciones.enfermedadActual.push(`Características del dolor: ${valor}`)
    else if (preguntaId.includes('enfermedades-previas')) secciones.antecedentesPersonales.push(`Enfermedades previas: ${valor}`)
    else if (preguntaId.includes('alergias')) secciones.antecedentesPersonales.push(`Alergias: ${valor}`)
    else if (preguntaId.includes('habitos')) secciones.antecedentesPersonales.push(`Hábitos: ${valor}`)
    else if (preguntaId.includes('familiares')) secciones.antecedentesFamiliares.push(valor)
  }

  let resumen = '# HISTORIA CLÍNICA - ANAMNESIS\n\n'
  resumen += '## DATOS DE FILIACIÓN\n'
  secciones.datosPersonales.forEach(dato => { resumen += `- ${dato}\n` })
  resumen += '\n## MOTIVO DE CONSULTA\n'
  secciones.motivoConsulta.forEach(motivo => { resumen += `${motivo}\n` })
  resumen += '\n## ENFERMEDAD ACTUAL\n'
  secciones.enfermedadActual.forEach(info => { resumen += `${info}\n` })
  if (secciones.antecedentesPersonales.length > 0) {
    resumen += '\n## ANTECEDENTES PERSONALES\n'
    secciones.antecedentesPersonales.forEach(ant => { resumen += `- ${ant}\n` })
  }
  if (secciones.antecedentesFamiliares.length > 0) {
    resumen += '\n## ANTECEDENTES FAMILIARES\n'
    secciones.antecedentesFamiliares.forEach(ant => { resumen += `${ant}\n` })
  }
  resumen += '\n---\n'
  resumen += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`
  resumen += `Hora: ${new Date().toLocaleTimeString('es-ES')}\n`
  return resumen
}

export const analizarRespuestasParaRecomendaciones = (
  respuestas: Record<string, RespuestaAnamnesis>
): string[] => {
  const recomendaciones: string[] = []
  const edad = respuestas['edad']?.respuesta
  if (edad && parseInt(edad) > 65) {
    recomendaciones.push('Considerar evaluación geriátrica integral')
  }
  const alergias = respuestas['alergias']?.respuesta
  if (alergias && String(alergias).toLowerCase().includes('medicamento')) {
    recomendaciones.push('⚠️ ALERTA: Paciente con alergias medicamentosas - Verificar antes de prescribir')
  }
  const motivoConsulta = respuestas['motivo-principal']?.respuesta?.toLowerCase() || ''
  const dolor = respuestas['dolor-caracteristicas']?.respuesta?.toLowerCase() || ''
  if (motivoConsulta.includes('pecho') || dolor.includes('opresivo')) {
    recomendaciones.push('🚨 Posibles síntomas cardíacos - Evaluar con ECG urgente')
  }
  if (motivoConsulta.includes('cabeza') && dolor.includes('peor de mi vida')) {
    recomendaciones.push('🚨 Cefalea de alarma - Descartar hemorragia subaracnoidea')
  }
  const habitos = respuestas['habitos']?.respuesta?.toLowerCase() || ''
  if (habitos.includes('tabaco') || habitos.includes('fumar')) {
    recomendaciones.push('Programa de cesación tabáquica recomendado')
  }
  if (habitos.includes('sedentario') || !habitos.includes('ejercicio')) {
    recomendaciones.push('Recomendar actividad física regular')
  }
  return recomendaciones
}

// Placeholders for future persistence adapter
export const guardarAnamnesisFirebase = async () => {
  throw new Error('guardarAnamnesisFirebase no implementado en @altamedica/anamnesis (requiere adapter)')
}
export const obtenerUltimaAnamnesis = async () => {
  throw new Error('obtenerUltimaAnamnesis no implementado en @altamedica/anamnesis (requiere adapter)')
}
