/**
 * Servicio de Gestión de Pacientes - Integración con Backend Dockerizado
 * Conecta el frontend con las APIs de pacientes del servidor Docker
 */

import { apiClient, ApiResponse } from './api-client';
import { API_CONFIG } from '../config/api';

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

class PatientsService {
  
  /**
   * Obtener lista de todos los pacientes
   */
  async getPatients(page?: number, limit?: number): Promise<ApiResponse<PatientsResponse>> {
    let endpoint = API_CONFIG.PATIENTS.BASE;
    
    if (page || limit) {
      const params = new URLSearchParams();
      if (page) params.set('page', page.toString());
      if (limit) params.set('limit', limit.toString());
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<PatientsResponse>(endpoint);
  }

  /**
   * Obtener información básica de pacientes
   */
  async getPatientsSimple(): Promise<ApiResponse<Patient[]>> {
    return apiClient.get<Patient[]>(API_CONFIG.PATIENTS.SIMPLE);
  }

  /**
   * Obtener un paciente por ID
   */
  async getPatientById(patientId: string): Promise<ApiResponse<Patient>> {
    return apiClient.get<Patient>(API_CONFIG.PATIENTS.BY_ID(patientId));
  }

  /**
   * Obtener perfil completo de un paciente
   */
  async getPatientProfile(patientId: string): Promise<ApiResponse<PatientProfile>> {
    return apiClient.get<PatientProfile>(API_CONFIG.PATIENTS.PROFILE(patientId));
  }

  /**
   * Crear un nuevo paciente
   */
  async createPatient(patientData: CreatePatientRequest): Promise<ApiResponse<Patient>> {
    // Transformar datos para que coincidan con el formato del backend
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

    return apiClient.post<Patient>(API_CONFIG.PATIENTS.BASE, backendData);
  }

  /**
   * Actualizar información de un paciente
   */
  async updatePatient(patientId: string, updates: UpdatePatientRequest): Promise<ApiResponse<Patient>> {
    // Transformar datos para el backend si es necesario
    const backendData = {
      ...updates,
      ...(updates.firstName && updates.lastName && {
        name: `${updates.firstName} ${updates.lastName}`
      })
    };

    return apiClient.put<Patient>(API_CONFIG.PATIENTS.BY_ID(patientId), backendData);
  }

  /**
   * Eliminar un paciente (marcar como inactivo)
   */
  async deletePatient(patientId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(
      API_CONFIG.PATIENTS.BY_ID(patientId)
    );
  }

  /**
   * Obtener historial médico de un paciente
   */
  async getPatientMedicalRecords(patientId: string): Promise<ApiResponse<MedicalRecord[]>> {
    return apiClient.get<MedicalRecord[]>(API_CONFIG.PATIENTS.RECORDS(patientId));
  }

  /**
   * Obtener citas de un paciente
   */
  async getPatientAppointments(patientId: string): Promise<ApiResponse<Appointment[]>> {
    return apiClient.get<Appointment[]>(API_CONFIG.PATIENTS.APPOINTMENTS(patientId));
  }

  /**
   * Buscar pacientes por nombre o email
   */
  async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    return apiClient.get<Patient[]>(`${API_CONFIG.PATIENTS.BASE}?search=${encodeURIComponent(query)}`);
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
    return apiClient.get<{ total: number; active: number; inactive: number; newThisMonth: number; byAgeGroup: Record<string, number>; byGender: Record<string, number> }>('/api/v1/patients/stats');
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
    return apiClient.patch<{ success: boolean }>(
      `${API_CONFIG.PATIENTS.BY_ID(patientId)}/preferences`,
      { communicationPreferences: preferences }
    );
  }

  /**
   * Obtener próximas citas del paciente
   */
  async getUpcomingAppointments(patientId: string): Promise<ApiResponse<Appointment[]>> {
    return apiClient.get<Appointment[]>(
      `${API_CONFIG.PATIENTS.APPOINTMENTS(patientId)}?status=scheduled&upcoming=true`
    );
  }

  /**
   * Obtener historial de sesiones de telemedicina del paciente
   */
  async getTelemedicineHistory(patientId: string): Promise<ApiResponse<TelemedicineSession[]>> {
    return apiClient.get<TelemedicineSession[]>(
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
  private validatePatientData(data: CreatePatientRequest | UpdatePatientRequest): string[] {
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

// Singleton del servicio de pacientes
export const patientsService = new PatientsService();

// Exportar como default también
export default patientsService;