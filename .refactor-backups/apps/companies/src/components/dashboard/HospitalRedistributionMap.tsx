"use client";

import { Button, Card, Input } from '@altamedica/ui';
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from 'react-leaflet';
import { ExpandableSection } from '../common/ExpandableSection';

import { logger } from '@altamedica/shared/services/logger.service';
// Importación dinámica para evitar problemas de SSR con Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), {
  ssr: false,
});

// Interfaces para el sistema de redistribución
export interface Hospital {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    coordinates: LatLngTuple;
  };
  currentCapacity: number;
  maxCapacity: number;
  criticalStaff: {
    doctors: number;
    nurses: number;
    specialists: number;
    requiredDoctors: number;
    requiredNurses: number;
    requiredSpecialists: number;
  };
  status: 'normal' | 'warning' | 'critical' | 'saturated';
  waitingPatients: number;
  emergencyPatients: number;
  lastUpdated: Date;
}

export interface RedistributionRoute {
  id: string;
  fromHospital: Hospital;
  toHospital: Hospital;
  patientsToTransfer: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number;
  progress?: number; // 0-100 para rutas en ejecución
}

export interface StaffShortage {
  hospitalId: string;
  hospitalName: string;
  role: string;
  shortage: number;
  severity: 'critical' | 'urgent' | 'moderate';
  autoJobPostingTriggered: boolean;
}

export interface HospitalRedistributionMapProps {
  hospitals: Hospital[];
  redistributionRoutes: RedistributionRoute[];
  staffShortages: StaffShortage[];
  onHospitalSelect?: (hospital: Hospital) => void;
  onRouteSelect?: (route: RedistributionRoute) => void;
  showRedistributionRoutes?: boolean;
  showStaffShortages?: boolean;
  emergencyMode?: boolean;
  autoRefresh?: boolean;
  heightClass?: string; // permite controlar la altura del MapContainer desde el contenedor padre
}

// Componente para marcador de hospital con estado visual
interface HospitalMarkerProps {
  hospital: Hospital;
  staffShortages: StaffShortage[];
  isSelected: boolean;
  onClick: () => void;
  emergencyMode: boolean;
}

