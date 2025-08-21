import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';
import { AlertCircle, Camera, Mic, Settings, RefreshCw } from 'lucide-react';

interface PermissionErrorProps {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  const getErrorIcon = () => {
    if (error.includes('cámara') || error.includes('micrófono')) {
      return <Camera className="w-8 h-8 text-red-500" />;
    }
    return <AlertCircle className="w-8 h-8 text-red-500" />;
  };

  const getErrorType = () => {
    if (error.includes('denegados')) return 'Permisos Denegados';
    if (error.includes('no encontrado')) return 'Dispositivo No Encontrado';
    if (error.includes('en uso')) return 'Dispositivo En Uso';
    return 'Error de Permisos';
  };

  const getInstructions = () => {
    if (error.includes('denegados')) {
      return [
        '1. Haz clic en el ícono de candado en la barra de direcciones',
        '2. Selecciona "Permitir" para cámara y micrófono',
        '3. Recarga la página',
        '4. O haz clic en "Reintentar" abajo'
      ];
    }
    if (error.includes('no encontrado')) {
      return [
        '1. Verifica que tengas cámara y micrófono conectados',
        '2. Asegúrate de que no estén siendo usados por otra aplicación',
        '3. Reinicia tu navegador',
        '4. Intenta con otro navegador'
      ];
    }
    if (error.includes('en uso')) {
      return [
        '1. Cierra otras aplicaciones que usen cámara/micrófono',
        '2. Verifica Zoom, Teams, Discord, etc.',
        '3. Reinicia tu navegador',
        '4. Intenta con modo incógnito'
      ];
    }
    return [
      '1. Verifica la configuración de tu navegador',
      '2. Asegúrate de que los permisos estén habilitados',
      '3. Intenta recargar la página',
      '4. Contacta soporte si el problema persiste'
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          {getErrorIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getErrorType()}
            </h3>
            <p className="text-sm text-gray-600">
              No se puede acceder a la cámara o micrófono
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{error}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Cómo solucionarlo:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {getInstructions().map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-medium">{instruction.split('.')[0]}.</span>
                  <span>{instruction.split('.').slice(1).join('.')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Si el problema persiste, contacta al soporte técnico</p>
        </div>
      </div>
    </div>
  );
}; 