'use client';

import {
  ArrowLeft,
  Award,
  Brain,
  Calendar,
  Clock,
  Eye,
  Filter,
  Heart,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
  User,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
// import { ButtonCorporate, CardCorporate, LoadingSpinner } from '@altamedica/ui';
// import { CardContentCorporate } from '../../components/ui';
import { useAuth } from '@altamedica/auth';

// Interfaces TypeScript
import { DoctorProfile as Doctor, DoctorId, MedicalSpecialty, LicenseStatus } from '@altamedica/types';

interface Filters {
  search: string;
  specialty: string;
  location: string;
  availableToday: boolean;
  telemedicineOnly: boolean;
  sortBy: 'rating' | 'experience' | 'fee' | 'availability';
}

const SPECIALTIES = [
  { id: 'all', name: 'Todas las especialidades', icon: Stethoscope },
  { id: 'cardiology', name: 'Cardiología', icon: Heart },
  { id: 'neurology', name: 'Neurología', icon: Brain },
  { id: 'ophthalmology', name: 'Oftalmología', icon: Eye },
  { id: 'general', name: 'Medicina General', icon: Stethoscope },
  { id: 'pediatrics', name: 'Pediatría', icon: User },
  { id: 'dermatology', name: 'Dermatología', icon: User },
];

export default function DoctorsDirectoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    specialty: 'all',
    location: '',
    availableToday: false,
    telemedicineOnly: false,
    sortBy: 'rating',
  });

  // Cargar doctores
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockDoctors: Doctor[] = [
        {
          id: 'doc1' as DoctorId,
          userId: 'user-doc1',
          createdAt: new Date(),
          updatedAt: new Date(),
          registrationNumber: 'MN-12345',
          specialties: [MedicalSpecialty.CARDIOLOGY],
          primarySpecialty: MedicalSpecialty.CARDIOLOGY,
          licenses: [{
            licenseNumber: 'LP-67890',
            licenseType: 'national',
            issuingAuthority: 'Ministerio de Salud',
            status: LicenseStatus.ACTIVE,
            issueDate: new Date('2010-05-20'),
            expirationDate: new Date('2025-05-20'),
          }],
          certifications: [],
          education: [{
            institution: 'Universidad de Buenos Aires',
            degree: 'Médico Cirujano',
            fieldOfStudy: 'Medicina',
            graduationYear: 2008,
            country: 'Argentina',
          }],
          experience: [{
            institution: 'Centro Médico AltaMedica',
            position: 'Cardiólogo',
            startDate: new Date('2010-06-01'),
            isCurrent: true,
          }],
          yearsOfExperience: 15,
          languages: ['Español', 'Inglés'],
          hospitalAffiliations: ['Centro Médico AltaMedica'],
          schedule: [],
          consultationFee: 800,
          acceptedInsurance: ['OSDE', 'Swiss Medical'],
          offersTelemedicine: true,
          isVerified: true,
          acceptingNewPatients: true,
          averageRating: 4.8,
          bio: 'Cardiólogo con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.',
        },
        {
          id: 'doc2' as DoctorId,
          userId: 'user-doc2',
          createdAt: new Date(),
          updatedAt: new Date(),
          registrationNumber: 'MN-54321',
          specialties: [MedicalSpecialty.GENERAL_PRACTICE],
          primarySpecialty: MedicalSpecialty.GENERAL_PRACTICE,
          licenses: [{
            licenseNumber: 'LP-09876',
            licenseType: 'national',
            issuingAuthority: 'Ministerio de Salud',
            status: LicenseStatus.ACTIVE,
            issueDate: new Date('2012-03-15'),
            expirationDate: new Date('2027-03-15'),
          }],
          certifications: [],
          education: [{
            institution: 'Universidad Nacional de Córdoba',
            degree: 'Médico General',
            fieldOfStudy: 'Medicina',
            graduationYear: 2011,
            country: 'Argentina',
          }],
          experience: [{
            institution: 'Clínica Norte',
            position: 'Médico General',
            startDate: new Date('2012-04-01'),
            isCurrent: true,
          }],
          yearsOfExperience: 12,
          languages: ['Español', 'Portugués'],
          hospitalAffiliations: ['Clínica Norte'],
          schedule: [],
          consultationFee: 600,
          acceptedInsurance: ['OSDE', 'Galeno'],
          offersTelemedicine: true,
          isVerified: true,
          acceptingNewPatients: true,
          averageRating: 4.9,
          bio: 'Médica general con amplia experiencia en atención primaria y medicina preventiva.',
        },
      ];
      setDoctors(mockDoctors);
    } catch (error: any) {
      setError(error.message || 'Error al cargar doctores');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar y ordenar doctores
  const filteredDoctors = useMemo(() => {
    const filtered = doctors.filter((doctor) => {
      // Búsqueda por nombre
      if (
        filters.search &&
        !doctor.userId
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Filtro por especialidad
      if (filters.specialty !== 'all' && doctor.primarySpecialty !== filters.specialty) {
        return false;
      }

      // Filtro por ubicación
      if (
        filters.location &&
        !doctor.hospitalAffiliations.join(', ').toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      // Solo telemedicina
      if (filters.telemedicineOnly && !doctor.offersTelemedicine) {
        return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'experience':
          return b.yearsOfExperience - a.yearsOfExperience;
        case 'fee':
          return a.consultationFee - b.consultationFee;
        default:
          return 0;
      }
    });

    return filtered;
  }, [doctors, filters]);

  const getSpecialtyIcon = (specialty: string) => {
    const specialtyData = SPECIALTIES.find((s) => s.id === specialty);
    const IconComponent = specialtyData?.icon || Stethoscope;
    return <IconComponent className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-medium text-gray-600">Cargando doctores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <ArrowLeft className="w-4 h-4 mr-2 inline" />
                  Volver
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Directorio de Doctores</h1>
                <p className="text-gray-600">Encuentra el especialista perfecto para ti</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2 inline" />
                Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Barra de Búsqueda y Filtros */}
        <div className="mb-8 space-y-4">
          {/* Búsqueda Principal */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID de doctor..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Especialidades */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {SPECIALTIES.map((specialty) => (
              <button
                key={specialty.id}
                onClick={() => setFilters({ ...filters, specialty: specialty.id })}
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                  filters.specialty === specialty.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <specialty.icon className="w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-center">{specialty.name}</span>
              </button>
            ))}
          </div>

          {/* Filtros Avanzados */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                  <input
                    type="text"
                    placeholder="Ciudad o región..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  >
                    <option value="rating">Mejor calificación</option>
                    <option value="experience">Más experiencia</option>
                    <option value="fee">Menor precio</option>
                    <option value="availability">Disponibilidad</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={filters.availableToday}
                      onChange={(e) => setFilters({ ...filters, availableToday: e.target.checked })}
                    />
                    <span className="text-sm">Disponible hoy</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={filters.telemedicineOnly}
                      onChange={(e) =>
                        setFilters({ ...filters, telemedicineOnly: e.target.checked })
                      }
                    />
                    <span className="text-sm">Solo telemedicina</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados */}
        {error ? (
          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 'es' : ''} encontrado
                {filteredDoctors.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                       <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                         <User className="w-8 h-8 text-gray-500" />
                       </div>
                       <div className="flex-1">
                         <h2 className="text-lg font-bold text-gray-900">Doctor: {doctor.userId}</h2>
                         <p className="text-blue-600 font-semibold">{doctor.primarySpecialty}</p>
                         <div className="flex items-center mt-2 space-x-2">
                           <div className="flex items-center text-sm text-gray-600">
                             <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                             <span className="font-medium">{doctor.averageRating}</span>
                           </div>
                           <span className="text-gray-400">|</span>
                           <div className="flex items-center text-sm text-gray-600">
                             <Award className="w-4 h-4 text-gray-500 mr-1" />
                             <span>{doctor.yearsOfExperience} años</span>
                           </div>
                         </div>
                       </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">{doctor.bio}</p>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t">
                     <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-800">${doctor.consultationFee}</p>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                           Ver Perfil
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDoctors.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  No se encontraron doctores con los filtros seleccionados
                </p>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() =>
                    setFilters({
                      search: '',
                      specialty: 'all',
                      location: '',
                      availableToday: false,
                      telemedicineOnly: false,
                      sortBy: 'rating',
                    })
                  }
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
