/**
 * 💊 Hook para Medicamentos del Paciente
 * Manejo de prescripciones, recordatorios y adherencia a tratamientos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth  } from '@altamedica/auth';;
import { apiClient  } from '@altamedica/api-client';;

export interface Medication {
  id: string;
  patientId: string;
  prescriptionId: string;
  medicationName: string;
  activeIngredient: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  startDate: string;
  endDate?: string;
  duration: string;
  instructions: string;
  sideEffects?: string[];
  contraindications?: string[];
  prescribedBy: {
    doctorId: string;
    doctorName: string;
    prescriptionDate: string;
  };
  status: 'active' | 'completed' | 'discontinued' | 'paused';
  adherence: {
    takenToday: boolean;
    missedDoses: number;
    totalDoses: number;
    adherencePercentage: number;
    lastTaken?: string;
  };
  reminders: {
    enabled: boolean;
    times: string[]; // Array de horas "08:00", "14:00", etc.
    notifications: boolean;
  };
  refillInfo?: {
    refillsRemaining: number;
    lastRefillDate?: string;
    nextRefillDate?: string;
    pharmacyInfo?: {
      name: string;
      phone: string;
      address: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  date: string;
  notes?: string;
}

export interface UsePatientMedicationsReturn {
  medications: Medication[];
  activeMedications: Medication[];
  todayReminders: MedicationReminder[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  markAsTaken: (medicationId: string, reminderTime: string) => Promise<void>;
  markAsMissed: (medicationId: string, reminderTime: string) => Promise<void>;
  updateReminders: (medicationId: string, reminders: Medication['reminders']) => Promise<void>;
}

interface UsePatientMedicationsOptions {
  patientId?: string;
  includeCompleted?: boolean;
  includeDiscontinued?: boolean;
}

export function usePatientMedications(options: UsePatientMedicationsOptions = {}): UsePatientMedicationsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    patientId = user?.id,
    includeCompleted = false,
    includeDiscontinued = false
  } = options;

  // Query para obtener medicamentos
  const {
    data: medicationsData,
    isLoading: medicationsLoading,
    isError: medicationsError,
    error: medicationsErrorObj,
    refetch: refetchMedications
  } = useQuery({
    queryKey: ['patient-medications', patientId, { includeCompleted, includeDiscontinued }],
    queryFn: async () => {
      if (!user?.token || !patientId) {
        throw new Error('Usuario no autenticado o ID de paciente no disponible');
      }

      const params: Record<string, any> = {
        patientId,
        includeCompleted,
        includeDiscontinued
      };

      const response = await apiClient.get('/api/v1/medications', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        params
      });

      return response.data.medications || [];
    },
    enabled: !!user?.token && !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });

  // Query para obtener recordatorios de hoy
  const {
    data: remindersData,
    isLoading: remindersLoading,
    isError: remindersError,
    refetch: refetchReminders
  } = useQuery({
    queryKey: ['medication-reminders', patientId, new Date().toDateString()],
    queryFn: async () => {
      if (!user?.token || !patientId) {
        throw new Error('Usuario no autenticado');
      }

      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/api/v1/medications/reminders', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        params: {
          patientId,
          date: today
        }
      });

      return response.data.reminders || [];
    },
    enabled: !!user?.token && !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutos (más frecuente para recordatorios)
    retry: 2
  });

  // Mutation para marcar medicamento como tomado
  const markAsTakenMutation = useMutation({
    mutationFn: async ({ medicationId, reminderTime }: { medicationId: string, reminderTime: string }) => {
      if (!user?.token) throw new Error('Usuario no autenticado');

      await apiClient.post('/api/v1/medications/take', {
        medicationId,
        reminderTime,
        takenAt: new Date().toISOString(),
        status: 'taken'
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['patient-medications'] });
    }
  });

  // Mutation para marcar medicamento como perdido
  const markAsMissedMutation = useMutation({
    mutationFn: async ({ medicationId, reminderTime }: { medicationId: string, reminderTime: string }) => {
      if (!user?.token) throw new Error('Usuario no autenticado');

      await apiClient.post('/api/v1/medications/miss', {
        medicationId,
        reminderTime,
        missedAt: new Date().toISOString(),
        status: 'missed'
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['patient-medications'] });
    }
  });

  // Mutation para actualizar recordatorios
  const updateRemindersMutation = useMutation({
    mutationFn: async ({ medicationId, reminders }: { medicationId: string, reminders: Medication['reminders'] }) => {
      if (!user?.token) throw new Error('Usuario no autenticado');

      await apiClient.patch(`/api/v1/medications/${medicationId}/reminders`, reminders, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-medications'] });
      queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
    }
  });

  const medications = medicationsData || [];
  const activeMedications = medications.filter(med => med.status === 'active');
  const todayReminders = remindersData || [];

  const isLoading = medicationsLoading || remindersLoading;
  const isError = medicationsError || remindersError;
  const error = (medicationsErrorObj || null) as Error | null;

  return {
    medications,
    activeMedications,
    todayReminders,
    isLoading,
    isError,
    error,
    refetch: () => {
      refetchMedications();
      refetchReminders();
    },
    markAsTaken: async (medicationId: string, reminderTime: string) => {
      await markAsTakenMutation.mutateAsync({ medicationId, reminderTime });
    },
    markAsMissed: async (medicationId: string, reminderTime: string) => {
      await markAsMissedMutation.mutateAsync({ medicationId, reminderTime });
    },
    updateReminders: async (medicationId: string, reminders: Medication['reminders']) => {
      await updateRemindersMutation.mutateAsync({ medicationId, reminders });
    }
  };
}

// Hook específico para obtener una prescripción individual
export function usePrescription(prescriptionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: async () => {
      if (!user?.token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await apiClient.get(`/api/v1/prescriptions/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      return response.data;
    },
    enabled: !!user?.token && !!prescriptionId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  });
}

// Hook para obtener estadísticas de adherencia
export function useMedicationAdherence(patientId?: string) {
  const { user } = useAuth();
  const targetPatientId = patientId || user?.id;

  return useQuery({
    queryKey: ['medication-adherence', targetPatientId],
    queryFn: async () => {
      if (!user?.token || !targetPatientId) {
        throw new Error('Usuario no autenticado');
      }

      const response = await apiClient.get(`/api/v1/patients/${targetPatientId}/medication-adherence`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      return response.data;
    },
    enabled: !!user?.token && !!targetPatientId,
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2
  });
}