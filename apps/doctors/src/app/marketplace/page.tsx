'use client';

import { Button, Card, Input } from '@altamedica/ui';
import NotificationCenter from '@/components/NotificationCenter';
import {
  useDoctorProfile,
  useJobApplications,
  useMarketplaceJobs
} from '@altamedica/marketplace-hooks';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingUp,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared';
// Tipos de ofertas médicas
interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  locationType: 'remote' | 'on-site' | 'hybrid';
  salary: string;
  contractType: 'full-time' | 'part-time' | 'contract' | 'locum';
  specialty: string;
  postedDate: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  requirements: string[];
  benefits: string[];
  applicants: number;
  matchScore?: number;
  description: string;
  experienceRequired: string;
  certifications: string[];
  languages: string[];
  shiftType?: string;
  patientVolume?: string;
}

// Datos mock ampliados (se usarán solo como fallback)
const mockJobOffers: JobOffer[] = [
  {
    id: 'job-001',
    title: 'Cardiólogo Intervencionista - Urgente',
    company: 'Hospital Central Buenos Aires',
    location: 'Buenos Aires, Argentina',
    locationType: 'on-site',
    salary: 'USD 8,000 - 12,000/mes',
    contractType: 'full-time',
    specialty: 'Cardiología',
    postedDate: '2025-01-28',
    urgencyLevel: 'high',
    requirements: [
      'Especialidad en Cardiología',
      '5+ años en procedimientos intervencionistas',
      'Certificación vigente',
      'Disponibilidad inmediata'
    ],
    benefits: [
      'Seguro médico familiar premium',
      'Educación continua pagada',
      'Bonos por desempeño',
      'Guardias bien remuneradas'
    ],
    applicants: 8,
    matchScore: 92,
    description: 'Buscamos cardiólogo especializado en procedimientos intervencionistas para unirse a nuestro equipo de élite.',
    experienceRequired: '5-10 años',
    certifications: ['Board Certified', 'ACLS', 'BLS'],
    languages: ['Español', 'Inglés'],
    shiftType: 'Rotativo con guardias',
    patientVolume: 'Alto (30-40 pacientes/día)'
  },
  {
    id: 'job-002',
    title: 'Pediatra - Telemedicina Internacional',
    company: 'AltaMedica Global Network',
    location: 'Remoto - LATAM',
    locationType: 'remote',
    salary: 'USD 60-100/hora',
    contractType: 'contract',
    specialty: 'Pediatría',
    postedDate: '2025-01-26',
    urgencyLevel: 'medium',
    requirements: [
      'Especialidad en Pediatría',
      'Experiencia en telemedicina',
      'Equipo propio para videollamadas',
      'Horario flexible'
    ],
    benefits: [
      'Trabajo 100% remoto',
      'Pagos semanales',
      'Capacitación en plataforma',
      'Sin mínimo de horas'
    ],
    applicants: 24,
    matchScore: 88,
    description: 'Únete a la red de telemedicina más grande de Latinoamérica. Atiende pacientes desde la comodidad de tu hogar.',
    experienceRequired: '2+ años',
    certifications: ['Licencia médica vigente'],
    languages: ['Español', 'Portugués (deseable)'],
    shiftType: 'Flexible - Tu eliges',
    patientVolume: 'Moderado (10-15 consultas/día)'
  },
  {
    id: 'job-003',
    title: 'Neurólogo - Centro de Investigación',
    company: 'Instituto Neurológico Argentino',
    location: 'Córdoba, Argentina',
    locationType: 'hybrid',
    salary: 'USD 10,000 - 15,000/mes',
    contractType: 'full-time',
    specialty: 'Neurología',
    postedDate: '2025-01-25',
    urgencyLevel: 'low',
    requirements: [
      'Doctorado en Neurología',
      'Publicaciones científicas',
      'Experiencia en investigación clínica',
      'Inglés avanzado'
    ],
    benefits: [
      '30% tiempo para investigación',
      'Acceso a tecnología de punta',
      'Conferencias internacionales',
      'Sabático cada 5 años'
    ],
    applicants: 5,
    matchScore: 85,
    description: 'Oportunidad única para combinar práctica clínica con investigación de vanguardia en enfermedades neurodegenerativas.',
    experienceRequired: '7+ años',
    certifications: ['PhD', 'Research Fellow'],
    languages: ['Español', 'Inglés', 'Alemán (plus)'],
    shiftType: 'Lunes a Viernes',
    patientVolume: 'Bajo (investigación)'
  },
  {
    id: 'job-004',
    title: 'Médico de Emergencias - Turno Nocturno',
    company: 'Clínica de Urgencias 24/7',
    location: 'Rosario, Argentina',
    locationType: 'on-site',
    salary: 'USD 6,000 - 8,000/mes + guardias',
    contractType: 'full-time',
    specialty: 'Medicina de Emergencia',
    postedDate: '2025-01-27',
    urgencyLevel: 'emergency',
    requirements: [
      'Especialidad en Emergencias',
      'ATLS certificado',
      'Disponibilidad nocturna',
      'Manejo de trauma'
    ],
    benefits: [
      'Bonos nocturnos 50% extra',
      'Descanso compensatorio',
      'Seguro de vida',
      'Comidas incluidas'
    ],
    applicants: 3,
    matchScore: 78,
    description: 'Necesitamos médico experimentado para cubrir guardias nocturnas en servicio de emergencias de alta complejidad.',
    experienceRequired: '3-5 años',
    certifications: ['ATLS', 'ACLS', 'PALS'],
    languages: ['Español'],
    shiftType: 'Nocturno 20:00 - 08:00',
    patientVolume: 'Muy Alto (emergencias)'
  }
];

