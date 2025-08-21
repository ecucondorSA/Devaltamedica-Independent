'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { logger } from '@altamedica/shared/services/logger.service';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Error en ALTAMEDICA:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="card-elevated p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Algo salió mal
          </h2>
          
          <p className="text-slate-600 mb-6">
            Ha ocurrido un error inesperado en ALTAMEDICA. 
            Nuestro equipo ha sido notificado automáticamente.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="btn-primary w-full flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-slate-500 cursor-pointer">
                Detalles técnicos (desarrollo)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
