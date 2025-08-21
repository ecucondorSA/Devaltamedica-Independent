'use client';

import React, { useState, useEffect } from 'react';
import { Target, MapPin, Users, Building2, Star, Clock, Heart } from 'lucide-react';

import { logger } from '@altamedica/shared/services/logger.service';
interface MarketplaceDemoMapProps {
  height?: string;
  interactive?: boolean;
}

// Componente de loading
const MapLoading = () => (
  <div className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-lg overflow-hidden">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
      <p className="text-gray-600 font-medium">Cargando mapa de Latinoamérica...</p>
    </div>
  </div>
);

// Datos demo específicos para Latinoamérica
const latinAmericaDoctors = [
  {
    id: 'doc-argentina-1',
    name: 'Dr. Carlos Martínez',
    specialties: ['Cardiología', 'Medicina Interna'],
    location: {
      city: 'Buenos Aires',
      country: 'Argentina',
      coordinates: [-34.6037, -58.3816] as [number, number],
    },
    rating: 4.8,
    experience: 12,
    hourlyRate: 85,
    availableForHiring: true,
    responseTime: 2,
    totalHires: 47,
    isUrgentAvailable: true,
    isOnline: true,
    workArrangement: 'hybrid' as const,
    languages: ['Español', 'Inglés'],
    verificationStatus: 'verified' as const,
  },
  {
    id: 'doc-brazil-1',
    name: 'Dra. Ana Rodrigues',
    specialties: ['Pediatría', 'Neonatología'],
    location: {
      city: 'São Paulo',
      country: 'Brasil',
      coordinates: [-23.5505, -46.6333] as [number, number],
    },
    rating: 4.9,
    experience: 8,
    hourlyRate: 75,
    availableForHiring: true,
    responseTime: 1,
    totalHires: 62,
    isUrgentAvailable: false,
    isOnline: true,
    workArrangement: 'remote' as const,
    languages: ['Português', 'Inglês', 'Español'],
    verificationStatus: 'verified' as const,
  },
  {
    id: 'doc-mexico-1',
    name: 'Dr. Miguel Hernández',
    specialties: ['Cirugía General', 'Laparoscopía'],
    location: {
      city: 'Ciudad de México',
      country: 'México',
      coordinates: [19.4326, -99.1332] as [number, number],
    },
    rating: 4.7,
    experience: 15,
    hourlyRate: 90,
    availableForHiring: true,
    responseTime: 3,
    totalHires: 34,
    isUrgentAvailable: true,
    isOnline: false,
    workArrangement: 'on_site' as const,
    languages: ['Español', 'English'],
    verificationStatus: 'verified' as const,
  },
  {
    id: 'doc-colombia-1',
    name: 'Dra. Sofia Valencia',
    specialties: ['Ginecología', 'Obstetricia'],
    location: {
      city: 'Bogotá',
      country: 'Colombia',
      coordinates: [4.7110, -74.0721] as [number, number],
    },
    rating: 4.8,
    experience: 10,
    hourlyRate: 70,
    availableForHiring: true,
    responseTime: 2,
    totalHires: 28,
    isUrgentAvailable: false,
    isOnline: true,
    workArrangement: 'flexible' as const,
    languages: ['Español', 'English'],
    verificationStatus: 'verified' as const,
  },
  {
    id: 'doc-chile-1',
    name: 'Dr. Roberto Silva',
    specialties: ['Traumatología', 'Ortopedia'],
    location: {
      city: 'Santiago',
      country: 'Chile',
      coordinates: [-33.4489, -70.6693] as [number, number],
    },
    rating: 4.6,
    experience: 18,
    hourlyRate: 95,
    availableForHiring: true,
    responseTime: 4,
    totalHires: 41,
    isUrgentAvailable: true,
    isOnline: true,
    workArrangement: 'hybrid' as const,
    languages: ['Español', 'English'],
    verificationStatus: 'verified' as const,
  },
  {
    id: 'doc-peru-1',
    name: 'Dra. Carmen Quispe',
    specialties: ['Medicina Familiar', 'Geriatría'],
    location: {
      city: 'Lima',
      country: 'Perú',
      coordinates: [-12.0464, -77.0428] as [number, number],
    },
    rating: 4.7,
    experience: 14,
    hourlyRate: 65,
    availableForHiring: true,
    responseTime: 2,
    totalHires: 55,
    isUrgentAvailable: false,
    isOnline: true,
    workArrangement: 'remote' as const,
    languages: ['Español', 'Quechua'],
    verificationStatus: 'verified' as const,
  }
];

