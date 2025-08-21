'use client'
import { useState } from 'react';
import { Logro } from '../types/anamnesis.types';

interface LogrosComponentProps { logros: Logro[]; puntosAcumulados: number; nivelCompletitud: number; onLogroClick?: (logro: Logro) => void }
const RAREZA_COLORS = { comun: 'bg-gray-100 text-gray-800 border-gray-300', raro: 'bg-blue-100 text-blue-800 border-blue-300', epico: 'bg-purple-100 text-purple-800 border-purple-300', legendario: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
const RAREZA_NAMES = { comun: 'Común', raro: 'Raro', epico: 'Épico', legendario: 'Legendario' }

export function LogrosComponent(props: LogrosComponentProps) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [logroSeleccionado, setLogroSeleccionado] = useState<Logro | null>(null)
  const handleLogroClick = (logro: Logro) => { setLogroSeleccionado(logro); setMostrarDetalles(true); props.onLogroClick?.(logro) }
  const calcularNivel = (p: number) => p < 100 ? { nivel: 1, progreso: p / 100 } : p < 300 ? { nivel: 2, progreso: (p - 100) / 200 } : p < 600 ? { nivel: 3, progreso: (p - 300) / 300 } : p < 1000 ? { nivel: 4, progreso: (p - 600) / 400 } : { nivel: 5, progreso: 1 }
  const { nivel, progreso } = calcularNivel(props.puntosAcumulados)
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-blue-600">{props.puntosAcumulados}</div>
          <div className="text-sm text-gray-500">Puntos Totales</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-purple-600">Nivel {nivel}</div>
          <div className="text-sm text-gray-500">Estudiante de Medicina</div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progreso al siguiente nivel</span><span>{Math.round(progreso * 100)}%</span></div>
        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso * 100}%` }} /></div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progreso de la anamnesis</span><span>{props.nivelCompletitud}%</span></div>
        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${props.nivelCompletitud}%` }} /></div>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">🏆 Logros Obtenidos</h3>
        <div className="grid grid-cols-2 gap-2">
          {props.logros.map(l => (
            <div key={l.id} onClick={() => handleLogroClick(l)} className={`p-3 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${RAREZA_COLORS[l.rareza]}`}>
              <div className="text-2xl mb-1">{l.icono}</div>
              <div className="text-xs font-semibold">{l.nombre}</div>
              <div className="text-xs opacity-75">{RAREZA_NAMES[l.rareza]}</div>
              <div className="text-xs font-bold">+{l.puntos}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-blue-50 p-2 rounded">
          <div className="font-semibold text-blue-800">{props.logros.length}</div>
          <div className="text-blue-600">Logros</div>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <div className="font-semibold text-green-800">{props.nivelCompletitud}%</div>
          <div className="text-green-600">Completado</div>
        </div>
      </div>
      {mostrarDetalles && logroSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">{logroSeleccionado.icono}</div>
              <h2 className="text-2xl font-bold mb-2">{logroSeleccionado.nombre}</h2>
              <p className="text-gray-600 mb-4">{logroSeleccionado.descripcion}</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${RAREZA_COLORS[logroSeleccionado.rareza]}`}>{RAREZA_NAMES[logroSeleccionado.rareza]}</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">+{logroSeleccionado.puntos} puntos</div>
            </div>
            <button onClick={() => setMostrarDetalles(false)} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
