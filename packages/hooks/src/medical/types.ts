/**
 * @fileoverview Tipos para hooks médicos
 * @module @altamedica/hooks/medical/types
 * @description Definiciones de tipos para datos médicos y hooks especializados
 */

// ==========================================
// QUERY KEYS TYPES
// ==========================================

/**
 * Tipo base para query keys médicas
 */
export type MedicalQueryKeyBase = readonly string[];

// ==========================================
// TIPOS BASE DE PACIENTES
// ==========================================

/**
 * Información básica del paciente
 * @hipaa Contiene PHI - manejar con cuidado
 */
export interface Patient {
  /** ID único del paciente */
  id: string;
  /** Nombre completo del paciente */
  name: string;
  /** Email del paciente */
  email: string;
  /** Teléfono de contacto */
  phone?: string;
  /** Fecha de nacimiento */
  dateOfBirth: string;
  /** Género */
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  /** Dirección */
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  /** Estado del paciente */
  status: 'active' | 'inactive' | 'archived';
  /** Número de historia clínica */
  medicalRecordNumber?: string;
  /** Información de seguro médico */
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  /** Contacto de emergencia */
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  /** Metadatos */
  createdAt: Date;
  updatedAt: Date;
  /** Datos adicionales específicos por app */
  metadata?: Record<string, any>;
}

/**
 * Perfil completo del paciente con datos médicos
 * @hipaa Contiene PHI sensible
 */
export interface PatientProfile extends Patient {
  /** Historial médico resumido */
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: { date: string; procedure: string; notes?: string; }[];
  };
  /** Signos vitales más recientes */
  latestVitals?: VitalSigns;
  /** Citas próximas */
  upcomingAppointments: Appointment[];
  /** Prescripciones activas */
  activePrescriptions: Prescription[];
  /** Último acceso */
  lastAccessed?: Date;
}

// ==========================================
// TIPOS DE FILTROS Y BÚSQUEDA
// ==========================================

/**
 * Filtros para búsqueda de pacientes
 */