// Componente de filtros
const FilterPanel = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    specialty: '',
    locationType: '',
    contractType: '',
    salaryMin: '',
    urgency: ''
  });

  const specialties = ['Cardiología', 'Pediatría', 'Neurología', 'Medicina de Emergencia', 'Oncología', 'Psiquiatría'];
  const locationTypes = ['remote', 'on-site', 'hybrid'];
  const contractTypes = ['full-time', 'part-time', 'contract', 'locum'];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Filter className="w-5 h-5 mr-2" />
        Filtros
      </h3>
      
      <div className="space-y-4">
        {/* Especialidad */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Especialidad
          </label>
          <select 
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={filters.specialty}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {/* Tipo de ubicación */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Modalidad
          </label>
          <div className="space-y-2">
            {locationTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="locationType"
                  value={type}
                  checked={filters.locationType === type}
                  onChange={(e) => handleFilterChange('locationType', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  {type === 'remote' ? '🏠 Remoto' : 
                   type === 'on-site' ? '🏥 Presencial' : '🔄 Híbrido'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de contrato */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de Contrato
          </label>
          <select 
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={filters.contractType}
            onChange={(e) => handleFilterChange('contractType', e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {contractTypes.map(type => (
              <option key={type} value={type}>
                {type === 'full-time' ? 'Tiempo Completo' :
                 type === 'part-time' ? 'Medio Tiempo' :
                 type === 'contract' ? 'Por Contrato' : 'Locum/Temporal'}
              </option>
            ))}
          </select>
        </div>

        {/* Urgencia */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nivel de Urgencia
          </label>
          <select 
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={filters.urgency}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
          >
            <option value="">Cualquier urgencia</option>
            <option value="emergency">🚨 Emergencia</option>
            <option value="high">🔴 Alta</option>
            <option value="medium">🟡 Media</option>
            <option value="low">🟢 Baja</option>
          </select>
        </div>

        {/* Botón limpiar filtros */}
        <button
          onClick={() => {
            setFilters({
              specialty: '',
              locationType: '',
              contractType: '',
              salaryMin: '',
              urgency: ''
            });
            onFilterChange({});
          }}
          className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-800 underline"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

// Componente de tarjeta de oferta
const JobCard = ({ job, onClick }: { job: JobOffer; onClick: () => void }) => {
  const urgencyColors = {
    emergency: 'bg-alert-100 text-alert-700 border-alert-200',
    high: 'bg-alert-100 text-alert-700 border-alert-200',
    medium: 'bg-alert-100 text-alert-700 border-alert-200',
    low: 'bg-success-100 text-success-700 border-success-200'
  };

  const locationIcons = {
    remote: '🏠',
    'on-site': '🏥',
    hybrid: '🔄'
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary-300"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-neutral-900 mb-1">{job.title}</h3>
          <div className="flex items-center text-neutral-600 space-x-4">
            <span className="flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              {job.company}
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {job.location}
            </span>
          </div>
        </div>
        
        {job.matchScore && (
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{job.matchScore}%</div>
            <div className="text-xs text-neutral-500">Match</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {/* Urgencia */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[job.urgencyLevel]}`}>
          {job.urgencyLevel === 'emergency' ? '🚨 Urgente' :
           job.urgencyLevel === 'high' ? '⚡ Alta Prioridad' :
           job.urgencyLevel === 'medium' ? '⏰ Media' : '✓ Normal'}
        </span>

        {/* Modalidad */}
        <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-medium">
          {locationIcons[job.locationType]} {
            job.locationType === 'remote' ? 'Remoto' :
            job.locationType === 'on-site' ? 'Presencial' : 'Híbrido'
          }
        </span>

        {/* Especialidad */}
        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
          <Stethoscope className="w-3 h-3 inline mr-1" />
          {job.specialty}
        </span>

        {/* Tipo de contrato */}
        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
          {job.contractType === 'full-time' ? 'Tiempo Completo' :
           job.contractType === 'part-time' ? 'Medio Tiempo' :
           job.contractType === 'contract' ? 'Contrato' : 'Locum'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-neutral-600">
          <DollarSign className="w-4 h-4 mr-2 text-success-600" />
          <span className="font-medium">{job.salary}</span>
        </div>
        <div className="flex items-center text-neutral-600">
          <Clock className="w-4 h-4 mr-2 text-primary-600" />
          <span>{job.experienceRequired} experiencia</span>
        </div>
      </div>

      <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center text-sm text-neutral-500">
          <Users className="w-4 h-4 mr-1" />
          {job.applicants} postulantes
        </div>
        <div className="flex items-center text-sm text-neutral-500">
          <Calendar className="w-4 h-4 mr-1" />
          Publicado {new Date(job.postedDate).toLocaleDateString('es-ES')}
        </div>
        <button className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm">
          Ver detalles
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

// Dashboard de estadísticas
const MarketplaceStats = ({ jobs }: { jobs: JobOffer[] }) => {
  const stats = {
    totalJobs: jobs.length,
    urgentJobs: jobs.filter(j => j.urgencyLevel === 'emergency' || j.urgencyLevel === 'high').length,
    remoteJobs: jobs.filter(j => j.locationType === 'remote').length,
    avgApplicants: Math.round(jobs.reduce((sum, j) => sum + j.applicants, 0) / jobs.length)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Ofertas Activas</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.totalJobs}</p>
          </div>
          <Briefcase className="w-8 h-8 text-primary-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Urgentes</p>
            <p className="text-2xl font-bold text-alert-600">{stats.urgentJobs}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-alert-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Remotas</p>
            <p className="text-2xl font-bold text-success-600">{stats.remoteJobs}</p>
          </div>
          <MapPin className="w-8 h-8 text-success-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Promedio Postulantes</p>
            <p className="text-2xl font-bold text-primary-600">{stats.avgApplicants}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary-500" />
        </div>
      </div>
    </div>
  );
};

// Componente principal del Marketplace
const DoctorMarketplacePage = () => {
  const router = useRouter();
  
  // Using marketplace hooks instead of custom hooks
  const {
    jobs,
    loading: isLoading,
    error,
    searchJobs
  } = useMarketplaceJobs({
    initialFilters: {
      specialization: '',
      location: '',
      employmentType: ''
    }
  });

  const {
    profile: doctorProfile,
    loading: profileLoading
  } = useDoctorProfile();

  const {
    applications,
    updateApplication
  } = useJobApplications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'match' | 'salary' | 'urgency'>('match');
  const [isConnected, setIsConnected] = useState(true);

  // Usar directamente los jobs del hook en lugar de filteredJobs
  const displayJobs = jobs || mockJobOffers;

  // Actualizar conexión basada en el estado de los jobs
  useEffect(() => {
    setIsConnected(!error && jobs !== null);
  }, [jobs, error]);

  // Aplicar filtros usando los hooks del marketplace
  const handleFilterChange = (newFilters: any) => {
    // TODO: Implement filter logic. The useMarketplaceJobs hook does not currently support filtering.
    // setFilters({ ...filters, ...newFilters });
  };

  // Efecto para búsqueda usando el hook
  useEffect(() => {
    if (searchTerm) {
      searchJobs(searchTerm);
    }
  }, [searchTerm, searchJobs]);

  const handleJobClick = (jobId: string) => {
    router.push(`/marketplace/listings/${jobId}`);
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      // TODO: The logic here is incorrect. `updateApplication` expects an application ID.
      // The hook should expose a `submitApplication` function.
      await updateApplication(jobId, {
        coverLetter: 'Aplicación desde marketplace',
        attachments: []
      });
      // Show success message
    } catch (error) {
      // Show error message
      logger.error('Error applying to job:', String(error));
    }
  };

  const refreshJobs = () => {
    // Refresh logic using marketplace hooks
    searchJobs('');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Marketplace Médico</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-neutral-600">
                  Encuentra las mejores oportunidades profesionales
                  {doctorProfile && ` para ${doctorProfile.specialty}`}
                </p>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <span className="flex items-center text-xs text-success-600">
                      <Wifi className="w-3 h-3 mr-1" />
                      Conectado
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-orange-600">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Modo offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <button
                onClick={refreshJobs}
                disabled={isLoading}
                className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                title="Actualizar ofertas"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center"
              >
                <Users className="w-4 h-4 mr-2" />
                Mi Perfil
              </button>
              <button
                onClick={() => router.push('/marketplace/applications')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Mis Postulaciones
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título, empresa o descripción..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="match">Mejor Match</option>
              <option value="date">Más Recientes</option>
              <option value="urgency">Más Urgentes</option>
              <option value="salary">Mayor Salario</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <MarketplaceStats jobs={displayJobs} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel de filtros */}
          <div className="lg:col-span-1">
            <FilterPanel onFilterChange={handleFilterChange} />
          </div>

          {/* Lista de ofertas */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-neutral-600">Cargando ofertas...</p>
              </div>
            ) : displayJobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No se encontraron ofertas</h3>
                <p className="text-neutral-600">Intenta ajustar los filtros o realizar una nueva búsqueda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayJobs.map((job: any) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onClick={() => handleJobClick(job.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMarketplacePage;