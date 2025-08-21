/**
 * 🏥 HOSPITAL NETWORK DASHBOARD - REFACTORIZADO
 * Dashboard principal para gestión de red hospitalaria
 * Versión modularizada para mejor mantenibilidad
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { cn } from '@altamedica/utils';
import {
    AlertTriangle,
    Building2,
    ChevronDown, ChevronUp,
    Map as MapIcon,
    Maximize2,
    Minimize2,
    RefreshCw,
    TrendingUp,
    Wifi
} from 'lucide-react';
import { MetricsDisplay } from './components/MetricsDisplay';
import { useHospitalDashboard } from './hooks/useHospitalDashboard';
import HospitalRedistributionMap from './HospitalRedistributionMap';
import { DashboardProps } from './types/HospitalDashboardTypes';

export default function HospitalNetworkDashboard({ hospitalId, config }: DashboardProps) {
  const {
    state,
    loadHospitalData,
    toggleSection,
    toggleDarkMode,
    toggleCompactView,
    toggleEmergencyMode,
    toggleMapView
  } = useHospitalDashboard(hospitalId);

  const {
    metrics,
    networkStatus,
    loading,
    lastUpdate,
    expandedSections,
    isDarkMode,
    isCompactView,
    emergencyMode,
    showMapView
  } = state;

  // Renderizar controles principales
  const renderMainControls = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        onClick={toggleEmergencyMode}
        variant={emergencyMode ? 'destructive' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        {emergencyMode ? 'Modo Emergencia' : 'Activar Emergencia'}
      </Button>

      <Button
        onClick={toggleMapView}
        variant={showMapView ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <MapIcon className="h-4 w-4" />
        {showMapView ? 'Ocultar Mapa' : 'Ver Mapa'}
      </Button>

      <Button
        onClick={toggleDarkMode}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isDarkMode ? '☀️' : '🌙'}
        {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
      </Button>

      <Button
        onClick={toggleCompactView}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        {isCompactView ? 'Vista Normal' : 'Vista Compacta'}
      </Button>

      <Button
        onClick={loadHospitalData}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Actualizar
      </Button>
    </div>
  );

  // Renderizar estado de la red
  const renderNetworkStatus = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Estado de la Red Hospitalaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{networkStatus.healthy}</div>
            <div className="text-sm text-gray-600">Saludables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{networkStatus.warning}</div>
            <div className="text-sm text-gray-600">Advertencia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{networkStatus.critical}</div>
            <div className="text-sm text-gray-600">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{networkStatus.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Renderizar sección de métricas
  const renderMetricsSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas del Hospital
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('metrics')}
          >
            {expandedSections.metrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {expandedSections.metrics && (
        <CardContent>
          <MetricsDisplay metrics={metrics} isCompact={isCompactView} />
        </CardContent>
      )}
    </Card>
  );

  // Renderizar vista de mapa
  const renderMapView = () => {
    if (!showMapView) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Vista de Red Hospitalaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HospitalRedistributionMap />
        </CardContent>
      </Card>
    );
  };

  // Renderizar información de actualización
  const renderUpdateInfo = () => (
    <div className="text-center text-sm text-gray-500 mb-4">
      Última actualización: {lastUpdate.toLocaleTimeString()}
      {loading && <span className="ml-2">🔄 Actualizando...</span>}
    </div>
  );

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando datos del hospital...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 space-y-6",
      isDarkMode && "dark bg-gray-900 text-white",
      isCompactView && "p-4 space-y-4"
    )}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          Dashboard de Red Hospitalaria
          {emergencyMode && (
            <Badge variant="destructive" className="ml-2">
              🚨 MODO EMERGENCIA
            </Badge>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            ID: {hospitalId}
          </Badge>
        </div>
      </div>

      {renderUpdateInfo()}
      {renderMainControls()}
      {renderNetworkStatus()}
      {renderMetricsSection()}
      {renderMapView()}

      {/* Footer con información del sistema */}
      <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
        Sistema de Gestión Hospitalaria AltaMedica v4.3
        <br />
        Configurado para: {config.whatsapp.enabled ? 'WhatsApp' : ''} 
        {config.api.enabled ? ' API' : ''} 
        {config.iot.enabled ? ' IoT' : ''}
      </div>
    </div>
  );
}
