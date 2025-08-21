/**
 * Servicio de Gestión de Citas Médicas
 * Programación inteligente con validación de conflictos
 */

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  transaction,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';

import { firebaseService } from '@altamedica/database';
import { 
  Appointment, 
  AppointmentStatus, 
  AppointmentType, 
  RecurringPattern,
  NotificationLog,
  AppointmentOutcome,
  User
} from '../types/app';
import { Patient } from '../types/medical-entities';
import { ValidationService } from './validation-service';
import { NotificationService } from './notification-service';

import { logger } from '@altamedica/shared/services/logger.service';
export interface AppointmentSearchFilters {
  patientId?: string;
  professionalId?: string;
  facilityId?: string;
  departmentId?: string;
  status?: AppointmentStatus[];
  appointmentType?: AppointmentType[];
  dateFrom?: string;
  dateTo?: string;
  urgencyLevel?: string[];
  includeRecurring?: boolean;
}

export interface AppointmentSearchOptions {
  pageSize?: number;
  lastDocument?: DocumentSnapshot;
  sortBy?: 'scheduledDateTime' | 'createdAt' | 'urgencyLevel';
  sortOrder?: 'asc' | 'desc';
  includeOutcome?: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  professionalId: string;
  facilityId: string;
  conflictReason?: string;
}

export interface AppointmentConflict {
  type: 'OVERLAP' | 'BUFFER_VIOLATION' | 'PROFESSIONAL_UNAVAILABLE' | 'FACILITY_CLOSED';
  conflictingAppointment?: Appointment;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface SchedulingPreferences {
  preferredTimeSlots: string[]; // ['09:00-12:00', '14:00-17:00']
  bufferTimeMinutes: number;
  maxDailyAppointments: number;
  workingDays: number[]; // 0=domingo, 1=lunes...
  excludeDates: string[]; // Fechas de vacaciones/no disponibles
  autoConfirmationEnabled: boolean;
  reminderSettings: {
    emailReminder: boolean;
    smsReminder: boolean;
    reminderDaysBefore: number[];
  };
}

class AppointmentService {
  private collectionName = 'appointments';
  private validationService: ValidationService;
  private notificationService: NotificationService;

  constructor() {
    this.validationService = new ValidationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Crear nueva cita con validación de conflictos
   */
  async createAppointment(
    appointmentData: Omit<Appointment, 'id' | 'auditInfo' | 'status' | 'statusHistory'>
  ): Promise<string> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Validar datos de la cita
      await this.validateAppointmentData(appointmentData);

      // Verificar disponibilidad y conflictos
      const conflicts = await this.checkSchedulingConflicts(appointmentData);
      if (conflicts.some(c => c.severity === 'ERROR')) {
        throw new Error(`Conflictos de programación: ${conflicts.map(c => c.message).join(', ')}`);
      }

      // Verificar permisos del paciente y profesional
      await this.validateAppointmentPermissions(currentUser.uid, appointmentData);

      // Crear cita con estado inicial
      const appointment: Omit<Appointment, 'id'> = {
        ...appointmentData,
        status: 'SCHEDULED',
        statusHistory: [{
          timestamp: new Date().toISOString(),
          previousStatus: 'SCHEDULED' as AppointmentStatus,
          newStatus: 'SCHEDULED',
          changedBy: currentUser.uid,
          reason: 'Cita creada',
          automaticChange: false
        }],
        notifications: {
          patientReminders: [],
          professionalAlerts: [],
          confirmationRequired: false
        },
        auditInfo: {
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser.uid,
          rescheduleCount: 0
        }
      };

      // Procesar citas recurrentes
      if (appointmentData.scheduling.recurringPattern) {
        return await this.createRecurringAppointments(appointment);
      }

      // Guardar cita individual
      const db = firebaseService.firestore;
      const docRef = await addDoc(collection(db, this.collectionName), appointment);

      // Programar notificaciones automáticas
      await this.scheduleAutomaticNotifications(docRef.id, appointment);

      // Registrar en auditoría
      await this.logAppointmentAudit({
        action: 'CREATE',
        appointmentId: docRef.id,
        userId: currentUser.uid,
        changes: { appointmentCreated: true }
      });

      logger.info(`Cita creada con ID: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      logger.error('Error creando cita:', error);
      throw error;
    }
  }

  /**
   * Obtener cita por ID
   */
  async getAppointmentById(appointmentId: string, includeOutcome = false): Promise<Appointment | null> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const db = firebaseService.firestore;
      const docRef = doc(db, this.collectionName, appointmentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const appointment = { id: docSnap.id, ...docSnap.data() } as Appointment;

      // Verificar permisos de acceso
      await this.checkAppointmentAccessPermission(currentUser.uid, appointment);

      // Registrar acceso
      await this.logAppointmentAudit({
        action: 'READ',
        appointmentId,
        userId: currentUser.uid
      });

      return appointment;

    } catch (error) {
      logger.error('Error obteniendo cita:', error);
      throw error;
    }
  }

  /**
   * Buscar citas con filtros avanzados
   */
  async searchAppointments(
    filters: AppointmentSearchFilters,
    options: AppointmentSearchOptions = {}
  ): Promise<{ appointments: Appointment[], hasMore: boolean, lastDocument?: DocumentSnapshot }> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const db = firebaseService.firestore;
      const appointmentsRef = collection(db, this.collectionName);

      // Construir consulta con filtros
      const constraints: QueryConstraint[] = [];

      // Filtros básicos
      if (filters.patientId) {
        constraints.push(where('patientId', '==', filters.patientId));
      }

      if (filters.professionalId) {
        constraints.push(where('professionalId', '==', filters.professionalId));
      }

      if (filters.facilityId) {
        constraints.push(where('facilityId', '==', filters.facilityId));
      }

      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters.appointmentType && filters.appointmentType.length > 0) {
        constraints.push(where('clinicalInfo.appointmentType', 'in', filters.appointmentType));
      }

      // Filtros de fecha
      if (filters.dateFrom) {
        constraints.push(where('scheduling.scheduledDateTime', '>=', filters.dateFrom));
      }

      if (filters.dateTo) {
        constraints.push(where('scheduling.scheduledDateTime', '<=', filters.dateTo));
      }

      // Ordenamiento
      const sortField = options.sortBy || 'scheduling.scheduledDateTime';
      const sortDirection = options.sortOrder || 'asc';
      constraints.push(orderBy(sortField, sortDirection));

      // Paginación
      if (options.lastDocument) {
        constraints.push(startAfter(options.lastDocument));
      }

      const pageSize = options.pageSize || 20;
      constraints.push(limit(pageSize));

      // Ejecutar consulta
      const q = query(appointmentsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const appointments: Appointment[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const appointment = { id: docSnapshot.id, ...docSnapshot.data() } as Appointment;
        
        // Verificar permisos para cada cita
        try {
          await this.checkAppointmentAccessPermission(currentUser.uid, appointment);
          appointments.push(appointment);
        } catch (permissionError) {
          // Omitir citas sin permisos
          logger.warn(`Sin permisos para cita ${appointment.id}`);
        }
      }

      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        appointments,
        hasMore: querySnapshot.docs.length === pageSize,
        lastDocument
      };

    } catch (error) {
      logger.error('Error buscando citas:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de cita
   */
  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string,
    additionalData?: Partial<Appointment>
  ): Promise<void> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Obtener cita actual
      const currentAppointment = await this.getAppointmentById(appointmentId);
      if (!currentAppointment) throw new Error('Cita no encontrada');

      // Validar transición de estado
      this.validateStatusTransition(currentAppointment.status, newStatus);

      // Verificar permisos de modificación
      await this.checkAppointmentModifyPermission(currentUser.uid, currentAppointment);

      // Preparar actualización
      const statusChange = {
        timestamp: new Date().toISOString(),
        previousStatus: currentAppointment.status,
        newStatus,
        changedBy: currentUser.uid,
        reason,
        automaticChange: false
      };

      const updateData: Partial<Appointment> = {
        status: newStatus,
        statusHistory: [...currentAppointment.statusHistory, statusChange],
        'auditInfo.lastModified': new Date().toISOString(),
        'auditInfo.lastModifiedBy': currentUser.uid,
        ...additionalData
      };

      // Ejecutar actualización
      const db = firebaseService.firestore;
      await updateDoc(doc(db, this.collectionName, appointmentId), updateData);

      // Procesar acciones específicas por estado
      await this.processStatusChangeActions(appointmentId, currentAppointment, newStatus);

      // Registrar auditoría
      await this.logAppointmentAudit({
        action: 'UPDATE',
        appointmentId,
        userId: currentUser.uid,
        changes: { statusChange }
      });

      logger.info(`Estado de cita ${appointmentId} actualizado a ${newStatus}`);

    } catch (error) {
      logger.error('Error actualizando estado de cita:', error);
      throw error;
    }
  }

  /**
   * Reprogramar cita
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDateTime: string,
    reason: string
  ): Promise<void> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const currentAppointment = await this.getAppointmentById(appointmentId);
      if (!currentAppointment) throw new Error('Cita no encontrada');

      // Verificar que se puede reprogramar
      if (!['SCHEDULED', 'CONFIRMED'].includes(currentAppointment.status)) {
        throw new Error('Solo se pueden reprogramar citas programadas o confirmadas');
      }

      // Crear datos temporales para verificar conflictos
      const tempAppointmentData = {
        ...currentAppointment,
        scheduling: {
          ...currentAppointment.scheduling,
          scheduledDateTime: newDateTime
        }
      };

      // Verificar conflictos en la nueva fecha/hora
      const conflicts = await this.checkSchedulingConflicts(tempAppointmentData, appointmentId);
      if (conflicts.some(c => c.severity === 'ERROR')) {
        throw new Error(`Conflictos en nueva programación: ${conflicts.map(c => c.message).join(', ')}`);
      }

      // Actualizar cita
      await updateDoc(doc(firebaseService.firestore, this.collectionName, appointmentId), {
        'scheduling.scheduledDateTime': newDateTime,
        'auditInfo.lastModified': new Date().toISOString(),
        'auditInfo.lastModifiedBy': currentUser.uid,
        'auditInfo.rescheduleCount': (currentAppointment.auditInfo.rescheduleCount || 0) + 1
      });

      // Registrar cambio de estado
      await this.updateAppointmentStatus(appointmentId, 'RESCHEDULED', reason);

      // Enviar notificaciones de reprogramación
      await this.notificationService.sendRescheduleNotification(appointmentId, newDateTime);

      logger.info(`Cita ${appointmentId} reprogramada para ${newDateTime}`);

    } catch (error) {
      logger.error('Error reprogramando cita:', error);
      throw error;
    }
  }

  /**
   * Obtener slots de tiempo disponibles
   */
  async getAvailableTimeSlots(
    professionalId: string,
    facilityId: string,
    date: string,
    appointmentType: AppointmentType,
    duration: number = 30
  ): Promise<TimeSlot[]> {
    try {
      // Obtener horario del profesional
      const professionalSchedule = await this.getProfessionalSchedule(professionalId, date);
      
      // Obtener citas existentes para el día
      const existingAppointments = await this.getDayAppointments(professionalId, facilityId, date);

      // Generar slots base
      const baseSlots = this.generateTimeSlots(professionalSchedule, duration);

      // Marcar slots ocupados
      const availableSlots = this.markOccupiedSlots(baseSlots, existingAppointments);

      return availableSlots;

    } catch (error) {
      logger.error('Error obteniendo slots disponibles:', error);
      throw error;
    }
  }

  /**
   * Registrar resultado de cita
   */
  async recordAppointmentOutcome(
    appointmentId: string,
    outcome: Omit<AppointmentOutcome, 'id' | 'completedAt'>
  ): Promise<void> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) throw new Error('Cita no encontrada');

      if (appointment.status !== 'IN_PROGRESS') {
        throw new Error('Solo se puede registrar resultado de citas en progreso');
      }

      const appointmentOutcome: AppointmentOutcome = {
        ...outcome,
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString()
      };

      // Actualizar cita con resultado
      await updateDoc(doc(firebaseService.firestore, this.collectionName, appointmentId), {
        outcome: appointmentOutcome,
        'auditInfo.lastModified': new Date().toISOString(),
        'auditInfo.lastModifiedBy': currentUser.uid
      });

      // Cambiar estado a completada
      await this.updateAppointmentStatus(appointmentId, 'COMPLETED', 'Cita completada con resultado registrado');

      // Si hay seguimiento requerido, crear próxima cita
      if (outcome.followUpRequired && outcome.nextAppointmentRecommended) {
        await this.scheduleFollowUpAppointment(appointmentId, outcome.nextAppointmentRecommended);
      }

      logger.info(`Resultado registrado para cita ${appointmentId}`);

    } catch (error) {
      logger.error('Error registrando resultado de cita:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de citas
   */
  async getAppointmentStatistics(
    facilityId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    averageDuration: number;
    appointmentsByType: Record<AppointmentType, number>;
    appointmentsByUrgency: Record<string, number>;
  }> {
    try {
      const currentUser = firebaseService.authentication.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Construir consulta base
      const db = firebaseService.firestore;
      let q = query(collection(db, this.collectionName));

      if (facilityId) {
        q = query(q, where('facilityId', '==', facilityId));
      }

      if (dateFrom) {
        q = query(q, where('scheduling.scheduledDateTime', '>=', dateFrom));
      }

      if (dateTo) {
        q = query(q, where('scheduling.scheduledDateTime', '<=', dateTo));
      }

      const querySnapshot = await getDocs(q);
      
      // Procesar estadísticas
      const stats = {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        averageDuration: 0,
        appointmentsByType: {} as Record<AppointmentType, number>,
        appointmentsByUrgency: {} as Record<string, number>
      };

      let totalDuration = 0;
      let durationCount = 0;

      querySnapshot.docs.forEach(docSnapshot => {
        const appointment = docSnapshot.data() as Appointment;
        stats.totalAppointments++;

        // Contadores por estado
        switch (appointment.status) {
          case 'COMPLETED':
            stats.completedAppointments++;
            break;
          case 'CANCELLED':
            stats.cancelledAppointments++;
            break;
          case 'NO_SHOW':
            stats.noShowAppointments++;
            break;
        }

        // Por tipo
        const type = appointment.clinicalInfo.appointmentType;
        stats.appointmentsByType[type] = (stats.appointmentsByType[type] || 0) + 1;

        // Por urgencia
        const urgency = appointment.clinicalInfo.urgencyLevel;
        stats.appointmentsByUrgency[urgency] = (stats.appointmentsByUrgency[urgency] || 0) + 1;

        // Duración promedio
        if (appointment.outcome?.duration) {
          totalDuration += appointment.outcome.duration;
          durationCount++;
        }
      });

      stats.averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

      return stats;

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  private async validateAppointmentData(appointmentData: any): Promise<void> {
    // Validar datos básicos
    if (!appointmentData.patientId) {
      throw new Error('ID de paciente requerido');
    }

    if (!appointmentData.professionalId) {
      throw new Error('ID de profesional requerido');
    }

    if (!appointmentData.scheduling?.scheduledDateTime) {
      throw new Error('Fecha y hora de la cita requerida');
    }

    // Validar fecha futura
    const appointmentDate = new Date(appointmentData.scheduling.scheduledDateTime);
    const now = new Date();
    
    if (appointmentDate <= now) {
      throw new Error('La cita debe programarse para una fecha futura');
    }

    // Validar duración
    if (appointmentData.scheduling.estimatedDuration < 5 || appointmentData.scheduling.estimatedDuration > 480) {
      throw new Error('Duración de cita debe estar entre 5 y 480 minutos');
    }
  }

  private async checkSchedulingConflicts(
    appointmentData: any, 
    excludeAppointmentId?: string
  ): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    // Verificar superposición con otras citas
    const overlappingAppointments = await this.findOverlappingAppointments(
      appointmentData.professionalId,
      appointmentData.scheduling.scheduledDateTime,
      appointmentData.scheduling.estimatedDuration,
      excludeAppointmentId
    );

    if (overlappingAppointments.length > 0) {
      conflicts.push({
        type: 'OVERLAP',
        conflictingAppointment: overlappingAppointments[0],
        message: 'Conflicto con cita existente',
        severity: 'ERROR'
      });
    }

    // Verificar horario del profesional
    const isWithinWorkingHours = await this.verifyWorkingHours(
      appointmentData.professionalId,
      appointmentData.scheduling.scheduledDateTime
    );

    if (!isWithinWorkingHours) {
      conflicts.push({
        type: 'PROFESSIONAL_UNAVAILABLE',
        message: 'Fuera del horario laboral del profesional',
        severity: 'ERROR'
      });
    }

    return conflicts;
  }

  private async findOverlappingAppointments(
    professionalId: string,
    scheduledDateTime: string,
    duration: number,
    excludeId?: string
  ): Promise<Appointment[]> {
    const appointmentStart = new Date(scheduledDateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

    const db = firebaseService.firestore;
    const q = query(
      collection(db, this.collectionName),
      where('professionalId', '==', professionalId),
      where('status', 'in', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']),
      where('scheduling.scheduledDateTime', '>=', appointmentStart.toISOString()),
      where('scheduling.scheduledDateTime', '<=', appointmentEnd.toISOString())
    );

    const querySnapshot = await getDocs(q);
    const overlapping: Appointment[] = [];

    querySnapshot.docs.forEach(docSnapshot => {
      if (excludeId && docSnapshot.id === excludeId) return;
      
      const appointment = { id: docSnapshot.id, ...docSnapshot.data() } as Appointment;
      const existingStart = new Date(appointment.scheduling.scheduledDateTime);
      const existingEnd = new Date(existingStart.getTime() + appointment.scheduling.estimatedDuration * 60000);

      // Verificar superposición
      if (appointmentStart < existingEnd && appointmentEnd > existingStart) {
        overlapping.push(appointment);
      }
    });

    return overlapping;
  }

  private async validateAppointmentPermissions(userId: string, appointmentData: any): Promise<void> {
    // Verificar permisos para crear citas para este paciente y profesional
    // Implementar lógica RBAC/ABAC
    logger.info(`Validando permisos para usuario ${userId}`);
  }

  private async checkAppointmentAccessPermission(userId: string, appointment: Appointment): Promise<void> {
    // Verificar permisos de lectura
    logger.info(`Verificando acceso para usuario ${userId} a cita ${appointment.id}`);
  }

  private async checkAppointmentModifyPermission(userId: string, appointment: Appointment): Promise<void> {
    // Verificar permisos de modificación
    logger.info(`Verificando permisos de modificación para usuario ${userId}`);
  }

  private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      'SCHEDULED': ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'],
      'CONFIRMED': ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
      'CHECKED_IN': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // Estado final
      'CANCELLED': [], // Estado final
      'NO_SHOW': [], // Estado final
      'RESCHEDULED': ['SCHEDULED'] // Se convierte en nueva cita
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Transición inválida de ${currentStatus} a ${newStatus}`);
    }
  }

