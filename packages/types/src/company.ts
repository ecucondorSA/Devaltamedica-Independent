/**
 * 🏢 COMPANY TYPES - ALTAMEDICA PLATFORM
 * Tipos y esquemas para entidades médicas empresariales
 * Migrado desde apps/companies/src/types/index.ts para reutilización
 */

import { z } from 'zod';

// =====================================
// TIPOS BÁSICOS
// =====================================

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  fax?: string;
}

export interface BusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  openTime: string; // "08:00"
  closeTime: string; // "17:00"
  isOpen: boolean;
}

// =====================================
// EMPRESA (COMPANY)
// =====================================

export type CompanyType = 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'insurance' | 'medical_center';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  size: CompanySize;
  status: CompanyStatus;
  
  // Información básica
  description: string;
  founded: Date;
  logo?: string;
  website?: string;
  
  // Ubicación y contacto
  address: Address;
  contact: ContactInfo;
  businessHours: BusinessHours[];
  
  // Datos médicos
  specialties: string[];
  services: string[];
  certifications: string[];
  licenseNumber: string;
  accreditations: string[];
  
  // Recursos humanos
  totalEmployees: number;
  totalDoctors: number;
  totalNurses: number;
  totalStaff: number;
  
  // Estadísticas
  rating: number;
  reviewCount: number;
  patientsServed: number;
  yearsInOperation: number;
  
  // Configuración
  allowsJobApplications: boolean;
  allowsPatientRegistration: boolean;
  acceptsInsurance: string[];
  emergencyServices: boolean;
  telemedicineAvailable: boolean;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

// =====================================
// DOCTOR EN EMPRESA
// =====================================

export type DoctorStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'consultant';

export interface CompanyDoctor {
  id: string;
  userId: string; // Referencia al usuario doctor
  companyId: string;
  
  // Información personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  
  // Información profesional
  specialization: string;
  subSpecialties: string[];
  licenseNumber: string;
  medicalSchool: string;
  residency: string;
  boardCertifications: string[];
  
  // Empleo en la empresa
  employmentType: EmploymentType;
  status: DoctorStatus;
  position: string;
  department: string;
  hireDate: Date;
  terminationDate?: Date;
  
  // Estadísticas
  patientsCount: number;
  appointmentsCompleted: number;
  rating: number;
  reviewCount: number;
  
  // Configuración
  availability: BusinessHours[];
  consultationFee: number;
  acceptsNewPatients: boolean;
  languages: string[];
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

// =====================================
// OFERTAS DE TRABAJO
// =====================================

export type JobType = 'full_time' | 'part_time' | 'contractor' | 'internship' | 'temporary';
export type JobStatus = 'active' | 'paused' | 'closed' | 'draft';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'expert';

export interface JobOffer {
  id: string;
  companyId: string;
  
  // Información básica del trabajo
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  
  // Detalles del puesto
  department: string;
  position: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  specialization: string;
  
  // Compensación
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  salaryPeriod: 'hourly' | 'monthly' | 'yearly';
  
  // Ubicación
  isRemote: boolean;
  location?: Address;
  
  // Estado y fechas
  status: JobStatus;
  postedDate: Date;
  applicationDeadline?: Date;
  startDate?: Date;
  
  // Estadísticas
  applicationsCount: number;
  viewsCount: number;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

// =====================================
// APLICACIONES DE TRABAJO
// =====================================

export type ApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: string;
  jobOfferId: string;
  applicantId: string;
  companyId: string;
  
  // Información del aplicante
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Documentos
  resumeUrl: string;
  coverLetter?: string;
  portfolioUrl?: string;
  certificatesUrls: string[];
  
  // Estado y proceso
  status: ApplicationStatus;
  applicationDate: Date;
  lastUpdated: Date;
  
  // Notas internas
  internalNotes?: string;
  interviewScheduled?: Date;
  salaryExpectation?: number;
  
  // Evaluación
  rating?: number;
  reviewNotes?: string;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

// =====================================
// REPORTES Y ANÁLISIS
// =====================================

export interface CompanyAnalytics {
  id: string;
  companyId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Métricas de personal
  totalDoctors: number;
  newHires: number;
  terminations: number;
  turnoverRate: number;
  
