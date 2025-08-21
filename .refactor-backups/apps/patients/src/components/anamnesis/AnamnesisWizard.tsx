"use client"
import { Button, Card, Input } from '@altamedica/ui';
import { ESCENAS, SECCIONES_ANAMNESIS } from '../../data/anamnesis-data'
import { useAnamnesis } from '../../hooks/useAnamnesis'

export function AnamnesisWizard() {
  const { seccionActual, preguntaActual, responderPregunta, siguientePregunta, preguntaAnterior, progreso } = useAnamnesis({ secciones: SECCIONES_ANAMNESIS, escenas: ESCENAS })
  const pregunta = preguntaActual
  if (!pregunta) return <div className="p-4">Sin preguntas configuradas.</div>

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4 border rounded-md bg-white shadow">
      <h1 className="text-xl font-semibold">Anamnesis – {seccionActual.titulo}</h1>
      <div className="text-sm text-gray-600">Progreso: {progreso.nivelCompletitud}%</div>
      <div className="p-3 bg-blue-50 rounded">
        <p className="font-medium">{pregunta.texto}</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); siguientePregunta() }} className="space-y-2">
        <textarea className="w-full border rounded p-2" required={!!pregunta.requerida} onChange={e => responderPregunta(pregunta, e.target.value)} />
        <div className="flex gap-2 justify-between">
          <button type="button" onClick={preguntaAnterior} className="px-3 py-1 border rounded">Atrás</button>
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Siguiente</button>
        </div>
      </form>
    </div>
  )
}
