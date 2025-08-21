/**
 * 🔗 API ENDPOINTS - ALTAMEDICA
 * Definición centralizada y tipada de todos los endpoints
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/auth/me',
    verify: '/api/v1/auth/verify',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
  },

  // Patient endpoints
  patients: {
    list: '/api/v1/patients',
    get: (id: string) => `/api/v1/patients/${id}`,
    create: '/api/v1/patients',
    update: (id: string) => `/api/v1/patients/${id}`,
    delete: (id: string) => `/api/v1/patients/${id}`,
    appointments: (id: string) => `/api/v1/patients/${id}/appointments`,
    medicalHistory: (id: string) => `/api/v1/patients/${id}/medical-history`,
    prescriptions: (id: string) => `/api/v1/patients/${id}/prescriptions`,
    documents: (id: string) => `/api/v1/patients/${id}/documents`,
  },

  // Doctor endpoints
  doctors: {
    list: '/api/v1/doctors',
    get: (id: string) => `/api/v1/doctors/${id}`,
    create: '/api/v1/doctors',
    update: (id: string) => `/api/v1/doctors/${id}`,
    delete: (id: string) => `/api/v1/doctors/${id}`,
    schedule: (id: string) => `/api/v1/doctors/${id}/schedule`,
    availability: (id: string) => `/api/v1/doctors/${id}/availability`,
    patients: (id: string) => `/api/v1/doctors/${id}/patients`,
    reviews: (id: string) => `/api/v1/doctors/${id}/reviews`,
  },

  // Appointment endpoints
  appointments: {
    list: '/api/v1/appointments',
    get: (id: string) => `/api/v1/appointments/${id}`,
    create: '/api/v1/appointments',
    update: (id: string) => `/api/v1/appointments/${id}`,
    cancel: (id: string) => `/api/v1/appointments/${id}/cancel`,
    confirm: (id: string) => `/api/v1/appointments/${id}/confirm`,
    reschedule: (id: string) => `/api/v1/appointments/${id}/reschedule`,
    slots: '/api/v1/appointments/slots',
  },

  // Telemedicine endpoints
  telemedicine: {
    sessions: '/api/v1/telemedicine/sessions',
    getSession: (id: string) => `/api/v1/telemedicine/sessions/${id}`,
    createSession: '/api/v1/telemedicine/sessions',
    joinSession: (id: string) => `/api/v1/telemedicine/sessions/${id}/join`,
    endSession: (id: string) => `/api/v1/telemedicine/sessions/${id}/end`,
    iceServers: '/api/v1/telemedicine/ice-servers',
    recordings: (id: string) => `/api/v1/telemedicine/sessions/${id}/recordings`,
  },

  // Prescription endpoints
  prescriptions: {
    list: '/api/v1/prescriptions',
    get: (id: string) => `/api/v1/prescriptions/${id}`,
    create: '/api/v1/prescriptions',
    update: (id: string) => `/api/v1/prescriptions/${id}`,
    delete: (id: string) => `/api/v1/prescriptions/${id}`,
    validate: (id: string) => `/api/v1/prescriptions/${id}/validate`,
    send: (id: string) => `/api/v1/prescriptions/${id}/send`,
  },

  // Medical records endpoints
  medicalRecords: {
    list: '/api/v1/medical-records',
    get: (id: string) => `/api/v1/medical-records/${id}`,
    create: '/api/v1/medical-records',
    update: (id: string) => `/api/v1/medical-records/${id}`,
    delete: (id: string) => `/api/v1/medical-records/${id}`,
    attachments: (id: string) => `/api/v1/medical-records/${id}/attachments`,
  },

  // Company endpoints
  companies: {
    list: '/api/v1/companies',
    get: (id: string) => `/api/v1/companies/${id}`,
    create: '/api/v1/companies',
    update: (id: string) => `/api/v1/companies/${id}`,
    delete: (id: string) => `/api/v1/companies/${id}`,
    employees: (id: string) => `/api/v1/companies/${id}/employees`,
    benefits: (id: string) => `/api/v1/companies/${id}/benefits`,
    invoices: (id: string) => `/api/v1/companies/${id}/invoices`,
  },

  // Marketplace endpoints
  marketplace: {
    listings: '/api/v1/marketplace/listings',
    getListing: (id: string) => `/api/v1/marketplace/listings/${id}`,
    createListing: '/api/v1/marketplace/listings',
    updateListing: (id: string) => `/api/v1/marketplace/listings/${id}`,
    deleteListing: (id: string) => `/api/v1/marketplace/listings/${id}`,
    applications: '/api/v1/marketplace/applications',
    applyToListing: (id: string) => `/api/v1/marketplace/listings/${id}/apply`,
  },

  // Analytics endpoints
  analytics: {
    dashboard: '/api/v1/analytics/dashboard',
    reports: '/api/v1/analytics/reports',
    export: '/api/v1/analytics/export',
    metrics: '/api/v1/analytics/metrics',
  },

  // Health check endpoints
  health: {
    check: '/api/health',
    detailed: '/api/health/detailed',
    ready: '/api/health/ready',
    live: '/api/health/live',
  },

  // Upload endpoints
  uploads: {
    image: '/api/v1/uploads/image',
    document: '/api/v1/uploads/document',
    prescription: '/api/v1/uploads/prescription',
    medicalRecord: '/api/v1/uploads/medical-record',
  },

  // Notification endpoints
  notifications: {
    list: '/api/v1/notifications',
    get: (id: string) => `/api/v1/notifications/${id}`,
    markAsRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllAsRead: '/api/v1/notifications/read-all',
    preferences: '/api/v1/notifications/preferences',
  },

  // User endpoints
  users: {
    list: '/api/v1/users',
    get: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    updateProfile: '/api/v1/users/profile',
    updatePassword: '/api/v1/users/password',
    updateAvatar: '/api/v1/users/avatar',
    deactivate: (id: string) => `/api/v1/users/${id}/deactivate`,
  },

  // Search endpoints
  search: {
    global: '/api/v1/search',
    doctors: '/api/v1/search/doctors',
    patients: '/api/v1/search/patients',
    appointments: '/api/v1/search/appointments',
    prescriptions: '/api/v1/search/prescriptions',
  },

  // AI/ML endpoints
  ai: {
    diagnose: '/api/v1/ai/diagnose',
    symptoms: '/api/v1/ai/symptoms',
    drugInteractions: '/api/v1/ai/drug-interactions',
    recommendations: '/api/v1/ai/recommendations',
    chat: '/api/v1/ai/chat',
  },

  // Billing endpoints
  billing: {
    invoices: '/api/v1/billing/invoices',
    getInvoice: (id: string) => `/api/v1/billing/invoices/${id}`,
    payments: '/api/v1/billing/payments',
    createPayment: '/api/v1/billing/payments',
    paymentMethods: '/api/v1/billing/payment-methods',
    subscriptions: '/api/v1/billing/subscriptions',
  },

  // Insurance endpoints
  insurance: {
    providers: '/api/v1/insurance/providers',
    verify: '/api/v1/insurance/verify',
    claims: '/api/v1/insurance/claims',
    submitClaim: '/api/v1/insurance/claims',
    getClaimStatus: (id: string) => `/api/v1/insurance/claims/${id}/status`,
  },
} as const;

// Type helper to extract endpoint paths
export type EndpointPath = 
  | typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS][keyof typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]]
  | ReturnType<typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS][keyof typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]]>;

// Helper to build full URL with query params
export function buildUrl(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

// Type-safe endpoint builder
export function createEndpoint<T extends Record<string, any>>(
  baseEndpoint: string,
  params?: T
): string {
  let endpoint = baseEndpoint;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `:${key}`;
      if (endpoint.includes(placeholder)) {
        endpoint = endpoint.replace(placeholder, String(value));
      }
    });
  }
  
  return endpoint;
}