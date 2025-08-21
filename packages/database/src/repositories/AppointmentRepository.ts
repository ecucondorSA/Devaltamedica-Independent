/**
 * 📅 APPOINTMENT REPOSITORY - ALTAMEDICA
 * Repository especializado para gestión de citas médicas con funcionalidades
 * avanzadas de programación, recordatorios y telemedicina
 */

import { AppointmentExtendedSchema } from '../schemas/appointment-schemas.js';
import { BaseEntity, BaseRepository, RepositoryResult, ServiceContext } from './BaseRepository.js';

// Appointment entity interface que extiende BaseEntity
export interface Appointment extends BaseEntity {
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  companyId?: string;
  
  // Fechas y tiempos
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  estimatedDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  
  // Tipo y categoría
  type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine' | 'procedure' | 'checkup' | 'specialist_referral';
  category: 'routine' | 'urgent' | 'emergency' | 'prevention';
  specialty?: string;
  
  // Motivo y síntomas
  reason: string;
  symptoms: string[];
  chiefComplaint?: string;
  detailedDescription?: string;
  
  // Estado y seguimiento
  appointmentStatus: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  cancellationReason?: string;
  cancellationDate?: Date;
  cancelledBy?: string;
  rescheduleReason?: string;
  originalAppointmentId?: string;
  
  // Telemedicine
  isTelemedicine: boolean;
  telemedicineInfo?: {
    platform?: 'zoom' | 'meet' | 'webrtc' | 'agora';
    meetingId?: string;
    meetingUrl?: string;
    password?: string;
    roomId?: string;
    sessionId?: string;
  };
  
  // Seguimiento
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpType?: 'phone' | 'in_person' | 'telemedicine';
  followUpInstructions?: string;
  
  // Facturación y pagos
  estimatedCost?: number;
  actualCost?: number;
  insuranceCovered: boolean;
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'cancelled';
  paymentMethod?: string;
  
  // Documentos y archivos
  notes?: string;
  internalNotes?: string;
  
  // Métricas y calidad
  patientSatisfactionRating?: number;
  patientFeedback?: string;
  clinicalOutcome?: 'resolved' | 'improved' | 'unchanged' | 'worsened' | 'referred';
  
  // Metadatos
  source: 'web' | 'mobile' | 'phone' | 'walk_in' | 'referral';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  location?: {
    type: 'clinic' | 'hospital' | 'home' | 'online';
    name?: string;
    address?: string;
    room?: string;
  };
  
  // Conflictos y validaciones
  hasConflicts: boolean;
  conflictReason?: string;
  isDoubleBooked: boolean;
}

export class AppointmentRepository extends BaseRepository<Appointment> {
  protected collectionName = 'appointments';
  protected entitySchema = AppointmentExtendedSchema;

  /**
   * Buscar citas por paciente
   */
  async findByPatient(patientId: string, context: ServiceContext, filters?: {
    status?: string[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<RepositoryResult<Appointment>> {
    try {
      const db = await this.ensureFirestore();
      let query = db.collection(this.collectionName)
        .where('patientId', '==', patientId);

      // Aplicar filtros de estado
      if (filters?.status && filters.status.length > 0) {
        query = query.where('appointmentStatus', 'in', filters.status);
      }

      // Ordenar por fecha programada
      query = query.orderBy('scheduledDate', 'desc');

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      let appointments = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Appointment));

      // Filtrar por rango de fechas en memoria si es necesario
      if (filters?.fromDate || filters?.toDate) {
        appointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.scheduledDate);
          if (filters.fromDate && appointmentDate < filters.fromDate) return false;
          if (filters.toDate && appointmentDate > filters.toDate) return false;
          return true;
        });
      }

      await this.logAudit('read_by_patient', 'collection', context, { patientId, filters });

