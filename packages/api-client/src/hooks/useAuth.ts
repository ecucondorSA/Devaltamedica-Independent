/**
 * 🔐 AUTH HOOKS - ALTAMEDICA
 * Hooks para autenticación y gestión de usuario
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { TokenResponse } from '../types';
import { z } from 'zod';

// Schemas de validación
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['patient', 'doctor', 'company', 'admin']),
  phone: z.string().optional(),
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  verified: z.boolean(),
  createdAt: z.string(),
});

// Hook para login
export function useLogin() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (credentials: z.infer<typeof LoginSchema>) => {
      const validated = LoginSchema.parse(credentials);
      const response = await apiClient.post<TokenResponse>(
        API_ENDPOINTS.auth.login,
        validated,
        { skipAuth: true }
      );
      
      // Guardar token en el cliente
      apiClient.setAccessToken(response.accessToken);
      
      return response;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.setQueryData(['auth', 'token'], data);
    },
  });
}

// Hook para registro
export function useRegister() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (userData: z.infer<typeof RegisterSchema>) => {
      const validated = RegisterSchema.parse(userData);
      return apiClient.post<TokenResponse>(
        API_ENDPOINTS.auth.register,
        validated,
        { skipAuth: true }
      );
    },
  });
}

// Hook para logout
export function useLogout() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.auth.logout);
      apiClient.setAccessToken(null);
    },
    onSuccess: () => {
      // Limpiar todo el caché
      queryClient.clear();
    },
  });
}

// Hook para obtener usuario actual
export function useCurrentUser() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      return apiClient.get(API_ENDPOINTS.auth.me, {
        validate: UserSchema,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para refresh token
export function useRefreshToken() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await apiClient.post<TokenResponse>(
        API_ENDPOINTS.auth.refresh,
        { refreshToken },
        { skipAuth: true }
      );
      
      // Actualizar token en el cliente
      apiClient.setAccessToken(response.accessToken);
      
      return response;
    },
  });
}

// Hook para forgot password
export function useForgotPassword() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (email: string) => {
      return apiClient.post(
        API_ENDPOINTS.auth.forgotPassword,
        { email },
        { skipAuth: true }
      );
    },
  });
}

// Hook para reset password
export function useResetPassword() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      return apiClient.post(
        API_ENDPOINTS.auth.resetPassword,
        { token, password },
        { skipAuth: true }
      );
    },
  });
}

// Hook para verificar email
export function useVerifyEmail() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (token: string) => {
      return apiClient.post(
        API_ENDPOINTS.auth.verify,
        { token },
        { skipAuth: true }
      );
    },
  });
}

// Hook para actualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (profileData: Partial<z.infer<typeof UserSchema>>) => {
      return apiClient.put(
        API_ENDPOINTS.users.updateProfile,
        profileData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
}

// Hook para cambiar contraseña
export function useChangePassword() {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return apiClient.put(
        API_ENDPOINTS.users.updatePassword,
        { currentPassword, newPassword }
      );
    },
  });
}

// Hook para actualizar avatar
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      return apiClient.post(
        API_ENDPOINTS.users.updateAvatar,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
}