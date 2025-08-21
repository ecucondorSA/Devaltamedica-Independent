/**
 * 👤 PATIENT SERVICES - ALTAMEDICA
 * Servicios centralizados para gestión de pacientes
 * Utilizado por todas las aplicaciones que necesiten funcionalidades de pacientes
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  lastVisit: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  patients: Patient[];
  total: number;
  page?: number;
  limit?: number;
}

export interface PatientProfile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    phone: string;
    email: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validUntil?: string;
  };
  preferences: {
    language: string;
    communicationPreferences: {
      email: boolean;
      sms: boolean;
      phone: boolean;
    };
    privacySettings: {
      shareDataForResearch: boolean;
      allowMarketingCommunications: boolean;
    };
  };
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  preferences?: {
    language?: string;
    communicationPreferences?: {
      email?: boolean;
      sms?: boolean;
      phone?: boolean;
    };
    privacySettings?: {
      shareDataForResearch?: boolean;
      allowMarketingCommunications?: boolean;
    };
  };
}

export interface ApiClient {
  get<T>(endpoint: string): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}

export class PatientsService {
  constructor(private apiClient: ApiClient) {}
  
  /**
   * Obtener lista de todos los pacientes
   */
  async getPatients(page?: number, limit?: number): Promise<ApiResponse<PatientsResponse>> {
    let endpoint = '/api/v1/patients';
    
    if (page || limit) {
      const params = new URLSearchParams();
      if (page) params.set('page', page.toString());
      if (limit) params.set('limit', limit.toString());
      endpoint += `?${params.toString()}`;
    }
    
    return this.apiClient.get<PatientsResponse>(endpoint);
  }

  /**
   * Obtener información básica de pacientes
   */
  async getPatientsSimple(): Promise<ApiResponse<Patient[]>> {
    return this.apiClient.get<Patient[]>('/api/v1/patients/simple');
  }

  /**
   * Obtener un paciente por ID
   */
  async getPatientById(patientId: string): Promise<ApiResponse<Patient>> {
    return this.apiClient.get<Patient>(`/api/v1/patients/${patientId}`);
  }

  /**
   * Obtener perfil completo de un paciente
   */
  async getPatientProfile(patientId: string): Promise<ApiResponse<PatientProfile>> {
    return this.apiClient.get<PatientProfile>(`/api/v1/patients/${patientId}/profile`);
  }

  /**
   * Crear un nuevo paciente
   */
  async createPatient(patientData: CreatePatientRequest): Promise<ApiResponse<Patient>> {
    const backendData = {
      name: `${patientData.firstName} ${patientData.lastName}`,
      email: patientData.email,
      phone: patientData.phone,
      age: this.calculateAge(patientData.dateOfBirth),
      gender: patientData.gender,
      bloodType: patientData.bloodType,
      allergies: patientData.allergies || [],
      emergencyContact: patientData.emergencyContactName ? {
        name: patientData.emergencyContactName,
        phone: patientData.emergencyContactPhone || '',
        relationship: patientData.emergencyContactRelationship || 'Emergency Contact'
      } : undefined,
      insurance: patientData.insuranceProvider ? {
        provider: patientData.insuranceProvider,
        policyNumber: patientData.insurancePolicyNumber || '',
      } : undefined,
      dateOfBirth: patientData.dateOfBirth,
      status: 'active'
    };

    return this.apiClient.post<Patient>('/api/v1/patients', backendData);
  }

  /**
   * Actualizar información de un paciente
   */
  async updatePatient(patientId: string, updates: UpdatePatientRequest): Promise<ApiResponse<Patient>> {
    const backendData = {
      ...updates,
      ...(updates.firstName && updates.lastName && {
        name: `${updates.firstName} ${updates.lastName}`
      })
    };

    return this.apiClient.put<Patient>(`/api/v1/patients/${patientId}`, backendData);
  }

  /**
   * Eliminar un paciente (marcar como inactivo)
   */
  async deletePatient(patientId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/patients/${patientId}`
    );
  }

  /**
   * Obtener historial médico de un paciente
   */
  async getPatientMedicalRecords(patientId: string): Promise<ApiResponse<any[]>> {
    return this.apiClient.get<any[]>(`/api/v1/patients/${patientId}/records`);
  }

  /**
   * Obtener citas de un paciente
   */
  async getPatientAppointments(patientId: string): Promise<ApiResponse<any[]>> {
    return this.apiClient.get<any[]>(`/api/v1/patients/${patientId}/appointments`);
  }

  /**
   * Buscar pacientes por nombre o email
   */
  async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    return this.apiClient.get<Patient[]>(`/api/v1/patients?search=${encodeURIComponent(query)}`);
  }

  /**
   * Obtener estadísticas de pacientes
   */
  async getPatientsStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    byAgeGroup: Record<string, number>;
    byGender: Record<string, number>;
  }>> {
    return this.apiClient.get<any>('/api/v1/patients/stats');
  }

  /**
   * Actualizar preferencias de comunicación del paciente
   */
  async updateCommunicationPreferences(
    patientId: string, 
    preferences: {
      email: boolean;
      sms: boolean;
      phone: boolean;
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.apiClient.patch<{ success: boolean }>(
      `/api/v1/patients/${patientId}/preferences`,
      { communicationPreferences: preferences }
    );
  }

  /**
   * Obtener próximas citas del paciente
   */
  async getUpcomingAppointments(patientId: string): Promise<ApiResponse<any[]>> {
    return this.apiClient.get<any[]>(
      `/api/v1/patients/${patientId}/appointments?status=scheduled&upcoming=true`
    );
  }

  /**
   * Obtener historial de sesiones de telemedicina del paciente
   */
  async getTelemedicineHistory(patientId: string): Promise<ApiResponse<any[]>> {
    return this.apiClient.get<any[]>(
      `/api/v1/telemedicine/sessions?patientId=${patientId}&status=completed`
    );
  }

  /**
   * Función helper para calcular edad
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validar datos del paciente antes de enviar
   */
  validatePatientData(data: CreatePatientRequest | UpdatePatientRequest): string[] {
    const errors: string[] = [];
    
    if ('email' in data && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email no válido');
    }
    
    if ('phone' in data && data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      errors.push('Teléfono no válido');
    }
    
    if ('dateOfBirth' in data && data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.push('Fecha de nacimiento no puede ser futura');
      }
    }
    
    return errors;
  }
}

/**
 * Factory function para crear una instancia del servicio
 */
export function createPatientsService(apiClient: ApiClient): PatientsService {
  return new PatientsService(apiClient);
}
