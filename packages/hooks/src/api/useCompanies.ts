/**
 * 🏢 ALTAMEDICA COMPANIES - HOOKS DE GESTIÓN
 * Hooks personalizados para el manejo de estado de empresas
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// Tipos utilitarios locales para respuestas paginadas durante la migración
type Pagination = { total: number; page: number; pageSize: number; totalPages: number }
type PaginatedList<T> = { data: T[]; pagination: Pagination }

// TODO: These types need to be defined in @altamedica/types
interface Company {
  id: string;
  name: string;
  description?: string;
  // Add other company fields as needed
}

interface CompanyFilters {
  name?: string;
  // Add other filter fields as needed
}

interface CreateCompanyData {
  name: string;
  description?: string;
  // Add other creation fields as needed
}

interface UpdateCompanyData {
  name?: string;
  description?: string;
  // Add other update fields as needed
}

interface CompanyDoctor {
  id: string;
  companyId: string;
  doctorId: string;
  // Add other fields as needed
}

interface JobOffer {
  id: string;
  companyId: string;
  title: string;
  // Add other fields as needed
}

interface JobApplication {
  id: string;
  jobOfferId: string;
  doctorId: string;
  status: 'pending' | 'reviewing' | 'interview_scheduled' | 'accepted' | 'rejected' | 'withdrawn';
  // Add other fields as needed
}

interface CompanyAnalytics {
  totalEmployees: number;
  totalJobOffers: number;
  // Add other analytics fields as needed
}

// NOTE: This will need to be updated to use the migrated services
// import { companyService } from '../services/companyService'

// =====================================
// HOOKS DE EMPRESAS
// =====================================

export function useCompanies(filters?: CompanyFilters) {
  return useQuery<PaginatedList<Company>>({
    queryKey: ['companies', filters],
    queryFn: async () => ({
      data: [] as Company[],
      pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

export function useCompany(id: string) {
  return useQuery<Company>({
    queryKey: ['company', id],
  queryFn: async () => ({ id, name: 'N/A' } as Company),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCompanyData) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyData }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

// =====================================
// HOOKS DE DOCTORES EN EMPRESAS
// =====================================

export function useCompanyDoctors(companyId: string) {
  return useQuery<CompanyDoctor[]>({
    queryKey: ['company-doctors', companyId],
  queryFn: async () => ([] as CompanyDoctor[]),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddDoctorToCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ companyId, doctorData }: { companyId: string; doctorData: Partial<CompanyDoctor> }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['company-doctors', companyId] })
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    },
  })
}

export function useRemoveDoctorFromCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ companyId, doctorId }: { companyId: string; doctorId: string }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['company-doctors', companyId] })
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    },
  })
}

// =====================================
// HOOKS DE OFERTAS DE TRABAJO
// =====================================

export function useJobOffers(companyId?: string) {
  return useQuery<JobOffer[]>({
    queryKey: ['job-offers', companyId],
  queryFn: async () => ([] as JobOffer[]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useJobOffer(id: string) {
  return useQuery<JobOffer>({
    queryKey: ['job-offer', id],
  queryFn: async () => ({ id, companyId: 'N/A', title: 'N/A' } as JobOffer),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateJobOffer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<JobOffer>) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['job-offers'] })
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: ['job-offers', data.companyId] })
      }
    },
  })
}

export function useUpdateJobOffer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobOffer> }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (result, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['job-offers'] })
      queryClient.invalidateQueries({ queryKey: ['job-offer', id] })
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: ['job-offers', data.companyId] })
      }
    },
  })
}

// =====================================
// HOOKS DE APLICACIONES
// =====================================

export function useJobApplications(jobOfferId?: string) {
  return useQuery<JobApplication[]>({
    queryKey: ['job-applications', jobOfferId],
  queryFn: async () => ([] as JobApplication[]),
    enabled: !!jobOfferId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: string }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
    },
  })
}

// =====================================
// HOOKS DE ANALÍTICAS
// =====================================

export function useCompanyAnalytics(companyId: string, period: string = 'monthly') {
  return useQuery<CompanyAnalytics>({
    queryKey: ['company-analytics', companyId, period],
  queryFn: async () => ({ totalEmployees: 0, totalJobOffers: 0 } as CompanyAnalytics),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000, // 15 minutos
  })
}

// =====================================
// HOOKS DE BÚSQUEDA Y FILTROS
// =====================================

export function useCompanySearch() {
  const [filters, setFilters] = useState<CompanyFilters>({})
  const [debouncedFilters, setDebouncedFilters] = useState<CompanyFilters>({})

  // Debounce para búsquedas
  const updateFilters = useCallback((newFilters: Partial<CompanyFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Debounce de 500ms para la búsqueda
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(updatedFilters)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [filters])

  const {
    data: companies,
    isLoading,
    error,
    refetch
  } = useCompanies(debouncedFilters)

  return {
    companies,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    clearFilters: () => {
      setFilters({})
      setDebouncedFilters({})
    }
  }
}

// =====================================
// HOOKS DE UBICACIÓN Y MAPAS
// =====================================

export function useNearbyCompanies(latitude: number, longitude: number, radius: number = 50) {
  return useQuery<Company[]>({
    queryKey: ['nearby-companies', latitude, longitude, radius],
  queryFn: async () => ([] as Company[]),
    enabled: !!(latitude && longitude),
    staleTime: 10 * 60 * 1000,
  })
}

// =====================================
// HOOKS DE ESTADÍSTICAS GENERALES
// =====================================

export function useCompanyStats() {
  return useQuery<{ totalCompanies: number; totalDoctors: number; totalJobOffers: number }>({
    queryKey: ['company-stats'],
    queryFn: async () => ({
      totalCompanies: 0,
      totalDoctors: 0,
      totalJobOffers: 0
    }),
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

// =====================================
// HOOKS DE FAVORITOS
// =====================================

export function useFavoriteCompanies() {
  return useQuery({
    queryKey: ['favorite-companies'],
    queryFn: () => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useToggleFavoriteCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (companyId: string) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-companies'] })
    },
  })
}

// =====================================
// HOOKS DE AUTENTICACIÓN Y PERMISOS
// =====================================

export function useCompanyPermissions(companyId: string) {
  return useQuery<{ canEdit: boolean; canDelete: boolean; canInvite: boolean }>({
    queryKey: ['company-permissions', companyId],
  queryFn: async () => ({ canEdit: false, canDelete: false, canInvite: false }),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
  })
}

// =====================================
// HOOKS DE CARGA DE ARCHIVOS
// =====================================

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string; file: File }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    },
  })
}

// =====================================
// HOOKS DE OPTIMISTIC UPDATES
// =====================================

export function useOptimisticCompanyUpdate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyData }) => {
      // TODO: Update to use @altamedica/database services
      throw new Error('Service migration in progress')
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['company', id] })
      
      // Snapshot the previous value
      const previousCompany = queryClient.getQueryData(['company', id])
      
      // Optimistically update
      queryClient.setQueryData(['company', id], (old: any) => ({
        ...old,
        ...data,
      }))
      
      return { previousCompany }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(['company', id], context?.previousCompany)
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}

// =====================================
// HOOK PERSONALIZADO PARA PAGINACIÓN
// =====================================

export function usePaginatedCompanies(pageSize: number = 20) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CompanyFilters>({})
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['paginated-companies', page, pageSize, filters],
    queryFn: async (): Promise<PaginatedList<Company>> => ({
      data: [] as Company[],
      pagination: { total: 0, page, pageSize, totalPages: 0 }
    }),
    staleTime: 5 * 60 * 1000,
  })
  
  return {
    companies: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    page,
    setPage,
    filters,
    setFilters,
    refetch,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    hasNextPage: data?.pagination ? page < data.pagination.totalPages : false,
    hasPrevPage: data?.pagination ? page > 1 : false,
  }
}

// =====================================
// HOOK PARA GESTIÓN DE DASHBOARD
// =====================================

export function useCompanyDashboard(companyId: string) {
  const companyQuery = useCompany(companyId)
  const doctorsQuery = useCompanyDoctors(companyId)
  const jobOffersQuery = useJobOffers(companyId)
  const analyticsQuery = useCompanyAnalytics(companyId)
  
  return {
    company: companyQuery.data,
    doctors: doctorsQuery.data,
    jobOffers: jobOffersQuery.data,
    analytics: analyticsQuery.data,
    isLoading: companyQuery.isLoading || doctorsQuery.isLoading || jobOffersQuery.isLoading,
    error: companyQuery.error || doctorsQuery.error || jobOffersQuery.error,
    refetch: () => {
      companyQuery.refetch()
      doctorsQuery.refetch()
      jobOffersQuery.refetch()
      analyticsQuery.refetch()
    }
  }
}