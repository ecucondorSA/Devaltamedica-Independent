/**
 * Servicio de Doctores - Conexión con Backend API
 * Gestión completa de datos médicos, citas y pacientes
 */

import axios from 'axios';
import { User } from 'firebase/auth';
import { logger, medicalLogger } from '@altamedica/shared';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Interceptor para agregar token de autenticación
axios.interceptors.request.use(async (config) => {
  // Obtener token de Firebase Auth
  const user = JSON.parse(localStorage.getItem('firebase:authUser:demo-api-key:[DEFAULT]') || '{}');
  if (user.stsTokenManager?.accessToken) {
    config.headers.Authorization = `Bearer ${user.stsTokenManager.accessToken}`;
  }
  return config;
});

// Tipos de datos
export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  experience: number;
  education: string[];
  certifications: string[];
  languages: string[];
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  consultationFee: number;
  rating: number;
  totalConsultations: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  criticalAlerts: number;
  monthlyConsultations: number;
  patientSatisfactionRate: number;
  averageWaitTime: number;
  revenueThisMonth: number;
  completedAppointments: number;
  cancelledAppointments: number;
  telemedicineSessions: number;
}

export interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number;
  type: 'IN_PERSON' | 'TELEMEDICINE' | 'FOLLOW_UP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  specialty: string;
  reason: string;
  notes?: string;
  isUrgent: boolean;
  telemedicineUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorPatient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: string[];
  allergies: string[];
  medications: string[];
  lastVisit: string;
  nextAppointment?: string;
  totalVisits: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  createdAt: string;
}

export interface DoctorAlert {
  id: string;
  type: 'EMERGENCY' | 'CRITICAL_VALUES' | 'MEDICATION_ALERT' | 'SYSTEM' | 'APPOINTMENT';
  patientId?: string;
  patientName?: string;
  message: string;
  description: string;
  timestamp: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  acknowledged: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  expiresAt?: string;
}

export interface DoctorActivity {
  id: string;
  type: 'PATIENT_UPDATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_COMPLETED' | 'TEST_RESULT' | 'PRESCRIPTION' | 'ALERT_ACKNOWLEDGED';
  description: string;
  timestamp: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  relatedEntity?: string;
  metadata?: Record<string, any>;
}

