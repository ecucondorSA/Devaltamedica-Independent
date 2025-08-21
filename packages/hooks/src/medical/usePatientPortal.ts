/**
 * @fileoverview Hook para portal de pacientes
 * @module @altamedica/hooks/medical/usePatientPortal
 * @description Hook especializado para funcionalidades del portal de pacientes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// ==========================================
// TYPES
// ==========================================

interface PatientDashboard {
  patientId: string;
  upcomingAppointments: Array<{
    id: string;
    doctorName: string;
    specialty: string;
    date: Date;
    time: string;
    type: 'in_person' | 'telemedicine';
    status: 'confirmed' | 'pending' | 'cancelled';
  }>;
  recentLabResults: Array<{
    id: string;
    testName: string;
    date: Date;
    status: 'normal' | 'abnormal' | 'pending';
    doctorNotes?: string;
  }>;
  currentPrescriptions: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    startDate: Date;
    endDate?: Date;
    refillsRemaining: number;
    status: 'active' | 'expired' | 'discontinued';
  }>;
  healthMetrics: {
    lastVitals?: {
      bloodPressure: string;
      weight: number;
      temperature: number;
      date: Date;
    };
    bmi?: number;
    bloodType?: string;
  };
  notifications: Array<{
    id: string;
    type: 'appointment_reminder' | 'lab_result' | 'prescription_refill' | 'health_tip';
    title: string;
    message: string;
    date: Date;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
  }>;
  healthGoals: Array<{
    id: string;
    goal: string;
    target: string;
    progress: number; // 0-100
    deadline?: Date;
  }>;
}

interface PatientPortalPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointmentReminders: boolean;
    labResults: boolean;
    prescriptionRefills: boolean;
  };
  privacy: {
    shareDataForResearch: boolean;
    allowMarketingCommunications: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
}

interface UsePatientPortalOptions {
  patientId: string;
  enabled?: boolean;
}

interface UsePatientPortalReturn {
  dashboard: PatientDashboard | null;
  preferences: PatientPortalPreferences | null;
  isLoading: boolean;
  error: Error | null;
  bookAppointment: (doctorId: string, date: Date, time: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  requestPrescriptionRefill: (prescriptionId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  updateHealthGoal: (goalId: string, progress: number) => Promise<void>;
  updatePreferences: (preferences: Partial<PatientPortalPreferences>) => Promise<void>;
}

interface UsePatientDashboardReturn {
  dashboard: PatientDashboard | null;
  isLoading: boolean;
  error: Error | null;
  refreshDashboard: () => void;
  getHealthSummary: () => {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    recentChanges: string[];
    recommendations: string[];
  } | null;
}

// ==========================================
// QUERY KEYS
// ==========================================

const patientPortalKeys = {
  all: ['patientPortal'] as const,
  dashboards: () => [...patientPortalKeys.all, 'dashboard'] as const,
  dashboard: (patientId: string) => [...patientPortalKeys.dashboards(), patientId] as const,
  preferences: () => [...patientPortalKeys.all, 'preferences'] as const,
  preference: (patientId: string) => [...patientPortalKeys.preferences(), patientId] as const,
};

// ==========================================
// HOOKS
// ==========================================

/**
 * Hook principal del portal de pacientes
 */
export function usePatientPortal(options: UsePatientPortalOptions): UsePatientPortalReturn {
  const { patientId, enabled = true } = options;
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: patientPortalKeys.dashboard(patientId),
    queryFn: async () => {
      // TODO: Implementar llamada a API real
      const mockDashboard: PatientDashboard = {
        patientId,
        upcomingAppointments: [],
        recentLabResults: [],
        currentPrescriptions: [],
        healthMetrics: {},
        notifications: [],
        healthGoals: []
      };
      return mockDashboard;
    },
    enabled: enabled && !!patientId,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });

  const preferencesQuery = useQuery({
    queryKey: patientPortalKeys.preference(patientId),
    queryFn: async () => {
      // TODO: Implementar llamada a API real
      const mockPreferences: PatientPortalPreferences = {
        notifications: {
          email: true,
          sms: true,
          push: true,
          appointmentReminders: true,
          labResults: true,
          prescriptionRefills: true
        },
        privacy: {
          shareDataForResearch: false,
          allowMarketingCommunications: false
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          screenReader: false
        }
      };
      return mockPreferences;
    },
    enabled: enabled && !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async ({ doctorId, date, time }: { doctorId: string; date: Date; time: string }): Promise<void> => {
      // TODO: Implementar reserva de cita
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.dashboard(patientId) });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: string; reason?: string }): Promise<void> => {
      // TODO: Implementar cancelación de cita
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.dashboard(patientId) });
    },
  });

  const requestRefillMutation = useMutation({
    mutationFn: async (prescriptionId: string): Promise<void> => {
      // TODO: Implementar solicitud de recarga
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.dashboard(patientId) });
    },
  });

  const markNotificationMutation = useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      // TODO: Implementar marcar notificación como leída
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.dashboard(patientId) });
    },
  });

  const updateHealthGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: string; progress: number }): Promise<void> => {
      // TODO: Implementar actualización de meta de salud
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.dashboard(patientId) });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<PatientPortalPreferences>): Promise<void> => {
      // TODO: Implementar actualización de preferencias
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientPortalKeys.preference(patientId) });
    },
  });

  const bookAppointment = useCallback(
    async (doctorId: string, date: Date, time: string): Promise<void> => {
      return bookAppointmentMutation.mutateAsync({ doctorId, date, time });
    },
    [bookAppointmentMutation]
  );

  const cancelAppointment = useCallback(
    async (appointmentId: string, reason?: string): Promise<void> => {
      return cancelAppointmentMutation.mutateAsync({ appointmentId, reason });
    },
    [cancelAppointmentMutation]
  );

  const requestPrescriptionRefill = useCallback(
    async (prescriptionId: string): Promise<void> => {
      return requestRefillMutation.mutateAsync(prescriptionId);
    },
    [requestRefillMutation]
  );

  const markNotificationAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      return markNotificationMutation.mutateAsync(notificationId);
    },
    [markNotificationMutation]
  );

  const updateHealthGoal = useCallback(
    async (goalId: string, progress: number): Promise<void> => {
      return updateHealthGoalMutation.mutateAsync({ goalId, progress });
    },
    [updateHealthGoalMutation]
  );

  const updatePreferences = useCallback(
    async (preferences: Partial<PatientPortalPreferences>): Promise<void> => {
      return updatePreferencesMutation.mutateAsync(preferences);
    },
    [updatePreferencesMutation]
  );

  return {
    dashboard: dashboardQuery.data || null,
    preferences: preferencesQuery.data || null,
    isLoading: dashboardQuery.isLoading || preferencesQuery.isLoading,
    error: dashboardQuery.error || preferencesQuery.error,
    bookAppointment,
    cancelAppointment,
    requestPrescriptionRefill,
    markNotificationAsRead,
    updateHealthGoal,
    updatePreferences,
  };
}