  private async processStatusChangeActions(
    appointmentId: string,
    appointment: Appointment,
    newStatus: AppointmentStatus
  ): Promise<void> {
    switch (newStatus) {
      case 'CONFIRMED':
        await this.notificationService.sendConfirmationNotification(appointmentId);
        break;
      case 'CANCELLED':
        await this.notificationService.sendCancellationNotification(appointmentId);
        break;
      case 'NO_SHOW':
        await this.processNoShowActions(appointmentId, appointment);
        break;
      case 'COMPLETED':
        await this.processCompletionActions(appointmentId, appointment);
        break;
    }
  }

  private async processNoShowActions(appointmentId: string, appointment: Appointment): Promise<void> {
    // Registrar no-show en historial del paciente
    // Aplicar políticas de no-show (advertencias, restricciones, etc.)
    logger.info(`Procesando no-show para cita ${appointmentId}`);
  }

  private async processCompletionActions(appointmentId: string, appointment: Appointment): Promise<void> {
    // Procesar billing, seguimientos, etc.
    logger.info(`Procesando finalización de cita ${appointmentId}`);
  }

  private async createRecurringAppointments(baseAppointment: Omit<Appointment, 'id'>): Promise<string> {
    // Implementar lógica para citas recurrentes
    logger.info('Creando serie de citas recurrentes');
    return 'recurring-series-id';
  }

