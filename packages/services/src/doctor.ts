/**
 * Doctor Service
 * Business logic for doctor operations
 */

import type {
  Doctor,
  Patient,
  Appointment,
  MedicalRecord,
  Schedule,
  Specialization,
  Availability
} from '@altamedica/interfaces';

export class DoctorService {
  /**
   * Calculate doctor workload and availability
   */
  static calculateWorkload(doctor: Doctor, appointments: Appointment[]): WorkloadAnalysis {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });
    
    const dailyLoad = new Map<string, number>();
    weekAppointments.forEach(apt => {
      const date = new Date(apt.date).toISOString().split('T')[0];
      dailyLoad.set(date, (dailyLoad.get(date) || 0) + 1);
    });
    
    const totalHours = weekAppointments.reduce((sum, apt) => sum + (apt.duration || 30), 0) / 60;
    const averageDailyPatients = weekAppointments.length / 7;
    const peakDay = Array.from(dailyLoad.entries()).sort((a, b) => b[1] - a[1])[0];
    
    return {
      weeklyPatients: weekAppointments.length,
      totalHours,
      averageDailyPatients,
      peakDay: peakDay ? { date: peakDay[0], patients: peakDay[1] } : undefined,
      utilizationRate: (totalHours / 40) * 100,
      recommendations: this.generateWorkloadRecommendations(totalHours, weekAppointments.length)
    };
  }
  
  /**
   * Verify doctor credentials and certifications
   */
  static verifyCredentials(doctor: Doctor): CredentialVerification {
    const issues: string[] = [];
    const warnings: string[] = [];
    let valid = true;
    
    // Check license expiration
    if (doctor.licenseNumber) {
      const licenseExpiry = doctor.licenseExpiry ? new Date(doctor.licenseExpiry) : null;
      if (licenseExpiry) {
        const daysUntilExpiry = Math.floor((licenseExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          valid = false;
          issues.push(`Medical license expired ${Math.abs(daysUntilExpiry)} days ago`);
        } else if (daysUntilExpiry < 90) {
          warnings.push(`Medical license expires in ${daysUntilExpiry} days`);
        }
      }
    } else {
      valid = false;
      issues.push('No medical license number on file');
    }
    
    // Check certifications
    if (doctor.certifications) {
      doctor.certifications.forEach(cert => {
        if (cert.expiryDate) {
          const certExpiry = new Date(cert.expiryDate);
          const daysUntilExpiry = Math.floor((certExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry < 0) {
            issues.push(`Certification '${cert.name}' expired`);
          } else if (daysUntilExpiry < 60) {
            warnings.push(`Certification '${cert.name}' expires in ${daysUntilExpiry} days`);
          }
        }
      });
    }
    
    // Check malpractice insurance
    if (doctor.malpracticeInsurance) {
      const insuranceExpiry = new Date(doctor.malpracticeInsurance.expiryDate);
      const daysUntilExpiry = Math.floor((insuranceExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        valid = false;
        issues.push('Malpractice insurance expired');
      } else if (daysUntilExpiry < 30) {
        warnings.push(`Malpractice insurance expires in ${daysUntilExpiry} days`);
      }
    } else {
      valid = false;
      issues.push('No malpractice insurance on file');
    }
    
    return {
      valid,
      issues,
      warnings,
      lastVerified: new Date(),
      nextVerificationDue: this.calculateNextVerificationDate()
    };
  }
  
  /**
   * Match doctor specializations with patient needs
   */
  static matchSpecialization(
    doctor: Doctor,
    patientCondition: string,
    urgency: 'routine' | 'urgent' | 'emergency'
  ): SpecializationMatch {
    const primaryMatch = doctor.specializations?.some(spec => 
      this.conditionMatchesSpecialization(patientCondition, spec)
    ) || false;
    
    const secondaryMatch = doctor.secondarySpecializations?.some(spec =>
      this.conditionMatchesSpecialization(patientCondition, spec)
    ) || false;
    
    let matchScore = 0;
    if (primaryMatch) matchScore = 100;
    else if (secondaryMatch) matchScore = 70;
    else matchScore = this.calculateGeneralMatchScore(doctor, patientCondition);
    
    const canHandle = urgency === 'emergency' ? 
      doctor.emergencyAvailable || false :
      matchScore >= 50;
    
    return {
      matchScore,
      primaryMatch,
      secondaryMatch,
      canHandle,
      recommendedAlternatives: canHandle ? [] : this.findAlternativeSpecializations(patientCondition)
    };
  }
  
  /**
   * Generate doctor performance metrics
   */
  static generatePerformanceMetrics(
    doctor: Doctor,
    appointments: Appointment[],
    patientFeedback: PatientFeedback[]
  ): PerformanceMetrics {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');
    
    const patientSatisfaction = patientFeedback.length > 0 ?
      patientFeedback.reduce((sum, fb) => sum + fb.rating, 0) / patientFeedback.length : 0;
    
    const onTimeRate = completedAppointments.filter(apt => apt.startedOnTime).length / 
      completedAppointments.length * 100;
    
    const metrics: PerformanceMetrics = {
      totalPatientsSeen: completedAppointments.length,
      averageAppointmentDuration: this.calculateAverageAppointmentDuration(completedAppointments),
      patientSatisfactionScore: patientSatisfaction,
      onTimePercentage: onTimeRate,
      cancellationRate: (cancelledAppointments.length / appointments.length) * 100,
      specialtyUtilization: this.calculateSpecialtyUtilization(doctor, completedAppointments),
      revenueGenerated: this.calculateRevenue(completedAppointments),
      qualityIndicators: {
        patientRetentionRate: this.calculateRetentionRate(appointments),
        referralRate: this.calculateReferralRate(patientFeedback),
        complaintRate: this.calculateComplaintRate(patientFeedback)
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    };
    
    return metrics;
  }
  
  /**
   * Optimize doctor schedule
   */
  static optimizeSchedule(
    doctor: Doctor,
    appointments: Appointment[],
    preferences: SchedulePreferences
  ): OptimizedSchedule {
    const schedule: OptimizedSchedule = {
      slots: [],
      breaks: [],
      efficiency: 0,
      recommendations: []
    };
    
    // Sort appointments by time
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group appointments by day
    const dailyGroups = new Map<string, Appointment[]>();
    sortedAppointments.forEach(apt => {
      const date = new Date(apt.date).toISOString().split('T')[0];
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, []);
      }
      dailyGroups.get(date)!.push(apt);
    });
    
    // Optimize each day
    dailyGroups.forEach((dayAppointments, date) => {
      const optimizedDay = this.optimizeDailySchedule(dayAppointments, preferences);
      schedule.slots.push(...optimizedDay.slots);
      schedule.breaks.push(...optimizedDay.breaks);
    });
    
    // Calculate efficiency
    const totalWorkTime = schedule.slots.reduce((sum, slot) => sum + slot.duration, 0);
    const totalAvailableTime = preferences.workHoursPerDay * dailyGroups.size * 60;
    schedule.efficiency = (totalWorkTime / totalAvailableTime) * 100;
    
    // Generate recommendations
    if (schedule.efficiency < 70) {
      schedule.recommendations.push('Consider consolidating appointment times');
    }
    if (schedule.efficiency > 95) {
      schedule.recommendations.push('Schedule is too packed - add buffer time between appointments');
    }
    
    return schedule;
  }
  
  /**
   * Helper methods
   */
  private static generateWorkloadRecommendations(totalHours: number, patientCount: number): string[] {
    const recommendations: string[] = [];
    
    if (totalHours > 50) {
      recommendations.push('Workload exceeds recommended hours - consider delegation');
    }
    if (patientCount > 100) {
      recommendations.push('High patient volume - ensure quality is maintained');
    }
    if (totalHours < 20) {
      recommendations.push('Low utilization - consider accepting more appointments');
    }
    
    return recommendations;
  }
  
  private static calculateNextVerificationDate(): Date {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 12);
    return nextDate;
  }
  
  private static conditionMatchesSpecialization(condition: string, specialization: string): boolean {
    const specializationMap: Record<string, string[]> = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular', 'hypertension'],
      'neurology': ['brain', 'neurological', 'seizure', 'headache'],
      'orthopedics': ['bone', 'joint', 'fracture', 'musculoskeletal'],
      'pediatrics': ['child', 'infant', 'adolescent'],
      'psychiatry': ['mental', 'depression', 'anxiety', 'psychiatric']
    };
    
    const keywords = specializationMap[specialization.toLowerCase()] || [];
    return keywords.some(keyword => condition.toLowerCase().includes(keyword));
  }
  
  private static calculateGeneralMatchScore(doctor: Doctor, condition: string): number {
    if (doctor.specializations?.includes('general practice') || 
        doctor.specializations?.includes('family medicine')) {
      return 60;
    }
    return 30;
  }
  
  private static findAlternativeSpecializations(condition: string): string[] {
    return ['General Practice', 'Internal Medicine'];
  }
  
  private static calculateAverageAppointmentDuration(appointments: Appointment[]): number {
    if (appointments.length === 0) return 0;
    const totalDuration = appointments.reduce((sum, apt) => sum + (apt.duration || 30), 0);
    return totalDuration / appointments.length;
  }
  
  private static calculateSpecialtyUtilization(doctor: Doctor, appointments: Appointment[]): number {
    if (!doctor.specializations || doctor.specializations.length === 0) return 0;
    
    const specialtyAppointments = appointments.filter(apt => 
      apt.type && doctor.specializations?.includes(apt.type)
    );
    
    return (specialtyAppointments.length / appointments.length) * 100;
  }
  
  private static calculateRevenue(appointments: Appointment[]): number {
    return appointments.reduce((sum, apt) => sum + (apt.fee || 0), 0);
  }
  
  private static calculateRetentionRate(appointments: Appointment[]): number {
    const patientMap = new Map<string, number>();
    appointments.forEach(apt => {
      patientMap.set(apt.patientId, (patientMap.get(apt.patientId) || 0) + 1);
    });
    
    const returningPatients = Array.from(patientMap.values()).filter(count => count > 1).length;
    return (returningPatients / patientMap.size) * 100;
  }
  
  private static calculateReferralRate(feedback: PatientFeedback[]): number {
    const referrals = feedback.filter(fb => fb.wouldRecommend).length;
    return feedback.length > 0 ? (referrals / feedback.length) * 100 : 0;
  }
  
  private static calculateComplaintRate(feedback: PatientFeedback[]): number {
    const complaints = feedback.filter(fb => fb.hasComplaint).length;
    return feedback.length > 0 ? (complaints / feedback.length) * 100 : 0;
  }
  
  private static optimizeDailySchedule(
    appointments: Appointment[],
    preferences: SchedulePreferences
  ): { slots: TimeSlot[], breaks: Break[] } {
    const slots: TimeSlot[] = [];
    const breaks: Break[] = [];
    
    appointments.forEach((apt, index) => {
      slots.push({
        start: new Date(apt.date),
        end: new Date(new Date(apt.date).getTime() + (apt.duration || 30) * 60000),
        duration: apt.duration || 30,
        appointmentId: apt.id
      });
      
      if (index > 0 && index % 4 === 0 && preferences.includeBreaks) {
        breaks.push({
          start: new Date(new Date(apt.date).getTime() + (apt.duration || 30) * 60000),
          duration: 15,
          type: 'short'
        });
      }
    });
    
    return { slots, breaks };
  }
}

