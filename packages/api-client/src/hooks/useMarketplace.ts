/**
 * 🏪 MARKETPLACE HOOKS - ALTAMEDICA
 * Hooks para gestión del marketplace médico
 */

import { useTanstackQuery as useQuery, useMutation, useQueryClient } from '@altamedica/hooks/api';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de listing en marketplace
const MarketplaceListingSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['full-time', 'part-time', 'contract', 'locum']),
  specialty: z.string(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    remote: z.boolean(),
  }),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  benefits: z.array(z.string()),
  salary: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string(),
    period: z.enum(['hourly', 'monthly', 'yearly']),
  }),
  experienceRequired: z.object({
    min: z.number(),
    max: z.number().optional(),
  }),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['draft', 'active', 'paused', 'closed', 'filled']),
  applicationsCount: z.number(),
  viewsCount: z.number(),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema de aplicación
const ApplicationSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  doctorSpecialty: z.string(),
  coverLetter: z.string(),
  resumeUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  expectedSalary: z.number().optional(),
  availableFrom: z.string(),
  status: z.enum(['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected', 'withdrawn']),
  notes: z.string().optional(),
  interviewDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type MarketplaceListing = z.infer<typeof MarketplaceListingSchema>;
type Application = z.infer<typeof ApplicationSchema>;

// Hook para listar ofertas
export function useMarketplaceListings(params?: QueryParams & {
  type?: MarketplaceListing['type'];
  specialty?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  urgency?: MarketplaceListing['urgency'];
  status?: MarketplaceListing['status'];
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['marketplace', 'listings', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<MarketplaceListing>>(
        API_ENDPOINTS.marketplace.listings,
        { params }
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para obtener una oferta
export function useMarketplaceListing(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['marketplace', 'listings', id],
    queryFn: async () => {
      return apiClient.get<MarketplaceListing>(
        API_ENDPOINTS.marketplace.getListing(id),
        { validate: MarketplaceListingSchema }
      );
    },
    enabled: !!id,
  });
}

// Hook para crear oferta
export function useCreateListing() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (listingData: Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount' | 'companyName'>) => {
      return apiClient.post<{ id: string }>(
        API_ENDPOINTS.marketplace.createListing,
        listingData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
    },
  });
}

// Hook para actualizar oferta
export function useUpdateListing() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<MarketplaceListing> & { id: string }) => {
      return apiClient.put(
        API_ENDPOINTS.marketplace.updateListing(id),
        data
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings', variables.id] });
    },
  });
}

// Hook para eliminar oferta
export function useDeleteListing() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(
        API_ENDPOINTS.marketplace.deleteListing(id)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
    },
  });
}

// Hook para aplicar a oferta
export function useApplyToListing() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      listingId, 
      ...applicationData 
    }: {
      listingId: string;
      coverLetter: string;
      resumeUrl?: string;
      portfolioUrl?: string;
      expectedSalary?: number;
      availableFrom: string;
    }) => {
      return apiClient.post<{ id: string }>(
        API_ENDPOINTS.marketplace.applyToListing(listingId),
        applicationData
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'applications'] });
    },
  });
}

// Hook para listar aplicaciones
export function useApplications(params?: QueryParams & {
  listingId?: string;
  doctorId?: string;
  status?: Application['status'];
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['marketplace', 'applications', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Application>>(
        API_ENDPOINTS.marketplace.applications,
        { params }
      );
    },
  });
}

// Hook para actualizar aplicación
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      notes,
      interviewDate 
    }: { 
      id: string;
      status?: Application['status'];
      notes?: string;
      interviewDate?: string;
    }) => {
      return apiClient.put(
        `/api/v1/marketplace/applications/${id}`,
        { status, notes, interviewDate }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'applications'] });
    },
  });
}

// Hook para estadísticas de marketplace
export function useMarketplaceStats() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['marketplace', 'stats'],
    queryFn: async () => {
      return apiClient.get<{
        totalListings: number;
        activeListings: number;
        totalApplications: number;
        averageApplicationsPerListing: number;
        topSpecialties: Array<{ specialty: string; count: number }>;
        topLocations: Array<{ location: string; count: number }>;
        conversionRate: number;
        averageTimeToFill: number; // días
      }>(
        '/api/v1/marketplace/stats'
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para recomendaciones de matching
export function useMarketplaceRecommendations(doctorId?: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['marketplace', 'recommendations', doctorId],
    queryFn: async () => {
      return apiClient.get<{
        recommendations: Array<MarketplaceListing & { 
          matchScore: number;
          matchReasons: string[];
        }>;
      }>(
        '/api/v1/marketplace/recommendations',
        { params: { doctorId } }
      );
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}