/**
 * Appointment Service
 * Business logic for appointment management
 */

import type {
  Appointment,
  Patient,
  Doctor,
  TimeSlot,
  AppointmentStatus,
  AppointmentType,
  RecurrenceRule
} from '@altamedica/interfaces';

export class AppointmentService {
  /**
   * Check appointment availability
   */
  static checkAvailability(
    doctorId: string,
    requestedDate: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): AvailabilityCheck {
    const requestedEnd = new Date(requestedDate.getTime() + duration * 60000);
    
    const conflicts = existingAppointments.filter(apt => {
      if (apt.doctorId !== doctorId || apt.status === 'cancelled') return false;
      
      const aptStart = new Date(apt.date);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
      
      return (requestedDate >= aptStart && requestedDate < aptEnd) ||
             (requestedEnd > aptStart && requestedEnd <= aptEnd) ||
             (requestedDate <= aptStart && requestedEnd >= aptEnd);
    });
    
    const nearbySlots = this.findNearbyAvailableSlots(
      doctorId,
      requestedDate,
      duration,
      existingAppointments
    );
    
    return {
      available: conflicts.length === 0,
      conflicts,
      nearbySlots,
      nextAvailable: conflicts.length > 0 ? this.findNextAvailableSlot(
        doctorId,
        requestedDate,
        duration,
        existingAppointments
      ) : undefined
    };
  }
  
