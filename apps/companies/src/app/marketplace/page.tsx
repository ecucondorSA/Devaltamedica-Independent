"use client";

import {
    Briefcase,
    ChevronDown,
    Clock,
    DollarSign,
    Eye,
    Grid,
    List,
    MapPin,
    MoreHorizontal,
    PanelLeft,
    PanelRight,
    Plus,
    Search,
    TrendingUp,
    Users
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Importar hooks del marketplace
import JobForm from '@/components/marketplace/JobForm';
import JobMarketplaceDashboard from '@/components/marketplace/JobMarketplaceDashboard';
import MarketplaceAnalytics from '@/components/marketplace/MarketplaceAnalytics';
import MessagingSystem from '@/components/marketplace/MessagingSystem';
import {
    useCompanyProfile,
    useDoctorSearch,
    useJobApplications,
    useMarketplaceJobs
} from '@altamedica/marketplace-hooks';
// SSR-safe map import
const MarketplaceMap = dynamic(() => import('@/components/MarketplaceMap'), { ssr: false });

// === TIPOS TYPESCRIPT ===
interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  specialty: string;
  type: 'full-time' | 'part-time' | 'contract' | 'locum';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  postedDate: string;
  applications: number;
  views: number;
  status: 'active' | 'paused' | 'closed';
  urgent?: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  experience: string;
  schedule: string;
  remote?: boolean;
}

interface CompanyMarketplaceStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalViews: number;
  averageRating: number;
  responseRate: number;
}

// Utilidad: normaliza distintos formatos de ubicación a string
function formatLocation(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  // Casos comunes: { city, country, address? } o anidados
  const city = loc.city || loc?.address?.city || loc?.municipality || '';
  const country = loc.country || loc?.address?.country || '';
  const addr = typeof loc.address === 'string' ? loc.address : (loc.address?.line1 || '');
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(', ') : (addr || '');
}

// === DATOS MOCK ===
const mockCompanyJobs: JobPosting[] = [
  {
    id: "1",
    title: "Cardiólogo Intervencionista",
    department: "Cardiología",
    location: "Buenos Aires, Argentina",
    specialty: "Cardiología",
    type: "full-time",
    salary: { min: 8000, max: 12000, currency: "USD" },
    postedDate: "2025-01-15",
    applications: 12,
    views: 145,
    status: "active",
    urgent: true,
    description: "Buscamos cardiólogo especializado en procedimientos intervencionistas para nuestro departamento de cardiología.",
    requirements: [
      "Especialidad en Cardiología",
      "Experiencia mínima 5 años",
      "Certificación en procedimientos intervencionistas"
    ],
    benefits: [
      "Seguro médico familiar",
      "Capacitación continua",
      "Horario flexible"
    ],
    experience: "5-10 años",
    schedule: "Tiempo completo",
    remote: false
  },
  {
    id: "2",
    title: "Oncólogo Médico",
    department: "Oncología",
    location: "Hospital Metropolitano",
    specialty: "Oncología",
    type: "full-time",
    salary: { min: 5000, max: 8000, currency: "USD" },
    postedDate: "2025-01-08",
    applications: 11,
    views: 98,
    status: "active",
    description: "Oncólogo para nuestro departamento de oncología con experiencia en tratamientos innovadores.",
    requirements: [
      "Especialidad en Oncología",
      "Experiencia en tratamientos innovadores",
      "Certificación internacional"
    ],
    benefits: [
      "Equipamiento de última generación",
      "Capacitación internacional",
      "Investigación clínica"
    ],
    experience: "3-7 años",
    schedule: "Tiempo completo",
    remote: false
  }
];

const mockStats: CompanyMarketplaceStats = {
  totalJobs: 15,
  activeJobs: 8,
  totalApplications: 89,
  totalViews: 1250,
  averageRating: 4.7,
  responseRate: 85
};

