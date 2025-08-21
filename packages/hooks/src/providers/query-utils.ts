import { QueryClient } from '@tanstack/react-query';

// 🔑 QUERY KEYS CENTRALIZADOS
// Sistema unificado de keys para TanStack Query

export const QUERY_KEYS = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
    permissions: (userId: string) => ['auth', 'permissions', userId] as const,
  },

  // Patients
  patients: {
    all: ['patients'] as const,
    lists: () => ['patients', 'list'] as const,
    list: (filters?: any) => ['patients', 'list', filters] as const,
    details: () => ['patients', 'detail'] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
    appointments: (id: string) => ['patients', 'detail', id, 'appointments'] as const,
    history: (id: string) => ['patients', 'detail', id, 'history'] as const,
    prescriptions: (id: string) => ['patients', 'detail', id, 'prescriptions'] as const,
    documents: (id: string) => ['patients', 'detail', id, 'documents'] as const,
  },

  // Doctors
  doctors: {
    all: ['doctors'] as const,
    lists: () => ['doctors', 'list'] as const,
    list: (filters?: any) => ['doctors', 'list', filters] as const,
    details: () => ['doctors', 'detail'] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    availability: (id: string) => ['doctors', 'detail', id, 'availability'] as const,
    schedule: (id: string) => ['doctors', 'detail', id, 'schedule'] as const,
    patients: (id: string) => ['doctors', 'detail', id, 'patients'] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => ['appointments', 'list'] as const,
    list: (filters?: any) => ['appointments', 'list', filters] as const,
    details: () => ['appointments', 'detail'] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    slots: (doctorId: string, date: string) => ['appointments', 'slots', doctorId, date] as const,
  },

  // Prescriptions
  prescriptions: {
    all: ['prescriptions'] as const,
    lists: () => ['prescriptions', 'list'] as const,
    list: (filters?: any) => ['prescriptions', 'list', filters] as const,
    detail: (id: string) => ['prescriptions', 'detail', id] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => ['companies', 'list'] as const,
    list: (filters?: any) => ['companies', 'list', filters] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
    jobs: (id: string) => ['companies', 'detail', id, 'jobs'] as const,
  },

  // Marketplace
  marketplace: {
    all: ['marketplace'] as const,
    jobs: () => ['marketplace', 'jobs'] as const,
    job: (id: string) => ['marketplace', 'jobs', id] as const,
    applications: () => ['marketplace', 'applications'] as const,
    application: (id: string) => ['marketplace', 'applications', id] as const,
  },

  // Medical Records
  medical: {
    all: ['medical'] as const,
    records: (patientId: string) => ['medical', 'records', patientId] as const,
    record: (id: string) => ['medical', 'record', id] as const,
    vitals: (patientId: string) => ['medical', 'vitals', patientId] as const,
    labs: (patientId: string) => ['medical', 'labs', patientId] as const,
  },

  // AI/Analytics
  ai: {
    all: ['ai'] as const,
    diagnosis: (patientId: string) => ['ai', 'diagnosis', patientId] as const,
    recommendations: (patientId: string) => ['ai', 'recommendations', patientId] as const,
    riskAssessment: (patientId: string) => ['ai', 'risk', patientId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', userId, 'unread'] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    conversations: () => ['messages', 'conversations'] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
    thread: (conversationId: string) => ['messages', 'thread', conversationId] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    user: (userId: string) => ['settings', 'user', userId] as const,
    app: () => ['settings', 'app'] as const,
  },
};

// 🧹 CACHE UTILITIES
// Utilidades para invalidación y gestión de caché

export const cacheUtils = {
  // Invalidar todas las queries de un dominio
  invalidateDomain: (queryClient: QueryClient, domain: keyof typeof QUERY_KEYS) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS[domain].all });
  },

  // Invalidar queries específicas
  invalidateQueries: (queryClient: QueryClient, queryKeys: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey: queryKeys });
  },

  // Invalidar y refetch
  invalidateAndRefetch: async (queryClient: QueryClient, queryKeys: readonly unknown[]) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys });
    await queryClient.refetchQueries({ queryKey: queryKeys });
  },

  // Remover queries específicas del caché
  removeQueries: (queryClient: QueryClient, queryKeys: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey: queryKeys });
  },

  // Resetear queries a su estado inicial
  resetQueries: (queryClient: QueryClient, queryKeys: readonly unknown[]) => {
    queryClient.resetQueries({ queryKey: queryKeys });
  },

  // Cancelar queries en progreso
  cancelQueries: (queryClient: QueryClient, queryKeys: readonly unknown[]) => {
    queryClient.cancelQueries({ queryKey: queryKeys });
  },

  // Prefetch data
  prefetch: async (
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    queryFn: () => Promise<any>,
    staleTime?: number
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  },

  // Set query data optimistically
  setQueryData: <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    updater: T | ((old: T | undefined) => T)
  ) => {
    queryClient.setQueryData(queryKey, updater);
  },

  // Get query data
  getQueryData: <T>(queryClient: QueryClient, queryKey: readonly unknown[]) => {
    return queryClient.getQueryData<T>(queryKey);
  },

  // Invalidate all queries
  invalidateAll: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },

  // Clear all cache
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

// 🔄 MUTATION KEYS
// Keys para mutations organizados

export const MUTATION_KEYS = {
  // Auth mutations
  auth: {
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
    register: ['auth', 'register'] as const,
    updateProfile: ['auth', 'updateProfile'] as const,
  },

  // Patient mutations
  patients: {
    create: ['patients', 'create'] as const,
    update: ['patients', 'update'] as const,
    delete: ['patients', 'delete'] as const,
  },

  // Appointment mutations
  appointments: {
    create: ['appointments', 'create'] as const,
    update: ['appointments', 'update'] as const,
    cancel: ['appointments', 'cancel'] as const,
    reschedule: ['appointments', 'reschedule'] as const,
  },

  // Prescription mutations
  prescriptions: {
    create: ['prescriptions', 'create'] as const,
    update: ['prescriptions', 'update'] as const,
    cancel: ['prescriptions', 'cancel'] as const,
  },
};

// 🎯 Type-safe query key builder
export function createQueryKey<T extends readonly unknown[]>(...args: T): T {
  return args;
}