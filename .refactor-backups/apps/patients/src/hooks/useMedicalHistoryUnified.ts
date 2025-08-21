/**
 * 📋 MEDICAL HISTORY UNIFIED HOOK - ALTAMEDICA
 * Hook unificado para gestión completa del historial médico del paciente
 * 
 * Consolidación de:
 * - useMedicalHistory.ts (API real del backend)
 * - useMedicalRecords.ts (IA médica y dashboard)
 * - usePatientHistory.ts (TanStack Query)
 * 
 * Funcionalidades:
 * - Consulta de registros médicos históricos con API real
 * - Filtrado por tipo, fecha, doctor y prioridad
 * - Paginación y ordenamiento
 * - Estadísticas médicas agregadas
 * - IA médica para análisis de síntomas
 * - Verificación de interacciones medicamentosas
 * - Dashboard médico consolidado
 * - Gestión de prescripciones
 * - Integración con TanStack Query para caching óptimo
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth  } from '@altamedica/auth';;
import { useState, useCallback, useMemo } from 'react';
import type { MedicalRecord } from '@altamedica/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== INTERFACES ====================

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  prescribedDate: string;
  expiryDate: string;
  refillsRemaining: number;
  verificationCode?: string;
  sideEffects?: string[];
  interactions?: string[];
}

interface SymptomAnalysis {
  id: string;
  symptoms: string[];
  possibleConditions: Array<{
    name: string;
    probability: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendations: string[];
  }>;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  recommendedActions: string[];
  confidenceScore: number;
  disclaimer: string;
  analysisDate: string;
}

interface DrugInteractionCheck {
  id: string;
  medications: string[];
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    recommendation: string;
  }>;
  safetyScore: number;
  warnings: string[];
  checkDate: string;
}

interface MedicalHistoryFilters {
  patientId?: string;
  doctorId?: string;
  type?: MedicalRecord['type'];
  dateFrom?: string;
  dateTo?: string;
  status?: MedicalRecord['status'];
  priority?: MedicalRecord['priority'];
  limit?: number;
  offset?: number;
  orderBy?: 'date' | 'priority' | 'type';
  orderDirection?: 'asc' | 'desc';
}

interface MedicalHistoryStats {
  totalRecords: number;
  recordsByType: Record<string, number>;
  lastConsultation: MedicalRecord | null;
  activePrescriptions: number;
  pendingResults: number;
  recentChanges: Array<{
    type: string;
    count: number;
    date: string;
  }>;
}

interface MedicalDashboardData {
  recentRecords: MedicalRecord[];
  activePrescriptions: Prescription[];
  upcomingAppointments: any[];
  healthMetrics: any;
  criticalAlerts: Array<{
    type: 'prescription_expiring' | 'urgent_result' | 'follow_up_needed';
    message: string;
    priority: 'high' | 'medium' | 'low';
    actionRequired: boolean;
  }>;
  lastUpdate: string;
}

interface MedicalRecordsResponse {
  data: MedicalRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: MedicalHistoryStats;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ==================== MAIN HOOK ====================

export function useMedicalHistoryUnified(options: { 
  initialFetch?: boolean;
  patientId?: string;
  filters?: MedicalHistoryFilters;
} = {}) {
  const { user, getToken } = useAuth();
  const queryClient = useQueryClient();
  const { initialFetch = false, patientId, filters = {} } = options;
  
  // Estados locales para IA y dashboard
  const [aiAnalysis, setAIAnalysis] = useState<{
    symptomAnalysis: SymptomAnalysis | null;
    drugCheck: DrugInteractionCheck | null;
    loading: boolean;
    error: string | null;
  }>({
    symptomAnalysis: null,
    drugCheck: null,
    loading: false,
    error: null,
  });

  const targetPatientId = patientId || user?.uid;

  // ==================== MEDICAL RECORDS QUERY ====================

  const {
    data: medicalData,
    isLoading: recordsLoading,
    isError: recordsError,
    error: recordsErrorObj,
    refetch: refetchRecords,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useQuery({
    queryKey: ['medical-records', targetPatientId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user || !targetPatientId) {
        throw new Error('Usuario no autenticado o ID de paciente no disponible');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const queryParams = new URLSearchParams({
        ...filters,
        limit: String(filters.limit || 10),
        offset: String(pageParam),
        orderBy: filters.orderBy || 'date',
        orderDirection: filters.orderDirection || 'desc',
      } as Record<string, string>);

      const url = `${API_BASE_URL}/api/v1/patients/${targetPatientId}/medical-records?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a estos registros médicos.');
        }
        if (response.status === 404) {
          throw new Error('No se encontraron registros médicos.');
        }
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result: MedicalRecordsResponse = await response.json();
      return result;
    },
    enabled: !!user && !!targetPatientId && initialFetch,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  // ==================== PRESCRIPTIONS QUERY ====================

  const {
    data: prescriptionsData,
    isLoading: prescriptionsLoading,
    refetch: refetchPrescriptions,
  } = useQuery({
    queryKey: ['prescriptions', targetPatientId],
    queryFn: async () => {
      if (!user || !targetPatientId) {
        throw new Error('Usuario no autenticado');
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/prescriptions?patientId=${targetPatientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al obtener prescripciones');
      }

      const result: PaginatedResponse<Prescription> = await response.json();
      return result.data;
    },
    enabled: !!user && !!targetPatientId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // ==================== DASHBOARD QUERY ====================

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['medical-dashboard', targetPatientId],
    queryFn: async () => {
      if (!user || !targetPatientId) {
        throw new Error('Usuario no autenticado');
      }

      const token = await getToken();
      
      // Cargar datos en paralelo para mejor rendimiento
      const [recordsResponse, prescriptionsResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/v1/patients/${targetPatientId}/medical-records?limit=5&orderBy=date&orderDirection=desc`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/v1/prescriptions?patientId=${targetPatientId}&status=active`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ]);

      const recentRecords = recordsResponse.status === 'fulfilled' && recordsResponse.value.ok
        ? (await recordsResponse.value.json()).data : [];
      
      const activePrescriptions = prescriptionsResponse.status === 'fulfilled' && prescriptionsResponse.value.ok
        ? (await prescriptionsResponse.value.json()).data : [];

      // Generar alertas críticas
      const criticalAlerts = [];
      const expiringSoonPrescriptions = activePrescriptions.filter((p: Prescription) => {
        const expiryDate = new Date(p.expiryDate);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return expiryDate <= sevenDaysFromNow;
      });

      if (expiringSoonPrescriptions.length > 0) {
        criticalAlerts.push({
          type: 'prescription_expiring' as const,
          message: `${expiringSoonPrescriptions.length} prescripción(es) expiran pronto`,
          priority: 'high' as const,
          actionRequired: true,
        });
      }

      const urgentRecords = recentRecords.filter((r: MedicalRecord) => 
        r.priority === 'urgent' || r.priority === 'high'
      );

      if (urgentRecords.length > 0) {
        criticalAlerts.push({
          type: 'urgent_result' as const,
          message: `${urgentRecords.length} resultado(s) urgente(s) requieren atención`,
          priority: 'high' as const,
          actionRequired: true,
        });
      }

      const dashboardResult: MedicalDashboardData = {
        recentRecords,
        activePrescriptions,
        upcomingAppointments: [], // TODO: Implement appointments
        healthMetrics: null, // TODO: Implement health metrics
        criticalAlerts,
        lastUpdate: new Date().toISOString(),
      };

      return dashboardResult;
    },
    enabled: !!user && !!targetPatientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
  });

  // ==================== AI ANALYSIS MUTATIONS ====================

  const analyzeSymptoms = useCallback(async (symptoms: string[], patientInfo?: any): Promise<SymptomAnalysis | null> => {
    if (!user) return null;

    setAIAnalysis(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/analyze-symptoms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          symptoms,
          patientInfo: patientInfo || {
            patientId: targetPatientId,
            age: user.age,
            gender: user.gender,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error en análisis de síntomas');
      }

      const analysis: SymptomAnalysis = await response.json();
      
      setAIAnalysis(prev => ({
        ...prev,
        symptomAnalysis: analysis,
        loading: false,
      }));

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en análisis de síntomas';
      setAIAnalysis(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [user, getToken, targetPatientId]);

  const checkDrugInteractions = useCallback(async (medications: string[]): Promise<DrugInteractionCheck | null> => {
    if (!user) return null;

    setAIAnalysis(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/check-drug-interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          medications,
          patientId: targetPatientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en verificación de interacciones');
      }

      const drugCheck: DrugInteractionCheck = await response.json();
      
      setAIAnalysis(prev => ({
        ...prev,
        drugCheck,
        loading: false,
      }));

      return drugCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en verificación de interacciones';
      setAIAnalysis(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [user, getToken, targetPatientId]);

  // ==================== PRESCRIPTION VERIFICATION ====================

  const verifyPrescriptionMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/prescriptions/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ verificationCode: code }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar prescripción');
      }

      const result = await response.json();
      return result.data as Prescription;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['prescriptions', targetPatientId] });
      queryClient.invalidateQueries({ queryKey: ['medical-dashboard', targetPatientId] });
    },
  });

  // ==================== COMPUTED VALUES ====================

  const records = useMemo(() => medicalData?.data || [], [medicalData]);
  const stats = useMemo(() => medicalData?.stats || null, [medicalData]);
  const pagination = useMemo(() => medicalData?.pagination || null, [medicalData]);
  
  const prescriptions = useMemo(() => prescriptionsData || [], [prescriptionsData]);
  const activePrescriptions = useMemo(() => 
    prescriptions.filter(p => p.status === 'active'), [prescriptions]
  );
  const expiringSoon = useMemo(() => 
    activePrescriptions.filter(p => {
      const expiryDate = new Date(p.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }), [activePrescriptions]
  );

  // Organizaciones adicionales para mejor UX
  const recordsByType = useMemo(() => {
    return records.reduce((acc, record) => {
      if (!acc[record.type]) acc[record.type] = [];
      acc[record.type].push(record);
      return acc;
    }, {} as Record<string, MedicalRecord[]>);
  }, [records]);

  const recentRecords = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [records]);

  // ==================== REFRESH FUNCTIONS ====================

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchRecords(),
      refetchPrescriptions(),
      refetchDashboard(),
    ]);
  }, [refetchRecords, refetchPrescriptions, refetchDashboard]);

  const clearAIAnalysis = useCallback(() => {
    setAIAnalysis({
      symptomAnalysis: null,
      drugCheck: null,
      loading: false,
      error: null,
    });
  }, []);

  // ==================== RETURN OBJECT ====================

  return {
    // Core medical history
    records,
    stats,
    pagination,
    recordsByType,
    recentRecords,
    isLoading: recordsLoading,
    isError: recordsError,
    error: recordsErrorObj,
    hasNextPage: hasNextPage || false,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchRecords,
    
    // Prescriptions
    prescriptions,
    activePrescriptions,
    expiringSoon,
    prescriptionsLoading,
    
    // AI Analysis
    symptomAnalysis: aiAnalysis.symptomAnalysis,
    drugCheck: aiAnalysis.drugCheck,
    aiLoading: aiAnalysis.loading,
    aiError: aiAnalysis.error,
    
    // Dashboard data
    dashboardData,
    dashboardLoading,
    
    // Actions
    analyzeSymptoms,
    checkDrugInteractions,
    verifyPrescription: verifyPrescriptionMutation.mutateAsync,
    refreshDashboard: refetchDashboard,
    refreshAll,
    clearAIAnalysis,
    
    // Utility flags
    hasRecords: records.length > 0,
    hasPrescriptions: prescriptions.length > 0,
    hasActivePrescriptions: activePrescriptions.length > 0,
    expiringCount: expiringSoon.length,
    criticalAlertsCount: dashboardData?.criticalAlerts?.length || 0,
  };
}

// ==================== INDIVIDUAL RECORD HOOK ====================

export function useMedicalRecord(recordId: string) {
  const { user, getToken } = useAuth();

  return useQuery({
    queryKey: ['medical-record', recordId],
    queryFn: async () => {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/medical-records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Registro médico no encontrado');
        }
        throw new Error('Error al obtener registro médico');
      }

      const result = await response.json();
      return result.data as MedicalRecord;
    },
    enabled: !!user && !!recordId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
}

// ==================== HEALTH STATS HOOK ====================

export function usePatientHealthStats(patientId?: string) {
  const { user, getToken } = useAuth();
  const targetPatientId = patientId || user?.uid;

  return useQuery({
    queryKey: ['patient-health-stats', targetPatientId],
    queryFn: async () => {
      if (!user || !targetPatientId) {
        throw new Error('Usuario no autenticado o ID de paciente no disponible');
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/patients/${targetPatientId}/health-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de salud');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!user && !!targetPatientId,
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });
}

export default useMedicalHistoryUnified;