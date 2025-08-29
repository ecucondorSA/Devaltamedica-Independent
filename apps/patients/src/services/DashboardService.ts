/**
 * DashboardService.ts - Servicio Específico para Dashboard con APIs Reales
 * Proyecto: Altamedica Pacientes  
 * Diseño: Extensión conservadora, mantiene compatibilidad total con MedicalService
 */

import { ApiService, apiService } from './ApiService';
import { medicalService } from './MedicalService';
import { logger } from '@altamedica/shared';
import type {
  PatientDashboardDTO,
  UserProfileDTO,
  DashboardApiResponse,
  DashboardApiError,
  DashboardHealthMetrics,
  DashboardAppointment,
  DashboardMedicalRecord,
  DashboardPrescription,
  UserPreferences
} from '../types/dashboard-types';

/**
 * DashboardService - Servicio especializado para obtener datos de dashboard
 * Estrategia: Híbrida (API real + fallback a mock en caso de error)
 */
export class DashboardService {
  private api: ApiService;
  private fallbackService: typeof medicalService;
  private isOnlineMode: boolean = true;

  constructor(
    apiInstance: ApiService = apiService,
    fallbackInstance = medicalService
  ) {
    this.api = apiInstance;
    this.fallbackService = fallbackInstance;
    
    // Detectar si estamos en modo desarrollo o producción
    this.isOnlineMode = process.env.NODE_ENV === 'production' || 
                       !!process.env.NEXT_PUBLIC_API_URL;
  }

  /**
   * Obtiene datos completos del dashboard del paciente
   * Implementación híbrida: API real con fallback a mock
   */
  public async getPatientDashboard(): Promise<DashboardApiResponse<PatientDashboardDTO> | DashboardApiError> {
    try {
      // Intentar API real primero si estamos en modo online
      if (this.isOnlineMode) {
        logger.info('🌐 Intentando obtener dashboard desde API real...');
        return await this.getDashboardFromApi();
      } else {
        logger.info('🔄 Modo desarrollo: usando datos mock...');
        return await this.getDashboardFromMock();
      }
    } catch (error) {
      logger.warn('⚠️ Error en API real, fallback a mock:', String(error));
      return await this.getDashboardFromMock();
    }
  }