// === COMPONENTES ===
const StatCard = ({ icon: Icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string | number;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              +{trend}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const JobCard = ({ job, onEdit, onView, onPause }: {
  job: JobPosting;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onPause: (id: string) => void;
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-neutral-900">{job.title}</h3>
            {job.urgent && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                Urgente
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              job.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : job.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {job.status === 'active' ? 'Activa' : job.status === 'paused' ? 'Pausada' : 'Cerrada'}
            </span>
          </div>
          <p className="text-neutral-600 mb-2">{job.department}</p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.schedule}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {(() => {
                const s: any = (job as any)?.salary;
                const cur = s?.currency ?? '';
                const min = typeof s?.min === 'number' ? s.min : undefined;
                const max = typeof s?.max === 'number' ? s.max : undefined;
                if (min != null && max != null) {
                  return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`;
                }
                // Intentar otros formatos comunes
                const amount = typeof s?.amount === 'number' ? s.amount : undefined;
                if (amount != null) {
                  return `${cur} ${amount.toLocaleString()}`;
                }
                return 'A convenir';
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(job.id)}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(job.id)}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">{job.applications}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Aplicaciones</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Eye className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">{Number((job as any)?.views) || 0}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Visualizaciones</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">
              {(() => {
                const views = Number((job as any)?.views) || 0;
                const apps = Number((job as any)?.applications) || 0;
                return views > 0 ? Math.round((apps / views) * 100) : 0;
              })()}%
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Conversión</p>
        </div>
      </div>
    </div>
  );
};

// === COMPONENTE PRINCIPAL ===
export default function CompanyMarketplacePage() {
  const router = useRouter();
  
  // Hooks del marketplace
  const {
    company: companyProfile,
    isLoading: isProfileLoading
  } = useCompanyProfile('current-company-id');

  const jobsApi = useMarketplaceJobs() as any;
  const publishedJobs: any[] = Array.isArray(jobsApi?.jobs) ? jobsApi.jobs : [];
  const isJobsLoading: boolean = !!jobsApi?.isLoading;
  const jobsError: any = jobsApi?.error;
  const createJob = jobsApi?.createJob as any;
  const updateJob = jobsApi?.updateJob as any;
  const deleteJob = jobsApi?.deleteJob as any;

  const applicationsApi = useJobApplications('current-company-id') as any;
  const applications: any[] = Array.isArray(applicationsApi?.applications) ? applicationsApi.applications : [];
  const isApplicationsLoading: boolean = !!applicationsApi?.isLoading;

  const doctorApi = useDoctorSearch() as any;
  const availableDoctors: any[] = Array.isArray(doctorApi?.doctors) ? doctorApi.doctors : [];
  const searchDoctors = doctorApi?.searchDoctors as any;

  // Estado local
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'map' | 'analytics' | 'messages'>('map');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  // VS Code-like layout: paneles plegables
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [openOffers, setOpenOffers] = useState(true);
  const [openCounterparty, setOpenCounterparty] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openComms, setOpenComms] = useState(true);
  const [openQuickNew, setOpenQuickNew] = useState(false);
  // Onboarding / Demo guiada
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);
  const [demoMode, setDemoMode] = useState(false);

  // Datos de ejemplo para el mapa (médicos y empresas) - pueden provenir del contexto/hook en el futuro
  const mapDoctors = useMemo(() => ([
    {
      id: 'dr-martinez-001',
      name: 'Dr. Carlos Martínez',
      specialties: ['Cardiología'],
      location: { city: 'Buenos Aires', country: 'Argentina', coordinates: [-34.6037, -58.3816] as [number, number] },
      hourlyRate: 120,
      experience: 10,
      rating: 4.8,
      workArrangement: 'on_site',
      isUrgentAvailable: true,
      isOnline: true,
      verificationStatus: 'verified',
      languages: ['Español', 'Inglés'],
      responseTime: 2,
      offersDirectServices: false
    },
    {
      id: 'dr-lopez-002',
      name: 'Dra. María López',
      specialties: ['Pediatría'],
      location: { city: 'Córdoba', country: 'Argentina', coordinates: [-31.4201, -64.1888] as [number, number] },
      hourlyRate: 80,
      experience: 6,
      rating: 4.6,
      workArrangement: 'hybrid',
      isUrgentAvailable: false,
      isOnline: false,
      verificationStatus: 'pending',
      languages: ['Español'],
      responseTime: 6,
      offersDirectServices: true,
      publishedServices: [
        { id: 'srv-1', title: 'Consulta Pediátrica', price: { amount: 50, currency: 'USD', type: 'per_session' }, deliveryMethod: 'telemedicine' }
      ]
    }
  ]), []);
  const mapCompanies = useMemo(() => ([
    {
      id: 'hospital-san-vicente-001',
      name: 'Hospital San Vicente',
      industry: 'Salud y Medicina',
      location: { city: 'Buenos Aires', country: 'Argentina', coordinates: [-34.6037, -58.3816] as [number, number] },
      rating: 4.8,
      size: 'Grande',
      activeJobs: 3,
      urgentJobs: 1,
      isActivelyHiring: true,
      totalHires: 127,
      companyType: 'hospital'
    }
  ]), []);

  const doctorsForMap = (availableDoctors && (availableDoctors as any[]).length > 0 ? (availableDoctors as any[]) : (mapDoctors as any[]));
  const companiesForMap = (mapCompanies as any[]);

  // Reflow del mapa al activar la pestaña de Mapa
  useEffect(() => {
    if (activeTab === 'map') {
      // pequeño retraso para asegurar que el contenedor esté renderizado
      const t = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('map:invalidate-size'));
        }
      }, 120);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  // Atajos de teclado VS Code-like: Ctrl+B (toggle panel izquierdo), Ctrl+Shift+B (derecho)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b')) {
        if (e.shiftKey) {
          setShowRightPanel(v => !v);
        } else {
          setShowLeftPanel(v => !v);
        }
        setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 150);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Mostrar onboarding en primera visita a Hub
  useEffect(() => {
    if (activeTab === 'map') {
      const seen = typeof window !== 'undefined' ? localStorage.getItem('marketplace_onboarding_seen') : '1';
      if (!seen) {
        setShowOnboarding(true);
        setDemoMode(true);
      }
    }
  }, [activeTab]);

  const finishOnboarding = () => {
    setShowOnboarding(false);
    setDemoMode(false);
    try { localStorage.setItem('marketplace_onboarding_seen', '1'); } catch {}
    setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 120);
  };

  const nextStep = () => {
    setOnboardingStep((s) => (s < 4 ? ((s + 1) as 1|2|3|4) : s));
    setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 120);
  };
  const prevStep = () => setOnboardingStep((s) => (s > 1 ? ((s - 1) as 1|2|3|4) : s));

  const toggleLeftPanel = useCallback(() => {
    setShowLeftPanel(v => !v);
    setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 150);
  }, []);
  const toggleRightPanel = useCallback(() => {
    setShowRightPanel(v => !v);
    setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 150);
  }, []);

  // Usar datos del hook o mock data como fallback y normalizar location a string
  const rawJobs = (Array.isArray(publishedJobs) && (publishedJobs as any[]).length > 0)
    ? (publishedJobs as any[])
    : (mockCompanyJobs as any[]);
  const displayJobs: JobPosting[] = rawJobs.map((job: any) => ({
    ...job,
    location: formatLocation(job?.location)
  }));
  const stats: CompanyMarketplaceStats = {
    totalJobs: displayJobs.length,
    activeJobs: displayJobs.filter(j => j.status === 'active').length,
    totalApplications: applications?.length || mockStats.totalApplications,
  totalViews: displayJobs.reduce((sum, job: any) => sum + (Number(job?.views) || 0), 0),
    averageRating: mockStats.averageRating,
    responseRate: mockStats.responseRate
  };

  // Filtrar jobs según el término de búsqueda y filtros
  const filteredJobs: JobPosting[] = displayJobs.filter((job: JobPosting) => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCreateJob = () => {
    router.push('/marketplace/jobs/new');
  };

  const handleEditJob = (jobId: string) => {
    router.push(`/marketplace/jobs/${jobId}/edit`);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/marketplace/jobs/${jobId}`);
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      const job = displayJobs.find(j => j.id === jobId);
      if (job && updateJob) {
        await updateJob(jobId, {
          ...job,
          status: job.status === 'active' ? 'paused' : 'active'
        });
      }
    } catch (error) {
      // Error updating job status - could implement proper error handling here
    }
  };

  return (
    <div data-testid="marketplace-root" className="min-h-screen bg-vscode-editor text-vscode-foreground">
      {/* Header VS Code-like */}
      <div data-testid="marketplace-header" className="sticky top-0 z-20 border-b border-vscode-border bg-vscode-activity-bar text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 data-testid="marketplace-title" className="text-xl font-semibold">Marketplace</h1>
              <span className="hidden md:inline text-xs opacity-80">Gestión integral: ofertas, mapa, analytics y mensajes</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                data-testid="toggle-left-panel"
                onClick={toggleLeftPanel} 
                className="px-2 py-1 rounded border border-vscode-border/50 hover:bg-vscode-list-hover text-sm flex items-center gap-1"
              >
                <PanelLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Panel Izq</span>
              </button>
              <button 
                data-testid="toggle-right-panel"
                onClick={toggleRightPanel} 
                className="px-2 py-1 rounded border border-vscode-border/50 hover:bg-vscode-list-hover text-sm flex items-center gap-1"
              >
                <PanelRight className="w-4 h-4" />
                <span className="hidden sm:inline">Panel Der</span>
              </button>
              <button
                data-testid="open-messages"
                onClick={() => setShowMessaging(true)}
                className="px-2 py-1 rounded border border-vscode-border/50 hover:bg-vscode-list-hover text-sm"
                title="Abrir Mensajes"
              >
                💬
              </button>
              <button
                data-testid="create-new-job"
                onClick={() => setShowNewJobModal(true)}
                className="inline-flex items-center px-3 py-1.5 bg-vscode-activity-badge text-white text-sm font-medium rounded hover:brightness-110"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva Oferta
              </button>
            </div>
          </div>
          {/* Tabs VS Code-like */}
      <div data-testid="marketplace-tabs" className="mt-3 flex gap-2 text-sm">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'jobs', label: 'Ofertas' },
              { id: 'map', label: 'Hub' },
              { id: 'analytics', label: 'Analytics' },
            ].map(t => (
              <button
                key={t.id}
        data-testid={`tab-${t.id}`}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded border ${activeTab === t.id ? 'bg-vscode-editor text-white border-vscode-border' : 'border-transparent hover:bg-vscode-list-hover text-vscode-foreground'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <JobMarketplaceDashboard />
        )}

        {activeTab === 'jobs' && (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={Briefcase} title="Total de Ofertas" value={stats.totalJobs} trend={8} color="blue" />
              <StatCard icon={TrendingUp} title="Ofertas Activas" value={stats.activeJobs} trend={15} color="green" />
              <StatCard icon={Users} title="Aplicaciones Recibidas" value={stats.totalApplications} trend={22} color="purple" />
              <StatCard icon={Eye} title="Visualizaciones" value={stats.totalViews.toLocaleString()} trend={12} color="orange" />
            </div>

            {/* Filtros y Controles */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Búsqueda */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por título, especialidad o departamento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activas</option>
                    <option value="paused">Pausadas</option>
                    <option value="closed">Cerradas</option>
                  </select>

                  {/* Vista */}
                  <div className="flex items-center border border-neutral-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-neutral-400'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-neutral-400'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Ofertas */}
            {isJobsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-neutral-600 mt-4">Cargando ofertas...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No se encontraron ofertas</h3>
                <p className="text-neutral-600 mb-6">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera oferta laboral'}
                </p>
                <button
                  onClick={() => setShowNewJobModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Oferta
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={handleEditJob}
                    onView={handleViewJob}
                    onPause={handlePauseJob}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'map' && (
          <div className="border border-vscode-border rounded-lg overflow-hidden h-[calc(100vh-168px)] flex bg-vscode-panel">
            {/* Panel Izquierdo (plegable) */}
            {showLeftPanel && (
              <div data-testid="left-panel" className="w-[360px] border-r border-vscode-border h-full flex flex-col">
                {/* Ofertas plegable */}
                <div className="border-b border-vscode-border">
                  <button
                    data-testid="offers-section-toggle"
                    onClick={() => setOpenOffers(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-vscode-list-hover"
                  >
                    <span className="text-sm font-medium flex items-center gap-2"><Briefcase className="w-4 h-4"/> Ofertas</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openOffers ? '' : '-rotate-90'}`} />
                  </button>
                  {openOffers && (
                    <div data-testid="offers-list" className="max-h-64 overflow-y-auto px-3 pb-2">
                      {filteredJobs.length === 0 ? (
                        <p className="text-xs opacity-70 px-1 py-2">No hay ofertas</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredJobs.map(job => (
                            <div key={job.id} className="p-3 rounded border border-vscode-border/60 bg-vscode-editor hover:bg-vscode-list-hover">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-white">{job.title}</p>
                                  <p className="text-xs opacity-80">{job.department} • {job.location}</p>
                                </div>
                                <button
                                  onClick={() => handleViewJob(job.id)}
                                  className="text-xs px-2 py-1 rounded border border-vscode-border/60 hover:bg-vscode-list-hover"
                                >Ver</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Contraparte (Médicos) plegable */}
                <div className="flex-1 flex flex-col">
                  <div className="border-b border-vscode-border">
                    <button
            data-testid="professionals-section-toggle"
                      onClick={() => setOpenCounterparty(o => !o)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-vscode-list-hover"
                    >
                      <span className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4"/> Profesionales</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openCounterparty ? '' : '-rotate-90'}`} />
                    </button>
                    {openCounterparty && (
            <div data-testid="professionals-section" className="p-3">
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar médicos por nombre o ciudad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="professionals-search"
              className="w-full pl-10 pr-3 py-2 rounded border border-vscode-border bg-vscode-editor text-vscode-foreground placeholder:opacity-60 focus:outline-none focus:ring-1 focus:ring-vscode-activity-badge"
                          />
                        </div>
            <div data-testid="professionals-list" className="h-[calc(100%-56px)] overflow-y-auto -mr-2 pr-2">
                          {doctorsForMap
                            .filter((d: any) => !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.location.city.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((doc: any) => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setSelectedDoctorId(doc.id);
                                  setTimeout(() => window.dispatchEvent(new Event('map:invalidate-size')), 120);
                                }}
                                className={`w-full text-left px-3 py-2 rounded border border-transparent hover:border-vscode-border hover:bg-vscode-list-hover transition-colors ${selectedDoctorId === doc.id ? 'bg-vscode-list-hover border-vscode-border' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">👨‍⚕️</div>
                                  <div className="min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium truncate">{doc.name}</p>
                                      <span className="text-[10px] opacity-80 flex items-center gap-1">
                                        ⭐ {doc.rating}
                                      </span>
                                    </div>
                                    <p className="text-xs opacity-80 truncate">{doc.specialties?.join(', ')}</p>
                                    <p className="text-[11px] opacity-70 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {doc.location?.city}, {doc.location?.country}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mapa centrado */}
            <div data-testid="marketplace-map-container" className="flex-1 h-full">
              <MarketplaceMap
                doctors={doctorsForMap as any}
                companies={companiesForMap as any}
                enableControls
                theme="vscode"
                selectedDoctorId={selectedDoctorId}
                selectedCompanyId={selectedCompanyId}
                onDoctorSelect={(doc: any) => setSelectedDoctorId(doc.id)}
                onCompanySelect={(c: any) => setSelectedCompanyId(c.id)}
                demoMode={demoMode}
              />
            </div>

            {/* Panel Derecho (plegable) */}
            {showRightPanel && (
              <div data-testid="right-panel" className="w-[360px] border-l border-vscode-border h-full flex flex-col">
                {/* Mensajes / Nueva Oferta */}
                <div className="border-b border-vscode-border">
                  <button
                    data-testid="comms-section-toggle"
                    onClick={() => setOpenComms(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-vscode-list-hover"
                  >
                    <span className="text-sm font-medium">Mensajes y Nueva Oferta</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openComms ? '' : '-rotate-90'}`} />
                  </button>
                  {openComms && (
                    <div className="px-3 pb-3 space-y-2">
                      <button
                        onClick={() => setShowMessaging(true)}
                        className="w-full text-left px-3 py-2 rounded border border-vscode-border hover:bg-vscode-list-hover text-sm"
                      >💬 Abrir Mensajes</button>
                      <button
                        onClick={() => setShowNewJobModal(true)}
                        className="w-full text-left px-3 py-2 rounded bg-vscode-activity-badge text-white hover:brightness-110 text-sm"
                      >➕ Crear Nueva Oferta</button>
                    </div>
                  )}
                </div>
                {/* Analytics competitivo */}
                <div className="flex-1 flex flex-col">
                  <div className="border-b border-vscode-border">
                    <button
                      data-testid="analytics-section-toggle"
                      onClick={() => setOpenAnalytics(o => !o)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-vscode-list-hover"
                    >
                      <span className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Análisis Competitivo</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openAnalytics ? '' : '-rotate-90'}`} />
                    </button>
                    {openAnalytics && (
                      <div className="p-3 space-y-3 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded border border-vscode-border bg-vscode-editor">
                            <p className="text-[11px] opacity-80">Ofertas Activas</p>
                            <p className="text-lg font-semibold">{stats.activeJobs}</p>
                          </div>
                          <div className="p-2 rounded border border-vscode-border bg-vscode-editor">
                            <p className="text-[11px] opacity-80">Aplicaciones</p>
                            <p className="text-lg font-semibold">{stats.totalApplications}</p>
                          </div>
                          <div className="p-2 rounded border border-vscode-border bg-vscode-editor">
                            <p className="text-[11px] opacity-80">Visitas</p>
                            <p className="text-lg font-semibold">{stats.totalViews.toLocaleString()}</p>
                          </div>
                          <div className="p-2 rounded border border-vscode-border bg-vscode-editor">
                            <p className="text-[11px] opacity-80">Rating Promedio</p>
                            <p className="text-lg font-semibold">{stats.averageRating}</p>
                          </div>
                        </div>
                        <div className="text-[12px] opacity-80">
                          • Top especialidades en demanda: Cardiología, Pediatría, Neurología
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <MarketplaceAnalytics />
        )}
      </div>

      {/* Modales */}
      {/* Onboarding Overlay */}
      {showOnboarding && activeTab === 'map' && (
        <div data-testid="onboarding-modal" className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
          <div className="bg-vscode-panel text-vscode-foreground border border-vscode-border rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-4 border-b border-vscode-border flex items-center justify-between">
              <h3 className="font-semibold">Demo guiada: Centro de Crisis</h3>
              <button 
                data-testid="close-onboarding"
                onClick={finishOnboarding} 
                className="text-sm opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <div data-testid="onboarding-content" className="p-4 space-y-4">
              {onboardingStep === 1 && (
                <div data-testid="onboarding-step-1" className="space-y-2">
                  <h4 className="text-lg font-semibold">1) Hospital Saturado</h4>
                  <p className="text-sm opacity-90">Observa en el mapa el Hospital San Vicente en rojo/alerta. El sistema detecta saturación de guardia/UCI y sugiere derivar.</p>
                  <p className="text-sm opacity-90">Esto se basa en disponibilidad, triage y reglas clínicas. No favorece público/privado; prioriza tiempo a tratamiento.</p>
                </div>
              )}
              {onboardingStep === 2 && (
                <div data-testid="onboarding-step-2" className="space-y-2">
                  <h4 className="text-lg font-semibold">2) Ambulancia</h4>
                  <p className="text-sm opacity-90">Se asigna una ambulancia 🚑 según SLA y convenios. Quien paga la ambulancia depende del contrato (hospital, aseguradora o coordinación regional).</p>
                </div>
              )}
              {onboardingStep === 3 && (
                <div data-testid="onboarding-step-3" className="space-y-2">
                  <h4 className="text-lg font-semibold">3) Trayecto</h4>
                  <p className="text-sm opacity-90">Visualiza el trayecto punteado rojo desde el hospital origen al receptor. El sistema estima tiempos y evita colapsos en ruta.</p>
                </div>
              )}
              {onboardingStep === 4 && (
                <div data-testid="onboarding-step-4" className="space-y-2">
                  <h4 className="text-lg font-semibold">4) Hospital Receptor</h4>
                  <p className="text-sm opacity-90">Se selecciona el receptor óptimo por capacidad y especialidad. Los costos clínicos se rigen por convenios vigentes con el pagador.</p>
                  <p className="text-sm opacity-90">Como dueño del hospital, tu rol es mantener datos de disponibilidad, aceptar/rechazar derivaciones por SLA y disparar derivación cuando corresponda; el sistema orquesta, no decide por ti.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-vscode-border flex items-center justify-between">
              <div data-testid="onboarding-progress" className="text-xs opacity-80">Paso {onboardingStep} de 4</div>
              <div className="flex gap-2">
                <button 
                  data-testid="onboarding-prev"
                  onClick={prevStep} 
                  className="px-3 py-1.5 rounded border border-vscode-border hover:bg-vscode-list-hover text-sm"
                  disabled={onboardingStep === 1}
                >
                  Atrás
                </button>
                {onboardingStep < 4 ? (
                  <button 
                    data-testid="onboarding-next"
                    onClick={nextStep} 
                    className="px-3 py-1.5 rounded bg-vscode-activity-badge text-white text-sm hover:brightness-110"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button 
                    data-testid="onboarding-finish"
                    onClick={finishOnboarding} 
                    className="px-3 py-1.5 rounded bg-vscode-activity-badge text-white text-sm hover:brightness-110"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showNewJobModal && (
        <div data-testid="job-form-modal" className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Nueva Oferta</h3>
              <button 
                data-testid="close-job-form-modal"
                onClick={() => setShowNewJobModal(false)} 
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <JobForm
                onSubmit={(data) => {
                  // Submit job data to backend
                  setShowNewJobModal(false);
                }}
                onCancel={() => setShowNewJobModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showMessaging && (
        <div data-testid="messaging-overlay">
          <MessagingSystem onClose={() => setShowMessaging(false)} />
        </div>
      )}
    </div>
  );
}
