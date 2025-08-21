'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 🏥 AltaMedica API Hooks - Medical Platform Integration
 * 
 * Provides centralized API hooks for all AltaMedica medical applications
 * Features: HIPAA compliance, medical data handling, performance optimization
 * 
 * @author AltaMedica Platform Team
 * @version 2.0.0
 */

// ========================================
// 🔧 Configuration & Types
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const API_VERSION = '/api/v1';

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
  insuranceInfo?: any;
  emergencyContact?: any;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'consultation' | 'emergency' | 'follow-up' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomId: string;
  status: 'waiting' | 'active' | 'ended';
  startTime?: string;
  endTime?: string;
  participants: string[];
  recordingEnabled: boolean;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: 'healthy' | 'degraded' | 'down';
    redis: 'healthy' | 'degraded' | 'down';
    webrtc: 'healthy' | 'degraded' | 'down';
  };
  uptime: number;
  timestamp: string;
}

// ========================================
// 🌐 Core API Utilities
// ========================================

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> => {
  const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Medical-App': 'altamedica-patients',
      'X-HIPAA-Compliant': 'true',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// ========================================
// 🏥 Patients Hooks
// ========================================

export const usePatients = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['patients', page, limit],
    queryFn: () => apiRequest<{ patients: Patient[]; total: number; page: number; limit: number }>(
      `/patients?page=${page}&limit=${limit}`
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const usePatient = (patientId: string) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiRequest<Patient>(`/patients/${patientId}`),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes for individual patient data
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (patientData: Partial<Patient>) => 
      apiRequest<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData),
      }),
    onSuccess: () => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      apiRequest<Patient>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

// ========================================
// 📅 Appointments Hooks
// ========================================

export const useAppointments = (patientId?: string, filters?: { status?: string; type?: string }) => {
  const queryParams = new URLSearchParams();
  if (patientId) queryParams.append('patientId', patientId);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.type) queryParams.append('type', filters.type);

  return useQuery({
    queryKey: ['appointments', patientId, filters],
    queryFn: () => apiRequest<{ appointments: Appointment[]; total: number }>(
      `/appointments?${queryParams.toString()}`
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePatientAppointments = (patientId: string) => {
  return useAppointments(patientId);
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentData: Partial<Appointment>) =>
      apiRequest<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      apiRequest<Appointment>(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: string) =>
      apiRequest<Appointment>(`/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

// ========================================
// 🎥 Telemedicine Hooks
// ========================================

export const useTelemedicineSessions = (patientId?: string) => {
  return useQuery({
    queryKey: ['telemedicine-sessions', patientId],
    queryFn: () => {
      const url = patientId 
        ? `/telemedicine/sessions?patientId=${patientId}`
        : '/telemedicine/sessions';
      return apiRequest<{ sessions: TelemedicineSession[] }>(url);
    },
    staleTime: 30 * 1000, // 30 seconds for real-time data
  });
};

export const useCreateTelemedicineSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionData: { appointmentId: string; type?: string }) =>
      apiRequest<TelemedicineSession>('/telemedicine/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine-sessions'] });
    },
  });
};

export const useJoinTelemedicineSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest<{ roomToken: string; roomUrl: string }>(`/telemedicine/sessions/${sessionId}/join`, {
        method: 'POST',
      }),
  });
};

// ========================================
// 🏥 System Health & Connectivity
// ========================================

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiRequest<SystemHealth>('/health'),
    refetchInterval: 30 * 1000, // Check every 30 seconds
    staleTime: 10 * 1000, // 10 seconds
    retry: 1, // Don't retry health checks too much
  });
};

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastConnected(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: healthData, isError: healthError } = useSystemHealth();

  return {
    isOnline,
    lastConnected,
    apiHealthy: !healthError && healthData?.data?.status === 'healthy',
    systemStatus: healthData?.data || null,
  };
};

// ========================================
// 🔄 Composite Hooks (Combined functionality)
// ========================================

export const usePatientDashboard = (patientId: string) => {
  const patientQuery = usePatient(patientId);
  const appointmentsQuery = usePatientAppointments(patientId);
  const sessionsQuery = useTelemedicineSessions(patientId);
  const connectivityQuery = useConnectivity();

  return {
    patient: patientQuery.data?.data,
    appointments: appointmentsQuery.data?.data?.appointments || [],
    telemedicineSessions: sessionsQuery.data?.data?.sessions || [],
    connectivity: connectivityQuery,
    isLoading: patientQuery.isLoading || appointmentsQuery.isLoading || sessionsQuery.isLoading,
    error: patientQuery.error || appointmentsQuery.error || sessionsQuery.error,
  };
};

export const useMedicalOperations = () => {
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();
  const createSession = useCreateTelemedicineSession();
  const joinSession = useJoinTelemedicineSession();

  return {
    // Patient operations
    createPatient: createPatient.mutate,
    updatePatient: updatePatient.mutate,
    
    // Appointment operations
    createAppointment: createAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    cancelAppointment: cancelAppointment.mutate,
    
    // Telemedicine operations
    createTelemedicineSession: createSession.mutate,
    joinTelemedicineSession: joinSession.mutate,
    
    // Loading states
    isCreatingPatient: createPatient.isPending,
    isUpdatingPatient: updatePatient.isPending,
    isCreatingAppointment: createAppointment.isPending,
    isUpdatingAppointment: updateAppointment.isPending,
    isCancellingAppointment: cancelAppointment.isPending,
    isCreatingSession: createSession.isPending,
    isJoiningSession: joinSession.isPending,
  };
};

// ========================================
// 📊 Analytics & Performance Hooks
// ========================================

export const useMedicalMetrics = () => {
  const [metrics, setMetrics] = useState({
    apiResponseTime: 0,
    connectionQuality: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown',
    lastUpdate: new Date(),
  });

  const measureAPIPerformance = useCallback(async () => {
    const start = performance.now();
    try {
      await apiRequest('/health');
      const responseTime = performance.now() - start;
      
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: responseTime,
        connectionQuality: responseTime < 100 ? 'excellent' : 
                          responseTime < 300 ? 'good' : 'poor',
        lastUpdate: new Date(),
      }));
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        connectionQuality: 'poor',
        lastUpdate: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    measureAPIPerformance();
    const interval = setInterval(measureAPIPerformance, 60000); // Every minute
    return () => clearInterval(interval);
  }, [measureAPIPerformance]);

  return metrics;
};

// ========================================
// 🎯 Export All Hooks
// ========================================

export default {
  // Core data hooks
  usePatients,
  usePatient,
  useAppointments,
  usePatientAppointments,
  useTelemedicineSessions,
  
  // Mutation hooks
  useCreatePatient,
  useUpdatePatient,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useCreateTelemedicineSession,
  useJoinTelemedicineSession,
  
  // System hooks
  useSystemHealth,
  useConnectivity,
  
  // Composite hooks
  usePatientDashboard,
  useMedicalOperations,
  useMedicalMetrics,
};

/**
 * 🏥 Usage Examples:
 * 
 * // Basic patient data
 * const { data: patients, isLoading } = usePatients(1, 10);
 * 
 * // Individual patient with appointments
 * const dashboard = usePatientDashboard('patient-123');
 * 
 * // Create new appointment
 * const { createAppointment } = useMedicalOperations();
 * createAppointment({ patientId: '123', doctorId: '456', date: '2024-01-01' });
 * 
 * // System monitoring
 * const { isOnline, apiHealthy } = useConnectivity();
 * const metrics = useMedicalMetrics();
 */