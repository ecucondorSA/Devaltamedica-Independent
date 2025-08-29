/**
 * Doctor Service
 * Business logic for doctor operations
 */

import { Appointment, Doctor } from '@altamedica/interfaces';

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

    // Verify license number
    if (!doctor.licenseNumber || doctor.licenseNumber.length < 6) {
      issues.push('Invalid license number');
    }

    // Verify specialties
    if (!doctor.specialties || doctor.specialties.length === 0) {
      issues.push('No specialties defined');
    }

    // Verify contact information
    if (!doctor.email || !doctor.phoneNumber) {
      issues.push('Missing contact information');
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 20))
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
    const primaryMatch = doctor.specialties?.some(spec =>
      this.conditionMatchesSpecialization(patientCondition, spec)
    ) || false;

    const secondaryMatch = doctor.specialties?.some(spec =>
      this.conditionMatchesSpecialization(patientCondition, spec)
    ) || false;

    let matchScore = 0;
    if (primaryMatch) matchScore = 100;
    else if (secondaryMatch) matchScore = 70;
    else matchScore = this.calculateGeneralMatchScore(doctor, patientCondition);

    const canHandle = urgency === 'emergency' ?
      false : // emergencyAvailable no existe en la interfaz
      matchScore >= 50;

    return {
      doctorId: doctor.id,
      matchScore,
      canHandle,
      primaryMatch,
      secondaryMatch,
      urgency,
      recommendedAlternatives: canHandle ? [] : this.findAlternativeSpecializations(patientCondition)
    };
  }

  /**
   * Optimize doctor schedule based on preferences and constraints
   */
  static optimizeSchedule(
    doctor: Doctor,
    appointments: Appointment[],
    preferences: SchedulePreferences
  ): OptimizedSchedule {
    const schedule: OptimizedSchedule = {
      doctorId: doctor.id,
      weekSchedule: {},
      totalAppointments: appointments.length,
      recommendations: []
    };

    // Group appointments by day
    const dailyAppointments = new Map<string, Appointment[]>();
    appointments.forEach(apt => {
      const date = new Date(apt.date).toISOString().split('T')[0];
      if (!dailyAppointments.has(date)) {
        dailyAppointments.set(date, []);
      }
      dailyAppointments.get(date)!.push(apt);
    });

    // Optimize each day
    dailyAppointments.forEach((dayAppointments, date) => {
      const optimizedDay = this.optimizeDailySchedule(dayAppointments, preferences);
      schedule.weekSchedule[date] = optimizedDay;
    });

    // Add general recommendations
    if (appointments.length > 40) {
      schedule.recommendations.push('Schedule is too packed - add buffer time between appointments');
    }

    return schedule;
  }

  /**
   * Calculate specialty utilization for a doctor
   */
  private static calculateSpecialtyUtilization(doctor: Doctor, appointments: Appointment[]): number {
    if (!doctor.specialties || doctor.specialties.length === 0) return 0;

    const specialtyAppointments = appointments.filter(apt =>
      apt.type && doctor.specialties?.includes(apt.type)
    );

    return (specialtyAppointments.length / appointments.length) * 100;
  }

  /**
   * Generate workload recommendations
   */
  private static generateWorkloadRecommendations(hours: number, patients: number): string[] {
    const recommendations: string[] = [];

    if (hours > 50) {
      recommendations.push('Consider reducing workload to prevent burnout');
    }

    if (patients > 100) {
      recommendations.push('Patient load is high - consider scheduling optimization');
    }

    if (hours < 20) {
      recommendations.push('Low utilization - consider expanding availability');
    }

    return recommendations;
  }

  /**
   * Check if condition matches specialization
   */
  private static conditionMatchesSpecialization(condition: string, specialization: string): boolean {
    const conditionLower = condition.toLowerCase();
    const specLower = specialization.toLowerCase();

    // Simple keyword matching
    if (conditionLower.includes(specLower) || specLower.includes(conditionLower)) {
      return true;
    }

    // Common medical condition mappings
    const mappings: Record<string, string[]> = {
      'cardiology': ['heart', 'chest pain', 'arrhythmia', 'hypertension'],
      'dermatology': ['skin', 'rash', 'acne', 'mole'],
      'orthopedics': ['bone', 'joint', 'fracture', 'arthritis'],
      'neurology': ['headache', 'seizure', 'numbness', 'tremor']
    };

    const specMappings = mappings[specLower];
    if (specMappings) {
      return specMappings.some(mapping => conditionLower.includes(mapping));
    }

    return false;
  }

  /**
   * Calculate general match score for non-specialized conditions
   */
  private static calculateGeneralMatchScore(doctor: Doctor, condition: string): number {
    if (doctor.specialties?.includes('general practice') ||
      doctor.specialties?.includes('family medicine')) {
      return 60;
    }

    if (doctor.specialties?.includes('internal medicine')) {
      return 50;
    }

    return 30;
  }

  /**
   * Find alternative specializations for a condition
   */
  private static findAlternativeSpecializations(condition: string): string[] {
    const alternatives: string[] = [];

    if (condition.includes('heart') || condition.includes('chest')) {
      alternatives.push('cardiology');
    }

    if (condition.includes('skin') || condition.includes('rash')) {
      alternatives.push('dermatology');
    }

    if (condition.includes('bone') || condition.includes('joint')) {
      alternatives.push('orthopedics');
    }

    if (condition.includes('headache') || condition.includes('seizure')) {
      alternatives.push('neurology');
    }

    return alternatives;
  }

  /**
   * Optimize daily schedule
   */
  private static optimizeDailySchedule(
    appointments: Appointment[],
    preferences: SchedulePreferences
  ): DailySchedule {
    const sortedAppointments = appointments.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      appointments: sortedAppointments,
      totalDuration: appointments.reduce((sum, apt) => sum + (apt.duration || 30), 0),
      breaks: this.calculateBreaks(sortedAppointments),
      efficiency: this.calculateEfficiency(sortedAppointments)
    };
  }

  /**
   * Calculate breaks between appointments
   */
  private static calculateBreaks(appointments: Appointment[]): Break[] {
    const breaks: Break[] = [];

    for (let i = 0; i < appointments.length - 1; i++) {
      const currentEnd = new Date(appointments[i].date);
      currentEnd.setMinutes(currentEnd.getMinutes() + (appointments[i].duration || 30));

      const nextStart = new Date(appointments[i + 1].date);
      const breakDuration = nextStart.getTime() - currentEnd.getTime();

      if (breakDuration > 0) {
        breaks.push({
          start: currentEnd,
          end: nextStart,
          duration: breakDuration / (1000 * 60) // Convert to minutes
        });
      }
    }

    return breaks;
  }

  /**
   * Calculate schedule efficiency
   */
  private static calculateEfficiency(appointments: Appointment[]): number {
    if (appointments.length === 0) return 100;

    const totalDuration = appointments.reduce((sum, apt) => sum + (apt.duration || 30), 0);
    const totalTime = 8 * 60; // 8 hours in minutes

    return Math.min(100, (totalDuration / totalTime) * 100);
  }
}

// Interfaces
export interface WorkloadAnalysis {
  weeklyPatients: number;
  totalHours: number;
  averageDailyPatients: number;
  peakDay?: { date: string; patients: number };
  utilizationRate: number;
  recommendations: string[];
}

export interface CredentialVerification {
  isValid: boolean;
  issues: string[];
  score: number;
}

export interface SpecializationMatch {
  doctorId: string;
  matchScore: number;
  canHandle: boolean;
  primaryMatch: boolean;
  secondaryMatch: boolean;
  urgency: 'routine' | 'urgent' | 'emergency';
  recommendedAlternatives: string[];
}

export interface SchedulePreferences {
  maxPatientsPerDay?: number;
  preferredStartTime?: string;
  preferredEndTime?: string;
  breakDuration?: number;
}

export interface OptimizedSchedule {
  doctorId: string;
  weekSchedule: Record<string, DailySchedule>;
  totalAppointments: number;
  recommendations: string[];
}

export interface DailySchedule {
  appointments: Appointment[];
  totalDuration: number;
  breaks: Break[];
  efficiency: number;
}

export interface Break {
  start: Date;
  end: Date;
  duration: number; // in minutes
}