/**
 * Hook especializado para dashboard de pacientes
 */
export function usePatientDashboard(patientId: string): UsePatientDashboardReturn {
  const query = useQuery({
    queryKey: patientPortalKeys.dashboard(patientId),
    queryFn: async () => {
      // TODO: Implementar llamada a API real
      const mockDashboard: PatientDashboard = {
        patientId,
        upcomingAppointments: [
          {
            id: '1',
            doctorName: 'Dr. García',
            specialty: 'Cardiología',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
            time: '10:00',
            type: 'in_person',
            status: 'confirmed'
          }
        ],
        recentLabResults: [
          {
            id: '1',
            testName: 'Hemograma completo',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
            status: 'normal',
            doctorNotes: 'Resultados dentro del rango normal'
          }
        ],
        currentPrescriptions: [
          {
            id: '1',
            medicationName: 'Lisinopril',
            dosage: '10mg',
            frequency: '1 vez al día',
            prescribedBy: 'Dr. García',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Hace 30 días
            refillsRemaining: 2,
            status: 'active'
          }
        ],
        healthMetrics: {
          lastVitals: {
            bloodPressure: '120/80',
            weight: 70,
            temperature: 36.5,
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Hace 14 días
          },
          bmi: 23.5,
          bloodType: 'O+'
        },
        notifications: [
          {
            id: '1',
            type: 'appointment_reminder',
            title: 'Recordatorio de cita',
            message: 'Tienes una cita con Dr. García el próximo viernes a las 10:00',
            date: new Date(),
            read: false,
            priority: 'medium'
          }
        ],
        healthGoals: [
          {
            id: '1',
            goal: 'Perder 5kg',
            target: '65kg',
            progress: 60,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // En 90 días
          }
        ]
      };
      return mockDashboard;
    },
    enabled: !!patientId,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });

  const getHealthSummary = useCallback(() => {
    if (!query.data) return null;

    const dashboard = query.data;
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    // Evaluar salud general basada en datos disponibles
    const recentAbnormalLabs = dashboard.recentLabResults.filter(lab => lab.status === 'abnormal');
    const activePrescriptions = dashboard.currentPrescriptions.filter(rx => rx.status === 'active');

    if (recentAbnormalLabs.length > 0) {
      overallHealth = 'fair';
    }
    if (activePrescriptions.length > 3) {
      overallHealth = 'fair';
    }
    if (dashboard.healthMetrics.bmi && (dashboard.healthMetrics.bmi > 30 || dashboard.healthMetrics.bmi < 18.5)) {
      overallHealth = 'fair';
    }

    const recentChanges: string[] = [];
    if (dashboard.recentLabResults.length > 0) {
      recentChanges.push(`Resultados de laboratorio: ${dashboard.recentLabResults[0].testName}`);
    }
    if (dashboard.healthMetrics.lastVitals) {
      recentChanges.push(`Últimos signos vitales registrados hace ${Math.floor((Date.now() - dashboard.healthMetrics.lastVitals.date.getTime()) / (1000 * 60 * 60 * 24))} días`);
    }

    const recommendations: string[] = [];
    if (!dashboard.healthMetrics.lastVitals || 
        (Date.now() - dashboard.healthMetrics.lastVitals.date.getTime()) > 30 * 24 * 60 * 60 * 1000) {
      recommendations.push('Programe una cita para control de signos vitales');
    }
    if (dashboard.healthGoals.some(goal => goal.progress < 50)) {
      recommendations.push('Revise el progreso de sus metas de salud');
    }
    if (dashboard.currentPrescriptions.some(rx => rx.refillsRemaining <= 1)) {
      recommendations.push('Solicite renovación de recetas médicas');
    }

    return {
      overallHealth,
      recentChanges,
      recommendations
    };
  }, [query.data]);

  return {
    dashboard: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refreshDashboard: query.refetch,
    getHealthSummary,
  };
}