/**
 * Types
 */
export interface WorkloadAnalysis {
  weeklyPatients: number;
  totalHours: number;
  averageDailyPatients: number;
  peakDay?: {
    date: string;
    patients: number;
  };
  utilizationRate: number;
  recommendations: string[];
}

export interface CredentialVerification {
  valid: boolean;
  issues: string[];
  warnings: string[];
  lastVerified: Date;
  nextVerificationDue: Date;
}

export interface SpecializationMatch {
  matchScore: number;
  primaryMatch: boolean;
  secondaryMatch: boolean;
  canHandle: boolean;
  recommendedAlternatives: string[];
}

export interface PerformanceMetrics {
  totalPatientsSeen: number;
  averageAppointmentDuration: number;
  patientSatisfactionScore: number;
  onTimePercentage: number;
  cancellationRate: number;
  specialtyUtilization: number;
  revenueGenerated: number;
  qualityIndicators: {
    patientRetentionRate: number;
    referralRate: number;
    complaintRate: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export interface SchedulePreferences {
  workHoursPerDay: number;
  includeBreaks: boolean;
  preferredStartTime: string;
  preferredEndTime: string;
}

export interface OptimizedSchedule {
  slots: TimeSlot[];
  breaks: Break[];
  efficiency: number;
  recommendations: string[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number;
  appointmentId: string;
}

export interface Break {
  start: Date;
  duration: number;
  type: 'short' | 'lunch' | 'administrative';
}

export interface PatientFeedback {
  rating: number;
  wouldRecommend: boolean;
  hasComplaint: boolean;
  comments?: string;
}