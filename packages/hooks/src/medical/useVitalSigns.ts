/**
 * @fileoverview Hook para manejo de signos vitales
 * @module @altamedica/hooks/medical/useVitalSigns
 * @description Hook para gestión de signos vitales con monitoreo en tiempo real
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// ==========================================
// TYPES
// ==========================================

interface VitalSigns {
  id: string;
  patientId: string;
  timestamp: Date;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number; // bpm
  temperature: number; // Celsius
  respiratoryRate: number; // breaths per minute
  oxygenSaturation: number; // percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  notes?: string;
  recordedBy?: string;
}

interface VitalSignsFilters {
  patientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  type?: 'latest' | 'historical';
}

interface UseVitalSignsOptions {
  filters?: VitalSignsFilters;
  enabled?: boolean;
  refetchInterval?: number;
  realTimeMonitoring?: boolean;
}

interface UseVitalSignsReturn {
  vitalSigns: VitalSigns[];
  latestVitalSigns: VitalSigns | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  recordVitalSigns: (vitalSigns: Partial<VitalSigns>) => Promise<VitalSigns>;
  updateVitalSigns: (id: string, updates: Partial<VitalSigns>) => Promise<VitalSigns>;
  deleteVitalSigns: (id: string) => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

interface VitalSignsAnalysis {
  isNormal: boolean;
  abnormalValues: Array<{
    parameter: string;
    value: number;
    status: 'low' | 'high' | 'critical';
    normalRange: { min: number; max: number };
    recommendation: string;
  }>;
  overallStatus: 'normal' | 'warning' | 'critical';
  recommendations: string[];
}

interface UseVitalSignsMonitoringReturn {
  isMonitoring: boolean;
  currentReadings: VitalSigns | null;
  analysis: VitalSignsAnalysis | null;
  alerts: Array<{
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
  }>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
}

// ==========================================
// CONSTANTS
// ==========================================

const NORMAL_RANGES = {
  bloodPressure: {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 }
  },
  heartRate: { min: 60, max: 100 },
  temperature: { min: 36.1, max: 37.2 },
  respiratoryRate: { min: 12, max: 20 },
  oxygenSaturation: { min: 95, max: 100 }
};

// ==========================================
// QUERY KEYS
// ==========================================

const vitalSignsKeys = {
  all: ['vitalSigns'] as const,
  lists: () => [...vitalSignsKeys.all, 'list'] as const,
  list: (filters: VitalSignsFilters) => [...vitalSignsKeys.lists(), filters] as const,
  details: () => [...vitalSignsKeys.all, 'detail'] as const,
  detail: (id: string) => [...vitalSignsKeys.details(), id] as const,
  latest: (patientId: string) => [...vitalSignsKeys.all, 'latest', patientId] as const,
};

// ==========================================
// HOOKS
// ==========================================

/**
 * Hook para obtener signos vitales
 */
export function useVitalSigns(options: UseVitalSignsOptions = {}): UseVitalSignsReturn {
  const { filters = {}, enabled = true, refetchInterval, realTimeMonitoring = false } = options;
  const queryClient = useQueryClient();
  const [isMonitoring, setIsMonitoring] = useState(realTimeMonitoring);

  const query = useQuery({
    queryKey: vitalSignsKeys.list(filters),
    queryFn: async () => {
      // TODO: Implementar llamada a API real
      const mockVitalSigns: VitalSigns[] = [];
      return mockVitalSigns;
    },
    enabled,
    refetchInterval: isMonitoring ? 30000 : refetchInterval, // 30 segundos si está monitoreando
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const latestQuery = useQuery<VitalSigns | null>({
    queryKey: vitalSignsKeys.latest(filters.patientId || ''),
    queryFn: async () => {
      // TODO: Implementar llamada a API real para obtener últimos signos vitales
      return null;
    },
    enabled: !!filters.patientId,
    refetchInterval: isMonitoring ? 10000 : undefined, // 10 segundos si está monitoreando
  });

  const recordMutation = useMutation({
    mutationFn: async (vitalSigns: Partial<VitalSigns>): Promise<VitalSigns> => {
      // TODO: Implementar grabación de signos vitales
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vitalSignsKeys.lists() });
      if (filters.patientId) {
        queryClient.invalidateQueries({ queryKey: vitalSignsKeys.latest(filters.patientId) });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VitalSigns> }): Promise<VitalSigns> => {
      // TODO: Implementar actualización de signos vitales
      throw new Error('Not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vitalSignsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vitalSignsKeys.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // TODO: Implementar eliminación de signos vitales
      throw new Error('Not implemented');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: vitalSignsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vitalSignsKeys.lists() });
    },
  });

  const recordVitalSigns = useCallback(
    async (vitalSigns: Partial<VitalSigns>): Promise<VitalSigns> => {
      return recordMutation.mutateAsync(vitalSigns);
    },
    [recordMutation]
  );

  const updateVitalSigns = useCallback(
    async (id: string, updates: Partial<VitalSigns>): Promise<VitalSigns> => {
      return updateMutation.mutateAsync({ id, updates });
    },
    [updateMutation]
  );

  const deleteVitalSigns = useCallback(
    async (id: string): Promise<void> => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
  vitalSigns: (query.data as VitalSigns[] | undefined) || [],
  latestVitalSigns: latestQuery.data ?? null,
    isLoading: query.isLoading || latestQuery.isLoading,
    error: query.error || latestQuery.error,
    refetch: query.refetch,
    recordVitalSigns,
    updateVitalSigns,
    deleteVitalSigns,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  };
}

