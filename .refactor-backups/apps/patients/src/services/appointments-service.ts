/**
 * Servicio de Gestión de Citas Médicas - Integración con Backend Dockerizado
 * Conecta el frontend con las APIs de citas del servidor Docker
 */

import { apiClient, ApiResponse  } from '@altamedica/api-client';;
import { API_CONFIG } from '../config/api';

export // Removed local interface - using @altamedica/types
import { Appointment } from '@altamedica/types';

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page?: number;
  limit?: number;
}

export import { Doctor } from '@altamedica/types';

export interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
}

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  doctorId: string;
  duration: number;
}

export interface AvailabilityResponse {
  doctorId: string;
  doctorName: string;
  slots: AppointmentSlot[];
  nextAvailable?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine';
  duration?: number; // minutos, default 30
  reason?: string;
  notes?: string;
  preferredLanguage?: string;
  isUrgent?: boolean;
}

export interface UpdateAppointmentRequest {
  date?: string;
  time?: string;
  status?: 'scheduled' | 'confirmed' | 'cancelled';
  reason?: string;
  notes?: string;
  doctorId?: string;
}

export interface CancelAppointmentRequest {
  reason: string;
  cancelledBy: 'patient' | 'doctor' | 'system';
  refundRequested?: boolean;
}

class AppointmentsService {
  
  /**
   * Obtener todas las citas
   */
  async getAppointments(
    page?: number, 
    limit?: number, 
    status?: string,
    patientId?: string,
    doctorId?: string
  ): Promise<ApiResponse<AppointmentsResponse>> {
    let endpoint = API_CONFIG.APPOINTMENTS.BASE;
    
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    if (status) params.set('status', status);
    if (patientId) params.set('patientId', patientId);
    if (doctorId) params.set('doctorId', doctorId);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<AppointmentsResponse>(endpoint);
  }

  /**
   * Obtener una cita por ID
   */
  async getAppointmentById(appointmentId: string): Promise<ApiResponse<Appointment>> {
    return apiClient.get<Appointment>(API_CONFIG.APPOINTMENTS.BY_ID(appointmentId));
  }

  /**
   * Crear una nueva cita
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    // Formatear datos para el backend
    const backendData = {
      patientId: appointmentData.patientId,
      doctorId: appointmentData.doctorId,
      appointment_date: `${appointmentData.date}T${appointmentData.time}:00.000Z`,
      duration_minutes: appointmentData.duration || 30,
      status: 'scheduled',
      appointment_type: appointmentData.type,
      notes: appointmentData.reason ? `Motivo: ${appointmentData.reason}${appointmentData.notes ? '\nNotas: ' + appointmentData.notes : ''}` : appointmentData.notes,
      consultation_fee: 50.00, // Default fee, should come from doctor data
      metadata: {
        preferredLanguage: appointmentData.preferredLanguage || 'es',
        isUrgent: appointmentData.isUrgent || false,
        createdBy: 'patient',
        createdAt: new Date().toISOString()
      }
    };

    return apiClient.post<Appointment>(API_CONFIG.APPOINTMENTS.BASE, backendData);
  }

  /**
   * Actualizar una cita existente
   */
  async updateAppointment(
    appointmentId: string, 
    updates: UpdateAppointmentRequest
  ): Promise<ApiResponse<Appointment>> {
    const backendData = {
      ...updates,
      ...(updates.date && updates.time && {
        appointment_date: `${updates.date}T${updates.time}:00.000Z`
      }),
      updated_at: new Date().toISOString()
    };

    return apiClient.put<Appointment>(
      API_CONFIG.APPOINTMENTS.BY_ID(appointmentId), 
      backendData
    );
  }

  /**
   * Cancelar una cita
   */
  async cancelAppointment(
    appointmentId: string, 
    cancelData: CancelAppointmentRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(
      API_CONFIG.APPOINTMENTS.CANCEL(appointmentId),
      {
        ...cancelData,
        cancelled_at: new Date().toISOString(),
        status: 'cancelled'
      }
    );
  }