  return {
        data: appointments,
        total: appointments.length,
        hasMore: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar citas por doctor
   */
  async findByDoctor(doctorId: string, context: ServiceContext, filters?: {
    status?: string[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<RepositoryResult<Appointment>> {
    try {
      const db = await this.ensureFirestore();
      let query = db.collection(this.collectionName)
        .where('doctorId', '==', doctorId);

      // Aplicar filtros de estado
      if (filters?.status && filters.status.length > 0) {
        query = query.where('appointmentStatus', 'in', filters.status);
      }

      // Ordenar por fecha programada
      query = query.orderBy('scheduledDate', 'asc');

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      let appointments = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Appointment));

      // Filtrar por rango de fechas en memoria si es necesario
      if (filters?.fromDate || filters?.toDate) {
        appointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.scheduledDate);
          if (filters.fromDate && appointmentDate < filters.fromDate) return false;
          if (filters.toDate && appointmentDate > filters.toDate) return false;
          return true;
        });
      }

      await this.logAudit('read_by_doctor', 'collection', context, { doctorId, filters });

  return {
        data: appointments,
        total: appointments.length,
        hasMore: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear cita con número único
   */
  async createWithAppointmentNumber(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'appointmentNumber'>, context: ServiceContext): Promise<Appointment> {
    try {
      // Generar número único de cita
      const appointmentNumber = this.generateAppointmentNumber();
      
      const appointmentData = {
        ...data,
        appointmentNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

  const created = await this.create(appointmentData as any, context);
  await this.logAudit('create_with_number', created.id, context, { appointmentNumber });
  return created as Appointment;
    } catch (error) {
  throw error;
    }
  }

  /**
   * Buscar citas por número
   */
  async findByAppointmentNumber(appointmentNumber: string, context: ServiceContext): Promise<Appointment | null> {
    try {
      const db = await this.ensureFirestore();
      
      const query = db.collection(this.collectionName)
        .where('appointmentNumber', '==', appointmentNumber)
        .limit(1);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
  return null;
      }

      const appointment = { 
        id: snapshot.docs[0].id, 
        ...snapshot.docs[0].data() 
      } as Appointment;

  await this.logAudit('read_by_number', appointment.id, context, { appointmentNumber });
  return appointment;
    } catch (error) {
  throw error;
    }
  }

  /**
   * Actualizar estado de cita
   */
  async updateStatus(appointmentId: string, status: Appointment['appointmentStatus'], notes: string | undefined, context: ServiceContext): Promise<Appointment | null> {
    try {
      const updateData: any = {
        appointmentStatus: status,
        updatedAt: new Date()
      };

      // Agregar timestamps según el estado
      if (status === 'in_progress') {
        updateData.actualStartTime = new Date();
      } else if (status === 'completed') {
        updateData.actualEndTime = new Date();
        
        // Calcular duración real si hay tiempo de inicio
        const appointment = await this.findById(appointmentId, context);
        if (appointment?.actualStartTime) {
          const startTime = new Date(appointment.actualStartTime);
          const endTime = new Date();
          updateData.actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // minutos
        }
      } else if (status === 'cancelled') {
        updateData.cancellationDate = new Date();
      }

      if (notes) {
        updateData.internalNotes = notes;
      }

  const result = await this.update(appointmentId, updateData, context);
  await this.logAudit('update_status', appointmentId, context, { status, notes });
  return result as Appointment | null;
    } catch (error) {
  throw error;
    }
  }

  /**
   * Reagendar cita
   */
  async reschedule(appointmentId: string, newScheduledDate: Date, newStartTime: string, newEndTime: string, reason: string | undefined, context: ServiceContext): Promise<Appointment | null> {
    try {
      const updateData = {
        scheduledDate: newScheduledDate,
        scheduledStartTime: newStartTime,
        scheduledEndTime: newEndTime,
        appointmentStatus: 'rescheduled' as const,
        rescheduleReason: reason,
        updatedAt: new Date()
      };

  const result = await this.update(appointmentId, updateData, context);
      
  await this.logAudit('reschedule', appointmentId, context, { 
        appointmentId, 
        newScheduledDate, 
        newStartTime, 
        newEndTime, 
        reason 
  });

  return result as Appointment | null;
    } catch (error) {
  throw error;
    }
  }

  /**
   * Buscar conflictos de horario para un doctor
   */
  async findScheduleConflicts(doctorId: string, scheduledDate: Date, startTime: string, endTime: string, excludeAppointmentId: string | undefined, context: ServiceContext): Promise<RepositoryResult<Appointment>> {
    try {
  const db = await this.ensureFirestore();
      
      // Crear fecha de inicio y fin del día
      const dayStart = new Date(scheduledDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(scheduledDate);
      dayEnd.setHours(23, 59, 59, 999);

      let query = db.collection(this.collectionName)
        .where('doctorId', '==', doctorId)
        .where('scheduledDate', '>=', dayStart)
        .where('scheduledDate', '<=', dayEnd)
        .where('appointmentStatus', 'in', ['scheduled', 'confirmed', 'in_progress']);

      const snapshot = await query.get();
      let appointments = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Appointment));

      // Filtrar por conflictos de horario y excluir cita actual si se especifica
      const conflicts = appointments.filter(apt => {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) {
          return false;
        }

        return this.hasTimeConflict(
          apt.scheduledStartTime, apt.scheduledEndTime,
          startTime, endTime
        );
      });

      await this.logAudit('check_conflicts', 'collection', context, { 
        doctorId, 
        scheduledDate, 
        startTime, 
        endTime,
        conflictsFound: conflicts.length 
      });

  return {
        data: conflicts,
        total: conflicts.length,
        hasMore: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar citas de telemedicina activas
   */
  async findActiveTelemedicine(context: ServiceContext): Promise<RepositoryResult<Appointment>> {
    try {
      const db = await this.ensureFirestore();
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const query = db.collection(this.collectionName)
        .where('isTelemedicine', '==', true)
        .where('appointmentStatus', 'in', ['confirmed', 'in_progress'])
        .where('scheduledDate', '>=', oneHourAgo);

      const snapshot = await query.get();
      const appointments = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Appointment));

      await this.logAudit('read_active_telemedicine', 'collection', context, { count: appointments.length });

  return {
        data: appointments,
        total: appointments.length,
        hasMore: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generar número único de cita
   */
  private generateAppointmentNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `APT${year}${month}${day}${random}`;
  }

  /**
   * Verificar conflictos de horario
   */
  private hasTimeConflict(existingStart: string, existingEnd: string, newStart: string, newEnd: string): boolean {
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes; // convertir a minutos
    };

    const existingStartMin = parseTime(existingStart);
    const existingEndMin = parseTime(existingEnd);
    const newStartMin = parseTime(newStart);
    const newEndMin = parseTime(newEnd);

    // Verificar si hay solapamiento
    return (
      (newStartMin < existingEndMin && newEndMin > existingStartMin) ||
      (existingStartMin < newEndMin && existingEndMin > newStartMin)
    );
  }
}

// Instancia singleton del repository
export const appointmentRepository = new AppointmentRepository();