export interface PatientsFilters {
  /** Búsqueda por texto */
  search?: string;
  /** Filtrar por estado */
  status?: Patient['status'][];
  /** Filtrar por rango de edad */
  ageRange?: {
    min: number;
    max: number;
  };
  /** Filtrar por género */
  gender?: Patient['gender'][];
  /** Filtrar por proveedor de seguro */
  insuranceProvider?: string[];
  /** Fecha de creación desde */
  createdAfter?: Date;
  /** Fecha de creación hasta */
  createdBefore?: Date;
  /** Filtros personalizados por app */
  customFilters?: Record<string, any>;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  /** Página actual (1-based) */
  page: number;
  /** Elementos por página */
  limit: number;
  /** Campo de ordenamiento */
  sortBy?: string;
  /** Dirección de ordenamiento */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parámetros completos de búsqueda
 */
export interface PatientsSearchParams extends PaginationParams {
  /** Filtros aplicados */
  filters: PatientsFilters;
  /** Si incluir datos relacionados */
  include?: ('appointments' | 'prescriptions' | 'vitals' | 'records')[];
}

// ==========================================
// TIPOS DE RESPUESTA PAGINADA
// ==========================================

/**
 * Respuesta paginada de pacientes
 */
export interface PaginatedPatientsResponse {
  /** Lista de pacientes */
  data: Patient[];
  /** Información de paginación */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Metadatos adicionales */
  meta?: {
    searchTime: number;
    filters: PatientsFilters;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// ==========================================
// TIPOS DE CONFIGURACIÓN DE HOOKS
// ==========================================

/**
 * Opciones para el hook usePatients
 */
export interface UsePatientsOptions {
  /** Parámetros de búsqueda iniciales */
  initialParams?: Partial<PatientsSearchParams>;
  /** Si debe cargar inmediatamente */
  immediate?: boolean;
  /** Configuración de caché */
  cacheTime?: number;
  /** Tiempo de staleness */
  staleTime?: number;
  /** Si debe refrescar en background */
  refetchOnWindowFocus?: boolean;
  /** Si debe refrescar en reconexión */
  refetchOnReconnect?: boolean;
  /** Intervalo de refetch automático */
  refetchInterval?: number;
  /** Token de autenticación */
  token?: string;
  /** Callbacks */
  onSuccess?: (data: PaginatedPatientsResponse) => void;
  onError?: (error: Error) => void;
  onLoadingChange?: (loading: boolean) => void;
  /** Configuración específica por app */
  appSpecific?: {
    /** Para doctors app */
    includeHIPAACompliance?: boolean;
    /** Para patients app */
    personalizedView?: boolean;
    /** Para admin app */
    includeSystemMetrics?: boolean;
  };
}

/**
 * Estado completo de datos médicos
 */
export interface MedicalDataState<T> {
  /** Datos */
  data: T | null;
  /** Estado de carga */
  loading: boolean;
  /** Error si existe */
  error: Error | null;
  /** Si se ejecutó al menos una vez */
  called: boolean;
  /** Timestamp de última actualización */
  lastUpdated?: Date;
  /** Si hay una operación de refetch en curso */
  refetching: boolean;
  /** Si los datos están obsoletos */
  isStale: boolean;
}

/**
 * Valor de retorno del hook usePatients
 */
export interface UsePatientsReturn {
  // Datos
  /** Lista de pacientes */
  patients: Patient[];
  /** Información de paginación */
  pagination: PaginatedPatientsResponse['pagination'];
  /** Metadatos */
  meta?: PaginatedPatientsResponse['meta'];
  
  // Estados
  /** Estado de carga inicial */
  loading: boolean;
  /** Estado de refetch */
  refetching: boolean;
  /** Error si existe */
  error: Error | null;
  /** Si hay más páginas */
  hasNextPage: boolean;
  /** Si hay página anterior */
  hasPreviousPage: boolean;
  /** Si los datos están obsoletos */
  isStale: boolean;
  
  // Acciones
  /** Refrescar datos */
  refetch: () => Promise<void>;
  /** Ir a página específica */
  goToPage: (page: number) => void;
  /** Cambiar límite por página */
  setLimit: (limit: number) => void;
  /** Aplicar filtros */
  setFilters: (filters: Partial<PatientsFilters>) => void;
  /** Limpiar filtros */
  clearFilters: () => void;
  /** Buscar texto */
  search: (query: string) => void;
  /** Ordenar por campo */
  sortBy: (field: string, order?: 'asc' | 'desc') => void;
  
  // CRUD Operations
  /** Crear paciente */
  createPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Patient>;
  /** Actualizar paciente */
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  /** Eliminar paciente */
  deletePatient: (id: string) => Promise<void>;
  
  // Utilidades
  /** Obtener paciente por ID de la lista actual */
  getPatientById: (id: string) => Patient | undefined;
  /** Invalidar caché */
  invalidateCache: () => void;
  /** Exportar datos */
  exportData: (format: 'csv' | 'xlsx' | 'json') => Promise<Blob>;
}

// ==========================================
// OTROS TIPOS MÉDICOS
// ==========================================

/**
 * Cita médica
 */
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  duration: number; // en minutos
  type: 'consultation' | 'followup' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Prescripción médica
 */
export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  refillsRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Historial médico
 */
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: Date;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'test_result' | 'vaccination' | 'surgery';
  title: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Signos vitales
 */
export interface VitalSigns {
  id: string;
  patientId: string;
  recordedAt: Date;
  recordedBy: string; // doctorId or deviceId
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // bpm
  temperature?: number; // celsius
  respiratoryRate?: number; // breaths per minute
  oxygenSaturation?: number; // percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  glucose?: number; // mg/dL
  notes?: string;
  createdAt: Date;
}

// ==========================================
// TIPOS DE QUERY KEYS
// ==========================================

/**
 * Estructura de query keys para React Query
 */
export type MedicalQueryKey = 
  | ['patients']
  | ['patients', 'list', PatientsSearchParams]
  | ['patients', 'detail', string]
  | ['patients', 'profile', string]
  | ['patients', 'search', string]
  | ['appointments', string]
  | ['appointments', 'patient', string]
  | ['prescriptions', 'patient', string]
  | ['medical-records', 'patient', string]
  | ['vital-signs', 'patient', string];

// ==========================================
// TIPOS DE VALIDACIÓN
// ==========================================

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Warning de validación
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// ==========================================
// TIPOS DE CONFIGURACIÓN
// ==========================================

/**
 * Configuración de caché médico
 */
export interface MedicalCacheConfig {
  /** Tiempo de staleness por defecto */
  defaultStaleTime: number;
  /** Tiempo de caché por defecto */
  defaultCacheTime: number;
  /** Configuraciones específicas por tipo */
  specific: {
    patients: { staleTime: number; cacheTime: number; };
    appointments: { staleTime: number; cacheTime: number; };
    prescriptions: { staleTime: number; cacheTime: number; };
    medicalRecords: { staleTime: number; cacheTime: number; };
    vitalSigns: { staleTime: number; cacheTime: number; };
  };
}