  // Métricas de pacientes
  totalPatients: number;
  newPatients: number;
  appointmentsCompleted: number;
  averageWaitTime: number;
  patientSatisfaction: number;
  
  // Métricas financieras
  revenue: number;
  operatingCosts: number;
  profit: number;
  profitMargin: number;
  
  // Métricas de contratación
  jobPostings: number;
  applications: number;
  hires: number;
  timeToHire: number;
  
  // Metadatos
  generatedAt: Date;
  generatedBy: string;
}

// =====================================
// ESQUEMAS DE VALIDACIÓN CON ZOD
// =====================================

export const AddressSchema = z.object({
  street: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  zipCode: z.string().min(1, "El código postal es requerido"),
  country: z.string().min(1, "El país es requerido"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export const ContactInfoSchema = z.object({
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  website: z.string().url("URL inválida").optional(),
  fax: z.string().optional()
});

export const BusinessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  isOpen: z.boolean()
});

export const CompanySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(['hospital', 'clinic', 'laboratory', 'pharmacy', 'insurance', 'medical_center']),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  address: AddressSchema,
  contact: ContactInfoSchema,
  businessHours: z.array(BusinessHoursSchema),
  specialties: z.array(z.string()),
  services: z.array(z.string()),
  licenseNumber: z.string().min(1, "El número de licencia es requerido"),
  allowsJobApplications: z.boolean().default(true),
  allowsPatientRegistration: z.boolean().default(true),
  emergencyServices: z.boolean().default(false),
  telemedicineAvailable: z.boolean().default(false)
});

export const JobOfferSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres"),
  requirements: z.array(z.string()).min(1, "Debe incluir al menos un requisito"),
  responsibilities: z.array(z.string()).min(1, "Debe incluir al menos una responsabilidad"),
  benefits: z.array(z.string()),
  department: z.string().min(1, "El departamento es requerido"),
  position: z.string().min(1, "La posición es requerida"),
  jobType: z.enum(['full_time', 'part_time', 'contractor', 'internship', 'temporary']),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'expert']),
  specialization: z.string().min(1, "La especialización es requerida"),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().length(3, "Código de moneda debe ser de 3 caracteres"),
  salaryPeriod: z.enum(['hourly', 'monthly', 'yearly']),
  isRemote: z.boolean()
});

// =====================================
// FILTROS Y BÚSQUEDAS
// =====================================

export interface CompanyFilters {
  type?: CompanyType[];
  size?: CompanySize[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number;
    coordinates?: { lat: number; lng: number };
  };
  specialties?: string[];
  services?: string[];
  rating?: number;
  hiringStatus?: boolean;
  emergencyServices?: boolean;
  telemedicineAvailable?: boolean;
  search?: string;
  sortBy?: 'name' | 'rating' | 'size' | 'founded' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobFilters {
  companyType?: CompanyType[];
  jobType?: JobType[];
  experienceLevel?: ExperienceLevel[];
  specialization?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number;
    coordinates?: { lat: number; lng: number };
  };
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  postedWithin?: number; // días
  search?: string;
  sortBy?: 'postedDate' | 'salary' | 'title' | 'company';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================
// RESPUESTAS DE API
// =====================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================
// FORMULARIOS
// =====================================

export type CompanyFormData = z.infer<typeof CompanySchema>;
export type JobOfferFormData = z.infer<typeof JobOfferSchema>;

// =====================================
// UTILS DE TIPOS
// =====================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateCompanyData = Optional<Company, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'patientsServed' | 'totalEmployees' | 'totalDoctors' | 'totalNurses' | 'totalStaff' | 'yearsInOperation'>;

export type UpdateCompanyData = Partial<Omit<Company, 'id' | 'createdAt' | 'createdBy'>>;

export type CreateJobOfferData = Optional<JobOffer, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount' | 'postedDate'>;

export type UpdateJobOfferData = Partial<Omit<JobOffer, 'id' | 'companyId' | 'createdAt' | 'createdBy'>>;