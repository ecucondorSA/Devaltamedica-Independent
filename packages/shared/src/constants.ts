/**
 * 📌 SHARED CONSTANTS - ALTAMEDICA
 */

export const APP_NAMES = {
  patients: 'AltaMedica Patients',
  doctors: 'AltaMedica Doctors',
  companies: 'AltaMedica Companies',
  admin: 'AltaMedica Admin',
} as const;

export const API_VERSIONS = {
  v1: '/api/v1',
  v2: '/api/v2',
} as const;

export const ROLES = {
  patient: 'patient',
  doctor: 'doctor',
  company: 'company',
  admin: 'admin',
} as const;

// =====================================
// MÉTRICAS DE DASHBOARD CONSOLIDADAS
// =====================================

export interface CompanyMetrics {
  totalDoctors: number
  activeDoctors: number
  totalPatients: number
  activePatients: number
  totalAppointments: number
  completedAppointments: number
  pendingAppointments: number
  monthlyRevenue: number
  monthlyExpenses?: number
  patientSatisfaction: number
  doctorSatisfaction?: number
  telemedicineSessions: number
  emergencyCases: number
  averageWaitTime: number
  patientRetentionRate?: number
  bedOccupancyRate: number
  staffUtilization?: number
  openJobOffers?: number
  pendingApplications?: number
}

export interface ChartData {
  month: string
  revenue: number
  expenses: number
  profit: number
  patients: number
  appointments: number
}

export const MOCK_COMPANY_METRICS: CompanyMetrics = {
  totalDoctors: 48,
  activeDoctors: 42,
  totalPatients: 2847,
  activePatients: 1234,
  totalAppointments: 892,
  completedAppointments: 743,
  pendingAppointments: 149,
  monthlyRevenue: 185000,
  monthlyExpenses: 120000,
  patientSatisfaction: 4.6,
  doctorSatisfaction: 4.2,
  telemedicineSessions: 234,
  emergencyCases: 45,
  averageWaitTime: 22,
  patientRetentionRate: 87,
  bedOccupancyRate: 78,
  staffUtilization: 85,
  openJobOffers: 5,
  pendingApplications: 23
}

export const MOCK_CHART_DATA: ChartData[] = [
  { month: 'Ene', revenue: 150000, expenses: 100000, profit: 50000, patients: 2100, appointments: 750 },
  { month: 'Feb', revenue: 165000, expenses: 105000, profit: 60000, patients: 2250, appointments: 820 },
  { month: 'Mar', revenue: 170000, expenses: 110000, profit: 60000, patients: 2400, appointments: 845 },
  { month: 'Abr', revenue: 180000, expenses: 115000, profit: 65000, patients: 2600, appointments: 880 },
  { month: 'May', revenue: 185000, expenses: 120000, profit: 65000, patients: 2847, appointments: 892 }
]

export const DEPARTMENT_DATA = [
  { name: 'Cardiología', value: 25, color: '#0ea5e9' },
  { name: 'Neurología', value: 20, color: '#3b82f6' },
  { name: 'Pediatría', value: 30, color: '#8b5cf6' },
  { name: 'Emergencias', value: 15, color: '#ef4444' },
  { name: 'Otros', value: 10, color: '#6b7280' }
]