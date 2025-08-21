/**
 * 🏢 COMPANY HOOKS - ALTAMEDICA
 * Hooks para gestión de empresas
 */

import { useTanstackQuery as useQuery, useMutation, useQueryClient } from '@altamedica/hooks/api';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse, QueryParams } from '../types';
import { z } from 'zod';

// Schema de empresa
const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  taxId: z.string(),
  email: z.string().email(),
  phone: z.string(),
  website: z.string().optional(),
  industry: z.string(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
  contactPerson: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    position: z.string(),
  }),
  plan: z.object({
    type: z.enum(['basic', 'standard', 'premium', 'enterprise']),
    employeeLimit: z.number(),
    features: z.array(z.string()),
    price: z.number(),
  }),
  employeeCount: z.number(),
  active: z.boolean(),
  verified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Company = z.infer<typeof CompanySchema>;

// Hook para listar empresas
export function useCompanies(params?: QueryParams & {
  industry?: string;
  size?: Company['size'];
  active?: boolean;
}) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Company>>(
        API_ENDPOINTS.companies.list,
        { params }
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener una empresa
export function useCompany(id: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      return apiClient.get<Company>(
        API_ENDPOINTS.companies.get(id),
        { validate: CompanySchema }
      );
    },
    enabled: !!id,
  });
}

// Hook para crear empresa
export function useCreateCompany() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'employeeCount' | 'verified'>) => {
      return apiClient.post<{ id: string }>(
        API_ENDPOINTS.companies.create,
        companyData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// Hook para actualizar empresa
export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<Company> & { id: string }) => {
      return apiClient.put(
        API_ENDPOINTS.companies.update(id),
        data
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
    },
  });
}

// Hook para obtener empleados
export function useCompanyEmployees(companyId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', companyId, 'employees', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<{
        id: string;
        name: string;
        email: string;
        employeeId: string;
        department: string;
        position: string;
        enrollmentDate: string;
        benefitsActive: boolean;
      }>>(
        API_ENDPOINTS.companies.employees(companyId),
        { params }
      );
    },
    enabled: !!companyId,
  });
}

// Hook para agregar empleado
export function useAddCompanyEmployee(companyId: string) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (employeeData: {
      name: string;
      email: string;
      employeeId: string;
      department: string;
      position: string;
    }) => {
      return apiClient.post(
        API_ENDPOINTS.companies.employees(companyId),
        employeeData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['companies', companyId, 'employees'] 
      });
    },
  });
}

// Hook para remover empleado
export function useRemoveCompanyEmployee(companyId: string) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      return apiClient.delete(
        `${API_ENDPOINTS.companies.employees(companyId)}/${employeeId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['companies', companyId, 'employees'] 
      });
    },
  });
}

// Hook para obtener beneficios
export function useCompanyBenefits(companyId: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', companyId, 'benefits'],
    queryFn: async () => {
      return apiClient.get<{
        plan: Company['plan'];
        usage: {
          consultations: { used: number; limit: number };
          telemedicine: { used: number; limit: number };
          labTests: { used: number; limit: number };
          specialists: { used: number; limit: number };
        };
        customBenefits: Array<{
          id: string;
          name: string;
          description: string;
          limit: number;
          used: number;
        }>;
      }>(
        API_ENDPOINTS.companies.benefits(companyId)
      );
    },
    enabled: !!companyId,
  });
}

// Hook para obtener facturas
export function useCompanyInvoices(companyId: string, params?: QueryParams) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', companyId, 'invoices', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<{
        id: string;
        invoiceNumber: string;
        date: string;
        dueDate: string;
        amount: number;
        status: 'pending' | 'paid' | 'overdue' | 'cancelled';
        items: Array<{
          description: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }>;
      }>>(
        API_ENDPOINTS.companies.invoices(companyId),
        { params }
      );
    },
    enabled: !!companyId,
  });
}

// Hook para estadísticas de empresa
export function useCompanyStats(companyId: string) {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['companies', companyId, 'stats'],
    queryFn: async () => {
      return apiClient.get<{
        employees: {
          total: number;
          active: number;
          newThisMonth: number;
        };
        usage: {
          consultationsThisMonth: number;
          telemedicineSessionsThisMonth: number;
          averageConsultationsPerEmployee: number;
          topServices: Array<{ service: string; count: number }>;
        };
        costs: {
          thisMonth: number;
          lastMonth: number;
          yearToDate: number;
          averagePerEmployee: number;
        };
      }>(
        `/api/v1/companies/${companyId}/stats`
      );
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}