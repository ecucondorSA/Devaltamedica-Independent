'use client';

import type { LatLngTuple } from 'leaflet';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { DoctorService, MarketplaceDoctor } from '@altamedica/types';

interface MarketplaceCompany {
  id: string;
  name: string;
  industry: string;
  location: {
    city: string;
    country: string;
    coordinates: LatLngTuple;
  };
  rating: number;
  size?: string;
  activeJobs: number;
  urgentJobs: number;
  isActivelyHiring: boolean;
  averageResponseTime: number;
  totalHires: number;
  companyType: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'other';
  jobs?: JobOffer[];

interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyId: string;
  location: string;
  specialty: string;
  type: 'job' | 'contract' | 'consultation' | 'partnership';
  salary: string;
  postedDate: string;
  applications: number;
  rating: number;
  urgent?: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  experience: string;
  schedule: string;
  remote?: boolean;
  status?: 'active' | 'paused' | 'closed';

interface MarketplaceFilters {
  specialties: string[];
  maxHourlyRate: number;
  minRating: number;
  workArrangement: string[];
  urgentOnly: boolean;
  verifiedOnly: boolean;
  location?: string;
  experience?: string;

interface MarketplaceContextType {
  // Datos
  doctors: MarketplaceDoctor[];
  companies: MarketplaceCompany[];
  
  // Estado de selección
  selectedDoctor: MarketplaceDoctor | null;
  selectedCompany: MarketplaceCompany | null;
  selectedJob: JobOffer | null;
  
  // Filtros
  filters: MarketplaceFilters;
  
  // Vista activa
  activeView: 'marketplace' | 'jobs' | 'applications' | 'analytics';
  
  // Acciones
  setSelectedDoctor: (doctor: MarketplaceDoctor | null) => void;
  setSelectedCompany: (company: MarketplaceCompany | null) => void;
  setSelectedJob: (job: JobOffer | null) => void;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  setActiveView: (view: 'marketplace' | 'jobs' | 'applications' | 'analytics') => void;
  
  // Métodos utilitarios
  getDoctorsBySpecialty: (specialty: string) => MarketplaceDoctor[];
  getJobsByCompany: (companyId: string) => JobOffer[];
  getFilteredDoctors: () => MarketplaceDoctor[];
  getFilteredCompanies: () => MarketplaceCompany[];
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

interface MarketplaceProviderProps {
  children: ReactNode;
  initialDoctors?: MarketplaceDoctor[];
  initialCompanies?: MarketplaceCompany[];
}

export function MarketplaceProvider({ 
  children, 
  initialDoctors = [], 
  initialCompanies = [] 
}: MarketplaceProviderProps) {
  // Estados
  const [doctors] = useState<MarketplaceDoctor[]>(initialDoctors);
  const [companies] = useState<MarketplaceCompany[]>(initialCompanies);
  const [selectedDoctor, setSelectedDoctor] = useState<MarketplaceDoctor | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<MarketplaceCompany | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [activeView, setActiveView] = useState<'marketplace' | 'jobs' | 'applications' | 'analytics'>('marketplace');
  
  const [filters, setFiltersState] = useState<MarketplaceFilters>({
    specialties: [],
    maxHourlyRate: 200,
    minRating: 4.0,
    workArrangement: [],
    urgentOnly: false,
    verifiedOnly: true,
  });

  // Métodos utilitarios
  const getDoctorsBySpecialty = useCallback((specialty: string) => {
    return doctors.filter(doctor => 
      doctor.specialties.some(s => 
        s.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  }, [doctors]);

  const getJobsByCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.jobs || [];
  }, [companies]);

  const getFilteredDoctors = useCallback(() => {
    return doctors.filter(doctor => {
      // Filtro por especialidades
      if (filters.specialties.length > 0) {
        const hasSpecialty = doctor.specialties.some(specialty =>
          filters.specialties.some(filter =>
            specialty.toLowerCase().includes(filter.toLowerCase())
          )
        );
        if (!hasSpecialty) return false;
      }

      // Filtro por tarifa máxima
      if (doctor.hourlyRate > filters.maxHourlyRate) return false;

      // Filtro por rating mínimo
      if (doctor.rating < filters.minRating) return false;

      // Filtro por modalidad de trabajo
      if (filters.workArrangement.length > 0) {
        if (!filters.workArrangement.includes(doctor.workArrangement)) return false;
      }

      // Filtro solo urgentes
      if (filters.urgentOnly && !doctor.isUrgentAvailable) return false;

      // Filtro solo verificados
      if (filters.verifiedOnly && doctor.verificationStatus !== 'verified') return false;

      return true;
    });
  }, [doctors, filters]);

  const getFilteredCompanies = useCallback(() => {
    return companies.filter(company => {
      // Filtro por ofertas urgentes
      if (filters.urgentOnly && company.urgentJobs === 0) return false;
      
      return true;
    });
  }, [companies, filters]);

  const setFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const contextValue: MarketplaceContextType = {
    // Datos
    doctors,
    companies,
    
    // Estado de selección
    selectedDoctor,
    selectedCompany,
    selectedJob,
    
    // Filtros
    filters,
    
    // Vista activa
    activeView,
    
    // Acciones
    setSelectedDoctor,
    setSelectedCompany,
    setSelectedJob,
    setFilters,
    setActiveView,
    
    // Métodos utilitarios
    getDoctorsBySpecialty,
    getJobsByCompany,
    getFilteredDoctors,
    getFilteredCompanies,
  };

  return (
    <MarketplaceContext.Provider value={contextValue}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}

// Exportar tipos para usar en otros componentes
export type { DoctorService, JobOffer, MarketplaceCompany, MarketplaceDoctor, MarketplaceFilters };
