/**
 * @fileoverview Hook para resultados de laboratorio con API real
 * @module @altamedica/hooks/medical
 * @description Hook consolidado para gestión de resultados de laboratorio
 */

// Tipos provistos por el shim central en packages/hooks/types/altamedica__api-client.d.ts
import type { ApiClient } from '@altamedica/api-client';
import { createApiClient, getApiClient } from '@altamedica/api-client';
// TEMP: stub de tipo (reemplazar por import real en consolidación)
// import type { LabResult } from '@altamedica/types';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LabResult = any;
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MEDICAL_QUERY_KEYS } from './queryKeys';

import { logger } from '@altamedica/shared/services/logger.service';
// Simple toast implementation for notifications
const toast = {
  success: (message: string) => logger.info('[SUCCESS]', message),
  error: (message: string) => logger.error('[ERROR]', message),
  info: (message: string) => logger.info('[INFO]', message),
  warning: (message: string) => logger.warn('[WARN]', message),
};

// Initialize API client if not already initialized
let apiClient: ApiClient;
try {
  apiClient = getApiClient();
} catch {
  apiClient = createApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });
}

// Define LabResultFilters if not available in types
export interface LabResultFilters {
  testType?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UseLabResultsOptions {
  patientId?: string;
  filters?: LabResultFilters;
  enabled?: boolean;
  pageSize?: number;
  page?: number;
  sortBy?: 'date' | 'testType' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface LabResultsResponse {
  results: LabResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Hook para obtener resultados de laboratorio con paginación y filtros
 * Migrado completamente de Firebase a API REST
 */
export function useLabResults(options: UseLabResultsOptions = {}) {
  const {
    patientId,
    filters = {},
    enabled = true,
    pageSize = 20,
    page = 1,
    sortBy = 'date',
    sortOrder = 'desc'
  } = options;

  const queryKey = [
    ...MEDICAL_QUERY_KEYS.labResults.all,
    { patientId, filters, page, pageSize, sortBy, sortOrder }
  ];

  const query = useQuery<LabResultsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
      });

      // Añadir filtros convirtiendo valores a string
      Object.entries(filters).forEach(([key, value]) => {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      if (patientId) {
        params.append('patientId', patientId);
      }

      const response = await apiClient.get(`/api/v1/lab-results?${params}`);
      return response.data;
    },
  enabled: Boolean(enabled && (patientId || Object.keys(filters).length > 0)),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    results: query.data?.results || [],
    totalCount: query.data?.totalCount || 0,
    page: query.data?.page || page,
    pageSize: query.data?.pageSize || pageSize,
    hasMore: query.data?.hasMore || false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para obtener un resultado de laboratorio específico
 */
export function useLabResult(resultId: string, options: { enabled?: boolean } = {}) {
  return useQuery<LabResult>({
    queryKey: MEDICAL_QUERY_KEYS.labResults.detail(resultId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/lab-results/${resultId}`);
      return response.data;
    },
    enabled: options.enabled !== false && !!resultId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para crear un nuevo resultado de laboratorio
 */
export function useCreateLabResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/api/v1/lab-results', data);
      return response.data;
    },
    onSuccess: (newResult) => {
      // Invalidar cache de listas
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.labResults.all 
      });
      
      // Invalidar cache del paciente
      if (newResult.patientId) {
        queryClient.invalidateQueries({ 
          queryKey: [...MEDICAL_QUERY_KEYS.patients.detail(newResult.patientId), 'lab-results']
        });
      }

      toast.success('Resultado de laboratorio creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear resultado: ${error.message}`);
    }
  });
}

/**
 * Hook para actualizar un resultado de laboratorio
 */
export function useUpdateLabResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LabResult> }) => {
      const response = await apiClient.put(`/api/v1/lab-results/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedResult, variables) => {
      // Actualizar cache específico
      queryClient.setQueryData(
        MEDICAL_QUERY_KEYS.labResults.detail(variables.id),
        updatedResult
      );

      // Invalidar listas
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.labResults.all 
      });

      toast.success('Resultado actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    }
  });
}

/**
 * Hook para marcar resultado como revisado por médico
 */
export function useMarkLabResultAsReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resultId, doctorId, notes }: { 
      resultId: string; 
      doctorId: string;
      notes?: string;
    }) => {
      const response = await apiClient.post(
        `/api/v1/lab-results/${resultId}/review`,
        { doctorId, notes }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: MEDICAL_QUERY_KEYS.labResults.detail(variables.resultId)
      });
      
      toast.success('Resultado marcado como revisado');
    }
  });
}

/**
 * Hook para descargar PDF de resultado
 */
export function useDownloadLabResultPDF(resultId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.get(
        `/api/v1/lab-results/${resultId}/pdf`,
        { responseType: 'blob' }
      );
      
      // Crear descarga automática
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab-result-${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast.error(`Error al descargar PDF: ${error.message}`);
    }
  });
}