const latinAmericaHospitals = [
  {
    id: 'hospital-argentina-1',
    name: 'Hospital Italiano',
    location: {
      city: 'Buenos Aires',
      country: 'Argentina',
      coordinates: [-34.6118, -58.3960] as [number, number],
    },
    type: 'private',
    totalHires: 127,
    urgentJobs: 3,
    rating: 4.8,
  },
  {
    id: 'hospital-brazil-1', 
    name: 'Hospital Sírio-Libanês',
    location: {
      city: 'São Paulo',
      country: 'Brasil',
      coordinates: [-23.5629, -46.6544] as [number, number],
    },
    type: 'private',
    totalHires: 89,
    urgentJobs: 2,
    rating: 4.9,
  },
  {
    id: 'hospital-mexico-1',
    name: 'Hospital ABC',
    location: {
      city: 'Ciudad de México',
      country: 'México',
      coordinates: [19.4200, -99.1677] as [number, number],
    },
    type: 'private',
    totalHires: 156,
    urgentJobs: 5,
    rating: 4.7,
  },
  {
    id: 'hospital-colombia-1',
    name: 'Fundación Santa Fe',
    location: {
      city: 'Bogotá',
      country: 'Colombia',
      coordinates: [4.6590, -74.0536] as [number, number],
    },
    type: 'private',
    totalHires: 73,
    urgentJobs: 1,
    rating: 4.6,
  }
];

export default function MarketplaceDemoMapFixed({ 
  height = '600px', 
  interactive = true 
}: MarketplaceDemoMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [LeafletMap, setLeafletMap] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Cargar el mapa solo en el cliente y de forma dinámica
    let isMounted = true;

    const loadMap = async () => {
      try {
        // Importación completamente dinámica
        const { default: dynamic } = await import('next/dynamic');
        
        const DynamicMap = dynamic(
          () => import('./LeafletMapCore').then(mod => ({ default: mod.LeafletMapCore })),
          { 
            ssr: false,
            loading: () => <MapLoading />
          }
        );

        if (isMounted) {
          setLeafletMap(() => DynamicMap);
          setIsLoaded(true);
        }
      } catch (error) {
        logger.warn('Error loading map:', error);
        if (isMounted) {
          setIsLoaded(true); // Mostrar fallback
        }
      }
    };

    // Delay para asegurar hidratación completa
    const timer = setTimeout(loadMap, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="relative overflow-hidden rounded-lg" style={{ height }}>
        <MapLoading />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ height }}>
      {/* Controles del mapa */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{latinAmericaDoctors.filter(d => d.isOnline).length} En línea</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>{latinAmericaDoctors.filter(d => d.isUrgentAvailable).length} Urgentes</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-blue-600" />
            <span>{latinAmericaHospitals.length} Hospitales</span>
          </div>
        </div>
      </div>

      {/* Estadísticas flotantes */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{latinAmericaDoctors.length}</div>
          <div className="text-xs text-gray-600">Médicos disponibles</div>
        </div>
      </div>

      {/* Mapa */}
      {LeafletMap ? (
        <LeafletMap
          doctors={latinAmericaDoctors}
          hospitals={latinAmericaHospitals}
          interactive={interactive}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto" />
            <p className="text-gray-600 font-medium">Mapa no disponible</p>
            <p className="text-sm text-gray-500">
              {latinAmericaDoctors.length} médicos en {latinAmericaHospitals.length} hospitales
            </p>
          </div>
        </div>
      )}

      {/* Leyenda - Fixed */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-semibold text-sm mb-2">Leyenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
            <span>Médicos disponibles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
            <span>Urgencias 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded-xl border-2 border-white shadow-sm"></div>
            <span>Hospitales</span>
          </div>
        </div>
      </div>
    </div>
  );
}