/**
 * Hook especializado para monitoreo de signos vitales
 */
export function useVitalSignsMonitoring(patientId: string): UseVitalSignsMonitoringReturn {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
  }>>([]);

  const query = useQuery<VitalSigns | null>({
    queryKey: vitalSignsKeys.latest(patientId),
    queryFn: async () => {
      // TODO: Implementar llamada a API real
      return null;
    },
    enabled: isMonitoring && !!patientId,
    refetchInterval: 5000, // 5 segundos
  });

  const analyzeVitalSigns = useCallback((vitalSigns: VitalSigns): VitalSignsAnalysis => {
    const abnormalValues: VitalSignsAnalysis['abnormalValues'] = [];
    
    // Analizar presión arterial
    if (vitalSigns.bloodPressure.systolic < NORMAL_RANGES.bloodPressure.systolic.min ||
        vitalSigns.bloodPressure.systolic > NORMAL_RANGES.bloodPressure.systolic.max) {
      abnormalValues.push({
        parameter: 'Presión sistólica',
        value: vitalSigns.bloodPressure.systolic,
        status: vitalSigns.bloodPressure.systolic < NORMAL_RANGES.bloodPressure.systolic.min ? 'low' : 'high',
        normalRange: NORMAL_RANGES.bloodPressure.systolic,
        recommendation: vitalSigns.bloodPressure.systolic > 180 ? 'Consulta inmediata' : 'Monitoreo continuo'
      });
    }

    // Analizar frecuencia cardíaca
    if (vitalSigns.heartRate < NORMAL_RANGES.heartRate.min ||
        vitalSigns.heartRate > NORMAL_RANGES.heartRate.max) {
      abnormalValues.push({
        parameter: 'Frecuencia cardíaca',
        value: vitalSigns.heartRate,
        status: vitalSigns.heartRate < NORMAL_RANGES.heartRate.min ? 'low' : 
               vitalSigns.heartRate > 120 ? 'critical' : 'high',
        normalRange: NORMAL_RANGES.heartRate,
        recommendation: vitalSigns.heartRate > 120 || vitalSigns.heartRate < 50 ? 
                       'Evaluación médica inmediata' : 'Continuar monitoreo'
      });
    }

    // Analizar temperatura
    if (vitalSigns.temperature < NORMAL_RANGES.temperature.min ||
        vitalSigns.temperature > NORMAL_RANGES.temperature.max) {
      abnormalValues.push({
        parameter: 'Temperatura',
        value: vitalSigns.temperature,
        status: vitalSigns.temperature < NORMAL_RANGES.temperature.min ? 'low' : 
               vitalSigns.temperature > 39 ? 'critical' : 'high',
        normalRange: NORMAL_RANGES.temperature,
        recommendation: vitalSigns.temperature > 39 ? 'Atención médica urgente' : 'Monitoreo y medidas de confort'
      });
    }

    // Analizar saturación de oxígeno
    if (vitalSigns.oxygenSaturation < NORMAL_RANGES.oxygenSaturation.min) {
      abnormalValues.push({
        parameter: 'Saturación de oxígeno',
        value: vitalSigns.oxygenSaturation,
        status: vitalSigns.oxygenSaturation < 90 ? 'critical' : 'low',
        normalRange: NORMAL_RANGES.oxygenSaturation,
        recommendation: vitalSigns.oxygenSaturation < 90 ? 
                       'Oxígeno suplementario inmediato' : 'Evaluación respiratoria'
      });
    }

    const overallStatus = abnormalValues.some(v => v.status === 'critical') ? 'critical' :
                         abnormalValues.length > 0 ? 'warning' : 'normal';

    return {
      isNormal: abnormalValues.length === 0,
      abnormalValues,
      overallStatus,
      recommendations: abnormalValues.map(v => v.recommendation)
    };
  }, []);

  const analysis = query.data ? analyzeVitalSigns(query.data) : null;

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Generar alertas basadas en el análisis
  const generateAlerts = useCallback((analysis: VitalSignsAnalysis) => {
    const newAlerts = analysis.abnormalValues
      .filter(v => v.status === 'critical' || v.status === 'high')
      .map(v => ({
        id: `alert_${Date.now()}_${v.parameter}`,
        message: `${v.parameter}: ${v.value} - ${v.recommendation}`,
        severity: v.status === 'critical' ? 'high' as const : 'medium' as const,
        timestamp: new Date()
      }));

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Mantener últimas 10 alertas
    }
  }, []);

  // Ejecutar análisis cuando cambien los datos
  if (analysis && analysis.overallStatus !== 'normal') {
    generateAlerts(analysis);
  }

  return {
    isMonitoring,
  currentReadings: query.data ?? null,
    analysis,
    alerts,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
  };
}