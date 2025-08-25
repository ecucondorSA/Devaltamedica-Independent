/**
 * 👨‍⚕️ DOCTOR HOOKS - ALTAMEDICA
 * Hooks para gestión de doctores
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de doctor
const DoctorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  specialty: z.string(),
  licenseNumber: z.string(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number(),
  })),
  experience: z.number(),
  languages: z.array(z.string()),
  consultationFee: z.number(),
  availableHours: z.object({
    monday: z.array(z.string()),
    tuesday: z.array(z.string()),
    wednesday: z.array(z.string()),
    thursday: z.array(z.string()),
    friday: z.array(z.string()),
    saturday: z.array(z.string()),
    sunday: z.array(z.string()),
  }),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  verified: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Doctor = z.infer<typeof DoctorSchema>;

// Hook para listar doctores
export function useDoctors(params?: QueryParams & { specialty?: string }) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Doctor>>(
        API_ENDPOINTS.doctors.list,
        { params }
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener un doctor
export function useDoctor(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', id],
    queryFn: async () => {
      return apiClient.get<Doctor>(
        API_ENDPOINTS.doctors.get(id),
        { validate: DoctorSchema }
      );
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para crear doctor
export function useCreateDoctor() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>) => {
      return apiClient.post<{ id: string }>(
        API_ENDPOINTS.doctors.create,
        doctorData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

// Hook para actualizar doctor
export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<Doctor> & { id: string }) => {
      return apiClient.put(
        API_ENDPOINTS.doctors.update(id),
        data
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', variables.id] });
    },
  });
}

// Hook para obtener horarios disponibles
export function useDoctorAvailability(doctorId: string, date?: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', doctorId, 'availability', date],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.doctors.availability(doctorId),
        { params: { date } }
      );
    },
    enabled: !!doctorId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para obtener el horario del doctor
export function useDoctorSchedule(doctorId: string, params?: { 
  startDate?: string; 
  endDate?: string;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', doctorId, 'schedule', params],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.doctors.schedule(doctorId),
        { params }
      );
    },
    enabled: !!doctorId,
  });
}

// Hook para actualizar horario del doctor
export function useUpdateDoctorSchedule(doctorId: string) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (schedule: Doctor['availableHours']) => {
      return apiClient.put(
        API_ENDPOINTS.doctors.schedule(doctorId),
        { schedule }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['doctors', doctorId, 'schedule'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['doctors', doctorId, 'availability'] 
      });
    },
  });
}

// Hook para obtener pacientes del doctor
export function useDoctorPatients(doctorId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', doctorId, 'patients', params],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.doctors.patients(doctorId),
        { params }
      );
    },
    enabled: !!doctorId,
  });
}

// Hook para obtener reseñas del doctor
export function useDoctorReviews(doctorId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['doctors', doctorId, 'reviews', params],
    queryFn: async () => {
      return apiClient.get(
        API_ENDPOINTS.doctors.reviews(doctorId),
        { params }
      );
    },
    enabled: !!doctorId,
  });
}

// Hook para agregar reseña a doctor
export function useAddDoctorReview(doctorId: string) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (review: {
      rating: number;
      comment: string;
      appointmentId?: string;
    }) => {
      return apiClient.post(
        API_ENDPOINTS.doctors.reviews(doctorId),
        review
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['doctors', doctorId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['doctors', doctorId, 'reviews'] 
      });
    },
  });
}