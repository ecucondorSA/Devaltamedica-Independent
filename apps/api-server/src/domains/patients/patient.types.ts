import { z } from 'zod';

export const CreatePatientSchema = z.object({
  userId: z.string().min(1, "El ID de usuario es requerido."),
  firstName: z.string().min(2, "El nombre es requerido."),
  lastName: z.string().min(2, "El apellido es requerido."),
  email: z.string().email("El email no es válido."),
  dateOfBirth: z.string().datetime("La fecha de nacimiento no es válida."),
  phoneNumber: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phoneNumber: z.string()
  }).optional(),
  insuranceInfo: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    groupNumber: z.string().optional()
  }).optional(),
  medicalHistory: z.array(z.string()).optional()
});

export const UpdatePatientSchema = CreatePatientSchema.partial().omit({ userId: true });

import { Patient } from '@altamedica/types';

export type { Patient };

export interface PatientQueryOptions {
  doctorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  recentRegistrations: number;
  avgAge: number;
}