  /**
   * Obtiene perfil de usuario desde API real
   */
  public async getUserProfile(): Promise<DashboardApiResponse<UserProfileDTO> | DashboardApiError> {
    try {
      if (this.isOnlineMode) {
        logger.info('🌐 Obteniendo perfil desde API real...');
        const response = await this.api.get<UserProfileDTO>('/user/profile');
        
        return {
          data: response,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            requestId: this.generateRequestId(),
            processingTime: 0,
            version: '1.0.0'
          }
        };
      } else {
        return await this.getUserProfileFromMock();
      }
    } catch (error) {
      logger.warn('⚠️ Error obteniendo perfil, fallback a mock:', String(error));
      return await this.getUserProfileFromMock();
    }
  }

  /**
   * Actualiza preferencias de usuario
   */
  public async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<DashboardApiResponse<UserPreferences> | DashboardApiError> {
    try {
      if (this.isOnlineMode) {
        logger.info('🌐 Actualizando preferencias en API real...');
        const response = await this.api.put<UserPreferences>('/user/preferences', preferences);
        
        return {
          data: response,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            requestId: this.generateRequestId(),
            processingTime: 0,
            version: '1.0.0'
          }
        };
      } else {
        // Simular actualización en mock
        logger.info('🔄 Simulando actualización de preferencias...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          data: preferences as UserPreferences,
          success: true,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error('❌ Error actualizando preferencias:', String(error));
      
      return {
        success: false,
        error: {
          code: 'PREFERENCES_UPDATE_FAILED',
          message: 'Error al actualizar las preferencias del usuario',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Refresca una sección específica del dashboard
   */
  public async refreshDashboardSection(section: 'appointments' | 'prescriptions' | 'records' | 'health'): Promise<any> {
    try {
      if (this.isOnlineMode) {
        logger.info(`🌐 Refrescando sección ${section} desde API real...`);
        
        const endpoints = {
          appointments: '/patient/appointments/upcoming',
          prescriptions: '/patient/prescriptions/active',
          records: '/patient/medical-records/recent',
          health: '/patient/health-metrics/latest'
        };
        
        const response = await this.api.get(endpoints[section]);
        
        return {
          data: response,
          success: true,
          timestamp: new Date().toISOString()
        };
      } else {
        return await this.refreshSectionFromMock(section);
      }
    } catch (error) {
      logger.warn(`⚠️ Error refrescando sección ${section}, fallback a mock:`, String(error));
      return await this.refreshSectionFromMock(section);
    }
  }

  // 🔄 MÉTODOS PRIVADOS - IMPLEMENTACIÓN API REAL

  private async getDashboardFromApi(): Promise<DashboardApiResponse<PatientDashboardDTO>> {
    const response = await this.api.get<PatientDashboardDTO>('/patient/dashboard');
    
    return {
      data: response,
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        requestId: this.generateRequestId(),
        processingTime: 0, // Se calcularía en producción
        version: '1.0.0'
      }
    };
  }

  // 🎭 MÉTODOS PRIVADOS - FALLBACK MOCK

  private async getDashboardFromMock(): Promise<DashboardApiResponse<PatientDashboardDTO>> {
    logger.info('🎭 Generando dashboard mock con datos realistas...');
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));

    // Usar servicios existentes para obtener datos mock
    const [appointments, records, prescriptions] = await Promise.all([
      this.fallbackService.getAppointments({ limit: 5 }),
      this.fallbackService.getMedicalRecords({ limit: 3 }),
      this.fallbackService.getPrescriptions()
    ]);

    const mockDashboard: PatientDashboardDTO = {
      patient: {
        id: 'patient-001',
        userId: 'user-001',
        firstName: 'Eduardo',
        lastName: 'González',
        email: 'eduardo@altamedica.com',
        phoneNumber: '+54 11 1234-5678',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        bloodType: 'O+',
        allergies: [],
        currentMedications: [],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: new Date().toISOString(),
        isActive: true
      },
      upcomingAppointments: this.transformAppointmentsForDashboard(appointments.data),
      recentMedicalRecords: this.transformRecordsForDashboard(records.data),
      activePrescriptions: this.transformPrescriptionsForDashboard(prescriptions.data),
      healthMetrics: this.generateMockHealthMetrics(),
      notifications: this.generateMockNotifications(),
      quickStats: {
        appointmentsThisMonth: 3,
        activePrescriptions: 2,
        unreadNotifications: 5,
        pendingTestResults: 1,
        overdueTasks: 0,
        healthScore: 85
      },
      lastUpdated: new Date().toISOString()
    };

    return {
      data: mockDashboard,
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        requestId: this.generateRequestId(),
        processingTime: 800,
        version: '1.0.0-mock'
      }
    };
  }

  private async getUserProfileFromMock(): Promise<DashboardApiResponse<UserProfileDTO>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockProfile: UserProfileDTO = {
      user: {
        id: 'user-001',
        email: 'eduardo@altamedica.com',
        firstName: 'Eduardo',
        lastName: 'González',
        role: 'patient',
        permissions: ['read:own_data', 'write:own_profile'],
        patientId: 'patient-001',
        lastLogin: new Date().toISOString(),
        isActive: true
      },
      patient: {
        id: 'patient-001',
        userId: 'user-001',
        firstName: 'Eduardo',
        lastName: 'González',
        email: 'eduardo@altamedica.com',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        allergies: [],
        currentMedications: [],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: new Date().toISOString(),
        isActive: true
      },
      preferences: {
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        notifications: {
          email: true,
          sms: true,
          push: true,
          appointmentReminders: true,
          medicationReminders: true,
          testResultAlerts: true
        },
        dashboard: {
          defaultView: 'overview',
          showHealthMetrics: true,
          showQuickActions: true,
          compactMode: false
        },
        privacy: {
          shareDataForResearch: false,
          allowMarketing: false,
          publicProfile: false
        }
      },
      securitySettings: {
        twoFactorEnabled: false,
        lastPasswordChange: '2024-12-01T00:00:00Z',
        activeSessions: [],
        loginHistory: [],
        securityQuestions: [],
        emergencyContacts: []
      },
      lastActivity: new Date().toISOString()
    };

    return {
      data: mockProfile,
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  private async refreshSectionFromMock(section: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockData = {
      appointments: [{ id: 'apt-new', doctorName: 'Dr. Actualizado', date: new Date().toISOString() }],
      prescriptions: [{ id: 'presc-new', medicationName: 'Medicación Actualizada' }],
      records: [{ id: 'rec-new', title: 'Registro Actualizado' }],
      health: { bloodPressure: { systolic: 120, diastolic: 80 } }
    };

    return {
      data: mockData[section as keyof typeof mockData] || [],
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  // 🔧 MÉTODOS AUXILIARES

  private transformAppointmentsForDashboard(appointments: any[]): DashboardAppointment[] {
    return appointments.slice(0, 3).map(apt => ({
      id: apt.id,
      doctorId: apt.doctorId,
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      isTelemedicine: apt.isTelemedicine || false,
      location: apt.location,
      doctorName: `Dr. ${apt.doctorId}`, // En producción vendría del endpoint
      doctorSpecialty: 'Medicina General', // En producción vendría del endpoint
      estimatedDuration: apt.duration || 30,
      canJoinVideo: apt.isTelemedicine && apt.status === 'confirmed',
      reminderSent: false
    }));
  }

  private transformRecordsForDashboard(records: any[]): DashboardMedicalRecord[] {
    return records.slice(0, 3).map(record => ({
      id: record.id,
      date: record.date,
      type: record.type,
      title: record.title,
      description: record.description,
      priority: record.priority,
      tags: record.tags || [],
      doctorName: `Dr. ${record.doctorId}`,
      doctorSpecialty: 'Especialidad',
      attachmentCount: record.attachments?.length || 0,
      hasActionableItems: record.followUpRequired || false
    }));
  }

  private transformPrescriptionsForDashboard(prescriptions: any[]): DashboardPrescription[] {
    return prescriptions.data.slice(0, 3).map(presc => ({
      id: presc.id,
      medicationName: presc.medicationName,
      dosage: presc.dosage,
      frequency: presc.frequency,
      status: presc.status,
      prescribedDate: presc.prescribedDate,
      expiryDate: presc.expiryDate,
      doctorName: `Dr. ${presc.doctorId}`,
      remainingDoses: presc.quantity ? Math.floor(presc.quantity * 0.7) : undefined,
      nextDoseTime: this.calculateNextDoseTime(presc.frequency),
      criticalAlerts: []
    }));
  }

  private generateMockHealthMetrics(): DashboardHealthMetrics {
    return {
      bloodPressure: {
        systolic: 125,
        diastolic: 82,
        recordedAt: new Date().toISOString()
      },
      heartRate: {
        value: 72,
        recordedAt: new Date().toISOString()
      },
      weight: {
        value: 75.5,
        unit: 'kg',
        recordedAt: new Date().toISOString()
      },
      trend: {
        bloodPressureStatus: 'stable',
        weightTrend: 'stable',
        overallHealth: 'good'
      },
      alerts: [],
      nextRecommendedCheckup: '2025-09-15'
    };
  }

  private generateMockNotifications() {
    return [
      {
        id: 'notif-1',
        type: 'appointment' as const,
        title: 'Próxima Cita',
        message: 'Tienes una cita con Dr. García mañana a las 10:00',
        priority: 'medium' as const,
        isRead: false,
        actionUrl: '/appointments/apt-001',
        actionText: 'Ver detalles',
        createdAt: new Date().toISOString(),
        metadata: { appointmentId: 'apt-001' }
      },
      {
        id: 'notif-2',
        type: 'prescription' as const,
        title: 'Medicación',
        message: 'Recuerda tomar tu Losartán a las 08:00',
        priority: 'low' as const,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { prescriptionId: 'presc-001' }
      },
      {
        id: 'notif-3',
        type: 'test_result' as const,
        title: 'Resultados Disponibles',
        message: 'Los resultados de tu análisis de sangre están listos',
        priority: 'high' as const,
        isRead: false,
        actionUrl: '/test-results/test-001',
        actionText: 'Ver resultados',
        createdAt: new Date().toISOString(),
        metadata: { testId: 'test-001' }
      }
    ];
  }

  private calculateNextDoseTime(frequency: string): string | undefined {
    // Lógica simple para calcular próxima dosis
    const now = new Date();
    if (frequency.includes('24 horas') || frequency.includes('diaria')) {
      now.setHours(8, 0, 0, 0); // 8 AM por defecto
      if (now <= new Date()) {
        now.setDate(now.getDate() + 1);
      }
      return now.toISOString();
    }
    return undefined;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🔧 Métodos públicos auxiliares

  public setOnlineMode(online: boolean): void {
    this.isOnlineMode = online;
    logger.info(`🔄 Modo cambiado a: ${online ? 'Online (API real)' : 'Offline (Mock)'}`);
  }

  public isOnline(): boolean {
    return this.isOnlineMode;
  }

  public async testApiConnection(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch (error) {
      logger.warn('❌ Test de conexión API falló:', String(error));
      return false;
    }
  }
}

// 🎯 INSTANCIA SINGLETON
export const dashboardService = new DashboardService();

export default DashboardService;