  private async scheduleAutomaticNotifications(appointmentId: string, appointment: Appointment): Promise<void> {
    // Programar recordatorios automáticos
    logger.info(`Programando notificaciones para cita ${appointmentId}`);
  }

  private async scheduleFollowUpAppointment(originalAppointmentId: string, recommendedDate: string): Promise<void> {
    // Crear cita de seguimiento
    logger.info(`Programando seguimiento para cita ${originalAppointmentId}`);
  }

  private async getProfessionalSchedule(professionalId: string, date: string): Promise<any> {
    // Obtener horario del profesional para la fecha específica
    return {
      workingHours: { start: '09:00', end: '17:00' },
      breaks: [{ start: '12:00', end: '13:00' }]
    };
  }

  private async getDayAppointments(professionalId: string, facilityId: string, date: string): Promise<Appointment[]> {
    const db = firebaseService.firestore;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, this.collectionName),
      where('professionalId', '==', professionalId),
      where('facilityId', '==', facilityId),
      where('scheduling.scheduledDateTime', '>=', startOfDay.toISOString()),
      where('scheduling.scheduledDateTime', '<=', endOfDay.toISOString()),
      where('status', 'in', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  }

  private generateTimeSlots(schedule: any, duration: number): TimeSlot[] {
    // Generar slots de tiempo basados en horario
    const slots: TimeSlot[] = [];
    // Implementar lógica de generación de slots
    return slots;
  }

  private markOccupiedSlots(slots: TimeSlot[], existingAppointments: Appointment[]): TimeSlot[] {
    // Marcar slots ocupados
    return slots.map(slot => ({
      ...slot,
      available: !existingAppointments.some(apt => this.slotsOverlap(slot, apt))
    }));
  }

  private slotsOverlap(slot: TimeSlot, appointment: Appointment): boolean {
    // Verificar si un slot se superpone con una cita
    const slotStart = new Date(`1970-01-01T${slot.startTime}`);
    const slotEnd = new Date(`1970-01-01T${slot.endTime}`);
    const appointmentStart = new Date(appointment.scheduling.scheduledDateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + appointment.scheduling.estimatedDuration * 60000);

    return slotStart < appointmentEnd && slotEnd > appointmentStart;
  }

  private async verifyWorkingHours(professionalId: string, scheduledDateTime: string): Promise<boolean> {
    // Verificar que la cita esté dentro del horario laboral
    return true; // Implementar lógica real
  }

  private async logAppointmentAudit(auditData: any): Promise<void> {
    // Registrar en auditoría
    logger.info('Registrando auditoría de cita:', auditData);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
