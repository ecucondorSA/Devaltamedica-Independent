"use client";

import { useMarketplaceNotifications } from "@/hooks/useMarketplaceNotifications";
import type { LatLngTuple } from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ComponentType, type HTMLAttributes, type ReactNode } from "react";
// Usar tipos compartidos del paquete @altamedica/types
import type { MarketplaceCompany, MarketplaceDoctor, DoctorService as MedicalService } from '@/contexts/MarketplaceContext';

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

// Tipos ya provienen de @altamedica/types

interface MarketplaceMapProps {
  doctors: MarketplaceDoctor[];
  companies?: MarketplaceCompany[];
  center?: LatLngTuple;
  showDoctors?: boolean;
  showCompanies?: boolean;
  onDoctorSelect?: (doctor: MarketplaceDoctor) => void;
  onCompanySelect?: (company: MarketplaceCompany) => void;
  // Permitir selección controlada desde fuera (para sincronizar lista ↔ mapa)
  selectedDoctorId?: string;
  selectedCompanyId?: string;
  filters?: {
    specialties?: string[];
    maxHourlyRate?: number;
    minRating?: number;
    workArrangement?: string[];
    urgentOnly?: boolean;
    verifiedOnly?: boolean;
  };
  mode?: 'hiring' | 'networking' | 'discovery';
  theme?: 'vscode' | 'slate';
  enableControls?: boolean;
  includeDefaultHospital?: boolean;
  ui?: {
    Button?: ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    Badge?: ComponentType<{ children?: ReactNode; className?: string; variant?: string } & React.HTMLAttributes<HTMLSpanElement>>;
  };
  // Modo demo: muestra ruta y hospital receptor de ejemplo
  demoMode?: boolean;
}

