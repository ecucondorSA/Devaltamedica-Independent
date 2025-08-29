import { useAuth  } from '@altamedica/auth';
import { useCallback, useEffect, useState } from 'react';

import { logger } from '@altamedica/shared';
// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Interfaces para la API de resultados de laboratorio
interface LabResult {
  id: string;
  patientId: string;
  doctorId: string;
  testName: string;
  category: 'hematology' | 'chemistry' | 'immunology' | 'microbiology' | 'pathology' | 'other';
  testCode?: string;
  result: string;
  normalRange?: string;
  units?: string;
  status: 'pending' | 'completed' | 'verified' | 'amended' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  collectionDate: string;
  reportDate: string;
  laboratoryName?: string;
  notes?: string;
  criticalFlag: boolean;
  reference?: {
    low?: number;
    high?: number;
    text?: string;
  };
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface LabResultsResponse {
  data: LabResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats?: {
    totalResults: number;
    pendingResults: number;
    criticalResults: number;
    recentResults: number;
    resultsByCategory: Record<string, number>;
  };
}

interface SearchFilters {
  category?: 'hematology' | 'chemistry' | 'immunology' | 'microbiology' | 'pathology' | 'other';
  status?: 'pending' | 'completed' | 'verified' | 'amended' | 'cancelled';
  priority?: 'routine' | 'urgent' | 'stat';
  criticalFlag?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'reportDate' | 'collectionDate' | 'testName' | 'priority';
  orderDirection?: 'asc' | 'desc';
}

export function useLabResults(options: { initialFetch?: boolean } = {}) {
  const { user, getToken } = useAuth();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const searchLabResults = useCallback(
    async (filters: SearchFilters = {}) => {
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Obtener token de autenticación
        const token = await getToken();
        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación');
        }

        // Construir URL con parámetros de query
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });

        // Usar endpoint específico del paciente para mejor rendimiento
        const url = `${API_BASE_URL}/api/v1/patients/${user.uid}/lab-results?${queryParams.toString()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Para incluir cookies de sesión
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          }
          if (response.status === 403) {
            throw new Error('No tienes permisos para acceder a estos resultados de laboratorio.');
          }
          if (response.status === 404) {
            throw new Error('No se encontraron resultados de laboratorio.');
          }
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const result: LabResultsResponse = await response.json();

        if (result.data) {
          setLabResults(result.data);
          setPagination(result.pagination);
          setStats(result.stats);
        } else {
          throw new Error('Respuesta de API inválida');
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : 'Error al cargar resultados de laboratorio';
        setError(errorMessage);
        logger.error('Error fetching lab results:', e);
      } finally {
        setLoading(false);
      }
    },
    [user, getToken],
  );

  // Fetch inicial si se requiere
  useEffect(() => {
    if (options.initialFetch && user) {
      searchLabResults();
    }
  }, [options.initialFetch, user, searchLabResults]);

  return {
    labResults,
    loading,
    error,
    pagination,
    stats,
    searchLabResults,
    // Funciones adicionales para mejor UX
    refresh: () => searchLabResults(),
    hasResults: labResults.length > 0,
    getCriticalResults: () => labResults.filter((result) => result.criticalFlag),
    getPendingResults: () => labResults.filter((result) => result.status === 'pending'),
  };
}

export function useLabResult(id: string) {
  const { user, getToken } = useAuth();
  const [labResult, setLabResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLabResult = useCallback(async () => {
    if (!user || !id) {
      setError('Usuario no autenticado o ID de resultado no válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener token de autenticación
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const url = `${API_BASE_URL}/api/v1/lab-results/${id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a este resultado de laboratorio.');
        }
        if (response.status === 404) {
          throw new Error('Resultado de laboratorio no encontrado.');
        }
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        setLabResult(result.data);
      } else {
        throw new Error('Respuesta de API inválida');
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'Error al cargar resultado de laboratorio';
      setError(errorMessage);
      logger.error('Error fetching lab result:', e);
    } finally {
      setLoading(false);
    }
  }, [id, user, getToken]);

  // Fetch inicial
  useEffect(() => {
    if (id && user) {
      fetchLabResult();
    }
  }, [id, user, fetchLabResult]);

  return {
    labResult,
    loading,
    error,
    refresh: fetchLabResult,
    hasResult: labResult !== null,
    isCritical: labResult?.criticalFlag || false,
    isPending: labResult?.status === 'pending',
  };
}
