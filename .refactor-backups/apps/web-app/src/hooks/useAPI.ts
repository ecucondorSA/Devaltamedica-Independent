// 🚀 MIGRATION: Este archivo ha sido migrado para usar hooks centralizados
// Se mantienen solo los hooks específicos de web-app que no están en @altamedica/api-client

import { // Importar hooks centralizados
  usePatients,
  usePatient,
  useDoctors,
  useDoctor,
  useAppointments,
  useCreateAppointment,
  usePrescriptions,
  useCreatePrescription,
  useCompanies,
  useAuth as useCurrentUser,
  useQuery as useTanstackQuery,
  useMutation,
 } from '@altamedica/auth';;

// 🔗 API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// 🛡️ API Client con manejo de errores (mantenido para hooks específicos)
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // CRÍTICO: Incluir cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Manejar rate limiting
      if (response.status === 429) {
        const rateLimitData = await response.json();
        throw new Error(`Rate limit excedido. Intenta en ${rateLimitData.retryAfter} segundos.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

const apiClient = new APIClient(API_BASE_URL);

// ==========================================
// 📊 HOOKS ESPECÍFICOS DE WEB-APP
// ==========================================

// Hook para obtener estadísticas del dashboard
export function useDashboardStats() {
  return useTanstackQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiClient.get('/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });
}

// Hook para obtener métricas del día
export function useDailyMetrics() {
  return useTanstackQuery({
    queryKey: ['dailyMetrics'],
    queryFn: () => apiClient.get('/metrics'),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30000, // Auto-refresh cada 30 segundos
  });
}

// 🔐 HOOKS DE AUTENTICACIÓN ESPECÍFICOS

// Hook para login (específico de web-app por manejo de navegación)
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { idToken: string }) =>
      apiClient.post('/auth/login', credentials),
  });
}

// Hook para registro
export function useRegister() {
  return useMutation({
    mutationFn: (userData: any) =>
      apiClient.post('/auth/register', userData),
  });
}

// 📊 HOOKS PARA ANALYTICS

// Hook para obtener analytics personalizados
export function useAnalytics(period: string = 'week') {
  return useTanstackQuery({
    queryKey: ['analytics', period],
    queryFn: () => apiClient.get(`/analytics/custom-reports?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
}

// 🤖 HOOKS PARA IA (pendientes de migrar a @altamedica/medical-hooks)

// Hook para análisis de síntomas
export function useSymptomAnalysis() {
  return useMutation({
    mutationFn: (symptoms: any) =>
      apiClient.post('/ai/analyze-symptoms', symptoms),
  });
}

// Hook para soporte de diagnóstico
export function useDiagnosisSupport() {
  return useMutation({
    mutationFn: (diagnosticData: any) =>
      apiClient.post('/ai/diagnosis-support', diagnosticData),
  });
}

// 🔍 HOOK GENÉRICO PARA BÚSQUEDA

// Hook para búsqueda global
export function useSearch(query: string, type?: string) {
  return useTanstackQuery({
    queryKey: ['search', query, type],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('q', query);
      if (type) params.append('type', type);
      return apiClient.get(`/search?${params.toString()}`);
    },
    enabled: query.length > 2, // Solo buscar si hay al menos 3 caracteres
    staleTime: 5 * 60 * 1000,
  });
}

// 💡 HOOK PARA HEALTH CHECK

// Hook para verificar estado de la API
export function useHealthCheck() {
  return useTanstackQuery({
    queryKey: ['healthCheck'],
    queryFn: () => apiClient.get('/health'),
    refetchInterval: 30000, // Verificar cada 30 segundos
    staleTime: 0, // Siempre fresh
    retry: false,
  });
}

// ==========================================
// RE-EXPORTACIONES PARA COMPATIBILIDAD
// ==========================================

// Re-exportar hooks centralizados con los mismos nombres
export {
  usePatients,
  usePatient,
  useDoctors,
  useDoctor,
  useAppointments,
  useCreateAppointment,
  usePrescriptions,
  useCreatePrescription,
  useCompanies,
  useCurrentUser,
};

// Export del cliente para uso directo si es necesario
export { apiClient };