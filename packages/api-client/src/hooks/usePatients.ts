/**
 * 🏥 PATIENT HOOKS - ALTAMEDICA
 * Hooks para gestión de pacientes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de paciente
const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
  insurance: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Patient = z.infer<typeof PatientSchema>;

// Hook para listar pacientes
export function usePatients(params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Patient>>(
        API_ENDPOINTS.patients.list,
        { params }
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para obtener un paciente
export function usePatient(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      return apiClient.get<Patient>(
        API_ENDPOINTS.patients.get(id),
        { validate: PatientSchema }
      );
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para crear paciente
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiClient.post<{ id: string }>(
        API_ENDPOINTS.patients.create,
        patientData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Hook para actualizar paciente
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<Patient> & { id: string }) => {
      return apiClient.put(
        API_ENDPOINTS.patients.update(id),
        data
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
}

// Hook para eliminar paciente
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.patients.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Hook para obtener citas de un paciente
export function usePatientAppointments(patientId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', patientId, 'appointments', params],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.patients.appointments(patientId),
        { params }
      );
    },
    enabled: !!patientId,
  });
}

// Hook para obtener historial médico
export function usePatientMedicalHistory(patientId: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', patientId, 'medical-history'],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.patients.medicalHistory(patientId)
      );
    },
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para obtener prescripciones
export function usePatientPrescriptions(patientId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', patientId, 'prescriptions', params],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.patients.prescriptions(patientId),
        { params }
      );
    },
    enabled: !!patientId,
  });
}

// Hook para obtener documentos
export function usePatientDocuments(patientId: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['patients', patientId, 'documents'],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.patients.documents(patientId)
      );
    },
    enabled: !!patientId,
  });
}

// Hook para subir documento de paciente
export function useUploadPatientDocument(patientId: string) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      type 
    }: { 
      file: File; 
      type: string;
    }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);
      
      return apiClient.post(
        API_ENDPOINTS.patients.documents(patientId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['patients', patientId, 'documents'] 
      });
    },
  });
}