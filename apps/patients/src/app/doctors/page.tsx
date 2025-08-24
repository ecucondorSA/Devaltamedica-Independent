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
import { ButtonCorporate, CardCorporate, LoadingSpinner } from '@altamedica/ui';
import { CardContentCorporate } from '../../components/ui';
import { useAuth } from '@altamedica/auth';

// Interfaces TypeScript
import { Doctor } from '@altamedica/types';

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
  const { authState } = useAuth();

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
    if (!authState?.token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users?role=doctor&verified=true&limit=50`, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(responseJson?.error || 'Error al cargar doctores');
      }

      // Simular datos adicionales hasta que tengamos endpoints completos
      const doctorsWithDetails = (responseJson.data || []).map((doctor: any) => ({
        ...doctor,
        rating: Math.random() * 2 + 3, // 3-5 stars
        reviewsCount: Math.floor(Math.random() * 200) + 10,
        experience: `${Math.floor(Math.random() * 20) + 5} años de experiencia`,
        qualifications: ['Certificación en ' + doctor.specialty, 'Medicina General'],
        location: doctor.location || 'Ciudad de México',
        consultationFee: Math.floor(Math.random() * 1000) + 500,
        availability: {
          today: Math.random() > 0.5,
          nextAvailable: 'Mañana a las 10:00 AM',
          schedule: ['Lunes-Viernes 9:00-17:00', 'Sábados 9:00-13:00'],
        },
        services: {
          inPerson: true,
          telemedicine: Math.random() > 0.3,
          emergency: Math.random() > 0.7,
        },
        languages: ['Español', 'Inglés'],
        bio: `Especialista en ${doctor.specialty} con amplia experiencia en el diagnóstico y tratamiento de pacientes.`,
        hospitalAffiliations: ['Hospital General', 'Clínica Especializada'],
        specialtyCategory: doctor.specialty?.toLowerCase() || 'general',
      }));

      setDoctors(doctorsWithDetails);
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
        !`${doctor.firstName} ${doctor.lastName}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Filtro por especialidad
      if (filters.specialty !== 'all' && doctor.specialtyCategory !== filters.specialty) {
        return false;
      }

      // Filtro por ubicación
      if (
        filters.location &&
        !doctor.location.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      // Disponible hoy
      if (filters.availableToday && !doctor.availability.today) {
        return false;
      }

      // Solo telemedicina
      if (filters.telemedicineOnly && !doctor.services.telemedicine) {
        return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience);
        case 'fee':
          return a.consultationFee - b.consultationFee;
        case 'availability':
          return a.availability.today === b.availability.today ? 0 : a.availability.today ? -1 : 1;
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
          <LoadingSpinner size="lg" />
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
                <ButtonCorporate variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </ButtonCorporate>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Directorio de Doctores</h1>
                <p className="text-gray-600">Encuentra el especialista perfecto para ti</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ButtonCorporate
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </ButtonCorporate>
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
              placeholder="Buscar por nombre del doctor..."
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
            <CardCorporate variant="default" size="lg">
              <CardContentCorporate className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
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
                        onChange={(e) =>
                          setFilters({ ...filters, availableToday: e.target.checked })
                        }
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
              </CardContentCorporate>
            </CardCorporate>
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
                <CardCorporate
                  key={doctor.id}
                  variant="default"
                  size="lg"
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContentCorporate className="p-6">
                    {/* Header del Doctor */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        {doctor.photo ? (
                          <img
                            src={doctor.photo}
                            alt={`${doctor.firstName} ${doctor.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <div className="flex items-center space-x-2 mb-1">
                          {getSpecialtyIcon(doctor.specialtyCategory)}
                          <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                        </div>
                        <p className="text-sm text-gray-600">{doctor.experience}</p>
                      </div>
                    </div>

                    {/* Rating y Reviews */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium">{doctor.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500">({doctor.reviewsCount} reseñas)</span>
                      {doctor.availability.today && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Disponible hoy
                        </span>
                      )}
                    </div>

                    {/* Ubicación y Servicios */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {doctor.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {doctor.availability.nextAvailable}
                      </div>
                    </div>

                    {/* Servicios Disponibles */}
                    <div className="flex items-center space-x-4 mb-4">
                      {doctor.services.inPerson && (
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="w-3 h-3 mr-1" />
                          Presencial
                        </div>
                      )}
                      {doctor.services.telemedicine && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Video className="w-3 h-3 mr-1" />
                          Telemedicina
                        </div>
                      )}
                      {doctor.services.emergency && (
                        <div className="flex items-center text-xs text-red-600">
                          <Phone className="w-3 h-3 mr-1" />
                          Emergencias
                        </div>
                      )}
                    </div>

                    {/* Precio */}
                    <div className="mb-4">
                      <p className="text-lg font-semibold text-gray-900">
                        ${doctor.consultationFee.toLocaleString()}
                        <span className="text-sm font-normal text-gray-600"> / consulta</span>
                      </p>
                    </div>

                    {/* Certificaciones */}
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <Award className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-sm font-medium text-gray-700">Certificaciones:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doctor.qualifications.slice(0, 2).map((qual, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {qual}
                          </span>
                        ))}
                        {doctor.qualifications.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{doctor.qualifications.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-2">
                      <ButtonCorporate
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push(`/appointments/new?doctorId=${doctor.id}`)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar Cita
                      </ButtonCorporate>

                      <div className="grid grid-cols-2 gap-2">
                        <ButtonCorporate
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/doctors/${doctor.id}`)}
                        >
                          Ver Perfil
                        </ButtonCorporate>

                        {doctor.services.telemedicine && (
                          <ButtonCorporate
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/appointments/new?doctorId=${doctor.id}&type=telemedicine`,
                              )
                            }
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Video
                          </ButtonCorporate>
                        )}
                      </div>
                    </div>
                  </CardContentCorporate>
                </CardCorporate>
              ))}
            </div>

            {filteredDoctors.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  No se encontraron doctores con los filtros seleccionados
                </p>
                <ButtonCorporate
                  variant="ghost"
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
                </ButtonCorporate>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
