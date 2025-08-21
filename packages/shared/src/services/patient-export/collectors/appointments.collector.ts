import type { DataCategory } from '../types';
import { BaseCollector } from './base.collector';

/**
 * Appointments Collector
 * Handles collection of medical appointments and related data
 * Extracted from lines 542-569 of original PatientDataExportService
 */

export interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: Date;
  providerId: string;
  providerName: string;
  specialty: string;
  facilityId: string;
  facilityName: string;
  type: 'consultation' | 'procedure' | 'follow-up' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  duration: number; // minutes
  reason: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cost?: number;
  insuranceCovered?: boolean;
  copay?: number;
  scheduledBy: string;
  confirmedAt?: Date;
  checkedInAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  remindersSent: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AppointmentsCollector extends BaseCollector<Appointment> {
  protected readonly collectionName = 'appointments';
  protected readonly category: DataCategory = 'appointments';
  protected readonly dateField = 'appointmentDate';

  /**
   * Enhanced validation for appointments
   */
  override validate(data: Appointment[]): boolean {
    if (!super.validate(data)) {
      return false;
    }

    return data.every((appointment) => {
      return (
        appointment.id &&
        appointment.patientId &&
        appointment.appointmentDate instanceof Date &&
        appointment.providerId &&
        appointment.providerName &&
        appointment.specialty &&
        appointment.type &&
        ['consultation', 'procedure', 'follow-up', 'emergency', 'telemedicine'].includes(appointment.type) &&
        appointment.status &&
        ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(appointment.status) &&
        typeof appointment.duration === 'number' &&
        appointment.duration > 0 &&
        appointment.reason &&
        appointment.priority &&
        ['low', 'normal', 'high', 'urgent'].includes(appointment.priority) &&
        typeof appointment.followUpRequired === 'boolean'
      );
    });
  }

  /**
   * Sanitize appointments for export
   */
  override sanitize(data: Appointment[]): Appointment[] {
    return data.map((appointment) => ({
      ...appointment,
      // Ensure dates are properly formatted
      appointmentDate: appointment.appointmentDate instanceof Date 
        ? appointment.appointmentDate 
        : new Date(appointment.appointmentDate),
      followUpDate: appointment.followUpDate instanceof Date 
        ? appointment.followUpDate 
        : (appointment.followUpDate ? new Date(appointment.followUpDate) : undefined),
      confirmedAt: appointment.confirmedAt instanceof Date 
        ? appointment.confirmedAt 
        : (appointment.confirmedAt ? new Date(appointment.confirmedAt) : undefined),
      checkedInAt: appointment.checkedInAt instanceof Date 
        ? appointment.checkedInAt 
        : (appointment.checkedInAt ? new Date(appointment.checkedInAt) : undefined),
      completedAt: appointment.completedAt instanceof Date 
        ? appointment.completedAt 
        : (appointment.completedAt ? new Date(appointment.completedAt) : undefined),
      cancelledAt: appointment.cancelledAt instanceof Date 
        ? appointment.cancelledAt 
        : (appointment.cancelledAt ? new Date(appointment.cancelledAt) : undefined),
      createdAt: appointment.createdAt instanceof Date 
        ? appointment.createdAt 
        : new Date(appointment.createdAt),
      updatedAt: appointment.updatedAt instanceof Date 
        ? appointment.updatedAt 
        : new Date(appointment.updatedAt),
      // Sanitize financial information if not authorized
      cost: this.shouldIncludeFinancialData() ? appointment.cost : undefined,
      copay: this.shouldIncludeFinancialData() ? appointment.copay : undefined,
      insuranceCovered: this.shouldIncludeFinancialData() ? appointment.insuranceCovered : undefined,
    }));
  }

  /**
   * Enhanced document transformation for appointments
   */
  protected override transformDocument(id: string, data: any): Appointment {
    return {
      id,
      patientId: data.patientId,
      appointmentDate: data.appointmentDate?.toDate?.() || new Date(data.appointmentDate),
      providerId: data.providerId || '',
      providerName: data.providerName || '',
      specialty: data.specialty || 'general',
      facilityId: data.facilityId || '',
      facilityName: data.facilityName || '',
      type: data.type || 'consultation',
      status: data.status || 'scheduled',
      duration: data.duration || 30,
      reason: data.reason || '',
      notes: data.notes,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      followUpRequired: data.followUpRequired || false,
      followUpDate: data.followUpDate?.toDate?.(),
      priority: data.priority || 'normal',
      cost: data.cost,
      insuranceCovered: data.insuranceCovered,
      copay: data.copay,
      scheduledBy: data.scheduledBy || '',
      confirmedAt: data.confirmedAt?.toDate?.(),
      checkedInAt: data.checkedInAt?.toDate?.(),
      completedAt: data.completedAt?.toDate?.(),
      cancelledAt: data.cancelledAt?.toDate?.(),
      cancellationReason: data.cancellationReason,
      remindersSent: data.remindersSent || 0,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }

  /**
   * Get mock appointments for development
   */
  protected override getMockData(patientId: string): Appointment[] {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-appointment-1',
        patientId,
        appointmentDate: nextWeek,
        providerId: 'mock-doctor-1',
        providerName: 'Dr. Juan Pérez',
        specialty: 'Medicina General',
        facilityId: 'mock-facility-1',
        facilityName: 'Centro Médico Central',
        type: 'consultation',
        status: 'confirmed',
        duration: 30,
        reason: 'Control de rutina',
        notes: 'Paciente requiere control de presión arterial',
        followUpRequired: true,
        followUpDate: new Date(nextWeek.getTime() + 30 * 24 * 60 * 60 * 1000),
        priority: 'normal',
        cost: 5000,
        insuranceCovered: true,
        copay: 1000,
        scheduledBy: 'reception-staff-1',
        confirmedAt: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
        remindersSent: 1,
        createdAt: new Date(nextWeek.getTime() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'mock-appointment-2',
        patientId,
        appointmentDate: lastWeek,
        providerId: 'mock-doctor-2',
        providerName: 'Dra. María González',
        specialty: 'Cardiología',
        facilityId: 'mock-facility-2',
        facilityName: 'Hospital Especializado',
        type: 'follow-up',
        status: 'completed',
        duration: 45,
        reason: 'Control cardiológico post-operatorio',
        notes: 'Evolución favorable post-cirugía',
        diagnosis: 'Post-operatorio sin complicaciones',
        treatment: 'Continuar medicación actual',
        followUpRequired: true,
        followUpDate: new Date(lastWeek.getTime() + 60 * 24 * 60 * 60 * 1000),
        priority: 'high',
        cost: 8000,
        insuranceCovered: true,
        copay: 1500,
        scheduledBy: 'cardiology-staff-1',
        confirmedAt: new Date(lastWeek.getTime() - 24 * 60 * 60 * 1000),
        checkedInAt: new Date(lastWeek.getTime() - 30 * 60 * 1000),
        completedAt: lastWeek,
        remindersSent: 2,
        createdAt: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: lastWeek,
      },
      {
        id: 'mock-appointment-3',
        patientId,
        appointmentDate: lastMonth,
        providerId: 'mock-doctor-3',
        providerName: 'Dr. Carlos Rodríguez',
        specialty: 'Telemedicina',
        facilityId: 'virtual-facility',
        facilityName: 'Consulta Virtual',
        type: 'telemedicine',
        status: 'completed',
        duration: 20,
        reason: 'Consulta virtual de seguimiento',
        notes: 'Paciente reporta mejoría en síntomas',
        diagnosis: 'Evolución favorable',
        treatment: 'Continuar tratamiento actual',
        followUpRequired: false,
        priority: 'normal',
        cost: 3000,
        insuranceCovered: true,
        copay: 500,
        scheduledBy: 'telemedicine-platform',
        confirmedAt: new Date(lastMonth.getTime() - 24 * 60 * 60 * 1000),
        checkedInAt: new Date(lastMonth.getTime() - 5 * 60 * 1000),
        completedAt: lastMonth,
        remindersSent: 1,
        createdAt: new Date(lastMonth.getTime() - 48 * 60 * 60 * 1000),
        updatedAt: lastMonth,
      },
    ];
  }

  /**
   * Check if financial data should be included in export
   */
  private shouldIncludeFinancialData(): boolean {
    return (process.env.EXPORT_INCLUDE_FINANCIAL_DATA || 'true') === 'true';
  }

  /**
   * Collect appointments with enhanced error handling
   */
  override async collect(patientId: string, dateRange?: { from: Date; to: Date }): Promise<Appointment[]> {
    this.checkExportEnabled();

    if (this.shouldUseMockData()) {
      return this.getMockData(patientId);
    }

    return super.collect(patientId, dateRange);
  }

  /**
   * Get completed appointments only
   */
  async getCompletedAppointments(patientId: string, dateRange?: { from: Date; to: Date }): Promise<Appointment[]> {
    const allAppointments = await this.collect(patientId, dateRange);
    return allAppointments.filter(appointment => appointment.status === 'completed');
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(patientId: string): Promise<Appointment[]> {
    const now = new Date();
    const futureRange = { from: now, to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) };
    const allAppointments = await this.collect(patientId, futureRange);
    return allAppointments.filter(appointment => 
      ['scheduled', 'confirmed'].includes(appointment.status) &&
      appointment.appointmentDate > now
    );
  }

  /**
   * Get appointments by specialty
   */
  async getAppointmentsBySpecialty(
    patientId: string, 
    specialty: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<Appointment[]> {
    const allAppointments = await this.collect(patientId, dateRange);
    return allAppointments.filter(appointment => 
      appointment.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }
}

// Export singleton instance
export const appointmentsCollector = new AppointmentsCollector();