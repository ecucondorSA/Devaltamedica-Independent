import { z } from 'zod';

// Schema para verificar tokens
export const VerifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Schema para registro de usuarios
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['patient', 'doctor', 'admin', 'company']),
});

// Tipos de usuario
export type UserRole = 'patient' | 'doctor' | 'admin' | 'company';

export // Removed local interface - using @altamedica/types
import { User } from '@altamedica/types';