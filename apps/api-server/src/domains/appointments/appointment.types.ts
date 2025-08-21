export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'consultation' | 'follow-up' | 'telemedicine' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledDateTime: Date;
  duration: number; // in minutes
  location?: {
    type: 'in-person' | 'telemedicine';
    address?: string;
    roomId?: string;
  };
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