  /**
   * Validate appointment booking rules
   */
  static validateBooking(
    appointment: Partial<Appointment>,
    patient: Patient,
    doctor: Doctor
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Check appointment date is in future
    if (appointment.date) {
      const aptDate = new Date(appointment.date);
      if (aptDate <= new Date()) {
        errors.push({
          field: 'date',
          message: 'Appointment must be scheduled for future date',
          code: 'PAST_DATE'
        });
      }
      
      // Check if too far in advance
      const maxAdvanceDays = 180;
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
      if (aptDate > maxDate) {
        warnings.push(`Appointment is more than ${maxAdvanceDays} days in advance`);
      }
    }
    
    // Check patient age restrictions
    if (doctor.ageRestrictions) {
      const patientAge = this.calculateAge(patient.dateOfBirth);
      if (doctor.ageRestrictions.min && patientAge < doctor.ageRestrictions.min) {
        errors.push({
          field: 'patientId',
          message: `Patient age (${patientAge}) below doctor's minimum (${doctor.ageRestrictions.min})`,
          code: 'AGE_RESTRICTION'
        });
      }
      if (doctor.ageRestrictions.max && patientAge > doctor.ageRestrictions.max) {
        errors.push({
          field: 'patientId',
          message: `Patient age (${patientAge}) above doctor's maximum (${doctor.ageRestrictions.max})`,
          code: 'AGE_RESTRICTION'
        });
      }
    }
    
    // Check appointment duration
    if (appointment.duration) {
      if (appointment.duration < 15) {
        errors.push({
          field: 'duration',
          message: 'Appointment duration must be at least 15 minutes',
          code: 'INVALID_DURATION'
        });
      }
      if (appointment.duration > 180) {
        warnings.push('Appointment duration exceeds 3 hours');
      }
    }
    
    // Check for duplicate appointments
    if (patient.activeAppointments) {
      const duplicates = patient.activeAppointments.filter(apt => 
        apt.doctorId === appointment.doctorId &&
        apt.date === appointment.date
      );
      if (duplicates.length > 0) {
        warnings.push('Patient already has appointment with this doctor at same time');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Calculate appointment cost
   */
  static calculateCost(
    appointment: Appointment,
    doctor: Doctor,
    patient: Patient,
    insurance?: InsuranceCoverage
  ): CostBreakdown {
    let baseCost = doctor.consultationFee || 100;
    
    // Adjust for appointment type
    const typeMultipliers: Record<string, number> = {
      'consultation': 1.0,
      'follow-up': 0.7,
      'emergency': 1.5,
      'procedure': 2.0,
      'telemedicine': 0.8
    };
    
    baseCost *= typeMultipliers[appointment.type] || 1.0;
    
    // Adjust for duration
    const standardDuration = 30;
    const durationMultiplier = (appointment.duration || standardDuration) / standardDuration;
    baseCost *= durationMultiplier;
    
    // Apply insurance coverage
    let insuranceCoverage = 0;
    let patientResponsibility = baseCost;
    
    if (insurance) {
      if (insurance.isInNetwork) {
        insuranceCoverage = baseCost * (insurance.coveragePercentage / 100);
        patientResponsibility = baseCost - insuranceCoverage;
        
        // Apply deductible
        if (insurance.deductibleRemaining > 0) {
          const deductibleAmount = Math.min(insuranceCoverage, insurance.deductibleRemaining);
          insuranceCoverage -= deductibleAmount;
          patientResponsibility += deductibleAmount;
        }
        
        // Apply copay
        if (insurance.copay) {
          patientResponsibility = Math.max(insurance.copay, patientResponsibility);
        }
      } else {
        patientResponsibility = baseCost;
      }
    }
    
    // Apply discounts
    let discounts = 0;
    if (patient.isNewPatient === false && doctor.returningPatientDiscount) {
      discounts = patientResponsibility * (doctor.returningPatientDiscount / 100);
    }
    
    const finalCost = patientResponsibility - discounts;
    
    return {
      baseCost,
      insuranceCoverage,
      patientResponsibility: finalCost,
      breakdown: {
        consultationFee: doctor.consultationFee || 100,
        typeAdjustment: baseCost - (doctor.consultationFee || 100),
        insuranceAdjustment: -insuranceCoverage,
        discounts: -discounts
      },
      estimatedOnly: true,
      currency: 'USD'
    };
  }
  
  /**
   * Generate appointment reminders
   */
  static generateReminders(
    appointment: Appointment,
    preferences: ReminderPreferences
  ): AppointmentReminder[] {
    const reminders: AppointmentReminder[] = [];
    const appointmentDate = new Date(appointment.date);
    
    // 1 week before
    if (preferences.oneWeekBefore) {
      const reminderDate = new Date(appointmentDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      if (reminderDate > new Date()) {
        reminders.push({
          id: `${appointment.id}-1w`,
          appointmentId: appointment.id,
          scheduledFor: reminderDate,
          type: 'email',
          message: this.formatReminderMessage(appointment, '1 week'),
          status: 'scheduled'
        });
      }
    }
    
    // 1 day before
    if (preferences.oneDayBefore) {
      const reminderDate = new Date(appointmentDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      if (reminderDate > new Date()) {
        reminders.push({
          id: `${appointment.id}-1d`,
          appointmentId: appointment.id,
          scheduledFor: reminderDate,
          type: 'sms',
          message: this.formatReminderMessage(appointment, '24 hours'),
          status: 'scheduled'
        });
      }
    }
    
    // 2 hours before
    if (preferences.twoHoursBefore) {
      const reminderDate = new Date(appointmentDate);
      reminderDate.setHours(reminderDate.getHours() - 2);
      if (reminderDate > new Date()) {
        reminders.push({
          id: `${appointment.id}-2h`,
          appointmentId: appointment.id,
          scheduledFor: reminderDate,
          type: 'push',
          message: this.formatReminderMessage(appointment, '2 hours'),
          status: 'scheduled'
        });
      }
    }
    
    return reminders;
  }
  
  /**
   * Handle appointment rescheduling
   */
  static reschedule(
    originalAppointment: Appointment,
    newDate: Date,
    reason: string,
    existingAppointments: Appointment[]
  ): RescheduleResult {
    const availability = this.checkAvailability(
      originalAppointment.doctorId,
      newDate,
      originalAppointment.duration || 30,
      existingAppointments
    );
    
    if (!availability.available) {
      return {
        success: false,
        error: 'Requested time slot is not available',
        alternativeSlots: availability.nearbySlots
      };
    }
    
    const rescheduledAppointment: Appointment = {
      ...originalAppointment,
      date: newDate.toISOString(),
      status: 'rescheduled' as AppointmentStatus,
      rescheduleHistory: [
        ...(originalAppointment.rescheduleHistory || []),
        {
          originalDate: originalAppointment.date,
          newDate: newDate.toISOString(),
          reason,
          rescheduledAt: new Date().toISOString(),
          rescheduledBy: 'system'
        }
      ]
    };
    
    return {
      success: true,
      appointment: rescheduledAppointment,
      notifications: this.generateRescheduleNotifications(originalAppointment, rescheduledAppointment)
    };
  }
  
  /**
   * Create recurring appointments
   */
  static createRecurringAppointments(
    baseAppointment: Partial<Appointment>,
    recurrenceRule: RecurrenceRule,
    endDate: Date
  ): Appointment[] {
    const appointments: Appointment[] = [];
    let currentDate = new Date(baseAppointment.date!);
    const maxOccurrences = recurrenceRule.maxOccurrences || 52;
    let occurrenceCount = 0;
    
    while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
      appointments.push({
        ...baseAppointment as Appointment,
        id: `${baseAppointment.id}-${occurrenceCount}`,
        date: currentDate.toISOString(),
        recurrenceInfo: {
          seriesId: baseAppointment.id!,
          occurrenceNumber: occurrenceCount + 1,
          isRecurring: true
        }
      });
      
      // Calculate next occurrence
      switch (recurrenceRule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + (recurrenceRule.interval || 1));
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7 * (recurrenceRule.interval || 1));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + (recurrenceRule.interval || 1));
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + (recurrenceRule.interval || 1));
          break;
      }
      
      occurrenceCount++;
    }
    
    return appointments;
  }
  
