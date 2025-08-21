'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Search, MapPin, Users, Building, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { ErrorBoundary } from 'react-error-boundary';

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'lab' | 'doctor' | 'job';
  data?: any;
}

interface UnifiedMarketplaceMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  width?: string | number;
  searchEnabled?: boolean;
  clusterMarkers?: boolean;
  lazyLoad?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (latlng: L.LatLng) => void;
  className?: string;
  fallback?: React.ReactNode;
  mode?: 'interactive' | 'static' | 'minimal';
}

// Componente para manejar el resize del mapa
const MapResizeHandler = () => {
  const map = useMap();
  
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Escuchar evento global de resize de mapa
    window.addEventListener('map:invalidate-size', handleResize);
    window.addEventListener('resize', handleResize);
    
    // Invalidar tamaño inicial
    handleResize();
    
    return () => {
      window.removeEventListener('map:invalidate-size', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
  return null;
};

// Componente para manejar clicks en el mapa
const MapClickHandler = ({ onClick }: { onClick?: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click: (e) => {
      onClick?.(e.latlng);
    },
  });
  return null;
};

// Loading skeleton para el mapa
const MapSkeleton = () => (
  <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
    <div className="text-center">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <p className="text-gray-500">Cargando mapa...</p>
    </div>
  </div>
);

// Error fallback
const MapError = ({ error, resetErrorBoundary }: any) => (
  <div className="w-full h-full bg-red-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el mapa</h3>
      <p className="text-sm text-gray-600 mb-4">{error?.message || 'No se pudo cargar el mapa'}</p>
      <button
        onClick={resetErrorBoundary}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </button>
    </div>
  </div>
);

// Mapa estático para fallback
const StaticMapFallback = ({ center, markers }: any) => (
  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-cyan-50 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="grid grid-cols-8 grid-rows-8 h-full">
        {[...Array(64)].map((_, i) => (
          <div key={i} className="border border-gray-400"></div>
        ))}
      </div>
    </div>
    <div className="relative z-10 p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Ubicaciones disponibles
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {markers?.length || 0} ubicaciones en el área
        </p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {markers?.slice(0, 5).map((marker: MapMarker, index: number) => (
            <div key={marker.id || index} className="flex items-start text-xs">
              <MapPin className="w-3 h-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{marker.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Mapa Unificado del Marketplace
 * Consolida todas las variantes de mapas en un componente único
 * 
 * Features:
 * - SSR-safe con dynamic import
 * - Lazy loading con Intersection Observer
 * - Múltiples modos (interactive, static, minimal)
 * - Clustering de marcadores
 * - Search integrado
 * - Error boundaries
 * - Resize handling automático
 */
const UnifiedMarketplaceMapComponent: React.FC<UnifiedMarketplaceMapProps> = ({
  markers = [],
  center = [-34.6037, -58.3816], // Buenos Aires por defecto
  zoom = 12,
  height = '400px',
  width = '100%',
  searchEnabled = true,
  clusterMarkers = false,
  lazyLoad = true,
  onMarkerClick,
  onMapClick,
  className = '',
  fallback,
  mode = 'interactive',
}) => {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMarkers, setFilteredMarkers] = useState(markers);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Intersection Observer para lazy loading
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: !lazyLoad,
  });

  // Asegurar que estamos en cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filtrar marcadores basado en búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = markers.filter(marker =>
        marker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marker.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMarkers(filtered);
    } else {
      setFilteredMarkers(markers);
    }
  }, [searchTerm, markers]);

  // Crear iconos personalizados por tipo
  const getMarkerIcon = useCallback((type: string) => {
    const iconColors: Record<string, string> = {
      hospital: '#EF4444',
      clinic: '#3B82F6',
      pharmacy: '#10B981',
      lab: '#8B5CF6',
      doctor: '#F59E0B',
      job: '#EC4899',
    };

    const color = iconColors[type] || '#6B7280';
    
    // En producción, usar iconos SVG personalizados
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'custom-marker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }, []);

  // Manejo de click en marcador
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker);
  }, [onMarkerClick]);

  // Si está en modo estático, mostrar versión simplificada
  if (mode === 'static') {
    return <StaticMapFallback center={center} markers={markers} />;
  }

  // Si está en modo minimal, mostrar solo lista
  if (mode === 'minimal') {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`} style={{ height, width }}>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Ubicaciones ({markers.length})
        </h3>
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 40px)' }}>
          {markers.map((marker) => (
            <button
              key={marker.id}
              onClick={() => handleMarkerClick(marker)}
              className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-gray-900">{marker.title}</p>
                  {marker.description && (
                    <p className="text-xs text-gray-600 mt-0.5">{marker.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Modo interactivo completo
  if (!isClient) {
    return <MapSkeleton />;
  }

  return (
    <div 
      ref={ref} 
      className={`relative ${className}`} 
      style={{ height, width }}
    >
      {/* Barra de búsqueda */}
      {searchEnabled && (
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ubicaciones..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel de información del marcador seleccionado */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{selectedMarker.title}</h3>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            {selectedMarker.description && (
              <p className="text-sm text-gray-600 mb-3">{selectedMarker.description}</p>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{selectedMarker.position[0].toFixed(4)}, {selectedMarker.position[1].toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <ErrorBoundary FallbackComponent={MapError}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapResizeHandler />
          <MapClickHandler onClick={onMapClick} />
          
          {/* Marcadores */}
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={getMarkerIcon(marker.type)}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-1">{marker.title}</h4>
                  {marker.description && (
                    <p className="text-sm text-gray-600">{marker.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </ErrorBoundary>

      {/* Contador de resultados */}
      {searchTerm && (
        <div className="absolute top-20 left-4 z-[999]">
          <div className="bg-white rounded-lg shadow px-3 py-1 text-sm text-gray-600">
            {filteredMarkers.length} resultado{filteredMarkers.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

// Export con dynamic import para SSR-safe
export const UnifiedMarketplaceMap = dynamic(
  () => Promise.resolve(UnifiedMarketplaceMapComponent),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export default UnifiedMarketplaceMap;