/**
 * 💊 PRESCRIPTION HOOKS - ALTAMEDICA
 * Hooks para gestión de prescripciones médicas
 */

import { useTanstackQuery as useQuery, useMutation, useQueryClient } from '@altamedica/hooks/api';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de medicamento
const MedicationSchema = z.object({
  name: z.string(),
  genericName: z.string().optional(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  quantity: z.number(),
  instructions: z.string().optional(),
  refills: z.number().default(0),
});

// Schema de prescripción
const PrescriptionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  medications: z.array(MedicationSchema),
  diagnosis: z.string(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'expired']),
  validUntil: z.string(),
  issuedAt: z.string(),
  dispensedAt: z.string().optional(),
  pharmacyId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Prescription = z.infer<typeof PrescriptionSchema>;
type Medication = z.infer<typeof MedicationSchema>;

// Hook para listar prescripciones
export function usePrescriptions(
  params?: QueryParams & {
    patientId?: string;
    doctorId?: string;
    status?: Prescription['status'];
  },
) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['prescriptions', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Prescription>>(API_ENDPOINTS.prescriptions.list, {
        params,
      });
    },
  });
}

// Hook para obtener una prescripción
export function usePrescription(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      return apiClient.get<Prescription>(API_ENDPOINTS.prescriptions.get(id), {
        validate: PrescriptionSchema,
      });
    },
    enabled: !!id,
  });
}

// Hook para crear prescripción
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (prescriptionData: {
      patientId: string;
      doctorId: string;
      appointmentId?: string;
      medications: Medication[];
      diagnosis: string;
      notes?: string;
      validUntil: string;
    }) => {
      return apiClient.post<{ id: string }>(API_ENDPOINTS.prescriptions.create, prescriptionData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      if (variables.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ['appointments', variables.appointmentId],
        });
      }
    },
  });
}

// Hook para actualizar prescripción
export function useUpdatePrescription() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Prescription> & { id: string }) => {
      return apiClient.put(API_ENDPOINTS.prescriptions.update(id), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.id] });
    },
  });
}

// Hook para cancelar prescripción
export function useCancelPrescription() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.put(API_ENDPOINTS.prescriptions.update(id), {
        status: 'cancelled',
        cancellationReason: reason,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.id] });
    },
  });
}

// Hook para validar prescripción
export function useValidatePrescription() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<{
        valid: boolean;
        issues?: Array<{
          type: 'interaction' | 'allergy' | 'dosage' | 'duplicate';
          severity: 'low' | 'medium' | 'high';
          message: string;
          medication?: string;
        }>;
      }>(API_ENDPOINTS.prescriptions.validate(id));
    },
  });
}

// Hook para enviar prescripción
export function useSendPrescription() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({
      id,
      method,
      destination,
    }: {
      id: string;
      method: 'email' | 'sms' | 'pharmacy';
      destination: string; // email, phone, or pharmacyId
    }) => {
      return apiClient.post(API_ENDPOINTS.prescriptions.send(id), { method, destination });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prescriptions', variables.id],
      });
    },
  });
}

// Hook para verificar interacciones medicamentosas
export function useCheckDrugInteractions() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (medications: string[]) => {
      return apiClient.post<{
        interactions: Array<{
          drug1: string;
          drug2: string;
          severity: 'minor' | 'moderate' | 'major';
          description: string;
          recommendation: string;
        }>;
      }>(API_ENDPOINTS.ai.drugInteractions, { medications });
    },
  });
}

// Hook para obtener historial de prescripciones
export function usePrescriptionHistory(patientId: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['prescriptions', 'history', patientId],
    queryFn: async () => {
      return apiClient.get<{
        current: Prescription[];
        past: Prescription[];
        statistics: {
          totalPrescriptions: number;
          activeMedications: number;
          averageComplianceRate: number;
        };
      }>(`/api/v1/patients/${patientId}/prescription-history`);
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
