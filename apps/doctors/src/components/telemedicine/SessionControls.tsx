"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Heart,
  Activity,
  FileText,
  Download,
  Share2,
  Stethoscope,
  Camera,
  CameraOff
} from "lucide-react";

interface SessionControlsProps {
  sessionId: string;
  status: string;
  onSettingsChange?: (settings: any) => void;
}

export default function SessionControls({
  sessionId,
  status,
  onSettingsChange
}: SessionControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex items-center justify-between">
        {/* Información de Sesión */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {status === 'active' ? 'Consulta Activa' : 'Esperando Paciente'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(sessionDuration)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Stethoscope className="w-4 h-4" />
            <span>ID: {sessionId}</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-2">
          {/* Botón Mute */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Botón Cámara */}
          <button
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Alternar cámara"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Botón Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>

          {/* Botón Configuración */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Botón Reiniciar */}
          <button
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Reiniciar conexión"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panel de Configuración */}
      {showSettings && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Configuración de Consulta</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Calidad de Video
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Calidad de Audio
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Descargar Grabación</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              <FileText className="w-4 h-4" />
              <span>Generar Receta</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
              <Share2 className="w-4 h-4" />
              <span>Compartir Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Indicadores de Estado */}
      <div className="mt-4 flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Conexión estable</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4 text-blue-500" />
          <span>Latencia: 45ms</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Heart className="w-4 h-4 text-red-500" />
          <span>Paciente conectado</span>
        </div>
      </div>
    </div>
  );
} 