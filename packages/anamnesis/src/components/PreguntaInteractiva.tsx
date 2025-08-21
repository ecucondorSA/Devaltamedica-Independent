'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import { PreguntaAnamnesis, RespuestaAnamnesis } from '../types/anamnesis.types'
import { PuntosFlotantes } from './GameComponents'
import { ExplicacionMedica } from './HistoriaInteractiva'

interface PreguntaInteractivaProps { pregunta: PreguntaAnamnesis; onResponder: (respuesta: RespuestaAnamnesis) => void; respuestaPrevia?: any }
export function PreguntaInteractiva(props: PreguntaInteractivaProps) {
  const [valor, setValor] = useState(props.respuestaPrevia || '')
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tiempoInicio] = useState(Date.now())
  const [mostrarPuntos, setMostrarPuntos] = useState(false)
  const [coordenadasPuntos, setCoordenanasPuntos] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300) }, [props.pregunta.id])
  const validarYEnviar = (e?: React.MouseEvent) => {
  if (!valor && props.pregunta.tipo !== 'booleano') { setError('Por favor, completa este campo'); return }
    if (props.pregunta.validacion) { const r = props.pregunta.validacion(valor as any); if (typeof r === 'string') { setError(r); return } else if (!r) { setError('Valor inválido'); return } }
    if (e) { setCoordenanasPuntos({ x: e.clientX, y: e.clientY }); setMostrarPuntos(true); setTimeout(() => setMostrarPuntos(false), 1000) }
  props.onResponder({ preguntaId: props.pregunta.id, respuesta: valor, puntos: props.pregunta.puntosGamificacion || 0, tiempoRespuesta: (Date.now() - tiempoInicio) / 1000, logros: [], contexto: props.pregunta.categoria })
  }
  const renderInput = () => {
    switch (props.pregunta.tipo) {
      case 'text': return <motion.input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" value={valor} onChange={e => { setValor(e.target.value); setError(null) }} onKeyPress={e => e.key === 'Enter' && validarYEnviar()} className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${error ? 'border-red-500 shake' : 'border-gray-300 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-200`} placeholder="Escribe tu respuesta aquí..." initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }} />
      case 'number': return <motion.input ref={inputRef as React.RefObject<HTMLInputElement>} type="number" value={valor} onChange={e => { setValor(e.target.value); setError(null) }} onKeyPress={e => e.key === 'Enter' && validarYEnviar()} className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${error ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-200`} placeholder="Ingresa un número..." initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
      case 'textarea': return <motion.textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={valor} onChange={e => { setValor(e.target.value); setError(null) }} rows={4} className={`w-full px-4 py-3 border-2 rounded-lg transition-all resize-none ${error ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-200`} placeholder="Cuéntanos con detalle..." initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
      case 'select': return <div className="space-y-2">{props.pregunta.opciones?.map((opcion, index) => <motion.button key={opcion} onClick={() => { setValor(opcion); setError(null); setTimeout(() => validarYEnviar(), 100) }} className={`w-full px-4 py-3 text-left rounded-lg transition-all ${valor === opcion ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><span className="flex items-center gap-3"><span className={`text-2xl ${valor === opcion ? 'animate-bounce' : ''}`}>{index === 0 ? '🔵' : index === 1 ? '🟢' : '🟡'}</span>{opcion}</span></motion.button>)}</div>
      case 'date': return <motion.input ref={inputRef as React.RefObject<HTMLInputElement>} type="date" value={valor} onChange={e => { setValor(e.target.value); setError(null) }} className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${error ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-200`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
  case 'booleano': return <div className="flex gap-4 justify-center"><motion.button onClick={() => { setValor('true'); setTimeout(() => validarYEnviar(), 100) }} className={`px-8 py-4 rounded-lg font-semibold transition-all ${valor === 'true' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span className="text-2xl mb-1 block">✅</span>Sí</motion.button><motion.button onClick={() => { setValor('false'); setTimeout(() => validarYEnviar(), 100) }} className={`px-8 py-4 rounded-lg font-semibold transition-all ${valor === 'false' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span className="text-2xl mb-1 block">❌</span>No</motion.button></div>
      default: return null
    }
  }
  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <motion.h3 className="text-xl font-semibold text-gray-800 mb-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>{props.pregunta.texto}</motion.h3>
      <div className="mb-4">{renderInput()}</div>
      {error && <motion.p className="text-red-500 text-sm mb-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.p>}
      <div className="flex justify-between items-center">
        <motion.button onClick={() => setMostrarExplicacion(!mostrarExplicacion)} className="text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1" whileHover={{ scale: 1.05 }}>
          <span>🩺</span>{mostrarExplicacion ? 'Ocultar' : 'Ver'} explicación médica
        </motion.button>
  {props.pregunta.tipo !== 'select' && props.pregunta.tipo !== 'booleano' && (
          <motion.button onClick={(e) => validarYEnviar(e)} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Continuar →</motion.button>
        )}
      </div>
    <ExplicacionMedica explicacion={props.pregunta.explicacionMedica || ''} visible={mostrarExplicacion} />
  {mostrarPuntos && <PuntosFlotantes puntos={props.pregunta.puntosGamificacion || 0} x={coordenadasPuntos.x} y={coordenadasPuntos.y} />}
    </motion.div>
  )
}
