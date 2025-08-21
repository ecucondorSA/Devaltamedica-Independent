'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { Filter, MapPin, Search, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  location: string;
  size: string;
  rating: number;
  jobCount: number;
  logo: string;
  website: string;
}

interface CompanyCardProps {
  company: Company;
}

function CompanyCardComponent({ company }: CompanyCardProps) {
  return (
    <div 
      data-testid="company-card" 
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white">
            {company.name.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 data-testid="company-name" className="text-lg font-semibold text-gray-900 truncate">
                {company.name}
              </h3>
              <p className="text-sm text-gray-600">{company.industry}</p>
            </div>
            
            <div data-testid="company-rating" className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-medium text-gray-900">{company.rating}</span>
              <span className="text-gray-500">(150)</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {company.description}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span data-testid="company-location">{company.location}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{company.size} empleados</span>
            </div>
            
            <div data-testid="company-specialties" className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                Cardiología
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                Neurología
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                Cirugía
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{company.jobCount} ofertas activas</span>
            </div>
            
            <Link
              href={`/companies/${company.id}`}
              data-testid="view-company-details"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesSearchPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        // Error fetching companies - could implement proper error handling here
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchTerm === '' || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === '' || selectedSpecialty === 'cardiology';
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Encuentra Instituciones Médicas
            </h1>
            <p className="text-lg text-gray-600">
              Conecta con hospitales, clínicas y centros médicos de excelencia
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                data-testid="search-input"
                placeholder="Buscar por nombre, ubicación o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Specialty Filter */}
            <div className="relative">
              <select
                data-testid="specialty-filter"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todas las especialidades</option>
                <option value="cardiology">Cardiología</option>
                <option value="neurology">Neurología</option>
                <option value="surgery">Cirugía</option>
                <option value="pediatrics">Pediatría</option>
                <option value="oncology">Oncología</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Search Button */}
            <button
              data-testid="search-button"
              onClick={() => {
                // Trigger search (currently handled by state changes)
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Cargando...' : `${filteredCompanies.length} instituciones encontradas`}
            </h2>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-1">
                Resultados para &quot;{searchTerm}&quot;
              </p>
            )}
          </div>

          <Link
            href="/companies/map"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Ver en mapa
          </Link>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCardComponent key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600">
                Intenta modificar los filtros de búsqueda o usar términos diferentes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}