class DoctorService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  /**
   * Obtener perfil del doctor
   */
  async getProfile(userId: string): Promise<DoctorProfile> {
    try {
      const response = await this.api.get(`/doctors/profile/${userId}`);
      return response.data;
    } catch (error) {
      medicalLogger.critical('Error obteniendo perfil del doctor', { userId, error: error.message });
      throw new Error('No se pudo obtener el perfil del doctor');
    }
  }

  /**
   * Actualizar perfil del doctor
   */
  async updateProfile(userId: string, profileData: Partial<DoctorProfile>): Promise<DoctorProfile> {
    try {
      const response = await this.api.put(`/doctors/profile/${userId}`, profileData);
      return response.data;
    } catch (error) {
      medicalLogger.critical('Error actualizando perfil del doctor', { userId, error: error.message });
      throw new Error('No se pudo actualizar el perfil del doctor');
    }
  }

  /**
   * Obtener estadísticas del doctor
   */
  async getStats(userId: string): Promise<DoctorStats> {
    try {
      const response = await this.api.get(`/doctors/${userId}/stats`);
      return response.data;
    } catch (error) {
      medicalLogger.critical('Error obteniendo estadísticas del doctor', { userId, error: error.message });
      throw new Error('No se pudieron obtener las estadísticas');
    }
  }

  /**
   * Obtener citas del día
   */
  async getTodayAppointments(userId: string): Promise<DoctorAppointment[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/appointments/today`);
      return response.data;
    } catch (error) {
      medicalLogger.critical('Error obteniendo citas del día', { userId, error: error.message });
      throw new Error('No se pudieron obtener las citas del día');
    }
  }

  /**
   * Obtener todas las citas del doctor
   */
  async getAppointments(userId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    patientId?: string;
  }): Promise<DoctorAppointment[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/appointments`, { params: filters });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo citas:', error);
      throw new Error('No se pudieron obtener las citas');
    }
  }

  /**
   * Actualizar estado de una cita
   */
  async updateAppointmentStatus(appointmentId: string, status: string, notes?: string): Promise<DoctorAppointment> {
    try {
      const response = await this.api.patch(`/appointments/${appointmentId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      logger.error('Error actualizando estado de cita:', error);
      throw new Error('No se pudo actualizar el estado de la cita');
    }
  }

  /**
   * Obtener pacientes del doctor
   */
  async getPatients(userId: string, filters?: {
    search?: string;
    riskLevel?: string;
    isActive?: boolean;
  }): Promise<DoctorPatient[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/patients`, { params: filters });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo pacientes:', error);
      throw new Error('No se pudieron obtener los pacientes');
    }
  }

  /**
   * Obtener paciente específico
   */
  async getPatient(userId: string, patientId: string): Promise<DoctorPatient> {
    try {
      const response = await this.api.get(`/doctors/${userId}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo paciente:', error);
      throw new Error('No se pudo obtener el paciente');
    }
  }

  /**
   * Obtener alertas críticas
   */
  async getCriticalAlerts(userId: string): Promise<DoctorAlert[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/alerts/critical`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo alertas críticas:', error);
      throw new Error('No se pudieron obtener las alertas críticas');
    }
  }

  /**
   * Reconocer una alerta
   */
  async acknowledgeAlert(alertId: string, notes?: string): Promise<DoctorAlert> {
    try {
      const response = await this.api.patch(`/alerts/${alertId}/acknowledge`, { notes });
      return response.data;
    } catch (error) {
      logger.error('Error reconociendo alerta:', error);
      throw new Error('No se pudo reconocer la alerta');
    }
  }

  /**
   * Obtener actividad reciente
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<DoctorActivity[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/activity`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo actividad reciente:', error);
      throw new Error('No se pudo obtener la actividad reciente');
    }
  }

  /**
   * Crear sesión de telemedicina
   */
  async createTelemedicineSession(appointmentId: string): Promise<{
    sessionId: string;
    roomUrl: string;
    accessToken: string;
  }> {
    try {
      const response = await this.api.post(`/telemedicine/sessions`, {
        appointmentId
      });
      return response.data;
    } catch (error) {
      logger.error('Error creando sesión de telemedicina:', error);
      throw new Error('No se pudo crear la sesión de telemedicina');
    }
  }

  /**
   * Obtener horarios disponibles
   */
  async getAvailableSlots(userId: string, date: string): Promise<{
    time: string;
    available: boolean;
    appointmentId?: string;
  }[]> {
    try {
      const response = await this.api.get(`/doctors/${userId}/availability/${date}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo horarios disponibles:', error);
      throw new Error('No se pudieron obtener los horarios disponibles');
    }
  }

  /**
   * Actualizar disponibilidad
   */
  async updateAvailability(userId: string, availability: DoctorProfile['availability']): Promise<DoctorProfile> {
    try {
      const response = await this.api.put(`/doctors/${userId}/availability`, {
        availability
      });
      return response.data;
    } catch (error) {
      logger.error('Error actualizando disponibilidad:', error);
      throw new Error('No se pudo actualizar la disponibilidad');
    }
  }

  /**
   * Obtener reportes y analytics
   */
  async getAnalytics(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{
    consultations: number;
    revenue: number;
    patientGrowth: number;
    satisfactionRate: number;
    topSpecialties: Array<{ specialty: string; count: number }>;
    appointmentTrends: Array<{ date: string; count: number }>;
  }> {
    try {
      const response = await this.api.get(`/doctors/${userId}/analytics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo analytics:', error);
      throw new Error('No se pudieron obtener los analytics');
    }
  }
}

export const doctorService = new DoctorService(); 