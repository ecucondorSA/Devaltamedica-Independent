/**
 * Main Controls Component
 * Extracted from HospitalNetworkDashboard.tsx for better separation of concerns
 */

import { Button } from '@altamedica/ui';
import {
  AlertTriangle,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';

interface MainControlsProps {
  emergencyMode: boolean;
  showMapView: boolean;
  isDarkMode: boolean;
  isCompactView: boolean;
  onToggleEmergencyMode: () => void;
  onToggleMapView: () => void;
  onToggleDarkMode: () => void;
  onToggleCompactView: () => void;
  onRefresh: () => void;
}

export const MainControls = ({
  emergencyMode,
  showMapView,
  isDarkMode,
  isCompactView,
  onToggleEmergencyMode,
  onToggleMapView,
  onToggleDarkMode,
  onToggleCompactView,
  onRefresh
}: MainControlsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        onClick={onToggleEmergencyMode}
        variant={emergencyMode ? 'destructive' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        {emergencyMode ? 'Modo Emergencia' : 'Activar Emergencia'}
      </Button>

      <Button
        onClick={onToggleMapView}
        variant={showMapView ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <MapIcon className="h-4 w-4" />
        {showMapView ? 'Ocultar Mapa' : 'Ver Mapa'}
      </Button>

      <Button
        onClick={onToggleDarkMode}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isDarkMode ? '☀️' : '🌙'}
        {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
      </Button>

      <Button
        onClick={onToggleCompactView}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        {isCompactView ? 'Vista Normal' : 'Vista Compacta'}
      </Button>

      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Actualizar
      </Button>
    </div>
  );
};