  /**
   * Confirmar una cita
   */
  async confirmAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
    return apiClient.patch<Appointment>(
      API_CONFIG.APPOINTMENTS.BY_ID(appointmentId),
      { 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      }
    );
  }

  /**
   * Marcar cita como completada
   */
  async completeAppointment(
    appointmentId: string, 
    completionNotes?: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.patch<Appointment>(
      API_CONFIG.APPOINTMENTS.BY_ID(appointmentId),
      { 
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes
      }
    );
  }

  /**
   * Obtener todos los doctores disponibles
   */
  async getDoctors(): Promise<ApiResponse<DoctorsResponse>> {
    return apiClient.get<DoctorsResponse>('/api/v1/doctors');
  }

  /**
   * Obtener un doctor por ID
   */
  async getDoctorById(doctorId: string): Promise<ApiResponse<Doctor>> {
    return apiClient.get<Doctor>(`/api/v1/doctors/${doctorId}`);
  }

  /**
   * Obtener disponibilidad de un doctor
   */
  async getDoctorAvailability(
    doctorId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<AvailabilityResponse>> {
    let endpoint = `/api/v1/doctors/${doctorId}/availability`;
    
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<AvailabilityResponse>(endpoint);
  }

  /**
   * Buscar doctores por especialidad o ubicación
   */
  async searchDoctors(
    specialty?: string, 
    location?: string, 
    rating?: number
  ): Promise<ApiResponse<Doctor[]>> {
    let endpoint = '/api/v1/doctors/search/location';
    
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (location) params.set('location', location);
    if (rating) params.set('minRating', rating.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<Doctor[]>(endpoint);
  }

  /**
   * Obtener horario de un doctor
   */
  async getDoctorSchedule(
    doctorId: string, 
    date?: string
  ): Promise<ApiResponse<{ schedule: any; availability: AppointmentSlot[] }>> {
    let endpoint = `/api/v1/doctors/${doctorId}/schedule`;
    
    if (date) {
      endpoint += `?date=${date}`;
    }
    
    return apiClient.get<{ schedule: any; availability: AppointmentSlot[] }>(endpoint);
  }

  /**
   * Obtener próximas citas de un paciente
   */
  async getUpcomingAppointments(patientId: string): Promise<ApiResponse<Appointment[]>> {
    const today = new Date().toISOString().split('T')[0];
    return apiClient.get<Appointment[]>(
      `${API_CONFIG.APPOINTMENTS.BASE}?patientId=${patientId}&date>=${today}&status=scheduled,confirmed&sort=date`
    );
  }

  /**
   * Obtener historial de citas de un paciente
   */
  async getAppointmentHistory(
    patientId: string, 
    limit?: number
  ): Promise<ApiResponse<Appointment[]>> {
    let endpoint = `${API_CONFIG.APPOINTMENTS.BASE}?patientId=${patientId}&status=completed&sort=date:desc`;
    
    if (limit) {
      endpoint += `&limit=${limit}`;
    }
    
    return apiClient.get<Appointment[]>(endpoint);
  }

  /**
   * Reprogramar una cita
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.patch<Appointment>(
      API_CONFIG.APPOINTMENTS.BY_ID(appointmentId),
      {
        appointment_date: `${newDate}T${newTime}:00.000Z`,
        status: 'scheduled', // Reset to scheduled after rescheduling
        reschedule_reason: reason,
        rescheduled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
  }

  /**
   * Obtener estadísticas de citas
   */
  async getAppointmentStats(
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    completionRate: number;
    cancellationRate: number;
    averageDuration: number;
  }>> {
    let endpoint = '/api/v1/appointments/stats';
    
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<any>(endpoint);
  }

  /**
   * Iniciar sesión de video para cita de telemedicina
   */
  async startVideoSession(appointmentId: string): Promise<ApiResponse<{
    sessionId: string;
    roomId: string;
    webrtcConfig: any;
  }>> {
    return apiClient.post<{
      sessionId: string;
      roomId: string;
      webrtcConfig: any;
    }>(API_CONFIG.APPOINTMENTS.VIDEO_SESSION(appointmentId), {
      action: 'start',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Finalizar sesión de video
   */
  async endVideoSession(appointmentId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(
      API_CONFIG.APPOINTMENTS.VIDEO_SESSION(appointmentId),
      {
        action: 'end',
        timestamp: new Date().toISOString()
      }
    );
  }
}

// Singleton del servicio de citas
export const appointmentsService = new AppointmentsService();

// Exportar como default también
export default appointmentsService;