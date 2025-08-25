import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medications: Medication[];
  diagnosis: string;
  instructions: string;
  date: string;
  validUntil: string;
  status: 'active' | 'expired' | 'cancelled';
  refills: number;
  refillsUsed: number;
  pharmacy?: string;
  notes?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionCreate {
  patientId: string;
  medications: Medication[];
  diagnosis: string;
  instructions: string;
  validUntil: string;
  refills: number;
  pharmacy?: string;
  notes?: string;
}

export interface PrescriptionUpdate extends Partial<PrescriptionCreate> {
  id: string;
}

// Zod schemas
const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  refills: z.number().min(0).max(12),
  pharmacy: z.string().optional(),
  notes: z.string().optional(),
});

// Query keys
export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  lists: () => [...prescriptionKeys.all, 'list'] as const,
  list: (filters: string) => [...prescriptionKeys.lists(), { filters }] as const,
  details: () => [...prescriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...prescriptionKeys.details(), id] as const,
  active: () => [...prescriptionKeys.all, 'active'] as const,
  patient: (patientId: string) => [...prescriptionKeys.all, 'patient', patientId] as const,
};

interface PrescriptionFilters {
  patientId?: string;
  doctorId?: string;
  status?: 'active' | 'expired' | 'cancelled';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// API functions
async function fetchPrescriptions(filters?: PrescriptionFilters): Promise<Prescription[]> {
  const params = new URLSearchParams();
  if (filters?.patientId) params.append('patientId', filters.patientId);
  if (filters?.doctorId) params.append('doctorId', filters.doctorId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
  if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

  const response = await fetch(`${API_URL}/prescriptions?${params}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch prescriptions');
  }

  const data = await response.json();
  return data.prescriptions || [];
}

async function fetchPrescription(id: string): Promise<Prescription> {
  const response = await fetch(`${API_URL}/prescriptions/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch prescription');
  }

  const data = await response.json();
  return data.prescription;
}

async function createPrescription(data: PrescriptionCreate): Promise<Prescription> {
  const validated = prescriptionSchema.parse(data);

  const response = await fetch(`${API_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    throw new Error('Failed to create prescription');
  }

  const result = await response.json();
  return result.prescription;
}

async function updatePrescription({ id, ...data }: PrescriptionUpdate): Promise<Prescription> {
  const response = await fetch(`${API_URL}/prescriptions/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update prescription');
  }

  const result = await response.json();
  return result.prescription;
}

async function cancelPrescription(id: string): Promise<Prescription> {
  const response = await fetch(`${API_URL}/prescriptions/${id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to cancel prescription');
  }

  const result = await response.json();
  return result.prescription;
}

async function refillPrescription(id: string): Promise<Prescription> {
  const response = await fetch(`${API_URL}/prescriptions/${id}/refill`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refill prescription');
  }

  const result = await response.json();
  return result.prescription;
}

// Hooks
export function usePrescriptions(filters?: PrescriptionFilters) {
  return useQuery({
    queryKey: prescriptionKeys.list(JSON.stringify(filters || {})),
    queryFn: () => fetchPrescriptions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: prescriptionKeys.detail(id),
    queryFn: () => fetchPrescription(id),
    enabled: !!id,
  });
}

export function useActivePrescriptions() {
  return useQuery({
    queryKey: prescriptionKeys.active(),
    queryFn: () => fetchPrescriptions({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: prescriptionKeys.patient(patientId),
    queryFn: () => fetchPrescriptions({ patientId }),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrescription,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.active() });
      if (data.patientId) {
        queryClient.invalidateQueries({
          queryKey: prescriptionKeys.patient(data.patientId),
        });
      }
    },
  });
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrescription,
    onSuccess: (data) => {
      // Update the specific prescription
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.active() });
      if (data.patientId) {
        queryClient.invalidateQueries({
          queryKey: prescriptionKeys.patient(data.patientId),
        });
      }
    },
  });
}

export function useCancelPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPrescription,
    onSuccess: (data) => {
      // Update the specific prescription
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.all });
    },
  });
}

export function useRefillPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refillPrescription,
    onSuccess: (data) => {
      // Update the specific prescription
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      if (data.patientId) {
        queryClient.invalidateQueries({
          queryKey: prescriptionKeys.patient(data.patientId),
        });
      }
    },
  });
}
