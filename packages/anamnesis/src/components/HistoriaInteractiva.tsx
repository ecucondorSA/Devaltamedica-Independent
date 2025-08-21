'use client'
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
// Tipo local (no incluido aún en tipos exportados del paquete)
interface HistoriaMedica { id: string; titulo: string; contenido: string; imagenUrl?: string }

interface HistoriaInteractivaProps { historia: HistoriaMedica; onComplete: () => void; mostrarSkip?: boolean }
export function HistoriaInteractiva(props: HistoriaInteractivaProps) {
  const [mostrandoHistoria, setMostrandoHistoria] = useState(true)
  const [historiaLeida, setHistoriaLeida] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHistoriaLeida(true), props.historia.contenido.length * 30); return () => clearTimeout(t) }, [props.historia])
  const handleContinuar = () => { setMostrandoHistoria(false); setTimeout(props.onComplete, 300) }
  if (!mostrandoHistoria) return null
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={historiaLeida ? handleContinuar : undefined}>
        <motion.div className="max-w-2xl w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-2xl overflow-hidden" initial={{ scale: 0.8, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }} transition={{ type: 'spring', damping: 15 }} onClick={(e) => e.stopPropagation()}>
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <motion.div className="absolute inset-0 bg-white/10" animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }} transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }} style={{ backgroundImage: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', backgroundSize: '200% 200%' }} />
            <motion.h2 className="relative text-3xl font-bold text-white text-center" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>{props.historia.titulo}</motion.h2>
            <motion.div className="absolute top-2 right-2 text-4xl" animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}>✨</motion.div>
          </div>
          <div className="p-8">
            {props.historia.imagenUrl && (
              <motion.img src={props.historia.imagenUrl} alt={props.historia.titulo} className="w-full max-w-md mx-auto mb-6 rounded-lg shadow-lg" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} />
            )}
            <div className="text-lg text-gray-700 leading-relaxed mb-6">
              <TypeAnimation sequence={[props.historia.contenido]} speed={70} cursor={false} className="whitespace-pre-line" />
            </div>
            <motion.div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }}>
              <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2"><span className="text-2xl">💡</span>¿Sabías qué...?</p>
              <p className="text-sm text-yellow-700 mt-1">Esta información es crucial para entender mejor tu salud</p>
            </motion.div>
            <div className="flex justify-between items-center mt-8">
              {props.mostrarSkip && !historiaLeida && (
                <motion.button className="text-sm text-gray-500 hover:text-gray-700 transition-colors" onClick={handleContinuar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>Saltar historia →</motion.button>
              )}
              <motion.button className={`ml-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg transition-all ${historiaLeida ? 'hover:shadow-xl hover:scale-105 animate-pulse' : 'opacity-50 cursor-not-allowed'}`} onClick={handleContinuar} disabled={!historiaLeida} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {historiaLeida ? '¡Entendido! Continuar' : 'Leyendo...'}
              </motion.button>
            </div>
          </div>
          <motion.div className="h-1 bg-gradient-to-r from-purple-600 to-indigo-600" initial={{ width: 0 }} animate={{ width: historiaLeida ? '100%' : '0%' }} transition={{ duration: props.historia.contenido.length * 0.03 }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Bloque reutilizable de explicación médica
interface ExplicacionMedicaProps { explicacion: string; visible: boolean }
export const ExplicacionMedica: React.FC<ExplicacionMedicaProps> = ({ explicacion, visible }) => !visible ? null : (
  <motion.div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    <div className="flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">🩺</span>
      <div>
        <p className="text-sm font-semibold text-blue-800 mb-1">Explicación Médica</p>
        <p className="text-sm text-blue-700">{explicacion}</p>
      </div>
    </div>
  </motion.div>
)
