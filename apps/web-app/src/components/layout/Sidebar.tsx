'use client'

import { ChevronLeft, ChevronRight, Settings, Eye, Layers, Box } from 'lucide-react'
import { cn } from '@altamedica/utils'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggle: () => void
  isMobile: boolean
  className?: string
}

export function Sidebar({ 
  isOpen, 
  isCollapsed, 
  onClose, 
  onToggle, 
  isMobile, 
  className 
}: SidebarProps) {
  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 shadow-lg",
      "overflow-y-auto", // Scroll automático para listas largas
      isMobile ? (
        isOpen ? "translate-x-0" : "-translate-x-full"
      ) : (
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      ),
      "transition-transform duration-300 ease-in-out",
      className
    )}>
      {/* Botón de colapso - Solo en desktop */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* Header del sidebar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Panel de Control
        </h2>
      </div>

      {/* Sección de Consentimientos */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Consentimientos
        </h3>
        <div className="space-y-3 max-h-60 overflow-y-auto"> {/* Lista con scroll */}
          {[
            { id: 'essential', label: 'Cookies esenciales', checked: true },
            { id: 'analytics', label: 'Cookies de análisis', checked: false },
            { id: 'marketing', label: 'Cookies de marketing', checked: false },
            { id: 'third-party', label: 'Datos con terceros', checked: false },
            { id: 'performance', label: 'Cookies de rendimiento', checked: true },
            { id: 'functional', label: 'Cookies funcionales', checked: false },
            { id: 'social', label: 'Redes sociales', checked: false },
            { id: 'location', label: 'Datos de ubicación', checked: false },
          ].map((item) => (
            <label 
              key={item.id} 
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            >
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sección de Opciones de Visualización */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Layers className="w-4 h-4 mr-2" />
          Opciones de Visualización
        </h3>
        <div className="space-y-3">
          {/* Calidad de renderizado */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Calidad de renderizado</p>
            <div className="space-y-2">
              {[
                { value: 'high', label: 'Alta calidad', checked: true },
                { value: 'medium', label: 'Calidad media', checked: false },
                { value: 'low', label: 'Baja calidad', checked: false },
              ].map((option) => (
                <label 
                  key={option.value} 
                  className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                >
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    defaultChecked={option.checked}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-2">
            {[
              { id: 'controls', label: 'Mostrar controles', checked: true },
              { id: 'fullscreen', label: 'Modo pantalla completa', checked: false },
              { id: 'wireframe', label: 'Modo wireframe', checked: false },
              { id: 'shadows', label: 'Sombras', checked: true },
              { id: 'reflections', label: 'Reflejos', checked: false },
            ].map((option) => (
              <label 
                key={option.id} 
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  defaultChecked={option.checked}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de Herramientas 3D */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Box className="w-4 h-4 mr-2" />
          Herramientas 3D
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto"> {/* Lista con scroll */}
          {[
            'Rotar cámara',
            'Zoom dinámico',
            'Iluminación ambiental',
            'Materiales PBR',
            'Animaciones',
            'Postprocesado',
            'Partículas',
            'Física',
            'Sonido espacial',
            'Realidad aumentada',
            'Exportar modelo',
            'Importar texturas',
          ].map((tool) => (
            <button
              key={tool}
              className="w-full text-left p-2 rounded-lg hover:bg-blue-50 text-sm text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {/* Información del proyecto */}
      <div className="p-4 text-xs text-gray-500 bg-gray-50">
        <p>Versión: 1.0.0</p>
        <p>Última actualización: {new Date().toLocaleDateString()}</p>
        <p className="mt-2">
          Canvas 3D activo
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full ml-2"></span>
        </p>
      </div>
    </aside>
  )
}
