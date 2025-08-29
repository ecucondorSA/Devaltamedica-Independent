import { Appointment } from '@altamedica/types';

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