function HospitalMarker({ hospital, staffShortages, isSelected, onClick, emergencyMode }: HospitalMarkerProps) {
  
  const getHospitalIcon = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const L = (window as any).L;
    if (!L) return null;

    const capacityPercentage = (hospital.currentCapacity / hospital.maxCapacity) * 100;
    const hospitalShortages = staffShortages.filter((s) => s.hospitalId === hospital.id);
    const criticalShortages = hospitalShortages.filter((s) => s.severity === 'critical').length;

    let color = '#16a34a';
    let pulseClass = '';
    if (hospital.status === 'saturated' || capacityPercentage > 95) {
      color = '#dc2626';
      pulseClass = emergencyMode ? 'animate-pulse' : '';
    } else if (hospital.status === 'critical' || capacityPercentage > 85) {
      color = '#ea580c';
      pulseClass = 'animate-pulse';
    } else if (hospital.status === 'warning' || capacityPercentage > 75) {
      color = '#d97706';
    }

    const selectedClass = isSelected ? 'scale-125 ring-4 ring-blue-400' : '';
    const capacityClass = capacityPercentage > 95
      ? 'text-red-600'
      : capacityPercentage > 85
        ? 'text-orange-600'
        : capacityPercentage > 75
          ? 'text-yellow-600'
          : 'text-green-600';

    const shortageBadge = criticalShortages > 0
      ? '<div class="absolute -bottom-2 -left-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-bounce">' +
        String(criticalShortages) +
        '</div>'
      : '';

    const waitingBadge = hospital.waitingPatients > 10
      ? '<div class="absolute -bottom-2 -right-2 bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold border-2 border-white shadow-md">' +
        String(hospital.waitingPatients) +
        '</div>'
      : '';

    const emergencyBadge = hospital.emergencyPatients > 0
      ? '<div class="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-ping">!<\/div>'
      : '';

    const html =
      '<div class="relative">' +
        '<div class="w-16 h-16 rounded-xl border-4 border-white shadow-2xl flex items-center justify-center text-white font-bold transition-all duration-300 ' + selectedClass + ' ' + pulseClass + '" ' +
             'style="background: linear-gradient(135deg, ' + color + ' 0%, ' + color + 'cc 100%); box-shadow: 0 4px 20px ' + color + '66">' +
          '<span class="text-2xl">🏥<\/span>' +
        '<\/div>' +
        '<div class="absolute -top-2 -right-2 bg-white border-2 border-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold ' + capacityClass + '">' +
          String(Math.round(capacityPercentage)) + '%<\/div>' +
        shortageBadge +
        waitingBadge +
        emergencyBadge +
      '<\/div>';

    return L.divIcon({
      className: 'custom-hospital-marker',
      html,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      popupAnchor: [0, -32],
    });
  }, [hospital, staffShortages, isSelected, emergencyMode]);

  const icon = getHospitalIcon();
  if (!icon) return null;

  return (
    <Marker
      position={hospital.location.coordinates as [number, number]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup className="custom-hospital-popup">
        <div className="p-4 min-w-[320px] max-w-[400px]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">{hospital.name}</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              hospital.status === 'saturated' ? 'bg-red-100 text-red-800' :
              hospital.status === 'critical' ? 'bg-orange-100 text-orange-800' :
              hospital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {hospital.status.toUpperCase()}
            </div>
          </div>
          
          {/* Métricas de capacidad */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-gray-800 mb-2">📊 Estado de Capacidad</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ocupación actual:</span>
                <span className="font-bold">{hospital.currentCapacity}/{hospital.maxCapacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (hospital.currentCapacity / hospital.maxCapacity) * 100 > 95 ? 'bg-red-500' :
                    (hospital.currentCapacity / hospital.maxCapacity) * 100 > 85 ? 'bg-orange-500' :
                    (hospital.currentCapacity / hospital.maxCapacity) * 100 > 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(hospital.currentCapacity / hospital.maxCapacity) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">En espera:</span>
                  <span className="ml-1 font-medium text-orange-600">{hospital.waitingPatients}</span>
                </div>
                <div>
                  <span className="text-gray-500">Emergencias:</span>
                  <span className="ml-1 font-medium text-red-600">{hospital.emergencyPatients}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal médico crítico */}
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-blue-800 mb-2">👨‍⚕️ Personal Crítico</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Médicos:</span>
                <span className={hospital.criticalStaff.doctors < hospital.criticalStaff.requiredDoctors ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {hospital.criticalStaff.doctors}/{hospital.criticalStaff.requiredDoctors}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Enfermeros:</span>
                <span className={hospital.criticalStaff.nurses < hospital.criticalStaff.requiredNurses ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {hospital.criticalStaff.nurses}/{hospital.criticalStaff.requiredNurses}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Especialistas:</span>
                <span className={hospital.criticalStaff.specialists < hospital.criticalStaff.requiredSpecialists ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {hospital.criticalStaff.specialists}/{hospital.criticalStaff.requiredSpecialists}
                </span>
              </div>
            </div>
          </div>

          {/* Déficits de personal detectados */}
          {staffShortages.filter(s => s.hospitalId === hospital.id).length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 mb-3 border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Déficits Críticos</h4>
              {staffShortages.filter(s => s.hospitalId === hospital.id).map((shortage, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{shortage.role}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-800">-{shortage.shortage}</span>
                    {shortage.autoJobPostingTriggered && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">🤖 Auto</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Última actualización: {hospital.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Componente para mostrar rutas de redistribución
const RedistributionRoutes: React.FC<{
  routes: RedistributionRoute[];
  onRouteSelect?: (route: RedistributionRoute) => void;
}> = ({ routes, onRouteSelect }) => {
  
  const getRouteColor = (route: RedistributionRoute) => {
    switch (route.status) {
      case 'executing':
        return '#3b82f6'; // azul
      case 'completed':
        return '#10b981'; // verde
      case 'failed':
        return '#ef4444'; // rojo
      default:
        return route.priority === 'critical' ? '#dc2626' : 
               route.priority === 'high' ? '#ea580c' : 
               route.priority === 'medium' ? '#d97706' : '#6b7280';
    }
  };

  const getRouteWeight = (route: RedistributionRoute) => {
    return route.priority === 'critical' ? 6 : 
           route.priority === 'high' ? 5 : 
           route.priority === 'medium' ? 4 : 3;
  };

  const getRouteDashArray = (route: RedistributionRoute) => {
    switch (route.status) {
      case 'executing':
        return '10 5'; // línea discontinua para rutas en ejecución
      case 'pending':
        return '15 10'; // línea más discontinua para pendientes
      default:
        return undefined; // línea sólida para completadas/fallidas
    }
  };

  return (
    <>
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={[
            route.fromHospital.location.coordinates,
            route.toHospital.location.coordinates
          ]}
          color={getRouteColor(route)}
          weight={getRouteWeight(route)}
          opacity={route.status === 'completed' ? 0.6 : 0.9}
          dashArray={getRouteDashArray(route)}
          eventHandlers={{
            click: () => onRouteSelect?.(route)
          }}
        >
          <Popup>
            <div className="p-3 min-w-[280px]">
              <h4 className="font-bold mb-2">🔄 Redistribución de Pacientes</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">De:</span>
                  <span className="ml-1 font-medium">{route.fromHospital.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">A:</span>
                  <span className="ml-1 font-medium">{route.toHospital.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pacientes:</span>
                  <span className="ml-1 font-bold text-blue-600">{route.patientsToTransfer}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tiempo estimado:</span>
                  <span className="ml-1 font-medium">{route.estimatedTime} min</span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    route.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                    route.status === 'completed' ? 'bg-green-100 text-green-800' :
                    route.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {route.status === 'pending' ? '⏳ Pendiente' :
                     route.status === 'executing' ? '🔄 En progreso' :
                     route.status === 'completed' ? '✅ Completada' :
                     '❌ Fallida'}
                  </span>
                </div>
                {route.status === 'executing' && route.progress !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600 text-xs">Progreso:</span>
                      <span className="text-xs font-bold">{route.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${route.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
};

// Component for map initialization
interface MapInitProps {
  onReady: (map: LeafletMap) => void;
}

export default function HospitalRedistributionMap({
  hospitals,
  redistributionRoutes,
  staffShortages,
  onHospitalSelect,
  onRouteSelect,
  showRedistributionRoutes = true,
  showStaffShortages = true,
  emergencyMode = false,
  autoRefresh = true,
  heightClass
}: HospitalRedistributionMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([-34.6037, -58.3816]);
  const [zoom, setZoom] = useState(6);

  // Helper seguro para invalidar tamaño del mapa evitando errores de Leaflet
  const safeInvalidate = useCallback((retries: number = 0) => {
    const map = mapRef.current as (LeafletMap & { getContainer?: () => HTMLElement; _container?: HTMLElement; _mapPane?: HTMLElement }) | null;
    if (!map) return;
    const container = map.getContainer ? map.getContainer() : map._container;
    const pane = (map as any)._mapPane as HTMLElement | undefined;
    const isAttached = !!container && document.body.contains(container) && container.offsetParent !== null;
    if (!container || !pane || !isAttached) {
      if (retries > 0) {
        setTimeout(() => safeInvalidate(retries - 1), 100);
      }
      return;
    }
    try {
      map.invalidateSize();
    } catch {
      if (retries > 0) setTimeout(() => safeInvalidate(retries - 1), 120);
    }
  }, []);

  // Auto-refresh del mapa cada 30 segundos si está habilitado
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      interval = setInterval(() => {
        // Aquí podrías disparar una actualización de datos
        // logger.info('Auto-refreshing hospital data...');
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Ajustar vista automáticamente para mostrar todos los hospitales
  useEffect(() => {
    if (hospitals.length === 0 || !mapRef.current) return;

    const coords = hospitals.map(h => h.location.coordinates);
    if (coords.length === 1) {
      setMapCenter(coords[0]);
      setZoom(10);
    } else if (coords.length > 1) {
      const lats = coords.map(coord => coord[0]);
      const lngs = coords.map(coord => coord[1]);
      
      const bounds: [LatLngTuple, LatLngTuple] = [
        [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
        [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5]
      ];
      
      setTimeout(() => {
        if (mapRef.current) {
          // Asegura que el mapa tenga tamaño correcto antes de ajustar bounds
          safeInvalidate(3);
          try {
            mapRef.current.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 12
            });
          } catch {}
        }
      }, 100);
    }
  }, [hospitals]);

  const handleHospitalSelect = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    onHospitalSelect?.(hospital);
  }, [onHospitalSelect]);

  const isClient = typeof window !== 'undefined';

  // Invalida el tamaño del mapa al redimensionar el contenedor
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;
    const ro = new ResizeObserver(() => {
      safeInvalidate(1);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Reaccionar a cambios de layout globales (sidebar, zen, view)
  useEffect(() => {
    const handler = () => {
      // doble disparo para cubrir transiciones
      safeInvalidate(2);
      setTimeout(() => safeInvalidate(1), 120);
    };
    window.addEventListener('crisis:layout-changed', handler);
    return () => window.removeEventListener('crisis:layout-changed', handler);
  }, []);

  // Escuchar invalidaciones de tamaño provenientes del shell del mapa
  useEffect(() => {
    const handler = () => {
      safeInvalidate(2);
      setTimeout(() => safeInvalidate(1), 120);
    };
    window.addEventListener('map:invalidate-size', handler);
    return () => window.removeEventListener('map:invalidate-size', handler);
  }, []);

  const MapInit: React.FC<{ onReady: (map: LeafletMap) => void }> = ({ onReady }) => {
    const map = useMap() as unknown as LeafletMap;
    useEffect(() => {
      onReady(map);
    }, [map, onReady]);
    return null;
  };

  return (
  <div ref={containerRef} className="relative h-full">
      {!isClient ? (
        <div className="h-[500px] bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg flex items-center justify-center border border-gray-200">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="text-sm font-medium text-gray-700">Cargando mapa de redistribuci 3n hospitalaria...</p>
          </div>
        </div>
      ) : null}
      {/* Indicadores de estado del mapa */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2 w-[320px] max-w-[80vw]">
        {/* Panel desplegable de estado */}
        <ExpandableSection
          title={(
            <span className="inline-flex items-center gap-2">
              {emergencyMode ? '🚨 Estado de Crisis Activo' : '✅ Sistema Activo'}
            </span>
          )}
          defaultOpen={true}
          rightActions={(
            <span className={`text-2xs px-2 py-0.5 rounded ${emergencyMode ? 'bg-vscode-crisis-critical text-white' : 'bg-vscode-crisis-success text-white'}`}>
              {emergencyMode ? 'Crisis' : 'OK'}
            </span>
          )}
          className="bg-vscode-panel border border-vscode-border rounded-lg overflow-hidden"
        >
          <div className="text-xs text-vscode-foreground space-y-2">
            <p className="leading-relaxed">
              La red hospitalaria está operando en modo crisis debido a alta saturación y déficit de personal.
            </p>
            <div className="flex gap-2">
              <button className="bg-vscode-activity-badge text-white px-2 py-1 rounded">Protocolo Emergencia</button>
              <button className="bg-vscode-button hover:bg-vscode-button-hover text-white px-2 py-1 rounded">Redistribuir Ahora</button>
            </div>
          </div>
        </ExpandableSection>

        {redistributionRoutes.filter(r => r.status === 'executing').length > 0 && (
          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            🔄 {redistributionRoutes.filter(r => r.status === 'executing').length} Redistribuciones Activas
          </div>
        )}
      </div>

      {/* Leyenda del mapa (plegable) */}
      <div className="absolute bottom-4 left-4 z-[1000] w-[260px] max-w-[80vw]">
        <ExpandableSection
          title={<span>🗺️ Leyenda</span>}
          defaultOpen={false}
          storageKey="crisis.legend.open"
          className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="space-y-1 text-xs p-0">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border-2 border-white"></div>
              <span>Hospital Normal (≤75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded border-2 border-white"></div>
              <span>Advertencia (75-85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded border-2 border-white"></div>
              <span>Crítico (85-95%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded border-2 border-white"></div>
              <span>Saturado (&gt;95%)</span>
            </div>
            {showRedistributionRoutes && (
              <>
                <hr className="my-2" />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-600"></div>
                  <span>Redistribución Crítica</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-600" style={{background: 'linear-gradient(90deg, #3b82f6 50%, transparent 50%)', backgroundSize: '8px 2px'}}></div>
                  <span>En Ejecución</span>
                </div>
              </>
            )}
          </div>
        </ExpandableSection>
      </div>

      {/* Mapa principal */}
  {isClient && (
  <MapContainer
        center={mapCenter}
        zoom={zoom}
  className={`${heightClass ?? 'h-[360px]'} w-full min-h-[320px] rounded-lg border border-gray-200`}
        zoomControl={true}
        minZoom={5}
        maxZoom={15}
      >
        <MapInit onReady={(map) => {
          mapRef.current = map;
          const scheduleInvalidate = (retries: number = 4) => {
            safeInvalidate(retries);
          };
          // Ejecutar tras paint y reintentar si aún no es visible
          requestAnimationFrame(() => scheduleInvalidate());
        }} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Marcadores de hospitales */}
        {hospitals.map((hospital) => (
          <HospitalMarker
            key={hospital.id}
            hospital={hospital}
            staffShortages={showStaffShortages ? staffShortages : []}
            isSelected={selectedHospital?.id === hospital.id}
            onClick={() => handleHospitalSelect(hospital)}
            emergencyMode={emergencyMode}
          />
        ))}
        
        {/* Rutas de redistribución */}
        {showRedistributionRoutes && (
          <RedistributionRoutes 
            routes={redistributionRoutes} 
            onRouteSelect={onRouteSelect}
          />
        )}
  </MapContainer>
  )}
    </div>
  );
}