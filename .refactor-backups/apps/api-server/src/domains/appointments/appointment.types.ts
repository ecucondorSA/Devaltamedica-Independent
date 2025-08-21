export // Removed local interface - using @altamedica/types
import { Appointment } from '@altamedica/types';;
  reason: string;
  notes?: string;
  symptoms?: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  remindersSent: Date[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentSlot {
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  appointmentId?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  type: Appointment['type'];
  scheduledDateTime: Date;
  duration: number;
  reason: string;
  symptoms?: string[];
  urgency?: Appointment['urgency'];
  location?: Appointment['location'];
}