// Componente personalizado para controles del mapa
const MapControls: React.FC<{
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  onRegionSelect: (region: string) => void;
  onFocusOnDoctors: () => void;
  activeRegion: string;
  doctorCount: number;
}> = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onToggleFilters, 
  filtersOpen, 
  onRegionSelect, 
  onFocusOnDoctors, 
  activeRegion, 
  doctorCount 
}) => {
  const [regionsOpen, setRegionsOpen] = useState(false);
  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
      {/* Controles de Zoom */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 transition-colors rounded-t-lg hover:text-blue-600 hover:bg-blue-50"
          title="Acercar"
          disabled={zoom >= 18}
        >
          ➕
        </button>
        <div className="px-2 py-1 text-xs text-gray-500 border-t border-b border-gray-100 text-center min-w-[40px]">
          {zoom}
        </div>
        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 transition-colors rounded-b-lg hover:text-blue-600 hover:bg-blue-50"
          title="Alejar"
          disabled={zoom <= 1}
        >
          ➖
        </button>
      </div>

      {/* Controles adicionales */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg">
        <button
          onClick={onReset}
          className="p-2 text-gray-600 transition-colors rounded-t-lg hover:text-blue-600 hover:bg-blue-50"
          title="Restablecer vista"
        >
          🎯
        </button>
        <button
          onClick={onToggleFilters}
          className={`p-2 transition-colors border-t border-gray-100 rounded-b-lg ${
            filtersOpen 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Filtros"
        >
          🔍
        </button>
      </div>

      {/* Controles de Región - Desplegable */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <button
          onClick={() => setRegionsOpen(!regionsOpen)}
          className="w-full p-2 text-gray-600 transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-between"
          title="Seleccionar región"
        >
          <div className="flex items-center gap-1">
            <span className="text-sm">🌎</span>
            <span className="text-xs font-medium">
              {Object.entries({
                argentina: '🇦🇷',
                mexico: '🇲🇽', 
                colombia: '🇨🇴',
                chile: '🇨🇱',
                uruguay: '🇺🇾'
              }).find(([key]) => key === activeRegion)?.[1] || '🌎'}
            </span>
          </div>
          <div className={`transform transition-transform text-xs ${regionsOpen ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>
        
        {regionsOpen && (
          <div className="border-t border-gray-200 p-2 space-y-1">
            {Object.entries({
              argentina: '🇦🇷',
              mexico: '🇲🇽',
              colombia: '🇨🇴',
              chile: '🇨🇱',
              uruguay: '🇺🇾'
            }).map(([key, flag]) => (
              <button
                key={key}
                onClick={() => {
                  onRegionSelect(key);
                  setRegionsOpen(false);
                }}
                className={`w-full px-2 py-1 text-xs rounded transition-colors flex items-center gap-2 ${
                  activeRegion === key
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={`Ir a ${key.charAt(0).toUpperCase() + key.slice(1)}`}
              >
                <span>{flag}</span>
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controles Inteligentes */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg">
        <button
          onClick={onFocusOnDoctors}
          className="p-2 text-gray-600 transition-colors rounded-t-lg hover:text-green-600 hover:bg-green-50"
          title={`Enfocar en ${doctorCount} médicos disponibles`}
          disabled={doctorCount === 0}
        >
          🎯
        </button>
        <button
          onClick={onReset}
          className="p-2 text-gray-600 transition-colors border-t border-gray-100 rounded-b-lg hover:text-blue-600 hover:bg-blue-50"
          title="Vista general"
        >
          🌍
        </button>
      </div>
    </div>
  );
};

// Componente para marcadores personalizados
const CustomMarker: React.FC<{
  position: [number, number];
  entity: MarketplaceDoctor | MarketplaceCompany;
  type: 'doctor' | 'company';
  isSelected: boolean;
  onClick: () => void;
  ui?: MarketplaceMapProps['ui'];
}> = ({ position, entity, type, isSelected, onClick, ui }) => {
  // Permitir overrides de UI para botones y badges
  const ButtonEl = (ui?.Button ?? ('button' as unknown)) as ComponentType<ButtonHTMLAttributes<HTMLButtonElement>>;
  const BadgeEl = (ui?.Badge ?? ((props: any) => <span {...props} />)) as ComponentType<{
    children?: ReactNode;
    className?: string;
    variant?: string;
  } & HTMLAttributes<HTMLSpanElement>>;
  const getMarkerIcon = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const L = (window as { L?: any }).L;
    if (!L) return null;
    
    if (type === 'doctor') {
      const doctor = entity as MarketplaceDoctor;
      const color = doctor.isUrgentAvailable ? '#dc2626' : 
                    doctor.isOnline ? '#16a34a' : 
                    doctor.availableForHiring ? '#2563eb' : '#6b7280';
      
      return L.divIcon({
        className: 'custom-doctor-marker',
        html: `
          <div class="relative">
            <div class="w-12 h-12 rounded-full border-3 border-white shadow-xl flex items-center justify-center text-white font-bold transition-all duration-200 ${
              isSelected ? 'scale-125 ring-4 ring-blue-400' : ''
            } ${doctor.isUrgentAvailable ? 'animate-pulse' : ''}" 
                 style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%)">
              <span class="text-xl">👨‍⚕️</span>
            </div>
            ${doctor.verificationStatus === 'verified' ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md">✓</div>' : ''}
            ${doctor.offersDirectServices ? '<div class="absolute -top-1 -left-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md">💼</div>' : ''}
            ${doctor.isUrgentAvailable ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></div>' : ''}
            ${doctor.isOnline ? '<div class="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>' : ''}
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
      });
    } else {
      const company = entity as MarketplaceCompany;
      const color = company.urgentJobs > 0 ? '#dc2626' : 
                    company.isActivelyHiring ? '#7c3aed' : '#1e40af';
      const icon = company.companyType === 'hospital' ? '🏥' : 
                   company.companyType === 'clinic' ? '🏥' : '🏢';
      
      return L.divIcon({
        className: 'custom-company-marker',
        html: `
          <div class="relative">
            <div class="w-16 h-16 rounded-xl border-3 border-white shadow-2xl flex items-center justify-center text-white font-bold transition-all duration-200 ${
              isSelected ? 'scale-125 ring-4 ring-purple-400' : ''
            } ${company.urgentJobs > 0 ? 'animate-pulse' : ''}" 
                 style="background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); box-shadow: 0 4px 20px ${color}66">
              <span class="text-2xl">${icon}</span>
            </div>
            ${company.urgentJobs > 0 ? `<div class="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">${company.urgentJobs}</div>` : ''}
            ${company.isActivelyHiring ? '<div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-md">CONTRATANDO</div>' : ''}
          </div>
        `,
        iconSize: [64, 64],
        iconAnchor: [32, 32],
        popupAnchor: [0, -32],
      });
    }
  }, [entity, type, isSelected]);

  const icon = getMarkerIcon();
  if (!icon) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup className="custom-popup">
        <div className="p-3 min-w-[280px]">
          {type === 'doctor' ? (
            // Popup para doctor
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">{(entity as MarketplaceDoctor).name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-medium">{(entity as MarketplaceDoctor).rating}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="text-base mr-2">🩺</span>
                  <span>{(entity as MarketplaceDoctor).specialties.join(', ')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base mr-2">📍</span>
                  <span>{(entity as MarketplaceDoctor).location.city}, {(entity as MarketplaceDoctor).location.country}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base mr-2">💰</span>
                  <span className="font-medium">${(entity as MarketplaceDoctor).hourlyRate}/hr</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base mr-2">⏰</span>
                  <span>{(entity as MarketplaceDoctor).experience} años experiencia</span>
                </div>
              </div>
              
              {/* Servicios directos si los ofrece */}
              {(entity as MarketplaceDoctor).offersDirectServices && (entity as MarketplaceDoctor).publishedServices && (entity as MarketplaceDoctor).publishedServices!.length > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">💼 Servicios Disponibles</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(entity as MarketplaceDoctor).publishedServices!.slice(0, 2).map((service: MedicalService) => (
                      <div key={service.id} className="bg-purple-50 p-2 rounded border border-purple-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-purple-900">{service.title}</p>
                            <p className="text-xs text-purple-700 mt-0.5">
                              {service.price.currency} ${service.price.amount} 
                              {service.price.type === 'per_session' ? '/sesión' : 
                               service.price.type === 'per_hour' ? '/hora' : ''}
                            </p>
                          </div>
                          <BadgeEl className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">
                            {service.deliveryMethod === 'telemedicine' ? '💻' : 
                             service.deliveryMethod === 'in_person' ? '🏥' : '🔄'}
                          </BadgeEl>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Match Score</span>
                  <div className="flex items-center gap-1">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-xs font-bold text-green-600">85%</span>
                  </div>
                </div>
                {/* Mostrar botones diferentes según si ofrece servicios */}
                {(entity as MarketplaceDoctor).offersDirectServices ? (
                  <>
                    <ButtonEl className="w-full px-4 py-2 text-sm text-white transition-colors bg-gradient-to-r from-purple-600 to-purple-700 rounded-md hover:from-purple-700 hover:to-purple-800 font-medium shadow-md">
                      💼 Contratar Servicio Directo
                    </ButtonEl>
                    <ButtonEl 
                      onClick={() => logger.info('Iniciar proceso de match')}
                      className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      🎯 O Contratar como Empleado
                    </ButtonEl>
                  </>
                ) : (
                  <>
                    <ButtonEl 
                      onClick={() => logger.info('Iniciar proceso de match')}
                      className="w-full px-4 py-2 text-sm text-white transition-colors bg-gradient-to-r from-blue-600 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-800 font-medium shadow-md"
                    >
                      🎯 Iniciar Proceso de Match
                    </ButtonEl>
                    <ButtonEl className="w-full px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50 transition-colors">
                      💬 Chat Directo
                    </ButtonEl>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Popup para empresa
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">{(entity as MarketplaceCompany).name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-medium">{(entity as MarketplaceCompany).rating}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="text-base mr-2">🏢</span>
                  <span>{(entity as MarketplaceCompany).industry}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base mr-2">📍</span>
                  <span>{(entity as MarketplaceCompany).location.city}, {(entity as MarketplaceCompany).location.country}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base mr-2">💼</span>
                  <span className="font-medium">{(entity as MarketplaceCompany).activeJobs} ofertas activas</span>
                </div>
                {(entity as MarketplaceCompany).urgentJobs > 0 && (
                  <div className="flex items-center text-red-600">
                    <span className="text-base mr-2">🚨</span>
                    <span className="font-medium">{(entity as MarketplaceCompany).urgentJobs} urgentes</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-base mr-2">⭐</span>
                  <span className="font-medium">{(entity as MarketplaceCompany).rating}/5 • {(entity as MarketplaceCompany).totalHires} contrataciones</span>
                </div>
              </div>
              
              {/* Botones de acción para empresas */}
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                <ButtonEl 
                  onClick={() => logger.info('Ver ofertas disponibles', entity)}
                  className="w-full px-4 py-2 text-sm text-white transition-colors bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 font-medium shadow-md"
                >
                  🏥 Ver Ofertas Disponibles
                </ButtonEl>
                <ButtonEl className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                  📊 Perfil de la Empresa
                </ButtonEl>
                {(entity as MarketplaceCompany).urgentJobs > 0 && (
                  <ButtonEl className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors font-medium">
                    🚨 Ver Ofertas Urgentes ({(entity as MarketplaceCompany).urgentJobs})
                  </ButtonEl>
                )}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default function MarketplaceMap({
  doctors,
  companies = [],
  center,
  showDoctors = true,
  showCompanies = true,
  onDoctorSelect,
  onCompanySelect,
  selectedDoctorId,
  selectedCompanyId,
  filters,
  mode = 'hiring',
  theme = 'vscode',
  enableControls = false,
  includeDefaultHospital = true,
  ui,
  demoMode = false
}: MarketplaceMapProps) {
  const mapRef = useRef<any>(null);
  // Overrides de UI para botones y badges (compatibilidad con @altamedica/ui)
  const ButtonEl = (ui?.Button ?? ('button' as unknown)) as ComponentType<ButtonHTMLAttributes<HTMLButtonElement>>;
  const BadgeEl = (ui?.Badge ?? ((props: any) => <span {...props} />)) as ComponentType<{
    children?: ReactNode;
    className?: string;
    variant?: string;
  } & HTMLAttributes<HTMLSpanElement>>;
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(center || [-34.6037, -58.3816]);
  const [zoom, setZoom] = useState(5);
  const [selectedDoctor, setSelectedDoctor] = useState<MarketplaceDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapView, setMapView] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchStep, setMatchStep] = useState<'offer' | 'interview' | 'contract' | 'payment'>('offer');
  const [activeRegion, setActiveRegion] = useState<string>('argentina');
  const { sendNotification } = useMarketplaceNotifications();

  // Definir áreas geográficas permitidas (Latinoamérica principalmente)
  const GEOGRAPHIC_BOUNDS: [LatLngTuple, LatLngTuple] = [
    [-55.0, -110.0], // Southwest bound (Chile/Argentina sur, México oeste)
    [32.0, -30.0]     // Northeast bound (México norte, Brasil este)
  ];

  // Regiones predefinidas para navegación rápida (memoizado)
  const MEDICAL_REGIONS = useMemo(() => ({
    argentina: {
      name: 'Argentina',
      center: [-34.6037, -58.3816] as LatLngTuple,
      zoom: 6,
      bounds: [[-55.0, -73.5], [-21.8, -53.6]] as [LatLngTuple, LatLngTuple]
    },
    mexico: {
      name: 'México',
      center: [23.6345, -102.5528] as LatLngTuple,
      zoom: 5,
      bounds: [[14.5, -118.4], [32.7, -86.7]] as [LatLngTuple, LatLngTuple]
    },
    colombia: {
      name: 'Colombia',
      center: [4.5709, -74.2973] as LatLngTuple,
      zoom: 6,
      bounds: [[-4.2, -81.8], [15.5, -66.8]] as [LatLngTuple, LatLngTuple]
    },
    chile: {
      name: 'Chile',
      center: [-35.6751, -71.5430] as LatLngTuple,
      zoom: 5,
      bounds: [[-56.0, -75.6], [-17.5, -66.4]] as [LatLngTuple, LatLngTuple]
    },
    uruguay: {
      name: 'Uruguay',
      center: [-32.5228, -55.7658] as LatLngTuple,
      zoom: 7,
      bounds: [[-35.0, -58.4], [-30.1, -53.1]] as [LatLngTuple, LatLngTuple]
    }
  }), []);

  // Hospital San Vicente - Datos por defecto
  const hospitalSanVicente = {
    id: 'hospital-san-vicente-001',
    name: 'Hospital San Vicente',
    industry: 'Salud y Medicina',
    location: {
      city: 'Buenos Aires',
      country: 'Argentina',
      coordinates: [-34.6037, -58.3816] as LatLngTuple,
    },
    rating: 4.8,
    size: 'Grande (500+ empleados)',
    activeJobs: 15,
    urgentJobs: 3,
    logo: '/hospital-san-vicente-logo.png',
    isActivelyHiring: true,
    averageResponseTime: 2.4,
    totalHires: 127,
    companyType: 'hospital',
    jobs: [
      {
        id: 'hsv-cardio-001',
        title: 'Cardiólogo Intervencionista Senior',
        company: 'Hospital San Vicente',
        companyId: 'hospital-san-vicente-001',
        location: 'Buenos Aires, Argentina',
        specialty: 'Cardiología',
        type: 'job',
        salary: 'USD 12,000 - 18,000 mensual',
        postedDate: '2025-07-28',
        applications: 23,
        rating: 4.9,
        urgent: true,
        description: 'Buscamos cardiólogo intervencionista con amplia experiencia en cateterismo cardíaco y angioplastias.',
        requirements: ['Especialización en Cardiología', '8+ años experiencia', 'Certificación en Hemodinamia'],
        benefits: ['Obra social premium', 'Capacitación continua', 'Horarios flexibles'],
        experience: 'Senior (8+ años)',
        schedule: 'Tiempo completo con guardias',
        remote: false
      },
      {
        id: 'hsv-pediatra-002',
        title: 'Pediatra - Telemedicina',
        company: 'Hospital San Vicente',
        companyId: 'hospital-san-vicente-001',
        location: 'Buenos Aires, Argentina (Remoto)',
        specialty: 'Pediatría',
        type: 'contract',
        salary: 'USD 4,500 - 6,500 mensual',
        postedDate: '2025-07-29',
        applications: 41,
        rating: 4.7,
        urgent: false,
        description: 'Oportunidad de telemedicina para atención pediátrica virtual.',
        requirements: ['Especialización en Pediatría', '3+ años experiencia', 'Experiencia en telemedicina'],
        benefits: ['Trabajo remoto', 'Tecnología de punta', 'Flexibilidad horaria'],
        experience: 'Semi-senior (3-7 años)',
        schedule: 'Flexible',
        remote: true
      },
      {
        id: 'hsv-neurologia-003',
        title: 'Neurólogo - Urgencias',
        company: 'Hospital San Vicente',
        companyId: 'hospital-san-vicente-001',
        location: 'Buenos Aires, Argentina',
        specialty: 'Neurología',
        type: 'job',
        salary: 'USD 10,000 - 14,000 mensual',
        postedDate: '2025-07-30',
        applications: 8,
        rating: 4.8,
        urgent: true,
        description: 'Neurólogo para área de emergencias con disponibilidad inmediata.',
        requirements: ['Especialización en Neurología', '5+ años experiencia', 'Disponibilidad guardias'],
        benefits: ['Excelente remuneración', 'Equipo multidisciplinario', 'Tecnología avanzada'],
        experience: 'Senior (5+ años)',
        schedule: 'Guardias rotativas',
        remote: false
      }
    ]
  } as any;

  // Agregar Hospital San Vicente a las empresas si no está ya incluido
  const companiesWithHospital = includeDefaultHospital
    ? (companies.find(c => c.id === hospitalSanVicente.id) ? companies : [...companies, hospitalSanVicente])
    : companies;

  // Demo: hospital receptor y ruta
  const demoReceivingHospital = useMemo(() => ({
    id: 'hospital-receptor-demo',
    name: 'Hospital Receptor Central',
    industry: 'Salud y Medicina',
    location: {
      city: 'Avellaneda',
      country: 'Argentina',
      coordinates: [-34.659, -58.365] as LatLngTuple,
    },
    rating: 4.6,
    size: 'Grande',
    activeJobs: 2,
    urgentJobs: 0,
    isActivelyHiring: true,
    totalHires: 78,
    companyType: 'hospital',
  } as MarketplaceCompany), []);

  const companiesForRender = demoMode
    ? (companiesWithHospital.find(c => c.id === demoReceivingHospital.id)
        ? companiesWithHospital
        : [...companiesWithHospital, demoReceivingHospital])
    : companiesWithHospital;

  // Fix Leaflet default icons for SSR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = (window as { L?: any }).L;
      if (L && L.Icon?.Default?.prototype) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      }
    }
  }, []);

  // Filtrar doctores según los filtros aplicados
  const filteredDoctors = doctors.filter(doctor => {
    if (searchQuery && !doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doctor.location.city.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters?.specialties?.length && !filters.specialties.some(s => doctor.specialties.includes(s))) {
      return false;
    }
    if (filters?.maxHourlyRate && doctor.hourlyRate > filters.maxHourlyRate) {
      return false;
    }
    if (filters?.minRating && doctor.rating < filters.minRating) {
      return false;
    }
    if (filters?.workArrangement?.length && !filters.workArrangement.includes(doctor.workArrangement)) {
      return false;
    }
    if (filters?.urgentOnly && !doctor.isUrgentAvailable) {
      return false;
    }
    if (filters?.verifiedOnly && doctor.verificationStatus !== 'verified') {
      return false;
    }
    return true;
  });

  // Filtrar empresas según búsqueda (incluyendo Hospital San Vicente)
  const filteredCompanies = companiesForRender.filter(company => {
    if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !company.location.city.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Trayecto demo: entre San Vicente y receptor
  const demoRoute: LatLngTuple[] | null = useMemo(() => {
    if (!demoMode) return null;
    const from = hospitalSanVicente.location.coordinates as LatLngTuple;
    const to = demoReceivingHospital.location.coordinates as LatLngTuple;
    return [from, to];
  }, [demoMode, hospitalSanVicente.location.coordinates, demoReceivingHospital.location.coordinates]);

  const demoAmbulancePos: LatLngTuple | null = useMemo(() => {
    if (!demoRoute) return null;
    const [a, b] = demoRoute;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }, [demoRoute]);

  // Funciones de control del mapa
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 1, 18));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 1, 1));
  }, []);

  const handleReset = useCallback(() => {
    setMapCenter(center || [-34.6037, -58.3816]);
    setZoom(5);
    setSelectedDoctor(null);
  }, [center]);

  // Manejar selección de doctor
  const handleDoctorSelect = useCallback(async (doctor: MarketplaceDoctor) => {
    setSelectedDoctor(doctor);
    onDoctorSelect?.(doctor);

    // TODO: Implementar notificaciones una vez que el tipo esté correcto
    logger.info('Doctor profile viewed:', doctor.id);
  }, [onDoctorSelect]);

  // Funciones de navegación por regiones
  const handleRegionSelect = useCallback((regionKey: string) => {
    const region = MEDICAL_REGIONS[regionKey as keyof typeof MEDICAL_REGIONS];
    if (region && mapRef.current) {
      setActiveRegion(regionKey);
      setMapCenter(region.center);
      setZoom(region.zoom);
      setSelectedDoctor(null);
      
      // Aplicar bounds de la región si está disponible
      const map = mapRef.current;
      if (map && region.bounds) {
        setTimeout(() => {
          map.fitBounds(region.bounds, {
            padding: [20, 20],
            maxZoom: region.zoom
          });
        }, 100);
      }
    }
  }, [MEDICAL_REGIONS]);

  // Función para enfocar automáticamente en área con más médicos
  const handleFocusOnDoctors = useCallback(() => {
    if (filteredDoctors.length === 0) return;

    const doctorCoords = filteredDoctors.map(doctor => doctor.location.coordinates);
    
    if (doctorCoords.length === 1) {
      // Si solo hay un doctor, centrar en él
      setMapCenter(doctorCoords[0]);
      setZoom(10);
    } else if (doctorCoords.length > 1) {
      // Si hay múltiples doctores, calcular bounds óptimos
      const lats = doctorCoords.map(coord => coord[0]);
      const lngs = doctorCoords.map(coord => coord[1]);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const bounds: [LatLngTuple, LatLngTuple] = [
        [minLat - 0.5, minLng - 0.5],
        [maxLat + 0.5, maxLng + 0.5]
      ];
      
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 12
          });
        }, 100);
      }
    }
  }, [filteredDoctors]);

  // Función para obtener la URL del tile layer - usando CartoDB Positron para un mapa más limpio
  const getTileLayerUrl = () => {
    switch (mapView) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default: // mapa limpio sin detalles
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
  };

  const isClient = typeof window !== 'undefined';

  // Reflows robustos del mapa al cambiar layout (MapShell emite 'map:invalidate-size')
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        try { (mapRef.current as any)?.invalidateSize?.(); } catch {}
      }, 50);
    };
    window.addEventListener('map:invalidate-size', handler);
    return () => window.removeEventListener('map:invalidate-size', handler);
  }, []);

  // Reflow inicial tras el montaje para evitar mapa en blanco por altura/medidas
  useEffect(() => {
    const t = setTimeout(() => {
      try { (mapRef.current as any)?.invalidateSize?.(); } catch {}
    }, 150);
    return () => clearTimeout(t);
  }, []);

  // Sincronizar selección externa con el mapa (centrar y resaltar)
  useEffect(() => {
    if (!isClient) return;
    if (selectedDoctorId) {
      const doc = filteredDoctors.find(d => d.id === selectedDoctorId);
      if (doc) {
        setSelectedDoctor(doc);
        setMapCenter(doc.location.coordinates);
        setZoom(z => Math.max(z, 12));
        setTimeout(() => { try { (mapRef.current as any)?.panTo?.(doc.location.coordinates); } catch {} }, 50);
      }
    }
  }, [selectedDoctorId, filteredDoctors, isClient]);

  useEffect(() => {
    if (!isClient) return;
    if (selectedCompanyId) {
      const comp = filteredCompanies.find(c => c.id === selectedCompanyId);
      if (comp) {
        setSelectedDoctor(null);
        setMapCenter(comp.location.coordinates as LatLngTuple);
        setZoom(z => Math.max(z, 12));
        setTimeout(() => { try { (mapRef.current as any)?.panTo?.(comp.location.coordinates); } catch {} }, 50);
      }
    }
  }, [selectedCompanyId, filteredCompanies, isClient]);

  return (
    <div className="relative h-full w-full">
      {!isClient ? (
        <div className={`h-[600px] rounded-lg flex items-center justify-center border ${theme === 'vscode' ? 'bg-vscode-panel border-vscode-border text-vscode-foreground' : 'bg-white border-gray-200'}`}>
          <div className="text-center space-y-4">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto ${theme === 'vscode' ? 'border-vscode-border border-t-vscode-activity-badge' : 'border-blue-200 border-t-blue-600'}`}></div>
            <p className={`${theme === 'vscode' ? 'text-vscode-foreground' : 'text-gray-700'} text-sm font-medium`}>Cargando mapa del marketplace...</p>
          </div>
        </div>
      ) : null}
      {/* Barra de búsqueda - temporalmente deshabilitada */}
      
      {/* Leyenda del mapa - temporalmente deshabilitada */}


      {/* Filtros del mapa - temporalmente deshabilitados */}

      {/* Mapa de Leaflet */}
  {isClient && (
  <MapContainer
        center={mapCenter}
        zoom={zoom}
        className={`h-full w-full rounded-lg border ${theme === 'vscode' ? 'border-vscode-border' : 'border-gray-200'}`}
        ref={mapRef}
        zoomControl={false}
        maxBounds={GEOGRAPHIC_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={3}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileLayerUrl()}
        />
        
        {/* Renderizar doctores */}
        {showDoctors && filteredDoctors.map((doctor) => (
          <CustomMarker
            key={doctor.id}
            position={doctor.location.coordinates as [number, number]}
            entity={doctor}
            type="doctor"
            isSelected={(selectedDoctor?.id === doctor.id) || (selectedDoctorId === doctor.id)}
            onClick={() => handleDoctorSelect(doctor)}
            ui={ui}
          />
        ))}

        {/* Renderizar empresas */}
        {showCompanies && filteredCompanies.map((company) => (
          <CustomMarker
            key={company.id}
            position={company.location.coordinates as [number, number]}
            entity={company}
            type="company"
            isSelected={selectedCompanyId === company.id} 
            onClick={() => onCompanySelect?.(company)} 
            ui={ui}
          />
        ))}

        {/* Ruta de demo */}
        {demoRoute && (
          <Polyline positions={demoRoute as any} pathOptions={{ color: '#ef4444', weight: 4, dashArray: '8 6' }} />
        )}

        {/* Ambulancia demo (estática en punto medio) */}
        {demoAmbulancePos && (
          <Marker position={demoAmbulancePos as any} icon={(function(){
            if (typeof window === 'undefined') return undefined as any;
            const L = (window as any).L;
            if (!L || typeof L.divIcon !== 'function') return undefined as any;
            try {
              return L.divIcon({
                className: 'demo-ambulance',
                html: '<div class="text-2xl">🚑</div>',
                iconSize: [24,24],
                iconAnchor: [12,12]
              });
            } catch {
              return undefined as any;
            }
          })()} />
        )}
  </MapContainer>
  )}

      {/* Controles del mapa (opcional) */}
      {enableControls && (
        <MapControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onToggleFilters={() => setFiltersOpen(v => !v)}
          filtersOpen={filtersOpen}
          onRegionSelect={handleRegionSelect}
          onFocusOnDoctors={handleFocusOnDoctors}
          activeRegion={activeRegion}
          doctorCount={filteredDoctors.length}
        />
      )}


      {/* Panel de información del candidato seleccionado */}
      {selectedDoctor && (
        <div className={`absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-20 md:w-96 rounded-lg shadow-xl z-[1000] border ${theme === 'vscode' ? 'bg-vscode-panel border-vscode-border text-vscode-foreground' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${theme === 'vscode' ? 'border-vscode-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'vscode' ? 'text-white' : 'text-gray-900'}`}>{selectedDoctor.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedDoctor.verificationStatus === 'verified' && (
                    <BadgeEl className={`text-xs px-2 py-0.5 rounded-full ${theme === 'vscode' ? 'bg-vscode-input text-vscode-foreground' : 'bg-green-100 text-green-700'}`}>✓ Verificado</BadgeEl>
                  )}
                  {selectedDoctor.isOnline && (
                    <BadgeEl className={`text-xs px-2 py-0.5 rounded-full ${theme === 'vscode' ? 'bg-vscode-input text-vscode-foreground' : 'bg-blue-100 text-blue-700'}`}>● En línea</BadgeEl>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className={`${theme === 'vscode' ? 'text-vscode-foreground hover:text-white' : 'text-gray-400 hover:text-gray-600'} text-xl`}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Información clave */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-xs uppercase ${theme === 'vscode' ? 'text-vscode-foreground/70' : 'text-gray-500'}`}>Especialidad</p>
                <p className="text-sm font-medium">{selectedDoctor.specialties.join(', ')}</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${theme === 'vscode' ? 'text-vscode-foreground/70' : 'text-gray-500'}`}>Experiencia</p>
                <p className="text-sm font-medium">{selectedDoctor.experience} años</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${theme === 'vscode' ? 'text-vscode-foreground/70' : 'text-gray-500'}`}>Tarifa por hora</p>
                <p className={`text-sm font-medium ${theme === 'vscode' ? 'text-vscode-foreground' : 'text-green-600'}`}>${selectedDoctor.hourlyRate}</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${theme === 'vscode' ? 'text-vscode-foreground/70' : 'text-gray-500'}`}>Calificación</p>
                <p className="text-sm font-medium flex items-center">
                  <span className={`${theme === 'vscode' ? 'text-vscode-foreground' : 'text-yellow-400'} mr-1`}>⭐</span> {selectedDoctor.rating}
                </p>
              </div>
            </div>
            
            {/* Detalles adicionales */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">📍 Ubicación</span>
                <span className="font-medium">{selectedDoctor.location.city}, {selectedDoctor.location.country}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">💼 Modalidad</span>
                <span className="font-medium">
                  {selectedDoctor.workArrangement === 'remote' ? 'Remoto' : 
                   selectedDoctor.workArrangement === 'hybrid' ? 'Híbrido' : 
                   selectedDoctor.workArrangement === 'on_site' ? 'Presencial' : 'Flexible'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🌐 Idiomas</span>
                <span className="font-medium">{selectedDoctor.languages.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">⚡ Tiempo respuesta</span>
                <span className="font-medium">{selectedDoctor.responseTime}h promedio</span>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="space-y-2 pt-3">
              <ButtonEl 
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium ${theme === 'vscode' ? 'bg-vscode-activity-badge hover:brightness-110 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} 
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : '📧 Invitar a aplicar a una posición'}
              </ButtonEl>
              <ButtonEl 
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium ${theme === 'vscode' ? 'border border-vscode-border text-vscode-foreground hover:bg-vscode-list-hover' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
              >
                👁️ Ver perfil completo
              </ButtonEl>
              <ButtonEl 
                className={`w-full px-4 py-2 rounded-lg transition-colors ${theme === 'vscode' ? 'border border-vscode-border text-vscode-foreground hover:bg-vscode-list-hover' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                📎 Guardar candidato
              </ButtonEl>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Proceso de Match y Contratación */}
      {showMatchModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className={`rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${theme === 'vscode' ? 'bg-vscode-panel text-vscode-foreground border border-vscode-border' : 'bg-white'}`}>
            {/* Header */}
            <div className={`${theme === 'vscode' ? 'bg-vscode-activity-bar text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'} p-6`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Proceso de Match con {selectedDoctor.name}</h2>
                  <p className={`${theme === 'vscode' ? 'text-vscode-foreground/80' : 'text-blue-100'}`}>Complete los pasos para finalizar la contratación</p>
                </div>
                <button 
                  onClick={() => { setShowMatchModal(false); setMatchStep('offer'); }}
                  className={`${theme === 'vscode' ? 'text-white hover:text-gray-200' : 'text-white hover:text-gray-200'} text-2xl`}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className={`${theme === 'vscode' ? 'bg-vscode-editor' : 'bg-gray-100'} px-6 py-4`}>
              <div className="flex items-center justify-between">
                {[
                  { id: 'offer', label: 'Oferta', icon: '📝' },
                  { id: 'interview', label: 'Entrevista', icon: '🎤' },
                  { id: 'contract', label: 'Contrato', icon: '📄' },
                  { id: 'payment', label: 'Pago', icon: '💳' }
                ].map((step, index) => (
                  <div key={step.id} className="flex-1 relative">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        matchStep === step.id ? (theme === 'vscode' ? 'bg-vscode-activity-badge text-white' : 'bg-blue-600 text-white') : 
                        ['offer', 'interview', 'contract', 'payment'].indexOf(matchStep) > index ? 'bg-green-500 text-white' : 
                        (theme === 'vscode' ? 'bg-vscode-input text-vscode-foreground' : 'bg-gray-300 text-gray-600')
                      }`}>
                        {step.icon}
                      </div>
                      {index < 3 && (
                        <div className={`flex-1 h-1 ${
                          ['offer', 'interview', 'contract', 'payment'].indexOf(matchStep) > index ? 'bg-green-500' : (theme === 'vscode' ? 'bg-vscode-input' : 'bg-gray-300')
                        }`} />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-center font-medium">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {matchStep === 'offer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">📝 Enviar Oferta de Trabajo</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2">Match Score: 85% - Alta compatibilidad</p>
                    <p className="text-xs text-blue-600">Este candidato cumple con la mayoría de requisitos para tu posición</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Posición</label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Cardiólogo Intervencionista</option>
                        <option>Pediatra - Telemedicina</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Salario Ofrecido</label>
                      <input type="text" placeholder="USD 8,000 - 12,000" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mensaje Personalizado</label>
                    <textarea 
                      rows={3} 
                      placeholder="Estimado Dr. [Nombre], nos gustaría invitarlo a formar parte de nuestro equipo..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowMatchModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => setMatchStep('interview')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Enviar Oferta
                    </button>
                  </div>
                </div>
              )}
              
              {matchStep === 'interview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">🎤 Programar Entrevista</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">✅ El candidato ha aceptado tu oferta inicial</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de Entrevista</label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Videollamada (Zoom)</option>
                        <option>Presencial</option>
                        <option>Telemedicina (Plataforma)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha y Hora</label>
                      <input type="datetime-local" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setMatchStep('offer')}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button 
                      onClick={() => setMatchStep('contract')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Confirmar Entrevista
                    </button>
                  </div>
                </div>
              )}
              
              {matchStep === 'contract' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">📄 Generar y Firmar Contrato</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">✅ Entrevista completada exitosamente</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500 mb-4">Arrastra el contrato aquí o</p>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      📎 Subir Contrato
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <label className="text-sm text-gray-600">
                      Confirmo que el contrato cumple con las regulaciones laborales y ha sido firmado por ambas partes
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setMatchStep('interview')}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button 
                      onClick={() => setMatchStep('payment')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Confirmar Contrato
                    </button>
                  </div>
                </div>
              )}
              
              {matchStep === 'payment' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">💳 Pago de Comisión AltaMedica</h3>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Salario Anual Acordado:</span>
                      <span className="text-lg font-bold">USD 120,000</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Comisión AltaMedica (10%):</span>
                      <span className="text-lg font-bold text-purple-600">USD 12,000</span>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-xs text-gray-600">Pago en 2 cuotas: 50% ahora, 50% a los 3 meses</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Método de Pago</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="payment" defaultChecked />
                        <img src="/mercadopago.png" alt="MercadoPago" className="h-6" />
                        <span className="text-sm">MercadoPago (ARS/USD)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="payment" />
                        <span className="text-sm">💳 Tarjeta de Crédito (Stripe)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="payment" />
                        <span className="text-sm">🏦 Transferencia Bancaria</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">✨ Beneficios Post-Match</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Garantía de 90 días (reembolso si no funciona)</li>
                      <li>• Soporte HR gratuito durante onboarding</li>
                      <li>• Analytics de rendimiento del empleado</li>
                      <li>• Descuento 5% en próximas contrataciones</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setMatchStep('contract')}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button 
                      onClick={() => {
                        alert('¡Match exitoso! Pago procesado. El candidato ha sido notificado.');
                        setShowMatchModal(false);
                        setMatchStep('offer');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium shadow-lg"
                    >
                      Pagar USD 6,000 (Primera Cuota)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}