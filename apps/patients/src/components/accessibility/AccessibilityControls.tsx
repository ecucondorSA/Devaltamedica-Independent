"use client";

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Palette,
  Settings,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ButtonCorporate } from '@altamedica/ui';

export default function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting, increaseFontSize, decreaseFontSize, resetSettings } = useAccessibility();

  return (
    <>
      {/* Botón flotante de accesibilidad */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
        aria-label="Abrir controles de accesibilidad"
      >
        <Eye className="w-6 h-6" />
      </button>

      {/* Panel de controles */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-sky-50 px-4 py-3 border-b border-sky-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-sky-600" />
              Accesibilidad Visual
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-sky-100 rounded transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Controles */}
          <div className="p-4 space-y-4">
            {/* Control de tamaño de texto */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tamaño del texto
              </label>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={settings.fontSize === 'normal'}
                  className="p-2 hover:bg-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Reducir tamaño de texto"
                >
                  <ZoomOut className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${settings.fontSize === 'normal' ? 'font-bold text-sky-600' : 'text-gray-500'}`}>
                    A
                  </span>
                  <span className={`text-base ${settings.fontSize === 'large' ? 'font-bold text-sky-600' : 'text-gray-500'}`}>
                    A
                  </span>
                  <span className={`text-lg ${settings.fontSize === 'extra-large' ? 'font-bold text-sky-600' : 'text-gray-500'}`}>
                    A
                  </span>
                </div>
                
                <button
                  onClick={increaseFontSize}
                  disabled={settings.fontSize === 'extra-large'}
                  className="p-2 hover:bg-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Aumentar tamaño de texto"
                >
                  <ZoomIn className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Alto contraste */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Palette className="w-4 h-4 mr-2 text-gray-600" />
                Alto contraste
              </label>
              <button
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-sky-600' : 'bg-gray-300'
                }`}
                aria-label="Activar alto contraste"
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.highContrast ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            {/* Objetivos grandes */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Check className="w-4 h-4 mr-2 text-gray-600" />
                Botones más grandes
              </label>
              <button
                onClick={() => updateSetting('largeClickTargets', !settings.largeClickTargets)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.largeClickTargets ? 'bg-sky-600' : 'bg-gray-300'
                }`}
                aria-label="Activar botones más grandes"
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.largeClickTargets ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            {/* Reducir animaciones */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <EyeOff className="w-4 h-4 mr-2 text-gray-600" />
                Reducir animaciones
              </label>
              <button
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.reducedMotion ? 'bg-sky-600' : 'bg-gray-300'
                }`}
                aria-label="Reducir animaciones"
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            {/* Información sobre presbicia */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Consejo:</strong> Si tienes más de 40 años, prueba el tamaño de texto "Grande" 
                para una lectura más cómoda.
              </p>
            </div>

            {/* Botón de reset */}
            <ButtonCorporate
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="w-full mt-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restablecer configuración
            </ButtonCorporate>
          </div>
        </div>
      )}
    </>
  );
}