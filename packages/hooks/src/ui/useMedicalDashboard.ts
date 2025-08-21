import { useState, useCallback, useMemo } from 'react';

export interface PatientMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'critical' | 'warning' | 'normal' | 'good';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  patientId?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface DashboardFilter {
  status?: Array<'critical' | 'warning' | 'normal' | 'good'>;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface MedicalDashboardState {
  metrics: PatientMetric[];
  alerts: DashboardAlert[];
  selectedPatientId: string | null;
  filter: DashboardFilter;
  isLoading: boolean;
  error: string | null;
  refreshInterval: number; // milliseconds
}

export interface UseMedicalDashboardReturn extends MedicalDashboardState {
  // Actions
  setSelectedPatient: (patientId: string | null) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  updateFilter: (filter: Partial<DashboardFilter>) => void;
  refreshData: () => Promise<void>;
  setRefreshInterval: (interval: number) => void;
  
  // Computed values
  filteredMetrics: PatientMetric[];
  criticalAlerts: DashboardAlert[];
  unacknowledgedAlerts: DashboardAlert[];
  patientCount: {
    total: number;
    critical: number;
    warning: number;
    normal: number;
    good: number;
  };
}

const initialState: MedicalDashboardState = {
  metrics: [],
  alerts: [],
  selectedPatientId: null,
  filter: {},
  isLoading: false,
  error: null,
  refreshInterval: 30000, // 30 seconds default
};

// Mock data generator for development
const generateMockMetrics = (): PatientMetric[] => {
  return [
    {
      id: '1',
      name: 'Heart Rate',
      value: 72,
      unit: 'bpm',
      status: 'normal',
      trend: 'stable',
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Blood Pressure',
      value: 120,
      unit: 'mmHg',
      status: 'good',
      trend: 'down',
      lastUpdated: new Date(),
    },
    {
      id: '3',
      name: 'Oxygen Saturation',
      value: 98,
      unit: '%',
      status: 'good',
      trend: 'stable',
      lastUpdated: new Date(),
    },
  ];
};

const generateMockAlerts = (): DashboardAlert[] => {
  return [
    {
      id: '1',
      type: 'warning',
      message: 'Patient vitals require attention',
      patientId: 'patient-1',
      timestamp: new Date(),
      acknowledged: false,
    },
  ];
};

export const useMedicalDashboard = (): UseMedicalDashboardReturn => {
  const [state, setState] = useState<MedicalDashboardState>({
    ...initialState,
    metrics: generateMockMetrics(),
    alerts: generateMockAlerts(),
  });

  const setSelectedPatient = useCallback((patientId: string | null) => {
    setState(prev => ({ ...prev, selectedPatientId: patientId }));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId),
    }));
  }, []);

  const updateFilter = useCallback((newFilter: Partial<DashboardFilter>) => {
    setState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter },
    }));
  }, []);

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, fetch from API
      const newMetrics = generateMockMetrics();
      const newAlerts = generateMockAlerts();
      
      setState(prev => ({
        ...prev,
        metrics: newMetrics,
        alerts: [...prev.alerts, ...newAlerts.filter(newAlert => 
          !prev.alerts.some(existingAlert => existingAlert.id === newAlert.id)
        )],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh data',
      }));
    }
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setState(prev => ({ ...prev, refreshInterval: interval }));
  }, []);

  // Computed values
  const filteredMetrics = useMemo(() => {
    let filtered = state.metrics;
    
    if (state.filter.status && state.filter.status.length > 0) {
      filtered = filtered.filter(metric => state.filter.status!.includes(metric.status));
    }
    
    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(metric => 
        metric.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [state.metrics, state.filter]);

  const criticalAlerts = useMemo(() => {
    return state.alerts.filter(alert => alert.type === 'critical');
  }, [state.alerts]);

  const unacknowledgedAlerts = useMemo(() => {
    return state.alerts.filter(alert => !alert.acknowledged);
  }, [state.alerts]);

  const patientCount = useMemo(() => {
    const counts = state.metrics.reduce((acc, metric) => {
      acc[metric.status]++;
      acc.total++;
      return acc;
    }, {
      total: 0,
      critical: 0,
      warning: 0,
      normal: 0,
      good: 0,
    });
    
    return counts;
  }, [state.metrics]);

  return {
    ...state,
    setSelectedPatient,
    acknowledgeAlert,
    dismissAlert,
    updateFilter,
    refreshData,
    setRefreshInterval,
    filteredMetrics,
    criticalAlerts,
    unacknowledgedAlerts,
    patientCount,
  };
};