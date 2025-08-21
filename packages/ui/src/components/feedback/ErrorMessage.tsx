/**
 * 🚨 ERROR MESSAGE - FEEDBACK COMPONENT
 * Componente genérico para mostrar mensajes de error con opción de reintento
 */

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  variant?: 'default' | 'compact';
}

export function ErrorMessage({ 
  message, 
  onRetry, 
  title = "Error al cargar datos",
  variant = 'default' 
}: ErrorMessageProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700 text-sm mr-3">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reintentar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>

      <h3 className="text-2xl font-semibold text-slate-800 mb-2">
        {title}
      </h3>

      <p className="text-slate-600 mb-6 max-w-md mx-auto">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Intentar de nuevo
        </button>
      )}

      <div className="mt-6 text-sm text-slate-500">
        Si el problema persiste, contacta al soporte técnico
      </div>
    </div>
  );
}