  /**
   * Helper methods
   */
  private static findNearbyAvailableSlots(
    doctorId: string,
    requestedDate: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const searchRange = 7; // days
    
    for (let dayOffset = -searchRange; dayOffset <= searchRange; dayOffset++) {
      if (dayOffset === 0) continue;
      
      const checkDate = new Date(requestedDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      // Check morning, afternoon, evening slots
      const timeSlots = ['09:00', '14:00', '16:00'];
      
      timeSlots.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        checkDate.setHours(hours, minutes, 0, 0);
        
        const conflicts = existingAppointments.filter(apt => {
          if (apt.doctorId !== doctorId || apt.status === 'cancelled') return false;
          const aptDate = new Date(apt.date);
          return Math.abs(aptDate.getTime() - checkDate.getTime()) < duration * 60000;
        });
        
        if (conflicts.length === 0 && checkDate > new Date()) {
          slots.push({
            start: new Date(checkDate),
            end: new Date(checkDate.getTime() + duration * 60000),
            available: true
          });
        }
      });
    }
    
    return slots.slice(0, 5);
  }
  
  private static findNextAvailableSlot(
    doctorId: string,
    afterDate: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): Date {
    let checkDate = new Date(afterDate);
    checkDate.setHours(checkDate.getHours() + 1, 0, 0, 0);
    
    for (let attempts = 0; attempts < 100; attempts++) {
      const conflicts = existingAppointments.filter(apt => {
        if (apt.doctorId !== doctorId || apt.status === 'cancelled') return false;
        const aptDate = new Date(apt.date);
        return Math.abs(aptDate.getTime() - checkDate.getTime()) < duration * 60000;
      });
      
      if (conflicts.length === 0) {
        return checkDate;
      }
      
      checkDate.setHours(checkDate.getHours() + 1);
      
      // Skip to next day if past working hours
      if (checkDate.getHours() >= 18) {
        checkDate.setDate(checkDate.getDate() + 1);
        checkDate.setHours(9, 0, 0, 0);
      }
    }
    
    return checkDate;
  }
  
  private static calculateAge(dateOfBirth: Date | string): number {
    const dob = new Date(dateOfBirth);
    const ageDiff = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  
  private static formatReminderMessage(appointment: Appointment, timeframe: string): string {
    return `Reminder: You have an appointment scheduled in ${timeframe} on ${new Date(appointment.date).toLocaleString()}`;
  }
  
  private static generateRescheduleNotifications(
    original: Appointment,
    rescheduled: Appointment
  ): Notification[] {
    return [
      {
        type: 'email',
        recipient: 'patient',
        subject: 'Appointment Rescheduled',
        message: `Your appointment has been rescheduled from ${new Date(original.date).toLocaleString()} to ${new Date(rescheduled.date).toLocaleString()}`
      },
      {
        type: 'sms',
        recipient: 'patient',
        message: `Appointment rescheduled to ${new Date(rescheduled.date).toLocaleString()}`
      }
    ];
  }
}

/**
 * Types
 */
export interface AvailabilityCheck {
  available: boolean;
  conflicts: Appointment[];
  nearbySlots: TimeSlot[];
  nextAvailable?: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface InsuranceCoverage {
  isInNetwork: boolean;
  coveragePercentage: number;
  deductibleRemaining: number;
  copay?: number;
}

export interface CostBreakdown {
  baseCost: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  breakdown: {
    consultationFee: number;
    typeAdjustment: number;
    insuranceAdjustment: number;
    discounts: number;
  };
  estimatedOnly: boolean;
  currency: string;
}

export interface ReminderPreferences {
  oneWeekBefore: boolean;
  oneDayBefore: boolean;
  twoHoursBefore: boolean;
  preferredChannel: 'email' | 'sms' | 'push' | 'all';
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  scheduledFor: Date;
  type: 'email' | 'sms' | 'push';
  message: string;
  status: 'scheduled' | 'sent' | 'failed';
}

export interface RescheduleResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  alternativeSlots?: TimeSlot[];
  notifications?: Notification[];
}

export interface Notification {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  message: string;
}