'use client'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { analizarRespuestasParaRecomendaciones, generarResumenMedico } from '../services/anamnesisService'
import { RespuestaAnamnesis } from '../types/anamnesis.types'

interface ResumenAnamnesisProps { respuestas: Record<string, RespuestaAnamnesis>; puntosTotal: number; logrosObtenidos: string[]; tiempoTotal: number; onCerrar?: () => void; onDescargar?: () => void }
export function ResumenAnamnesis(props: ResumenAnamnesisProps) {
  const [resumenMedico, setResumenMedico] = useState('')
  const [recomendaciones, setRecomendaciones] = useState<string[]>([])
  const [mostrandoResumen, setMostrandoResumen] = useState(false)

  useEffect(() => {
    const resumen = generarResumenMedico(props.respuestas)
    const recs = analizarRespuestasParaRecomendaciones(props.respuestas)
    setResumenMedico(resumen)
    setRecomendaciones(recs)
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } })
    setTimeout(() => setMostrandoResumen(true), 500)
  }, [props.respuestas])

  const formatearTiempo = (segundos: number) => { const minutos = Math.floor(segundos / 60); const segs = segundos % 60; return `${minutos}m ${segs}s` }
  const descargarResumen = () => { const blob = new Blob([resumenMedico], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `anamnesis_${new Date().toISOString().split('T')[0]}.md`; a.click(); URL.revokeObjectURL(url); props.onDescargar?.() }

  return (
    <motion.div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-8" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <motion.h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>¡Anamnesis Completada!</motion.h1>
            <p className="text-xl text-gray-700">Has completado exitosamente tu historia médica interactiva</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <motion.div className="text-4xl mb-2" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🏆</motion.div>
              <h3 className="text-lg font-semibold text-gray-700">Puntos Totales</h3>
              <p className="text-3xl font-bold text-purple-600">{props.puntosTotal}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <motion.div className="text-4xl mb-2" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>⏱️</motion.div>
              <h3 className="text-lg font-semibold text-gray-700">Tiempo Total</h3>
              <p className="text-3xl font-bold text-indigo-600">{formatearTiempo(props.tiempoTotal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <motion.div className="text-4xl mb-2" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>🎖️</motion.div>
              <h3 className="text-lg font-semibold text-gray-700">Logros</h3>
              <p className="text-3xl font-bold text-green-600">{props.logrosObtenidos.length}</p>
            </div>
          </motion.div>
          {recomendaciones.length > 0 && (
            <motion.div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg mb-8" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <h3 className="text-xl font-semibold text-yellow-800 mb-3 flex items-center gap-2"><span className="text-2xl">💡</span>Recomendaciones Personalizadas</h3>
              <ul className="space-y-2">
                {recomendaciones.map((rec, i) => (
                  <motion.li key={i} className="text-yellow-700" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}>• {rec}</motion.li>
                ))}
              </ul>
            </motion.div>
          )}
          <motion.div className="bg-white rounded-xl shadow-xl p-8 mb-8" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span className="text-3xl">📋</span>Resumen Médico Profesional</h3>
            {mostrandoResumen && (
              <motion.div className="bg-gray-50 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <pre className="whitespace-pre-wrap">{resumenMedico}</pre>
              </motion.div>
            )}
            <div className="flex gap-4 mt-6">
              <motion.button onClick={descargarResumen} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>📥 Descargar Resumen</motion.button>
              {props.onCerrar && (
                <motion.button onClick={props.onCerrar} className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Cerrar</motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
