'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Filter, List, Navigation, Phone, Star, Clock } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  phone: string;
  distance?: number;
  isOpen?: boolean;
}

// Mock data with coordinates (Barcelona area)
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Hospital Universitario',
    industry: 'Hospital Público',
    location: 'Barcelona, Cataluña',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    rating: 4.5,
    reviewCount: 150,
    phone: '+34912345678',
    distance: 2.5,
    isOpen: true
  },
  {
    id: '2',
    name: 'Clínica Sant Joan',
    industry: 'Clínica Privada',
    location: 'Barcelona, Cataluña',
    coordinates: { lat: 41.3901, lng: 2.1589 },
    rating: 4.3,
    reviewCount: 89,
    phone: '+34912345679',
    distance: 1.8,
    isOpen: true
  },
  {
    id: '3',
    name: 'Centro Médico Diagonal',
    industry: 'Centro Médico',
    location: 'Barcelona, Cataluña',
    coordinates: { lat: 41.3988, lng: 2.1579 },
    rating: 4.1,
    reviewCount: 67,
    phone: '+34912345680',
    distance: 3.2,
    isOpen: false
  },
  {
    id: '4',
    name: 'Hospital del Mar',
    industry: 'Hospital Público',
    location: 'Barcelona, Cataluña',
    coordinates: { lat: 41.3864, lng: 2.1970 },
    rating: 4.4,
    reviewCount: 203,
    phone: '+34912345681',
    distance: 1.5,
    isOpen: true
  }
];

interface CompanyPopupProps {
  company: Company;
  onClose: () => void;
}

function CompanyPopup({ company, onClose }: CompanyPopupProps) {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-10">
      <div data-testid="company-popup" className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 data-testid="popup-company-name" className="font-semibold text-gray-900">
              {company.name}
            </h3>
            <p className="text-sm text-gray-600">{company.industry}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i < Math.floor(company.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {company.rating} ({company.reviewCount} reseñas)
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{company.location}</span>
            {company.distance && (
              <span className="text-blue-600">• {company.distance} km</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{company.phone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={company.isOpen ? 'text-green-600' : 'text-red-600'}>
              {company.isOpen ? 'Abierto ahora' : 'Cerrado'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-3 border-t">
          <Link
            href={`/companies/${company.id}`}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
          >
            Ver detalles
          </Link>
          <a
            href={`tel:${company.phone}`}
            className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-center text-sm font-medium"
          >
            Llamar
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesMapPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Error getting location - use default location
          // Default to Barcelona if location access is denied
          setUserLocation({ lat: 41.3851, lng: 2.1734 });
        }
      );
    } else {
      setUserLocation({ lat: 41.3851, lng: 2.1734 });
    }

    // Load companies
    setTimeout(() => {
      setCompanies(mockCompanies);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCompanies = companies.filter(company =>
    searchTerm === '' ||
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/companies"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Volver a lista
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Mapa de Instituciones Médicas
            </h1>
          </div>

          <button
            onClick={() => setShowList(!showList)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showList ? <MapPin className="h-4 w-4" /> : <List className="h-4 w-4" />}
            {showList ? 'Ver Mapa' : 'Ver Lista'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar instituciones cercanas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map Container */}
        <div className={`${showList ? 'hidden lg:block' : 'block'} flex-1 relative`}>
          <div 
            data-testid="companies-map"
            className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden"
          >
            {/* Simulated Map Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-r from-blue-200 via-green-200 to-blue-300"></div>
              {/* Grid pattern to simulate map */}
              <div className="absolute inset-0 opacity-30" 
                   style={{
                     backgroundImage: `
                       linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                     `,
                     backgroundSize: '50px 50px'
                   }}>
              </div>
            </div>

            {/* Map Markers */}
            {!loading && filteredCompanies.map((company, index) => (
              <div
                key={company.id}
                data-testid="map-marker"
                onClick={() => setSelectedCompany(company)}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform"
                style={{
                  left: `${30 + index * 15}%`,
                  top: `${40 + (index % 2) * 20}%`
                }}
              >
                <div className="relative">
                  <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                    <MapPin className="h-5 w-5 fill-current" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 border-r border-b border-white"></div>
                </div>
              </div>
            ))}

            {/* User Location Marker */}
            {userLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: '50%',
                  top: '50%'
                }}
              >
                <div className="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white pulse">
                  <Navigation className="h-5 w-5" />
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            )}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="bg-white border border-gray-300 p-2 rounded-md shadow-sm hover:bg-gray-50">
                <span className="text-lg font-bold text-gray-700">+</span>
              </button>
              <button className="bg-white border border-gray-300 p-2 rounded-md shadow-sm hover:bg-gray-50">
                <span className="text-lg font-bold text-gray-700">−</span>
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Tu ubicación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Instituciones médicas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Popup */}
          {selectedCompany && (
            <CompanyPopup
              company={selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </div>

        {/* Sidebar List */}
        <div className={`${showList ? 'block' : 'hidden lg:block'} w-full lg:w-80 bg-white border-l border-gray-200 overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Instituciones Cercanas ({filteredCompanies.length})
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className={`
                      p-3 rounded-lg border transition-colors cursor-pointer
                      ${selectedCompany?.id === company.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {company.name}
                        </h3>
                        {company.distance && (
                          <span className="text-xs text-blue-600 font-medium">
                            {company.distance} km
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < Math.floor(company.rating) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {company.rating} ({company.reviewCount})
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600">{company.industry}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className={company.isOpen ? 'text-green-600' : 'text-red-600'}>
                            {company.isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>
                        
                        <Link
                          href={`/companies/${company.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pulse animation styles */}
      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}